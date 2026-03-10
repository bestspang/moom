import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobilePageHeader } from '@/apps/shared/components/MobilePageHeader';
import { Section } from '@/apps/shared/components/Section';
import { MobileStatusBadge } from '@/apps/shared/components/MobileStatusBadge';
import { QueryError } from '@/apps/shared/components/QueryError';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Clock, MapPin, User, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fetchBookingById, cancelBooking } from '../api/services';
import { useMemberSession } from '../hooks/useMemberSession';
import { ClassRatingSheet } from '../features/momentum/ClassRatingSheet';
import { supabase } from '@/integrations/supabase/client';

export default function MemberBookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingById(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id!, cancelReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      toast.success(t('member.bookingCancelled'));
      navigate('/member/bookings');
    },
    onError: () => toast.error(t('member.bookingCancelFailed')),
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

  if (!booking) return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>
      <Section><p className="text-sm text-muted-foreground text-center py-8">{t('member.bookingNotFound')}</p></Section>
    </div>
  );

  const { schedule } = booking;
  const canCancel = booking.status === 'booked' || booking.status === 'waitlisted';

  return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="px-4 pt-12 pb-2"><BackButton /></div>

      <Section className="mb-6">
        <div className="rounded-lg bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">{t('member.bookingLabel')}</span>
            <MobileStatusBadge status={booking.status} />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-4">{schedule.className}</h1>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(schedule.date), 'EEE, d MMM yyyy')} · {schedule.startTime.slice(0, 5)} – {schedule.endTime.slice(0, 5)}</span>
            </div>
            {schedule.trainerName && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{schedule.trainerName}</span>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title={t('member.bookingDetails')} className="mb-6">
        <div className="rounded-lg bg-card p-4 shadow-sm border border-border space-y-2">
          {booking.bookedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('member.bookedAt')}</span>
              <span className="text-foreground">{format(parseISO(booking.bookedAt), 'PPp')}</span>
            </div>
          )}
          {booking.cancelledAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('member.cancelledAt')}</span>
              <span className="text-foreground">{format(parseISO(booking.cancelledAt), 'PPp')}</span>
            </div>
          )}
          {booking.cancelReason && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('member.reason')}</span>
              <span className="text-foreground">{booking.cancelReason}</span>
            </div>
          )}
        </div>
      </Section>

      {canCancel && (
        <div className="px-4 pb-8">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={() => setCancelOpen(true)}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? t('member.cancellingBooking') : t('member.cancelBooking')}
          </Button>
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('member.cancelBooking')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('member.cancelBookingConfirm', { className: schedule.className })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Textarea
              placeholder={t('member.cancelReasonPlaceholder')}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('member.keepBooking')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelMutation.mutate()}
            >
              {t('member.cancelBooking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
