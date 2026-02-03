import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSetting, getSettingValue } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

type ClientSection = 'injured' | 'suspended' | 'paused';

const SettingsClient = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useSettings('client');
  const updateSetting = useUpdateSetting();
  const [activeSection, setActiveSection] = useState<ClientSection>('injured');

  const menuItems: { id: ClientSection; label: string }[] = [
    { id: 'injured', label: t('settings.client.injuredMembers') },
    { id: 'suspended', label: t('settings.client.suspendedMembers') },
    { id: 'paused', label: t('settings.client.pausedMembers') },
  ];

  const handleToggle = (key: string, value: boolean) => {
    updateSetting.mutate({ section: 'client', key, value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-8">
            <Skeleton className="h-32 w-48" />
            <Skeleton className="h-48 flex-1" />
          </div>
        </CardContent>
      </Card>
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

  // Reusable toggle component
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
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground ml-12">{description}</p>
      )}
    </div>
  );

  const renderInjuredSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.client.injuredMembers')}</h3>
      <p className="text-sm text-muted-foreground">{t('settings.client.injuredDesc')}</p>
      
      <div className="space-y-4">
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.client.suspendedMembers')}</h3>
      <p className="text-sm text-muted-foreground">{t('settings.client.suspendedDesc')}</p>
      
      <div className="space-y-4">
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary">{t('settings.client.pausedMembers')}</h3>
      <p className="text-sm text-muted-foreground">{t('settings.client.pausedDesc')}</p>
      
      <div className="space-y-4">
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
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 shrink-0">
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

export default SettingsClient;
