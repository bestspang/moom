# Lobby Enhancements Plan

## Scope
Extend the existing `src/pages/Lobby.tsx` with filters, pagination, a row details drawer, complete i18n, audited RBAC, and verified realtime — without breaking the current check-in flow, KPI strip, LIVE badge, or row-highlight animation.

## Current state (verified)
- `useCheckIns(date, search)` already supports text search → keep.
- `useRealtimeSync` is already subscribed to `member_attendance` and invalidates `check-ins` → realtime already works; row highlight runs when `checkInData` mutates.
- `DataTable` already accepts `rowClassName` → reuse.
- Lobby i18n keys (`liveBadge`, `kpiTotal`, `kpiCurrentlyIn`, `kpiPackage`, `kpiWalkIn`) exist in EN/TH → add only the new ones below.

## Changes

### 1. Filters (client-side, added to toolbar card)
- **Location filter** — `Select` populated from `useLocations()`; default "All".
- **Method filter** — `manual | qr | liff | all`.
- **Package filter** — `with package | walk-in | all`.
- Filters apply on top of `useCheckIns` results (in-memory) so server query stays unchanged.
- Active filter count → small badge on a "Filters" `Popover` trigger (keeps toolbar compact on 1169px viewport).

### 2. Pagination
- Add `pageSize` (default 25) + `page` state in `Lobby.tsx`.
- Slice filtered array; render existing `Pagination` shadcn component below `DataTable`.
- Reset `page` to 1 whenever date/search/filters change.

### 3. Row details drawer
- New `src/components/lobby/CheckInDetailsDrawer.tsx` using existing `Sheet` (shadcn) on the right.
- Sections: Member (avatar, name, member_id, phone, tier badge), Package (name, sessions used/remaining, expiry), Check-in (time, location, method, created_by staff name if present).
- Footer action: "Open member" → `navigate(/members/:id)` (gated by `can('members','read')`).
- Open via new `onRowClick` prop on `DataTable` (additive, optional) — set `cursor-pointer` only when handler is provided. Falls back to no-op for other tables.

### 4. i18n (EN + TH)
Add under `lobby.*`:
- `filters`, `filterLocation`, `filterMethod`, `filterPackage`, `filterAll`, `filterWithPackage`, `filterWalkIn`, `clearFilters`
- `pagination.showing` (`Showing {{from}}-{{to}} of {{total}}`), `pagination.rowsPerPage`
- `details.title`, `details.member`, `details.package`, `details.checkin`, `details.createdBy`, `details.openMember`, `details.noPackage`
- `newCheckinHighlight` (sr-only label for the highlighted row, used via `aria-label`)

### 5. RBAC audit (no logic added; just gates the new affordances)
| Action | Gate |
|---|---|
| View Lobby page | `can('lobby','read')` — already enforced by route |
| Open details drawer | `can('lobby','read')` |
| "Open member" in drawer | `can('members','read')` (hidden otherwise) |
| Check-in button | `can('lobby','write')` — already gated |
| QR Code button | `can('lobby','write')` — already gated |
| Filters/Pagination | read-only → no gate |

Owner=all, Manager=all, Trainer=read (no check-in/QR buttons, drawer opens read-only), Front desk=read+write (full).

### 6. Realtime verification
- No code change. Confirm `member_attendance` is in `TABLE_INVALIDATION_MAP` and the `check-ins` query key is invalidated → new rows arrive within the realtime debounce window and pass through the existing `recentIds` highlighter (3s pulse).
- Add a brief note to `docs/DEVLOG.md`.

## Files
- edit `src/pages/Lobby.tsx` — filters, pagination, row click handler, drawer wiring
- create `src/components/lobby/CheckInDetailsDrawer.tsx`
- create `src/components/lobby/LobbyFilters.tsx`
- edit `src/components/common/DataTable.tsx` — add optional `onRowClick?: (row: T) => void`
- edit `src/i18n/locales/en.ts` and `src/i18n/locales/th.ts`
- edit `docs/DEVLOG.md`

## Preserved
- `useCheckIns`, `useRealtimeSync`, DB schema, edge functions, KPI strip, LIVE badge animation, existing row-highlight logic, CheckInDialog, CheckInQRCodeDialog.

## Regression checklist
- `bun run build` passes
- Manual check-in still works; toast + activity log fire
- KPI strip numbers reflect filtered set? → **No** — KPIs use raw `checkInData` (today totals), filters only affect the table. (Documented in DEVLOG.)
- New check-in via realtime still flashes
- Trainer role: no check-in/QR buttons, drawer opens, "Open member" hidden when no members.read
- EN/TH parity verified with `scripts/compare-i18n.mjs`
