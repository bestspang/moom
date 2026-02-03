import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const SettingsGeneral = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{t('settings.general.paymentMethods')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><Label>{t('settings.general.bankTransfer')}</Label></div><div className="flex items-center gap-2"><Switch /><Button variant="outline" size="sm">{t('settings.general.set')}</Button></div></div>
          <div className="flex items-center justify-between"><div><Label>{t('settings.general.creditCard')}</Label><p className="text-xs text-muted-foreground">{t('settings.general.stripeFee')}</p></div><Switch /></div>
          <div className="flex items-center justify-between"><div><Label>{t('settings.general.qrPromptPay')}</Label><p className="text-xs text-muted-foreground">{t('settings.general.promptPayFee')}</p></div><Switch /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('settings.general.appearance')}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{t('settings.general.themeColor')}</p><div className="flex gap-2 mt-2">{['purple', 'magenta', 'red', 'orange', 'teal', 'blue', 'green'].map((c) => (<div key={c} className={`w-8 h-8 rounded-full bg-${c}-500 cursor-pointer border-2 border-transparent hover:border-primary`} />))}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('settings.general.workout')}</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-between"><div><Label>{t('settings.general.workoutList')}</Label><p className="text-sm text-muted-foreground">{t('settings.general.enableWorkoutLogging')}</p></div><Switch defaultChecked /></div></CardContent>
      </Card>
    </div>
  );
};

export default SettingsGeneral;
