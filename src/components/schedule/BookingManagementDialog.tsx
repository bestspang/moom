import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClassBookings, useWaitlist, useCancelBooking, useMarkAttendance, usePromoteFromWaitlist } from '@/hooks/useClassBookings';
import { useAuth } from '@/contexts/AuthContext';
import { useCancelSchedule, type ScheduleWithRelations } from '@/hooks/useSchedule';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, UserPlus, Clock, ArrowUp, Ban } from 'lucide-react';
import { AddBookingForm } from './AddBookingForm';

interface BookingManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ScheduleWithRelations | null;
}

const statusColors: Record<string, string> = {
  booked: 'bg-primary/10 text-primary border-primary/20',
  attended: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20',
  no_show: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-muted',
};

export const BookingManagementDialog = ({ open, onOpenChange, schedule }: BookingManagementDialogProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: bookings, isLoading: bookingsLoading } = useClassBookings(schedule?.id);
  const { data: waitlist, isLoading: waitlistLoading } = useWaitlist(schedule?.id || '');
  const cancelBooking = useCancelBooking();
  const markAttendance = useMarkAttendance();
  const promoteFromWaitlist = usePromoteFromWaitlist();
  const cancelSchedule = useCancelSchedule();

  if (!schedule) return null;

  const activeBookings = bookings?.filter(b => b.status !== 'cancelled') || [];
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled') || [];

  const content = (
    <div className="space-y-4">
      {/* Schedule Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <span>{schedule.trainer ? `${schedule.trainer.first_name} ${schedule.trainer.last_name}` : '-'}</span>
        <span>•</span>
        <span>{schedule.room?.name || '-'}</span>
        <span>•</span>
        <span>{activeBookings.length}/{schedule.capacity || 0}</span>
      </div>

      {/* Add Member Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {t('schedule.addMember')}
      </Button>

      {showAddForm && schedule && (
        <AddBookingForm
          scheduleId={schedule.id}
          existingMemberIds={bookings?.map(b => b.member_id) || []}
          onSuccess={() => setShowAddForm(false)}
        />
      )}

      <Separator />

      {/* Bookings List */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {t('schedule.bookings')} ({activeBookings.length})
        </h4>

        {bookingsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : activeBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {activeBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {booking.members?.first_name?.[0]}{booking.members?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {booking.members?.first_name} {booking.members?.last_name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{booking.members?.member_id}</span>
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 ${statusColors[booking.status] || ''}`}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {booking.status === 'booked' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-accent-teal hover:text-accent-teal hover:bg-accent-teal/10"
                      onClick={() => markAttendance.mutate({ bookingId: booking.id, status: 'attended' })}
                      title={t('schedule.markAttended')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => markAttendance.mutate({ bookingId: booking.id, status: 'no_show' })}
                      title={t('schedule.markNoShow')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => cancelBooking.mutate({
                        bookingId: booking.id,
                        cancelledBy: user?.id || '',
                      })}
                      title={t('common.cancel')}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waitlist */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {t('schedule.waitlist')} ({waitlist?.length || 0})
        </h4>

        {waitlistLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : !waitlist || waitlist.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 text-center">{t('common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {waitlist.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-5">#{entry.position}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {entry.members?.first_name?.[0]}{entry.members?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {entry.members?.first_name} {entry.members?.last_name}
                    </p>
                    <span className="text-xs text-muted-foreground">{entry.members?.member_id}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => promoteFromWaitlist.mutate({
                    waitlistId: entry.id,
                    scheduleId: schedule.id,
                    memberId: entry.member_id,
                  })}
                  disabled={promoteFromWaitlist.isPending}
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {t('schedule.promote')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Class */}
      {schedule.status !== 'cancelled' && (
        <>
          <Separator />
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={cancelSchedule.isPending}
            onClick={() => {
              if (window.confirm(t('schedule.cancelClassConfirm'))) {
                cancelSchedule.mutate(schedule.id, {
                  onSuccess: () => onOpenChange(false),
                });
              }
            }}
          >
            <Ban className="h-4 w-4 mr-2" />
            {t('schedule.cancelClass')}
          </Button>
        </>
      )}
    </div>
  );

  const title = `${schedule.class?.name || '-'} — ${schedule.start_time?.slice(0, 5)}-${schedule.end_time?.slice(0, 5)}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-6 max-h-[70vh]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
