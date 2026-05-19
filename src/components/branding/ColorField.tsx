import React from 'react';
import { cn } from '@/lib/utils';

interface ColorFieldProps {
  label: string;
  value: string; // hsl(h s% l%)
  onChange: (next: string) => void;
}

/**
 * Parse "hsl(22 95% 55%)" → {h,s,l}. Returns null on parse failure.
 */
const parseHsl = (v: string): { h: number; s: number; l: number } | null => {
  const m = v.match(/hsl\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)/i);
  if (!m) return null;
  return { h: +m[1], s: +m[2], l: +m[3] };
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; }
  else if (h<120)  { r = x; g = c; }
  else if (h<180)  { g = c; b = x; }
  else if (h<240)  { g = x; b = c; }
  else if (h<300)  { r = x; b = c; }
  else             { r = c; b = x; }
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
};

const hexToHsl = (hex: string): string => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return 'hsl(0 0% 0%)';
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
};

export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange }) => {
  const parsed = parseHsl(value);
  const hex = parsed ? hslToHex(parsed.h, parsed.s, parsed.l) : '#000000';

  return (
    <label className={cn(
      'flex items-center gap-3 p-3 rounded-lg border bg-card',
      'hover:border-primary/40 transition-colors cursor-pointer'
    )}>
      <span
        className="w-10 h-10 rounded-md border flex-shrink-0 relative overflow-hidden"
        style={{ background: value }}
      >
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={label}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-foreground">{label}</span>
        <span className="block text-[11px] font-mono text-muted-foreground truncate">{value}</span>
      </span>
    </label>
  );
};
