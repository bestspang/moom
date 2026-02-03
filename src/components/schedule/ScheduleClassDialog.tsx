import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClasses } from '@/hooks/useClasses';
import { useTrainers, useCreateSchedule } from '@/hooks/useSchedule';
import { useRooms } from '@/hooks/useRooms';
import { useLocations } from '@/hooks/useLocations';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
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

interface ScheduleClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

export function ScheduleClassDialog({ open, onOpenChange, defaultDate = new Date() }: ScheduleClassDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const createSchedule = useCreateSchedule();

  // Create schema with translations
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

  const onSubmit = async (data: ScheduleFormData) => {
    await createSchedule.mutateAsync({
      class_id: data.class_id,
      scheduled_date: format(data.scheduled_date, 'yyyy-MM-dd'),
      start_time: data.start_time,
      end_time: data.end_time,
      trainer_id: data.trainer_id || null,
      room_id: data.room_id || null,
      location_id: data.location_id || null,
      capacity: data.capacity || 20,
      status: 'scheduled',
    });
    onOpenChange(false);
  };

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
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
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

  // Use Drawer on mobile for better UX with forms
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
