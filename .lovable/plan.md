

# Phase 4 + 5 — Domain-Aware Behavior and Cleanup

## Status: Phases 1-3 Complete

All surface routes, layouts, pages, auth guards, and shared components are in place. What's missing:

1. **No domain-aware redirect** — if a member user hits `admin.moom.fit/member`, nothing redirects them to `member.moom.fit/member`. Similarly, admin routes on `member.moom.fit` are accessible.
2. **No root redirect based on hostname** — `member.moom.fit/` currently shows the admin Dashboard (since `/` maps to admin `MainLayout`).
3. **Diagnostics page** exists but lacks redirect logic result display.

---

## Phase 4 — Domain-Aware Redirect

### Approach: `SurfaceGuard` component at the top of `<Routes>`

Create `src/apps/shared/SurfaceGuard.tsx` — a component rendered as a wrapper inside `BrowserRouter` that:

1. On **production hosts only** (not dev/lovable.app):
   - `member.moom.fit` + path starts with admin routes (`/lobby`, `/members/:id/detail`, `/finance`, etc.) → redirect to `admin.moom.fit` + same path
   - `admin.moom.fit` + path starts with `/member`, `/trainer`, `/staff` → redirect to `member.moom.fit` + same path
   - `member.moom.fit/` (root) → redirect to `/member`
   - `admin.moom.fit/` (root) → stays at `/` (admin dashboard, existing behavior)

2. On **dev environments**: no redirects (use `?surface=` param for testing).

### Implementation

**New file: `src/apps/shared/SurfaceGuard.tsx`**
- Uses `useLocation()` from React Router
- Checks `isMemberHost()` / `isAdminHost()` / `isDevEnvironment()`
- For wrong-host routes: `window.location.href = buildCrossSurfaceUrl(...)` (full page redirect needed for cross-domain)
- For root path on member host: `<Navigate to="/member" replace />`
- Otherwise: renders `children`

**Modify: `src/App.tsx`**
- Wrap `<Routes>` content inside `<SurfaceGuard>` (or add it as a layout route at the top)
- Minimal change — just wrap the existing routes

### Route Classification

```text
ADMIN-ONLY routes (redirect away from member.moom.fit):
  /, /lobby, /members, /members/:id/detail, /leads, /package/*,
  /promotion/*, /calendar, /room/*, /class/*, /class-category/*,
  /admin/*, /roles/*, /location, /activity-log, /announcement,
  /workout-list, /transfer-slip, /finance, /insights, /report/*,
  /notifications, /profile (admin), /setting/*, /gamification/*,
  /diagnostics/data-audit, /coming-soon, /member-app, /trainer-app

MEMBER-HOST routes (redirect away from admin.moom.fit):
  /member/*, /trainer/*, /staff/*

SHARED routes (accessible on both hosts):
  /login, /forgot-password, /reset-password, /checkin,
  /liff/*, /diagnostics/surface
```

---

## Phase 5 — Cleanup

### 5a. Update Diagnostics page
Add "Redirect Logic Result" to diagnostics showing what the SurfaceGuard would do for the current host+path.

### 5b. Verify shared components index
Already fixed — `FilterChips`, `QueryError`, `MobileStatusBadge`, `EmptyState` all exported.

### 5c. No other cleanup needed
- No duplicated contexts (single `AuthContext`, single `SurfaceContext`)
- No duplicated backend client (single `supabase` import)
- Layouts are distinct per surface
- Design tokens shared via CSS variables

---

## Files to Create/Modify

| File | Action |
|---|---|
| `src/apps/shared/SurfaceGuard.tsx` | **Create** — domain-aware redirect logic |
| `src/App.tsx` | **Modify** — wrap routes with SurfaceGuard |
| `src/apps/shared/hostname.ts` | **Modify** — add `getRouteHostAffinity()` helper |
| `src/apps/shared/pages/DiagnosticsSurfacePage.tsx` | **Modify** — add redirect result display |
| `src/apps/shared/index.ts` | **Modify** — export SurfaceGuard |

## Risks
- Cross-domain redirect uses `window.location.href` (full page load, not SPA nav) — this is intentional and correct for different domains
- Dev environment is never affected (all guards skip when `isDevEnvironment()`)
- Zero changes to admin pages, member pages, or any existing layouts

