import React from 'react';
import type { BrandKit } from '../brandDefaults';
import { LogoMark } from '../LogoMark';

/**
 * CardPreview — 2-col grid: membership card (gradient + GOLD chip + ID/expiry)
 * AND email header (primary band + welcome body + CTA).
 */
export const CardPreview: React.FC<{ brand: BrandKit }> = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  return (
    <div className="grid grid-cols-2 gap-3.5 w-full" style={{ fontFamily }}>
      {/* Membership card */}
      <div
        className="relative overflow-hidden text-white p-[18px] flex flex-col"
        style={{
          aspectRatio: '1.586 / 1',
          borderRadius: brand.radius + 2,
          background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
          boxShadow: '0 10px 24px rgba(15,23,42,.12)',
        }}
      >
        <div className="flex items-center gap-2">
          <LogoMark brand={brand} size={28} />
          <div className="text-[11px] tracking-widest" style={{ fontWeight: brand.fontWeight }}>
            {brand.name}
          </div>
          <div className="flex-1" />
          <div className="text-[9px] font-bold opacity-80 px-2 py-0.5 rounded-full bg-white/20">
            GOLD
          </div>
        </div>
        <div className="text-[9px] opacity-70 font-bold uppercase tracking-wider mt-6">Member</div>
        <div className="text-base font-extrabold tracking-tight mt-0.5">คุณกิตติ ภาคภูมิ</div>
        <div className="mt-auto flex justify-between items-end text-[9px]">
          <div>
            <div className="opacity-70 font-semibold">ID</div>
            <div className="font-mono font-bold">MM-04891</div>
          </div>
          <div className="font-bold opacity-80">หมดอายุ 12/26</div>
        </div>
        <div
          className="absolute -right-[30px] -top-[30px] w-[130px] h-[130px] rounded-full"
          style={{ background: `${brand.accent}30` }}
        />
      </div>

      {/* Email header */}
      <div
        className="overflow-hidden border border-border bg-white flex flex-col"
        style={{ borderRadius: brand.radius }}
      >
        <div
          className="px-3.5 py-[18px] text-center"
          style={{ background: brand.primary, color: '#fff' }}
        >
          <div className="inline-block">
            <LogoMark brand={brand} size={36} />
          </div>
        </div>
        <div className="px-3.5 py-4">
          <div
            className="text-sm tracking-tight"
            style={{ fontWeight: brand.fontWeight, color: brand.secondary }}
          >
            ยินดีต้อนรับสู่ {brand.name}!
          </div>
          <div
            className="text-[11px] mt-1.5 leading-relaxed font-medium"
            style={{ color: brand.secondary, opacity: 0.7 }}
          >
            ขอบคุณที่เข้าร่วมกับเรา เริ่มต้นการเดินทางของคุณวันนี้
          </div>
          <div
            className="inline-block mt-3 px-3.5 py-2 text-[11px] font-extrabold text-white"
            style={{ background: brand.primary, borderRadius: brand.radius * 0.6 }}
          >
            เริ่มใช้งาน
          </div>
        </div>
      </div>
    </div>
  );
};
