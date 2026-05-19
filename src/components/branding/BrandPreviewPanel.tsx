import React, { useState } from 'react';
import { Smartphone, Monitor, CreditCard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandKit } from './brandDefaults';
import { MobilePreview } from './previews/MobilePreview';
import { WebPreview } from './previews/WebPreview';
import { CardPreview } from './previews/CardPreview';

type Device = 'mobile' | 'web' | 'card';

interface Props {
  brand: BrandKit;
  previewLabel: string;
  deviceLabels?: Partial<Record<Device, string>>;
}

export const BrandPreviewPanel: React.FC<Props> = ({ brand, previewLabel, deviceLabels }) => {
  const [device, setDevice] = useState<Device>('mobile');

  const tabs: { id: Device; icon: typeof Smartphone; label?: string }[] = [
    { id: 'mobile', icon: Smartphone, label: deviceLabels?.mobile },
    { id: 'web', icon: Monitor, label: deviceLabels?.web },
    { id: 'card', icon: CreditCard, label: deviceLabels?.card },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Header chip */}
      <div className="bg-card border border-border rounded-xl shadow-sm px-3 py-2.5 flex items-center gap-2">
        <Eye className="h-3.5 w-3.5" />
        <span className="text-xs font-bold text-foreground tracking-tight">{previewLabel}</span>
        <div className="flex-1" />
        <div className="flex gap-0.5 p-0.5 bg-muted rounded-md">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = device === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setDevice(t.id)}
                title={t.label || t.id}
                className={cn(
                  'w-8 h-[26px] rounded inline-flex items-center justify-center transition-all',
                  active
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview surface */}
      <div
        key={device}
        className="border border-border rounded-xl shadow-sm flex items-center justify-center overflow-hidden animate-in fade-in-0 duration-200"
        style={{
          minHeight: 660,
          padding: device === 'mobile' ? 20 : 16,
          alignItems: device === 'mobile' ? 'center' : 'flex-start',
          background:
            device === 'mobile'
              ? `linear-gradient(135deg, ${brand.primary}18 0%, ${brand.secondary}10 100%)`
              : 'hsl(var(--card))',
          transition: 'background .3s',
        }}
      >
        {device === 'mobile' && <MobilePreview brand={brand} />}
        {device === 'web' && <WebPreview brand={brand} />}
        {device === 'card' && <CardPreview brand={brand} />}
      </div>
    </div>
  );
};
