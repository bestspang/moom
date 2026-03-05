

# Fix Bulk Import Detection — Support Real CSV Headers + More Modules

## Problem
The current detection logic uses **database column names** (`member_id`, `member_since`, `temperature`) but real-world CSV exports use **human-readable headers** like `"Firstname"`, `"Joined Date"`, `"Promo code"`. None of the uploaded files match, so detection always fails.

Additionally, detection only supports `members` and `leads`, but the user has CSVs for packages, promotions, staff, and finance too.

## Root Cause
- `detectModule()` checks for DB-specific headers that don't appear in actual exported CSVs
- No aliases for human-readable/Thai column names
- Only 2 module types supported; user expects at least 6

## Plan

### 1. Expand `DetectedModule` type and detection signatures

Add support for: `members`, `leads`, `packages`, `promotions`, `staff`, `finance` (read-only/info only for modules without import support).

Each module gets **human-readable header aliases** based on the actual CSV samples:

| Module | Unique header signals |
|--------|----------------------|
| **members** | `firstname+joined date`, `member_id`, `member_since`, `medical conditions` |
| **leads** | `temperature`, `internal_notes`, `package_interest_id` |
| **packages** | `term(d)`, `sessions+price+categories`, `access locations` |
| **promotions** | `promo code`, `promo_code`, `discount+started on` |
| **staff** | `role+branch`, `firstname+role+branch` |
| **finance** | `transaction no`, `order name`, `vat`, `payment method`, `tax invoice` |

### 2. Normalize headers before matching
- Lowercase, trim, strip quotes, collapse whitespace
- Match against aliases using `includes()` for flexibility

### 3. Better filename fallback
Expand filename checks: `package` → packages, `promo` → promotions, `staff` → staff, `finance`/`transaction`/`slip` → finance

### 4. Show detected module for non-importable types
For modules without import (packages, promotions, staff, finance), show the detection result but disable the "Start Import" button with a "Coming soon" tooltip — same pattern as the module grid below.

## Files to Change

| File | Change |
|------|--------|
| `src/components/settings/BulkImportDropZone.tsx` | Rewrite `DetectedModule` type + `detectModule()` with real header aliases; expand filename fallback; disable import button for unsupported modules |

## Risk
- **Low**: Only changes detection logic in one component. No data layer or dialog changes.

