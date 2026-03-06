import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';
import type { EntityConfig, ImportRow, ImportResult, EnumFieldDef } from '../types';
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
  { value: 'transaction_id', label: 'Transaction No.', required: true },
  { value: 'order_name', label: 'Order Name', required: true },
  { value: '_type', label: 'Package Type (unlimited/session/pt)' },
  { value: '_sold_to', label: 'Sold To (info)' },
  { value: '_location', label: 'Location' },
  { value: '_price_ex_vat', label: 'Price excl VAT (info)' },
  { value: '_vat', label: 'VAT (info)' },
  { value: 'amount', label: 'Amount (incl VAT)', required: true },
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
  if (v === 'card_stripe' || v === 'stripe card') return 'card_stripe';
  if (v === 'qr_promptpay_stripe' || v === 'stripe promptpay') return 'qr_promptpay_stripe';
  if (v.includes('qr') || v.includes('promptpay')) return 'qr_promptpay';
  if (v.includes('bank') || v.includes('transfer')) return 'bank_transfer';
  if (v.includes('credit') || v.includes('card')) return 'credit_card';
  return null;
}

function normalizePackageType(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'unlimited') return 'unlimited';
  if (v === 'session' || v === 'sessions') return 'session';
  if (v === 'pt' || v === 'personal training') return 'pt';
  return null;
}

function normalizeStatus(val: string): string | null {
  const v = val.toLowerCase().trim();
  if (v === 'paid' || v === 'completed') return 'paid';
  if (v === 'voided' || v === 'void') return 'voided';
  if (v === 'refunded' || v === 'refund') return 'refunded';
  if (v === 'pending') return 'pending';
  if (v === 'needs review' || v === 'needs_review') return 'needs_review';
  return null;
}

const ENUM_FIELDS: EnumFieldDef[] = [
  {
    field: '_type',
    label: 'Package Type',
    options: [
      { value: 'unlimited', label: 'Unlimited' },
      { value: 'session', label: 'Session' },
      { value: 'pt', label: 'PT (Personal Training)' },
    ],
    normalize: normalizePackageType,
  },
  {
    field: 'payment_method',
    label: 'Payment Method',
    options: [
      { value: 'cash', label: 'Cash' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'qr_promptpay', label: 'QR / PromptPay' },
      { value: 'credit_card', label: 'Credit Card' },
    ],
    normalize: normalizePaymentMethod,
  },
  {
    field: 'status',
    label: 'Status',
    options: [
      { value: 'paid', label: 'Paid' },
      { value: 'pending', label: 'Pending' },
      { value: 'voided', label: 'Voided' },
      { value: 'refunded', label: 'Refunded' },
      { value: 'needs_review', label: 'Needs Review' },
    ],
    normalize: normalizeStatus,
  },
];

function validateRow(data: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!data.transaction_id) errors.push('Missing transaction no.');
  if (!data.amount) errors.push('Missing amount');
  if (!data.order_name) errors.push('Missing order name');
  if (data._type) {
    const pt = normalizePackageType(data._type);
    if (!pt) errors.push(`Unrecognized package type: "${data._type}". Expected: unlimited, session, pt`);
  }
  if (data.payment_method) {
    const pm = normalizePaymentMethod(data.payment_method);
    if (!pm) errors.push(`Unrecognized payment method: "${data.payment_method}". Expected: cash, bank transfer, QR/PromptPay, credit card`);
  }
  if (data.status) {
    const s = normalizeStatus(data.status);
    if (!s) errors.push(`Unrecognized status: "${data.status}". Expected: paid, voided, refunded, pending, needs_review`);
  }
  return errors;
}

async function upsertRows(rows: ImportRow[], _qc: any, setProgress: (p: number) => void, options?: { overwrite?: boolean; defaultLocationId?: string; enumOverrides?: Record<string, Record<string, string>> }): Promise<ImportResult> {
  const enumOverrides = options?.enumOverrides || {};
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

  // Helper to resolve enum with overrides
  const resolveEnum = (field: string, rawVal: string, normalizeFn: (v: string) => string | null): string | null => {
    const normalized = normalizeFn(rawVal);
    if (normalized) return normalized;
    // Check overrides
    const fieldOverrides = enumOverrides[field];
    if (fieldOverrides) {
      const override = fieldOverrides[rawVal.toLowerCase().trim()];
      if (override) return override;
    }
    return null;
  };

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
      };

      // Map _type to package_type enum
      if (row.data._type) {
        const pt = resolveEnum('_type', row.data._type, normalizePackageType);
        if (pt) tx.type = pt;
      }

      const dt = parseDatetime(row.data._datetime || '');
      if (dt) tx.created_at = dt;

      if (row.data.payment_method) {
        const pm = resolveEnum('payment_method', row.data.payment_method, normalizePaymentMethod);
        if (pm) tx.payment_method = pm;
      }

      if (row.data.status) {
        const s = resolveEnum('status', row.data.status, normalizeStatus);
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
  enumFields: ENUM_FIELDS,
  templateHeaders: ['transaction_id', 'order_name', 'amount', 'payment_method', 'status', 'date', 'location', 'notes'],
  validateRow,
  upsertRows,
  queryKeysToInvalidate: [['transactions']],
};
