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

/**
 * DS-aligned segmented chip group (mirrors MOOM Admin UI Kit toolbar chips).
 * Active = white surface on tinted track + bold weight + count badge in primary tint.
 */
export const StatusTabs = ({ tabs, activeTab, onChange }: StatusTabsProps) => {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 mb-4 rounded-xl bg-muted/60 border border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-bold transition-all',
              isActive
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10px] font-extrabold tabular-nums',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-border/60 text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
