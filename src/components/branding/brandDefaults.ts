/**
 * Brand Kit — shape, defaults, presets.
 * Mirrors MOOM Design System/ui_kits/admin/Branding.jsx DEFAULT_BRAND.
 */

export type LogoStyle = 'square' | 'circle' | 'wordmark';
export type PhotoStyle = 'warm' | 'cool' | 'mono' | 'vibrant';

export interface BrandKit {
  name: string;
  tagline: string;
  about: string;
  logoLetter: string;
  logoStyle: LogoStyle;
  primary: string;   // hsl(H S% L%) string
  secondary: string;
  accent: string;
  surface: string;
  font: string;
  fontWeight: number;
  radius: number;    // px
  photoStyle: PhotoStyle;
  social: {
    ig: string;
    fb: string;
    line: string;
    tt: string;
    yt: string;
    web: string;
  };
  contact: {
    phone: string;
    mail: string;
    addr: string;
  };
}

export const DEFAULT_BRAND: BrandKit = {
  name: 'MOOM CLUB',
  tagline: 'ฟิตเนสและคลาสสำหรับไลฟ์สไตล์คนกรุง',
  about:
    'MOOM CLUB คือคอมมูนิตี้ฟิตเนสที่ช่วยให้คุณเคลื่อนไหวสนุก ฟิตในแบบของคุณ ด้วยคลาสหลากหลาย โค้ชมืออาชีพ และยิมที่ออกแบบมาเพื่อให้คุณมาอยากออกกำลังกายจริงๆ',
  logoLetter: 'M',
  logoStyle: 'square',
  primary: 'hsl(22 95% 55%)',
  secondary: 'hsl(222 28% 12%)',
  accent: 'hsl(168 75% 42%)',
  surface: 'hsl(28 30% 97%)',
  font: 'Anuphan',
  fontWeight: 800,
  radius: 12,
  photoStyle: 'warm',
  social: { ig: '@moomclub', fb: 'moomclubbkk', line: '@moomclub', tt: '', yt: '', web: 'moomclub.co' },
  contact: {
    phone: '02-234-5678',
    mail: 'hello@moomclub.co',
    addr: '123 ถนนอโศก แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110',
  },
};

export const COLOR_PRESETS = [
  { name: 'Signature', primary: 'hsl(22 95% 55%)',  secondary: 'hsl(222 28% 12%)', accent: 'hsl(168 75% 42%)' },
  { name: 'Midnight',  primary: 'hsl(252 80% 62%)', secondary: 'hsl(230 40% 14%)', accent: 'hsl(190 85% 55%)' },
  { name: 'Forest',    primary: 'hsl(152 55% 38%)', secondary: 'hsl(160 30% 12%)', accent: 'hsl(42 95% 55%)' },
  { name: 'Blush',     primary: 'hsl(342 75% 55%)', secondary: 'hsl(330 25% 14%)', accent: 'hsl(28 90% 60%)' },
  { name: 'Ocean',     primary: 'hsl(212 90% 48%)', secondary: 'hsl(220 40% 14%)', accent: 'hsl(168 75% 48%)' },
  { name: 'Sunset',    primary: 'hsl(14 88% 58%)',  secondary: 'hsl(280 35% 16%)', accent: 'hsl(48 95% 60%)' },
  { name: 'Mono',      primary: 'hsl(0 0% 14%)',    secondary: 'hsl(0 0% 32%)',    accent: 'hsl(0 0% 60%)' },
  { name: 'Neon',      primary: 'hsl(88 85% 50%)',  secondary: 'hsl(260 50% 16%)', accent: 'hsl(320 90% 60%)' },
] as const;

export const FONT_CHOICES = [
  { id: 'Anuphan',            label: 'Anuphan',   moodKey: 'modernWarm' },
  { id: 'IBM Plex Sans Thai', label: 'IBM Plex',  moodKey: 'cleanTech' },
  { id: 'Noto Sans Thai',     label: 'Noto Sans', moodKey: 'neutralRead' },
  { id: 'Sarabun',            label: 'Sarabun',   moodKey: 'classicFriendly' },
  { id: 'Prompt',             label: 'Prompt',    moodKey: 'boldSporty' },
] as const;

export const PHOTO_STYLES: { id: PhotoStyle; filter: string }[] = [
  { id: 'warm',    filter: 'saturate(1.1) hue-rotate(-5deg) brightness(1.02)' },
  { id: 'cool',    filter: 'saturate(.9) hue-rotate(15deg) brightness(.98)' },
  { id: 'mono',    filter: 'saturate(0) contrast(1.1)' },
  { id: 'vibrant', filter: 'saturate(1.4) contrast(1.05)' },
];

/** Convert "hsl(22 95% 55%)" → "22 95% 55%" for use in CSS var. */
export const stripHsl = (v: string): string =>
  v.trim().replace(/^hsl\(\s*/i, '').replace(/\s*\)\s*$/, '').trim();
