import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';
import { SettingsLayout } from '@/components/settings';

type ClientSection = 'injured' | 'suspended' | 'paused';

const SettingsClient = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('client');
  const updateSetting = useUpdateSetting();
  const [activeSection, setActiveSection] = useState<ClientSection>('injured');

  const menuItems = [
    { id: 'injured', label: t('settings.client.injuredMembers') },
    { id: 'suspended', label: t('settings.client.suspendedMembers') },
    { id: 'paused', label: t('settings.client.pausedMembers') },
  ];

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'client', key, value });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-12 md:h-32 w-full md:w-52" />
        <Skeleton className="h-48 flex-1" />
      </div>
    );
  }

  // Get settings values
  const injuredAllowAll = getSettingValue(settings, 'injured_allow_all_bookings', true);
  const injuredBookOnMobile = getSettingValue(settings, 'injured_book_on_mobile', true);
  const injuredBookOnConsole = getSettingValue(settings, 'injured_book_on_console', true);
  
  const suspendedAllowAll = getSettingValue(settings, 'suspended_allow_all_bookings', false);
  const suspendedBookOnMobile = getSettingValue(settings, 'suspended_book_on_mobile', false);
  const suspendedBookOnConsole = getSettingValue(settings, 'suspended_book_on_console', false);
  
  const pausedAllowReactivate = getSettingValue(settings, 'paused_allow_reactivate', true);

  // Toggle component with flex layout for proper alignment
  const ToggleItem = ({ 
    label, 
    description,
    checked, 
    onCheckedChange 
  }: { 
    label: string; 
    description?: string;
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="py-3 border-b last:border-b-0">
      <div className="flex items-start gap-3">
        <Switch 
          checked={checked} 
          onCheckedChange={onCheckedChange}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderInjuredSection = () => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground pb-2">{t('settings.client.injuredDesc')}</p>
      
      <div>
        <ToggleItem
          label={t('settings.client.allowAllInjured')}
          checked={injuredAllowAll}
          onCheckedChange={(checked) => handleToggle('injured_allow_all_bookings', checked)}
        />
        
        <ToggleItem
          label={t('settings.client.bookOnGymmoApp')}
          description={t('settings.client.bookOnGymmoAppDesc')}
          checked={injuredBookOnMobile}
          onCheckedChange={(checked) => handleToggle('injured_book_on_mobile', checked)}
        />
        
        <ToggleItem
          label={t('settings.client.bookOnGymmoConsole')}
          description={t('settings.client.bookOnGymmoConsoleDesc')}
          checked={injuredBookOnConsole}
          onCheckedChange={(checked) => handleToggle('injured_book_on_console', checked)}
        />
      </div>
    </div>
  );

  const renderSuspendedSection = () => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground pb-2">{t('settings.client.suspendedDesc')}</p>
      
      <div>
        <ToggleItem
          label={t('settings.client.allowAllSuspended')}
          checked={suspendedAllowAll}
          onCheckedChange={(checked) => handleToggle('suspended_allow_all_bookings', checked)}
        />
        
        <ToggleItem
          label={t('settings.client.bookOnGymmoApp')}
          description={t('settings.client.suspendedBookOnAppDesc')}
          checked={suspendedBookOnMobile}
          onCheckedChange={(checked) => handleToggle('suspended_book_on_mobile', checked)}
        />
        
        <ToggleItem
          label={t('settings.client.bookOnGymmoConsole')}
          description={t('settings.client.suspendedBookOnConsoleDesc')}
          checked={suspendedBookOnConsole}
          onCheckedChange={(checked) => handleToggle('suspended_book_on_console', checked)}
        />
      </div>
    </div>
  );

  const renderPausedSection = () => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground pb-2">{t('settings.client.pausedDesc')}</p>
      
      <div>
        <ToggleItem
          label={t('settings.client.allowReactivate')}
          description={t('settings.client.pausedReactivateDesc')}
          checked={pausedAllowReactivate}
          onCheckedChange={(checked) => handleToggle('paused_allow_reactivate', checked)}
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'injured':
        return renderInjuredSection();
      case 'suspended':
        return renderSuspendedSection();
      case 'paused':
        return renderPausedSection();
      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      items={menuItems}
      activeId={activeSection}
      onSelect={(id) => setActiveSection(id as ClientSection)}
      withCard={true}
    >
      {renderContent()}
    </SettingsLayout>
  );
};

export default SettingsClient;
