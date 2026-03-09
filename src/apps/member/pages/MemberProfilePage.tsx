import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberSession } from '../hooks/useMemberSession';
import { useQuery } from '@tanstack/react-query';
import { fetchMomentumProfile, fetchMyBadges } from '../features/momentum/api';
import { TierBadge } from '../features/momentum/TierBadge';
import { XPProgressBar } from '../features/momentum/XPProgressBar';
import { StreakFlame } from '../features/momentum/StreakFlame';
import { BadgeGrid } from '../features/momentum/BadgeGrid';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronRight, User, Bell, Heart, Award, CalendarCheck, CreditCard, HelpCircle, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildCrossSurfaceUrl, isDevEnvironment } from '@/apps/shared/hostname';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ADMIN_CAPABLE_ROLES: AppRole[] = ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'];

export default function MemberProfilePage() {
  const { signOut, allRoles } = useAuth();
  const { firstName, lastName, email, memberId } = useMemberSession();
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

  const menuItems = [
    { label: 'Edit Profile', icon: User, path: '/member/profile/edit' },
    { label: 'Attendance History', icon: CalendarCheck, path: '/member/attendance' },
    { label: 'Reward Wallet', icon: CreditCard, path: '/member/rewards' },
    { label: 'Badge Collection', icon: Award, path: '/member/badges' },
    { label: 'My Squad', icon: Heart, path: '/member/squad' },
    { label: 'Security & Login', icon: Lock, path: '/member/security' },
    { label: 'Notifications', icon: Bell, path: '/member/notifications' },
    { label: 'Support', icon: HelpCircle, path: '/member/support' },
  ];

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title="Profile" />

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
              <div className="mt-1">
                <TierBadge tier={momentum.tier} level={momentum.level} />
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
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reward Points</p>
                <p className="text-lg font-bold text-foreground">
                  {momentum.availablePoints.toLocaleString()} <span className="text-xs text-muted-foreground font-medium">RP</span>
                </p>
              </div>
            </div>

            <XPProgressBar totalXP={momentum.totalXp} level={momentum.level} />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{badges?.length ?? 0}</span> badges earned
              </p>
              <button
                onClick={() => navigate('/member/badges')}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all →
              </button>
            </div>

            <BadgeGrid memberId={memberId} max={6} />
          </div>
        </Section>
      )}

      {/* Menu items */}
      <Section className="mb-6">
        <div className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
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
            <span className="flex-1 text-sm font-medium text-foreground">Admin Portal</span>
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
          Sign Out
        </Button>
      </Section>
    </div>
  );
}
