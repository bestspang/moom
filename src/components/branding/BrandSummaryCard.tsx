import React from 'react';
import { Tag } from 'lucide-react';
import { BrandSectionCard } from './BrandSectionCard';
import type { BrandKit } from './brandDefaults';

interface Props {
  brand: BrandKit;
  title: string;
  rows: { label: string; value: string }[];
}

/**
 * BrandSummaryCard — compact summary list of current brand values shown
 * under the live preview panel.
 */
export const BrandSummaryCard: React.FC<Props> = ({ brand, title, rows }) => (
  <BrandSectionCard title={title} icon={Tag}>
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-3 text-[12px]">
          <span className="text-muted-foreground font-semibold">{r.label}</span>
          <span className="font-bold text-foreground truncate text-right">{r.value}</span>
        </div>
      ))}
      <div className="flex gap-1.5 pt-2 border-t border-border/60 mt-1">
        {[brand.primary, brand.secondary, brand.accent, brand.surface].map((c, i) => (
          <span
            key={i}
            className="flex-1 h-6 rounded-md"
            style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }}
          />
        ))}
      </div>
    </div>
  </BrandSectionCard>
);
