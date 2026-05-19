import React from 'react';
import { Grid3x3, Image as ImageIcon, Sparkles, Type, Eye } from 'lucide-react';
import type { BrandKit } from '../brandDefaults';
import { LogoMark } from '../LogoMark';

/**
 * MobilePreview — Realistic iPhone 15-style mockup.
 * Physical chassis (bezel, dynamic island, side buttons, home indicator) uses
 * neutral hardware grays. App content inside the screen uses brand tokens.
 */

const StatusIcons: React.FC<{ color: string }> = ({ color }) => (
  <div className="flex items-center gap-1.5" style={{ color }}>
    {/* signal */}
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="0.6" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.6" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="0.6" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.6" />
    </svg>
    {/* wifi */}
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
      <path d="M7.5 0C4.6 0 1.95 1.05 0 2.8l1.5 1.55C3.05 2.95 5.18 2.1 7.5 2.1s4.45.85 6 2.25L15 2.8C13.05 1.05 10.4 0 7.5 0Zm0 3.85c-1.95 0-3.73.7-5.1 1.85L3.9 7.25c.97-.8 2.2-1.3 3.6-1.3s2.63.5 3.6 1.3l1.5-1.55c-1.37-1.15-3.15-1.85-5.1-1.85Zm0 3.85c-.97 0-1.85.35-2.55.92L7.5 11l2.55-2.38c-.7-.57-1.58-.92-2.55-.92Z" />
    </svg>
    {/* battery */}
    <div className="flex items-center">
      <div
        className="relative"
        style={{
          width: 24,
          height: 11,
          border: `1px solid ${color}`,
          borderRadius: 3,
          opacity: 0.9,
          padding: 1,
        }}
      >
        <div
          style={{
            width: '85%',
            height: '100%',
            background: color,
            borderRadius: 1.5,
          }}
        />
      </div>
      <div
        style={{
          width: 1.5,
          height: 4,
          background: color,
          marginLeft: 1,
          borderRadius: 1,
          opacity: 0.9,
        }}
      />
    </div>
  </div>
);

export const MobilePreview: React.FC<{ brand: BrandKit }> = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  const chassis = '#1d1d20';
  const rim = '#2d2d31';
  const button = '#26262a';

  return (
    <div className="w-full flex justify-center">
      <div className="relative" style={{ width: 360, transform: 'scale(0.96)', transformOrigin: 'top center' }}>
        {/* Side hardware */}
        {/* silent switch */}
        <div className="absolute left-[-3px] top-[110px] w-[3px] h-[28px] rounded-l-sm" style={{ background: button }} />
        {/* volume up */}
        <div className="absolute left-[-3px] top-[160px] w-[3px] h-[46px] rounded-l-sm" style={{ background: button }} />
        {/* volume down */}
        <div className="absolute left-[-3px] top-[220px] w-[3px] h-[46px] rounded-l-sm" style={{ background: button }} />
        {/* power */}
        <div className="absolute right-[-3px] top-[180px] w-[3px] h-[64px] rounded-r-sm" style={{ background: button }} />

        {/* Chassis */}
        <div
          className="relative p-[10px]"
          style={{
            background: `linear-gradient(145deg, ${rim} 0%, ${chassis} 50%, ${rim} 100%)`,
            borderRadius: 54,
            boxShadow:
              '0 40px 80px -20px rgba(15,23,42,.35), 0 12px 30px rgba(15,23,42,.18), inset 0 0 0 1.5px rgba(255,255,255,.06)',
          }}
        >
          {/* Inner bezel */}
          <div
            className="relative overflow-hidden"
            style={{
              background: brand.surface,
              borderRadius: 44,
              height: 720,
              fontFamily,
              boxShadow: 'inset 0 0 0 2px #000',
            }}
          >
            {/* Status bar row */}
            <div className="relative h-[54px] flex items-center justify-between px-7 pt-3 z-20">
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ color: brand.secondary, letterSpacing: '-0.01em' }}
              >
                9:41
              </span>
              <StatusIcons color={brand.secondary} />
            </div>

            {/* Dynamic Island */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-end pr-2.5"
              style={{
                top: 11,
                width: 122,
                height: 35,
                background: '#000',
                borderRadius: 999,
                zIndex: 30,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: '#1a1a1f' }} />
            </div>

            {/* App content */}
            <div className="flex flex-col" style={{ height: 'calc(100% - 54px - 34px)' }}>
              {/* header */}
              <div className="px-[18px] pt-2 pb-3.5 flex items-center gap-2.5">
                <LogoMark brand={brand} size={36} />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm tracking-tight truncate"
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
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,.25), 0 10px 24px -8px rgba(15,23,42,.25)',
                  }}
                >
                  <div className="text-[10.5px] font-bold uppercase tracking-widest opacity-75">
                    TODAY
                  </div>
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
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-sm">
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
                    <div
                      className="text-[10px] font-bold"
                      style={{ color: brand.secondary, opacity: 0.6 }}
                    >
                      {c.full}
                    </div>
                  </div>
                ))}
              </div>

              {/* tab bar */}
              <div
                className="px-[18px] pt-2.5 pb-3 flex justify-around"
                style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  borderTop: `1px solid ${brand.secondary}10`,
                }}
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

            {/* Home indicator safe area */}
            <div className="absolute bottom-0 left-0 right-0 h-[34px] flex items-end justify-center pb-2 z-20 pointer-events-none">
              <div
                className="rounded-full"
                style={{
                  width: 134,
                  height: 5,
                  background: brand.secondary,
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
