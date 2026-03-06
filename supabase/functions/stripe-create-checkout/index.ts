import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const VAT_RATE = 0.07

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claimsData.claims.sub as string

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { member_id, package_id, location_id } = await req.json()
    if (!member_id || !package_id) {
      return new Response(JSON.stringify({ error: 'member_id and package_id are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch package
    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('id, name_en, name_th, type, price, sessions, term_days, expiration_days')
      .eq('id', package_id)
      .single()

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: 'Package not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    // Generate idempotency key
    const idempotencyKey = `stripe:${member_id}:${package_id}:${Date.now()}`

    // Generate transaction number
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
        source_ref: null, // Will be updated with checkout session ID
        idempotency_key: idempotencyKey,
        sold_to_name: member ? `${member.first_name} ${member.last_name}` : null,
        sold_to_contact: member?.phone || member?.email || null,
      })
      .select()
      .single()

    if (txErr) throw txErr

    // --- STRIPE STUB ---
    // When STRIPE_SECRET_KEY is configured, this section will:
    // 1. Create a Stripe Checkout Session with line items
    // 2. Set metadata.transaction_id = tx.id
    // 3. Update tx.source_ref = checkout_session.id
    // 4. Return checkout_session.url
    //
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'payment',
    //   line_items: [{ price_data: { currency: 'thb', product_data: { name: pkg.name_en }, unit_amount: amountGross * 100 }, quantity: 1 }],
    //   metadata: { transaction_id: tx.id, member_id, package_id },
    //   success_url: `${Deno.env.get('APP_URL')}/finance?payment=success`,
    //   cancel_url: `${Deno.env.get('APP_URL')}/finance?payment=cancelled`,
    // })
    // await supabase.from('transactions').update({ source_ref: session.id }).eq('id', tx.id)
    // return new Response(JSON.stringify({ checkout_url: session.url, transaction_id: tx.id }), ...)

    // Activity log
    await supabase.from('activity_log').insert({
      event_type: 'stripe.checkout_created',
      activity: `Stripe checkout created for ${pkg.name_en}. Transaction ${txNo}. Amount: ${amountGross} THB.`,
      entity_type: 'finance_transaction',
      entity_id: tx.id,
      staff_id: staffRecord?.id || null,
      member_id,
      new_value: { transaction_id: tx.id, transaction_no: txNo, package_id, amount: amountGross, status: 'pending' },
    })

    return new Response(
      JSON.stringify({
        transaction_id: tx.id,
        transaction_no: txNo,
        message: 'Stripe checkout stub — configure STRIPE_SECRET_KEY to enable live payments',
        // checkout_url: session.url // uncomment when Stripe is live
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('stripe-create-checkout error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
