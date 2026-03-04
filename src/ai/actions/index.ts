import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForDB } from '@/lib/formatters';
import type { DashboardContext, ScheduleContext, MemberContext } from '../types';
import { AiActionError } from '../types';

// ─── RBAC helper ───────────────────────────────────────────────

async function assertAccess(
  userId: string,
  minLevel: 'level_1_minimum' | 'level_2_operator' | 'level_3_manager' | 'level_4_master',
): Promise<void> {
  const { data, error } = await supabase.rpc('has_min_access_level', {
    _user_id: userId,
    _min_level: minLevel,
  });
  if (error) throw new AiActionError(`RBAC check failed: ${error.message}`, 'INTERNAL');
  if (!data) throw new AiActionError('Insufficient permissions', 'UNAUTHORIZED');
}

// ─── Schemas ───────────────────────────────────────────────────

const dashboardInputSchema = z.object({
  date: z.date(),
  userId: z.string().uuid(),
});

const scheduleInputSchema = z.object({
  date: z.date(),
  locationId: z.string().uuid().optional(),
  userId: z.string().uuid(),
});

const memberInputSchema = z.object({
  memberId: z.string().uuid(),
  userId: z.string().uuid(),
});

// ─── Actions ───────────────────────────────────────────────────

/**
 * Returns dashboard summary for a given date.
 * Requires level_1_minimum access.
 */
export async function getDashboardContext(input: {
  date: Date;
  userId: string;
}): Promise<DashboardContext> {
  const parsed = dashboardInputSchema.safeParse(input);
  if (!parsed.success) throw new AiActionError(parsed.error.message, 'INVALID_INPUT');

  const { date, userId } = parsed.data;
  await assertAccess(userId, 'level_1_minimum');

  const dateStr = formatDateForDB(date);

  // Parallel queries
  const [checkinsRes, classesRes, riskRes] = await Promise.all([
    supabase
      .from('member_attendance')
      .select('*', { count: 'exact', head: true })
      .gte('check_in_time', `${dateStr}T00:00:00`)
      .lt('check_in_time', `${dateStr}T23:59:59`),
    supabase
      .from('schedule')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_date', dateStr)
      .eq('status', 'scheduled'),
    supabase
      .from('members')
      .select('id, first_name, last_name, member_packages!inner(expiry_date, status)')
      .eq('risk_level', 'high')
      .eq('status', 'active')
      .eq('member_packages.status', 'active')
      .limit(5),
  ]);

  const twoHoursAgo = new Date(date.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const { count: currentlyInClass } = await supabase
    .from('member_attendance')
    .select('*', { count: 'exact', head: true })
    .gte('check_in_time', twoHoursAgo)
    .not('schedule_id', 'is', null);

  const highRiskMembers = (riskRes.data || []).map((m) => {
    const pkgs = m.member_packages as Array<{ expiry_date: string | null }>;
    const nearest = pkgs
      .map((p) => p.expiry_date)
      .filter(Boolean)
      .sort()[0];
    return {
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      expiryDate: nearest || '-',
    };
  });

  return {
    date: dateStr,
    checkinsToday: checkinsRes.count || 0,
    classesToday: classesRes.count || 0,
    currentlyInClass: currentlyInClass || 0,
    highRiskMembers,
  };
}

/**
 * Returns schedule items for a date and optional location.
 * Requires level_1_minimum access.
 */
export async function getScheduleContext(input: {
  date: Date;
  locationId?: string;
  userId: string;
}): Promise<ScheduleContext> {
  const parsed = scheduleInputSchema.safeParse(input);
  if (!parsed.success) throw new AiActionError(parsed.error.message, 'INVALID_INPUT');

  const { date, locationId, userId } = parsed.data;
  await assertAccess(userId, 'level_1_minimum');

  const dateStr = formatDateForDB(date);

  let query = supabase
    .from('schedule')
    .select(`
      id, start_time, end_time, capacity, checked_in, status,
      classes ( name ),
      staff ( first_name, last_name ),
      rooms ( name )
    `)
    .eq('scheduled_date', dateStr)
    .order('start_time');

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw new AiActionError(error.message, 'INTERNAL');

  const items = (data || []).map((row: any) => ({
    id: row.id,
    className: row.classes?.name || 'Unknown',
    trainerName: row.staff ? `${row.staff.first_name} ${row.staff.last_name}` : null,
    roomName: row.rooms?.name || null,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    checkedIn: row.checked_in,
    status: row.status,
  }));

  return { date: dateStr, locationId: locationId || null, items };
}

/**
 * Returns member profile + active packages.
 * Requires level_2_operator access.
 */
export async function getMemberContext(input: {
  memberId: string;
  userId: string;
}): Promise<MemberContext> {
  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) throw new AiActionError(parsed.error.message, 'INVALID_INPUT');

  const { memberId, userId } = parsed.data;
  await assertAccess(userId, 'level_2_operator');

  const { data: member, error } = await supabase
    .from('members')
    .select(`
      id, first_name, last_name, email, phone, status, risk_level, member_since,
      member_packages (
        id, sessions_remaining, expiry_date, status,
        packages ( name_en )
      )
    `)
    .eq('id', memberId)
    .single();

  if (error || !member) throw new AiActionError('Member not found', 'NOT_FOUND');

  const activePackages = ((member.member_packages as any[]) || [])
    .filter((mp: any) => mp.status === 'active')
    .map((mp: any) => ({
      id: mp.id,
      packageName: mp.packages?.name_en || 'Unknown',
      sessionsRemaining: mp.sessions_remaining,
      expiryDate: mp.expiry_date,
      status: mp.status,
    }));

  return {
    id: member.id,
    name: `${member.first_name} ${member.last_name}`,
    email: member.email,
    phone: member.phone,
    status: member.status,
    riskLevel: member.risk_level,
    memberSince: member.member_since,
    activePackages,
  };
}
