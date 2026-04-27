/**
 * FriendsPulseCard — Compact "your squad is moving" tease.
 *
 * Reuses existing fetchers:
 *   - fetchMySquad(memberId)              → resolve squadId
 *   - fetchSquadActivityFeed(squadId)     → recent entries
 *
 * Hidden when:
 *   - member is not in a squad
 *   - feed is empty
 *   - any fetch fails (graceful, no error UI)
 *
 * Tap navigates to /member/squad (existing route).
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchMySquad, fetchSquadActivityFeed } from '../features/momentum/api';

interface FriendsPulseCardProps {
  memberId: string;
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
    queryFn: () => fetchSquadActivityFeed(squadId!, 5),
    enabled: !!squadId,
    staleTime: 60 * 1000,
  });

  if (!squad || !feed || feed.length === 0) return null;

  // Distinct members in the recent slice (max 3 avatars)
  const seen = new Set<string>();
  const movers: { id: string; initial: string }[] = [];
  for (const row of feed) {
    const id = (row as any).member_id ?? (row as any).memberId ?? '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const name: string = (row as any).first_name ?? (row as any).firstName ?? '?';
    movers.push({ id, initial: name.charAt(0).toUpperCase() });
    if (movers.length >= 3) break;
  }

  if (movers.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/member/squad')}
      className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left active:scale-[0.99] transition-transform"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent">
        <Users className="h-4 w-4 text-accent-foreground" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-foreground leading-tight">
          {t('member.friendsPulseTitle')}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {t('member.friendsPulseSub').replace('{{n}}', String(feed.length))}
        </div>
      </div>
      <div className="flex -space-x-1.5 flex-shrink-0">
        {movers.map((m) => (
          <div
            key={m.id}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold border-2 border-card"
          >
            {m.initial}
          </div>
        ))}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
