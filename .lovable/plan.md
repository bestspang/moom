

# Add Surface Switcher for Admin Users

## Problem
Admin users (owner, admin, trainer, freelance_trainer, front_desk) on the admin surface have no way to switch to the member or trainer experience. The member profile page has an "Admin Portal" link back to admin, but the admin Header has no equivalent links to member/trainer surfaces.

## Design

Add a **surface switcher** dropdown in the admin Header (user menu area) that lets admin-capable users navigate to:
- **Member App** → `/member` (or `member.moom.fit` in production)
- **Trainer App** → `/trainer` (or `member.moom.fit/trainer` in production)

This uses the existing `buildCrossSurfaceUrl()` helper which already handles dev vs production URL building.

## Implementation Plan

### 1. Update `Header.tsx` — Add surface switch links in user dropdown

In the user avatar dropdown menu (after "Edit Profile", before "Logout"):
- Add a separator
- Add "Switch to Member" link → `buildCrossSurfaceUrl('member', '/member')`
- Add "Switch to Trainer" link → `buildCrossSurfaceUrl('trainer', '/trainer')` (only if user has trainer/freelance_trainer role)
- Use `<a href>` (not `navigate()`) since these may be cross-domain links in production

### 2. Roles that see each option

| Link | Visible when user has role |
|------|---------------------------|
| Member App | Any admin-capable role (owner, admin, trainer, freelance_trainer, front_desk) |
| Trainer App | trainer or freelance_trainer only |

### Files to touch
- `src/components/layout/Header.tsx` — add surface switch menu items

### No changes needed to
- `hostname.ts` — `buildCrossSurfaceUrl` already works
- `AuthContext` — `allRoles` already available
- Routing — member/trainer routes already exist

