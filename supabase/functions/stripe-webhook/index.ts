import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // --- STRIPE SIGNATURE VERIFICATION STUB ---
    // When STRIPE_WEBHOOK_SECRET is configured:
    //
    // import Stripe from 'https://esm.sh/stripe@14'
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
    // const signature = req.headers.get('stripe-signature')!
    // const body = await req.text()
    // const event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
    //
    // For now, parse body as JSON (development only):
    const body = await req.text()
    const event = JSON.parse(body)

    const eventType = event.type as string
    console.log(`[stripe-webhook] Received event: ${eventType}`)

    if (eventType === 'checkout.session.completed') {
      const session = event.data.object
      const transactionId = session.metadata?.transaction_id

      if (!transactionId) {
        console.warn('[stripe-webhook] No transaction_id in metadata')
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Idempotency: check if already paid
      const { data: tx } = await supabase
        .from('transactions')
        .select('id, status, member_id, package_id, package_name_snapshot, amount')
        .eq('id', transactionId)
        .single()

      if (!tx) {
        console.warn(`[stripe-webhook] Transaction ${transactionId} not found`)
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (tx.status === 'paid') {
        console.log(`[stripe-webhook] Transaction ${transactionId} already paid (idempotent)`)
        return new Response(JSON.stringify({ received: true, idempotent: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Update transaction to paid
      await supabase
        .from('transactions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          source_ref: session.id || session.payment_intent,
        })
        .eq('id', transactionId)

      // Create member_billing
      if (tx.member_id) {
        await supabase.from('member_billing').insert({
          member_id: tx.member_id,
          transaction_id: tx.id,
          amount: tx.amount,
          description: `Payment: ${tx.package_name_snapshot || 'Stripe Payment'}`,
        })
      }

      // Create member_package entitlement
      if (tx.member_id && tx.package_id) {
        const { data: pkg } = await supabase
          .from('packages')
          .select('id, name_en, type, sessions, term_days, expiration_days')
          .eq('id', tx.package_id)
          .single()

        if (pkg) {
          const now = new Date()
          const expiryDate = new Date(now)
          expiryDate.setDate(expiryDate.getDate() + (pkg.expiration_days || pkg.term_days || 30))

          await supabase.from('member_packages').insert({
            member_id: tx.member_id,
            package_id: tx.package_id,
            purchase_date: now.toISOString(),
            activation_date: now.toISOString(),
            expiry_date: expiryDate.toISOString(),
            sessions_remaining: pkg.sessions || null,
            sessions_used: 0,
            sessions_total: pkg.sessions || null,
            status: 'active',
            purchase_transaction_id: tx.id,
            package_name_snapshot: pkg.name_en || null,
          })
        }
      }

      // Activity log
      await supabase.from('activity_log').insert({
        event_type: 'stripe.payment_succeeded',
        activity: `Stripe payment succeeded. Amount: ${tx.amount} THB. Package: ${tx.package_name_snapshot || 'N/A'}.`,
        entity_type: 'finance_transaction',
        entity_id: tx.id,
        member_id: tx.member_id || null,
        new_value: { status: 'paid', stripe_session_id: session.id, amount: tx.amount },
      })
    } else if (eventType === 'charge.refunded') {
      const charge = event.data.object
      const paymentIntentId = charge.payment_intent

      // Find transaction by source_ref
      const { data: tx } = await supabase
        .from('transactions')
        .select('id, status, member_id, amount')
        .eq('source_ref', paymentIntentId)
        .maybeSingle()

      if (tx && tx.status !== 'refunded') {
        await supabase
          .from('transactions')
          .update({ status: 'refunded' })
          .eq('id', tx.id)

        // Optionally deactivate member_package
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
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
