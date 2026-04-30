import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { cn } from '@/lib/utils';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useRealtimeSync();
  const location = useLocation();

  return (
    <div className="surface-admin min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <CommandPalette />
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main
        id="main-content"
        className={cn(
          'pt-14 min-h-screen transition-all duration-300',
          'lg:pl-[200px]'
        )}
      >
        <div
          key={location.pathname}
          className="p-3 md:p-5 animate-page-enter-desktop"
        >
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
