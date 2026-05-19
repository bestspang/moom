import React, { useState } from 'react';
import { Smartphone, Monitor, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandKit } from './brandDefaults';
import { LogoMark, PhotoBlock } from './LogoMark';

type Device = 'mobile' | 'web' | 'card';

const MobilePreview: React.FC<{ brand: BrandKit }> = ({ brand }) => (
  <div
    className="mx-auto w-[260px] rounded-[28px] overflow-hidden shadow-lg border-[6px] border-foreground/90"
    style={{ background: brand.surface, fontFamily: `"${brand.font}", sans-serif` }}
  >
    <div className="px-4 pt-3 pb-2 text-[10px] flex justify-between" style={{ color: brand.secondary }}>
      <span>9:41</span>
      <span>•••</span>
    </div>
    <div className="px-3 pb-4 space-y-3">
      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
        <LogoMark brand={brand} size={32} />
        <div className="min-w-0">
          <div className="text-[12px] font-bold leading-tight" style={{ color: brand.secondary, fontWeight: brand.fontWeight }}>
            {brand.name}
          </div>
          <div className="text-[9px] truncate" style={{ color: brand.secondary, opacity: 0.6 }}>
            {brand.tagline}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-3 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})`, borderRadius: brand.radius }}
      >
        <div className="text-[9px] font-bold opacity-90">TODAY</div>
        <div className="text-[16px] font-extrabold leading-tight mt-0.5" style={{ fontWeight: brand.fontWeight }}>
          HIIT · 18:00
        </div>
        <div className="flex gap-1.5 mt-2">
          <span className="text-[9px] px-2 py-1 rounded-full bg-white/25 backdrop-blur">จองคลาส</span>
          <span className="text-[9px] px-2 py-1 rounded-full bg-white/15">ดูรายละเอียด</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {['ทั้งหมด', 'HIIT', 'Yoga'].map((t, i) => (
          <span
            key={t}
            className="text-[9px] px-2 py-1 rounded-full"
            style={{
              background: i === 0 ? brand.primary : 'rgba(0,0,0,0.05)',
              color: i === 0 ? brand.surface : brand.secondary,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {[
        { n: '07', t: 'Yoga Flow', s: '12/16' },
        { n: '12', t: 'Spin Express', s: '18/20' },
      ].map((row) => (
        <div key={row.n} className="flex items-center gap-2 p-2 rounded-lg bg-white">
          <div className="text-[12px] font-extrabold w-6 text-center" style={{ color: brand.primary, fontWeight: brand.fontWeight }}>
            {row.n}
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold" style={{ color: brand.secondary }}>{row.t}</div>
            <div className="h-0.5 rounded-full mt-1" style={{ background: brand.accent, width: '60%' }} />
          </div>
          <div className="text-[9px]" style={{ color: brand.secondary, opacity: 0.6 }}>{row.s}</div>
        </div>
      ))}
    </div>
  </div>
);

const WebPreview: React.FC<{ brand: BrandKit }> = ({ brand }) => (
  <div
    className="rounded-xl overflow-hidden border shadow-sm"
    style={{ background: brand.surface, fontFamily: `"${brand.font}", sans-serif` }}
  >
    <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ background: brand.secondary }}>
      <LogoMark brand={brand} size={28} />
      <span className="text-sm font-bold text-white" style={{ fontWeight: brand.fontWeight }}>{brand.name}</span>
      <span className="ml-auto text-[10px] text-white/70">หน้าหลัก · คลาส · แพ็คเกจ</span>
    </div>
    <div className="p-5 space-y-3">
      <PhotoBlock brand={brand} w={240} h={90} />
      <div className="text-lg font-extrabold leading-tight" style={{ color: brand.secondary, fontWeight: brand.fontWeight }}>
        {brand.tagline}
      </div>
      <div className="text-[11px] line-clamp-2" style={{ color: brand.secondary, opacity: 0.7 }}>
        {brand.about}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          className="px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: brand.primary, borderRadius: brand.radius }}
        >
          เริ่มต้นทดลอง
        </button>
        <button
          className="px-3 py-1.5 text-xs font-bold border"
          style={{ color: brand.secondary, borderColor: brand.secondary, borderRadius: brand.radius }}
        >
          ดูคลาส
        </button>
      </div>
    </div>
  </div>
);

const CardPreview: React.FC<{ brand: BrandKit }> = ({ brand }) => (
  <div
    className="mx-auto w-[280px] aspect-[1.6/1] rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
    style={{
      background: `linear-gradient(135deg, ${brand.secondary}, ${brand.primary})`,
      fontFamily: `"${brand.font}", sans-serif`,
      borderRadius: brand.radius,
    }}
  >
    <div className="flex items-center justify-between">
      <LogoMark brand={brand} size={36} inverse />
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Member</span>
    </div>
    <div className="absolute bottom-4 left-4 right-4">
      <div className="text-[10px] opacity-70">สมาชิก</div>
      <div className="text-base font-extrabold leading-tight" style={{ fontWeight: brand.fontWeight }}>
        Kongphop S.
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-mono opacity-80">M-0001234</span>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: brand.accent, color: brand.secondary }}
        >
          GOLD
        </span>
      </div>
    </div>
  </div>
);

export const BrandPreviewPanel: React.FC<{ brand: BrandKit; previewLabel: string }> = ({
  brand,
  previewLabel,
}) => {
  const [device, setDevice] = useState<Device>('mobile');

  const tabs: { id: Device; icon: typeof Smartphone }[] = [
    { id: 'mobile', icon: Smartphone },
    { id: 'web', icon: Monitor },
    { id: 'card', icon: CreditCard },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">{previewLabel}</span>
        <div className="flex gap-1 p-0.5 bg-muted rounded-md">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = device === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setDevice(t.id)}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  active ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label={t.id}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={device}
        className="rounded-xl border bg-muted/30 p-4 transition-opacity duration-200 animate-in fade-in-0"
      >
        {device === 'mobile' && <MobilePreview brand={brand} />}
        {device === 'web' && <WebPreview brand={brand} />}
        {device === 'card' && <CardPreview brand={brand} />}
      </div>
    </div>
  );
};
