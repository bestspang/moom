

# Phase 1 Status: Already Implemented

After reviewing the current codebase, **all three Phase 1 items are already implemented** from the previous implementation round:

## What's Already Done

1. **Sidebar restructured** (`Sidebar.tsx`): Groups are Daily (Dashboard, Lobby, Schedule) → People (Members, Leads) → Business (Packages, Promotions, Finance, Reports) → Your Gym (Classes, Rooms, Staff, etc.) with collapsible sections.

2. **NeedsAttentionCard** (`NeedsAttentionCard.tsx`): Consolidates expiring packages, high-risk members, hot leads, and pending transfer slips into a unified dashboard section.

3. **StatCard sparklines** (`StatCard.tsx`): Has `trend` prop with SVG sparkline rendering and color-coded lines per card color.

4. **Finance tabs** (`Finance.tsx`): Already has transactions + transfer slips merged into one page with tabs.

## What Could Be Enhanced (Not Yet Done)

Two small gaps from the original plan that weren't implemented:

| Gap | Description |
|-----|-------------|
| **Sidebar action badges** | Red dot indicators on nav items for pending actions (e.g., pending slips count on Finance, expiring packages on Members) |
| **7-day trend data for StatCards** | Dashboard StatCards have the `trend` prop available but don't pass actual 7-day historical data — needs a new hook `useDashboardTrends` to fetch last 7 days of check-in counts |

## Proposed: Implement the Two Remaining Gaps

### 1. Sidebar Action Badges
- Add a `badge?: number` prop to `NavItem` interface
- Fetch pending counts via existing hooks (`useTransferSlipStats`, `useExpiringPackages`)
- Render a small red dot/count next to Finance and Members nav items
- **Files**: `Sidebar.tsx`

### 2. Dashboard 7-Day Trend Data
- Create a lightweight hook `useDashboardTrends` that queries `member_attendance` counts for the last 7 days
- Pass the trend arrays to StatCards on Dashboard
- **Files**: New `src/hooks/useDashboardTrends.ts`, modify `Dashboard.tsx`

### Risk
- Zero: Read-only queries, no DB/schema changes, no existing behavior modified.

