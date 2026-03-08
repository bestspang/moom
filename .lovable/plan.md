

# Admin App Incremental Improvement — First Milestone

## Current State (Confirmed)

The admin app is **production-grade** with 40+ pages, full RBAC, real Supabase data, i18n, import/export, and consistent component patterns (PageHeader, DataTable, StatusTabs, SearchBar, StatusBadge, ManageDropdown, BulkActionBar). All domain hooks centralize data access with `enabled: !!user` guards.

### What Works Well (Preserve Everything)
- Auth pipeline, RBAC, sidebar permission gating, dashboard KPIs
- All CRUD hooks with cache invalidation + activity logging
- Import Center (9 entities), Finance (4 tabs), Member Detail (8 tabs)
- Reusable common components across all list pages
- Reports now use real Supabase queries (recently fixed)

### Critical Issues Found

**A. Route-level security gaps** — 15 routes accessible via direct URL without `minAccessLevel` guards:
- `/insights`, `/location`, `/activity-log`, `/announcement`, `/workout-list`
- `/class`, `/class/create`, `/class/:id`, `/class-category`, `/class-category/:id`
- `/room`, `/room/:id`
- `/package`, `/package/create`, `/package/:id`, `/package/:id/edit`
- `/promotion`, `/promotion/create`, `/promotion/:id`
- All 6 `/report/*` sub-routes

The sidebar hides these items by role, but **typing the URL directly bypasses that**. RLS blocks data, but the pages render with confusing empty/error states.

**B. No "Access Denied" UX** — `ProtectedRoute` silently redirects to `/` when access is denied, which is confusing (user doesn't know why they were redirected).

## Proposed First Milestone: Route Security Hardening + Access Denied UX

### Why this first
Security gaps are the highest-risk issue. Everything else (splitting large files, adding permission checks to buttons) is cosmetic by comparison. A `level_1_minimum` user can type `/finance` and see a broken page. This must be fixed before any UX polish.

### Changes

**1. `src/App.tsx`** — Wrap all unguarded routes with `ProtectedRoute`:

| Routes | Guard |
|--------|-------|
| `/insights`, all `/report/*` | `level_2_operator` |
| `/location` | `level_3_manager` |
| `/class`, `/class/create`, `/class/:id` | `level_2_operator` |
| `/class-category`, `/class-category/:id` | `level_2_operator` |
| `/room`, `/room/:id` | `level_2_operator` |
| `/package`, `/package/create`, `/package/:id`, `/package/:id/edit` | `level_2_operator` |
| `/promotion`, `/promotion/create`, `/promotion/:id` | `level_2_operator` |
| `/workout-list` | `level_2_operator` |
| `/announcement` | `level_1_minimum` |
| `/activity-log` | `level_1_minimum` |

**2. `src/components/auth/ProtectedRoute.tsx`** — Add a proper "Access Denied" screen (with icon, message, and back button) instead of silently redirecting to `/`. This gives users clear feedback when they don't have permission.

### Risk Assessment
- **Minimal**: Only adds guards. No behavior change for users who already have correct access levels.
- **Zero regression**: No existing page logic is modified. No hooks, components, or data flows are touched.
- **Rollback**: Remove the `ProtectedRoute` wrappers to revert.

### Files to touch
1. `src/App.tsx` — wrap ~15 routes
2. `src/components/auth/ProtectedRoute.tsx` — add AccessDenied UI

