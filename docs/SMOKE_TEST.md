# Smoke Test Checklist — MOOM Fitness Platform

> Run after any significant change. Mark ✅ or ❌.

---

## Critical Flows

### Auth
- [ ] Admin login → dashboard loads
- [ ] Member login → `/member` home loads
- [ ] Trainer login → `/trainer` home loads
- [ ] Sign out → redirects to login

### Member Check-In
- [ ] `/member/check-in` shows QR + scan button
- [ ] QR code generates with member data
- [ ] Camera scan opens and processes QR
- [ ] Manual code input works

### Lobby Realtime
- [ ] Open Admin → Lobby in **Tab A**
- [ ] Open Staff → Lobby in **Tab B** (different browser profile / incognito)
- [ ] Trigger a manual check-in in Tab A
- [ ] **Tab B** shows the new row within ~2 seconds without manual refresh
- [ ] The new row has the "new" highlight state (≥3s) and the `LIVE` badge is visible
- [ ] Toggle a filter in Tab B → still receives subsequent realtime updates
- [ ] Approving a transfer slip (admin) reflects in member portfolio in Tab B within ~2s

### Members RBAC (visual smoke; full matrix in `docs/audit-members.md`)
- [ ] Sign in as **Front Desk** → `/members` list visible, `Add Member` button hidden, drawer shows no "Add Package" button
- [ ] Sign in as **Trainer** → can edit profile + add note, but **cannot** add package or see finance tab
- [ ] Sign in as **Manager** → all member actions visible except the Roles tab in settings
- [ ] Sign in as **Owner** → everything visible, including Archive



### Receipt/Transfer Slip
- [ ] Member uploads slip → appears in admin Transfer Slips list (status: needs_review)
- [ ] Admin approves slip → creates transaction + member_package
- [ ] Admin rejects slip → updates status, no transaction created
- [ ] Staff payments view shows same data as admin

### Gamification
- [ ] Class attendance fires `class_attend` → XP/Coin awarded
- [ ] Package purchase fires `package_purchase` → XP/Coin/SP awarded
- [ ] Check-in fires `check_in` → XP awarded, streak updated
- [ ] Level-up triggers notification
- [ ] Badge unlock works on condition match

### Navigation
- [ ] Member bottom nav: all tabs navigate correctly
- [ ] Trainer bottom nav: all tabs navigate correctly
- [ ] Admin sidebar: all links work
- [ ] No buttons show fake "coming soon" toasts on live pages

### Surface Detection
- [ ] Preview at `/` shows admin dashboard
- [ ] Preview at `/member/check-in` shows member check-in
- [ ] Published site member path works correctly

---

### UX/UI Consistency (Phase 1–5)
- [ ] All member/trainer/staff pages use MobilePageHeader (no inline BackButton)
- [ ] Member Packages: session progress bar shows used/total with color coding
- [ ] Member Packages: expiry ≤3d shows red, ≤7d shows orange
- [ ] Staff Profile: all labels show Thai when language = TH
- [ ] Staff Profile: Coming Soon items are visually disabled (no click handler)
- [ ] Staff Home: recent check-ins section shows or empty state
- [ ] Trainer Home: Impact card has tap hint + navigates to /trainer/impact
- [ ] Trainer Profile: Coming Soon items have no chevron, opacity-60
- [ ] Member Edit Profile: MobilePageHeader with back button, form still saves
- [ ] Member Upload Slip: MobilePageHeader with back button, upload still works

---

## Quick Regression Checks

- [ ] Frontend build passes (`bun run build`)
- [ ] No TypeScript errors in edge functions
- [ ] Old records still render after schema changes
- [ ] Realtime subscriptions still work (check-in counter, etc.)

---

## 🛡️ AI Change Verification Gate (run before marking any AI-driven change DONE)

Every code change produced by an AI session must pass these 5 checks. If any fails, **revert and re-plan**.

- [ ] **Build green** — `bun run build` exits 0 (catches type/import regressions)
- [ ] **Working features in the touched file still work** — manually click through the unrelated UI/handlers in the same file/component
- [ ] **No PROTECTED_FILES touched without approval** — cross-check the diff against `PROTECTED_FILES.md` (Tier 1 = never; Tier 2 = needs approval)
- [ ] **Mutations have `logActivity()`** — every `useMutation` `onSuccess` calls `logActivity({event_type, ...})`
- [ ] **i18n parity** — `node scripts/compare-i18n.mjs` reports `✅ All EN keys exist in TH!` and counts match

> See `AI_GUARDRAILS.md` (root) for the full pre-edit checklist that prevents these failures from being introduced in the first place.

---

## Lobby (filters, drawer, pagination, realtime)

- [ ] Date picker change → table + KPI strip refetch, page resets to 1
- [ ] Search → page resets to 1; clearing returns full list
- [ ] Filters popover → location / method / package each filter the table; active count badge updates; "Clear filters" resets all three
- [ ] Pagination → prev/next disabled at bounds; "Showing N-M of T" matches
- [ ] Row click → CheckInDetailsDrawer opens with member/package/check-in sections
- [ ] Drawer "Open member profile" → navigates to `/members/:id/detail` (admin route, NOT `/members/:id` which is Staff)
- [ ] New check-in via realtime → row flashes `bg-primary/10` for ~3 s
- [ ] Trainer role (`level_2_operator`): no Check-in / QR buttons visible; drawer opens but "Open member" hidden if `members.read` is false
- [ ] Front desk (`level_1_minimum`): Check-in + QR visible; drawer "Open member" visible (front desk has `members.read`)
- [ ] Tooltips: hovering Check-in / QR / Filters buttons shows EN/TH help text from `lobby.help.*`

## AI change verification gate (Lobby/check-in path)

- [ ] `bun run test` includes `src/hooks/usePermissions.test.ts` + `src/pages/Lobby.smoke.test.ts`
- [ ] `node scripts/compare-i18n.mjs` reports parity
- [ ] No new `console.log` or `toast.info('coming soon')` in `src/components/lobby/*` or `src/pages/Lobby.tsx`

## Brand Kit Propagation (added 2026-05-19)

1. Settings → Branding → change `name` to "TEST GYM" → click **Save**
2. ✅ Toast "Brand saved"
3. Navigate Admin → Sidebar shows "TEST GYM" + footer "© {year} TEST GYM"
4. Browser tab title shows "TEST GYM"
5. Open `/login` (incognito) → title = "TEST GYM Admin"
6. Open `/member/login` → title = "TEST GYM"
7. Upload logo image → favicon updates in tab
8. Click **Reset to defaults** → all surfaces revert to "MOOM CLUB"
9. Click **Export** → JSON file `brand-kit-*.json` downloads
10. RBAC: log in as Trainer → Save/Reset buttons disabled (read-only); log in as Front Desk → page redirect/blocked
