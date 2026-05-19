import React from 'react';
import type { BrandKit } from '../brandDefaults';
import { LogoMark } from '../LogoMark';

/**
 * WebPreview — marketing web card with browser chrome, nav, hero with
 * two-tone H1 and decorative circles.
 */
export const WebPreview: React.FC<{ brand: BrandKit }> = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  return (
    <div
      className="rounded-xl overflow-hidden border border-border w-full"
      style={{ fontFamily }}
    >
      {/* browser chrome */}
      <div className="h-[26px] bg-muted border-b border-border px-2.5 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(0 78% 60%)' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(38 92% 50%)' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(152 60% 42%)' }} />
        <div className="flex-1 ml-1.5 h-3.5 bg-card border border-border rounded-sm text-[9px] flex items-center px-2 text-muted-foreground font-semibold">
          {brand.social.web || 'moomclub.co'}
        </div>
      </div>

      {/* nav */}
      <div
        className="px-[22px] py-3.5 flex items-center gap-5 bg-white"
        style={{ borderBottom: `1px solid ${brand.secondary}15` }}
      >
        <LogoMark brand={brand} size={30} />
        <div
          className="text-[13px]"
          style={{ fontWeight: brand.fontWeight, color: brand.secondary }}
        >
          {brand.name}
        </div>
        <div className="flex-1" />
        {['คลาส', 'แพ็คเกจ', 'เกี่ยวกับ'].map((t) => (
          <span
            key={t}
            className="text-[11px] font-semibold"
            style={{ color: brand.secondary, opacity: 0.7 }}
          >
            {t}
          </span>
        ))}
        <div
          className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
          style={{ background: brand.primary }}
        >
          เริ่มเลย
        </div>
      </div>

      {/* hero */}
      <div
        className="px-8 py-10 relative overflow-hidden"
        style={{ background: brand.surface }}
      >
        <div
          className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
          style={{ background: `${brand.primary}18`, color: brand.primary }}
        >
          โปรใหม่ · เดือนพฤษภาคม
        </div>
        <div
          className="text-[34px] leading-[1.05] tracking-[-0.03em] mt-3 max-w-[70%]"
          style={{ fontWeight: brand.fontWeight, color: brand.secondary }}
        >
          ฟิตในแบบของคุณ
          <br />
          <span style={{ color: brand.primary }}>ที่ {brand.name.toLowerCase()}</span>
        </div>
        <div
          className="text-[13px] mt-2.5 max-w-[65%] leading-relaxed font-medium"
          style={{ color: brand.secondary, opacity: 0.7 }}
        >
          {brand.tagline}
        </div>
        <div className="flex gap-2 mt-[18px]">
          <div
            className="px-[18px] py-2.5 text-xs font-extrabold text-white"
            style={{ background: brand.primary, borderRadius: brand.radius * 0.7 }}
          >
            ลองเลย
          </div>
          <div
            className="px-[18px] py-2.5 text-xs font-bold bg-white"
            style={{
              border: `1px solid ${brand.secondary}20`,
              color: brand.secondary,
              borderRadius: brand.radius * 0.7,
            }}
          >
            ดูแพ็คเกจ
          </div>
        </div>
        <div
          className="absolute -right-10 top-5 w-[200px] h-[200px] rounded-full"
          style={{ background: `${brand.accent}25` }}
        />
        <div
          className="absolute right-5 -bottom-[60px] w-[120px] h-[120px] rounded-full"
          style={{ background: `${brand.primary}30` }}
        />
      </div>
    </div>
  );
};
