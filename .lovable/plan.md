

# Phase 3 & 4: Activity Log, Announcements & Notifications

## Overview

This implementation batch covers three modules that enable system-wide logging, communication, and user notifications.

**Current State:**
- All three pages exist with basic layouts and empty states
- Database tables exist: `activity_log`, `announcements`, `notifications`
- Header has notification dropdown placeholder (hardcoded to 0)

**Deliverables:**
- 3 new React Query hooks
- 1 new dialog component (CreateAnnouncementDialog)
- 4 page/component updates
- Full CRUD functionality with i18n support

---

## Phase 3.1: Activity Log Module

### New File: `src/hooks/useActivityLog.ts`

```text
Hook functions:
- useActivityLogs(startDate, endDate) - Fetch activity_log with staff/member joins
- Filter by date range
```

**Implementation Details:**
- Query `activity_log` table with joins to `staff` and `members`
- Date range filtering using `gte` and `lte` on `created_at`
- Parse JSON `old_value` and `new_value` for display
- Order by `created_at` descending

### Modify: `src/pages/ActivityLog.tsx`

**Updates:**
- Connect to `useActivityLogs` hook
- Date range picker controls the query
- DataTable with columns:
  - Date & time (formatted)
  - Event type (badge)
  - Activity description
  - Staff name
- Loading skeleton while fetching
- Empty state when no records

**Table Format:**
| Date & Time | Event | Activity | Staff |
|-------------|-------|----------|-------|
| 3 Feb 2026, 14:30 | Member profile | Changed phone from 081... to 082... | John Smith |

---

## Phase 3.2: Announcements Module

### New File: `src/hooks/useAnnouncements.ts`

```text
Hook functions:
- useAnnouncements(status, search) - Fetch announcements
- useAnnouncementStats() - Count by status (active/scheduled/completed)
- useCreateAnnouncement() - Create new announcement
- useUpdateAnnouncement() - Update existing
- useDeleteAnnouncement() - Delete announcement
```

### New File: `src/components/announcements/CreateAnnouncementDialog.tsx`

**Form Fields (Zod validated):**
- Message (textarea, required)
- Publish date (datetime picker, required)
- End date (datetime picker, required)
- Status (select: active/scheduled/completed)

### Modify: `src/pages/Announcements.tsx`

**Updates:**
- Connect to `useAnnouncements` hook
- Status tabs with real counts from `useAnnouncementStats()`
- Search functionality (debounced)
- DataTable with columns:
  - Publishing date
  - Ending on date
  - Message (truncated)
- "Create" button opens dialog
- Loading skeleton
- Empty state

---

## Phase 4: Notifications System

### New File: `src/hooks/useNotifications.ts`

```text
Hook functions:
- useNotifications(status?, type?) - Fetch notifications for current user
- useUnreadCount() - Count unread for header badge
- useMarkAsRead(id) - Mark single notification as read
- useMarkAllRead() - Mark all as read
- useDeleteNotification(id) - Remove notification
```

### Modify: `src/pages/Notifications.tsx`

**Updates:**
- Connect to `useNotifications` hook
- Date filter (single date picker)
- Status filter: All / Read / Unread
- Type filter checkboxes (booking, cancellation, payment, etc.)
- Notification list with:
  - Avatar (based on type)
  - Title (bold)
  - Message
  - Timestamp (relative: "2 hours ago")
  - Read/unread indicator (dot)
- Click to mark as read
- "Mark all read" button

### Modify: `src/components/layout/Header.tsx`

**Updates:**
- Import and use `useUnreadCount()` hook
- Replace hardcoded `unreadNotifications` prop
- Notification dropdown shows recent notifications
- "View all" links to `/notifications`
- Click notification marks as read

---

## File Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/hooks/useActivityLog.ts` | Activity log queries |
| CREATE | `src/hooks/useAnnouncements.ts` | Announcements CRUD |
| CREATE | `src/hooks/useNotifications.ts` | Notifications queries |
| CREATE | `src/components/announcements/CreateAnnouncementDialog.tsx` | Form dialog |
| MODIFY | `src/pages/ActivityLog.tsx` | Connect to database |
| MODIFY | `src/pages/Announcements.tsx` | Connect to database |
| MODIFY | `src/pages/Notifications.tsx` | Connect to database |
| MODIFY | `src/components/layout/Header.tsx` | Real notification count |
| UPDATE | `.lovable/plan.md` | Mark phases complete |

---

## Database Tables Used

**activity_log:**
- id, event_type, activity, old_value (JSON), new_value (JSON)
- staff_id (FK to staff), member_id (FK to members)
- created_at

**announcements:**
- id, message, publish_date, end_date
- status (enum: active, scheduled, completed)
- created_by (FK to staff)

**notifications:**
- id, title, message, type (enum), is_read
- user_id (FK to auth.users)
- related_entity_id, related_entity_type

---

## Quality Checklist

For each module:
- [ ] React Query hooks with proper cache invalidation
- [ ] Loading skeletons
- [ ] Empty state display
- [ ] Error handling with toast
- [ ] Search/filter functionality
- [ ] Status tabs with real counts
- [ ] i18n for all text
- [ ] Responsive design

---

## Implementation Order

1. Create `useActivityLog.ts` hook
2. Update `ActivityLog.tsx` page
3. Create `useAnnouncements.ts` hook
4. Create `CreateAnnouncementDialog.tsx`
5. Update `Announcements.tsx` page
6. Create `useNotifications.ts` hook
7. Update `Notifications.tsx` page
8. Update `Header.tsx` with real notification count
9. Update plan.md

