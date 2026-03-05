

# Fix: Settings Import/Export — Missing Transfer Slips + Broken Labels

## Problems Found

1. **Transfer Slips module missing** from the `modules[]` array — no card shown at all
2. **"nav.classes" label showing as raw key** — i18n has `nav.classList` not `nav.classes`, so Classes card shows "nav.classes" instead of "Class list"
3. **Classes & Workouts Import buttons appear clickable but disabled** — this is expected behavior (no import support), but visually confusing. The screenshot confirms they render as greyed-out with tooltip "Coming soon" which is correct per the existing code. No change needed here.

## Changes

### File: `src/pages/settings/SettingsImportExport.tsx`

**1) Add Transfer Slips module** to `modules[]` after the workouts entry:
```typescript
{
  id: 'slips', icon: Receipt, labelKey: 'slips',
  hasExport: false, hasImport: false, importEntity: 'slips',
  templateHeaders: ['Transaction no.','Slip file url','Slip amount','Slip datetime','Sender bank','Sender last4','Status','Review note'],
},
```
- `hasImport: false` + `hasExport: false` since there's no transfer_slips table yet — shows template download only with "Coming soon" tooltip on both buttons.
- Import `Receipt` icon from lucide-react.

**2) Fix Classes label** in `getModuleLabel()`:
Change `classes: t('nav.classes')` → `classes: t('nav.classList')`

**3) Add "slips" to `getModuleLabel()`**:
Add `slips: t('nav.transferSlips')` to the labels map.

### Total: 1 file, ~5 lines changed. Zero risk.

