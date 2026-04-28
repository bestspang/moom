/**
 * DailySpinCard — UI shell for a future "Daily Spin" reward feature.
 *
 * SHELL: This is a visual placeholder per V2 mockup. The "หมุน!" CTA is
 * intentionally disabled per live-ui-action-policy until the backend
 * (`daily_spins` table + `gamification-daily-spin` edge fn) lands.
 *
 * Coming Soon badge is required.
 */

import { Gift, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DailySpinCard() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 shadow-sm
                    bg-gradient-to-r from-amber-400 to-orange-500 text-white">
      {/* Coming soon */}
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/25 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 backdrop-blur-sm">
        <Sparkles className="h-2.5 w-2.5" />
        {t('member.comingSoon')}
      </span>

      {/* gift bubble with dashed ring */}
      <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/20 border-2 border-dashed border-white/70">
        <Gift className="h-6 w-6 text-white" strokeWidth={2.4} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">
          {t('member.dailySpinTag')}
        </div>
        <div className="text-base font-extrabold leading-tight mt-0.5">
          {t('member.dailySpinTitle')}
        </div>
        <div className="text-[11px] opacity-90 mt-0.5">
          {t('member.dailySpinSub')}
        </div>
      </div>

      <button
        type="button"
        disabled
        className="flex-shrink-0 rounded-xl bg-white text-orange-600 font-extrabold text-sm px-4 py-2.5 shadow opacity-60 pointer-events-none"
      >
        {t('member.dailySpinCta')}
      </button>
    </div>
  );
}
