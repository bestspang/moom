

# Transfer Slips Module — End-to-End Implementation Plan

## Current State Analysis

**What exists today:**
- Transfer slips are just a filtered view of the `transactions` table (where `payment_method = 'bank_transfer'`)
- No dedicated `transfer_slips` table
- No approve/reject/void workflow
- No slip detail modal
- No connection to `member_packages` or `member_billing` on approval
- Existing tables: `transactions`, `member_packages`, `member_billing`, `activity_log`

**Key constraint:** We must NOT break the existing Finance page or its transactions tab. The `transactions` table stays as-is. We add a new `transfer_slips` table that links to it.

---

## Scope

**IN:**
1. New `transfer_slips` DB table with proper schema
2. Hooks for CRUD + approve/reject/void mutations
3. Rewrite `TransferSlips.tsx` page with proper filters, search, status tabs
4. Slip detail dialog with approve/reject/void actions
5. Approve flow: atomically create `transactions` record, `member_billing` record, optionally `member_packages` record, and `activity_log` entries
6. Reject flow: require reason, log activity
7. Void flow: mark slip voided, void linked transaction, log activity
8. Import CSV into `transfer_slips` (status=needs_review)
9. Export CSV from current filtered view
10. Slips importer entity config

**OUT (future):**
- File upload/storage for slip images (no storage bucket yet)
- Stripe integration
- Billing document PDF generation
- Dedupe hash (can add later)

---

## Implementation Plan

### Step 1: Database Migration — Create `transfer_slips` table

```sql
CREATE TYPE transfer_slip_status AS ENUM ('needs_review', 'approved', 'rejected', 'voided');

CREATE TABLE transfer_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  slip_datetime timestamptz,
  member_id uuid REFERENCES members(id),
  member_name_text text,
  member_phone_text text,
  location_id uuid REFERENCES locations(id),
  amount_thb numeric NOT NULL DEFAULT 0,
  bank_reference text,
  payment_method payment_method DEFAULT 'bank_transfer',
  slip_file_url text,
  status transfer_slip_status DEFAULT 'needs_review',
  reviewer_staff_id uuid REFERENCES staff(id),
  reviewed_at timestamptz,
  review_note text,
  linked_transaction_id uuid REFERENCES transactions(id),
  package_id uuid REFERENCES packages(id),
  raw_import_row_json jsonb
);

-- Indexes
CREATE INDEX idx_transfer_slips_status ON transfer_slips(status);
CREATE INDEX idx_transfer_slips_datetime ON transfer_slips(slip_datetime);
CREATE INDEX idx_transfer_slips_amount ON transfer_slips(amount_thb);
CREATE INDEX idx_transfer_slips_linked_tx ON transfer_slips(linked_transaction_id);

-- Updated_at trigger
CREATE TRIGGER set_transfer_slips_updated_at
  BEFORE UPDATE ON transfer_slips
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE transfer_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read transfer slips"
  ON transfer_slips FOR SELECT TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));

CREATE POLICY "Managers can manage transfer slips"
  ON transfer_slips FOR ALL TO authenticated
  USING (has_min_access_level(auth.uid(), 'level_3_manager'));
```

### Step 2: Create `src/hooks/useTransferSlips.ts`

New dedicated hook file with:
- `useTransferSlipsList(filters)` — query `transfer_slips` joined with `members`, `packages`, `locations`, `staff` (reviewer)
- `useTransferSlipStats()` — counts by status
- `useTransferSlipDetail(id)` — single slip with all relations
- `useApproveSlip()` — mutation: validate → create transaction → create member_billing → optionally create member_package → update slip status → log activity
- `useRejectSlip()` — mutation: update status to rejected with review_note → log activity
- `useVoidSlip()` — mutation: update slip to voided → void linked transaction → log activity

All mutations invalidate `['transfer-slips']`, `['transfer-slip-stats']`, `['finance-transactions']`, `['transactions']`.

### Step 3: Create `src/components/transfer-slips/SlipDetailDialog.tsx`

Dialog/drawer showing:
- Slip info (datetime, member, location, amount, method, bank reference)
- If matched: linked transaction details
- Action buttons:
  - **Approve**: opens inline form to optionally select package, confirm amount, add note. On submit calls `useApproveSlip`
  - **Reject**: requires review_note text, calls `useRejectSlip`
  - **Void** (only if status=approved): calls `useVoidSlip`
- Activity log timeline for this slip (filtered from activity_log by entity_type='transfer_slip')

### Step 4: Rewrite `src/pages/TransferSlips.tsx`

- Date range picker (default: last 7 days)
- Status tabs: Needs review / Approved (Paid) / Voided
- Search input searching member name, phone, bank_reference
- Table columns: slip_datetime, transaction_no (linked or "-"), package_name, package_type, sold_to, location, amount_thb, status + review action button
- Row click opens SlipDetailDialog
- ManageDropdown with Import/Export
- Location column from joined locations

### Step 5: Create `src/lib/importer/entityConfigs/slips.ts`

Real importer (replacing the stub):
- Header aliases mapping CSV columns to transfer_slips fields
- Target fields: slip_datetime, amount_thb, payment_method, member_name/phone/id, location, bank_reference, notes
- Validation: amount required & numeric, slip_datetime parseable, payment_method normalizable
- Upsert: resolve member by id/phone/name, resolve location by id/name, insert into `transfer_slips` with status=needs_review, store raw row
- Required: amount_thb, slip_datetime. At least one of member_id/phone/name

### Step 6: Update `src/lib/importer/index.ts`

Replace the stub `slips` config with the real one from step 5.

### Step 7: Update existing hooks

- Update `useTransferSlips` and `useTransferSlipStats` in `src/hooks/useFinance.ts` to query from `transfer_slips` table instead of filtering `transactions`. Or deprecate them in favor of the new hook. The Finance page slips tab will use the new hook.

### Step 8: Update Finance page slips tab

Update `src/pages/Finance.tsx` slips tab section to use the new `useTransferSlipsList` hook instead of the old `useTransferSlips` from useFinance.

---

## Files to Create
- `src/hooks/useTransferSlips.ts`
- `src/components/transfer-slips/SlipDetailDialog.tsx`
- `src/lib/importer/entityConfigs/slips.ts`
- DB migration SQL

## Files to Modify
- `src/pages/TransferSlips.tsx` (rewrite)
- `src/pages/Finance.tsx` (update slips tab to use new hook)
- `src/hooks/useFinance.ts` (deprecate old slip hooks or redirect)
- `src/lib/importer/index.ts` (replace stub)
- `src/i18n/locales/en.ts` and `th.ts` (new keys for approve/reject/void UI)

## Risk Assessment
- **Low**: New table, additive only. No existing schema changes.
- **Medium**: Finance page slips tab changes — but it's a simple hook swap.
- Existing `transactions` table untouched. Old finance import still works.
- RLS on new table follows existing pattern (Manager+).

