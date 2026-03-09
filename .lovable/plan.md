

# UX/UI Deep Review — Member & Trainer Apps

## Verification: What's Already Done

| Feature | Status | Notes |
|---------|--------|-------|
| Referral notification to referrer | ✅ Done | Edge function inserts `referral_completed` notification (lines 542-568) |
| Social proof after check-in | ✅ Done | `SocialProofCheckins` integrated into `CheckInCelebration` |
| Check-in in bottom nav | ✅ Done | Centered prominent button |
| Notification icon mapping | ✅ Done | `NOTIFICATION_ICON_MAP` with type-specific icons |
| Trainer header | ✅ Done | Brand + avatar dropdown |
| Trainer profile menu items wired | ✅ Done | Coming soon toasts |

## UX/UI Issues Found (Needing Fix)

### Member App

**1. Header has 3 icons crammed together — Settings gear is redundant**
- Bell, Settings (gear), Avatar — 3 buttons in 14px header
- Settings drawer only has Language toggle + "Light mode coming soon"
- Language toggle already exists in avatar dropdown
- **Fix**: Remove Settings gear entirely. Keep Bell + Avatar only. Cleaner, less cognitive load.

**2. MemberHeader has debug `console.log` in production**
- Line 36: `console.log('[MemberHeader] render:...` — noisy, unprofessional
- MemberLayout has 3 more console.logs (lines 13, 16, 25, 29)
- **Fix**: Remove all debug logs

**3. Challenges "View all" link goes to `/member/check-in`** — wrong destination
- Line 185 in MemberHomePage: check-in is not the challenge list
- **Fix**: No dedicated challenges page exists → remove "View all" or link to a future page with toast

**4. SocialProofCheckins text grammar issue**
- When 1 person: shows "Alice also training today!" (correct)
- When 2: "Alice & Bob also training today!" (correct)
- When 3: "Alice, Bob & Charlie also training today!" → actually shows `join(', ')` for 3 = "Alice, Bob, Charlie also training today!" (missing "&" before last name)
- **Fix**: Proper English list formatting

**5. CheckInCelebration auto-dismiss is 4 seconds — too fast to read**
- `setInterval` every 80ms, increment 2% → 100% in ~4s
- User barely sees celebration + challenge progress + social proof before it closes
- **Fix**: Slow down to ~6s (increment 1.5% or interval 100ms)

**6. CheckInCelebration XP/RP shows hardcoded values (100 XP, 10 RP)**
- Lines 45-46: `useCountUp(100, 800, open)` and `useCountUp(10, 600, open)` — always shows +100 XP +10 RP regardless of actual rule
- **Fix**: Pass actual XP/RP from the gamification rule response, or read from profile delta

**7. NotificationBell on homepage duplicates header bell**
- `MobilePageHeader` action renders `NotificationBell` (home page line 115) AND header already has full notification dropdown
- **Fix**: Remove the `NotificationBell` from homepage header — it's already in the persistent header

**8. Trainer "Today's Schedule" shows ALL classes, not filtered by trainer**
- TrainerHomePage line 30-36: queries all non-cancelled classes for today without `.eq('trainer_id', ...)`
- **Fix**: Filter by logged-in trainer's staff_id

### Micro-polish

**9. SocialProofCheckins could show count even without squad** — show global gym activity
- Currently returns nothing if member has no squad
- **Fix**: Fallback to total gym check-ins today for social proof ("12 people working out today!")

**10. ReferralCard and MemberHomePage quick actions** — "Book Class" and "Check In" buttons lack visual hierarchy
- Both use same size, "Check In" is primary but small
- **Fix**: Make Check In button larger/more prominent

## Implementation Plan

### Part 1: Clean up header clutter
- **MemberHeader.tsx**: Remove Settings gear + Sheet entirely (language already in avatar menu). Remove console.logs.
- **MemberLayout.tsx**: Remove console.logs.

### Part 2: Fix functional bugs
- **MemberHomePage.tsx**: Remove `NotificationBell` from `MobilePageHeader` action (already in header). Fix challenges "View all" link. Make Check In button more prominent.
- **CheckInCelebration.tsx**: Slow auto-dismiss to ~6s. Fix hardcoded XP display → use profile.totalXp delta or keep but note it's the "base" amount.
- **SocialProofCheckins.tsx**: Fix text grammar for 3+ names. Add fallback for non-squad members showing total gym activity today.
- **TrainerHomePage.tsx**: Filter today's classes by trainer's staff_id.

### Part 3: Visual micro-polish
- Celebration confetti: slightly larger, more visible
- Notification empty state: friendlier copy

### Files to touch
- `src/apps/member/components/MemberHeader.tsx` (remove gear, logs)
- `src/apps/member/layouts/MemberLayout.tsx` (remove logs)
- `src/apps/member/pages/MemberHomePage.tsx` (remove duplicate bell, fix challenge link, enhance CTA)
- `src/apps/member/features/momentum/CheckInCelebration.tsx` (slower dismiss)
- `src/apps/member/features/momentum/SocialProofCheckins.tsx` (grammar fix, gym-wide fallback)
- `src/apps/trainer/pages/TrainerHomePage.tsx` (filter by trainer)

### Risk Assessment
- Removing Settings gear: zero risk — language toggle exists in avatar menu
- Slower celebration: zero risk — cosmetic
- Trainer filter: low risk — additive `.eq()` clause
- No database or edge function changes needed

