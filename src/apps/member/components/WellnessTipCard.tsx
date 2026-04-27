/**
 * WellnessTipCard — UI shell with hardcoded daily tips.
 *
 * SHELL: Tip content is static (rotated by day-of-year) until a content table
 * or AI-generated tips are wired in. The "ดูเพิ่ม" CTA is intentionally
 * disabled (Coming Soon) per live-ui-action-policy.
 */

import { useTranslation } from 'react-i18next';
import { Lightbulb, Sparkles } from 'lucide-react';

const TIPS_KEYS = [
  'member.tip1',
  'member.tip2',
  'member.tip3',
  'member.tip4',
  'member.tip5',
  'member.tip6',
] as const;

function pickTipKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return TIPS_KEYS[dayOfYear % TIPS_KEYS.length];
}

export function WellnessTipCard() {
  const { t } = useTranslation();
  const tipKey = pickTipKey();

  return (
    <div className="relative rounded-xl border border-border bg-card p-3.5 overflow-hidden">
      {/* Coming Soon ribbon */}
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
        <Sparkles className="h-2.5 w-2.5" />
        {t('member.comingSoon')}
      </span>

      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(38_92%_50%/0.15)] text-[hsl(38_92%_42%)]">
          <Lightbulb className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-foreground uppercase tracking-wider opacity-80">
            {t('member.dailyTip')}
          </div>
          <p className="text-xs text-foreground/80 mt-1 leading-snug">{t(tipKey)}</p>
          {/* Disabled CTA until content backend exists */}
          <button
            disabled
            className="mt-2 text-[11px] font-bold text-primary opacity-60 pointer-events-none"
          >
            {t('member.viewMoreTips')} →
          </button>
        </div>
      </div>
    </div>
  );
}
