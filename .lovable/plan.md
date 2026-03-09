

# Fix: Consistent Surface Switching & Missing Header

## Problems Identified

### Problem 1: Admin dropdown missing "Member App" / "Trainer App" links (Screenshot 3)
**Root cause:** In `AuthContext.tsx` line 112, `fetchUserRoleAndStatus` is called via `setTimeout` but `setLoading(false)` fires at line 120 immediately. The admin `Header.tsx` line 238 checks `role && ['owner', 'admin', ...].includes(role)` — when role is still `null` (not yet fetched), the surface switcher links are hidden. By the time role loads, the dropdown has already been dismissed.

**Fix:** The `Header.tsx` surface switcher should use `allRoles` instead of `role` for the gate check, AND handle the async gap gracefully. However the real fix is ensuring role is loaded before `loading` becomes `false`. We should not set `loading = false` until role fetch completes.

### Problem 2: Member home sometimes has no header (Screenshot 2)  
**Root cause:** When scrolling, the header might appear to disappear if there's a rendering race. But more likely: if the user navigates to `/member` before `user` is set (brief flash), or if `MemberLayout` redirects to `/login` and back. Looking at the screenshots more carefully — screenshot 2 shows content starting from the very top with no padding gap, meaning `pt-14` IS there but the header is not rendering or is scrolled away.

Actually, comparing screenshots 1 and 2: screenshot 1 has the header, screenshot 2 does not. Both show the member home. The difference is likely a timing issue where `MemberHeader` renders but `bg-background` is transparent during initial paint, or the header hasn't mounted yet when the content renders.

The fix for the header is to ensure `bg-background` is always opaque (already fixed in prior change to `shadow-sm`). But the real issue might be that the header disappears on scroll — let me verify the CSS is correct. The header has `fixed top-0` so it shouldn't scroll away. This might be a `z-index` issue or the screenshot was taken during a brief render gap.

## Implementation Plan

### 1. Fix role loading race in AuthContext
**File:** `src/contexts/AuthContext.tsx`

Don't set `loading = false` until role fetch completes. Change the flow so:
- `onAuthStateChange`: set user/session, call `fetchUserRoleAndStatus`, set `loading = false` only after role is fetched (move `setLoading(false)` inside `fetchUserRoleAndStatus` or await it)
- `getSession` initial: same pattern

This ensures `role` and `allRoles` are available when the UI renders, so the surface switcher links always appear.

### 2. Ensure admin Header always shows surface links when roles are loaded
**File:** `src/components/layout/Header.tsx`

The current check `role && [...]` is actually fine once the race is fixed. But as a safety net, also show the links if `allRoles.length > 0` and any role is admin-capable.

### 3. Verify MemberHeader renders correctly
The `bg-background shadow-sm` fix from the prior change should handle this. No additional changes needed — the header IS rendering with proper `fixed top-0 z-50 bg-background`.

## Files to Modify
1. `src/contexts/AuthContext.tsx` — defer `setLoading(false)` until `fetchUserRoleAndStatus` completes (~6 lines changed)
2. `src/components/layout/Header.tsx` — no change needed if AuthContext fix resolves the race

## Risks
- Changing when `loading` becomes `false` could slightly increase initial load spinner time (by ~50-100ms for the role query). This is acceptable — better to show a brief spinner than render an incomplete UI.
- No regression risk: the same data is fetched, just the timing of `loading` state changes.

