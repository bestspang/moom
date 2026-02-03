import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';
import { useLocations } from '@/hooks/useLocations';
import { cn } from '@/lib/utils';
import { ChevronDown, Pencil } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Section = 'payment' | 'theme' | 'timezone' | 'workout' | 'gymCheckin';

const themeColors = [
  { id: 'purple', main: '#9b87f5', accents: ['#6E59A5', '#8B5CF6', '#C4B5FD'], label: 'Purple' },
  { id: 'orange', main: '#FF9500', accents: ['#C27500', '#FF9500', '#FFB84D'], label: 'Orange' },
  { id: 'magenta', main: '#D946EF', accents: ['#A21CAF', '#D946EF', '#F0ABFC'], label: 'Magenta' },
  { id: 'red', main: '#ea384c', accents: ['#BE123C', '#ea384c', '#FB7185'], label: 'Red' },
  { id: 'yellow', main: '#EAB308', accents: ['#A16207', '#EAB308', '#FDE047'], label: 'Yellow' },
  { id: 'tan', main: '#C4A77D', accents: ['#92764A', '#C4A77D', '#E0D5C0'], label: 'Tan' },
  { id: 'olive', main: '#9B8E5E', accents: ['#706640', '#9B8E5E', '#C4BA9A'], label: 'Olive' },
  { id: 'green', main: '#22C55E', accents: ['#15803D', '#22C55E', '#86EFAC'], label: 'Green' },
  { id: 'lime', main: '#84CC16', accents: ['#4D7C0F', '#84CC16', '#BEF264'], label: 'Lime' },
  { id: 'blue', main: '#0EA5E9', accents: ['#0369A1', '#0EA5E9', '#7DD3FC'], label: 'Blue' },
  { id: 'teal', main: '#14B8A6', accents: ['#0F766E', '#14B8A6', '#5EEAD4'], label: 'Teal' },
  { id: 'gray', main: '#6B7280', accents: ['#374151', '#6B7280', '#D1D5DB'], label: 'Gray' },
];

const SettingsGeneral = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('general');
  const updateSetting = useUpdateSetting();
  const { data: locations } = useLocations();
  const [activeSection, setActiveSection] = useState<Section>('payment');

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'general', key, value });
  };

  const handleThemeChange = (colorId: string) => {
    updateSetting.mutate({ section: 'general', key: 'theme_color', value: colorId });
  };

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <Skeleton className="h-64 w-48" />
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

  const menuItems: { id: Section; label: string }[] = [
    { id: 'payment', label: t('settings.general.payment') },
    { id: 'theme', label: t('settings.general.themeColorMenu') },
    { id: 'timezone', label: t('settings.general.timezoneMenu') },
    { id: 'workout', label: t('settings.general.workoutMenu') },
    { id: 'gymCheckin', label: t('settings.general.gymCheckinMenu') },
  ];

  const renderPaymentSection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t('settings.general.paymentMethods')}</h2>
      <p className="text-sm text-muted-foreground">{t('settings.general.paymentDescription')}</p>

      <Accordion type="multiple" className="w-full">
        {/* Bank Transfer */}
        <AccordionItem value="bank-transfer" className="border rounded-lg px-4 mb-3">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-primary font-medium">{t('settings.general.bankTransfer')}</span>
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
                <Button variant="outline" size="sm" className="text-primary border-primary">
                  {t('settings.general.specifyBankAccount')}
                </Button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Credit Card */}
        <AccordionItem value="credit-card" className="border rounded-lg px-4 mb-3">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-primary font-medium">{t('settings.general.creditCard')}</span>
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
                <Button variant="outline" size="sm" className="text-primary border-primary">
                  {t('settings.general.setupStripe')}
                </Button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* QR PromptPay */}
        <AccordionItem value="qr-promptpay" className="border rounded-lg px-4 mb-3">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-primary font-medium">{t('settings.general.qrPromptPay')}</span>
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
                <Button variant="outline" size="sm" className="text-primary border-primary">
                  {t('settings.general.setupStripe')}
                </Button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Tax Invoice */}
        <AccordionItem value="tax-invoice" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-primary font-medium">{t('settings.general.taxInvoice')}</span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground mb-4">{t('settings.general.taxInvoiceDesc')}</p>
            {locations?.map((location) => (
              <div key={location.id} className="flex items-center justify-between py-2 border-t">
                <span className="text-sm">{location.name}</span>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  const renderThemeSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('settings.general.themeColor')}</h2>
      <p className="text-sm text-muted-foreground">{t('settings.general.selectColor')}</p>

      {/* Default color */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">{t('settings.general.defaultColor')}</h3>
        <div
          onClick={() => handleThemeChange('purple')}
          className={cn(
            'w-32 h-24 rounded-lg border-2 cursor-pointer transition-all overflow-hidden',
            themeColor === 'purple' ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
          )}
        >
          <div className="h-6 w-full" style={{ backgroundColor: '#9b87f5' }} />
          <div className="p-2 flex gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6E59A5' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C4B5FD' }} />
          </div>
        </div>
      </div>

      {/* Other colors */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">{t('settings.general.otherColors')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {themeColors.filter(c => c.id !== 'purple').map((color) => (
            <div
              key={color.id}
              onClick={() => handleThemeChange(color.id)}
              className={cn(
                'h-24 rounded-lg border-2 cursor-pointer transition-all overflow-hidden',
                themeColor === color.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
              )}
            >
              <div className="h-6 w-full" style={{ backgroundColor: color.main }} />
              <div className="p-2 flex gap-2">
                {color.accents.map((accent, i) => (
                  <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: accent }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimezoneSection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t('settings.general.timezone')}</h2>
      <p className="text-sm text-muted-foreground">{t('settings.general.selectTimezone')}</p>
      
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <span className="text-sm">Asia/Bangkok (GMT +07:00)</span>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderWorkoutSection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t('settings.general.workout')}</h2>
      
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">{t('settings.general.workoutList')}</Label>
          </div>
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
      <h2 className="text-xl font-semibold">{t('settings.general.gymCheckin')}</h2>
      
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">{t('settings.general.enableGymCheckin')}</Label>
          </div>
          <Switch
            checked={gymCheckinEnabled}
            onCheckedChange={(checked) => handleToggle('gym_checkin_enabled', checked)}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('settings.general.gymCheckinDesc')}</p>
      </div>

      <div className="p-4 border rounded-lg space-y-2">
        <Label className="font-medium">{t('settings.general.specifyCheckinTime')}</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('settings.general.anytime')}</span>
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
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
    <div className="flex gap-6">
      {/* Sidebar */}
      <nav className="w-48 shrink-0">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-md transition-all',
                  activeSection === item.id
                    ? 'text-primary font-medium border-l-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsGeneral;
