import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, HelpCircle } from 'lucide-react';
import { useSettings, getSettingValue } from '@/hooks/useSettings';
import { SettingsLayout } from '@/components/settings';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ClassSection = 'booking' | 'checkin' | 'waitlist' | 'cancellation' | 'noshow';

const SettingsClass = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('class');
  const [activeSection, setActiveSection] = useState<ClassSection>('booking');

  const menuItems = [
    { id: 'booking', label: t('settings.class.booking') },
    { id: 'checkin', label: t('settings.class.checkin') },
    { id: 'waitlist', label: t('settings.class.waitlist') },
    { id: 'cancellation', label: t('settings.class.cancellation') },
    { id: 'noshow', label: t('settings.class.noshow') },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-12 md:h-40 w-full md:w-52" />
        <Skeleton className="h-64 flex-1" />
      </div>
    );
  }

  // Get settings values with defaults
  const bookingAdvanceDays = getSettingValue(settings, 'booking_advance_days', 3);
  const bookingBeforeMins = getSettingValue(settings, 'booking_before_mins', 5);
  const maxSpotsPerMember = getSettingValue(settings, 'max_spots_per_member', 1);
  const checkinBeforeHours = getSettingValue(settings, 'checkin_before_hours', 1);
  const checkinAfterMins = getSettingValue(settings, 'checkin_after_mins', 15);
  const waitlistPromoteHours = getSettingValue(settings, 'waitlist_promote_hours', 1);
  const lateCancelMins = getSettingValue(settings, 'late_cancel_mins', 15);
  const unlimitedCancelLimit = getSettingValue(settings, 'unlimited_cancel_limit', null);
  const sessionCancelLimit = getSettingValue(settings, 'session_cancel_limit', null);
  const sessionRefund = getSettingValue(settings, 'session_refund', false);
  const noshowCount = getSettingValue(settings, 'noshow_count', 2);
  const noshowDays = getSettingValue(settings, 'noshow_days', 7);
  const noshowSuspendDays = getSettingValue(settings, 'noshow_suspend_days', 7);

  // Setting item with edit icon and optional tooltip
  const SettingItem = ({ 
    label, 
    value, 
    tooltip
  }: { 
    label: string; 
    value: string;
    tooltip?: string;
  }) => (
    <div className="space-y-2 py-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-2 group">
        <span className="text-sm font-medium">{value}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-30 cursor-not-allowed"
                disabled
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.comingSoon')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  // Subsection title
  const SubsectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="font-medium text-sm pt-4 pb-2 text-muted-foreground">{children}</h4>
  );

  const renderBookingSection = () => (
    <div className="space-y-2 divide-y">
      <SettingItem 
        label={t('settings.class.bookingAdvanceDesc')} 
        value={t('settings.class.daysBeforeClass').replace('{n}', String(bookingAdvanceDays))} 
      />
      <SettingItem 
        label={t('settings.class.bookingLastDesc')} 
        value={t('settings.class.minsBeforeClass').replace('{n}', String(bookingBeforeMins))} 
      />
      <SettingItem 
        label={t('settings.class.maxSpotsDesc')} 
        value={t('settings.class.seatsOnly').replace('{n}', String(maxSpotsPerMember))} 
      />
    </div>
  );

  const renderCheckinSection = () => (
    <div className="space-y-2 divide-y">
      <SettingItem 
        label={t('settings.class.checkinBeforeDesc')} 
        value={t('settings.class.hoursBeforeClass').replace('{n}', String(checkinBeforeHours))} 
      />
      <SettingItem 
        label={t('settings.class.checkinAfterDesc')} 
        value={t('settings.class.minsAfterClass').replace('{n}', String(checkinAfterMins))} 
      />
    </div>
  );

  const renderWaitlistSection = () => (
    <div className="space-y-2 divide-y">
      <SettingItem 
        label={t('settings.class.waitlistCapacityDesc')} 
        value={t('settings.class.sameAsRoomCapacity')} 
      />
      <SettingItem 
        label={t('settings.class.waitlistPromoteDesc')} 
        value={t('settings.class.hoursBeforeClass').replace('{n}', String(waitlistPromoteHours))} 
      />
    </div>
  );

  const renderCancellationSection = () => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground pb-2">{t('settings.class.cancellationPenaltyDesc')}</p>
      
      <div className="divide-y">
        <SettingItem 
          label={t('settings.class.lateCancelDeadlineDesc')} 
          value={t('settings.class.minsBeforeClass').replace('{n}', String(lateCancelMins))} 
        />
      </div>
      
      <SubsectionTitle>{t('settings.class.unlimitedCancelTitle')}</SubsectionTitle>
      <div className="divide-y">
        <SettingItem 
          label={t('settings.class.unlimitedCancelDesc')} 
          value={unlimitedCancelLimit ? String(unlimitedCancelLimit) : t('settings.class.none')} 
        />
      </div>

      <SubsectionTitle>{t('settings.class.sessionCancelTitle')}</SubsectionTitle>
      <div className="divide-y">
        <SettingItem 
          label={t('settings.class.sessionCancelDesc')} 
          value={sessionCancelLimit ? String(sessionCancelLimit) : t('settings.class.none')} 
        />
        <SettingItem 
          label={t('settings.class.sessionRefundDesc')} 
          value={sessionRefund ? t('common.active') : t('settings.class.noRefund')} 
        />
      </div>
    </div>
  );

  const renderNoshowSection = () => (
    <div className="space-y-2">
      <SubsectionTitle>{t('settings.class.noshowPenaltyTitle')}</SubsectionTitle>
      
      <div className="divide-y">
        <SettingItem 
          label={t('settings.class.noshowPenaltyDesc')} 
          value={t('settings.class.noshowLimit')
            .replace('{n}', String(noshowCount))
            .replace('{days}', String(noshowDays))
            .replace('{suspend}', String(noshowSuspendDays))} 
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'booking':
        return renderBookingSection();
      case 'checkin':
        return renderCheckinSection();
      case 'waitlist':
        return renderWaitlistSection();
      case 'cancellation':
        return renderCancellationSection();
      case 'noshow':
        return renderNoshowSection();
      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      items={menuItems}
      activeId={activeSection}
      onSelect={(id) => setActiveSection(id as ClassSection)}
      withCard={true}
    >
      {renderContent()}
    </SettingsLayout>
  );
};

export default SettingsClass;
