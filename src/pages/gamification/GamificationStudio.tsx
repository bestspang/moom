import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
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

const GamificationStudio = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const tabs = [
    { value: 'overview', label: t('gamification.tabs.overview'), path: '/gamification/overview' },
    { value: 'rules', label: t('gamification.tabs.rules'), path: '/gamification/rules' },
    { value: 'levels', label: t('gamification.tabs.levels'), path: '/gamification/levels' },
    { value: 'challenges', label: t('gamification.tabs.challenges'), path: '/gamification/challenges' },
    { value: 'badges', label: t('gamification.tabs.badges'), path: '/gamification/badges' },
    { value: 'rewards', label: t('gamification.tabs.rewards'), path: '/gamification/rewards' },
    { value: 'trainers', label: t('gamification.tabs.trainers'), path: '/gamification/trainers' },
    { value: 'risk', label: t('gamification.tabs.risk'), path: '/gamification/risk' },
  ];

  const currentTab = tabs.find(tab => location.pathname === tab.path)?.value || 'overview';

  if (isMobile) {
    return (
      <div>
        <PageHeader title={t('gamification.title')} breadcrumbs={[{ label: t('gamification.title') }]} />
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
                <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
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

  return (
    <div>
      <PageHeader title={t('gamification.title')} breadcrumbs={[{ label: t('gamification.title') }]} />
      <ScrollArea className="w-full mb-6">
        <nav role="tablist" aria-label={t('gamification.title')} className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.value}
                to={tab.path}
                role="tab"
                aria-selected={isActive}
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
      <div role="tabpanel" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <Outlet />
      </div>
    </div>
  );
};

export default GamificationStudio;
