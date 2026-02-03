import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';
import { useLocations } from '@/hooks/useLocations';
import { cn } from '@/lib/utils';
import { Pencil, MapPin, AlertCircle } from 'lucide-react';
import { SettingsLayout } from '@/components/settings';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Section = 'payment' | 'theme' | 'timezone' | 'workout' | 'gymCheckin';

const themeColors = [
  { id: 'purple', main: '#9b87f5', accents: ['#6E59A5', '#8B5CF6', '#C4B5FD'], label: 'Purple', labelTh: 'ม่วง' },
  { id: 'orange', main: '#FF9500', accents: ['#C27500', '#FF9500', '#FFB84D'], label: 'Orange', labelTh: 'ส้ม' },
  { id: 'magenta', main: '#D946EF', accents: ['#A21CAF', '#D946EF', '#F0ABFC'], label: 'Magenta', labelTh: 'บานเย็น' },
  { id: 'red', main: '#ea384c', accents: ['#BE123C', '#ea384c', '#FB7185'], label: 'Red', labelTh: 'แดง' },
  { id: 'yellow', main: '#EAB308', accents: ['#A16207', '#EAB308', '#FDE047'], label: 'Yellow', labelTh: 'เหลือง' },
  { id: 'tan', main: '#C4A77D', accents: ['#92764A', '#C4A77D', '#E0D5C0'], label: 'Tan', labelTh: 'แทน' },
  { id: 'olive', main: '#9B8E5E', accents: ['#706640', '#9B8E5E', '#C4BA9A'], label: 'Olive', labelTh: 'มะกอก' },
  { id: 'green', main: '#22C55E', accents: ['#15803D', '#22C55E', '#86EFAC'], label: 'Green', labelTh: 'เขียว' },
  { id: 'lime', main: '#84CC16', accents: ['#4D7C0F', '#84CC16', '#BEF264'], label: 'Lime', labelTh: 'เขียวมะนาว' },
  { id: 'blue', main: '#0EA5E9', accents: ['#0369A1', '#0EA5E9', '#7DD3FC'], label: 'Blue', labelTh: 'น้ำเงิน' },
  { id: 'teal', main: '#14B8A6', accents: ['#0F766E', '#14B8A6', '#5EEAD4'], label: 'Teal', labelTh: 'เทา' },
  { id: 'gray', main: '#6B7280', accents: ['#374151', '#6B7280', '#D1D5DB'], label: 'Gray', labelTh: 'เทา' },
];

const SettingsGeneral = () => {
  const { t, language } = useLanguage();
  const { data: settings, isLoading } = useSettings('general');
  const updateSetting = useUpdateSetting();
  const { data: locations, isLoading: isLocationsLoading } = useLocations();
  const [activeSection, setActiveSection] = useState<Section>('payment');

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'general', key, value });
  };

  const handleThemeChange = (colorId: string) => {
    updateSetting.mutate({ section: 'general', key: 'theme_color', value: colorId });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-12 md:h-64 w-full md:w-52" />
        <Skeleton className="h-96 flex-1" />
      </div>
    );
  }

  const bankTransferEnabled = getSettingValue(settings, 'bank_transfer_enabled', false);
  const creditCardEnabled = getSettingValue(settings, 'credit_card_enabled', false);
  const qrPromptPayEnabled = getSettingValue(settings, 'qr_promptpay_enabled', false);
  const workoutEnabled = getSettingValue(settings, 'workout_enabled', true);
  const gymCheckinEnabled = getSettingValue(settings, 'gym_checkin_enabled', true);
  const themeColor = getSettingValue(settings, 'theme_color', 'purple');

  const menuItems = [
    { id: 'payment', label: t('settings.general.payment') },
    { id: 'theme', label: t('settings.general.themeColorMenu') },
    { id: 'timezone', label: t('settings.general.timezoneMenu') },
    { id: 'workout', label: t('settings.general.workoutMenu') },
    { id: 'gymCheckin', label: t('settings.general.gymCheckinMenu') },
  ];

  const hasLocations = locations && locations.length > 0;

  // Empty state component for no locations
  const EmptyLocationState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed rounded-lg bg-muted/20">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{t('settings.general.noLocations')}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {t('settings.general.noLocationsDesc')}
      </p>
      <Button asChild variant="outline">
        <Link to="/location">{t('settings.general.addLocation')}</Link>
      </Button>
    </div>
  );

  // Accordion header with status badge
  const AccordionHeader = ({ label, enabled }: { label: string; enabled: boolean }) => (
    <div className="flex items-center gap-3 w-full">
      <span className="font-medium text-foreground">{label}</span>
      <Badge variant={enabled ? 'default' : 'secondary'} className="ml-auto mr-2 text-xs">
        {enabled ? t('common.active') : t('common.inactive')}
      </Badge>
    </div>
  );

  const renderPaymentSection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('settings.general.paymentDescription')}</p>

      {!hasLocations ? (
        <EmptyLocationState />
      ) : (
        <Accordion type="multiple" className="w-full">
          {/* Bank Transfer */}
          <AccordionItem value="bank-transfer" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="hover:no-underline">
              <AccordionHeader label={t('settings.general.bankTransfer')} enabled={bankTransferEnabled} />
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">{t('settings.general.bankTransferDesc')}</p>
              {locations?.map((location) => (
                <div key={location.id} className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={bankTransferEnabled}
                      onCheckedChange={(checked) => handleToggle('bank_transfer_enabled', checked)}
                    />
                    <span className="text-sm">{location.name}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.general.specifyBankAccount')}
                  </Button>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Credit Card */}
          <AccordionItem value="credit-card" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="hover:no-underline">
              <AccordionHeader label={t('settings.general.creditCard')} enabled={creditCardEnabled} />
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">{t('settings.general.creditCardDesc')}</p>
              {locations?.map((location) => (
                <div key={location.id} className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={creditCardEnabled}
                      onCheckedChange={(checked) => handleToggle('credit_card_enabled', checked)}
                    />
                    <span className="text-sm">{location.name}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.general.setupStripe')}
                  </Button>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* QR PromptPay */}
          <AccordionItem value="qr-promptpay" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="hover:no-underline">
              <AccordionHeader label={t('settings.general.qrPromptPay')} enabled={qrPromptPayEnabled} />
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">{t('settings.general.qrPromptPayDesc')}</p>
              {locations?.map((location) => (
                <div key={location.id} className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={qrPromptPayEnabled}
                      onCheckedChange={(checked) => handleToggle('qr_promptpay_enabled', checked)}
                    />
                    <span className="text-sm">{location.name}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.general.setupStripe')}
                  </Button>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Tax Invoice */}
          <AccordionItem value="tax-invoice" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-medium text-foreground">{t('settings.general.taxInvoice')}</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">{t('settings.general.taxInvoiceDesc')}</p>
              {locations?.map((location) => (
                <div key={location.id} className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm">{location.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('common.edit')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );

  const renderThemeSection = () => {
    const getColorLabel = (color: typeof themeColors[0]) => 
      language === 'th' ? color.labelTh : color.label;

    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{t('settings.general.selectColor')}</p>

        {/* Default color */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.general.defaultColor')}</h3>
          <button
            onClick={() => handleThemeChange('purple')}
            aria-label={getColorLabel(themeColors[0])}
            className={cn(
              'w-32 rounded-lg border-2 cursor-pointer transition-all overflow-hidden text-left',
              themeColor === 'purple' ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
            )}
          >
            <div className="h-6 w-full" style={{ backgroundColor: '#9b87f5' }} />
            <div className="p-2 flex gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6E59A5' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C4B5FD' }} />
            </div>
            <div className="px-2 pb-2">
              <span className="text-xs font-medium">{getColorLabel(themeColors[0])}</span>
            </div>
          </button>
        </div>

        {/* Other colors */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.general.otherColors')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {themeColors.filter(c => c.id !== 'purple').map((color) => (
              <button
                key={color.id}
                onClick={() => handleThemeChange(color.id)}
                aria-label={getColorLabel(color)}
                className={cn(
                  'rounded-lg border-2 cursor-pointer transition-all overflow-hidden text-left',
                  themeColor === color.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                )}
              >
                <div className="h-6 w-full" style={{ backgroundColor: color.main }} />
                <div className="p-2 flex gap-2">
                  {color.accents.map((accent, i) => (
                    <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: accent }} />
                  ))}
                </div>
                <div className="px-2 pb-2">
                  <span className="text-xs font-medium">{getColorLabel(color)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTimezoneSection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('settings.general.selectTimezone')}</p>
      
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
        <span className="text-sm font-medium">Asia/Bangkok (GMT +07:00)</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.edit')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  const renderWorkoutSection = () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{t('settings.general.workoutList')}</Label>
          <Switch
            checked={workoutEnabled}
            onCheckedChange={(checked) => handleToggle('workout_enabled', checked)}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('settings.general.workoutDesc')}</p>
      </div>
    </div>
  );

  const renderGymCheckinSection = () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{t('settings.general.enableGymCheckin')}</Label>
          <Switch
            checked={gymCheckinEnabled}
            onCheckedChange={(checked) => handleToggle('gym_checkin_enabled', checked)}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('settings.general.gymCheckinDesc')}</p>
      </div>

      <div className="p-4 border rounded-lg space-y-2 hover:bg-muted/30 transition-colors">
        <Label className="font-medium">{t('settings.general.specifyCheckinTime')}</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('settings.general.anytime')}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'payment':
        return renderPaymentSection();
      case 'theme':
        return renderThemeSection();
      case 'timezone':
        return renderTimezoneSection();
      case 'workout':
        return renderWorkoutSection();
      case 'gymCheckin':
        return renderGymCheckinSection();
      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      items={menuItems}
      activeId={activeSection}
      onSelect={(id) => setActiveSection(id as Section)}
      withCard={true}
    >
      {renderContent()}
    </SettingsLayout>
  );
};

export default SettingsGeneral;
