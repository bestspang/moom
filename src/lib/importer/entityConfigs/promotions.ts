import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseDate, dash } from '../normalizers';

const HEADER_ALIASES: Record<string, string> = {
  'name': 'name', 'type': '_type', 'promo code': 'promo_code', 'promo_code': 'promo_code',
  'discount': '_discount', 'started on': '_start_date', 'start_date': '_start_date',
  'ending on': '_end_date', 'end_date': '_end_date',
  'date modified': '_date_modified', 'status': 'status',
  'name_en': 'name_en', 'name_th': 'name_th',
  'description_en': 'description_en', 'description_th': 'description_th',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'name', label: 'Name', required: true },
  { value: 'name_en', label: 'Name (EN)' },
  { value: 'name_th', label: 'Name (TH)' },
  { value: '_type', label: 'Type' },
  { value: 'promo_code', label: 'Promo Code' },
  { value: '_discount', label: 'Discount' },
  { value: '_start_date', label: 'Start Date' },
  { value: '_end_date', label: 'End Date' },
  { value: 'status', label: 'Status' },
  { value: 'description_en', label: 'Description (EN)' },
  { value: 'description_th', label: 'Description (TH)' },
];

function normalizeStatus(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'active') return 'active';
  if (v === 'scheduled') return 'scheduled';
  if (v === 'drafts' || v === 'draft') return 'drafts';
  if (v === 'archive' || v === 'archived' || v === 'expired') return 'archive';
  return null;
}

function parseDiscount(val: string): { discount_value: number; discount_mode: string; flat_rate_discount?: number; percentage_discount?: number; same_discount_all_packages?: boolean } | null {
  if (!val || val === '-') return null;
  if (val.toLowerCase() === 'varies') {
    return { discount_value: 0, discount_mode: 'percentage', same_discount_all_packages: false };
  }
  // "1290฿" or "1,290฿"
  const flatMatch = val.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*[฿บ]?$/);
  if (flatMatch) {
    const v = parseFloat(flatMatch[1]);
    return { discount_value: v, discount_mode: 'flat_rate', flat_rate_discount: v };
  }
  // "10%"
  const pctMatch = val.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pctMatch) {
    const v = parseFloat(pctMatch[1]);
    return { discount_value: v, discount_mode: 'percentage', percentage_discount: v };
  }
  return null;
}

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.name && !data.name_en) errors.push('Missing name');
  return errors;
}

async function upsertRows(rows: ImportRow[], _qc: any, setProgress: (p: number) => void): Promise<ImportResult> {
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);
  const result: ImportResult = {
    created: 0, updated: 0, failed: invalidRows.length,
    errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
  };

  const { data: existing } = await supabase.from('promotions').select('id, name, promo_code');
  const byCode = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const p of existing || []) {
    if (p.promo_code) byCode.set(p.promo_code.toLowerCase(), p.id);
    if (p.name) byName.set(p.name.toLowerCase(), p.id);
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    setProgress(Math.round(((i + 1) / validRows.length) * 100));
    try {
      const promoName = row.data.name || row.data.name_en || '';
      const promoCode = dash(row.data.promo_code);

      let matchId: string | undefined;
      if (promoCode) matchId = byCode.get(promoCode.toLowerCase());
      if (!matchId) matchId = byName.get(promoName.toLowerCase());

      const promo: Record<string, any> = {
        name: promoName,
        name_en: row.data.name_en || promoName,
        discount_value: 0,
      };

      if (row.data.name_th) promo.name_th = row.data.name_th;
      if (promoCode) promo.promo_code = promoCode;

      // Type
      const typeVal = (row.data._type || '').toLowerCase().trim();
      if (typeVal === 'discount') promo.type = 'discount';
      else if (typeVal === 'promo code' || typeVal === 'promo_code') promo.type = 'promo_code';
      else if (promoCode) promo.type = 'promo_code';
      else promo.type = 'discount';

      // Discount
      const disc = parseDiscount(row.data._discount || '');
      if (disc) Object.assign(promo, disc);

      // Dates
      const startDate = parseDate(row.data._start_date || '');
      if (startDate) promo.start_date = startDate;
      const endDate = parseDate(row.data._end_date || '');
      if (endDate) { promo.end_date = endDate; promo.has_end_date = true; }

      // Status
      if (row.data.status) { const s = normalizeStatus(row.data.status); if (s) promo.status = s; }

      if (matchId) {
        const { error } = await supabase.from('promotions').update(promo as never).eq('id', matchId);
        if (error) throw error;
        result.updated++;
        logActivity({ event_type: 'promotion_updated', activity: `Promotion ${promoName} updated via CSV import`, entity_type: 'promotion', entity_id: matchId, new_value: { ...promo, _source: 'csv_import' } });
      } else {
        if (!promo.status) promo.status = 'drafts';
        const { data: created, error } = await supabase.from('promotions').insert(promo as any).select('id').single();
        if (error) throw error;
        result.created++;
        logActivity({ event_type: 'promotion_created', activity: `Promotion ${promoName} created via CSV import`, entity_type: 'promotion', entity_id: created?.id, new_value: { ...promo, _source: 'csv_import' } });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
    }
  }

  logActivity({ event_type: 'promotion_import_batch', activity: `Imported promotions: ${result.created} created, ${result.updated} updated, ${result.failed} failed`, entity_type: 'promotion', new_value: { created: result.created, updated: result.updated, failed: result.failed, _source: 'csv_import' } });
  return result;
}

export const promotionsConfig: EntityConfig = {
  id: 'promotions',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['name', 'type', 'promo_code', 'discount', 'start_date', 'end_date', 'status'],
  enumFields: [
    {
      field: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'drafts', label: 'Drafts' },
        { value: 'archive', label: 'Archive' },
      ],
      normalize: normalizeStatus,
    },
  ],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['promotions'], ['promotion-stats']],
};
