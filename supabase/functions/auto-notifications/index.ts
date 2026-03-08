import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://admin.moom.fit', 'https://member.moom.fit', 'https://moom.lovable.app'];

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || '';
  const responseOrigin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
  const dynamicCors = { ...corsHeaders, 'Access-Control-Allow-Origin': responseOrigin };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCors });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in3Days = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

    const notifications: Array<{
      title: string;
      message: string;
      type: string;
      entity_type?: string;
      entity_id?: string;
    }> = [];

    // 1. Packages expiring within 7 days
    const { data: expiringPkgs } = await supabase
      .from('member_packages')
      .select('id, member_id, package_name_snapshot, expiry_date, members(first_name, last_name)')
      .in('status', ['active', 'ready_to_use'])
      .lte('expiry_date', in7Days)
      .gte('expiry_date', today);

    (expiringPkgs || []).forEach((pkg: any) => {
      const memberName = pkg.members ? `${pkg.members.first_name} ${pkg.members.last_name}` : 'Unknown';
      const urgency = pkg.expiry_date <= in3Days ? '⚠️' : '📋';
      notifications.push({
        title: `${urgency} Package Expiring`,
        message: `${memberName}'s package "${pkg.package_name_snapshot || 'Package'}" expires on ${pkg.expiry_date}`,
        type: 'package_expiring',
        entity_type: 'member_package',
        entity_id: pkg.id,
      });
    });

    // 2. Leads not contacted in 5+ days
    const { data: staleLeads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, last_contacted')
      .in('status', ['new', 'contacted', 'interested'])
      .or(`last_contacted.is.null,last_contacted.lt.${fiveDaysAgo}`);

    (staleLeads || []).forEach((lead: any) => {
      notifications.push({
        title: '📞 Lead needs follow-up',
        message: `${lead.first_name} ${lead.last_name || ''} hasn't been contacted in 5+ days`,
        type: 'lead_stale',
        entity_type: 'lead',
        entity_id: lead.id,
      });
    });

    // 3. Members inactive for 14+ days
    const { data: activeMembers } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('status', 'active');

    if (activeMembers && activeMembers.length > 0) {
      const memberIds = activeMembers.map((m: any) => m.id);

      // Get last check-in for each
      const { data: recentCheckins } = await supabase
        .from('member_attendance')
        .select('member_id, check_in_time')
        .in('member_id', memberIds.slice(0, 500))
        .gte('check_in_time', fourteenDaysAgo);

      const activeSet = new Set((recentCheckins || []).map((c: any) => c.member_id));

      activeMembers.forEach((member: any) => {
        if (!activeSet.has(member.id)) {
          notifications.push({
            title: '🔴 Inactive member',
            message: `${member.first_name} ${member.last_name} hasn't visited in 14+ days`,
            type: 'member_inactive',
            entity_type: 'member',
            entity_id: member.id,
          });
        }
      });
    }

    // 4. Pending transfer slips
    const { data: pendingSlips } = await supabase
      .from('transfer_slips')
      .select('id, amount_thb, member_name_text')
      .eq('status', 'needs_review');

    (pendingSlips || []).forEach((slip: any) => {
      notifications.push({
        title: '💰 Slip pending review',
        message: `Transfer slip from ${slip.member_name_text || 'Unknown'} (${slip.amount_thb} THB) needs review`,
        type: 'slip_pending',
        entity_type: 'transfer_slip',
        entity_id: slip.id,
      });
    });

    // Insert into event_outbox (batch)
    if (notifications.length > 0) {
      const events = notifications.map((n) => ({
        event_type: `auto_notification.${n.type}`,
        payload: {
          title: n.title,
          message: n.message,
          entity_type: n.entity_type,
          entity_id: n.entity_id,
        },
        status: 'pending' as const,
      }));

      await supabase.from('event_outbox').insert(events);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        generated: notifications.length,
        breakdown: {
          expiring_packages: (expiringPkgs || []).length,
          stale_leads: (staleLeads || []).length,
          inactive_members: notifications.filter((n) => n.type === 'member_inactive').length,
          pending_slips: (pendingSlips || []).length,
        },
      }),
      { headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal error' }),
      { status: 500, headers: { ...dynamicCors, 'Content-Type': 'application/json' } }
    );
  }
});
