import { supabase } from '@/integrations/supabase/client';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseBool } from '../normalizers';
import { logActivity } from '@/lib/activityLogger';

const HEADER_ALIASES: Record<string, string> = {
  'name': 'name', 'workout name': 'name', 'template name': 'name', 'ชื่อ': 'name',
  'description': 'description', 'รายละเอียด': 'description',
  'is_active': 'is_active', 'active': 'is_active', 'สถานะ': 'is_active',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'name', label: 'Name' },
  { value: 'description', label: 'Description' },
  { value: 'is_active', label: 'Active' },
];

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('Name is required');
  return errors;
}

async function upsertRows(
  rows: ImportRow[],
  _queryClient: any,
  setProgress: (pct: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, failed: 0, errors: [] };
  const validRows = rows.filter(r => r.errors.length === 0);
  const total = validRows.length;

  // Count skipped invalid rows
  result.failed += rows.length - total;
  rows.filter(r => r.errors.length > 0).forEach(r => {
    result.errors.push({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data });
  });

  for (let i = 0; i < total; i++) {
    const row = validRows[i];
    const d = row.data;
    try {
      const record: Record<string, any> = {
        name: d.name.trim(),
      };
      if (d.description) record.description = d.description.trim();
      if (d.is_active !== undefined && d.is_active !== '') {
        record.is_active = parseBool(d.is_active);
      }

      const { data: existing } = await supabase
        .from('training_templates')
        .select('id')
        .eq('name', record.name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('training_templates').update(record).eq('id', existing.id);
        if (error) throw error;
        result.updated++;
      } else {
        const { error } = await supabase.from('training_templates').insert([record as any]);
        if (error) throw error;
        result.created++;
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: d });
    }
    setProgress(Math.round(((i + 1) / total) * 100));
  }

  // Log batch activity
  logActivity({
    event_type: 'training_import_batch',
    activity: `Imported workouts: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    entity_type: 'training_template',
    new_value: { created: result.created, updated: result.updated, failed: result.failed } as any,
  });

  return result;
}

export const workoutsConfig: EntityConfig = {
  id: 'workouts',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['name', 'description', 'is_active'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['training-templates']],
};
