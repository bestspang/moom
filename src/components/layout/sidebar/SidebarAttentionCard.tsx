import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransferSlipStats } from '@/hooks/useTransferSlips';
import { useExpiringPackages } from '@/hooks/useExpiringPackages';

interface Props {
  collapsed: boolean;
}

/**
 * Attention card — DS sidebar bottom widget.
 * Reads ONLY existing hooks. Hides items with count 0; hides whole card if empty.
 */
export const SidebarAttentionCard = ({ collapsed }: Props) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: slipStats } = useTransferSlipStats();
  const { data: expiringPkgs } = useExpiringPackages();

  if (collapsed) return null;

  const pendingSlips = slipStats?.needs_review || 0;
  const expiringCount = expiringPkgs?.filter(p => p.daysLeft <= 7).length || 0;

  const items: Array<{
    icon: React.ElementType;
    color: string;
    text: string;
    sub: string;
    go: string;
  }> = [];

  if (pendingSlips > 0) {
    items.push({
      icon: DollarSign,
      color: 'text-destructive',
      text: t('sidebar.attentionSlips') ?? `${pendingSlips} สลิปรอตรวจ`,
      sub: `${pendingSlips}`,
      go: '/finance',
    });
  }
  if (expiringCount > 0) {
    items.push({
      icon: Clock,
      color: 'text-warning',
      text: t('sidebar.attentionExpiring') ?? `${expiringCount} แพ็กเกจใกล้หมด`,
      sub: '≤7 วัน',
      go: '/members',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="px-3 pb-2.5">
      <div className="rounded-[11px] border border-sidebar-border bg-sidebar-subtle p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <AlertCircle className="h-3 w-3 text-sidebar-muted-light" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-sidebar-muted-light">
            {t('sidebar.attentionTitle') ?? 'ต้องการความสนใจ'}
          </span>
        </div>
        <div className="space-y-0.5">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => navigate(it.go)}
                className="w-full flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-sidebar transition-colors text-left"
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', it.color)} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-semibold text-sidebar-foreground truncate">
                    {it.text}
                  </span>
                  <span className="block text-[10px] text-sidebar-muted-light">
                    {it.sub}
                  </span>
                </span>
                <ChevronRight className="h-2.5 w-2.5 text-sidebar-muted-light shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
