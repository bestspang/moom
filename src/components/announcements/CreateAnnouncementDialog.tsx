import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateAnnouncement, type AnnouncementFormData } from '@/hooks/useAnnouncements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AnnouncementChannelsSection } from './AnnouncementChannelsSection';
import { AnnouncementTargetSection } from './AnnouncementTargetSection';

const announcementSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000),
  publish_date: z.date({ required_error: 'Publish date is required' }),
  end_date: z.date({ required_error: 'End date is required' }),
  status: z.enum(['active', 'scheduled', 'completed']),
}).refine((data) => data.end_date >= data.publish_date, {
  message: 'End date must be after publish date',
  path: ['end_date'],
});

type FormValues = z.infer<typeof announcementSchema>;

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAnnouncementDialog = ({
  open,
  onOpenChange,
}: CreateAnnouncementDialogProps) => {
  const { t } = useLanguage();
  const createAnnouncement = useCreateAnnouncement();

  const [channels, setChannels] = useState({ in_app: true, line: false });
  const [targetMode, setTargetMode] = useState('all');
  const [targetLocationIds, setTargetLocationIds] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: '',
      status: 'scheduled',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const data: AnnouncementFormData = {
      message: values.message,
      publish_date: values.publish_date.toISOString(),
      end_date: values.end_date.toISOString(),
      status: values.status,
      channels,
      target_mode: targetMode,
      target_location_ids: targetMode === 'all' ? [] : targetLocationIds,
    };

    await createAnnouncement.mutateAsync(data);
    form.reset();
    setChannels({ in_app: true, line: false });
    setTargetMode('all');
    setTargetLocationIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('announcements.create')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Message + AI Draft */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('announcements.message')}</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-7 gap-1 text-xs"
                          >
                            <Sparkles className="h-3 w-3" />
                            {t('announcements.aiDraft')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('announcements.aiDraftComingSoon')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder={t('announcements.messagePlaceholder')}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Channels */}
            <AnnouncementChannelsSection channels={channels} onChange={setChannels} />

            {/* Target locations */}
            <AnnouncementTargetSection
              targetMode={targetMode}
              targetLocationIds={targetLocationIds}
              onModeChange={setTargetMode}
              onLocationIdsChange={setTargetLocationIds}
            />

            {/* Publish date */}
            <FormField
              control={form.control}
              name="publish_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('announcements.publishDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>{t('common.selectDate')}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End date */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('announcements.endDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>{t('common.selectDate')}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t('common.active')}</SelectItem>
                      <SelectItem value="scheduled">{t('packages.scheduled')}</SelectItem>
                      <SelectItem value="completed">{t('announcements.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createAnnouncement.isPending}
                className="bg-primary hover:bg-primary-hover"
              >
                {createAnnouncement.isPending ? t('common.saving') : t('common.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
