

# Onboarding Strikethrough + Announcement Card Replacement

## What Changes

### 1. Onboarding card: strikethrough completed steps
Determine completion state for each step:
- Step 1 (Browse schedule): always complete (they've seen the app)
- Step 2 (Book first session): `upcomingBookings.length > 0 || bookings?.some(b => b.status !== 'cancelled')`
- Step 3 (Check in for XP): `momentumProfile?.totalXp > 0`

Render completed steps with `line-through` text and a green checkmark instead of the orange number.

### 2. Hide onboarding if all 3 steps done
If all steps are complete, don't render the onboarding card at all. Remove the `isNewUser` gate — instead use the 3-step completion check.

### 3. Replace separate announcement card with compact inline card
Remove the existing `latestAnnouncement` section (lines 213-222). Instead, place the announcement card **in the same slot** as the onboarding card (when onboarding is hidden). The announcement card shows:
- Megaphone icon + message text truncated to 2 lines (`line-clamp-2`)
- "อ่านเพิ่ม" / "Read more" link

### Files
| File | Change |
|------|--------|
| `MemberHomePage.tsx` | Rewrite onboarding section with completion logic, add announcement replacement |
| `en.ts` | Add `member.readMore` key |
| `th.ts` | Add `member.readMore` key |

