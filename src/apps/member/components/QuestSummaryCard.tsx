/**
 * QuestSummaryCard — V2 home widget summarizing today's quests.
 *
 * Wraps existing `fetchMyQuests` data. Shows up to 4 active+completed quests
 * with XP/Coin pills and progress bars. Tapping a quest or "view all"
 * navigates to /member/momentum where the full QuestHub lives.
 *
 * Hidden if no quests at all.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Target, Zap, Coins } from 'lucide-react';
import { fetchMyQuests, type QuestInstance } from '../features/momentum/api';

interface Props {
  memberId: string;
}

export function QuestSummaryCard({ memberId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { data: quests } = useQuery({
    queryKey: ['member-quests', memberId],
    queryFn: () => fetchMyQuests(memberId),
    enabled: !!memberId,
    staleTime: 60 * 1000,
  });

  if (!quests || quests.length === 0) return null;

  // Active = not claimed, not expired
  const visible = quests
    .filter((q) => q.template && q.status !== 'claimed' && q.status !== 'expired')
    .slice(0, 4);
  if (visible.length === 0) return null;

  const completedCount = visible.filter((q) => q.status === 'completed').length;
  const totalCount = visible.length;
  const remainingXp = visible
    .filter((q) => q.status !== 'completed')
    .reduce((sum, q) => sum + (q.template?.xpReward ?? 0), 0);

  // ring progress
  const ringPct = totalCount > 0 ? completedCount / totalCount : 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = c * ringPct;

  return (
    <button
      type="button"
      onClick={() => navigate('/member/momentum')}
      className="w-full text-left rounded-2xl border border-border bg-card p-4 active:scale-[0.99] transition-transform"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/15">
          <Target className="h-5 w-5 text-orange-600" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-extrabold text-foreground leading-tight">
            {t('member.questsToday')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {t('member.questsProgress')
              .replace('{{done}}', String(completedCount))
              .replace('{{total}}', String(totalCount))
              .replace('{{xp}}', String(remainingXp))}
          </div>
        </div>
        {/* ring */}
        <div className="relative flex-shrink-0 h-11 w-11">
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
            <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
            <circle
              cx="22"
              cy="22"
              r={r}
              fill="none"
              stroke="hsl(24 95% 55%)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-extrabold text-foreground">{completedCount}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Quest rows */}
      <div className="space-y-3">
        {visible.map((q) => (
          <QuestRow key={q.id} quest={q} lang={i18n.language} />
        ))}
      </div>
    </button>
  );
}

function QuestRow({ quest, lang }: { quest: QuestInstance; lang: string }) {
  const tmpl = quest.template!;
  const isDone = quest.status === 'completed';
  const pct = Math.min(100, Math.round((quest.progressValue / tmpl.goalValue) * 100));
  const name = lang === 'th' ? (tmpl.nameTh || tmpl.nameEn) : tmpl.nameEn;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-bold ${
              isDone ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}
          >
            {name}
          </span>
        </div>
        {tmpl.xpReward > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600 px-2 py-0.5 text-[10px] font-extrabold">
            <Zap className="h-2.5 w-2.5" />+{tmpl.xpReward}
          </span>
        )}
        {tmpl.coinReward > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-extrabold">
            <Coins className="h-2.5 w-2.5" />+{tmpl.coinReward}
          </span>
        )}
        <span className="text-[11px] font-bold text-muted-foreground tabular-nums w-10 text-right">
          {quest.progressValue}/{tmpl.goalValue}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDone ? 'bg-emerald-500' : 'bg-orange-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
