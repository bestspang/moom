import { supabase } from '@/integrations/supabase/client';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseBool } from '../normalizers';

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
  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    const d = row.data;
    try {
      const record: Record<string, any> = {
        name: d.name.trim(),
      };
      if (d.description) record.description = d.description.trim();
      if (d.is_active !== undefined && d.is_active !== '') {
        record.is_active = parseBool(d.is_active);
      }

      // Try to find existing by name
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
