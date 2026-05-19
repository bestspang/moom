import React from 'react';
import { Grid3x3, Image as ImageIcon, Sparkles, Type, Eye } from 'lucide-react';
import type { BrandKit } from '../brandDefaults';
import { LogoMark } from '../LogoMark';

/**
 * MobilePreview — 360×620 phone mockup with status bar, header, hero card,
 * filter chips, class list with progress, and bottom tab bar.
 */
export const MobilePreview: React.FC<{ brand: BrandKit }> = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  return (
    <div
      className="w-full max-w-[360px] mx-auto rounded-[32px] p-1.5"
      style={{
        background: '#0b0d12',
        boxShadow: '0 30px 60px rgba(15,23,42,.18), 0 8px 20px rgba(15,23,42,.08)',
      }}
    >
      <div
        className="rounded-[26px] overflow-hidden flex flex-col"
        style={{ background: brand.surface, height: 620, fontFamily }}
      >
        {/* status bar */}
        <div
          className="px-[18px] pt-3 pb-1.5 flex justify-between text-[11px] font-bold"
          style={{ color: brand.secondary }}
        >
          <span>9:41</span>
          <span className="tracking-widest">•••</span>
        </div>

        {/* header */}
        <div className="px-[18px] pt-2 pb-3.5 flex items-center gap-2.5">
          <LogoMark brand={brand} size={36} />
          <div className="flex-1 min-w-0">
            <div
              className="text-sm tracking-tight"
              style={{ fontWeight: brand.fontWeight, color: brand.secondary }}
            >
              {brand.name}
            </div>
            <div
              className="text-[10.5px] font-medium truncate"
              style={{ color: brand.secondary, opacity: 0.6 }}
            >
              {brand.tagline}
            </div>
          </div>
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
            style={{ background: `${brand.primary}1f`, color: brand.primary }}
          >
            <Eye className="h-4 w-4" strokeWidth={2.2} />
          </div>
        </div>

        {/* hero card */}
        <div className="px-3.5 mb-3.5">
          <div
            className="relative overflow-hidden p-[18px] text-white"
            style={{
              borderRadius: brand.radius + 4,
              background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
              minHeight: 130,
            }}
          >
            <div className="text-[10.5px] font-bold uppercase tracking-widest opacity-75">TODAY</div>
            <div
              className="text-[20px] leading-[1.15] tracking-tight mt-1.5 max-w-[70%]"
              style={{ fontWeight: brand.fontWeight }}
            >
              HIIT กับโค้ชพิม · 18:00
            </div>
            <div className="flex gap-2 mt-3">
              <div
                className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                style={{ background: '#fff', color: brand.secondary }}
              >
                จองคลาส
              </div>
              <div className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/20">
                ดูรายละเอียด
              </div>
            </div>
            <div
              className="absolute -right-5 -bottom-5 w-[130px] h-[130px] rounded-full"
              style={{ background: `${brand.accent}30` }}
            />
          </div>
        </div>

        {/* chips */}
        <div className="px-3.5 pb-2.5 flex gap-1.5 overflow-hidden">
          {['ทั้งหมด', 'HIIT', 'Yoga', 'Pilates'].map((t, i) => (
            <div
              key={t}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap"
              style={{
                background: i === 0 ? brand.primary : `${brand.primary}18`,
                color: i === 0 ? '#fff' : brand.primary,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* class cards */}
        <div className="px-3.5 flex-1 flex flex-col gap-2">
          {[
            { t: 'Yoga Flow · โค้ชนก', time: '07', full: '12/16', fill: 0.75 },
            { t: 'Spin Express · โค้ชอาร์ม', time: '12', full: '18/20', fill: 0.9 },
            { t: 'Pilates Reformer · พิม', time: '18', full: '6/10', fill: 0.6 },
          ].map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3 bg-white"
              style={{
                borderRadius: brand.radius,
                border: `1px solid ${brand.secondary}12`,
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
                style={{
                  borderRadius: brand.radius * 0.7,
                  background: `${brand.accent}22`,
                  color: brand.accent,
                }}
              >
                {c.time}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-bold truncate"
                  style={{ color: brand.secondary }}
                >
                  {c.t}
                </div>
                <div
                  className="h-1 rounded-full mt-1 overflow-hidden"
                  style={{ background: `${brand.primary}1a` }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.fill * 100}%`, background: brand.primary }}
                  />
                </div>
              </div>
              <div className="text-[10px] font-bold" style={{ color: brand.secondary, opacity: 0.6 }}>
                {c.full}
              </div>
            </div>
          ))}
        </div>

        {/* tab bar */}
        <div
          className="px-[18px] pt-2 pb-3.5 flex justify-around bg-white"
          style={{ borderTop: `1px solid ${brand.secondary}10` }}
        >
          {[Grid3x3, ImageIcon, Sparkles, Type].map((Ico, i) => (
            <div
              key={i}
              style={{
                color: i === 0 ? brand.primary : brand.secondary,
                opacity: i === 0 ? 1 : 0.4,
              }}
            >
              <Ico className="h-5 w-5" strokeWidth={2.2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
