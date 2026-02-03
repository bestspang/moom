import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SettingsClient = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{t('settings.client.injuredMembers')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>{t('settings.client.allowAllBookings')}</Label><Switch /></div>
          <div className="flex items-center justify-between"><Label>{t('settings.client.bookOnMobile')}</Label><Switch /></div>
          <div className="flex items-center justify-between"><Label>{t('settings.client.bookOnConsole')}</Label><Switch /></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsClient;
