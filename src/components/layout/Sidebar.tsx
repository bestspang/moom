import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, DoorOpen, Calendar, List, Grid3X3, LayoutGrid,
  Users, Star, Tag, Gift, UserCheck, Shield, MapPin,
  FileText, Megaphone, Dumbbell, DollarSign, TrendingUp,
  Settings, ChevronDown, ChevronRight, Briefcase, Wallet,
  Trophy, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, type ResourceKey } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';
import { useTransferSlipStats } from '@/hooks/useTransferSlips';
import { useSidebarCollapse } from './sidebar/useSidebarCollapse';
import { SidebarBranchSwitcher } from './sidebar/SidebarBranchSwitcher';
import { SidebarSearch } from './sidebar/SidebarSearch';
import { SidebarAttentionCard } from './sidebar/SidebarAttentionCard';
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
  urgent?: boolean;
}

interface NavGroup {
  key: string;
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

const GROUPS_KEY = 'moom-sb-groups';

/**
 * NavItem — DS-aligned, token-driven (no hard-coded colors).
 * Active: bg-sidebar-accent + 3px left orange bar + bold orange icon.
 */
const NavItemRow = ({
  item, active, collapsed, onClick,
}: { item: NavItem; active: boolean; collapsed: boolean; onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center rounded-[9px] transition-colors duration-100',
        'h-[34px] mt-px',
        collapsed ? 'justify-center px-0' : 'gap-2.5 pl-3 pr-2.5',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold'
          : 'text-sidebar-foreground hover:bg-sidebar-subtle font-medium',
      )}
    >
      {active && !collapsed && (
        <span className="absolute -left-2 top-2 bottom-2 w-[3px] rounded bg-sidebar-primary animate-fade-in" />
      )}
      <Icon
        className={cn(
          'h-[17px] w-[17px] shrink-0',
          active ? 'text-sidebar-primary' : 'text-sidebar-muted',
        )}
        strokeWidth={active ? 2.3 : 1.9}
      />
      {!collapsed && (
        <>
          <span className="flex-1 text-[13px] truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className={cn(
              'text-[10px] font-extrabold tabular-nums px-1.5 min-w-[20px] h-[18px]',
              'flex items-center justify-center rounded-full',
              item.urgent
                ? 'bg-destructive text-destructive-foreground ring-[3px] ring-destructive/15'
                : active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'bg-sidebar-subtle text-sidebar-muted border border-sidebar-border',
            )}>
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge != null && item.badge > 0 && (
        <span className={cn(
          'absolute top-1 right-2 w-2 h-2 rounded-full ring-2 ring-sidebar',
          item.urgent ? 'bg-destructive' : 'bg-sidebar-primary',
        )} />
      )}
    </NavLink>
  );
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useLanguage();
  const { accessLevel } = useAuth();
  const { can, hasCustomPermissions } = usePermissions();
  const location = useLocation();
  const { collapsed, toggle } = useSidebarCollapse();

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(GROUPS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { people: true, business: true, yourgym: false };
  });

  React.useEffect(() => {
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(openGroups)); } catch {}
  }, [openGroups]);

  // Badge data — existing hooks only
  const { data: stats } = useDashboardStats();
  const { data: expiringPkgs } = useExpiringPackages();
  const { data: slipStats } = useTransferSlipStats();
  const pendingSlips = slipStats?.needs_review || 0;
  const expiringCount = expiringPkgs?.filter(p => p.daysLeft <= 7).length || 0;
  const currentlyIn = stats?.currentlyInClass || 0;

  const toggleGroup = (g: string) =>
    setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const hasAccess = (minLevel?: AccessLevel, resource?: ResourceKey) => {
    // Level gate (AND): user must meet the minimum role level
    if (minLevel) {
      if (!accessLevel) return false;
      if (accessLevelOrder[accessLevel] < accessLevelOrder[minLevel]) return false;
    }
    // Resource gate (AND): respects custom DB permissions or default-by-level
    if (resource) return can(resource, 'read');
    return true;
  };

  const dailyItems: NavItem[] = [
    { label: t('nav.dashboard'), path: '/', icon: Home, resource: 'dashboard' },
    { label: t('nav.lobby'), path: '/lobby', icon: DoorOpen, resource: 'lobby', badge: currentlyIn, urgent: currentlyIn > 0 },
    { label: t('nav.schedule'), path: '/calendar', icon: Calendar, resource: 'schedule' },
  ];

  const navGroups: NavGroup[] = [
    {
      key: 'people',
      label: t('nav.people'),
      icon: Users,
      items: [
        { label: t('nav.members'), path: '/members', icon: Users, resource: 'members', badge: expiringCount },
        { label: t('nav.leads'), path: '/leads', icon: Star, resource: 'leads' },
      ],
    },
    {
      key: 'business',
      label: t('nav.business'),
      icon: Wallet,
      minLevel: 'level_2_operator',
      items: [
        { label: t('nav.packages'), path: '/package', icon: Tag, resource: 'packages' },
        { label: t('nav.promotions'), path: '/promotion', icon: Gift, resource: 'promotions' },
        { label: t('nav.finance'), path: '/finance', icon: DollarSign, resource: 'finance', badge: pendingSlips, urgent: pendingSlips > 0 },
        { label: t('nav.insights'), path: '/insights', icon: TrendingUp, resource: 'reports' },
        { label: t('nav.gamification'), path: '/gamification', icon: Trophy, minLevel: 'level_3_manager', resource: 'gamification' },
      ],
    },
    {
      key: 'yourgym',
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
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (location.pathname === path) return true;
    return location.pathname.startsWith(path + '/');
  };

  const renderItem = (item: NavItem) => {
    if (!hasAccess(item.minLevel, item.resource)) return null;
    return (
      <NavItemRow
        key={item.path}
        item={item}
        active={isActiveRoute(item.path)}
        collapsed={collapsed}
        onClick={onClose}
      />
    );
  };

  const renderGroup = (group: NavGroup) => {
    if (!hasAccess(group.minLevel)) return null;
    const visible = group.items.filter(i => hasAccess(i.minLevel, i.resource));
    if (visible.length === 0) return null;

    if (collapsed) {
      // Collapsed: render items flat, no group header
      return <div key={group.key}>{visible.map(renderItem)}</div>;
    }

    const isOpen = !!openGroups[group.key];
    return (
      <div key={group.key} className="mb-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          className="w-full flex items-center gap-1.5 px-1 py-1.5 text-sidebar-muted-light hover:text-sidebar-muted transition-colors"
        >
          {isOpen
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />}
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {group.label}
          </span>
        </button>
        {isOpen && (
          <div className="space-y-px">
            {visible.map(renderItem)}
          </div>
        )}
      </div>
    );
  };

  const widthClass = collapsed ? 'w-[68px]' : 'w-[220px]';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-14 left-0 bottom-0 z-40',
          'bg-sidebar border-r border-sidebar-border',
          'transition-[width,transform] duration-200 ease-out motion-reduce:transition-none',
          'flex flex-col',
          widthClass,
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand + collapse */}
        <div className={cn('flex items-center gap-2.5', collapsed ? 'px-3.5 pt-3.5 pb-2.5' : 'px-3.5 pt-3.5 pb-2.5')}>
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-white font-black text-base"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--sidebar-primary)), hsl(14 90% 48%))',
              boxShadow: '0 6px 18px -6px hsl(var(--sidebar-primary) / 0.6)',
            }}
          >
            M
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold text-sidebar-foreground -tracking-tight truncate">
                MOOM Gym
              </div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-muted-light">
                Admin
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? (t('common.expand') ?? 'ขยาย') : (t('common.collapse') ?? 'ย่อ')}
            className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-subtle transition-colors shrink-0"
          >
            {collapsed
              ? <PanelLeftOpen className="h-3.5 w-3.5" />
              : <PanelLeftClose className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Branch switcher */}
        <SidebarBranchSwitcher collapsed={collapsed} />

        {/* Search */}
        <SidebarSearch collapsed={collapsed} />

        {/* Scroll area */}
        <ScrollArea className="flex-1">
          <div className={cn(collapsed ? 'px-2.5 pb-2.5' : 'px-3 pb-2.5', 'space-y-px')}>
            {/* Daily items */}
            {dailyItems.map(renderItem)}

            {/* Divider */}
            <div className="h-px bg-sidebar-border my-3 mx-1" />

            {/* Groups */}
            <div className="space-y-1">
              {navGroups.map(renderGroup)}
            </div>
          </div>
        </ScrollArea>

        {/* Attention card (bottom) */}
        <SidebarAttentionCard collapsed={collapsed} />

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-sidebar-border">
            <p className="text-[10px] text-sidebar-muted-light">
              © 2026 MOOM CLUB · {t('common.version')} 1.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
