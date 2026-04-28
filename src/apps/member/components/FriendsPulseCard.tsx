/**
 * FriendsPulseCard — V2 redesign: colored avatar stack + bold title.
 *
 * Reuses existing fetchers:
 *   - fetchMySquad(memberId)              → resolve squadId
 *   - fetchSquadActivityFeed(squadId)     → recent entries
 *
 * Hidden when:
 *   - member is not in a squad
 *   - feed is empty
 *
 * Tap navigates to /member/squad.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchMySquad, fetchSquadActivityFeed } from '../features/momentum/api';

interface FriendsPulseCardProps {
  memberId: string;
}

// Stable color per member id (HSL hue from simple hash)
function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 55%)`;
}

export function FriendsPulseCard({ memberId }: FriendsPulseCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: squad } = useQuery({
    queryKey: ['member-my-squad', memberId],
    queryFn: () => fetchMySquad(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000,
  });

  const squadId = squad?.id ?? null;

  const { data: feed } = useQuery({
    queryKey: ['member-squad-pulse', squadId],
    queryFn: () => fetchSquadActivityFeed(squadId!, 10),
    enabled: !!squadId,
    staleTime: 60 * 1000,
  });

  if (!squad || !feed || feed.length === 0) return null;

  // Distinct members (max 4 avatars)
  const seen = new Set<string>();
  const movers: { id: string; initial: string }[] = [];
  for (const row of feed) {
    const id = (row as any).member_id ?? (row as any).memberId ?? '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const name: string = (row as any).first_name ?? (row as any).firstName ?? '?';
    movers.push({ id, initial: name.charAt(0).toUpperCase() });
    if (movers.length >= 4) break;
  }

  if (movers.length === 0) return null;

  const locationName = (squad as any)?.location_name ?? (squad as any)?.locationName ?? null;
  const subtitle = locationName
    ? t('member.friendsPulseSubAt').replace('{{name}}', locationName)
    : t('member.friendsPulseSub').replace('{{n}}', String(feed.length));

  return (
    <button
      type="button"
      onClick={() => navigate('/member/squad')}
      className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left active:scale-[0.99] transition-transform"
    >
      {/* avatar stack */}
      <div className="flex -space-x-2 flex-shrink-0">
        {movers.map((m) => (
          <div
            key={m.id}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-extrabold border-2 border-card shadow-sm"
            style={{ backgroundColor: avatarColorFor(m.id) }}
          >
            {m.initial}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-extrabold text-foreground leading-tight">
          {t('member.checkedInToday').replace('{{n}}', String(movers.length))}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {subtitle}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
