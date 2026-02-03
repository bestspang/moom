import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusTab {
  key: string;
  label: string;
  count: number;
  color?: 'default' | 'teal' | 'orange' | 'red' | 'gray';
}

interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export const StatusTabs = ({ tabs, activeTab, onChange }: StatusTabsProps) => {
  const getColorClasses = (color: StatusTab['color'], isActive: boolean) => {
    if (isActive) {
      return 'bg-primary text-primary-foreground';
    }

    switch (color) {
      case 'teal':
        return 'text-accent-teal';
      case 'orange':
        return 'text-primary';
      case 'red':
        return 'text-destructive';
      case 'gray':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'border border-border hover:bg-accent',
              isActive && 'border-primary',
              getColorClasses(tab.color, isActive)
            )}
          >
            {tab.label} ({tab.count})
          </button>
        );
      })}
    </div>
  );
};
