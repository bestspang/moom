

# Admin Dashboard UX/UI Redesign

## Current State Analysis
The dashboard currently has a vertical stack layout: PageHeader → DailyBriefingCard → BusinessHealth + Goals → 3 StatCards → Schedule/Checkin table → RevenueForecast + NeedsAttention → FAB. It works but feels dense, lacks visual hierarchy, and the most actionable data (schedule, attention items) gets buried below the fold.

**Key issues:**
- No greeting or time-of-day context — feels impersonal
- StatCards are small with sparklines that are hard to read at 60px wide
- Schedule table dominates the page but offers low information density
- NeedsAttention card is below the fold — the most actionable items are hardest to reach
- No clear visual separation between "at a glance" and "deep dive" zones
- BusinessHealthCard score circle is too small to scan quickly
- Revenue forecast bars are plain — no month-over-month delta indicator

## Design Principles
- **Glanceable first screen**: KPIs + alerts visible without scrolling
- **Action-oriented**: Every card should lead somewhere meaningful
- **Warm & professional**: Matches MOOM brand (orange primary, teal accents, Sarabun font)
- **Zero new dependencies**: Use existing shadcn/ui + Tailwind only
- **Zero backend changes**: All data hooks already exist

## New Layout (Desktop — 1088px viewport)

```text
┌─────────────────────────────────────────────────┐
│  "Good afternoon, [Name]" + date + quick actions│
├─────────────────────┬───────────────────────────┤
│  Business Health    │  Revenue Forecast         │
│  (larger score      │  (with MoM delta badges)  │
│   + radial gauge)   │                           │
├─────────────────────┴───────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │Check │  │In    │  │Classes│  │Goals │        │
│  │-ins  │  │Class │  │Today │  │Prog  │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
├─────────────────────┬───────────────────────────┤
│  Needs Attention    │  Today's Schedule         │
│  (priority list)    │  (compact timeline)       │
│                     │                           │
├─────────────────────┴───────────────────────────┤
│  AI Daily Briefing (collapsible, bottom)        │
└─────────────────────────────────────────────────┘
```

## Specific Changes

### 1. New Welcome Header (replaces PageHeader)
- Greeting based on time of day: "Good morning/afternoon/evening, [FirstName]"
- Today's date formatted nicely
- Quick action buttons: "Quick Check-in" + "View Schedule" inline (removes FAB)

### 2. Reorganized Card Grid
- **Row 1**: BusinessHealth (left, wider with bigger score) + RevenueForecast (right, with ΔMoM badges)
- **Row 2**: 4 stat cards in a row (check-ins, in-class, classes today, goal progress summary)
- **Row 3**: NeedsAttention (left) + Schedule/Checkins table (right) — side by side
- **Row 4**: AI Briefing at the bottom (collapsible)

### 3. Improved StatCards
- Add icon to each StatCard for quick visual identification
- Increase sparkline width from 60px to 80px for readability
- Compact padding for 4-across layout

### 4. Better Schedule Section
- Remove the full-width Card wrapper — use a lighter visual container
- Default to showing only first 5 rows with "View all in Schedule →" link
- Remove SearchBar from dashboard (it's a dashboard, not a list page)

### 5. NeedsAttention Promoted
- Move from bottom to left column of Row 3
- Keep existing functionality unchanged
- More prominent position = faster action

### 6. Quick Check-in
- Replace floating FAB with inline button in the welcome header
- Cleaner, more discoverable, accessible

## Files to Change

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/Dashboard.tsx` | Rewrite layout composition: new greeting header, reordered grid, remove FAB, limit schedule rows |
| 2 | `src/components/dashboard/DashboardWelcome.tsx` | **NEW** — greeting + date + quick actions |
| 3 | `src/components/common/StatCard.tsx` | Widen sparkline from 60→80px (minor) |
| 4 | `src/i18n/locales/en.ts` | Add greeting keys: `dashboard.goodMorning`, `dashboard.goodAfternoon`, `dashboard.goodEvening`, `dashboard.welcomeBack` |
| 5 | `src/i18n/locales/th.ts` | Same keys in Thai |

## What Does NOT Change
- All data hooks (`useDashboardStats`, `useDashboardTrends`, `useBusinessHealth`, `useRevenueForecast`, `useExpiringPackages`, `useHighRiskMembers`, `useHotLeads`, `useChurnPrediction`, `useGoals`, `useDailyBriefing`)
- All existing sub-components (BusinessHealthCard, RevenueForecastCard, GoalProgressCard, NeedsAttentionCard, DailyBriefingCard, CheckInDialog)
- Sidebar, Header, MainLayout
- Backend / DB / Edge Functions
- Auth / permissions logic
- Other pages

## Smoke Test
1. Dashboard loads with greeting + correct time-of-day
2. All 4 stat cards show real data with sparklines
3. BusinessHealth + RevenueForecast render side by side
4. NeedsAttention shows expiring packages, high-risk members, hot leads, pending slips
5. Schedule table shows today's classes (max 5 rows)
6. Quick Check-in button opens CheckInDialog
7. AI Briefing collapses/expands
8. Permission gates still work (finance cards hidden for non-finance users)
9. Mobile: cards stack vertically, everything readable
10. Dark mode: all cards render correctly

