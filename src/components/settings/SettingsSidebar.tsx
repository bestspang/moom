import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MenuItem {
  id: string;
  label: string;
}

interface SettingsSidebarProps {
  items: MenuItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const SettingsSidebar = ({ items, activeId, onSelect }: SettingsSidebarProps) => {
  const isMobile = useIsMobile();

  // Mobile: Show dropdown selector
  if (isMobile) {
    return (
      <div className="w-full mb-6">
        <Select value={activeId} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Desktop: Show sidebar
  return (
    <nav className="w-52 shrink-0" role="navigation" aria-label="Settings sections">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item.id)}
              aria-current={activeId === item.id ? 'page' : undefined}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded-md transition-all',
                activeId === item.id
                  ? 'bg-muted text-foreground font-medium border-l-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
