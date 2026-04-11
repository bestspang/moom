import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app']

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin.moom.fit',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const VAT_RATE = 0.07

type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'qr_promptpay'

const ALLOWED_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'credit_card', 'qr_promptpay']

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || ''
  const responseOrigin = isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0]
  const dynamicCors = { ...corsHeaders, 'Access-Control-Allow-Origin': responseOrigin }
  const jsonHeaders = { ...dynamicCors, 'Content-Type': 'application/json' }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCors })
  }

  try {
    // --- Auth ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders })
    }
    const userId = claimsData.claims.sub as string

    // Service-role client for writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // --- Access level: level_2_operator+ can sell packages ---
    const { data: accessCheck } = await supabase.rpc('has_min_access_level', {
      _user_id: userId,
      _min_level: 'level_2_operator',
    })
    if (!accessCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: jsonHeaders })
    }

    // --- Parse + validate input ---
    const body = await req.json().catch(() => null) as {
      memberId?: string
      packageId?: string
      paymentMethod?: string
      locationId?: string
      notes?: string
      promotionId?: string
      promotionDiscount?: number
      couponWalletId?: string
      couponDiscount?: number
      manualDiscount?: number
      idempotencyKey?: string
    } | null

    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: jsonHeaders })
    }

    const {
      memberId,
      packageId,
      paymentMethod,
      locationId,
      notes,
      promotionId,
      couponWalletId,
      manualDiscount: rawManualDiscount,
      idempotencyKey,
    } = body

    if (!memberId || !packageId || !paymentMethod || !idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'memberId, packageId, paymentMethod, idempotencyKey are required' }),
        { status: 400, headers: jsonHeaders }
      )
    }

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      return new Response(
        JSON.stringify({ error: `paymentMethod must be one of ${ALLOWED_PAYMENT_METHODS.join(', ')}` }),
        { status: 400, headers: jsonHeaders }
      )
    }

    const manualDiscount = Math.max(0, Number(rawManualDiscount) || 0)

    // --- Idempotency check: if this key already produced a transaction, return it ---
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, transaction_id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existingTx) {
      return new Response(
        JSON.stringify({
          data: { transaction_id: existingTx.id, transaction_no: existingTx.transaction_id },
          message: 'Already processed (idempotent)',
        }),
        { status: 200, headers: jsonHeaders }
      )
    }

    // --- Load member ---
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, first_name, last_name, phone, email')
      .eq('id', memberId)
      .maybeSingle()
    if (memberErr) throw memberErr
    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: jsonHeaders })
    }

    // --- Load package (re-read price and entitlement info server-side; never trust client) ---
    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('id, name_en, name_th, type, price, sessions, term_days, expiration_days, status')
      .eq('id', packageId)
      .maybeSingle()
    if (pkgErr) throw pkgErr
    if (!pkg) {
      return new Response(JSON.stringify({ error: 'Package not found' }), { status: 404, headers: jsonHeaders })
    }
    if (pkg.status && pkg.status !== 'on_sale') {
      return new Response(
        JSON.stringify({ error: `Package is not on sale (status: ${pkg.status})` }),
        { status: 400, headers: jsonHeaders }
      )
    }

    const originalPrice = Number(pkg.price) || 0
    if (originalPrice < 0) {
      return new Response(JSON.stringify({ error: 'Package price is invalid' }), { status: 400, headers: jsonHeaders })
    }

    // --- Validate promotion server-side ---
    let promoDiscount = 0
    let promotion: { id: string; status: string | null; usage_count: number | null; discount_type: string | null; percentage_discount: number | null; flat_rate_discount: number | null; discount_value: number | null; max_redemption_value: number | null } | null = null

    if (promotionId) {
      const { data: p, error: pErr } = await supabase
        .from('promotions')
        .select('id, status, usage_count, discount_type, percentage_discount, flat_rate_discount, discount_value, max_redemption_value')
        .eq('id', promotionId)
        .maybeSingle()
      if (pErr) throw pErr
      if (!p || p.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Promotion is not active' }), { status: 400, headers: jsonHeaders })
      }
      promotion = p

      if (p.discount_type === 'percentage') {
        const pct = Number(p.percentage_discount ?? p.discount_value ?? 0)
        const raw = Math.round((originalPrice * pct) / 100)
        const max = Number(p.max_redemption_value ?? 0)
        promoDiscount = max > 0 ? Math.min(raw, max) : raw
      } else {
        promoDiscount = Number(p.flat_rate_discount ?? p.discount_value ?? 0)
      }
      promoDiscount = Math.max(0, promoDiscount)
    }

    // --- Validate coupon server-side ---
    let couponDiscount = 0
    let couponWallet: { id: string; status: string | null; expires_at: string | null; member_id: string } | null = null

    if (couponWalletId) {
      const { data: cw, error: cwErr } = await supabase
        .from('coupon_wallet')
        .select('id, member_id, status, expires_at, coupon_template:coupon_templates(discount_type, discount_value, max_discount)')
        .eq('id', couponWalletId)
        .maybeSingle()
      if (cwErr) throw cwErr
      if (!cw) {
        return new Response(JSON.stringify({ error: 'Coupon not found' }), { status: 400, headers: jsonHeaders })
      }
      if (cw.member_id !== memberId) {
        return new Response(JSON.stringify({ error: 'Coupon does not belong to this member' }), { status: 400, headers: jsonHeaders })
      }
      if (cw.status !== 'active') {
        return new Response(JSON.stringify({ error: `Coupon is not active (status: ${cw.status})` }), { status: 400, headers: jsonHeaders })
      }
      if (cw.expires_at && new Date(cw.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: 'Coupon has expired' }), { status: 400, headers: jsonHeaders })
      }
      couponWallet = { id: cw.id, member_id: cw.member_id, status: cw.status, expires_at: cw.expires_at }

      const template = (cw as unknown as { coupon_template: { discount_type: string | null; discount_value: number | null; max_discount: number | null } | null }).coupon_template
      if (template) {
        if (template.discount_type === 'percentage') {
          const raw = Math.round((originalPrice * Number(template.discount_value || 0)) / 100)
          const max = Number(template.max_discount || 0)
          couponDiscount = max > 0 ? Math.min(raw, max) : raw
        } else {
          couponDiscount = Number(template.discount_value || 0)
        }
      }
      couponDiscount = Math.max(0, couponDiscount)
    }

    // --- Compute totals server-side ---
    const totalDiscount = Math.min(promoDiscount + couponDiscount + manualDiscount, originalPrice)
    const netPrice = Math.max(0, originalPrice - totalDiscount)
    const amountExVat = Math.round((netPrice / (1 + VAT_RATE)) * 100) / 100
    const amountVat = Math.round((netPrice - amountExVat) * 100) / 100

    // --- Resolve staff for audit trail ---
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()

    // --- Generate transaction number ---
    const { data: txNo, error: txNoErr } = await supabase.rpc('next_transaction_number')
    if (txNoErr) throw txNoErr

    const memberName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
    const memberContact = member.phone || member.email || null

    // --- 1. Insert transaction ---
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        transaction_id: txNo,
        order_name: `Purchase: ${pkg.name_en}`,
        amount: netPrice,
        amount_gross: netPrice,
        amount_ex_vat: amountExVat,
        amount_vat: amountVat,
        vat_rate: VAT_RATE,
        currency: 'THB',
        type: pkg.type,
        payment_method: paymentMethod,
        status: 'paid',
        paid_at: new Date().toISOString(),
        member_id: memberId,
        package_id: packageId,
        package_name_snapshot: pkg.name_en,
        location_id: locationId || null,
        staff_id: staffRecord?.id || null,
        notes: notes || null,
        source_type: 'pos',
        source_ref: memberId,
        idempotency_key: idempotencyKey,
        discount_amount: totalDiscount,
        sold_to_name: memberName || null,
        sold_to_contact: memberContact,
      })
      .select('id, transaction_id')
      .single()
    if (txErr) throw txErr

    // --- 2. Insert member_packages as ACTIVE with activation + expiry dates ---
    const now = new Date()
    const daysToAdd = Number(pkg.expiration_days ?? pkg.term_days ?? 30)
    const expiryDate = new Date(now)
    expiryDate.setDate(expiryDate.getDate() + daysToAdd)

    const { error: mpErr } = await supabase
      .from('member_packages')
      .insert({
        member_id: memberId,
        package_id: packageId,
        package_name_snapshot: pkg.name_en,
        purchase_date: now.toISOString(),
        activation_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        sessions_total: pkg.sessions ?? null,
        sessions_remaining: pkg.sessions ?? null,
        sessions_used: 0,
        status: 'active',
        purchase_transaction_id: tx.id,
      })
    if (mpErr) throw mpErr

    // --- 3. Insert member_billing ---
    const { error: mbErr } = await supabase
      .from('member_billing')
      .insert({
        member_id: memberId,
        transaction_id: tx.id,
        amount: netPrice,
        description: `Purchase: ${pkg.name_en}`,
      })
    if (mbErr) throw mbErr

    // --- 4. Record promotion redemption + bump usage_count ---
    if (promotion && promoDiscount > 0) {
      const { error: prErr } = await supabase
        .from('promotion_redemptions')
        .insert({
          promotion_id: promotion.id,
          member_id: memberId,
          transaction_id: tx.id,
          discount_amount: promoDiscount,
          gross_amount: originalPrice,
          net_amount: netPrice,
        })
      if (prErr) throw prErr

      const { error: bumpErr } = await supabase
        .from('promotions')
        .update({ usage_count: (promotion.usage_count || 0) + 1 })
        .eq('id', promotion.id)
      if (bumpErr) throw bumpErr
    }

    // --- 5. Mark coupon as used ---
    if (couponWallet && couponDiscount > 0) {
      const { error: cuErr } = await supabase
        .from('coupon_wallet')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('id', couponWallet.id)
      if (cuErr) throw cuErr
    }

    // --- 6. Activity log ---
    const { error: alErr } = await supabase
      .from('activity_log')
      .insert({
        event_type: 'package_sold',
        activity: `Package "${pkg.name_en}" sold to ${memberName || memberId} (${txNo}). Amount: ${netPrice} THB.`,
        entity_type: 'member',
        entity_id: memberId,
        staff_id: staffRecord?.id || null,
        member_id: memberId,
        new_value: {
          transaction_id: tx.id,
          transaction_no: txNo,
          package_id: packageId,
          package_name: pkg.name_en,
          amount: netPrice,
          amount_gross: netPrice,
          amount_ex_vat: amountExVat,
          amount_vat: amountVat,
          discount_amount: totalDiscount,
          payment_method: paymentMethod,
          promotion_id: promotion?.id ?? null,
          coupon_wallet_id: couponWallet?.id ?? null,
        },
      })
    if (alErr) throw alErr

    // --- 7. Fire-and-forget gamification event ---
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
          member_id: memberId,
          idempotency_key: `purchase:${tx.id}`,
          location_id: locationId || undefined,
          metadata: {
            transaction_id: tx.id,
            package_id: packageId,
            package_name: pkg.name_en,
            amount: netPrice,
            net_paid: netPrice,
            term_months: Math.ceil((Number(pkg.term_days) || 30) / 30),
          },
        }),
      })
    } catch (gamErr) {
      console.warn('[sell-package] Gamification event failed (non-blocking):', gamErr)
    }

    return new Response(
      JSON.stringify({
        data: {
          transaction_id: tx.id,
          transaction_no: txNo,
          amount: netPrice,
          amount_ex_vat: amountExVat,
          amount_vat: amountVat,
          discount_amount: totalDiscount,
          expiry_date: expiryDate.toISOString(),
        },
        message: 'Package sold successfully',
      }),
      { status: 200, headers: jsonHeaders }
    )
  } catch (err) {
    console.error('sell-package error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    )
  }
})
