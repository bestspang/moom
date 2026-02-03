import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

type ClassSection = 'booking' | 'checkin' | 'waitlist' | 'cancellation' | 'noshow';

const SettingsClass = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('class');
  const updateSetting = useUpdateSetting();
  const [activeSection, setActiveSection] = useState<ClassSection>('booking');

  const menuItems: { id: ClassSection; label: string }[] = [
    { id: 'booking', label: t('settings.class.booking') },
    { id: 'checkin', label: t('settings.class.checkin') },
    { id: 'waitlist', label: t('settings.class.waitlist') },
    { id: 'cancellation', label: t('settings.class.cancellation') },
    { id: 'noshow', label: t('settings.class.noshow') },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-8">
            <Skeleton className="h-40 w-48" />
            <Skeleton className="h-64 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get settings values with defaults
  const bookingAdvanceDays = getSettingValue(settings, 'booking_advance_days', 3);
  const bookingBeforeMins = getSettingValue(settings, 'booking_before_mins', 5);
  const maxSpotsPerMember = getSettingValue(settings, 'max_spots_per_member', 1);
  const checkinBeforeHours = getSettingValue(settings, 'checkin_before_hours', 1);
  const checkinAfterMins = getSettingValue(settings, 'checkin_after_mins', 15);
  const waitlistCapacity = getSettingValue(settings, 'waitlist_capacity', 'same_as_room');
  const waitlistPromoteHours = getSettingValue(settings, 'waitlist_promote_hours', 1);
  const lateCancelMins = getSettingValue(settings, 'late_cancel_mins', 15);
  const unlimitedCancelLimit = getSettingValue(settings, 'unlimited_cancel_limit', null);
  const sessionCancelLimit = getSettingValue(settings, 'session_cancel_limit', null);
  const sessionRefund = getSettingValue(settings, 'session_refund', false);
  const noshowCount = getSettingValue(settings, 'noshow_count', 2);
  const noshowDays = getSettingValue(settings, 'noshow_days', 7);
  const noshowSuspendDays = getSettingValue(settings, 'noshow_suspend_days', 7);

  // Reusable setting item component
  const SettingItem = ({ 
    label, 
    value, 
    required = true 
  }: { 
    label: string; 
    value: string; 
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Subsection title
  const SubsectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="font-medium text-sm border-b pb-2 mb-4">{children}</h4>
  );

  const renderBookingSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.class.booking')}</h3>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.class.checkin')}</h3>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.class.waitlist')}</h3>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.class.cancellation')}</h3>
      
      <div className="space-y-2">
        <Label className="text-sm">{t('settings.class.cancellationPenaltyDesc')}</Label>
      </div>
      
      <SettingItem 
        label={t('settings.class.lateCancelDeadlineDesc')} 
        value={t('settings.class.minsBeforeClass').replace('{n}', String(lateCancelMins))} 
      />
      
      <div className="pt-4">
        <SubsectionTitle>{t('settings.class.unlimitedCancelTitle')}</SubsectionTitle>
        <SettingItem 
          label={t('settings.class.unlimitedCancelDesc')} 
          value={unlimitedCancelLimit ? String(unlimitedCancelLimit) : t('settings.class.none')} 
        />
      </div>

      <div className="pt-4">
        <SubsectionTitle>{t('settings.class.sessionCancelTitle')}</SubsectionTitle>
        <SettingItem 
          label={t('settings.class.sessionCancelDesc')} 
          value={sessionCancelLimit ? String(sessionCancelLimit) : t('settings.class.none')} 
        />
        <div className="mt-4">
          <SettingItem 
            label={t('settings.class.sessionRefundDesc')} 
            value={sessionRefund ? t('common.active') : t('settings.class.noRefund')} 
          />
        </div>
      </div>
    </div>
  );

  const renderNoshowSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.class.noshow')}</h3>
      
      <SubsectionTitle>{t('settings.class.noshowPenaltyTitle')}</SubsectionTitle>
      
      <SettingItem 
        label={t('settings.class.noshowPenaltyDesc')} 
        value={t('settings.class.noshowLimit')
          .replace('{n}', String(noshowCount))
          .replace('{days}', String(noshowDays))
          .replace('{suspend}', String(noshowSuspendDays))} 
      />
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
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-48 shrink-0">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
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
      </CardContent>
    </Card>
  );
};

export default SettingsClass;
