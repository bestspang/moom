import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'
import Stripe from 'https://esm.sh/stripe@18.5.0'

// Stripe webhook doesn't need browser CORS, but keep headers for consistency
const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app']

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin.moom.fit',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Fulfill a settled checkout session: mark the transaction paid, create billing +
// entitlement atomically, then fire the purchase gamification event. Shared by
// checkout.session.completed (card) and checkout.session.async_payment_succeeded (async).
async function fulfillCheckoutSession(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const transactionId = session.metadata?.transaction_id
  if (!transactionId) {
    console.warn('[stripe-webhook] No transaction_id in metadata')
    return
  }

  // Idempotency: check if already paid
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, member_id, package_id, package_name_snapshot, amount')
    .eq('id', transactionId)
    .single()

  if (!tx) {
    console.warn(`[stripe-webhook] Transaction ${transactionId} not found`)
    return
  }

  if (tx.status === 'paid') {
    console.log(`[stripe-webhook] Transaction ${transactionId} already paid (idempotent)`)
    return
  }

  // Defense-in-depth: the amount actually charged must match the pending transaction.
  // Checkout charges Math.round(amount * 100) satang, so this is an exact comparison.
  const expectedTotal = Math.round(Number(tx.amount) * 100)
  if (session.amount_total != null && session.amount_total !== expectedTotal) {
    console.error(`[stripe-webhook] Amount mismatch for ${transactionId}: charged ${session.amount_total}, expected ${expectedTotal} — refusing to fulfill`)
    return
  }

  // Resolve package for expiry calculation (needed before atomic RPC)
  let pkg: { term_days?: number | null; expiration_days?: number | null; sessions?: number | null } | null = null
  if (tx.package_id) {
    const { data: pkgData } = await supabase
      .from('packages')
      .select('id, name_en, type, sessions, term_days, expiration_days')
      .eq('id', tx.package_id)
      .single()
    pkg = pkgData
  }

  const now = new Date()
  const expiryDate = pkg ? new Date(now) : null
  if (expiryDate && pkg) expiryDate.setDate(expiryDate.getDate() + (pkg.expiration_days || pkg.term_days || 30))

  // ATOMIC write: update transaction + create billing + create entitlement + activity log in one transaction
  const { error: rpcErr } = await supabase.rpc('process_stripe_payment', {
    p_transaction_id:    tx.id,
    p_stripe_session_id: session.id || session.payment_intent,
    p_package_id:        tx.package_id || null,
    p_member_id:         tx.member_id || null,
    p_amount:            tx.amount,
    p_package_name:      tx.package_name_snapshot || null,
    p_sessions_total:    pkg?.sessions || null,
    p_expiry_date:       expiryDate?.toISOString() || null,
  })
  if (rpcErr) {
    console.error('[stripe-webhook] Atomic write RPC failed:', rpcErr)
    throw rpcErr
  }

  // Fire gamification event for purchase (fire-and-forget)
  if (tx.member_id) {
    try {
      const gamificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-process-event`
      await fetch(gamificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          event_type: 'package_purchase',
          member_id: tx.member_id,
          idempotency_key: `purchase:${tx.id}`,
          metadata: {
            transaction_id: tx.id,
            package_id: tx.package_id,
            package_name: tx.package_name_snapshot,
            amount: tx.amount,
            net_paid: tx.amount,
            term_months: pkg ? Math.ceil((pkg.term_days || 30) / 30) : 1,
            source: 'stripe',
          },
        }),
      })
    } catch (gamErr) {
      console.warn('[stripe-webhook] Gamification event failed (non-blocking):', gamErr)
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify Stripe signature
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-08-27.basil',
    })

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      )
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const eventType = event.type
    console.log(`[stripe-webhook] Received event: ${eventType}`)

    if (eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session

      // Only fulfill once payment has settled. Card payments are already 'paid' on
      // checkout.session.completed; async methods (if enabled) stay 'unpaid' here and
      // settle later via checkout.session.async_payment_succeeded.
      if (session.payment_status && session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        console.log(`[stripe-webhook] Session ${session.id} not settled yet (payment_status=${session.payment_status}); awaiting async settlement`)
        return new Response(JSON.stringify({ received: true, deferred: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await fulfillCheckoutSession(supabase, session)
    } else if (eventType === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null

      // source_ref stores the Checkout Session id (cs_...), but a refund event only
      // carries the PaymentIntent id (pi_...). Resolve the originating session so the
      // transaction can be matched. Also try the PI directly in case source_ref was a PI.
      const candidateRefs: string[] = []
      if (paymentIntentId) {
        candidateRefs.push(paymentIntentId)
        try {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
          const sessionId = sessions.data[0]?.id
          if (sessionId) candidateRefs.push(sessionId)
        } catch (listErr) {
          console.warn('[stripe-webhook] Could not resolve checkout session from payment_intent:', listErr)
        }
      }

      // Find transaction by any resolved reference
      const { data: tx } = candidateRefs.length > 0
        ? await supabase
            .from('transactions')
            .select('id, status, member_id, amount')
            .in('source_ref', candidateRefs)
            .maybeSingle()
        : { data: null }

      if (tx && tx.status !== 'refunded') {
        await supabase
          .from('transactions')
          .update({ status: 'refunded' })
          .eq('id', tx.id)

        // Deactivate member_package
        if (tx.member_id) {
          await supabase
            .from('member_packages')
            .update({ status: 'cancelled' })
            .eq('purchase_transaction_id', tx.id)
            .eq('status', 'active')
        }

        await supabase.from('activity_log').insert({
          event_type: 'stripe.refunded',
          activity: `Stripe refund processed. Amount: ${tx.amount} THB.`,
          entity_type: 'finance_transaction',
          entity_id: tx.id,
          member_id: tx.member_id || null,
          new_value: { status: 'refunded', payment_intent: paymentIntentId },
        })
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[stripe-webhook] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
