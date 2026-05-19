import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';

interface ColorFieldProps {
  label: string;
  value: string; // hsl(h s% l%)
  onChange: (next: string) => void;
}

const parseHsl = (v: string): { h: number; s: number; l: number } => {
  const m = String(v).match(/hsl\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%?\s+(-?\d+(?:\.\d+)?)%?\s*\)/i);
  if (!m) return { h: 22, s: 95, l: 55 };
  return { h: +m[1], s: +m[2], l: +m[3] };
};

const toHslStr = ({ h, s, l }: { h: number; s: number; l: number }) =>
  `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;

const hslToHex = (color: string): string => {
  const { h, s, l } = parseHsl(color);
  const sd = s / 100, ld = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sd * Math.min(ld, 1 - ld);
  const f = (n: number) => {
    const x = ld - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * x).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
};

/**
 * ColorField — color swatch button that opens a popover with hue gradient,
 * H/S/L sliders, and HEX read-out + copy. Mirrors `ColorSwatch` in
 * MOOM Design System / Branding.jsx.
 */
export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const hsl = parseHsl(value);
  const hex = hslToHex(value).toUpperCase();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const update = (k: 'h' | 's' | 'l', v: number) => onChange(toHslStr({ ...hsl, [k]: v }));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full p-2.5 bg-card border border-border rounded-lg text-left flex items-center gap-2.5',
          'hover:border-primary/40 transition-colors'
        )}
      >
        <span
          className="w-12 h-12 rounded-md flex-shrink-0"
          style={{ background: value, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }}
        />
        <span className="flex-1 min-w-0">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="block text-[13px] font-bold text-foreground font-mono tabular-nums">{hex}</span>
          <span className="block text-[10.5px] text-muted-foreground/80 font-semibold font-mono">
            H {Math.round(hsl.h)}° · S {Math.round(hsl.s)}% · L {Math.round(hsl.l)}%
          </span>
        </span>
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-popover border border-border rounded-xl shadow-lg p-3.5 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Hue gradient bar */}
          <div
            className="h-[120px] rounded-lg mb-2.5 relative"
            style={{
              background: `linear-gradient(to right, hsl(0 ${hsl.s}% ${hsl.l}%), hsl(60 ${hsl.s}% ${hsl.l}%), hsl(120 ${hsl.s}% ${hsl.l}%), hsl(180 ${hsl.s}% ${hsl.l}%), hsl(240 ${hsl.s}% ${hsl.l}%), hsl(300 ${hsl.s}% ${hsl.l}%), hsl(360 ${hsl.s}% ${hsl.l}%))`,
            }}
          >
            <div
              className="absolute top-1 bottom-1 w-1.5 bg-white rounded-sm"
              style={{
                left: `calc(${(hsl.h / 360) * 100}% - 3px)`,
                boxShadow: '0 0 0 1px rgba(0,0,0,.3)',
              }}
            />
          </div>

          {([
            { k: 'h' as const, label: 'Hue', min: 0, max: 360, suffix: '°' },
            { k: 's' as const, label: 'Saturation', min: 0, max: 100, suffix: '%' },
            { k: 'l' as const, label: 'Lightness', min: 0, max: 100, suffix: '%' },
          ]).map((sl) => (
            <div key={sl.k} className="mb-2">
              <div className="flex justify-between mb-0.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  {sl.label}
                </span>
                <span className="text-[11px] font-bold text-foreground font-mono">
                  {Math.round(hsl[sl.k])}
                  {sl.suffix}
                </span>
              </div>
              <input
                type="range"
                min={sl.min}
                max={sl.max}
                value={hsl[sl.k]}
                onChange={(e) => update(sl.k, +e.target.value)}
                className="w-full accent-primary"
              />
            </div>
          ))}

          <div className="flex gap-1.5 items-center pt-2 border-t border-border">
            <span className="text-[10.5px] font-bold text-muted-foreground">HEX</span>
            <input
              value={hex}
              readOnly
              className="flex-1 h-7 px-2 bg-muted border border-border rounded font-mono text-xs font-bold text-foreground outline-none"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(hex);
              }}
              className="w-7 h-7 border border-border bg-card rounded text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
