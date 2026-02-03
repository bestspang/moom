import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';

const SettingsClient = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('client');
  const updateSetting = useUpdateSetting();

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'client', key, value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const allowAllBookings = getSettingValue(settings, 'injured_allow_all_bookings', false);
  const bookOnMobile = getSettingValue(settings, 'injured_book_on_mobile', false);
  const bookOnConsole = getSettingValue(settings, 'injured_book_on_console', false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.client.injuredMembers')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('settings.client.allowAllBookings')}</Label>
            <Switch 
              checked={allowAllBookings}
              onCheckedChange={(checked) => handleToggle('injured_allow_all_bookings', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('settings.client.bookOnMobile')}</Label>
            <Switch 
              checked={bookOnMobile}
              onCheckedChange={(checked) => handleToggle('injured_book_on_mobile', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('settings.client.bookOnConsole')}</Label>
            <Switch 
              checked={bookOnConsole}
              onCheckedChange={(checked) => handleToggle('injured_book_on_console', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsClient;
