import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['squad-today-checkins', memberId],
    queryFn: () => fetchTodaySquadCheckins(memberId),
    enabled: !!memberId,
    staleTime: 60_000,
  });

  if (!data || data.total === 0) return null;

  const isSquad = data.type === 'squad';

  let text: string;
  if (isSquad) {
    const displayNames = data.names.slice(0, 3);
    const remaining = data.total - displayNames.length;
    const formatted = formatNameList(displayNames);
    text = remaining > 0
      ? t('member.squadMoreTraining', { names: formatted, more: remaining })
      : t('member.squadTrainingToday', { names: formatted });
  } else {
    text = data.total === 1
      ? t('member.personWorkingOut')
      : t('member.peopleWorkingOut', { count: data.total });
  }

  const Icon = isSquad ? Users : Activity;

  return (
    <div className="mx-6 my-3 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Icon className="h-4 w-4 text-primary" />
        {/* Pulsing live dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
      </div>
      <p className="text-sm text-foreground font-medium leading-snug">{text}</p>
    </div>
  );
}
