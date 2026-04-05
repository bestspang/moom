import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberSession } from '../hooks/useMemberSession';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchMomentumProfile, fetchMyBadges } from '../features/momentum/api';
import { TierBadge } from '../features/momentum/TierBadge';
import { StatusTierBadge, type StatusTier } from '../features/momentum/StatusTierBadge';
import { fetchMemberStatusTier } from '../features/momentum/api';
import { XPProgressBar } from '../features/momentum/XPProgressBar';
import { StreakFlame } from '../features/momentum/StreakFlame';
import { BadgeGrid } from '../features/momentum/BadgeGrid';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronRight, User, Bell, Heart, Award, CalendarCheck, CreditCard, HelpCircle, Shield, Lock, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildCrossSurfaceUrl, isDevEnvironment } from '@/apps/shared/hostname';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ADMIN_CAPABLE_ROLES: AppRole[] = ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'];

export default function MemberProfilePage() {
  const { signOut, allRoles } = useAuth();
  const { firstName, lastName, email, memberId } = useMemberSession();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAdminAccess = allRoles.some(r => ADMIN_CAPABLE_ROLES.includes(r));

  const { data: momentum } = useQuery({
    queryKey: ['momentum-profile', memberId],
    queryFn: () => fetchMomentumProfile(memberId!),
    enabled: !!memberId,
  });

  const { data: badges } = useQuery({
    queryKey: ['my-badges', memberId],
    queryFn: () => fetchMyBadges(memberId!),
    enabled: !!memberId,
  });

  const { data: statusTier } = useQuery({
    queryKey: ['member-status-tier', memberId],
    queryFn: () => fetchMemberStatusTier(memberId!),
    enabled: !!memberId,
  });

  const activityItems = [
    { label: t('member.editProfile'), icon: User, path: '/member/profile/edit' },
    { label: t('member.inviteFriends'), icon: Gift, path: '/member/referral' },
    { label: t('member.attendanceHistory'), icon: CalendarCheck, path: '/member/attendance' },
    { label: t('member.rewardWalletMenu'), icon: CreditCard, path: '/member/rewards' },
    { label: t('member.badgeCollectionMenu'), icon: Award, path: '/member/badges' },
    { label: t('member.mySquad'), icon: Heart, path: '/member/squad' },
  ];

  const settingsItems = [
    { label: t('member.securityLogin'), icon: Lock, path: '/member/security' },
    { label: t('member.notifications'), icon: Bell, path: '/member/notifications' },
  ];

  const renderMenuItem = (item: { label: string; icon: typeof User; path: string }) => {
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => navigate(item.path)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.profile')} />

      {/* Avatar & name */}
      <Section className="mb-6">
        <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm border border-border">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
            {firstName.charAt(0)}{lastName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{firstName} {lastName}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
            {momentum && (
              <div className="mt-1 flex items-center gap-1.5">
                <TierBadge tier={momentum.tier} level={momentum.level} />
                {statusTier && (
                  <StatusTierBadge tier={statusTier.currentTier as StatusTier} />
                )}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Momentum showcase */}
      {momentum && memberId && (
        <Section className="mb-6">
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <StreakFlame weeklyCheckinDays={momentum.weeklyCheckinDays} currentStreakWeeks={momentum.currentStreak} />
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('member.coinBalance')}</p>
                <p className="text-lg font-bold text-foreground">
                  {momentum.availablePoints.toLocaleString()} <span className="text-xs text-muted-foreground font-medium">{t('member.coinUnit')}</span>
                </p>
              </div>
            </div>

            <XPProgressBar totalXP={momentum.totalXp} level={momentum.level} />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{badges?.length ?? 0}</span> {t('member.badgesEarned').replace('{{n}} ', '')}
              </p>
              <button
                onClick={() => navigate('/member/badges')}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('member.viewAllBadges')}
              </button>
            </div>

            <BadgeGrid memberId={memberId} max={6} />
          </div>
        </Section>
      )}

      {/* Activity */}
      <Section title={t('member.activityGroup')} className="mb-4">
        <div className="space-y-1">
          {activityItems.map(renderMenuItem)}
        </div>
      </Section>

      {/* Settings */}
      <Section title={t('member.settingsGroup')} className="mb-6">
        <div className="space-y-1">
          {settingsItems.map(renderMenuItem)}
        </div>
      </Section>

      {/* Admin switch */}
      {hasAdminAccess && (
        <Section className="mb-6">
          <a
            href={isDevEnvironment() ? '/?surface=admin' : 'https://admin.moom.fit'}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted border border-border bg-card"
          >
            <Shield className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">{t('member.adminPortal')}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
        </Section>
      )}

      {/* Sign out */}
      <Section className="mb-8">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('member.signOut')}
        </Button>
      </Section>
    </div>
  );
}
