import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';

const SettingsContracts = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('contracts');
  const updateSetting = useUpdateSetting();

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'contracts', key, value });
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const allowSigning = getSettingValue(settings, 'allow_signing', false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.tabs.memberContracts')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>{t('settings.memberContracts.allowSigning')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.memberContracts.signingDescription')}</p>
          </div>
          <Switch 
            checked={allowSigning}
            onCheckedChange={(checked) => handleToggle('allow_signing', checked)}
          />
        </div>
        <Button variant="outline">{t('settings.memberContracts.setupContracts')}</Button>
      </CardContent>
    </Card>
  );
};

export default SettingsContracts;
