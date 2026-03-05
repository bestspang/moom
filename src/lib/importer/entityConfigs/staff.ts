import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseDate, normalizeGender, normalizePhone } from '../normalizers';

const HEADER_ALIASES: Record<string, string> = {
  'firstname': 'first_name', 'first name': 'first_name', 'first_name': 'first_name', 'ชื่อ': 'first_name',
  'lastname': 'last_name', 'last name': 'last_name', 'last_name': 'last_name', 'นามสกุล': 'last_name',
  'nickname': 'nickname', 'ชื่อเล่น': 'nickname',
  'role': '_roles', 'gender': 'gender', 'เพศ': 'gender',
  'birthdate': 'date_of_birth', 'date_of_birth': 'date_of_birth', 'วันเกิด': 'date_of_birth',
  'email': 'email', 'อีเมล': 'email',
  'phone': 'phone', 'เบอร์โทร': 'phone',
  'address': 'address_1', 'ที่อยู่': 'address_1',
  'branch': '_branch', 'สาขา': '_branch',
  'status': 'status',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'nickname', label: 'Nickname' },
  { value: 'gender', label: 'Gender' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address_1', label: 'Address' },
  { value: '_roles', label: 'Roles (info only)' },
  { value: '_branch', label: 'Branch (info only)' },
  { value: 'status', label: 'Status' },
];

function normalizeStatus(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'active') return 'active';
  if (v === 'pending') return 'pending';
  if (v === 'terminated' || v === 'inactive') return 'terminated';
  return null;
}

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.first_name) errors.push('Missing first name');
  if (data.date_of_birth && !parseDate(data.date_of_birth)) errors.push('Invalid date of birth');
  if (data.gender && !normalizeGender(data.gender)) errors.push('Invalid gender');
  return errors;
}

async function upsertRows(rows: ImportRow[], _qc: any, setProgress: (p: number) => void): Promise<ImportResult> {
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);
  const result: ImportResult = {
    created: 0, updated: 0, failed: invalidRows.length,
    errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
  };

  const { data: existing } = await supabase.from('staff').select('id, email, phone, first_name, last_name');
  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const s of existing || []) {
    if (s.email) byEmail.set(s.email.toLowerCase(), s.id);
    if (s.phone) byPhone.set(s.phone, s.id);
    byName.set(`${s.first_name?.toLowerCase()}|${s.last_name?.toLowerCase()}`, s.id);
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    setProgress(Math.round(((i + 1) / validRows.length) * 100));
    try {
      let matchId: string | undefined;
      if (row.data.email) matchId = byEmail.get(row.data.email.toLowerCase());
      if (!matchId && row.data.phone) matchId = byPhone.get(normalizePhone(row.data.phone));
      if (!matchId) matchId = byName.get(`${row.data.first_name?.toLowerCase()}|${(row.data.last_name || '').toLowerCase()}`);

      const staffData: Record<string, any> = { first_name: row.data.first_name };
      if (row.data.last_name) staffData.last_name = row.data.last_name;
      if (row.data.nickname) staffData.nickname = row.data.nickname;
      if (row.data.email) staffData.email = row.data.email;
      if (row.data.phone) staffData.phone = normalizePhone(row.data.phone);
      if (row.data.address_1) staffData.address_1 = row.data.address_1;
      if (row.data.gender) { const g = normalizeGender(row.data.gender); if (g) staffData.gender = g; }
      if (row.data.date_of_birth) { const d = parseDate(row.data.date_of_birth); if (d) staffData.date_of_birth = d; }
      if (row.data.status) { const s = normalizeStatus(row.data.status); if (s) staffData.status = s; }

      if (matchId) {
        const { error } = await supabase.from('staff').update(staffData).eq('id', matchId);
        if (error) throw error;
        result.updated++;
        logActivity({ event_type: 'staff_updated', activity: `Staff ${staffData.first_name} updated via CSV import`, entity_type: 'staff', entity_id: matchId, new_value: { ...staffData, _source: 'csv_import' } });
      } else {
        if (!staffData.status) staffData.status = 'pending';
        const { data: created, error } = await supabase.from('staff').insert(staffData as any).select('id').single();
        if (error) throw error;
        result.created++;
        logActivity({ event_type: 'staff_created', activity: `Staff ${staffData.first_name} created via CSV import`, entity_type: 'staff', entity_id: created?.id, new_value: { ...staffData, _source: 'csv_import' } });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
    }
  }

  logActivity({ event_type: 'staff_import_batch', activity: `Imported staff: ${result.created} created, ${result.updated} updated, ${result.failed} failed`, entity_type: 'staff', new_value: { created: result.created, updated: result.updated, failed: result.failed, _source: 'csv_import' } });
  return result;
}

export const staffConfig: EntityConfig = {
  id: 'staff',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['first_name', 'last_name', 'nickname', 'email', 'phone', 'gender', 'date_of_birth', 'status'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['staff'], ['staff-stats']],
};
