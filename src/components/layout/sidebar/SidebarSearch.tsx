import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { dispatchCommand } from '@/lib/commandEvents';

interface Props {
  collapsed: boolean;
}

/**
 * Sidebar search trigger — opens the existing CommandPalette (Cmd/Ctrl+K).
 * We do NOT duplicate the palette; we reuse it via the global keyboard event.
 */
export const SidebarSearch = ({ collapsed }: Props) => {
  const { t } = useLanguage();

  const openPalette = () => {
    // Dispatch the same keyboard event the palette listens for
    dispatchCommand('command-palette:open');
    // Fallback: synthesize Cmd+K
    const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true });
    window.dispatchEvent(ev);
  };

  if (collapsed) {
    return (
      <div className="px-2.5 pb-2.5">
        <button
          type="button"
          onClick={openPalette}
          title={t('common.search') ?? 'ค้นหา (⌘K)'}
          className="w-full h-[34px] rounded-[9px] bg-sidebar-subtle text-sidebar-muted hover:text-sidebar-foreground transition-colors flex items-center justify-center"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pb-2.5">
      <button
        type="button"
        onClick={openPalette}
        className={cn(
          'w-full h-[34px] rounded-[9px] bg-sidebar-subtle border border-sidebar-border',
          'px-2.5 flex items-center gap-2 text-left transition-colors',
          'hover:bg-sidebar-accent/40',
        )}
      >
        <Search className="h-3 w-3 text-sidebar-muted shrink-0" />
        <span className="flex-1 text-[12px] text-sidebar-muted-light truncate">
          {t('common.search') ?? 'ค้นหา หรือกด ⌘K…'}
        </span>
        <kbd className="text-[9px] font-bold text-sidebar-muted bg-sidebar border border-sidebar-border px-1.5 py-px rounded">
          ⌘K
        </kbd>
      </button>
    </div>
  );
};
