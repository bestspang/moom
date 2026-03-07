import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@18.5.0'

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://moom.lovable.app']

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin.moom.fit',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const VAT_RATE = 0.07

Deno.serve(async (req) => {
  // Dynamic CORS based on whitelist
  const reqOrigin = req.headers.get('origin') || ''
  const responseOrigin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0]
  const dynamicCors = { ...corsHeaders, 'Access-Control-Allow-Origin': responseOrigin }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCors })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }
    const userId = claimsData.claims.sub as string

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { member_id, package_id, location_id, nonce } = await req.json()
    if (!member_id || !package_id) {
      return new Response(JSON.stringify({ error: 'member_id and package_id are required' }), { status: 400, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    // Fetch package
    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('id, name_en, name_th, type, price, sessions, term_days, expiration_days')
      .eq('id', package_id)
      .single()

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: 'Package not found' }), { status: 404, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    // Fetch member
    const { data: member } = await supabase
      .from('members')
      .select('id, first_name, last_name, phone, email')
      .eq('id', member_id)
      .single()

    // Get staff
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    // Idempotency key — deterministic (no Date.now())
    const idempotencyKey = nonce
      ? `stripe:${member_id}:${package_id}:${nonce}`
      : `stripe:${member_id}:${package_id}`

    // Check for existing pending transaction with same idempotency key
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, transaction_id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existingTx) {
      return new Response(
        JSON.stringify({ message: 'Already processing (idempotent)', transaction_id: existingTx.id, transaction_no: existingTx.transaction_id }),
        { status: 200, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
      )
    }

    // Generate transaction number via DB sequence-like approach
    const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true })
    const txNo = `T-${String((count || 0) + 1).padStart(7, '0')}`

    // VAT calc
    const amountGross = Number(pkg.price)
    const amountExVat = Math.round((amountGross / (1 + VAT_RATE)) * 100) / 100
    const amountVat = Math.round((amountGross - amountExVat) * 100) / 100

    // Create pending transaction
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        transaction_id: txNo,
        order_name: pkg.name_en,
        amount: amountGross,
        amount_gross: amountGross,
        amount_ex_vat: amountExVat,
        amount_vat: amountVat,
        vat_rate: VAT_RATE,
        currency: 'THB',
        type: pkg.type,
        payment_method: 'card_stripe',
        status: 'pending',
        member_id,
        package_id,
        package_name_snapshot: pkg.name_en,
        location_id: location_id || null,
        staff_id: staffRecord?.id || null,
        source_type: 'stripe',
        source_ref: null,
        idempotency_key: idempotencyKey,
        sold_to_name: member ? `${member.first_name} ${member.last_name}` : null,
        sold_to_contact: member?.phone || member?.email || null,
      })
      .select()
      .single()

    if (txErr) throw txErr

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-08-27.basil',
    })

    // Use whitelisted origin for redirect URLs
    const origin = responseOrigin

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: pkg.name_en,
              description: pkg.name_th || undefined,
            },
            unit_amount: Math.round(amountGross * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        transaction_id: tx.id,
        member_id,
        package_id,
        location_id: location_id || '',
      },
      customer_email: member?.email || undefined,
      success_url: `${origin}/finance?payment=success`,
      cancel_url: `${origin}/finance?payment=cancelled`,
    })

    // Update transaction with Stripe session ID
    await supabase
      .from('transactions')
      .update({ source_ref: session.id })
      .eq('id', tx.id)

    // Activity log
    await supabase.from('activity_log').insert({
      event_type: 'stripe.checkout_created',
      activity: `Stripe checkout created for ${pkg.name_en}. Transaction ${txNo}. Amount: ${amountGross} THB.`,
      entity_type: 'finance_transaction',
      entity_id: tx.id,
      staff_id: staffRecord?.id || null,
      member_id,
      new_value: { transaction_id: tx.id, transaction_no: txNo, package_id, amount: amountGross, status: 'pending', stripe_session_id: session.id },
    })

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        transaction_id: tx.id,
        transaction_no: txNo,
      }),
      { status: 200, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('stripe-create-checkout error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
