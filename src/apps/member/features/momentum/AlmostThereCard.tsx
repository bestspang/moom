import { Zap, Target, Gift } from 'lucide-react';
import { xpForLevel } from './types';
import type { MomentumProfile, RewardItem } from './types';
import type { QuestInstance } from './api';
import { useTranslation } from 'react-i18next';

interface AlmostThereCardProps {
  profile: MomentumProfile;
  quests: QuestInstance[];
  rewards: RewardItem[];
}

export function AlmostThereCard({ profile, quests, rewards }: AlmostThereCardProps) {
  const { t } = useTranslation();
  const nudges: { icon: React.ReactNode; text: string }[] = [];

  // XP to next level
  const nextLevelXP = xpForLevel(profile.level + 1);
  const xpRemaining = nextLevelXP - profile.totalXp;
  if (xpRemaining > 0) {
    nudges.push({
      icon: <Zap className="h-3.5 w-3.5 text-primary" />,
      text: t('member.xpToNextLevel', { xp: xpRemaining, level: profile.level + 1 }),
    });
  }

  // Closest quest to completion
  const activeQuests = quests
    .filter(q => q.status === 'active' && q.template)
    .sort((a, b) => {
      const pctA = a.progressValue / (a.template!.goalValue || 1);
      const pctB = b.progressValue / (b.template!.goalValue || 1);
      return pctB - pctA;
    });
  const closest = activeQuests[0];
  if (closest?.template) {
    const remaining = closest.template.goalValue - closest.progressValue;
    if (remaining > 0 && remaining <= closest.template.goalValue) {
      nudges.push({
        icon: <Target className="h-3.5 w-3.5 text-primary" />,
        text: t('member.questAlmostDone', {
          remaining,
          quest: closest.template.nameEn,
          xp: closest.template.xpReward,
        }),
      });
    }
  }

  // Cheapest affordable reward
  const cheapest = rewards.find(r => r.pointsCost <= profile.availablePoints && r.isActive);
  if (cheapest) {
    nudges.push({
      icon: <Gift className="h-3.5 w-3.5 text-primary" />,
      text: t('member.canRedeemNow', { reward: cheapest.nameEn }),
    });
  } else {
    const nearest = rewards
      .filter(r => r.isActive && r.pointsCost > profile.availablePoints)
      .sort((a, b) => a.pointsCost - b.pointsCost)[0];
    if (nearest) {
      nudges.push({
        icon: <Gift className="h-3.5 w-3.5 text-muted-foreground" />,
        text: t('member.coinsToReward', {
          coins: nearest.pointsCost - profile.availablePoints,
          reward: nearest.nameEn,
        }),
      });
    }
  }

  if (nudges.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2.5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        ⚡ {t('member.almostThere')}
      </p>
      {nudges.slice(0, 3).map((nudge, i) => (
        <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
          {nudge.icon}
          <span className="text-xs font-medium">{nudge.text}</span>
        </div>
      ))}
    </div>
  );
}
