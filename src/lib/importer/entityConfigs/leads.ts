import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseDate, normalizeGender } from '../normalizers';

const HEADER_ALIASES: Record<string, string> = {
  'firstname': 'first_name', 'first name': 'first_name', 'first_name': 'first_name', 'ชื่อ': 'first_name',
  'lastname': 'last_name', 'last name': 'last_name', 'last_name': 'last_name', 'นามสกุล': 'last_name',
  'nickname': 'nickname', 'ชื่อเล่น': 'nickname',
  'gender': 'gender', 'เพศ': 'gender',
  'birthdate': 'date_of_birth', 'date_of_birth': 'date_of_birth', 'date of birth': 'date_of_birth', 'dob': 'date_of_birth', 'วันเกิด': 'date_of_birth',
  'phone': 'phone', 'contact number': 'phone', 'เบอร์โทร': 'phone',
  'email': 'email', 'อีเมล': 'email',
  'address': 'address_1', 'address_1': 'address_1', 'ที่อยู่': 'address_1',
  'address_2': 'address_2',
  'subdistrict': 'subdistrict', 'district': 'district', 'province': 'province', 'postal_code': 'postal_code',
  'medical conditions': 'medical_notes', 'medical_notes': 'medical_notes',
  'source': 'source', 'แหล่งที่มา': 'source',
  'status': 'status', 'notes': 'notes', 'internal_notes': 'internal_notes', 'temperature': 'temperature',
  'emergency_first_name': 'emergency_first_name', 'emergency_phone': 'emergency_phone',
  'emergency_relationship': 'emergency_relationship',
  'register location': 'register_location_id', 'register_location_id': 'register_location_id',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'first_name', label: 'First Name', required: true },
  { value: 'last_name', label: 'Last Name' },
  { value: 'nickname', label: 'Nickname' },
  { value: 'gender', label: 'Gender' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'address_1', label: 'Address 1' },
  { value: 'address_2', label: 'Address 2' },
  { value: 'subdistrict', label: 'Subdistrict' },
  { value: 'district', label: 'District' },
  { value: 'province', label: 'Province' },
  { value: 'postal_code', label: 'Postal Code' },
  { value: 'medical_notes', label: 'Medical Notes' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'internal_notes', label: 'Internal Notes' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'emergency_first_name', label: 'Emergency First Name' },
  { value: 'emergency_phone', label: 'Emergency Phone' },
  { value: 'emergency_relationship', label: 'Emergency Relationship' },
];

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.first_name) errors.push('Missing first name');
  if (!data.phone && !data.email) errors.push('Need phone or email');
  if (data.date_of_birth && !parseDate(data.date_of_birth)) errors.push('Invalid date of birth');
  if (data.gender && !normalizeGender(data.gender)) errors.push('Invalid gender');
  return errors;
}

async function upsertRows(rows: ImportRow[], queryClient: any, setProgress: (p: number) => void): Promise<ImportResult> {
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);
  const result: ImportResult = {
    created: 0, updated: 0, failed: invalidRows.length,
    errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
  };

  const { data: existing } = await supabase.from('leads').select('id, phone, email');
  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  for (const l of existing || []) {
    if (l.phone) byPhone.set(l.phone, l.id);
    if (l.email) byEmail.set(l.email.toLowerCase(), l.id);
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    setProgress(Math.round(((i + 1) / validRows.length) * 100));
    try {
      let matchId: string | undefined;
      if (row.data.phone) matchId = byPhone.get(row.data.phone);
      if (!matchId && row.data.email) matchId = byEmail.get(row.data.email.toLowerCase());

      const leadData: Record<string, any> = { first_name: row.data.first_name };
      const textFields = ['last_name', 'nickname', 'phone', 'email', 'address_1', 'address_2',
        'subdistrict', 'district', 'province', 'postal_code', 'notes', 'internal_notes',
        'source', 'temperature', 'emergency_first_name', 'emergency_phone', 'emergency_relationship'];
      for (const f of textFields) { if (row.data[f]) leadData[f] = row.data[f]; }

      if (row.data.gender) { const g = normalizeGender(row.data.gender); if (g) leadData.gender = g; }
      if (row.data.date_of_birth) { const d = parseDate(row.data.date_of_birth); if (d) leadData.date_of_birth = d; }
      if (row.data.status && ['new', 'contacted', 'interested', 'not_interested', 'converted'].includes(row.data.status.toLowerCase())) {
        leadData.status = row.data.status.toLowerCase();
      }
      if (row.data.medical_notes) { leadData.has_medical_conditions = true; leadData.medical_notes = row.data.medical_notes; }

      if (matchId) {
        const { error } = await supabase.from('leads').update(leadData).eq('id', matchId);
        if (error) throw error;
        result.updated++;
        logActivity({ event_type: 'lead_updated', activity: `Lead ${leadData.first_name} updated via CSV import`, entity_type: 'lead', entity_id: matchId, new_value: { ...leadData, _source: 'csv_import' } });
      } else {
        if (!leadData.status) leadData.status = 'new';
        const { data: created, error } = await supabase.from('leads').insert(leadData as any).select('id').single();
        if (error) throw error;
        result.created++;
        logActivity({ event_type: 'lead_created', activity: `Lead ${leadData.first_name} created via CSV import`, entity_type: 'lead', entity_id: created?.id, new_value: { ...leadData, _source: 'csv_import' } });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
    }
  }

  logActivity({ event_type: 'lead_import_batch', activity: `Imported leads: ${result.created} created, ${result.updated} updated, ${result.failed} failed`, entity_type: 'lead', new_value: { created: result.created, updated: result.updated, failed: result.failed, _source: 'csv_import' } });
  return result;
}

export const leadsConfig: EntityConfig = {
  id: 'leads',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['first_name', 'last_name', 'nickname', 'gender', 'date_of_birth', 'phone', 'email', 'address', 'medical_notes', 'source', 'status'],
  fullTemplateHeaders: ['first_name', 'last_name', 'nickname', 'gender', 'date_of_birth', 'phone', 'email', 'address_1', 'address_2', 'subdistrict', 'district', 'province', 'postal_code', 'emergency_first_name', 'emergency_phone', 'emergency_relationship', 'medical_notes', 'source', 'status', 'temperature', 'notes', 'internal_notes'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['leads']],
};
