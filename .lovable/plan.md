

# Surface Switching: Admin ↔ Member ↔ Trainer (No Re-login)

## Current State

The cross-surface switching infrastructure **already exists** and works correctly:

- **Admin Header** (line 238-255): Shows "Member App" and "Trainer App" links for admin/owner/trainer roles
- **MemberHeader** (line 183-199): Shows "Admin Portal" and "Trainer App" links based on user roles
- **MemberProfilePage** (line 126-137): Shows "Admin Portal" link for admin-capable roles
- **Session sharing**: In dev/preview (same origin), `buildCrossSurfaceUrl` uses `?surface=` param — auth session is preserved since it's same-origin
- **Layouts**: `MemberLayout` and `TrainerLayout` only check `!!user` (not role), so admin users can access both surfaces

## Issues Found

1. **Trainer Profile page is missing surface switcher links** — TrainerProfilePage has no "Admin Portal" or "Member App" links, unlike MemberProfilePage which has both. An admin who switches to Trainer surface has no way back except manually editing the URL.

2. **Admin Header restricts Trainer App link unnecessarily** — line 247 only shows Trainer App if user has `trainer` or `freelance_trainer` role. An `owner`/`admin` should be able to view the Trainer surface too for preview/testing purposes.

3. **Member App link in Admin Header is restricted to non-member roles** — line 238 checks `role` is in the staff list but this already works since owners/admins are included.

## Plan

### 1. Add surface switcher to TrainerProfilePage
Add "Admin Portal" and "Member App" links (same pattern as MemberProfilePage) so trainer-surface users can switch back.

**File:** `src/apps/trainer/pages/TrainerProfilePage.tsx`
- Import `buildCrossSurfaceUrl`, `isDevEnvironment` from hostname
- Import `allRoles` from `useAuth()`
- Add "Admin Portal" link (if hasAdminAccess) and "Member App" link before Sign Out button
- Use same UI pattern as MemberProfilePage (card with icon + chevron)

### 2. Allow owner/admin to access Trainer App from Admin Header
Change line 247 condition to also include `owner` and `admin` roles so they can preview the Trainer surface.

**File:** `src/components/layout/Header.tsx`
- Change `allRoles.some(r => ['trainer', 'freelance_trainer'].includes(r))` to `allRoles.some(r => ['owner', 'admin', 'trainer', 'freelance_trainer'].includes(r))`

### 3. Add surface switcher links to Trainer Header (optional but consistent)
The TrainerLayout has no header component — it uses just a bottom nav. The profile page is the natural place for the switcher (done in step 1).

## Files to Modify
1. `src/apps/trainer/pages/TrainerProfilePage.tsx` — add Admin Portal + Member App links (~20 lines)
2. `src/components/layout/Header.tsx` — widen Trainer App link visibility to owner/admin (~1 line change)

## Risks
- Zero regression: additive UI only, no auth/routing changes
- Session sharing already works on same origin (dev/preview)

