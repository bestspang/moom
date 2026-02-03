import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';

const SettingsPackage = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('package');
  const updateSetting = useUpdateSetting();

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'package', key, value });
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const expirationOnBooking = getSettingValue(settings, 'expiration_on_booking', true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.package.expiration')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>{t('settings.package.expirationConditions')}</Label>
            <p className="text-sm mt-2 text-muted-foreground">{t('settings.package.whenBooking')}</p>
          </div>
          <Switch 
            checked={expirationOnBooking}
            onCheckedChange={(checked) => handleToggle('expiration_on_booking', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPackage;
