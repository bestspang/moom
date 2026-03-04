import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface LiffBottomNavProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const LiffBottomNav: React.FC<LiffBottomNavProps> = ({
  items,
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
              'text-xs font-medium',
              activeTab === item.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="truncate max-w-[64px]">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
