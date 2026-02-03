import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const SettingsPackage = () => {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader><CardTitle>{t('settings.package.expiration')}</CardTitle></CardHeader>
      <CardContent><Label>{t('settings.package.expirationConditions')}</Label><p className="text-sm mt-2">{t('settings.package.whenBooking')}</p></CardContent>
    </Card>
  );
};

export default SettingsPackage;
