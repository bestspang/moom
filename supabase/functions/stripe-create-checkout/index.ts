import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'
import Stripe from 'https://esm.sh/stripe@18.5.0'

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app']

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin.moom.fit',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const VAT_RATE = 0.07
const ALLOWED_PAYMENT_METHODS = ['card', 'promptpay'] as const
type PaymentMethod = typeof ALLOWED_PAYMENT_METHODS[number]

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || ''
  const responseOrigin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0]
  const dynamicCors = { ...corsHeaders, 'Access-Control-Allow-Origin': responseOrigin }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCors })
  }

  try {
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

    const body = await req.json().catch(() => ({}))
    const { member_id, package_id, location_id, nonce, payment_method_types, surface } = body ?? {}

    if (!member_id || !package_id) {
      return new Response(JSON.stringify({ error: 'member_id and package_id are required' }), { status: 400, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    const isMemberSurface = surface === 'member'

    // Validate payment_method_types
    let pmTypes: PaymentMethod[] = ['card']
    if (Array.isArray(payment_method_types) && payment_method_types.length > 0) {
      const invalid = payment_method_types.filter((m: string) => !ALLOWED_PAYMENT_METHODS.includes(m as PaymentMethod))
      if (invalid.length > 0) {
        return new Response(JSON.stringify({ error: `Unsupported payment_method_types: ${invalid.join(',')}` }), { status: 400, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
      }
      pmTypes = payment_method_types as PaymentMethod[]
    }

    // Authorization split
    let staffRecordId: string | null = null
    if (isMemberSurface) {
      // Caller must own the member_id (via identity_map or line_users)
      const { data: identity } = await supabase
        .from('identity_map')
        .select('admin_entity_id')
        .eq('experience_user_id', userId)
        .eq('entity_type', 'member')
        .eq('is_verified', true)
        .maybeSingle()

      let resolvedMemberId: string | null = identity?.admin_entity_id ?? null
      if (!resolvedMemberId) {
        const { data: lineUser } = await supabase
          .from('line_users')
          .select('member_id')
          .eq('user_id', userId)
          .maybeSingle()
        resolvedMemberId = lineUser?.member_id ?? null
      }

      if (!resolvedMemberId || resolvedMemberId !== member_id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
      }
    } else {
      const { data: accessCheck } = await supabase.rpc('has_min_access_level', {
        _user_id: userId,
        _min_level: 'level_3_manager',
      })
      if (!accessCheck) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
      }
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      staffRecordId = staffRecord?.id ?? null
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

    // Idempotency key
    const idempotencyKey = nonce
      ? `stripe:${member_id}:${package_id}:${nonce}`
      : `stripe:${member_id}:${package_id}`

    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, transaction_id, source_ref')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existingTx) {
      return new Response(
        JSON.stringify({ message: 'Already processing (idempotent)', transaction_id: existingTx.id, transaction_no: existingTx.transaction_id }),
        { status: 200, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
      )
    }

    const { data: txNo } = await supabase.rpc('next_transaction_number')

    const amountGross = Number(pkg.price)
    const amountExVat = Math.round((amountGross / (1 + VAT_RATE)) * 100) / 100
    const amountVat = Math.round((amountGross - amountExVat) * 100) / 100

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
        payment_method: pmTypes.includes('promptpay') && !pmTypes.includes('card') ? 'promptpay_stripe' : 'card_stripe',
        status: 'pending',
        member_id,
        package_id,
        package_name_snapshot: pkg.name_en,
        location_id: location_id || null,
        staff_id: staffRecordId,
        source_type: isMemberSurface ? 'stripe_member' : 'stripe',
        source_ref: null,
        idempotency_key: idempotencyKey,
        sold_to_name: member ? `${member.first_name} ${member.last_name}` : null,
        sold_to_contact: member?.phone || member?.email || null,
      })
      .select()
      .single()

    if (txErr) throw txErr

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-08-27.basil',
    })

    // Build success/cancel URLs based on surface
    let redirectBase = responseOrigin
    let successPath = '/finance?payment=success'
    let cancelPath = '/finance?payment=cancelled'
    if (isMemberSurface) {
      // Ensure we redirect to the member host (swap admin.moom.fit → member.moom.fit).
      // For preview/lovable.app, keep the requesting origin (SPA handles /member/*).
      if (responseOrigin === 'https://admin.moom.fit') {
        redirectBase = 'https://member.moom.fit'
      }
      successPath = `/member/packages/${package_id}/purchase?payment=success`
      cancelPath = `/member/packages/${package_id}/purchase?payment=cancelled`
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: pmTypes,
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
        surface: isMemberSurface ? 'member' : 'admin',
      },
      customer_email: member?.email || undefined,
      success_url: `${redirectBase}${successPath}`,
      cancel_url: `${redirectBase}${cancelPath}`,
    })

    await supabase
      .from('transactions')
      .update({ source_ref: session.id })
      .eq('id', tx.id)

    await supabase.from('activity_log').insert({
      event_type: isMemberSurface ? 'member.stripe_checkout_created' : 'stripe.checkout_created',
      activity: `Stripe checkout created for ${pkg.name_en}. Transaction ${txNo}. Amount: ${amountGross} THB. Methods: ${pmTypes.join(',')}.`,
      entity_type: 'finance_transaction',
      entity_id: tx.id,
      staff_id: staffRecordId,
      member_id,
      new_value: { transaction_id: tx.id, transaction_no: txNo, package_id, amount: amountGross, status: 'pending', stripe_session_id: session.id, surface: isMemberSurface ? 'member' : 'admin', payment_method_types: pmTypes },
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    )
  }
})
