import { useQuery } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { SummaryCard } from '@/apps/shared/components/SummaryCard';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Gift, Users, Trophy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchOrCreateReferralCode, fetchReferralStats } from '../features/referral/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MemberReferralPage() {
  const { memberId } = useMemberSession();
  const [copied, setCopied] = useState(false);

  const { data: code, isLoading: loadingCode } = useQuery({
    queryKey: ['referral-code', memberId],
    queryFn: () => fetchOrCreateReferralCode(memberId!),
    enabled: !!memberId,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['referral-stats', memberId],
    queryFn: () => fetchReferralStats(memberId!),
    enabled: !!memberId,
  });

  const shareUrl = code ? `${window.location.origin}/member/signup?ref=${code}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join MOOM!',
          text: `Use my code ${code} to sign up and we both get 200 Coin! 🎉`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied! Share it with friends 🎉');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <MobilePageHeader title="Invite Friends" subtitle="Share & earn rewards together!" />

      {/* Referral Code Card */}
      <Section className="mb-4">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <Gift className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Your referral code</p>
          {loadingCode ? (
            <Skeleton className="h-10 w-40 mx-auto mb-3" />
          ) : (
            <p className="text-2xl font-black tracking-widest text-foreground mb-3">{code}</p>
          )}
          <p className="text-xs text-muted-foreground mb-4">
            Both you and your friend get <span className="font-bold text-primary">200 Coin</span> when they check in! 🎉
          </p>
          <Button onClick={handleCopy} className="w-full" size="sm">
            {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Share2 className="h-4 w-4 mr-1.5" />}
            {copied ? 'Copied!' : 'Share Invite Link'}
          </Button>
        </div>
      </Section>

      {/* How it works */}
      <Section title="How It Works" className="mb-4">
        <div className="space-y-3">
          {[
            { step: 1, text: 'Share your code or link with friends', icon: Share2 },
            { step: 2, text: 'They sign up using your code', icon: Users },
            { step: 3, text: 'You both earn 200 RP on their first check-in!', icon: Trophy },
          ].map(({ step, text, icon: Icon }) => (
            <div key={step} className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                {step}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Stats */}
      <Section title="Your Referral Stats" className="mb-4">
        {loadingStats ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="Invited" value={String(stats?.totalInvited ?? 0)} subtitle="friends" />
            <SummaryCard label="Joined" value={String(stats?.totalCompleted ?? 0)} subtitle="completed" />
            <SummaryCard label="Earned" value={String(stats?.totalPointsEarned ?? 0)} subtitle="RP" />
          </div>
        )}
      </Section>

      {/* Referral History */}
      <Section title="Referral History" className="mb-6">
        {loadingStats ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : !stats?.referrals?.filter(r => r.referredMemberId).length ? (
          <EmptyState
            title="No referrals yet"
            description="Share your code and invite friends to join MOOM!"
          />
        ) : (
          <div className="space-y-2">
            {stats!.referrals.filter(r => r.referredMemberId).map(ref => (
              <div key={ref.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ref.status === 'completed' ? '✅ Joined & checked in' : '⏳ Signed up'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ref.createdAt), 'd MMM yyyy')}
                  </p>
                </div>
                {ref.rewardGranted && (
                  <span className="text-xs font-bold text-primary">+200 RP</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
