import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  DoorOpen,
  Calendar,
  LayoutGrid,
  List,
  Grid3X3,
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
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useLanguage();
  const location = useLocation();
  const [openGroups, setOpenGroups] = React.useState<string[]>(['class', 'client', 'package', 'yourGym', 'finance']);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const navItems: (NavItem | NavGroup)[] = [
    { label: t('nav.dashboard'), path: '/', icon: Home },
    { label: t('nav.lobby'), path: '/lobby', icon: DoorOpen },
    {
      label: t('nav.class'),
      items: [
        { label: t('nav.schedule'), path: '/calendar', icon: Calendar },
        { label: t('nav.roomLayouts'), path: '/room', icon: LayoutGrid },
        { label: t('nav.classList'), path: '/class', icon: List },
        { label: t('nav.classCategories'), path: '/class-category', icon: Grid3X3 },
      ],
    },
    {
      label: t('nav.client'),
      items: [
        { label: t('nav.members'), path: '/members', icon: Users },
        { label: t('nav.leads'), path: '/leads', icon: Star },
      ],
    },
    {
      label: t('nav.package'),
      items: [
        { label: t('nav.packages'), path: '/package', icon: Tag },
        { label: t('nav.promotions'), path: '/promotion', icon: Gift },
      ],
    },
    {
      label: t('nav.yourGym'),
      items: [
        { label: t('nav.staff'), path: '/admin', icon: UserCheck },
        { label: t('nav.roles'), path: '/roles', icon: Shield },
        { label: t('nav.locations'), path: '/location', icon: MapPin },
        { label: t('nav.activityLog'), path: '/activity-log', icon: FileText },
        { label: t('nav.announcements'), path: '/announcement', icon: Megaphone },
        { label: t('nav.workoutList'), path: '/workout-list', icon: Dumbbell },
      ],
    },
    {
      label: t('nav.finance'),
      items: [
        { label: t('nav.transferSlips'), path: '/transfer-slip', icon: Receipt },
        { label: t('nav.finance'), path: '/finance', icon: DollarSign },
      ],
    },
    { label: t('nav.reports'), path: '/report/member', icon: BarChart3 },
    { label: t('nav.settings'), path: '/setting/general', icon: Settings },
  ];

  const isNavItem = (item: NavItem | NavGroup): item is NavItem => {
    return 'path' in item;
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isActiveRoute(item.path);

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => onClose()}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const renderNavGroup = (group: NavGroup, groupKey: string) => {
    const isOpen = openGroups.includes(groupKey);
    const hasActiveChild = group.items.some((item) => isActiveRoute(item.path));

    return (
      <Collapsible
        key={groupKey}
        open={isOpen}
        onOpenChange={() => toggleGroup(groupKey)}
      >
        <CollapsibleTrigger
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            hasActiveChild
              ? 'text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <span>{group.label}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1 mt-1">
          {group.items.map(renderNavItem)}
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
          'fixed top-16 left-0 bottom-0 w-[220px] bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {navItems.map((item, index) => {
              if (isNavItem(item)) {
                return renderNavItem(item);
              } else {
                const groupKey = item.label.toLowerCase().replace(/\s+/g, '');
                return (
                  <div key={groupKey}>
                    {index > 0 && <div className="my-3 border-t border-sidebar-border" />}
                    {renderNavGroup(item, groupKey)}
                  </div>
                );
              }
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border mt-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="#" className="block hover:text-primary">
                {t('common.termsAndConditions')}
              </a>
              <a href="#" className="block hover:text-primary">
                {t('common.privacyPolicy')}
              </a>
              <p className="pt-2">© 2026 MOOM CLUB | {t('common.version')} 0.0.1</p>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
