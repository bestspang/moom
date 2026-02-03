import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const SettingsContracts = () => {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader><CardTitle>{t('settings.tabs.memberContracts')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between"><div><Label>{t('settings.memberContracts.allowSigning')}</Label><p className="text-sm text-muted-foreground">{t('settings.memberContracts.signingDescription')}</p></div><Switch /></div>
        <Button variant="outline">{t('settings.memberContracts.setupContracts')}</Button>
      </CardContent>
    </Card>
  );
};

export default SettingsContracts;
