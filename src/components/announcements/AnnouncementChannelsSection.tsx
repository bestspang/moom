import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Smartphone, MessageCircle } from 'lucide-react';
import type { AnnouncementChannels } from '@/hooks/useAnnouncements';

interface Props {
  channels: AnnouncementChannels;
  onChange: (channels: AnnouncementChannels) => void;
}

export const AnnouncementChannelsSection = ({ channels, onChange }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t('announcements.channels')}</Label>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t('announcements.inApp')}</span>
          </div>
          <Switch
            checked={channels.in_app}
            onCheckedChange={(checked) => onChange({ ...channels, in_app: checked })}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between rounded-md border p-3 opacity-60">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('announcements.line')}</span>
                </div>
                <Switch checked={false} disabled />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('announcements.lineComingSoon')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
