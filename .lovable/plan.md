

# Import Center — Unified Multi-Entity Import Dialog

## System Analysis

**Current state**: Two separate import dialogs (ImportMembersDialog 651 lines, ImportLeadsDialog 540 lines) with heavily duplicated logic (CSV parsing, mapping UI, preview, upsert, error CSV). Only Members and Leads are importable. BulkImportDropZone detects 7 modules but only 2 are wired.

**What works well**: The 5-step flow (upload → mapping → preview → importing → done) is proven and consistent. Header aliases + auto-mapping works. Dedup by ID/phone/email is solid.

## Plan Overview

Build a **single** `ImportCenterDialog` component that replaces both existing dialogs and adds support for Packages, Staff, Promotions, and Finance. Share all common logic in a reusable engine layer.

## Architecture

```text
src/lib/importer/
  ├── csvParser.ts          # Shared CSV parse + line parser (extracted from existing)
  ├── normalizers.ts        # Shared: parseDate, normalizeGender, normalizePhone, parseBool, parseCurrency
  ├── types.ts              # ImportRow, ImportResult, EntityConfig, Step
  ├── entityConfigs/
  │   ├── members.ts        # HEADER_ALIASES, TARGET_FIELDS, validate, upsert
  │   ├── leads.ts          # (keep existing logic, just restructured)
  │   ├── packages.ts       # New
  │   ├── staff.ts          # New
  │   ├── promotions.ts     # New
  │   └── finance.ts        # New
  └── index.ts              # Re-exports

src/components/import/
  └── ImportCenterDialog.tsx # Unified dialog, ~500 lines, entity-agnostic UI
```

## Entity Configs (mapping rules from CSV samples)

### Members (existing logic, no changes to behavior)
- Headers: Firstname→first_name, Lastname→last_name, Nickname→nickname, Gender→gender, Birthdate→date_of_birth, Phone→phone, Joined Date→member_since, Address→address_1, Medical Conditions→medical_notes
- Defaults: status=active, has_medical_conditions derived from medical_notes presence
- Dedup: member_id → phone → email
- Upsert: members table
- Invalidate: `['members', 'member-stats', 'members-enrichment']`

### Leads (existing logic, no changes)
- Dedup: phone → email
- Upsert: leads table
- Invalidate: `['leads', 'lead-stats']`

### Packages (new)
- Headers: ID→package_code (stored as metadata), Name→name_en, Type→type (Unlimited→unlimited, PT→pt, Sessions→session), Term(D)→term_days, Sessions→sessions ('-'→null), Price→price, Categories→categories ('All'→all_categories=true), Access locations→access_locations ('All'→all_locations=true), Status→status (draft→drafts)
- Dedup: by name_en+type
- Validation: require name_en, type, price, term_days
- Upsert: packages table
- Invalidate: `['packages', 'package-stats']`

### Staff (new)
- Headers: Firstname→first_name, Lastname→last_name, Nickname→nickname, Role→_roles (info-only, not auto-created), Gender→gender, Birthdate→date_of_birth, Email→email, Phone→phone, Address→address_1, Branch→_branch (info-only), Status→status (Active→active, Pending→pending, Terminated→terminated)
- Dedup: email → phone → first_name+last_name
- Validation: require first_name
- Upsert: staff table (roles/positions NOT auto-created — too complex, shown as info column in preview)
- Invalidate: `['staff', 'staff-stats']`

### Promotions (new)
- Headers: Name→name (also name_en), Type→type (Discount→discount, Promo code→promo_code), Promo code→promo_code ('-'→null), Discount→parse: "1290฿"→flat_rate_discount=1290, "10%"→percentage_discount=10, "Varies"→same_discount_all_packages=false, Started on→start_date, Ending on→end_date ('-'→null), Status→status
- Dedup: promo_code (if present) → name
- Validation: require name
- Upsert: promotions table
- Invalidate: `['promotions', 'promotion-stats']`

### Finance (new)
- Headers: Date & Time→created_at (parse "5 MAR 2026, 08:46"), Transaction no.→transaction_id, Order name→order_name, Type→type (Unlimited→purchase, Session→purchase, PT→purchase), Sold to→_sold_to (info-only), Register location→location_id (resolve by name), Price excluding vat→_price_ex_vat (info), VAT @7%→_vat (info), Price including vat→amount (parse "1,290.00"→1290), Sold at→_sold_at (info), Payment method→payment_method (Cash→cash, QR PromptPay→qr_promptpay, Bank transfer→bank_transfer, Credit→credit_card), Tax invoice no.→_tax_invoice (info), Status→status (Paid→paid, Voided→voided, Refunded→refunded), Staff→_staff (info)
- Dedup: transaction_id
- Validation: require transaction_id, amount
- Upsert: transactions table
- Invalidate: `['finance', 'finance-stats']`

### Slips
- Empty CSV → show helpful error + template download
- Template headers: Transaction no., Slip file url, Slip amount, Slip datetime, Sender bank, Sender last4, Status, Review note
- No import logic yet (no transfer_slips table exists) → show "Coming soon" with template download only

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/importer/csvParser.ts` | **Create** | Extract parseCsvLine, parseCsv from existing dialogs |
| `src/lib/importer/normalizers.ts` | **Create** | Extract parseDate, normalizeGender, normalizePhone, parseBool + new parseCurrency, parseCustomDate |
| `src/lib/importer/types.ts` | **Create** | ImportRow, ImportResult, EntityConfig interface, Step type |
| `src/lib/importer/entityConfigs/members.ts` | **Create** | Members config (aliases, fields, validate, upsert fn) |
| `src/lib/importer/entityConfigs/leads.ts` | **Create** | Leads config |
| `src/lib/importer/entityConfigs/packages.ts` | **Create** | Packages config |
| `src/lib/importer/entityConfigs/staff.ts` | **Create** | Staff config |
| `src/lib/importer/entityConfigs/promotions.ts` | **Create** | Promotions config |
| `src/lib/importer/entityConfigs/finance.ts` | **Create** | Finance config |
| `src/lib/importer/index.ts` | **Create** | Re-exports |
| `src/components/import/ImportCenterDialog.tsx` | **Create** | Unified 5-step dialog (~500 lines), entity selector in step 1 |
| `src/pages/settings/SettingsImportExport.tsx` | **Edit** | Replace ImportMembersDialog/ImportLeadsDialog with ImportCenterDialog, enable import for all modules |
| `src/components/settings/BulkImportDropZone.tsx` | **Edit** | Expand IMPORTABLE_MODULES to all 5 importable types, update onStartImport type |
| `src/i18n/locales/en.ts` | **Edit** | Add importCenter i18n keys |
| `src/i18n/locales/th.ts` | **Edit** | Add importCenter i18n keys |

## ImportCenterDialog Flow

1. **Step 1 — Entity Selection** (if not pre-selected): 6 cards (Members/Leads/Packages/Staff/Promotions/Finance), Slips shows "Coming soon"
2. **Step 2 — Upload**: Drag/drop + file picker + template downloads (minimal + full for members, single for others)
3. **Step 3 — Mapping**: Auto-map via aliases, manual override via dropdowns. Show CSV header → target field
4. **Step 4 — Preview**: First 20 rows with validation badges. Valid/error counts. Back/Import buttons
5. **Step 5 — Importing**: Progress bar
6. **Step 6 — Done**: Created/Updated/Failed counts + Download Error CSV button

## EntityConfig Interface

Each entity config exports:
```typescript
interface EntityConfig {
  id: string;
  headerAliases: Record<string, string>;
  targetFields: { value: string; label: string }[];
  templateHeaders: string[];
  fullTemplateHeaders?: string[];  // members only
  validateRow: (data: Record<string, string>) => string[];
  upsertRows: (rows: ImportRow[], queryClient, setProgress) => Promise<ImportResult>;
  queryKeysToInvalidate: string[][];
}
```

## Key Design Decisions

1. **Keep old ImportMembersDialog/ImportLeadsDialog** — don't delete them yet. They're used from Members/Leads pages directly. ImportCenterDialog is additive. Later we can deprecate.
2. **Staff roles/positions NOT auto-imported** — too complex (multi-role, location scope). Shown as info column. User must assign roles manually after import.
3. **Finance "Sold to" NOT auto-linked to members** — shown as info. Resolving abbreviated names ("วินเซ็นท์ โ.") to member_id is unreliable. Stored as text in notes field.
4. **Slips = template only** — no transfer_slips table exists, slips CSV was empty.
5. **Location resolution** — Packages/Finance resolve location names to IDs by querying locations table during upsert.

## Activity Logging

Each entity upsert function will:
- Log batch event: `{entity}_import_batch` with total counts
- Log per-row: `{entity}_created` / `{entity}_updated` with `_source: 'csv_import'`

## Risk Assessment

- **Medium**: Large change (15+ files), but mostly additive new files
- **Existing dialogs untouched** — zero regression risk for current Members/Leads import
- **No DB schema changes needed** — all target tables already exist
- **No RLS changes** — uses existing policies

## Implementation Order

1. Create `src/lib/importer/` shared layer (csvParser, normalizers, types)
2. Create 6 entity configs
3. Create ImportCenterDialog
4. Wire into SettingsImportExport + BulkImportDropZone
5. Add i18n strings

