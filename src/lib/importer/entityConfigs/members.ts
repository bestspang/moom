import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseDate, normalizeGender, normalizePhone, parseBool } from '../normalizers';

const HEADER_ALIASES: Record<string, string> = {
  'firstname': 'first_name', 'first name': 'first_name', 'first_name': 'first_name', 'ชื่อ': 'first_name',
  'lastname': 'last_name', 'last name': 'last_name', 'last_name': 'last_name', 'นามสกุล': 'last_name',
  'nickname': 'nickname', 'ชื่อเล่น': 'nickname',
  'gender': 'gender', 'เพศ': 'gender',
  'birthdate': 'date_of_birth', 'date_of_birth': 'date_of_birth', 'date of birth': 'date_of_birth', 'dob': 'date_of_birth', 'วันเกิด': 'date_of_birth',
  'phone': 'phone', 'contact number': 'phone', 'เบอร์โทร': 'phone',
  'email': 'email', 'อีเมล': 'email',
  'line_id': 'line_id', 'line id': 'line_id', 'ไลน์': 'line_id',
  'register_location_id': 'register_location_id', 'location': 'register_location_id', 'สาขา': 'register_location_id',
  'address': 'address_1', 'ที่อยู่': 'address_1',
  'address_1': 'address_1', 'address 1': 'address_1',
  'address_2': 'address_2', 'address 2': 'address_2',
  'subdistrict': 'subdistrict', 'แขวง': 'subdistrict', 'ตำบล': 'subdistrict',
  'district': 'district', 'เขต': 'district', 'อำเภอ': 'district',
  'province': 'province', 'จังหวัด': 'province',
  'postal_code': 'postal_code', 'postal code': 'postal_code', 'zip': 'postal_code', 'รหัสไปรษณีย์': 'postal_code',
  'emergency_first_name': 'emergency_first_name', 'emergency first name': 'emergency_first_name',
  'emergency_last_name': 'emergency_last_name', 'emergency last name': 'emergency_last_name',
  'emergency_phone': 'emergency_phone', 'emergency phone': 'emergency_phone', 'เบอร์ฉุกเฉิน': 'emergency_phone',
  'emergency_relationship': 'emergency_relationship', 'emergency relationship': 'emergency_relationship',
  'has_medical_conditions': 'has_medical_conditions', 'medical conditions': 'medical_notes',
  'medical_notes': 'medical_notes', 'medical notes': 'medical_notes',
  'allow_physical_contact': 'allow_physical_contact',
  'joined date': 'member_since', 'joined_date': 'member_since', 'member_since': 'member_since',
  'member_id': 'member_id', 'id': 'member_id',
  'status': 'status',
  'notes': 'notes',
  'source': 'source',
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
  { value: 'line_id', label: 'LINE ID' },
  { value: 'register_location_id', label: 'Register Location ID' },
  { value: 'address_1', label: 'Address Line 1' },
  { value: 'address_2', label: 'Address Line 2' },
  { value: 'subdistrict', label: 'Sub-district' },
  { value: 'district', label: 'District' },
  { value: 'province', label: 'Province' },
  { value: 'postal_code', label: 'Postal Code' },
  { value: 'emergency_first_name', label: 'Emergency First Name' },
  { value: 'emergency_last_name', label: 'Emergency Last Name' },
  { value: 'emergency_phone', label: 'Emergency Phone' },
  { value: 'emergency_relationship', label: 'Emergency Relationship' },
  { value: 'has_medical_conditions', label: 'Has Medical Conditions' },
  { value: 'medical_notes', label: 'Medical Notes' },
  { value: 'allow_physical_contact', label: 'Allow Physical Contact' },
  { value: 'member_since', label: 'Joined Date' },
  { value: 'member_id', label: 'Member ID' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Source' },
];

const TEMPLATE_HEADERS = ['first_name', 'last_name', 'nickname', 'gender', 'date_of_birth', 'phone', 'email', 'register_location_id', 'joined_date', 'status'];
const FULL_TEMPLATE_HEADERS = [
  'member_id', 'first_name', 'last_name', 'nickname', 'gender', 'date_of_birth',
  'phone', 'email', 'line_id', 'register_location_id',
  'address_1', 'address_2', 'subdistrict', 'district', 'province', 'postal_code',
  'emergency_first_name', 'emergency_last_name', 'emergency_phone', 'emergency_relationship',
  'has_medical_conditions', 'medical_notes', 'allow_physical_contact',
  'joined_date', 'status', 'notes', 'source',
];

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.first_name) errors.push('Missing first name');
  if (!data.last_name && !data.phone && !data.email) errors.push('Need last_name or phone/email');
  if (data.date_of_birth && !parseDate(data.date_of_birth)) errors.push('Invalid date of birth');
  if (data.member_since && !parseDate(data.member_since)) errors.push('Invalid joined date');
  if (data.gender && !normalizeGender(data.gender)) errors.push('Invalid gender');
  return errors;
}

async function upsertRows(
  rows: ImportRow[],
  queryClient: any,
  setProgress: (pct: number) => void,
  options?: { overwrite?: boolean; defaultLocationId?: string },
): Promise<ImportResult> {
  const overwrite = options?.overwrite ?? true;
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const result: ImportResult = {
    created: 0, updated: 0, failed: invalidRows.length,
    errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
  };

  const { data: existingMembers } = await supabase
    .from('members')
    .select('id, member_id, phone, email');
  const byMemberId = new Map<string, string>();
  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  for (const m of existingMembers || []) {
    if (m.member_id) byMemberId.set(m.member_id.toLowerCase(), m.id);
    if (m.phone) byPhone.set(m.phone, m.id);
    if (m.email) byEmail.set(m.email.toLowerCase(), m.id);
  }

  const { data: lastMember } = await supabase
    .from('members')
    .select('member_id')
    .order('created_at', { ascending: false })
    .limit(1);
  let nextNum = 1;
  if (lastMember?.[0]?.member_id) {
    nextNum = parseInt(lastMember[0].member_id.replace('M-', ''), 10) + 1;
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    setProgress(Math.round(((i + 1) / validRows.length) * 100));

    try {
      let matchId: string | undefined;
      if (row.data.member_id) matchId = byMemberId.get(row.data.member_id.toLowerCase());
      if (!matchId && row.data.phone) matchId = byPhone.get(normalizePhone(row.data.phone));
      if (!matchId && row.data.email) matchId = byEmail.get(row.data.email.toLowerCase());

      const memberData: Record<string, any> = {
        first_name: row.data.first_name,
        last_name: row.data.last_name || '',
      };

      const textFields = ['nickname', 'phone', 'email', 'notes', 'source', 'line_id',
        'address_1', 'address_2', 'subdistrict', 'district', 'province', 'postal_code',
        'emergency_first_name', 'emergency_last_name', 'emergency_phone', 'emergency_relationship',
        'medical_notes', 'register_location_id'];
      for (const f of textFields) {
        if (row.data[f]) memberData[f] = f === 'phone' ? normalizePhone(row.data[f]) : row.data[f];
      }

      if (row.data.has_medical_conditions) memberData.has_medical_conditions = parseBool(row.data.has_medical_conditions);
      if (row.data.allow_physical_contact) memberData.allow_physical_contact = parseBool(row.data.allow_physical_contact);
      if (row.data.medical_notes && !row.data.has_medical_conditions) {
        memberData.has_medical_conditions = true;
      }

      if (memberData.emergency_first_name || memberData.emergency_last_name) {
        memberData.emergency_contact_name = [memberData.emergency_first_name, memberData.emergency_last_name].filter(Boolean).join(' ');
      }
      if (memberData.emergency_phone) memberData.emergency_contact_phone = memberData.emergency_phone;

      if (row.data.gender) { const g = normalizeGender(row.data.gender); if (g) memberData.gender = g; }
      if (row.data.date_of_birth) { const d = parseDate(row.data.date_of_birth); if (d) memberData.date_of_birth = d; }
      if (row.data.member_since) { const d = parseDate(row.data.member_since); if (d) memberData.member_since = d; }
      if (row.data.status && ['active', 'inactive', 'suspended', 'on_hold'].includes(row.data.status.toLowerCase())) {
        memberData.status = row.data.status.toLowerCase();
      }

      if (matchId) {
        // If not overwriting, fetch existing and only fill blank fields
        if (!overwrite) {
          const { data: existing } = await supabase.from('members').select('*').eq('id', matchId).single();
          if (existing) {
            for (const key of Object.keys(memberData)) {
              if (key === 'first_name' || key === 'last_name') continue; // always keep identifiers
              if (existing[key as keyof typeof existing] != null && existing[key as keyof typeof existing] !== '') {
                delete memberData[key];
              }
            }
          }
        }
        const { error } = await supabase.from('members').update(memberData as never).eq('id', matchId);
        if (error) throw error;
        result.updated++;
        logActivity({
          event_type: 'member_updated',
          activity: `Member ${memberData.first_name} ${memberData.last_name} updated via CSV import`,
          entity_type: 'member', entity_id: matchId, member_id: matchId,
          new_value: { ...memberData, _source: 'csv_import' },
        });
      } else {
        const newMemberId = row.data.member_id || `M-${String(nextNum++).padStart(7, '0')}`;
        memberData.member_id = newMemberId;
        if (!memberData.status) memberData.status = 'active';
        const { data: created, error } = await supabase.from('members').insert(memberData as any).select('id').single();
        if (error) throw error;
        result.created++;
        logActivity({
          event_type: 'member_created',
          activity: `Member ${memberData.first_name} ${memberData.last_name} created via CSV import`,
          entity_type: 'member', entity_id: created?.id, member_id: created?.id,
          new_value: { ...memberData, _source: 'csv_import' },
        });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
    }
  }

  logActivity({
    event_type: 'member_import_batch',
    activity: `Imported members: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
    entity_type: 'member',
    new_value: { created: result.created, updated: result.updated, failed: result.failed, _source: 'csv_import' },
  });

  return result;
}

export const membersConfig: EntityConfig = {
  id: 'members',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: TEMPLATE_HEADERS,
  fullTemplateHeaders: FULL_TEMPLATE_HEADERS,
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['members'], ['member-stats']],
};
