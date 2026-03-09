

# Status Report + Remaining UX Polish

## Already Fully Implemented (No Changes Needed)

| Feature | Status | Where |
|---------|--------|-------|
| Referral notification to referrer | ✅ Complete | Edge function `gamification-process-event` lines 542-568 inserts `referral_completed` notification with "🎉 Your friend X just checked in!" |
| Social proof after check-in | ✅ Complete | `SocialProofCheckins` component in `CheckInCelebration` — shows squad names or gym-wide count |
| Check-in bottom nav | ✅ Complete | Centered prominent button in `MemberBottomNav` |
| Streak freeze | ✅ Complete | `StreakFreezeButton` in `MomentumCard` |
| Notification icons by type | ✅ Complete | `NOTIFICATION_ICON_MAP` in `MemberNotificationsPage` |
| Trainer schedule filtered by trainer | ✅ Complete | `.eq('trainer_id', staffId)` in `TrainerHomePage` |
| Header cleanup (no gear, no logs) | ✅ Complete | Clean `MemberHeader` with Bell + Avatar only |
| Trainer header + profile menu | ✅ Complete | `TrainerHeader` with avatar dropdown |

## Remaining UX Issues Found

### 1. CheckInCelebration shows hardcoded XP/RP (100 XP, 10 RP always)
- Lines 45-46: `useCountUp(100, ...)` and `useCountUp(10, ...)` — regardless of actual gamification rule
- **Fix**: Read XP/RP from the gamification rule via a query, or compute delta from profile before/after. Simplest safe approach: fetch the `check_in` rule's `xp_value`/`points_value` and pass to count-up.

### 2. CheckInCelebration auto-dismiss still fast (~6.7s)
- For a celebration with streak + XP + challenges + social proof, 6.7s is borderline
- **Fix**: Increase to ~10s (increment 1% every 100ms) — gives users time to appreciate their progress

### 3. Check-in page subtitle is generic
- "Scan QR or enter code to earn XP" — fine but could be more motivational
- **Fix**: Show streak info like "Day 5 streak! Scan to keep it going 🔥"

### 4. SocialProofCheckins visual is too subtle
- Plain text with small icon, easily missed in the celebration dialog
- **Fix**: Add slight background color, slightly larger text, maybe pulsing dot to draw attention

### 5. Empty notification state could be warmer
- Currently: generic bell icon + "No notifications yet"
- **Fix**: Friendlier copy like "You're all caught up! 🎉" with a softer illustration feel

### 6. MemberProfilePage "Support" goes to `/member/support` — no such route
- Will show 404
- **Fix**: Use toast "Coming soon" like trainer app does, or wire to a real page

### 7. Trainer profile doesn't show full name (only first name)
- Line 34: shows `{firstName}` only, no last name
- **Fix**: Show full name like member profile does

## Implementation Plan

### Files to touch:
1. `CheckInCelebration.tsx` — fetch rule XP/RP values, slower dismiss, better social proof styling
2. `MemberCheckInPage.tsx` — dynamic subtitle with streak info  
3. `SocialProofCheckins.tsx` — enhanced visual design
4. `MemberNotificationsPage.tsx` — warmer empty state
5. `MemberProfilePage.tsx` — fix Support navigation
6. `TrainerProfilePage.tsx` — show full name

### Risk: Zero — all changes are cosmetic/copy or fixing dead links. No DB/edge function changes.

