import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const currentTab = location.pathname.split('/').pop() || 'general';

  const tabs = [
    { value: 'general', label: t('settings.tabs.general'), path: '/setting/general' },
    { value: 'class-management', label: t('settings.tabs.class'), path: '/setting/class-management' },
    { value: 'client-management', label: t('settings.tabs.client'), path: '/setting/client-management' },
    { value: 'setting-package', label: t('settings.tabs.package'), path: '/setting/setting-package' },
    { value: 'member-contracts', label: t('settings.tabs.memberContracts'), path: '/setting/member-contracts' },
  ];

  return (
    <div>
      <PageHeader title={t('settings.title')} breadcrumbs={[{ label: t('settings.title') }]} />
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <NavLink key={tab.value} to={tab.path}>
            <Button variant={location.pathname === tab.path ? 'default' : 'outline'} size="sm">{tab.label}</Button>
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
};

export default Settings;
