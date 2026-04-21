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

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || ''
  const responseOrigin = isAllowedOrigin(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0]
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

    // Service role client for atomic writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // --- ACCESS LEVEL CHECK: require level_3_manager ---
    const { data: accessCheck } = await supabase.rpc('has_min_access_level', {
      _user_id: userId,
      _min_level: 'level_3_manager',
    })
    if (!accessCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    // Parse input
    const { slipId, packageId, note } = await req.json()
    if (!slipId) {
      return new Response(JSON.stringify({ error: 'slipId is required' }), { status: 400, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    // Idempotency check
    const idempotencyKey = `slip:${slipId}`
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, transaction_id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existingTx) {
      return new Response(JSON.stringify({ data: existingTx, message: 'Already processed (idempotent)' }), { status: 200, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    // 1. Fetch slip with relations
    const { data: slip, error: slipErr } = await supabase
      .from('transfer_slips')
      .select(`
        *,
        member:members(id, first_name, last_name, phone, email),
        package:packages(id, name_en, name_th, type, sessions, term_days, expiration_days, price),
        location:locations(id, name)
      `)
      .eq('id', slipId)
      .single()

    if (slipErr || !slip) {
      return new Response(JSON.stringify({ error: 'Slip not found' }), { status: 404, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    if (slip.status !== 'needs_review') {
      return new Response(JSON.stringify({ error: `Slip status is '${slip.status}', expected 'needs_review'` }), { status: 409, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    if (Number(slip.amount_thb) <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be > 0' }), { status: 400, headers: { ...dynamicCors, 'Content-Type': 'application/json' } })
    }

    // 2. Resolve package (override if packageId provided)
    const resolvedPkgId = packageId || slip.package_id
    let pkg = slip.package
    if (resolvedPkgId && resolvedPkgId !== slip.package_id) {
      const { data: p } = await supabase.from('packages').select('id, name_en, name_th, type, sessions, term_days, expiration_days, price').eq('id', resolvedPkgId).single()
      pkg = p
    }

    // 3. Get staff record for the authenticated user
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()

    // 4. Generate transaction number (atomic via DB sequence)
    const { data: txNo } = await supabase.rpc('next_transaction_number')

    // 5. Calculate VAT
    const amountGross = Number(slip.amount_thb)
    const amountExVat = Math.round((amountGross / (1 + VAT_RATE)) * 100) / 100
    const amountVat = Math.round((amountGross - amountExVat) * 100) / 100

    const memberName = slip.member
      ? `${slip.member.first_name} ${slip.member.last_name}`
      : slip.member_name_text || ''

    const memberContact = slip.member?.phone || slip.member_phone_text || slip.member?.email || ''

    const now = new Date()
    const expiryDate = pkg ? new Date(now) : null
    if (expiryDate && pkg) expiryDate.setDate(expiryDate.getDate() + (pkg.expiration_days || pkg.term_days || 30))

    // 6-10. ATOMIC write: all inserts/updates in a single Postgres transaction via RPC
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('process_slip_approval', {
      p_slip_id:                slipId,
      p_transaction_no:         txNo,
      p_amount_gross:           amountGross,
      p_amount_ex_vat:          amountExVat,
      p_amount_vat:             amountVat,
      p_vat_rate:               VAT_RATE,
      p_member_id:              slip.member_id || null,
      p_package_id:             resolvedPkgId || null,
      p_package_name_snapshot:  pkg?.name_en || null,
      p_package_type:           pkg?.type || null,
      p_location_id:            slip.location_id || null,
      p_staff_id:               staffRecord?.id || null,
      p_note:                   note || null,
      p_idempotency_key:        idempotencyKey,
      p_payment_method:         slip.payment_method || 'bank_transfer',
      p_sold_to_name:           memberName || null,
      p_sold_to_contact:        memberContact || null,
      p_sessions_total:         pkg?.sessions || null,
      p_activation_date:        now.toISOString(),
      p_expiry_date:            expiryDate?.toISOString() || null,
    })
    if (rpcErr) throw rpcErr

    const tx = rpcResult

    // 11. Fire gamification event for purchase (fire-and-forget)
    if (slip.member_id) {
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
            member_id: slip.member_id,
            idempotency_key: `purchase:${tx?.transaction_id}`,
            location_id: slip.location_id || undefined,
            metadata: {
              transaction_id: tx?.transaction_id,
              package_id: resolvedPkgId,
              package_name: pkg?.name_en,
              amount: amountGross,
              net_paid: amountGross,
              term_months: Math.ceil((pkg?.term_days || 30) / 30),
            },
          }),
        })
      } catch (gamErr) {
        console.warn('[approve-slip] Gamification event failed (non-blocking):', gamErr)
      }
    }

    return new Response(
      JSON.stringify({ data: tx, message: 'Slip approved successfully' }),
      { status: 200, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('approve-slip error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    )
  }
})
