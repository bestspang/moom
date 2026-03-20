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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate('/member/referral')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/member/referral'); }}
      className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border hover:bg-accent/50 transition-colors text-left cursor-pointer"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
        <Gift className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t('member.referralCardTitle')}</p>
        <p className="text-xs text-muted-foreground">
          {stats?.totalCompleted
            ? t('member.referralCardStats', {
                count: stats.totalCompleted,
                s: stats.totalCompleted > 1 ? 's' : '',
                coins: stats.totalPointsEarned,
              })
            : t('member.referralCardHint')}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? t('member.referralCopied') : t('member.referralShare')}
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
