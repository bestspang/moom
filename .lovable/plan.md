## Scope

Four additive QA layers on top of the existing 105 tests. No production-code behavior changes.

---

## 1. Members Drawer × RBAC contract test

**New file:** `src/pages/MemberDetails.rbac.test.tsx`

Render `MemberDetails` with mocked `usePermissions.can()` returning the matrix for each role and assert which Quick Actions are visible.

```text
For each role in [owner, manager, trainer, frontDesk]:
  mock can(resource, action) per docs/audit-members.md matrix
  render <MemberDetails /> with QueryClient + Router + i18n + mock member
  assert:
    - tab "Overview" + "Records" present (all roles)
    - "Edit Profile" visible iff can('members','write')
    - "Add Package" visible iff can('packages','write')
    - "Add Note" visible iff can('members','write')
    - "Manual Check-in" visible iff can('lobby','write')
    - "Archive" visible iff can('members','delete')
```

Mocks: `useAuth` (user), `usePermissions` (can fn), `supabase.from(...)` for member fetch. Pattern from `useCheckinQR.test.ts`.

---

## 2. NotificationBell tests

**New file:** `src/apps/member/features/momentum/NotificationBell.test.tsx`

```text
- renders no badge when count=0 (mock supabase head:true select → count:0)
- renders "3" badge when count=3
- renders "99+" when count=150
- click → onClick handler fired
```

**New file:** `src/hooks/useNotifications.test.ts`

```text
- useMarkAsRead: mutationFn issues update({is_read:true}) eq('id', id)
- useMarkAllAsRead: filters by user_id + is_read=false
- both onSuccess invalidate queryKey starting with 'notifications-unread-count' AND 'notifications'
```

**New file:** `src/i18n/notifications.contract.test.ts`

```text
- For each NotificationType in getNotificationTypeConfig:
    assert i18n key `notifications.types.<type>` exists in EN & TH
- assert top-level labels: notifications.markAllRead, notifications.empty,
  notifications.title exist in both locales
```

If any required key is missing in either locale → add it in the same diff (no production behavior change; pure i18n).

---

## 3. Realtime invalidation contract — expanded

**Edit:** `src/hooks/useRealtimeSync.test.ts` — append cases:

```text
- member_packages → contains 'member-packages', 'package-metrics'
- member_contracts → contains 'member-contracts'
- class_bookings → contains 'class-bookings', 'member-bookings', 'booking-count'
- packages → contains 'packages', 'package-stats'
- notifications → contains 'notifications', 'notifications-unread-count'
- transactions → contains 'transactions', 'finance-transactions'
- member_billing → contains 'member-billing'

Plus a generic guard:
- every prefix referenced by TABLE_INVALIDATION_MAP must be matched by at
  least one factory in queryKeys.ts (catch typos like 'check-in' vs 'check-ins')
```

The generic guard uses a static allowlist seeded by reading `src/lib/queryKeys.ts` source text for string literals (simple regex), not full runtime reflection.

---

## 4. Playwright E2E for QR check-in

**New deps (justified):**
- `@playwright/test@^1.49` (devDep) — industry standard; no runtime cost
- `playwright` browsers downloaded only in CI

**New files:**
- `playwright.config.ts` — single project (Chromium), `webServer` runs `bun run preview` on port 4173, baseURL from env
- `e2e/qr-checkin.spec.ts`:

```text
test('QR check-in full flow', async ({ browser }) => {
  // Two contexts: admin (generates QR) + staff (scans/validates)
  const adminCtx = await browser.newContext()
  const staffCtx = await browser.newContext()

  // 1. Programmatic login via supabase auth REST (uses env: E2E_ADMIN_EMAIL/PWD)
  // 2. adminPage → /lobby → click QR → select test location → QR svg renders
  // 3. Extract token from the QR svg (data attribute we add: data-testid="qr-token")
  // 4. staffPage → directly POST to validate via UI: open redeem URL with token
  // 5. Assert toast "Check-in successful" appears on staff
  // 6. Assert admin Lobby table shows new row within 5s (realtime)
})
```

**Required additions to production code (minimal, additive):**
- Add `data-testid="qr-token"` + `data-token={tokenData.token}` to QR `<div>` in `CheckInQRCodeDialog.tsx` (test hook only; zero UX change)
- Add `data-testid="lobby-row"` + `data-member-id` to lobby row container

**New file:** `.github/workflows/e2e.yml`
- Triggers: `pull_request` + manual `workflow_dispatch`
- Runs after `quality.yml` succeeds (or in parallel — TBD)
- Skips if `E2E_ADMIN_EMAIL` secret is missing (graceful no-op so forks don't fail)

**Required GitHub secrets (user must add):**
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_STAFF_EMAIL`, `E2E_STAFF_PASSWORD`
- `E2E_TEST_LOCATION_ID` (a known location uuid in the dev DB)
- `E2E_BASE_URL` (defaults to `http://localhost:4173` if running locally)

Plan documents this in `docs/E2E_SETUP.md`.

---

## Verification

- `bun run test` — target ~125 tests (was 105 → +20)
- `bun run lint` — clean
- `bun run build` — clean
- `node scripts/compare-i18n.mjs` — 100% parity (if any notification keys missing, add them)
- Playwright runs locally with `bunx playwright test` (after `bunx playwright install chromium`)

## Risks & Mitigation

- **Playwright in Lovable dev sandbox**: not installed by default; the CI workflow installs it. Local dev only needs it if dev wants to run e2e. Acceptable.
- **NotificationBell test** queries supabase with chained head:true — mock returns `{count, error:null}`; uses same pattern as `useCheckinQR.test.ts`.
- **Notification i18n keys may be missing** — if so, add minimal EN/TH entries inferred from `getNotificationTypeConfig`. No semantic change.
- **E2E auth**: relies on real test users in dev DB. If secrets absent, workflow skips gracefully (`if: secrets.E2E_ADMIN_EMAIL`).
- **`data-testid` additions** are zero-risk (no styling, no behavior); used only by tests.

## Preserved (not touched)

- `useRealtimeSync.ts` runtime logic (test-only file edits)
- `usePermissions.ts`, AuthContext, RLS
- `src/integrations/supabase/*`, `src/components/ui/*`
- All existing 105 tests

## Out of Scope

- Full LIFF/member-side scan simulation (uses redeem URL shortcut)
- Mobile viewport variants of E2E
- Visual regression / screenshot diffs
- Changing any RBAC default

## File Summary

```
NEW
  src/pages/MemberDetails.rbac.test.tsx
  src/apps/member/features/momentum/NotificationBell.test.tsx
  src/hooks/useNotifications.test.ts
  src/i18n/notifications.contract.test.ts
  playwright.config.ts
  e2e/qr-checkin.spec.ts
  .github/workflows/e2e.yml
  docs/E2E_SETUP.md

EDIT (minimal, additive)
  src/hooks/useRealtimeSync.test.ts          (append ~7 cases)
  src/components/lobby/CheckInQRCodeDialog.tsx (add data-testid only)
  src/pages/Lobby.tsx or LobbyTable          (add data-testid only)
  src/i18n/locales/{en,th}.ts                (only if notification keys missing)
  package.json                               (add @playwright/test devDep)
```
