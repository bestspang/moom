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
  // Get member's own squad (own-scoped read)
  const { data: membership } = await supabase
    .from('squad_memberships')
    .select('squad_id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (membership?.squad_id) {
    // Squadmate names via the directory view (member_attendance/members are own+staff
    // only under RLS now, so cross-member reads go through SECURITY DEFINER helpers).
    const { data: squadMembers } = await supabase
      .from('squad_memberships')
      .select('member_id, member:member_directory(first_name)')
      .eq('squad_id', membership.squad_id)
      .neq('member_id', memberId);

    if (squadMembers?.length) {
      // Which of MY squadmates checked in today — computed server-side (Bangkok day).
      const { data: checkins } = await (
        supabase.rpc as unknown as (name: string) => Promise<{ data: Array<{ member_id: string }> | null; error: unknown }>
      )('get_squad_checkins_today');
      const checkedInSet = new Set((checkins ?? []).map((c) => c.member_id));

      const checkedInMembers = squadMembers
        .filter((m: any) => checkedInSet.has(m.member_id))
        .map((m: any) => m.member?.first_name ?? 'Someone');

      if (checkedInMembers.length > 0) {
        return { type: 'squad' as const, names: checkedInMembers, total: checkedInMembers.length };
      }
    }
  }

  // Fallback: total gym activity today (server-side count; Bangkok day).
  const { data: gymTotal } = await (
    supabase.rpc as unknown as (name: string) => Promise<{ data: number | null; error: unknown }>
  )('get_gym_checkin_count_today');

  return { type: 'gym' as const, names: [], total: gymTotal ?? 0 };
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
