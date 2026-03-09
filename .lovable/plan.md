

# Plan: Wire reward_redeemed Event, Add Leaderboard to MomentumCard, Fix Missing Header

## 1. System Analysis

The screenshot shows the member home page without the fixed MOOM header bar. The `MemberLayout` renders `<MemberHeader />` which is `fixed top-0 z-50 bg-card`. Content has `pt-14` padding. The header should be visible but the screenshot shows it missing — likely a rendering issue where `bg-card` is transparent or the header element is somehow not painting.

## 2. Three Changes

### A. Wire `reward_redeemed` gamification event

**File:** `src/apps/member/features/momentum/RewardDropCard.tsx`

In `claimMutation.onSuccess` (line 29-33), add a `fireGamificationEvent` call:
- `event_type: 'reward_redeemed'`
- `member_id: memberId`
- `idempotency_key: 'reward_redeemed:{memberId}:{rewardId}:{timestamp}'`
- `metadata: { reward_id: reward.id, points_spent: reward.pointsCost }`
- Fire-and-forget, non-blocking, same pattern as other events

Import `fireGamificationEvent` from `@/lib/gamificationEvents`.

### B. Add leaderboard entry point to MomentumCard

**File:** `src/apps/member/features/momentum/MomentumCard.tsx`

Add a tappable row at the bottom of the card (below the streak row) that links to `/member/leaderboard`. Show a Trophy icon + "View Leaderboard" text + ChevronRight, styled with a semi-transparent background matching the primary header. Use `useNavigate` from react-router-dom.

### C. Fix missing MemberHeader

**File:** `src/apps/member/components/MemberHeader.tsx`

The header has `bg-card` which may not be opaque in all theme contexts. Add explicit `bg-background` as a fallback to ensure the header is always visible with a solid background. The current `bg-card` should work but adding `shadow-sm` or ensuring the background is solid will make it reliable.

Actually, re-reading the layout — the header IS rendered. The issue might be that the user is viewing this on a route that doesn't use `MemberLayout`. But the screenshot clearly shows the member home page structure. Let me verify the header is not being hidden by any CSS.

Looking at line 45: `className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-card px-4"` — this looks correct. The `bg-card` should be a solid color. The issue might be that on this particular viewport, something is covering it or the z-index is competing.

I'll ensure the header has `bg-background` as the most reliable solid background class.

## Files to modify

1. `src/apps/member/features/momentum/RewardDropCard.tsx` — add `reward_redeemed` gamification event (~4 lines)
2. `src/apps/member/features/momentum/MomentumCard.tsx` — add leaderboard link row (~10 lines)
3. `src/apps/member/components/MemberHeader.tsx` — ensure header background is solid/visible

## Risks
- All changes are additive, zero regression risk
- Gamification event is fire-and-forget
- Header fix is a CSS-only change

