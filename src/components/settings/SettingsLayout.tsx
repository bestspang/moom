import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { SettingsSidebar } from './SettingsSidebar';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  label: string;
}

interface SettingsLayoutProps {
  items: MenuItem[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  withCard?: boolean;
}

export const SettingsLayout = ({ 
  items, 
  activeId, 
  onSelect, 
  children,
  withCard = true 
}: SettingsLayoutProps) => {
  const isMobile = useIsMobile();

  const content = (
    <div className={cn(
      isMobile ? 'flex flex-col' : 'flex gap-8'
    )}>
      <SettingsSidebar items={items} activeId={activeId} onSelect={onSelect} />
      <div className={cn(
        'flex-1 min-w-0',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
      )}>
        {children}
      </div>
    </div>
  );

  if (!withCard) {
    return content;
  }

  return (
    <Card>
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>
  );
};
