import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { useSettings, getSettingValue } from '@/hooks/useSettings';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
        <div>
          <h3 className="text-lg font-semibold">{t('settings.package.expirationTitle')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.package.expirationDesc')}</p>
        </div>
        
        <div className="flex items-center gap-2 p-4 border rounded-lg hover:bg-muted/30 transition-colors group">
          <span className="text-sm font-medium flex-1">{t('settings.package.whenBooking')}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPackage;
