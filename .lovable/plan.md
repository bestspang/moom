

# Dashboard Strategic Enhancement — Business Growth Command Center

## Analysis from Business Owner Perspective

The current dashboard is solid for **monitoring** but weak for **decision-making**. A gym owner opens this 10x/day — they need to instantly know: "Am I growing?" "What should I do right now?" "Where's the money coming from?"

### What's Missing (High-Impact, Simple)

| Gap | Business Impact | Complexity |
|-----|----------------|------------|
| **No "Today vs Last Week" context** | Owner can't tell if today is good or bad relative to normal | Low |
| **No live activity pulse** | No sense of "what's happening RIGHT NOW" | Medium |
| **Revenue card has no breakdown** | Owner sees ฿12,000 but doesn't know: walk-ins? renewals? new sales? | Medium |
| **No quick-action shortcuts for common workflows** | Owner still navigates 3 clicks to do routine tasks | Low |
| **Schedule card doesn't show fill rate** | Can't see underbooked classes that need promotion | Low |
| **NeedsAttention is passive** | Shows problems but no suggested action buttons | Low |

## Plan (6 Surgical Changes)

### Change 1: Add "vs same day last week" context to StatCards
**Why:** "42 check-ins" means nothing without context. "42 check-ins (+18% vs last Tue)" tells you today is a great day.

- Update `useDashboardStats.ts`: Add `checkinsLastWeekSameDay` — query attendance for same weekday last week
- Update `useDashboardTrends.ts`: Add `revenueLastWeekSameDay` for revenue comparison
- Show comparison badges on Check-ins and Revenue StatCards: `+18% vs last {dayName}`

**Files:** `useDashboardStats.ts`, `Dashboard.tsx`

### Change 2: Live Activity Feed — "What's happening now"
**Why:** Creates urgency and engagement. Owner sees "Somchai just checked in", "Package sold to Nida" — feels alive.

- Create `RecentActivityFeed.tsx` — compact card showing last 5 real-time events
- Query last 5 entries from `member_attendance` + `transactions` (last 2 hours), merged and sorted by time
- Each entry: avatar initial + "Name checked in" / "Name purchased Package X" + relative time ("2m ago")
- Add to Dashboard Row 4 (replace the side-by-side layout with a 3-column: NeedsAttention | Schedule | Activity Feed on desktop, stacked on mobile)

**Files:** New `src/components/dashboard/RecentActivityFeed.tsx`, new `src/hooks/useRecentActivity.ts`, `Dashboard.tsx`

### Change 3: Schedule card — show fill rate visual
**Why:** Owner instantly sees which upcoming class is empty (needs promotion) vs full (success).

- Add fill rate indicator to each schedule row: mini progress bar or fraction badge colored by fill %
- Green (>70%), Yellow (30-70%), Red (<30%)
- Change availability display from "3/15" to a colored badge

**Files:** `Dashboard.tsx` (schedule section only)

### Change 4: Quick Command Buttons on Welcome Header
**Why:** Owner does 5 things daily: check-in, add member, schedule class, review slips, view reports. Should be 1 click.

- Add "Add Member" and "Review Slips" quick buttons to `DashboardWelcome.tsx` alongside existing Check-in and Schedule buttons
- Only show "Review Slips" when `pendingSlips > 0` (pass as prop)
- Compact icon-only on mobile, icon+text on desktop

**Files:** `DashboardWelcome.tsx`, `Dashboard.tsx`

### Change 5: NeedsAttention — add action buttons
**Why:** Showing "3 expiring packages" is passive. Adding "Send renewal reminder" or "→ View all" per section makes it actionable.

- For Expiring Packages section: add "Remind All" button (navigates to announcement page with pre-filter)
- For Declining Attendance: add "Send reach-out" button
- For Pending Slips: already has action button (keep as is)

**Files:** `NeedsAttentionCard.tsx`

### Change 6: i18n keys for new elements

- Add translation keys for: activity feed title, "just checked in", "purchased", "vs last week", "remind all", "reach out", "add member"

**Files:** `en.ts`, `th.ts`

## Layout After Changes

```text
┌─────────────────────────────────────────────────────┐
│  Welcome, Somchai 👋  [+ Member] [Schedule] [Check-in] [Review Slips(3)]  │
│  วันอังคาร, 8 เม.ย. 2569 · 5 classes · 12 check-ins                      │
├──────────────────┬──────────────────────────────────┤
│  Business Health │  Revenue Forecast (+12% MoM)     │
├────┬────┬────┬────┬────┤
│✅42│🏋️8 │📅5 │💰฿12k│👥156│  ← StatCards with "vs last week" badges
│+18%│    │    │+5%  │    │
├─────────────────────────┤
│  🎯 Goal Progress       │
├────────┬────────┬───────┤
│Needs   │Schedule│Live   │  ← 3-column on desktop
│Attention│(fill%) │Activity│
│[Remind]│        │Feed   │
├─────────────────────────┤
│ ✨ AI Daily Briefing    │
└─────────────────────────┘
```

## What Does NOT Change
- BusinessHealthCard, RevenueForecastCard, GoalProgressCard, DailyBriefingCard — existing logic untouched
- All hooks except surgical additions to `useDashboardStats`
- DB schema / RLS / Edge Functions / Auth / Routing
- All other pages

## Smoke Test
1. Dashboard loads → 5 StatCards with values
2. Check-in StatCard shows "+X% vs last {day}" when comparison available
3. Revenue StatCard shows comparison badge
4. Welcome header → 4 quick action buttons (Check-in, Schedule, Add Member, Review Slips)
5. "Review Slips" button only appears when pending slips > 0
6. Schedule card → each class row shows colored fill-rate indicator
7. Live Activity Feed → shows last 5 check-ins/purchases with relative time
8. NeedsAttention → "Remind All" button on expiring packages section
9. Mobile responsive — activity feed stacks below schedule
10. Dark mode renders correctly
11. Thai language → all new labels translated

