import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocations } from '@/hooks/useLocations';
import { useLanguage } from '@/contexts/LanguageContext';

const KEY = 'moom-active-location';

interface Props {
  collapsed: boolean;
}

/**
 * Branch switcher — DS-aligned. Persists selected branch to localStorage.
 * Does NOT thread selection into queries yet (out of scope; future chunk).
 */
export const SidebarBranchSwitcher = ({ collapsed }: Props) => {
  const { t } = useLanguage();
  const { data: locations = [] } = useLocations('open');
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEY);
  });

  // Default to first location if none selected
  useEffect(() => {
    if (!activeId && locations.length > 0) {
      setActiveId(locations[0].id);
    }
  }, [locations, activeId]);

  const active = locations.find(l => l.id === activeId) || locations[0];

  const handleSelect = (id: string) => {
    setActiveId(id);
    try { localStorage.setItem(KEY, id); } catch {}
    setOpen(false);
  };

  if (locations.length === 0) return null;

  return (
    <div className={cn('relative', collapsed ? 'px-2.5 pb-2.5' : 'px-3 pb-2.5')}>
      <button
        type="button"
        onClick={() => !collapsed && setOpen(o => !o)}
        title={collapsed ? active?.name : undefined}
        className={cn(
          'w-full rounded-[10px] border border-sidebar-border bg-sidebar text-left',
          'flex items-center gap-2.5 transition-colors',
          'hover:bg-sidebar-subtle',
          open && 'bg-sidebar-subtle',
          collapsed ? 'h-11 justify-center px-0' : 'h-12 px-2.5',
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground shrink-0">
          <MapPin className="h-3.5 w-3.5" />
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-bold text-sidebar-foreground truncate">
                {active?.name || t('common.loading')}
              </span>
              <span className="block text-[10px] text-sidebar-muted-light mt-0.5">
                {t('locations.switchBranch') ?? 'สลับสาขา'}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-sidebar-muted-light transition-transform duration-150',
                open && 'rotate-180',
              )}
            />
          </>
        )}
      </button>

      {open && !collapsed && (
        <div
          className="absolute left-3 right-3 top-full z-20 mt-1 rounded-[10px] border border-sidebar-border bg-sidebar p-1.5 shadow-lg animate-fade-in"
        >
          {locations.map(loc => {
            const isActive = loc.id === activeId;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc.id)}
                className={cn(
                  'w-full rounded-md px-2.5 py-2 text-left flex items-center gap-2 transition-colors',
                  isActive
                    ? 'bg-sidebar-accent'
                    : 'hover:bg-sidebar-subtle',
                )}
              >
                <span className="flex-1 min-w-0">
                  <span className={cn(
                    'block text-[12px] font-bold truncate',
                    isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground',
                  )}>
                    {loc.name}
                  </span>
                  {loc.location_id && (
                    <span className="block text-[10px] text-sidebar-muted-light mt-0.5 truncate">
                      {loc.location_id}
                    </span>
                  )}
                </span>
                {isActive && <Check className="h-3.5 w-3.5 text-sidebar-accent-foreground shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
