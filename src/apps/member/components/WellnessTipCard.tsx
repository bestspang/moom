/**
 * WellnessTipCard — V2 redesign: green pastel tip card.
 *
 * SHELL: Tip content is static (rotated by day-of-year). The "ดูเพิ่ม" CTA
 * is intentionally disabled (Coming Soon) per live-ui-action-policy.
 */

import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

const TIPS_KEYS = [
  'member.tip1', 'member.tip2', 'member.tip3',
  'member.tip4', 'member.tip5', 'member.tip6',
] as const;

const TIP_EMOJIS = ['🧘', '💧', '🥗', '🛌', '🚶', '🌬️'] as const;

function pickTipIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % TIPS_KEYS.length;
}

export function WellnessTipCard() {
  const { t } = useTranslation();
  const idx = pickTipIndex();
  const tipKey = TIPS_KEYS[idx];
  const emoji = TIP_EMOJIS[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl p-3.5 flex items-center gap-3
                    bg-gradient-to-br from-emerald-50 to-teal-50
                    dark:from-emerald-500/10 dark:to-teal-500/10
                    border border-emerald-200 dark:border-emerald-500/30">
      {/* Coming soon */}
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
        <Sparkles className="h-2.5 w-2.5" />
        {t('member.comingSoon')}
      </span>

      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl
                      bg-gradient-to-br from-emerald-200 to-teal-200
                      dark:from-emerald-500/30 dark:to-teal-500/30 text-2xl">
        {emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
          {t('member.wellnessTipTag')}
        </div>
        <p className="text-sm font-bold text-foreground mt-0.5 leading-snug">
          {t(tipKey)}
        </p>
      </div>
    </div>
  );
}
