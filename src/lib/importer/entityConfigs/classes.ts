import { supabase } from '@/integrations/supabase/client';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { logActivity } from '@/lib/activityLogger';

const HEADER_ALIASES: Record<string, string> = {
  'name': 'name', 'class name': 'name', 'ชื่อคลาส': 'name',
  'name_th': 'name_th', 'thai name': 'name_th', 'ชื่อไทย': 'name_th',
  'type': 'type', 'ประเภท': 'type',
  'level': 'level', 'ระดับ': 'level',
  'duration': 'duration', 'duration (mins)': 'duration', 'ระยะเวลา': 'duration',
  'status': 'status', 'สถานะ': 'status',
  'description': 'description', 'รายละเอียด': 'description',
  'description_th': 'description_th',
  'category': 'category_id', 'category_id': 'category_id',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'name', label: 'Name (EN)', required: true },
  { value: 'name_th', label: 'Name (TH)' },
  { value: 'type', label: 'Type' },
  { value: 'level', label: 'Level' },
  { value: 'duration', label: 'Duration (mins)' },
  { value: 'status', label: 'Status' },
  { value: 'description', label: 'Description (EN)' },
  { value: 'description_th', label: 'Description (TH)' },
  { value: 'category_id', label: 'Category ID' },
];

const VALID_TYPES = ['class', 'pt'];
const VALID_LEVELS = ['all_levels', 'beginner', 'intermediate', 'advanced'];
const VALID_STATUSES = ['active', 'drafts', 'archive'];

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('Name is required');
  if (data.type && !VALID_TYPES.includes(data.type.toLowerCase())) {
    errors.push(`Invalid type "${data.type}". Must be: ${VALID_TYPES.join(', ')}`);
  }
  if (data.level && !VALID_LEVELS.includes(data.level.toLowerCase())) {
    errors.push(`Invalid level "${data.level}". Must be: ${VALID_LEVELS.join(', ')}`);
  }
  if (data.status && !VALID_STATUSES.includes(data.status.toLowerCase())) {
    errors.push(`Invalid status "${data.status}". Must be: ${VALID_STATUSES.join(', ')}`);
  }
  if (data.duration && (isNaN(Number(data.duration)) || Number(data.duration) <= 0)) {
    errors.push('Duration must be a positive number');
  }
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
      if (d.name_th) record.name_th = d.name_th.trim();
      if (d.type) record.type = d.type.toLowerCase() as any;
      if (d.level) record.level = d.level.toLowerCase() as any;
      if (d.duration) record.duration = Number(d.duration);
      if (d.status) record.status = d.status.toLowerCase();
      if (d.description) record.description = d.description.trim();
      if (d.description_th) record.description_th = d.description_th.trim();
      if (d.category_id) record.category_id = d.category_id.trim();

      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('name', record.name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('classes').update(record).eq('id', existing.id);
        if (error) throw error;
        result.updated++;
      } else {
        const { error } = await supabase.from('classes').insert([record as any]);
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
    event_type: 'class_import_batch',
    activity: `Imported classes: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    entity_type: 'class',
    new_value: { created: result.created, updated: result.updated, failed: result.failed } as any,
  });

  return result;
}

export const classesConfig: EntityConfig = {
  id: 'classes',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['name', 'name_th', 'type', 'level', 'duration', 'status', 'description', 'description_th'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['classes'], ['class-stats']],
};
