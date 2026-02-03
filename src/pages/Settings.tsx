import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Settings = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const tabs = [
    { value: 'general', label: t('settings.tabs.general'), path: '/setting/general' },
    { value: 'class-management', label: t('settings.tabs.class'), path: '/setting/class-management' },
    { value: 'client-management', label: t('settings.tabs.client'), path: '/setting/client-management' },
    { value: 'setting-package', label: t('settings.tabs.package'), path: '/setting/setting-package' },
    { value: 'member-contracts', label: t('settings.tabs.memberContracts'), path: '/setting/member-contracts' },
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path)?.value || 'general';

  // Mobile: Dropdown selector
  if (isMobile) {
    return (
      <div>
        <PageHeader title={t('settings.title')} breadcrumbs={[{ label: t('settings.title') }]} />
        
        <div className="mb-6">
          <Select value={currentTab} onValueChange={(value) => {
            const tab = tabs.find(t => t.value === value);
            if (tab) navigate(tab.path);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <Outlet />
        </div>
      </div>
    );
  }

  // Desktop: Tab navigation
  return (
    <div>
      <PageHeader title={t('settings.title')} breadcrumbs={[{ label: t('settings.title') }]} />
      
      {/* Accessible tab navigation with horizontal scroll */}
      <ScrollArea className="w-full mb-6">
        <nav 
          role="tablist" 
          aria-label={t('settings.title')}
          className="flex gap-1 p-1 bg-muted rounded-lg w-fit"
        >
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <NavLink 
                key={tab.value} 
                to={tab.path}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.value}-panel`}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                {tab.label}
              </NavLink>
            );
          })}
        </nav>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Tab panel */}
      <div 
        role="tabpanel"
        id={`${location.pathname.split('/').pop()}-panel`}
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
