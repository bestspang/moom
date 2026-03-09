

# Add Real-time Notification Updates

## Problem
The `useRealtimeSync` hook already subscribes to the `notifications` table, but it only invalidates the `['notifications']` query key. The member header's notification hooks use different keys: `notifications-unread-count` and `notifications-recent`. So real-time changes to the notifications table don't refresh the bell badge or dropdown.

## Fix
Update the `notifications` entry in `TABLE_INVALIDATION_MAP` in `src/hooks/useRealtimeSync.ts` to also invalidate `notifications-unread-count` and `notifications-recent`.

### File: `src/hooks/useRealtimeSync.ts`
Change line 76 from:
```ts
notifications: ['notifications'],
```
to:
```ts
notifications: ['notifications', 'notifications-unread-count', 'notifications-recent'],
```

That's the only code change needed. The realtime subscription already listens to the `notifications` table — it just wasn't invalidating the right cache keys.

### Verification
The header is already confirmed working from code review:
- Renders in `MemberLayout` on all member routes with `pt-14` offset
- Notification dropdown uses `useUnreadCount` + `useRecentNotifications` + `useMarkAsRead`
- Surface switcher checks `allRoles` for admin/trainer access
- Settings drawer has language toggle via `useLanguage()`

