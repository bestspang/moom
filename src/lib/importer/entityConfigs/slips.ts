import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { supabase } from '@/integrations/supabase/client';
import type { QueryClient } from '@tanstack/react-query';

function parseAmount(val: string): number | null {
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDatetime(val: string): string | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizePaymentMethod(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v.includes('bank') || v.includes('transfer')) return 'bank_transfer';
  if (v === 'cash') return 'cash';
  if (v.includes('qr') || v.includes('promptpay')) return 'qr_promptpay';
  if (v.includes('credit') || v.includes('card')) return 'credit_card';
  return 'bank_transfer'; // default
}

export const slipsConfig: EntityConfig = {
  id: 'slips',

  headerAliases: {
    // datetime
    slip_datetime: 'slip_datetime',
    datetime: 'slip_datetime',
    date: 'slip_datetime',
    date_time: 'slip_datetime',
    'slip date': 'slip_datetime',
    'payment date': 'slip_datetime',
    // amount
    amount: 'amount_thb',
    amount_thb: 'amount_thb',
    'จำนวนเงิน': 'amount_thb',
    // payment method
    payment_method: 'payment_method',
    method: 'payment_method',
    'payment method': 'payment_method',
    // member
    member_id: 'member_id',
    member_name: 'member_name_text',
    'member name': 'member_name_text',
    name: 'member_name_text',
    'ชื่อ': 'member_name_text',
    member_phone: 'member_phone_text',
    phone: 'member_phone_text',
    'เบอร์': 'member_phone_text',
    // location
    location_id: 'location_id',
    location: 'location_name',
    location_name: 'location_name',
    'สาขา': 'location_name',
    // bank
    bank_reference: 'bank_reference',
    reference: 'bank_reference',
    ref: 'bank_reference',
    // note
    note: 'review_note',
    notes: 'review_note',
  },

  targetFields: [
    { value: 'slip_datetime', label: 'Slip Date/Time *' },
    { value: 'amount_thb', label: 'Amount (THB) *' },
    { value: 'payment_method', label: 'Payment Method' },
    { value: 'member_id', label: 'Member ID' },
    { value: 'member_name_text', label: 'Member Name' },
    { value: 'member_phone_text', label: 'Member Phone' },
    { value: 'location_id', label: 'Location ID' },
    { value: 'location_name', label: 'Location Name' },
    { value: 'bank_reference', label: 'Bank Reference' },
    { value: 'review_note', label: 'Note' },
  ],

  templateHeaders: [
    'slip_datetime', 'amount_thb', 'payment_method',
    'member_name', 'member_phone', 'location_name',
    'bank_reference', 'note',
  ],

  validateRow: (data: Record<string, string>) => {
    const errors: string[] = [];
    if (!data.slip_datetime) errors.push('slip_datetime is required');
    else if (!parseDatetime(data.slip_datetime)) errors.push('Invalid date format for slip_datetime');

    if (!data.amount_thb) errors.push('amount_thb is required');
    else if (parseAmount(data.amount_thb) === null || parseAmount(data.amount_thb)! <= 0) errors.push('amount_thb must be a positive number');

    const hasMember = data.member_id || data.member_name_text || data.member_phone_text;
    if (!hasMember) errors.push('At least one of member_id, member_name, or member_phone is required');

    return errors;
  },

  upsertRows: async (
    rows: ImportRow[],
    queryClient: QueryClient,
    setProgress: (pct: number) => void,
  ): Promise<ImportResult> => {
    const result: ImportResult = { created: 0, updated: 0, failed: 0, errors: [] };
    const total = rows.length;

    // Pre-fetch locations for name resolution
    const { data: locations } = await supabase.from('locations').select('id, name');
    const locationMap = new Map<string, string>();
    locations?.forEach((loc) => locationMap.set(loc.name.toLowerCase(), loc.id));

    // Pre-fetch members for phone resolution
    const { data: members } = await supabase.from('members').select('id, phone, first_name, last_name');
    const memberPhoneMap = new Map<string, string>();
    members?.forEach((m) => { if (m.phone) memberPhoneMap.set(m.phone, m.id); });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.errors.length > 0) {
        result.failed++;
        result.errors.push({ row: row.rowIndex, reason: row.errors.join('; '), data: row.data });
        continue;
      }

      try {
        const d = row.data;

        // Resolve member
        let memberId: string | null = d.member_id || null;
        if (!memberId && d.member_phone_text) {
          memberId = memberPhoneMap.get(d.member_phone_text) || null;
        }

        // Resolve location
        let locationId: string | null = d.location_id || null;
        if (!locationId && d.location_name) {
          locationId = locationMap.get(d.location_name.toLowerCase()) || null;
        }

        const insertData = {
          slip_datetime: parseDatetime(d.slip_datetime),
          amount_thb: parseAmount(d.amount_thb) || 0,
          payment_method: (d.payment_method ? normalizePaymentMethod(d.payment_method) : 'bank_transfer') as any,
          member_id: memberId,
          member_name_text: d.member_name_text || null,
          member_phone_text: d.member_phone_text || null,
          location_id: locationId,
          bank_reference: d.bank_reference || null,
          review_note: d.review_note || null,
          status: 'needs_review' as any,
          raw_import_row_json: d as any,
        };

        const { error } = await supabase.from('transfer_slips').insert(insertData);
        if (error) throw error;

        result.created++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ row: row.rowIndex, reason: err.message, data: row.data });
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    return result;
  },

  queryKeysToInvalidate: [['transfer-slips'], ['transfer-slip-stats']],
};
