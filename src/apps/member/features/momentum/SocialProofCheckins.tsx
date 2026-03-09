import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface SocialProofCheckinsProps {
  memberId: string;
}

async function fetchTodaySquadCheckins(memberId: string) {
  // Get member's squad
  const { data: membership } = await supabase
    .from('squad_memberships')
    .select('squad_id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (!membership?.squad_id) return { squadMembers: [], totalToday: 0 };

  // Get squad member IDs
  const { data: squadMembers } = await supabase
    .from('squad_memberships')
    .select('member_id, member:members(first_name)')
    .eq('squad_id', membership.squad_id)
    .neq('member_id', memberId);

  if (!squadMembers?.length) return { squadMembers: [], totalToday: 0 };

  const memberIds = squadMembers.map((m: any) => m.member_id);

  // Check today's attendance
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: checkins } = await supabase
    .from('member_attendance')
    .select('member_id')
    .in('member_id', memberIds)
    .gte('check_in_time', todayStart.toISOString());

  const checkedInSet = new Set((checkins ?? []).map((c: any) => c.member_id));

  const checkedInMembers = squadMembers
    .filter((m: any) => checkedInSet.has(m.member_id))
    .map((m: any) => m.member?.first_name ?? 'Someone');

  return {
    squadMembers: checkedInMembers,
    totalToday: checkedInMembers.length,
  };
}

export function SocialProofCheckins({ memberId }: SocialProofCheckinsProps) {
  const { data } = useQuery({
    queryKey: ['squad-today-checkins', memberId],
    queryFn: () => fetchTodaySquadCheckins(memberId),
    enabled: !!memberId,
    staleTime: 60_000,
  });

  if (!data || data.totalToday === 0) return null;

  const names = data.squadMembers.slice(0, 3);
  const remaining = data.totalToday - names.length;
  const text = remaining > 0
    ? `${names.join(', ')} +${remaining} more also training today!`
    : `${names.join(' & ')} also training today!`;

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-t border-border">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{text}</p>
    </div>
  );
}
