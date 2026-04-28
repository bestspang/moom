import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchOrCreateReferralCode, fetchReferralStats } from './api';
import { toast } from 'sonner';

interface ReferralCardProps {
  memberId: string;
}

export function ReferralCard({ memberId }: ReferralCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data: code, isLoading: loadingCode } = useQuery({
    queryKey: ['referral-code', memberId],
    queryFn: () => fetchOrCreateReferralCode(memberId),
    enabled: !!memberId,
  });

  const { data: stats } = useQuery({
    queryKey: ['referral-stats', memberId],
    queryFn: () => fetchReferralStats(memberId),
    enabled: !!memberId,
  });

  const handleCopy = async () => {
    if (!code) return;
    const shareUrl = `${window.location.origin}/signup?ref=${code}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('member.referralJoinTitle'),
          text: t('member.referralShareText', { code }),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success(t('member.referralLinkCopied'));
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('member.referralLinkCopiedShort'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingCode) {
    return <Skeleton className="h-24 rounded-xl" />;
  }

  const hasStats = !!stats?.totalCompleted;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate('/member/referral')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/member/referral'); }}
      className="flex w-full items-center gap-3 rounded-2xl p-4 text-left cursor-pointer
                 bg-orange-50 dark:bg-orange-500/10
                 border border-orange-200 dark:border-orange-500/30
                 active:scale-[0.99] transition-transform"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex-shrink-0">
        <Gift className="h-6 w-6 text-orange-600 dark:text-orange-400" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-extrabold text-foreground leading-tight">
          {t('member.referralBigTitle')}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {hasStats
            ? t('member.referralCardStats', {
                count: stats!.totalCompleted,
                s: stats!.totalCompleted > 1 ? 's' : '',
                coins: stats!.totalPointsEarned,
              })
            : t('member.referralBigSub')}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-card px-3 py-2 text-xs font-extrabold text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/40 shadow-sm hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex-shrink-0"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t('member.referralCopied') : t('member.referralShare')}
      </button>
    </div>
  );
}
