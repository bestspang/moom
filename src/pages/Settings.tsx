import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  BookOpen,
  Users,
  Package,
  FileSignature,
  Flag,
  Upload,
  Plug,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminPageHeader } from '@/components/admin-ds/AdminPageHeader';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Settings = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const tabs = [
    { value: 'general', label: t('settings.tabs.general'), path: '/setting/general', icon: SettingsIcon },
    { value: 'class-management', label: t('settings.tabs.class'), path: '/setting/class-management', icon: BookOpen },
    { value: 'client-management', label: t('settings.tabs.client'), path: '/setting/client-management', icon: Users },
    { value: 'setting-package', label: t('settings.tabs.package'), path: '/setting/setting-package', icon: Package },
    { value: 'member-contracts', label: t('settings.tabs.memberContracts'), path: '/setting/member-contracts', icon: FileSignature },
    { value: 'feature-flags', label: t('settings.tabs.featureFlags'), path: '/setting/feature-flags', icon: Flag },
    { value: 'import-export', label: t('settings.tabs.importExport'), path: '/setting/import-export', icon: Upload },
    { value: 'integrations', label: t('settings.tabs.integrations'), path: '/setting/integrations', icon: Plug },
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path)?.value || 'general';
  const subtitle = tabs.map(tb => tb.label).join(' · ');

  // Mobile: dropdown selector
  if (isMobile) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title={t('settings.title')} subtitle={subtitle} />
        <Select
          value={currentTab}
          onValueChange={(value) => {
            const tab = tabs.find(tb => tb.value === value);
            if (tab) navigate(tab.path);
          }}
        >
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
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <Outlet />
        </div>
      </div>
    );
  }

  // Desktop: left vertical icon nav + content
  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('settings.title')} subtitle={subtitle} />

      <div className="flex gap-6 items-start">
        <nav
          role="tablist"
          aria-label={t('settings.title')}
          className="w-[220px] flex-shrink-0 flex flex-col gap-1"
        >
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.value}
                to={tab.path}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          role="tabpanel"
          className="flex-1 min-w-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Settings;
