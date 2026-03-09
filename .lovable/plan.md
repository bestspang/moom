

# Referral Program + Enhanced Member Dashboard

## What Already Exists (No Duplication)
- **Smart Check-in**: Already fully built (`MemberCheckInPage.tsx`) with QR scanning, XP + streak via `fireGamificationEvent`, and `CheckInCelebration` animation. No changes needed.
- **Member Dashboard**: `MemberHomePage.tsx` already shows bookings, challenges, momentum, squad, leaderboard, packages, and announcements.

## What's Actually New

### 1. Referral Program (New Feature)

**UX Flow (Simple & Viral)**:
- Member taps "Invite Friends" on Home or Profile → sees unique referral link/code
- Friend signs up using that link/code → system auto-links referrer
- Both get reward points (e.g., 200 RP each) when friend completes first check-in
- Member sees referral stats: invited count, earned rewards

**Database**:
```sql
CREATE TABLE member_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_member_id uuid NOT NULL REFERENCES members(id),
  referred_member_id uuid REFERENCES members(id),
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, expired
  reward_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```
- RLS: Members can read own referrals, system inserts via Edge Function
- Each member gets a unique `referral_code` (generated on first access)

**Files**:
- `supabase/migrations/` — new `member_referrals` table + RLS
- `src/apps/member/features/referral/api.ts` — fetch/create referral code, list referrals
- `src/apps/member/features/referral/ReferralCard.tsx` — share card with copy link + stats
- `src/apps/member/pages/MemberReferralPage.tsx` — full referral page
- Update `MemberHomePage.tsx` — add ReferralCard widget
- Update `App.tsx` — add `/member/referral` route
- Update signup flow — accept `?ref=CODE` param, store in metadata

### 2. Enhanced Dashboard Widgets (Minimal Additions)

**Package Expiry Countdown** — Add to existing Active Packages section:
- Show "Expires in X days" with color-coded urgency (green > 30d, yellow 7-30d, red < 7d)
- Already have `activePackages` data, just enhance display

**Workout Streak** — Already shown via `MomentumCard`, but add a compact streak widget directly on Home:
- Pull from existing `fetchMomentumProfile` (already queried by `MomentumCard`)
- Show flame icon + streak count inline in the header area

### 3. AI Workout Recommendation (Lightweight)

- Add a small "Suggested for You" card on Home below challenges
- Edge Function calls Lovable AI (no API key needed) with member's recent attendance + preferences
- Returns 1-2 class suggestions with "Book Now" CTA
- New files: `supabase/functions/suggest-workout/index.ts`, `src/apps/member/features/suggestions/SuggestedClassCard.tsx`

## Implementation Order
1. Database migration for `member_referrals`
2. Referral API + UI (ReferralCard, ReferralPage)
3. Package expiry countdown enhancement
4. AI workout suggestion Edge Function + card
5. Route + navigation updates

## Risks
- Referral code uniqueness handled by DB constraint
- AI suggestions are non-blocking — if Edge Function fails, card simply doesn't show
- No changes to existing auth, gamification, or check-in flows

