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
        <div>
          <h3 className="text-lg font-semibold">{t('settings.memberContracts.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.memberContracts.description')}</p>
        </div>
        
        <div className="py-3 border-b">
          <div className="flex items-start gap-3">
            <Switch 
              checked={allowSigning}
              onCheckedChange={(checked) => handleToggle('allow_signing', checked)}
              className="mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{t('settings.memberContracts.allowSigning')}</span>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings.memberContracts.signingDescription')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button variant="outline">
            {t('settings.memberContracts.setupContracts')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsContracts;
