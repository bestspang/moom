import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';

const SettingsClass = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('class');
  const updateSetting = useUpdateSetting();

  const handleChange = (key: string, value: number) => {
    updateSetting.mutate({ section: 'class', key, value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const bookingAdvanceDays = getSettingValue(settings, 'booking_advance_days', 3);
  const bookingBeforeMins = getSettingValue(settings, 'booking_before_mins', 5);
  const maxSpotsPerMember = getSettingValue(settings, 'max_spots_per_member', 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.class.booking')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('settings.class.bookingAdvance')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input 
                type="number" 
                value={bookingAdvanceDays}
                onChange={(e) => handleChange('booking_advance_days', parseInt(e.target.value) || 0)}
                className="w-20" 
              />
              <span className="text-sm text-muted-foreground">{t('settings.class.daysBeforeClass')}</span>
            </div>
          </div>
          <div>
            <Label>{t('settings.class.bookingBefore')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input 
                type="number" 
                value={bookingBeforeMins}
                onChange={(e) => handleChange('booking_before_mins', parseInt(e.target.value) || 0)}
                className="w-20" 
              />
              <span className="text-sm text-muted-foreground">{t('settings.class.minsBeforeClass')}</span>
            </div>
          </div>
          <div>
            <Label>{t('settings.class.maxSpots')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input 
                type="number" 
                value={maxSpotsPerMember}
                onChange={(e) => handleChange('max_spots_per_member', parseInt(e.target.value) || 1)}
                className="w-20" 
              />
              <span className="text-sm text-muted-foreground">{t('settings.class.onlySpot')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsClass;
