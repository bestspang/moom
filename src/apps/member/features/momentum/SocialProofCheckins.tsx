import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface SocialProofCheckinsProps {
  memberId: string;
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

async function fetchTodaySquadCheckins(memberId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get member's squad
  const { data: membership } = await supabase
    .from('squad_memberships')
    .select('squad_id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (membership?.squad_id) {
    // Get squad member IDs
    const { data: squadMembers } = await supabase
      .from('squad_memberships')
      .select('member_id, member:members(first_name)')
      .eq('squad_id', membership.squad_id)
      .neq('member_id', memberId);

    if (squadMembers?.length) {
      const memberIds = squadMembers.map((m: any) => m.member_id);

      const { data: checkins } = await supabase
        .from('member_attendance')
        .select('member_id')
        .in('member_id', memberIds)
        .gte('check_in_time', todayStart.toISOString());

      const checkedInSet = new Set((checkins ?? []).map((c: any) => c.member_id));

      const checkedInMembers = squadMembers
        .filter((m: any) => checkedInSet.has(m.member_id))
        .map((m: any) => m.member?.first_name ?? 'Someone');

      if (checkedInMembers.length > 0) {
        return { type: 'squad' as const, names: checkedInMembers, total: checkedInMembers.length };
      }
    }
  }

  // Fallback: show total gym activity today
  const { count } = await supabase
    .from('member_attendance')
    .select('id', { count: 'exact', head: true })
    .gte('check_in_time', todayStart.toISOString());

  return { type: 'gym' as const, names: [], total: count ?? 0 };
}

export function SocialProofCheckins({ memberId }: SocialProofCheckinsProps) {
  const { data } = useQuery({
    queryKey: ['squad-today-checkins', memberId],
    queryFn: () => fetchTodaySquadCheckins(memberId),
    enabled: !!memberId,
    staleTime: 60_000,
  });

  if (!data || data.total === 0) return null;

  let text: string;
  if (data.type === 'squad') {
    const displayNames = data.names.slice(0, 3);
    const remaining = data.total - displayNames.length;
    const formatted = formatNameList(displayNames);
    text = remaining > 0
      ? `${formatted} +${remaining} more also training today!`
      : `${formatted} also training today!`;
  } else {
    text = `${data.total} ${data.total === 1 ? 'person' : 'people'} working out today! 💪`;
  }

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-t border-border">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{text}</p>
    </div>
  );
}
