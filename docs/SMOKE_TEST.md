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
