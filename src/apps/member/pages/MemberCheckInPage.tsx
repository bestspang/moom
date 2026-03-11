import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemberSession } from '../hooks/useMemberSession';
import { fetchMomentumProfile } from '../features/momentum/api';
import { CheckInCelebration } from '../features/momentum/CheckInCelebration';
import { toast } from 'sonner';
import { fireGamificationEvent } from '@/lib/gamificationEvents';
import { useTranslation } from 'react-i18next';
import { memberSelfCheckin } from '../api/services';

export default function MemberCheckInPage() {
  const { t } = useTranslation();
  const { memberId } = useMemberSession();
  const [isChecking, setIsChecking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const handleCheckIn = useCallback(async () => {
    if (!memberId) return;
    setIsChecking(true);
    try {
      // B1 fix: Uses server-side RPC with duplicate check + package verification
      await memberSelfCheckin(memberId);

      fireGamificationEvent({
        event_type: 'check_in',
        member_id: memberId,
        idempotency_key: `checkin:${memberId}:${new Date().toISOString().split('T')[0]}:${Date.now()}`,
        metadata: { method: 'self_service' },
      });

      await queryClient.invalidateQueries({ queryKey: ['momentum-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['my-quests'] });
      setShowCelebration(true);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already_checked_in') || msg.includes('already checked in')) {
        toast.error(t('member.alreadyCheckedIn'));
      } else if (msg.includes('member_inactive') || msg.includes('not active')) {
        toast.error(t('member.membershipInactive'));
      } else {
        toast.error(t('member.checkinFailed'));
      }
    } finally {
      setIsChecking(false);
    }
  }, [memberId, queryClient, t]);

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader
        title={t('member.checkinTitle')}
        subtitle={
          profile?.currentStreak
            ? t('member.streakDay', { n: profile.currentStreak })
            : t('member.readyToCheckIn')
        }
      />

      <Section className="mb-6">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-card p-8 shadow-sm border border-border overflow-hidden relative">
          <button
            onClick={handleCheckIn}
            disabled={isChecking}
            className="group flex h-32 w-32 items-center justify-center rounded-full bg-primary transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-2 text-primary-foreground">
              <Zap className="h-12 w-12 group-hover:animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {isChecking ? t('member.checkingIn') : t('member.checkIn')}
              </span>
            </div>
          </button>

          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {t('member.tapToCheckIn')}
          </p>
        </div>
      </Section>

      <CheckInCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        profile={profile ?? null}
      />
    </div>
  );
}
