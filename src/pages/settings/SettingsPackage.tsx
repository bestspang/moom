import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { useSettings, getSettingValue } from '@/hooks/useSettings';

const SettingsPackage = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('package');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const expirationOnBooking = getSettingValue(settings, 'expiration_on_booking', true);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary">{t('settings.package.expirationTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('settings.package.expirationDesc')}</p>
        
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm">{t('settings.package.whenBooking')}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPackage;
