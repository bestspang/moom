

# Full System QC Audit Report

---

## SECTION A — Executive Summary

**Overall Health:** The system is well-architected with clean surface separation, strong gamification logic, and comprehensive auth flows. Recent fixes (CORS standardization, event pipeline alignment) addressed critical backend issues. The codebase is above-average for an AI-assisted project.

**Biggest Risks:**
1. Member self-check-in bypasses validation — no QR token verification, no duplicate check, no package requirement
2. Booking creation has no server-side duplicate/capacity guard — double-click can create duplicate bookings
3. Transfer slip upload doesn't actually upload the file image to storage
4. StaffLayout hardcodes English nav labels (no i18n)
5. `cancelBooking` is a client-side write with no auth guard — any logged-in user can cancel any booking by ID

**Biggest Strengths:**
- Clean surface architecture (admin/member/trainer/staff)
- Comprehensive gamification engine with guardrails, prestige, and anti-abuse
- Good i18n coverage on member and admin surfaces
- Strong auth model with multi-role support and cross-surface switching
- Well-structured edge functions with consistent CORS

**Launch Readiness:** Launch only after critical fixes (Section B)

---

## SECTION B — Critical Bugs

### B1. Member Self-Check-In Bypasses All Validation
**Severity:** CRITICAL  
**File:** `src/apps/member/pages/MemberCheckInPage.tsx` lines 37-68  
**Problem:** `handleCheckIn()` inserts directly into `member_attendance` without:
- Validating the QR code/member code against any token
- Checking for duplicate check-in today
- Verifying the member has an active package
- Any server-side validation

A member can check in unlimited times by typing any string. The gamification event also fires each time, granting XP/Coin repeatedly. The daily cap in the edge function helps, but the attendance record itself is unbounded.

**Fix:** Route check-in through a server-side edge function or RPC that validates the QR token, checks duplicates, and verifies package status before inserting.

### B2. Booking Creation Has No Duplicate or Capacity Guard
**Severity:** CRITICAL  
**File:** `src/apps/member/api/services.ts` line 293-304  
**Problem:** `createBooking()` does a raw `insert` with no checks:
- No duplicate booking check (same member + same schedule)
- No capacity check (allows overbooking)
- No server-side validation

Double-clicking the "Book" button can create duplicate bookings. The AlertDialog provides some protection, but network delays could still cause duplicates.

**Fix:** Create a database function or RPC `create_booking_safe(schedule_id, member_id)` that atomically checks capacity + duplicates + inserts.

### B3. Cancel Booking Has No Authorization
**Severity:** CRITICAL  
**File:** `src/apps/member/api/services.ts` lines 244-255  
**Problem:** `cancelBooking(bookingId)` updates `class_bookings` by ID with no `member_id` filter. Any authenticated user who knows a booking ID can cancel any other member's booking.

**Fix:** Add `.eq('member_id', memberId)` to the update query, or use an RPC with auth validation.

### B4. Transfer Slip Image Not Actually Uploaded
**Severity:** HIGH  
**File:** `src/apps/member/api/services.ts` lines 321-336  
**Problem:** `uploadTransferSlip()` creates a `transactions` record with metadata in `notes`, but the actual slip image file selected by the user is never uploaded to storage. The `selectedFile` state in `MemberUploadSlipPage.tsx` is captured for preview but never sent.

**Fix:** Create a storage bucket for slip images, upload the file, then include the file URL in the transaction record.

---

## SECTION C — High-Priority Functional Issues

### C1. StaffLayout Nav Labels Hardcoded in English
**Severity:** MEDIUM  
**File:** `src/apps/staff/layouts/StaffLayout.tsx` lines 6-12  
**Problem:** `STAFF_NAV` uses hardcoded strings `'Home', 'Check-in', 'Members', 'Payments', 'Profile'` instead of `t()` calls. Thai users see English-only staff nav.

**Fix:** Import `useTranslation`, move `STAFF_NAV` inside component, use `t('staff.nav.home')` etc.

### C2. StaffHomePage Has Hardcoded English UI Text
**Severity:** MEDIUM  
**File:** `src/apps/staff/pages/StaffHomePage.tsx`  
**Problem:** Multiple hardcoded strings: `"Hi, ${firstName}"`, `"Operations overview"`, `"Search members..."`, `"Check-in"`, `"Members"`, `"Classes"`, `"today"`, `"Pending"`, `"slips"`, `"Leads"`, `"hot"`.

**Fix:** Replace all with i18n `t()` calls and add keys to `en.ts`/`th.ts`.

### C3. Trainer Staff ID Resolution May Fail for Non-Identity-Mapped Trainers
**Severity:** MEDIUM  
**File:** `src/apps/trainer/pages/TrainerHomePage.tsx` lines 31-44  
**Problem:** Queries `identity_map` for `entity_type: 'staff'`, but the `handle_new_user` trigger only creates identity_map entries for `entity_type: 'member'`. Staff/trainer identity_map records must be created manually. If missing, `staffId` is null and the trainer sees ALL classes, not just their own.

**Fix:** Either create staff identity_map entries in the trigger for admin-surface signups, or resolve staffId from the `staff` table directly using `user_id`.

### C4. `checkDailyLimit` Uses UTC Midnight, Not Bangkok Time
**Severity:** MEDIUM  
**File:** `supabase/functions/gamification-process-event/index.ts` lines 160-176  
**Problem:** `todayStart.setUTCHours(0, 0, 0, 0)` uses UTC midnight, but the gym operates in Asia/Bangkok (UTC+7). A member checking in at 1 AM Bangkok time would be counted as "yesterday" in UTC. Daily caps reset at 7 AM Bangkok time instead of midnight.

**Fix:** Calculate Bangkok midnight: `const bangkokOffset = 7 * 60 * 60 * 1000; const bangkokMidnight = new Date(Date.now() - ((Date.now() + bangkokOffset) % 86400000));`

### C5. Reward Redemption Fires Client-Side Gamification Event After Server Call
**Severity:** LOW  
**File:** `src/apps/member/features/momentum/RewardDropCard.tsx` lines 37-42  
**Problem:** After `redeemReward()` succeeds (server-side), the component fires `fireGamificationEvent({ event_type: 'reward_redeemed' })` — but the edge function already handles redemption logic server-side. This creates a redundant event that likely gets rejected (no matching rule), but adds unnecessary load.

**Fix:** Remove the client-side `fireGamificationEvent` call since `gamification-redeem-reward` edge function handles all logic.

---

## SECTION D — UX/UI Problems

### D1. Member Check-In Page: Misleading "Member Code" Field
**Page:** `/member/check-in`  
**Problem:** The manual code input asks for a "member code" but `handleCheckIn` ignores whatever is typed — it inserts a check-in using `memberId` from session regardless. The QR scanner also ignores QR content — any QR triggers a check-in.  
**Severity:** HIGH — creates false sense of validation  
**Fix:** Either validate the code against the location QR token, or remove the manual code input and just have a single "Check In" button.

### D2. Staff Home Page Lacks Navigation Header
**Page:** `/staff`  
**Problem:** `StaffLayout` has no header component (unlike Member/Trainer layouts). The content starts at `pb-20` with no top padding or header bar, making it feel incomplete.  
**Severity:** LOW  
**Fix:** Add a `StaffHeader` component similar to `TrainerHeader`.

### D3. Momentum Page Hero: Text May Be Unreadable
**Page:** `/member/momentum`  
**Problem:** The hero section uses `hsl(var(--primary))` as background with white text. Depending on the theme's primary color, contrast may be insufficient.  
**Severity:** LOW  
**Fix:** Add explicit WCAG-compliant foreground color or use a fixed dark gradient.

---

## SECTION E — Code / Architecture Problems

### E1. XP Thresholds Hardcoded in Frontend
**Area:** `src/apps/member/features/momentum/types.ts`  
**Problem:** `XP_THRESHOLDS` array is hardcoded (lines 119-141), duplicating data that should come from `gamification_levels` table. If admin changes level thresholds in Gamification Studio, the member UI won't reflect changes until code is updated.  
**Fix:** Fetch level thresholds from DB or add a `fetchLevelThresholds()` API call. Alternatively, document that this is an intentional cache and must be kept in sync.

### E2. Google OAuth SVG Icon Duplicated 3 Times
**Area:** `AdminLogin.tsx`, `MemberLogin.tsx`, `MemberSignup.tsx`  
**Problem:** The exact same Google icon SVG is copy-pasted in 3 files (15 lines each × 3 = 45 lines of duplication).  
**Fix:** Extract to `<GoogleIcon />` component.

### E3. `any` Type Assertions Throughout Services
**Area:** `src/apps/member/api/services.ts`  
**Problem:** Extensive use of `as any` type casts (lines 248, 299, 327-329) instead of proper typing. This bypasses TypeScript safety.  
**Fix:** Use the generated Supabase types or create proper type assertions.

---

## SECTION F — Gamification Readiness Findings

**What Works:**
- XP/Coin earning via events (after recent pipeline fix)
- Level progression with prestige gating (levels 18-20)
- Quest assignment, progress tracking, and claiming
- Badge auto-unlock based on conditions
- Reward redemption with level/stock/balance checks
- Anti-abuse: cooldowns, daily caps, idempotency keys
- Economy guardrails read from DB (not hardcoded)
- Streak tracking and freeze mechanism
- Squad system with social feed and reactions
- Trainer scoring (Coach/Partner separation)
- Admin Studio with 14 management tabs

**What is Weak:**
- Daily limit check uses UTC instead of Bangkok timezone (C4)
- Frontend XP thresholds hardcoded (E1)
- Redundant client-side gamification event on reward redeem (C5)

**What is Missing:**
- Shop purchase flow (event exists but no producer yet)
- `open_gym_45min` event — no producer exists (system timer not implemented)
- Streak 7-day and 30-day auto-triggering — `updateStreak` only updates the snapshot, no automatic streak milestone event firing

**What is Risky:**
- Self-check-in bypasses all validation (B1) — members can farm XP
- No rate limiting on booking creation (B2)

---

## SECTION G — End-to-End Flow Matrix

| Flow | Status | Notes |
|---|---|---|
| Member signup (email) | Works | Redirects to login after signup |
| Member signup (phone) | Needs manual test | Phone OTP requires Twilio config |
| Member login (password) | Works | |
| Member login (Google) | Works | Lovable + custom domain paths |
| Member login (email OTP) | Needs manual test | Depends on email provider config |
| Member login (phone OTP) | Needs manual test | Depends on Twilio |
| Legacy account claim | Works | handle_new_user checks existing email |
| Land on correct home | Works | Surface detection + redirect logic |
| See package summary | Works | |
| See quests | Works | |
| See rewards | Works | |
| See badges | Works | |
| Book class | Works but weak | No duplicate/capacity guard (B2) |
| Cancel booking | Broken (security) | No auth check on cancel (B3) |
| Check-in (member) | Broken | No validation (B1) |
| Upload payment slip | Broken | Image not uploaded (B4) |
| Redeem reward | Works | Server-side validation |
| View profile / edit | Works | |
| Trainer login | Works | |
| Trainer schedule | Works but weak | StaffId resolution may fail (C3) |
| Trainer impact | Works | |
| Staff login | Works | |
| Staff check-in | Works | |
| Admin login | Works | |
| Non-admin blocked | Works | ProtectedRoute + access levels |
| Create/edit package | Works | |
| Manage gamification | Works | Full Studio with 14 tabs |
| Transfer slip review | Works | |
| Diagnostics | Works | Auth + Surface + Data audit pages |

---

## SECTION H — Priority Fix Plan

### 1. Must Fix Before Launch
1. **B1** — Member self-check-in validation (server-side)
2. **B2** — Booking duplicate/capacity guard (server-side RPC)
3. **B3** — Cancel booking auth check (add member_id filter)
4. **B4** — Transfer slip image upload (storage bucket + upload)

### 2. Should Fix Soon After Launch
5. **C1** — Staff nav i18n
6. **C2** — Staff home page i18n
7. **C3** — Trainer staffId resolution fix
8. **C4** — Bangkok timezone for daily limits
9. **C5** — Remove redundant reward_redeemed event

### 3. Nice to Improve Later
10. **E1** — Fetch XP thresholds from DB
11. **E2** — Extract Google icon component
12. **E3** — Remove `any` casts in services
13. **D2** — Staff header component
14. **D3** — Momentum hero contrast

---

## SECTION I — Exact Fix Recommendations

| Issue | Root Cause | Fix Direction | Layer |
|---|---|---|---|
| B1 Check-in bypass | Direct client insert, no validation | Create `member-self-checkin` edge function that validates QR token + duplicate + package | Backend |
| B2 Booking duplicate | Raw insert, no server guard | Create `create_booking_safe` RPC with capacity + uniqueness check | Backend |
| B3 Cancel auth | Missing member_id filter | Add `.eq('member_id', memberId)` or use RPC | Backend |
| B4 Slip image | File never sent to storage | Create `slip-images` bucket, upload in mutation, store URL | Backend + Frontend |
| C1 Staff i18n | Hardcoded strings | Add `useTranslation` to StaffLayout | Frontend |
| C4 Timezone | UTC midnight vs Bangkok | Use `Asia/Bangkok` offset for day boundary | Backend |
| E1 XP thresholds | Hardcoded array | Fetch from `gamification_levels` table | Frontend |

---

## SECTION J — Final Launch Recommendation

**Launch only after critical fixes (B1-B4).**

B1 (check-in bypass) is the most dangerous — it allows unlimited XP farming and fake attendance data. B3 (cancel auth) is a data integrity risk. B2 (booking) causes overbooking. B4 (slip upload) is a broken user-facing feature.

The gamification engine, auth system, and admin tooling are solid. The architecture is clean and maintainable. After fixing the 4 critical items, the platform is ready for a controlled launch.

