

# Add Header to Member App

## Problem
The member app (`MemberLayout`) currently has no top header — only a bottom nav. This means there's no persistent place for branding, notifications, or user actions at the top of the screen.

## Design

Create a **`MemberHeader`** component — a mobile-first sticky top bar with:
- **Left**: MOOM logo/brand mark
- **Right**: Notification bell (already exists as `NotificationBell`) + user avatar (tapping opens profile page)

This keeps the member app feeling like a native mobile app (minimal top bar, bottom nav for navigation).

## Implementation

### 1. Create `src/apps/member/components/MemberHeader.tsx`
- Fixed top bar (`h-14`, `fixed top-0`, `z-50`, `bg-card border-b`)
- Left: MOOM logo (small "M" badge, same as admin header)
- Right: `NotificationBell` + avatar button linking to `/member/profile`
- Use `useMemberSession()` for user initials
- Use `Avatar` component from shared UI

### 2. Update `MemberLayout.tsx`
- Import and render `<MemberHeader />` above `<Outlet />`
- Add `pt-14` to the content area to account for fixed header height

### Files to touch
- `src/apps/member/components/MemberHeader.tsx` — **new file**
- `src/apps/member/layouts/MemberLayout.tsx` — add header + padding

### No changes to
- `MemberHomePage.tsx` — keeps its `MobilePageHeader` for page-level title
- `MemberBottomNav.tsx` — unchanged
- `hostname.ts`, `AuthContext` — unchanged

