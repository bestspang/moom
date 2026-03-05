

# Align Export/Template with Real-World CSV Formats

The user uploaded 4 sample CSVs showing the actual columns they use. Here's the gap analysis and plan.

---

## 1. Promotions Export

**Sample headers**: `Name, Type, Promo code, Discount, Started on, Ending on, Date modified, Status`

**Current headers**: `Name, Type, Promo Code, Discount Type, Discount Value, Start Date, End Date, Status`

**Changes needed**:
- Merge `Discount Type` + `Discount Value` → single `Discount` column (show `1290฿` or `10%` or `Varies` for per-package)
- Rename headers: `Promo code`, `Started on`, `Ending on`, `Date modified`
- Add `Date modified` from `updated_at`
- Promo code: show `-` when null
- Dates: format as `d MMM yyyy` uppercase (e.g. `31 MAR 2026`)
- Update `TEMPLATE_HEADERS` to match

## 2. Staff Export

**Sample headers**: `Firstname, Lastname, Nickname, Role, Gender, Birthdate, Email, Phone, Address, Branch, Status`

**Current headers**: `First Name, Last Name, Phone, Email, Status` (missing 6 columns!)

**Changes needed**:
- Add: `Nickname`, `Role` (joined position names), `Gender`, `Birthdate`, `Address` (concatenated), `Branch` (location scope)
- Reorder to match sample
- Update `TEMPLATE_HEADERS`

## 3. Finance (Transactions) Export

**Sample headers**: `Date & Time, Transaction no., Order name, Type, Sold to, Register location, Price excluding vat, VAT @7%, Price including vat, Sold at, Payment method, Tax invoice no., Status, Staff`

**Current headers**: `Date & Time, Transaction No, Order Name, Type, Sold To, Location, Amount, Payment Method, Status` (missing 5 columns!)

**Changes needed**:
- Add: `Register location`, `Price excluding vat` (amount / 1.07), `VAT @7%` (amount - excl), `Price including vat` (amount), `Sold at` (location), `Tax invoice no.`, `Staff`
- Date format: `d MMM yyyy, HH:mm` uppercase
- Payment method: map `promptpay` → `QR PromptPay`, `cash` → `Cash`, etc.
- Update template headers

## 4. Transfer Slips Export

**Sample**: Empty CSV uploaded — user likely wants same format as Finance transactions (bank_transfer subset). Keep current slip export but align headers with Finance format.

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/pages/Promotions.tsx` | Update `csvColumns`, `TEMPLATE_HEADERS`, discount display logic |
| `src/pages/Staff.tsx` | Update `csvColumns`, `TEMPLATE_HEADERS`, add nickname/role/gender/birthdate/address/branch columns |
| `src/pages/Finance.tsx` | Update `handleExportCsv` columns + `handleDownloadTxTemplate` headers to include VAT breakdown, tax invoice, staff, location mapping |

## Risk
- Zero regression: only changing export CSV output and template headers
- No DB/schema changes
- Table UI columns unchanged

