import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Section } from '@/apps/shared/components/Section';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Clock, MapPin, User, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fetchScheduleById, createBooking } from '../api/services';
import { useMemberSession } from '../hooks/useMemberSession';

export default function MemberClassDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberId } = useMemberSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: cls, isLoading, isError, refetch } = useQuery({
    queryKey: ['schedule-detail', id],
    queryFn: () => fetchScheduleById(id!),
    enabled: !!id,
  });

  const bookMutation = useMutation({
    mutationFn: () => createBooking(id!, memberId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['member-schedule'] });
      toast.success(t('member.classBookedSuccess'));
      navigate('/member/bookings');
    },
    onError: () => toast.error(t('member.classBookFailed')),
  });

  const BackButton = () => (
    <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
      <ArrowLeft className="h-4 w-4" /> {t('common.back')}
    </button>
  );

  if (isLoading) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <Section><Skeleton className="h-48 rounded-lg" /></Section>
    </div>
  );

  if (isError) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <QueryError onRetry={() => refetch()} />
    </div>
  );

  if (!cls) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <Section><p className="text-sm text-muted-foreground text-center py-8">{t('member.classNotFound')}</p></Section>
    </div>
  );

  const capacityPct = cls.capacity > 0 ? Math.round((cls.checkedIn / cls.capacity) * 100) : 0;
  const isFull = cls.checkedIn >= cls.capacity;

  return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>

      <Section className="mb-6">
        <div className="rounded-lg bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            {cls.categoryName && <span className="text-xs font-medium text-muted-foreground">{cls.categoryName}</span>}
            <MobileStatusBadge status={cls.status} />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-4">{cls.className}</h1>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(cls.scheduledDate), 'EEE, d MMM yyyy')} · {cls.startTime.slice(0, 5)} – {cls.endTime.slice(0, 5)}</span>
            </div>
            {cls.trainerName && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{cls.trainerName}</span>
              </div>
            )}
            {cls.roomName && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{cls.roomName}</span>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title={t('member.availability')} className="mb-6">
        <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{cls.checkedIn} / {cls.capacity}</span>
            </div>
            <span className="text-xs text-muted-foreground">{t('member.percentFull', { pct: capacityPct })}</span>
          </div>
          <Progress value={capacityPct} className="h-2" />
        </div>
      </Section>

      <Section title={t('member.cancellationPolicy')} className="mb-8">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('member.cancellationPolicyText')}
        </p>
      </Section>

      <div className="px-4 pb-8">
        <Button
          className="w-full"
          size="lg"
          disabled={!memberId || bookMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {bookMutation.isPending ? t('member.bookingInProgress') : isFull ? t('member.joinWaitlist') : t('member.bookThisClass')}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isFull ? t('member.confirmJoinWaitlist') : t('member.confirmBooking')}</AlertDialogTitle>
            <AlertDialogDescription>
              {isFull
                ? t('member.waitlistDescription', { className: cls.className })
                : t('member.bookingConfirmDescription', { className: cls.className, date: format(parseISO(cls.scheduledDate), 'EEE, d MMM'), time: cls.startTime.slice(0, 5) })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => bookMutation.mutate()}>
              {isFull ? t('member.joinWaitlist') : t('member.bookNow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
