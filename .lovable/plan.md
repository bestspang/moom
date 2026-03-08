

# Milestone 6: Dashboard Role-Aware Rendering

## Completed Milestones
1. Route security hardening ✅
2. Finance.tsx split ✅
3. MemberDetails.tsx split ✅
4. Permission guards (9 pages) ✅
5. Permission guards (remaining 4 pages) ✅

## Problem Confirmed

The Dashboard (`src/pages/Dashboard.tsx`, 280 lines) renders **identical content to all roles** — it does not import `useAuth` or `usePermissions`. This means:

- A **front desk** user (level 1) sees BusinessHealthCard, GoalProgressCard, RevenueForecastCard — all owner/manager-level data
- A **trainer** (level 2) sees finance forecasts and business health scores they don't need
- The **owner/manager** sees the same quick-action layout as front desk, missing strategic emphasis

The Dashboard should feel like a **role-aware operations console**, not a one-size-fits-all stats page.

## What Exists Today (Dashboard)
- `DailyBriefingCard` — AI briefing (all roles could benefit, but content is generic)
- `BusinessHealthCard` — owner/manager only
- `GoalProgressCard` — owner/manager only (already uses `usePermissions` internally for create/delete)
- 3x `StatCard` KPIs — check-ins, in-class, classes today (all roles)
- Schedule/gym check-in table with tabs (all roles)
- `RevenueForecastCard` — owner/manager only
- `NeedsAttentionCard` — partially role-aware (shows different alerts)
- Quick check-in FAB (all roles)

## Plan

Add `usePermissions` to Dashboard and conditionally render sections by role:

| Section | Who sees it |
|---------|-------------|
| DailyBriefingCard | `can('dashboard', 'read')` — all roles |
| BusinessHealthCard + GoalProgressCard | `can('finance', 'read')` — managers/owners |
| KPI StatCards (check-ins, classes) | All roles |
| Schedule/Check-in table | All roles |
| RevenueForecastCard | `can('finance', 'read')` — managers/owners |
| NeedsAttentionCard | All roles (already self-filters) |
| Quick Check-in FAB | `can('lobby', 'write')` |

Additionally, guard the Leads manage dropdown and create button in `Leads.tsx` which were missed:
- Wrap manage dropdown in `can('leads', 'write')`
- Wrap create button in `can('leads', 'write')`

### Files to modify
- `src/pages/Dashboard.tsx` — add `usePermissions`, wrap finance-level sections
- `src/pages/Leads.tsx` — wrap manage dropdown + create button in `can('leads', 'write')`

### Risk
- Zero regression: Only adding conditional renders around existing components
- Components already handle their own loading/empty states
- `GoalProgressCard` already uses `usePermissions` internally

