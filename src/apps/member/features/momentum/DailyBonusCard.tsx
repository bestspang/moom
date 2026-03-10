import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, ScanLine, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface DailyBonusCardProps {
  className?: string;
}

export function DailyBonusCard({ className }: DailyBonusCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: rule } = useQuery({
    queryKey: ['gamification-rule-checkin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gamification_rules')
        .select('xp_value, points_value')
        .eq('action_key', 'check_in')
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const xp = rule?.xp_value ?? 8;
  const coins = rule?.points_value ?? 1;

  return (
    <button
      onClick={() => navigate('/member/check-in')}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left transition-all hover:bg-primary/10 active:scale-[0.98]',
        className,
      )}
    >
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <ScanLine className="h-5 w-5 text-primary" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{t('member.checkInToday')}</p>
        <p className="text-xs text-muted-foreground">{t('member.earnBonusXp')}</p>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary flex-shrink-0">
        <Zap className="h-3 w-3" />
        +{xp} XP
        <span className="opacity-60">·</span>
        <Coins className="h-3 w-3" />
        +{coins}
      </div>
    </button>
  );
}
