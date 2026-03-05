

# Add "Import / Export" Tab to Settings

## Overview
Add a new settings tab that provides a centralized place to bulk import/export data across all major modules (Members, Leads, Packages, Promotions, Staff, Classes, Workouts) in one place — instead of going to each page individually.

## Design
A single page with a card-grid layout. Each module gets a card showing:
- Module name + icon
- **Export** button → downloads CSV of all data for that module
- **Import** button → opens the existing import dialog (for modules that support it) or a new one
- **Download Template** button → downloads a blank CSV template

Modules to support:

| Module | Export | Import | Template |
|--------|--------|--------|----------|
| Members | ✅ (existing `exportMembers`) | ✅ (existing `ImportMembersDialog`) | ✅ |
| Leads | ✅ (existing `exportLeads`) | ✅ (existing `ImportLeadsDialog`) | ✅ |
| Packages | ✅ (reuse from Packages page) | Future | ✅ |
| Promotions | ✅ (reuse from Promotions page) | Future | ✅ |
| Staff | ✅ (reuse from Staff page) | Future | ✅ |
| Classes | ✅ (new) | Future | ✅ |
| Workouts | ✅ (new) | Future | ✅ |

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/settings/SettingsImportExport.tsx` | **Create** — new settings tab page with module cards |
| `src/pages/Settings.tsx` | **Edit** — add tab entry |
| `src/App.tsx` | **Edit** — add route |
| `src/i18n/locales/en.ts` | **Edit** — add i18n keys |
| `src/i18n/locales/th.ts` | **Edit** — add i18n keys |

## Implementation

1. **Create `SettingsImportExport.tsx`**: Grid of cards per module. Each card has Export/Import/Template buttons. Reuse existing export functions and import dialogs. For modules without import dialogs yet, show a "Coming soon" tooltip on the Import button.

2. **Add tab + route**: Add `{ value: 'import-export', label: 'Import / Export', path: '/setting/import-export' }` to Settings tabs and corresponding route in App.tsx.

3. **i18n**: Add `settings.tabs.importExport`, `settings.importExport.*` keys for EN/TH.

## Risk
- **Zero regression**: No existing functionality is modified. Only adds a new tab and page.
- Reuses existing export functions and import dialogs — no new data operations.

