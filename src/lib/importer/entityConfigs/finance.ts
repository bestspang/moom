import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult } from '../types';
import { parseDatetime, parseCurrency, dash } from '../normalizers';

const HEADER_ALIASES: Record<string, string> = {
  'date & time': '_datetime', 'date': '_datetime',
  'transaction no.': 'transaction_id', 'transaction no': 'transaction_id', 'transaction_id': 'transaction_id',
  'order name': 'order_name', 'order_name': 'order_name',
  'type': '_type',
  'sold to': '_sold_to',
  'register location': '_location', 'location': '_location',
  'price excluding vat': '_price_ex_vat', 'price excl vat': '_price_ex_vat',
  'vat @7%': '_vat', 'vat': '_vat',
  'price including vat': 'amount', 'price incl vat': 'amount', 'amount': 'amount',
  'sold at': '_sold_at',
  'payment method': 'payment_method', 'payment_method': 'payment_method',
  'tax invoice no.': '_tax_invoice', 'tax invoice no': '_tax_invoice',
  'status': 'status',
  'staff': '_staff',
  'notes': 'notes',
};

const TARGET_FIELDS = [
  { value: '__skip__', label: 'Skip' },
  { value: '_datetime', label: 'Date & Time' },
  { value: 'transaction_id', label: 'Transaction No.' },
  { value: 'order_name', label: 'Order Name' },
  { value: '_type', label: 'Type (info)' },
  { value: '_sold_to', label: 'Sold To (info)' },
  { value: '_location', label: 'Location' },
  { value: '_price_ex_vat', label: 'Price excl VAT (info)' },
  { value: '_vat', label: 'VAT (info)' },
  { value: 'amount', label: 'Amount (incl VAT)' },
  { value: '_sold_at', label: 'Sold At (info)' },
  { value: 'payment_method', label: 'Payment Method' },
  { value: '_tax_invoice', label: 'Tax Invoice (info)' },
  { value: 'status', label: 'Status' },
  { value: '_staff', label: 'Staff (info)' },
  { value: 'notes', label: 'Notes' },
];

function normalizePaymentMethod(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'cash') return 'cash';
  if (v.includes('qr') || v.includes('promptpay')) return 'qr_promptpay';
  if (v.includes('bank') || v.includes('transfer')) return 'bank_transfer';
  if (v.includes('credit') || v.includes('card')) return 'credit_card';
  return null;
}

function normalizeStatus(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'paid' || v === 'completed') return 'completed';
  if (v === 'voided' || v === 'void') return 'voided';
  if (v === 'refunded' || v === 'refund') return 'refunded';
  if (v === 'pending' || v === 'needs review') return 'pending';
  return null;
}

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.transaction_id) errors.push('Missing transaction no.');
  if (!data.amount) errors.push('Missing amount');
  if (!data.order_name) errors.push('Missing order name');
  return errors;
}

async function upsertRows(rows: ImportRow[], _qc: any, setProgress: (p: number) => void): Promise<ImportResult> {
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);
  const result: ImportResult = {
    created: 0, updated: 0, failed: invalidRows.length,
    errors: invalidRows.map(r => ({ row: r.rowIndex, reason: r.errors.join('; '), data: r.data })),
  };

  const { data: existing } = await supabase.from('transactions').select('id, transaction_id');
  const byTxId = new Map<string, string>();
  for (const t of existing || []) {
    if (t.transaction_id) byTxId.set(t.transaction_id.toLowerCase(), t.id);
  }

  // Resolve locations
  const { data: locations } = await supabase.from('locations').select('id, name');
  const locMap = new Map<string, string>();
  for (const l of locations || []) {
    locMap.set(l.name.toLowerCase(), l.id);
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    setProgress(Math.round(((i + 1) / validRows.length) * 100));
    try {
      const txId = row.data.transaction_id.trim();
      const matchId = byTxId.get(txId.toLowerCase());

      const tx: Record<string, any> = {
        transaction_id: txId,
        order_name: row.data.order_name || txId,
        amount: parseCurrency(row.data.amount) ?? 0,
        type: 'purchase',
      };

      const dt = parseDatetime(row.data._datetime || '');
      if (dt) tx.created_at = dt;

      if (row.data.payment_method) {
        const pm = normalizePaymentMethod(row.data.payment_method);
        if (pm) tx.payment_method = pm;
      }

      if (row.data.status) {
        const s = normalizeStatus(row.data.status);
        if (s) tx.status = s;
      }

      // Resolve location
      const locName = dash(row.data._location);
      if (locName) {
        const locId = locMap.get(locName.toLowerCase());
        if (locId) tx.location_id = locId;
      }

      // Store sold_to and staff as notes
      const extraNotes: string[] = [];
      if (row.data._sold_to) extraNotes.push(`Sold to: ${row.data._sold_to}`);
      if (row.data._staff) extraNotes.push(`Staff: ${row.data._staff}`);
      if (row.data._tax_invoice) extraNotes.push(`Tax invoice: ${row.data._tax_invoice}`);
      if (row.data.notes) extraNotes.push(row.data.notes);
      if (extraNotes.length > 0) tx.notes = extraNotes.join(' | ');

      if (matchId) {
        const { error } = await supabase.from('transactions').update(tx).eq('id', matchId);
        if (error) throw error;
        result.updated++;
        logActivity({ event_type: 'transaction_updated', activity: `Transaction ${txId} updated via CSV import`, entity_type: 'transaction', entity_id: matchId, new_value: { ...tx, _source: 'csv_import' } });
      } else {
        if (!tx.status) tx.status = 'pending';
        const { data: created, error } = await supabase.from('transactions').insert(tx as any).select('id').single();
        if (error) throw error;
        result.created++;
        logActivity({ event_type: 'transaction_created', activity: `Transaction ${txId} created via CSV import`, entity_type: 'transaction', entity_id: created?.id, new_value: { ...tx, _source: 'csv_import' } });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({ row: row.rowIndex, reason: err.message || 'Unknown error', data: row.data });
    }
  }

  logActivity({ event_type: 'finance_import_batch', activity: `Imported finance: ${result.created} created, ${result.updated} updated, ${result.failed} failed`, entity_type: 'transaction', new_value: { created: result.created, updated: result.updated, failed: result.failed, _source: 'csv_import' } });
  return result;
}

export const financeConfig: EntityConfig = {
  id: 'finance',
  headerAliases: HEADER_ALIASES,
  targetFields: TARGET_FIELDS,
  templateHeaders: ['transaction_id', 'order_name', 'amount', 'payment_method', 'status', 'date', 'location', 'notes'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['transactions']],
};
