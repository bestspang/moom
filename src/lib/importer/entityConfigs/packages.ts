import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseCurrency, dash } from '../normalizers';

const HEADER_ALIASES: Record<string, string> = {
  'id': '_code', 'name': 'name_en', 'type': 'type',
  'term(d)': 'term_days', 'term': 'term_days', 'sessions': 'sessions',
  'price': 'price', 'categories': '_categories', 'access locations': '_access_locations',
  'sold at': '_sold_at', 'date modified': '_date_modified', 'status': 'status',
  'name_en': 'name_en', 'name_th': 'name_th', 'description_en': 'description_en',
  'description_th': 'description_th', 'expiration_days': 'expiration_days',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: '_code', label: 'Package Code' },
  { value: 'name_en', label: 'Name (EN)', required: true },
  { value: 'name_th', label: 'Name (TH)' },
  { value: 'type', label: 'Type', required: true },
  { value: 'term_days', label: 'Term (Days)' },
  { value: 'expiration_days', label: 'Expiration (Days)' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'price', label: 'Price', required: true },
  { value: '_categories', label: 'Categories (info)' },
  { value: '_access_locations', label: 'Access Locations (info)' },
  { value: '_sold_at', label: 'Sold At (info)' },
  { value: 'status', label: 'Status' },
  { value: 'description_en', label: 'Description (EN)' },
  { value: 'description_th', label: 'Description (TH)' },
];

function normalizeType(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'unlimited' || v === 'time') return 'unlimited';
  if (v === 'pt' || v === 'personal training') return 'pt';
  if (v === 'sessions' || v === 'session') return 'session';
  if (v === 'day_pass' || v === 'day pass') return 'day_pass';
  if (v === 'drop_in' || v === 'drop in') return 'drop_in';
  return null;
}

function normalizeStatus(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'on sale' || v === 'on_sale' || v === 'active') return 'on_sale';
  if (v === 'scheduled') return 'scheduled';
  if (v === 'drafts' || v === 'draft') return 'drafts';
  if (v === 'archive' || v === 'archived') return 'archive';
  return null;
}

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.name_en) errors.push('Missing name');
  if (!data.type || !normalizeType(data.type)) errors.push('Invalid type');
  if (!data.price && !data.term_days) errors.push('Need price or term_days');
  return errors;
}

async function upsertRows(rows: ImportRow[], _qc: any, setProgress: (p: number) => void): Promise<ImportResult> {
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);
  const result: ImportResult = {
    created: 0, updated: 0, failed: invalidRows.length,
    errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
  };

  const { data: existing } = await supabase.from('packages').select('id, name_en, type');
  const byNameType = new Map<string, string>();
  for (const p of existing || []) {
    byNameType.set(`${p.name_en?.toLowerCase()}|${p.type}`, p.id);
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    setProgress(Math.round(((i + 1) / validRows.length) * 100));
    try {
      const type = normalizeType(row.data.type)!;
      const matchId = byNameType.get(`${row.data.name_en.toLowerCase()}|${type}`);

      const pkg: Record<string, any> = {
        name_en: row.data.name_en,
        type,
        price: parseCurrency(row.data.price) ?? 0,
        term_days: parseInt(row.data.term_days) || 30,
        expiration_days: parseInt(row.data.expiration_days || row.data.term_days) || 30,
      };

      const sessions = dash(row.data.sessions);
      if (sessions) pkg.sessions = parseInt(sessions) || null;

      if (row.data.name_th) pkg.name_th = row.data.name_th;
      if (row.data.description_en) pkg.description_en = row.data.description_en;
      if (row.data.description_th) pkg.description_th = row.data.description_th;

      const catVal = dash(row.data._categories);
      if (catVal && catVal.toLowerCase() === 'all') {
        pkg.all_categories = true;
      }

      const locVal = dash(row.data._access_locations);
      if (locVal && locVal.toLowerCase() === 'all') {
        pkg.all_locations = true;
      }

      if (row.data.status) {
        const s = normalizeStatus(row.data.status);
        if (s) pkg.status = s;
      }

      if (matchId) {
        const { error } = await supabase.from('packages').update(pkg).eq('id', matchId);
        if (error) throw error;
        result.updated++;
        logActivity({ event_type: 'package_updated', activity: `Package ${pkg.name_en} updated via CSV import`, entity_type: 'package', entity_id: matchId, new_value: { ...pkg, _source: 'csv_import' } });
      } else {
        if (!pkg.status) pkg.status = 'drafts';
        const { data: created, error } = await supabase.from('packages').insert(pkg as any).select('id').single();
        if (error) throw error;
        result.created++;
        logActivity({ event_type: 'package_created', activity: `Package ${pkg.name_en} created via CSV import`, entity_type: 'package', entity_id: created?.id, new_value: { ...pkg, _source: 'csv_import' } });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
    }
  }

  logActivity({ event_type: 'package_import_batch', activity: `Imported packages: ${result.created} created, ${result.updated} updated, ${result.failed} failed`, entity_type: 'package', new_value: { created: result.created, updated: result.updated, failed: result.failed, _source: 'csv_import' } });
  return result;
}

export const packagesConfig: EntityConfig = {
  id: 'packages',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['name_en', 'name_th', 'type', 'term_days', 'sessions', 'price', 'status'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['packages'], ['package-stats']],
};
