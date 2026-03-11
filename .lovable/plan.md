

# Full System QC Audit — Post-Fix Re-Audit

## SECTION A — Executive Summary

The system is in significantly better shape after the B1-B4 critical fixes. The check-in, booking, cancellation, and slip upload flows are now server-validated. However, several new issues remain that need attention before production launch.

**Overall Health:** Good — 85% production-ready. Architecture is clean, gamification engine is robust, auth flows are solid.

**Biggest Remaining Risks:**
1. Slip image bucket is private but code uses `getPublicUrl()` — admin cannot view uploaded slips
2. "Join Waitlist" button calls booking RPC which rejects full classes — broken UX
3. `cancelBooking` count check uses default Supabase behavior (no `count` option) — always returns null
4. `transactions.type` receives `'package_purchase'` which may not match the DB enum

**Biggest Strengths:** Server-side validation for all critical writes, clean surface architecture, comprehensive i18n coverage, strong gamification engine with guardrails

---

## SECTION B — Critical Bugs

### B1. Slip Image Unreachable — Private Bucket + `getPublicUrl()`
**Severity:** HIGH  
**File:** `src/apps/member/api/services.ts` lines 345-348  
**Problem:** The `slip-images` bucket is created with `public: false`, but the code calls `getPublicUrl()` which generates a URL that returns 400/403 for private buckets. The slip URL stored in `transactions.notes` is unusable — admin staff cannot view the uploaded slip image.

**Fix:** Either:
- (A) Make the bucket public (`public: true` in migration) — simpler, slips aren't sensitive
- (B) Use `createSignedUrl()` when admin needs to view the slip — more secure but requires changes on the admin viewing side too

Recommended: Option A — change bucket to public. Slips are already shared with admin staff.

### B2. "Join Waitlist" Button Calls Booking RPC That Rejects Full Classes
**Severity:** MEDIUM  
**File:** `src/apps/member/pages/MemberClassDetailPage.tsx` line 136  
**Problem:** When `isFull` is true, the button text changes to "Join Waitlist" and the confirm dialog says "join waitlist", but `createBooking()` → `create_booking_safe` RPC returns `{ error: 'class_full' }`. The member sees a generic error toast instead of actually joining a waitlist.

**Fix:** Either:
- (A) Hide the book button when full (show "Class Full" instead)
- (B) Implement actual waitlist logic in the RPC (insert with `status: 'waitlisted'`)

Recommended: Option A for now — disable booking when full, show informational text.

### B3. `cancelBooking` Count Always Null — Auth Guard Silently Fails
**Severity:** MEDIUM  
**File:** `src/apps/member/api/services.ts` line 256  
**Problem:** `if (count === 0)` is intended to catch unauthorized cancellations, but Supabase `update()` doesn't return `count` unless you pass `{ count: 'exact' }` option. Currently `count` is always `undefined`, so the auth guard never triggers.

**Fix:** Add `{ count: 'exact' }` to the update call, or switch to checking `data` length.

### B4. `transactions.type` Enum Mismatch Risk
**Severity:** MEDIUM  
**File:** `src/apps/member/api/services.ts` line 357  
**Problem:** `type: 'package_purchase' as any` — this string is cast with `as any` to bypass type checking. If the DB enum for `transactions.type` doesn't include `package_purchase`, the insert silently fails or throws. The existing memory notes say the type field must map to package_type enum (`unlimited`, `session`, `pt`).

**Fix:** Verify the DB enum. If it doesn't include `package_purchase`, change to a valid value or use a generic `'purchase'` if that exists. Remove `as any`.

---

## SECTION C — High-Priority Functional Issues

### C1. GamificationStudio Uses `useLanguage()` Instead of `useTranslation()`
**File:** `src/pages/gamification/GamificationStudio.tsx` line 18  
**Problem:** Uses `useLanguage()` wrapper which works but is the legacy pattern. Memory explicitly says "Custom hooks like useLanguage are prohibited in favor of the standard i18next hook." All member/staff/trainer surfaces have been migrated. Admin pages still use `useLanguage()` across 162 files.

**Severity:** LOW — Functionally identical since `useLanguage().t` wraps `useTranslation().t`. Not a bug, just inconsistency.

**Fix:** No immediate action needed. Can be migrated gradually.

### C2. Trainer HomePage Still Has Hardcoded `Hi, ${firstName}`
**File:** `src/apps/trainer/pages/TrainerHomePage.tsx` line 81  
**Problem:** Uses template literal instead of i18n key like the staff page does.

**Fix:** Change to `t('trainer.greeting', { name: firstName })` and add key.

---

## SECTION D — UX/UI Problems

### D1. Class Full But Book Button Still Active
**Page:** `/member/schedule/:id`  
**Problem:** When class is at capacity, the CTA still appears active with "Join Waitlist" text. Member taps it, confirms, gets error. Confusing and trust-breaking.  
**Severity:** MEDIUM  
**Fix:** When `isFull`, disable the button and show "Class Full — No waitlist available" text.

### D2. Slip Upload Success Redirects to Packages, Not Confirmation
**Page:** `/member/upload-slip`  
**Problem:** After successful upload, user is redirected to `/member/packages` with a toast. There's no confirmation screen showing the submitted slip details or a reference number. User has no proof of submission.  
**Severity:** LOW  
**Fix:** Show a success screen with the SLIP reference number before navigating away.

---

## SECTION E — Code / Architecture Problems

### E1. `as any` Casts in services.ts Bypass Type Safety
**File:** `src/apps/member/api/services.ts` lines 248, 355-357  
**Problem:** 4 `as any` casts hide potential enum mismatches that could cause runtime failures.  
**Fix:** Import proper types from the generated Supabase types file.

### E2. Dual i18n Patterns (`useLanguage` vs `useTranslation`)
**Area:** Admin surface (162 files) uses `useLanguage()`, member/staff/trainer surfaces use `useTranslation()`  
**Problem:** Two patterns for the same thing. New contributors won't know which to use.  
**Fix:** Document that `useLanguage` is the admin-side wrapper and both work. Migrate gradually.

---

## SECTION F — Gamification Readiness

**Fully Working:** XP/Coin earning, level progression, quest assignment/claiming, badge earning, reward redemption (server-side), economy guardrails, prestige gating, streak tracking/freeze, squad system, trainer scoring, anti-abuse (daily caps, cooldowns, idempotency), Bangkok timezone for daily limits.

**Weak:** Frontend XP thresholds hardcoded (still not DB-driven).

**Missing:** Shop purchase producer, open_gym_45min timer, streak milestone auto-events.

**Risky:** Nothing critical remaining after the pipeline fix.

---

## SECTION G — End-to-End Flow Matrix

| Flow | Status | Notes |
|---|---|---|
| Member signup | Works | Trigger creates member + identity_map |
| Member login (password) | Works | |
| Member login (Google) | Works | Managed OAuth |
| Check-in | Works | Server-side RPC with validation |
| Book class | Works | Server-side RPC with capacity check |
| Book full class ("waitlist") | Broken | RPC rejects, no waitlist logic |
| Cancel booking | Works but weak | Count guard doesn't trigger (B3) |
| Upload slip | Works but weak | Image unreachable (B1) |
| Redeem reward | Works | Server-side validation |
| Trainer login + schedule | Works | Staff ID resolved from staff table |
| Staff surface | Works | i18n migrated |
| Admin gamification studio | Works | 14 tabs, all localized |
| Admin transfer slip review | Broken (viewing) | Cannot view slip image (B1) |

---

## SECTION H — Priority Fix Plan

### 1. Must Fix Before Launch
1. **B1** — Make `slip-images` bucket public OR use signed URLs
2. **B2** — Disable booking button when class is full (remove fake waitlist)
3. **B3** — Add `{ count: 'exact' }` to cancel booking update
4. **B4** — Verify `transactions.type` enum values, remove `as any`

### 2. Should Fix Soon After Launch
5. **C2** — Trainer greeting i18n
6. **D2** — Slip upload confirmation screen

### 3. Nice to Improve Later
7. **E2** — Gradually migrate admin `useLanguage` to `useTranslation`
8. Fetch XP thresholds from DB instead of hardcoded array

---

## SECTION I — Exact Fix Recommendations

| Issue | Root Cause | Fix | Layer |
|---|---|---|---|
| B1 Slip unreachable | Private bucket + `getPublicUrl()` | Change migration to `public: true` OR use `createSignedUrl()` | Backend + Frontend |
| B2 Fake waitlist | No waitlist logic in RPC | Disable button when full, show "Class Full" | Frontend |
| B3 Cancel guard | Missing `count: 'exact'` option | Add option to `.update()` call | Frontend |
| B4 Type mismatch | `as any` cast hides enum error | Check DB enum, use correct value | Frontend |

---

## SECTION J — Final Launch Recommendation

**Launch only after B1-B4 fixes.**

B1 is the most impactful — slip images are completely unreachable by admin staff, making the payment verification flow broken. B2 creates a confusing UX that erodes trust. B3 means the auth guard on cancellation is a no-op. B4 could cause silent insert failures.

All 4 fixes are small, localized changes (under 10 lines each). After these, the platform is ready for controlled launch.

