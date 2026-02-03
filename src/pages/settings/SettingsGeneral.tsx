import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';

const SettingsGeneral = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('general');
  const updateSetting = useUpdateSetting();

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'general', key, value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const bankTransferEnabled = getSettingValue(settings, 'bank_transfer_enabled', false);
  const creditCardEnabled = getSettingValue(settings, 'credit_card_enabled', false);
  const qrPromptPayEnabled = getSettingValue(settings, 'qr_promptpay_enabled', false);
  const workoutEnabled = getSettingValue(settings, 'workout_enabled', true);
  const themeColor = getSettingValue(settings, 'theme_color', 'purple');

  const colors = ['purple', 'magenta', 'red', 'orange', 'teal', 'blue', 'green'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.paymentMethods')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.general.bankTransfer')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={bankTransferEnabled}
                onCheckedChange={(checked) => handleToggle('bank_transfer_enabled', checked)}
              />
              <Button variant="outline" size="sm">{t('settings.general.set')}</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.general.creditCard')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.general.stripeFee')}</p>
            </div>
            <Switch 
              checked={creditCardEnabled}
              onCheckedChange={(checked) => handleToggle('credit_card_enabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.general.qrPromptPay')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.general.promptPayFee')}</p>
            </div>
            <Switch 
              checked={qrPromptPayEnabled}
              onCheckedChange={(checked) => handleToggle('qr_promptpay_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.appearance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('settings.general.themeColor')}</p>
          <div className="flex gap-2 mt-2">
            {colors.map((c) => (
              <div 
                key={c} 
                className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                  themeColor === c ? 'border-primary scale-110' : 'border-transparent hover:border-muted'
                }`}
                style={{ 
                  backgroundColor: c === 'purple' ? '#9b87f5' :
                    c === 'magenta' ? '#D946EF' :
                    c === 'red' ? '#ea384c' :
                    c === 'orange' ? '#F97316' :
                    c === 'teal' ? '#14B8A6' :
                    c === 'blue' ? '#0EA5E9' :
                    '#22C55E'
                }}
                onClick={() => updateSetting.mutate({ section: 'general', key: 'theme_color', value: c })}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.workout')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.general.workoutList')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.general.enableWorkoutLogging')}</p>
            </div>
            <Switch 
              checked={workoutEnabled}
              onCheckedChange={(checked) => handleToggle('workout_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsGeneral;
