import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  DoorOpen,
  Calendar,
  List,
  Grid3X3,
  LayoutGrid,
  Users,
  Star,
  Tag,
  Gift,
  UserCheck,
  Shield,
  MapPin,
  FileText,
  Megaphone,
  Dumbbell,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Wallet,
  UserPlus,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, type ResourceKey } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import { useTransferSlipStats } from '@/hooks/useFinance';
import type { Database } from '@/integrations/supabase/types';

type AccessLevel = Database['public']['Enums']['access_level'];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  minLevel?: AccessLevel;
  resource?: ResourceKey;
  badge?: number;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  minLevel?: AccessLevel;
}

const accessLevelOrder: Record<AccessLevel, number> = {
  level_1_minimum: 1,
  level_2_operator: 2,
  level_3_manager: 3,
  level_4_master: 4,
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useLanguage();
  const { accessLevel } = useAuth();
  const { can, hasCustomPermissions } = usePermissions();
  const location = useLocation();
  const [openGroups, setOpenGroups] = React.useState<string[]>(['people', 'business', 'yourgym']);

  // Badge data
  const { data: expiringPkgs } = useExpiringPackages();
  const { data: slipStats } = useTransferSlipStats();
  const pendingSlips = slipStats?.needs_review || 0;
  const expiringCount = expiringPkgs?.filter(p => p.daysLeft <= 7).length || 0;

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const hasAccess = (minLevel?: AccessLevel, resource?: ResourceKey) => {
    if (hasCustomPermissions && resource) {
      return can(resource, 'read');
    }
    if (!minLevel) return true;
    if (!accessLevel) return false;
    return accessLevelOrder[accessLevel] >= accessLevelOrder[minLevel];
  };

  // Restructured: Daily (flat) → People → Business → Your Gym
  const dailyItems: NavItem[] = [
    { label: t('nav.dashboard'), path: '/', icon: Home, resource: 'dashboard' },
    { label: t('nav.lobby'), path: '/lobby', icon: DoorOpen, resource: 'lobby' },
    { label: t('nav.schedule'), path: '/calendar', icon: Calendar, resource: 'schedule' },
  ];

  const navGroups: { key: string; group: NavGroup }[] = [
    {
      key: 'people',
      group: {
        label: t('nav.people'),
        icon: Users,
        items: [
          { label: t('nav.members'), path: '/members', icon: Users, resource: 'members', badge: expiringCount },
          { label: t('nav.leads'), path: '/leads', icon: Star, resource: 'leads' },
        ],
      },
    },
    {
      key: 'business',
      group: {
        label: t('nav.business'),
        icon: Wallet,
        minLevel: 'level_2_operator',
        items: [
          { label: t('nav.packages'), path: '/package', icon: Tag, resource: 'packages' },
          { label: t('nav.promotions'), path: '/promotion', icon: Gift, resource: 'promotions' },
          { label: t('nav.finance'), path: '/finance', icon: DollarSign, resource: 'finance', badge: pendingSlips },
          { label: t('nav.reports'), path: '/report', icon: BarChart3, resource: 'reports' },
        ],
      },
    },
    {
      key: 'yourgym',
      group: {
        label: t('nav.yourGym'),
        icon: Briefcase,
        minLevel: 'level_2_operator',
        items: [
          { label: t('nav.classList'), path: '/class', icon: List, resource: 'classes' },
          { label: t('nav.classCategories'), path: '/class-category', icon: Grid3X3, resource: 'class_categories' },
          { label: t('nav.roomLayouts'), path: '/room', icon: LayoutGrid, resource: 'rooms' },
          { label: t('nav.workoutList'), path: '/workout-list', icon: Dumbbell, resource: 'workout_list' },
          { label: t('nav.staff'), path: '/admin', icon: UserCheck, minLevel: 'level_3_manager', resource: 'staff' },
          { label: t('nav.roles'), path: '/roles', icon: Shield, minLevel: 'level_4_master', resource: 'roles' },
          { label: t('nav.locations'), path: '/location', icon: MapPin, minLevel: 'level_3_manager', resource: 'locations' },
          { label: t('nav.announcements'), path: '/announcement', icon: Megaphone, resource: 'announcements' },
          { label: t('nav.activityLog'), path: '/activity-log', icon: FileText, resource: 'activity_log' },
          { label: t('nav.settings'), path: '/setting/general', icon: Settings, minLevel: 'level_3_manager', resource: 'settings' },
        ],
      },
    },
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    if (!hasAccess(item.minLevel, item.resource)) return null;
    
    const Icon = item.icon;
    const isActive = isActiveRoute(item.path);

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => onClose()}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none font-semibold">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const renderNavGroup = (group: NavGroup, groupKey: string) => {
    if (!hasAccess(group.minLevel)) return null;
    
    const visibleItems = group.items.filter((item) => hasAccess(item.minLevel, item.resource));
    if (visibleItems.length === 0) return null;
    
    const isOpen = openGroups.includes(groupKey);
    const hasActiveChild = visibleItems.some((item) => isActiveRoute(item.path));
    const GroupIcon = group.icon;

    return (
      <Collapsible
        key={groupKey}
        open={isOpen}
        onOpenChange={() => toggleGroup(groupKey)}
      >
        <CollapsibleTrigger
          className={cn(
            'flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
            hasActiveChild
              ? 'text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <GroupIcon className="h-4 w-4 flex-shrink-0" />
            <span>{group.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1 mt-1">
          {visibleItems.map(renderNavItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 bottom-0 w-[200px] bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {/* Daily items — always visible, no group header */}
            {dailyItems.map(renderNavItem)}

            {/* Grouped sections */}
            {navGroups.map(({ key, group }, index) => {
              const rendered = renderNavGroup(group, key);
              if (!rendered) return null;
              return (
                <div key={key}>
                  <div className="my-3 border-t border-sidebar-border" />
                  {rendered}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border mt-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="pt-2">© 2026 MOOM CLUB | {t('common.version')} 0.0.1</p>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
