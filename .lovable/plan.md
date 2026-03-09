

# Enhance Member Header: Surface Switcher + Settings Drawer

## What to build

### 1. Surface switcher in MemberHeader (avatar dropdown)
Convert the avatar from a plain `<Link>` to a `DropdownMenu` with:
- **View Profile** → `/member/profile`
- **Admin Portal** → `buildCrossSurfaceUrl('admin', '/')` (only for admin-capable roles)
- **Trainer App** → `buildCrossSurfaceUrl('trainer', '/trainer')` (only for trainer/freelance_trainer roles)
- **Language toggle** (EN ↔ TH)
- **Sign out**

### 2. Settings gear icon → quick settings drawer
Add a `Settings` (gear) icon button between NotificationBell and avatar that opens a `Sheet` (bottom drawer on mobile) containing:
- **Language toggle** (English / ไทย) — using `useLanguage()`
- **Theme section** — placeholder for future dark mode toggle (just show current theme label for now)

### 3. Verification scope
The header already renders on all member pages via `MemberLayout`. The `NotificationBell` already works (queries `notifications` table). Avatar already shows initials. These are confirmed from the existing code — no issues.

## Files to touch

| File | Change |
|------|--------|
| `src/apps/member/components/MemberHeader.tsx` | Replace avatar Link with DropdownMenu, add surface switcher links, add settings gear button with Sheet drawer |

## No changes to
- `MemberLayout.tsx` — already includes `<MemberHeader />`
- `NotificationBell.tsx` — already works
- `hostname.ts`, `AuthContext` — unchanged

## Implementation details

- Use `useAuth()` for `allRoles` and `signOut`
- Use `useLanguage()` for language toggle
- Use `Sheet` component (side="bottom") for settings drawer — mobile-friendly
- Use `buildCrossSurfaceUrl()` for cross-domain links
- Admin-capable roles: `owner`, `admin`, `trainer`, `freelance_trainer`, `front_desk`
- Trainer link visible only when user has `trainer` or `freelance_trainer` role

