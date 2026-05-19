# Lobby Surface Audit

Date: 2026-05-19
Scope: `src/pages/Lobby.tsx`, `src/hooks/useLobby.ts`, `src/components/lobby/*`, related i18n + RBAC.

## 1. Button → handler trace

| UI element | Component | Handler / Hook | DB effect | Side effects | Status |
|---|---|---|---|---|---|
| Check-in (toolbar) | `Lobby.tsx` → `CheckInDialog` | `useCreateCheckIn` | insert `member_attendance` | `logActivity('member_check_in')`, `fireGamificationEvent('check_in')`, invalidate `check-ins` + `dashboard-stats`, toast | WORKING |
| QR Code (toolbar) | `Lobby.tsx` → `CheckInQRCodeDialog` | `useCheckinQR` | generate signed QR via edge fn | none on display side | WORKING |
| DatePicker | `Lobby.tsx` | local `setSelectedDate` → resets `page=1` | re-query `useCheckIns` | KPI strip + table refresh | WORKING |
| SearchBar | `Lobby.tsx` | local `setSearch` → resets `page=1` | server-side filter inside `useCheckIns` | — | WORKING |
| Filters (location/method/package) | `LobbyFilters.tsx` | local `setFilters` → resets `page=1` | client-side filter on `checkInData` | popover badge shows active count | WORKING |
| Row click | `DataTable.onRowClick` | `setDetailsRow(row)` | — | opens drawer | WORKING |
| Open member profile (drawer) | `CheckInDetailsDrawer.tsx` | `navigate('/members/:id/detail')` | — | route mount | **FIXED** (was `/members/:id` which is the Staff-surface route; admin route is `/members/:id/detail`). Verified against `NeedsAttentionCard`, `Members.tsx`, `MembersAtRisk.tsx` |
| Pagination prev/next | `DataTable` | `setPage` | — | slice change | WORKING |
| KPI strip | `LobbyKpiStrip` | reads raw `checkInData` (not filtered) | — | intentional: today totals are not affected by toolbar filters | WORKING (by design) |

## 2. RBAC matrix

| Action | Permission gate | Owner (L4) | Manager (L3) | Trainer (L2) | Front desk (L1) |
|---|---|---|---|---|---|
| View Lobby page | route `can('lobby','read')` | ✅ | ✅ | ✅ | ✅ |
| Check-in button | `can('lobby','write')` | ✅ | ✅ | ❌ (L2 default = read-only for lobby) | ✅ |
| QR Code button | `can('lobby','write')` | ✅ | ✅ | ❌ | ✅ |
| Open details drawer | implicit (`lobby.read`) | ✅ | ✅ | ✅ | ✅ |
| Open member profile (drawer footer) | `can('members','read')` | ✅ | ✅ | ❌ (L2 default lacks `members`) | ✅ (L1 default has `members.read`) |
| Filters / Pagination | none (read-only UI) | ✅ | ✅ | ✅ | ✅ |

Source of defaults: `getDefaultPermissions()` in `src/hooks/usePermissions.ts`.

## 3. Realtime

- `member_attendance` ∈ `TABLE_INVALIDATION_MAP` (`src/hooks/useRealtimeSync.ts:58`) → invalidates `check-ins`, `dashboard-stats`, `member-attendance`, `gym-checkins`.
- New rows pass through `recentIds` set → 3 s pulse via `rowClassName` on `DataTable`.
- LIVE badge animation (`animate-ping`) is purely cosmetic — no signal to verify.

## 4. i18n parity

- `lobby.*` namespace: EN ⇄ TH parity verified (run `node scripts/compare-i18n.mjs`).
- New keys added in this audit: see EN/TH `lobby.help.*` below.

## 5. Help / tooltip sync

Previously **no help tooltips existed** for the Lobby toolbar. Added (EN+TH):

- `lobby.help.filters` — "Filter by location, check-in method, or package type. Click any row to see details."
- `lobby.help.checkInButton` — "Manually create a check-in for a member."
- `lobby.help.qrButton` — "Show the kiosk QR so members can self-check-in."

These are surfaced via `title=` attribute on the existing buttons (no new components).

## 6. Dead code

- None. All `src/components/lobby/*.tsx` have ≥1 importer.

## 7. Bugs found & fixed

1. **Drawer navigated to wrong admin route** — `CheckInDetailsDrawer` used `/members/:id` (Staff surface) instead of `/members/:id/detail` (admin). Fixed.

## 8. Open items (not addressed in this audit)

- KPI strip uses raw data, not filtered data. By design (today totals). Documented for future readers.
- `useCheckIns` server query has no upper limit; relies on Supabase default 1000 cap. Acceptable for daily check-ins.
