export function parseDate(val: string): string | null {
  if (!val || val === '-') return null;
  // ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
  // "5 MAR 2026" or "5 MAR 2026, 08:46"
  const m2 = val.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (m2) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const mon = months[m2[2].toLowerCase().slice(0, 3)];
    if (mon) return `${m2[3]}-${mon}-${m2[1].padStart(2, '0')}`;
  }
  return null;
}

export function parseDatetime(val: string): string | null {
  if (!val || val === '-') return null;
  // "5 MAR 2026, 08:46"
  const m = val.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4}),?\s*(\d{2}):(\d{2})/);
  if (m) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const mon = months[m[2].toLowerCase().slice(0, 3)];
    if (mon) return `${m[3]}-${mon}-${m[1].padStart(2, '0')}T${m[4]}:${m[5]}:00`;
  }
  const d = parseDate(val);
  return d ? `${d}T00:00:00` : null;
}

export function normalizeGender(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (['male', 'm', 'ชาย'].includes(v)) return 'male';
  if (['female', 'f', 'หญิง'].includes(v)) return 'female';
  if (['other', 'อื่นๆ'].includes(v)) return 'other';
  return null;
}

export function normalizePhone(val: string): string {
  let p = val.replace(/[^0-9+]/g, '');
  if (p.startsWith('66') && p.length === 11) p = '0' + p.slice(2);
  return p;
}

export function parseBool(val: string): boolean {
  const v = val.toLowerCase().trim();
  return ['true', '1', 'yes', 'ใช่'].includes(v);
}

export function parseCurrency(val: string): number | null {
  if (!val || val === '-') return null;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function dash(val: string): string | null {
  return (!val || val.trim() === '-') ? null : val.trim();
}
