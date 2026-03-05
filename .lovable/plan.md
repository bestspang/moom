

# Bulk Import: Multi-file Drop Zone with Auto-detection

## Problem
Currently, importing requires clicking per-module buttons and uploading one file at a time. The user wants a single drop zone that accepts multiple CSV files and auto-detects which module (members/leads) each file belongs to.

## Design

### Auto-detection Logic
Score each CSV file's headers against known module signatures:
- **Members**: `first_name`, `last_name`, `member_id`, `member_since`, `line_id`, `emergency_*`, `allow_physical_contact`
- **Leads**: `first_name`, `last_name`, `temperature`, `internal_notes`, `package_interest_id`

Use unique discriminating headers (`temperature` → leads, `member_id`/`member_since`/`line_id` → members). If ambiguous, let user pick from a dropdown.

### UI Flow
1. Add a **drop zone card** at the top of the Import/Export page (above the module grid)
2. Drop zone accepts multiple `.csv` files via drag-and-drop or file picker
3. For each file dropped:
   - Parse headers
   - Auto-detect module type with confidence indicator
   - Show file name + detected type (with override dropdown if needed)
   - Show row count preview
4. User clicks "Import All" → opens the respective `ImportMembersDialog` / `ImportLeadsDialog` sequentially (or processes inline)

### Simpler approach (recommended)
Since only Members and Leads support import, and each already has a full 4-step dialog:
1. Add a multi-file drop zone at the top of the page
2. For each file: parse headers → detect type → show in a list with icon + module badge
3. User clicks "Start Import" on each file → opens the appropriate dialog pre-loaded with that file
4. Files that can't be detected show a warning + manual module selector

## Files to Change

| File | Change |
|------|--------|
| `src/pages/settings/SettingsImportExport.tsx` | Add bulk drop zone UI at top, file detection logic, file queue state |
| `src/components/members/ImportMembersDialog.tsx` | Add optional `initialFile?: File` prop to skip upload step |
| `src/components/leads/ImportLeadsDialog.tsx` | Add optional `initialFile?: File` prop to skip upload step |

## Implementation Details

### Detection function
```typescript
function detectModule(headers: string[]): { module: 'members' | 'leads' | null; confidence: number } {
  const normalized = headers.map(h => h.toLowerCase().trim());
  const memberSignals = ['member_id', 'member_since', 'line_id', 'allow_physical_contact'];
  const leadSignals = ['temperature', 'internal_notes', 'package_interest_id'];
  
  const memberScore = memberSignals.filter(s => normalized.includes(s)).length;
  const leadScore = leadSignals.filter(s => normalized.includes(s)).length;
  
  if (memberScore > leadScore) return { module: 'members', confidence: memberScore };
  if (leadScore > memberScore) return { module: 'leads', confidence: leadScore };
  // If tie or zero, check filename
  return { module: null, confidence: 0 };
}
```

### Drop zone
- Accepts `multiple` files, `.csv` only
- Shows queued files as a list with: filename, detected module badge, row count, "Import" button
- Each "Import" button opens the existing dialog with the file pre-loaded (skipping upload step)

### Dialog changes
- Both dialogs accept `initialFile?: File` — if provided, auto-process it on open (skip upload step, go straight to mapping)

## Risk
- **Low**: Additive change only. Existing per-module import buttons still work unchanged.
- Dialog changes are backward-compatible (prop is optional).

