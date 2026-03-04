import React, { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClasses } from '@/hooks/useClasses';
import { useTrainers, useCreateScheduleValidated } from '@/hooks/useSchedule';
import { useRooms } from '@/hooks/useRooms';
import { useLocations } from '@/hooks/useLocations';
import { useIsMobile } from '@/hooks/use-mobile';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/common';
import { toast } from '@/hooks/use-toast';

interface ScheduleClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

// Helper: add minutes to a time string "HH:mm"
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function ScheduleClassDialog({ open, onOpenChange, defaultDate = new Date() }: ScheduleClassDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const createSchedule = useCreateScheduleValidated();

  const scheduleSchema = useMemo(() => z.object({
    class_id: z.string().min(1, t('validation.required')),
    scheduled_date: z.date(),
    start_time: z.string().min(1, t('validation.required')),
    end_time: z.string().min(1, t('validation.required')),
    trainer_id: z.string().optional(),
    room_id: z.string().optional(),
    location_id: z.string().optional(),
    capacity: z.number().min(1).optional(),
  }), [t]);

  type ScheduleFormData = z.infer<typeof scheduleSchema>;

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      class_id: '',
      scheduled_date: defaultDate,
      start_time: '09:00',
      end_time: '10:00',
      trainer_id: undefined,
      room_id: undefined,
      location_id: undefined,
      capacity: 20,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        class_id: '',
        scheduled_date: defaultDate,
        start_time: '09:00',
        end_time: '10:00',
        trainer_id: undefined,
        room_id: undefined,
        location_id: undefined,
        capacity: 20,
      });
    }
  }, [open, defaultDate, form]);

  // Watch values for smart filtering
  const watchedLocationId = form.watch('location_id');
  const watchedRoomId = form.watch('room_id');
  const watchedClassId = form.watch('class_id');
  const watchedStartTime = form.watch('start_time');

  // Filter rooms by selected location
  const filteredRooms = useMemo(() => {
    if (!watchedLocationId) return rooms;
    return rooms.filter(r => r.location_id === watchedLocationId);
  }, [rooms, watchedLocationId]);

  // When location changes, clear room if it no longer belongs
  React.useEffect(() => {
    if (watchedRoomId && watchedLocationId) {
      const roomStillValid = filteredRooms.some(r => r.id === watchedRoomId);
      if (!roomStillValid) {
        form.setValue('room_id', undefined);
      }
    }
  }, [watchedLocationId, watchedRoomId, filteredRooms, form]);

  // When room selected, auto-set capacity
  React.useEffect(() => {
    if (watchedRoomId) {
      const selectedRoom = rooms.find(r => r.id === watchedRoomId);
      if (selectedRoom?.max_capacity) {
        form.setValue('capacity', selectedRoom.max_capacity);
      }
    }
  }, [watchedRoomId, rooms, form]);

  // When class selected, auto-compute end_time from duration
  React.useEffect(() => {
    if (watchedClassId && watchedStartTime) {
      const selectedClass = classes.find(c => c.id === watchedClassId);
      if (selectedClass?.duration) {
        const newEndTime = addMinutesToTime(watchedStartTime, selectedClass.duration);
        form.setValue('end_time', newEndTime);
      }
    }
  }, [watchedClassId, watchedStartTime, classes, form]);

  const onSubmit = useCallback(async (data: ScheduleFormData) => {
    try {
      await createSchedule.mutateAsync({
        p_class_id: data.class_id,
        p_scheduled_date: format(data.scheduled_date, 'yyyy-MM-dd'),
        p_start_time: data.start_time,
        p_end_time: data.end_time,
        p_trainer_id: data.trainer_id || null,
        p_room_id: data.room_id || null,
        p_location_id: data.location_id || null,
        p_capacity: data.capacity || null,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      // Check if the error message is an i18n key
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.startsWith('schedule.error.')) {
        toast({
          title: t('common.error'),
          description: t(message),
          variant: 'destructive',
        });
      }
      // Other errors already handled by mutation onError
    }
  }, [createSchedule, onOpenChange, t]);

  const isLoading = classesLoading || trainersLoading || roomsLoading || locationsLoading;

  const FormContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('schedule.class')} *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.class')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('dateTime.today')}</FormLabel>
              <DatePicker
                date={field.value}
                onChange={(date) => field.onChange(date || new Date())}
                showNavigation={false}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('schedule.time')} (Start) *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('schedule.time')} (End) *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="trainer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('schedule.trainer')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.trainer')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.first_name} {trainer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('lobby.location')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('lobby.location')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('schedule.room')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.room')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} {room.max_capacity ? `(${room.max_capacity})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rooms.maxCapacity')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={createSchedule.isPending || isLoading}>
            {createSchedule.isPending ? t('common.loading') : t('common.create')}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('schedule.scheduleClass')}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto px-1">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('schedule.scheduleClass')}</DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
