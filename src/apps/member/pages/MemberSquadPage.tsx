import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMySquad, fetchAvailableSquads, joinSquad, leaveSquad } from '../features/momentum/api';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { EmptyState } from '@/apps/shared/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemberSession } from '../hooks/useMemberSession';
import { Users, LogOut, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function getInitials(first?: string, last?: string): string {
  return `${(first ?? '?').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase();
}

export default function MemberSquadPage() {
  const { t } = useTranslation();
  const { memberId } = useMemberSession();
  const queryClient = useQueryClient();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const { data: squad, isLoading } = useQuery({
    queryKey: ['my-squad', memberId],
    queryFn: () => fetchMySquad(memberId!),
    enabled: !!memberId,
  });

  const { data: availableSquads, isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-squads'],
    queryFn: fetchAvailableSquads,
    enabled: !!memberId && !squad && !isLoading,
  });

  const joinMutation = useMutation({
    mutationFn: (squadId: string) => joinSquad(memberId!, squadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-squad'] });
      queryClient.invalidateQueries({ queryKey: ['available-squads'] });
      toast.success(t('member.joinedSquad'));
    },
    onError: () => toast.error(t('member.joinSquadFailed')),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveSquad(memberId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-squad'] });
      toast.success(t('member.leftSquad'));
      setShowLeaveConfirm(false);
    },
    onError: () => toast.error(t('member.leaveSquadFailed')),
  });

  if (isLoading) {
    return (
      <div className="animate-in fade-in-0 duration-200">
        <MobilePageHeader title={t('member.squad')} />
        <Section className="mb-4"><Skeleton className="h-40 rounded-xl" /></Section>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="animate-in fade-in-0 duration-200">
        <MobilePageHeader title={t('member.squad')} />
        <Section className="mb-6">
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-primary/40 mb-3" />
            <h2 className="text-lg font-bold text-foreground">{t('member.teamUp')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('member.joinSquadHint')}</p>
          </div>
        </Section>

        <Section title={t('member.availableSquads')} className="mb-6">
          {loadingAvailable ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : !availableSquads || availableSquads.length === 0 ? (
            <EmptyState title={t('member.noSquadsAvailable')} description={t('member.checkBackSquads')} />
          ) : (
            <div className="space-y-3">
              {availableSquads.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span><Zap className="h-3 w-3 inline mr-0.5" />{s.totalXp.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => joinMutation.mutate(s.id)}
                    disabled={joinMutation.isPending}
                    className="flex-shrink-0"
                  >
                    {t('member.joinButton')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-200">
      <MobilePageHeader title={t('member.mySquad')} />

      <Section className="mb-4">
        <div className="rounded-xl bg-primary/5 p-5 text-center relative overflow-hidden border border-primary/10">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{squad.name}</h2>
          {squad.description && <p className="text-sm text-muted-foreground mt-1">{squad.description}</p>}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground">
            <Zap className="h-3 w-3 text-primary" />
            {squad.totalXp.toLocaleString()} {t('member.totalXp')}
          </div>
        </div>
      </Section>

      <Section title={t('member.membersCount', { current: squad.members.length, max: squad.maxMembers })} className="mb-4">
        <div className="space-y-2">
          {squad.members.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-card border">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `hsl(${(i * 60) % 360}, 60%, 85%)`,
                  color: `hsl(${(i * 60) % 360}, 60%, 30%)`,
                }}
              >
                {getInitials(m.firstName, m.lastName)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : t('member.memberLabel')}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">{m.role}</p>
              </div>
              {m.role === 'leader' && <Crown className="h-4 w-4 text-amber-500" />}
            </div>
          ))}
        </div>
      </Section>

      <Section className="mb-8">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => setShowLeaveConfirm(true)}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('member.leaveSquad')}
        </Button>
      </Section>

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('member.leaveSquadConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('member.leaveSquadDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('member.leaveButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
