import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const allowSigning = getSettingValue(settings, 'allow_signing', false);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary">{t('settings.memberContracts.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('settings.memberContracts.description')}</p>
        
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3">
            <Switch 
              checked={allowSigning}
              onCheckedChange={(checked) => handleToggle('allow_signing', checked)}
            />
            <span className="text-sm font-medium">{t('settings.memberContracts.allowSigning')}</span>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            {t('settings.memberContracts.signingDescription')}
          </p>
        </div>
        
        <div className="pt-4">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            {t('settings.memberContracts.setupContracts')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsContracts;
