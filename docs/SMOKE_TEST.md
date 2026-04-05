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

## Quick Regression Checks

- [ ] Frontend build passes (`npm run build`)
- [ ] No TypeScript errors in edge functions
- [ ] Old records still render after schema changes
- [ ] Realtime subscriptions still work (check-in counter, etc.)
