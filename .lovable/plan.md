

# Milestone 3: Split MemberDetails.tsx (901 lines) into Tab Components

## Current State

`MemberDetails.tsx` is 901 lines containing:
- 10 tab contents (home, profile, attendance, packages, billing, injuries, notes, communications, suspensions, contract)
- 6 inline form dialogs (injury, suspension, contract) with their own state
- 6 column definition arrays
- Profile edit state and handlers
- All wired to 12+ hooks

Previous milestones completed:
1. Route security hardening (all routes now guarded)
2. Finance.tsx split (806 → ~270 lines + 5 sub-components)

## Why This Milestone

MemberDetails is the most complex page in the app and the hardest to maintain. Each tab is functionally independent, making extraction safe and high-value. Same proven pattern as Finance split.

## Plan

Extract each tab's content + column definitions + inline dialogs into dedicated components under `src/components/members/tabs/`:

| New File | Contents | ~Lines |
|----------|----------|--------|
| `MemberHomeTab.tsx` | Account details grid + MemberTimeline | ~50 |
| `MemberProfileTab.tsx` | Profile edit form + draft state + handlers | ~100 |
| `MemberAttendanceTab.tsx` | Attendance columns + DataTable | ~30 |
| `MemberPackagesTab.tsx` | Package status sub-tabs + columns + DataTable + purchase button | ~60 |
| `MemberBillingTab.tsx` | Billing columns + DataTable | ~30 |
| `MemberInjuriesTab.tsx` | Injury columns + add injury dialog + mark recovered | ~80 |
| `MemberNotesTab.tsx` | Notes list + add note form | ~50 |
| `MemberSuspensionsTab.tsx` | Suspension columns + add suspension dialog + end suspension | ~70 |
| `MemberContractsTab.tsx` | Contract columns + add contract dialog | ~50 |
| `index.ts` | Barrel exports | ~10 |

**Modify:** `src/pages/MemberDetails.tsx` → reduced to ~250 lines: hooks, sidebar profile/contact cards, stats, tab shell, front desk notes, purchase dialog.

### Approach
- Each tab component receives only the data/handlers it needs as props
- Dialog state (injury form, suspension form, contract form) moves INTO its tab component
- Column definitions move INTO their respective tab components
- Profile edit state + handlers move into `MemberProfileTab`
- Parent keeps: member data fetching, sidebar rendering, stats, tab navigation shell
- Zero behavior change

### Risk
- **Zero regression**: Pure extraction. No logic changes, no hook changes.
- **Rollback**: Revert the files.

### Files
- **Create**: 10 files in `src/components/members/tabs/`
- **Modify**: `src/pages/MemberDetails.tsx` (reduce from 901 to ~250 lines)

