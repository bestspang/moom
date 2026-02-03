import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SettingsClass = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{t('settings.class.booking')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>{t('settings.class.bookingAdvance')}</Label><div className="flex items-center gap-2 mt-2"><Input type="number" defaultValue={3} className="w-20" /><span className="text-sm text-muted-foreground">{t('settings.class.daysBeforeClass')}</span></div></div>
          <div><Label>{t('settings.class.bookingBefore')}</Label><div className="flex items-center gap-2 mt-2"><Input type="number" defaultValue={5} className="w-20" /><span className="text-sm text-muted-foreground">{t('settings.class.minsBeforeClass')}</span></div></div>
          <div><Label>{t('settings.class.maxSpots')}</Label><div className="flex items-center gap-2 mt-2"><span className="text-sm">{t('settings.class.onlySpot')}</span></div></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsClass;
