import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useRealtimeSync();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main
        id="main-content"
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          'lg:pl-[220px]'
        )}
      >
        <div 
          key={location.pathname}
          className="p-4 md:p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
