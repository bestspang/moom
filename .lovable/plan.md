

# Add Notification Dropdown to Member Header

## What to build

Replace the current `<NotificationBell />` component (which is just an icon + badge with no dropdown) with an inline notification dropdown similar to the admin header. This dropdown shows:
- Header with title + unread count + "View all" link
- List of recent notifications (up to 5) with title, message preview, relative timestamp
- Unread items highlighted
- Clicking marks as read
- Empty state when no notifications

## Implementation

### File: `src/apps/member/components/MemberHeader.tsx`

1. **Remove** the `NotificationBell` import — replace with direct implementation using hooks
2. **Add imports**: `useRecentNotifications`, `useUnreadCount`, `useMarkAsRead` from `@/hooks/useNotifications`, `useLanguage` for `t()`, `formatDistanceToNow` from `date-fns`, `getDateLocale`, `Bell` icon, `cn`, `useNavigate`
3. **Replace** `<NotificationBell />` with a `DropdownMenu` containing:
   - Bell icon button with unread badge (same as admin)
   - Dropdown content (`w-80`) with notification list, matching admin header pattern exactly
   - "View all" links to `/member/notifications` (or just scrolls — we'll link to the notifications page if it exists under member routes, otherwise `/notifications`)

### No other files changed
- `MemberLayout.tsx` — unchanged (already renders header)
- `NotificationBell.tsx` — unchanged (still used elsewhere if needed)
- Hooks — reusing existing `useUnreadCount`, `useRecentNotifications`, `useMarkAsRead`

