

# MOOM CLUB v0.0.1 - Continuation Plan

## Current State Summary

**Completed:**
- Security Remediation (21 findings addressed)
- Phase 1: Core Entity CRUD (Packages, Classes, Staff, Roles, Locations, Rooms, Leads, Promotions, Finance)
- Database hooks created and connected
- i18n EN/TH support

**Remaining Work (6 Phases):**

---

## Phase 2: Schedule & Lobby (Core Daily Operations)

### 2.1 Schedule Module

**New Files:**
- `src/hooks/useSchedule.ts`
- `src/components/schedule/ScheduleClassDialog.tsx`

**Modifications:**
- `src/pages/Schedule.tsx`

**Implementation:**

```text
useSchedule.ts hook:
- useScheduleByDate(date) - Fetch schedule with joins to classes, trainers, rooms, locations
- useScheduleStats(date) - Calculate stats (classes count, PT count, avg capacity, cancellations)
- useTrainers() - Fetch trainers for filter
- useCreateSchedule() - Create new scheduled class
- useUpdateSchedule() - Update schedule
- useDeleteSchedule() - Cancel/delete schedule
```

**Schedule Page Updates:**
- Connect date picker to fetch schedule for selected date
- Display real stats from database calculations
- Trainer filter pills from staff table (role=trainer)
- Data table with schedule entries showing class, trainer, room, location, availability, QR
- "Schedule" button opens ScheduleClassDialog

**ScheduleClassDialog Form Fields:**
- Class selection (dropdown from classes table)
- Date selection
- Start time / End time
- Trainer assignment (dropdown)
- Room assignment (dropdown)
- Location (dropdown)
- Capacity override (optional)

### 2.2 Lobby/Check-in Module

**New Files:**
- `src/hooks/useLobby.ts`
- `src/components/lobby/CheckInDialog.tsx`

**Modifications:**
- `src/pages/Lobby.tsx`

**Implementation:**

```text
useLobby.ts hook:
- useCheckIns(date, search) - Fetch member_attendance for date with member joins
- useCreateCheckIn() - Record new check-in
```

**Lobby Page Updates:**
- Connect to member_attendance table
- Search by member name
- Display: Time, Name, Package used, Usage (sessions), Location, Checked in status
- "Check In" button opens dialog

**CheckInDialog:**
- Member search/selection (typeahead from members table)
- Package selection (from member's active packages)
- Location selection
- Auto-generate check-in timestamp

---

## Phase 3: Activity Log & Announcements

### 3.1 Activity Log

**New Files:**
- `src/hooks/useActivityLog.ts`

**Modifications:**
- `src/pages/ActivityLog.tsx`

**Implementation:**

```text
useActivityLog.ts hook:
- useActivityLogs(dateRange) - Fetch activity_log with staff/member joins
- Filter by date range
```

**Page Updates:**
- Connect date range picker
- Display table: Date & time, Event type, Activity description, Staff name
- Show old/new values for changes (JSON parsing)

### 3.2 Announcements

**New Files:**
- `src/hooks/useAnnouncements.ts`
- `src/components/announcements/CreateAnnouncementDialog.tsx`

**Modifications:**
- `src/pages/Announcements.tsx`

**Implementation:**

```text
useAnnouncements.ts hook:
- useAnnouncements(status, search) - Fetch announcements
- useAnnouncementStats() - Status counts
- useCreateAnnouncement() - Create new
- useUpdateAnnouncement() - Update
```

**CreateAnnouncementDialog:**
- Message (textarea)
- Publish date (datetime picker)
- End date (datetime picker)
- Status (active/scheduled/completed)

---

## Phase 4: Notifications System

**New Files:**
- `src/hooks/useNotifications.ts`

**Modifications:**
- `src/pages/Notifications.tsx`
- `src/components/layout/Header.tsx`

**Implementation:**

```text
useNotifications.ts hook:
- useNotifications(status, type) - Fetch notifications for current user
- useUnreadCount() - Count unread for header badge
- useMarkAsRead(id) - Mark single notification read
- useMarkAllRead() - Mark all as read
```

**Notifications Page Updates:**
- Date filter
- Status filter (read/unread)
- Type filter checkboxes
- List of notifications with avatar, title, message, timestamp
- Mark as read functionality

**Header Enhancement:**
- Connect unreadNotifications prop to real count
- Show recent notifications in dropdown
- "View all" links to /notifications page

---

## Phase 5: Settings Persistence

**New Files:**
- `src/hooks/useSettings.ts`

**Modifications:**
- `src/pages/settings/SettingsGeneral.tsx`
- `src/pages/settings/SettingsClass.tsx`
- `src/pages/settings/SettingsClient.tsx`
- `src/pages/settings/SettingsPackage.tsx`
- `src/pages/settings/SettingsContracts.tsx`

**Implementation:**

```text
useSettings.ts hook:
- useSettings(section) - Fetch settings by section
- useUpdateSetting(section, key, value) - Update setting
- useSaveSettings(section, data) - Save multiple settings
```

**Settings Table Structure:**
- section: 'general' | 'class' | 'client' | 'package' | 'contracts'
- key: setting name
- value: JSON value

**General Settings:**
- Payment methods (per location toggles)
- Theme color selection
- Workout toggle
- Gym check-in configurations

**Class Settings:**
- Booking period (days before class)
- Booking cutoff (mins before class)
- Max spots per member
- Waitlisting settings
- Cancellation settings
- No-show settings

---

## Phase 6: Member Details Enhancement

**New Files:**
- `src/hooks/useMemberDetails.ts`

**Modifications:**
- `src/pages/MemberDetails.tsx`

**Implementation:**

```text
useMemberDetails.ts hook:
- useMember(id) - Fetch member by ID
- useMemberPackages(memberId) - Fetch member_packages with package joins
- useMemberAttendance(memberId) - Fetch member_attendance history
- useMemberBilling(memberId) - Fetch member_billing with transaction joins
- useMemberNotes(memberId) - Fetch member_notes
- useMemberInjuries(memberId) - Fetch member_injuries
- useMemberSuspensions(memberId) - Fetch member_suspensions
- useMemberContracts(memberId) - Fetch member_contracts
- useCreateNote(), useCreateBilling(), etc.
```

**Tab Updates:**
1. **Home** - Account details from member record
2. **Profile** - Editable form connected to updateMember
3. **Attendance** - Table from member_attendance
4. **Packages** - Table from member_packages with status sub-tabs
5. **Billing** - Table from member_billing + Add billing dialog
6. **Injuries** - Table from member_injuries
7. **Notes** - List from member_notes + Add note
8. **Suspensions** - Table from member_suspensions
9. **Contract** - Documents from member_contracts

---

## Phase 7: Reports with Charts (Optional for v0.0.1)

**New Files:**
- `src/pages/reports/MembersAtRisk.tsx`
- `src/pages/reports/ActiveMembers.tsx`
- `src/pages/reports/PackageSales.tsx`
- `src/pages/reports/ClassCapacity.tsx`
- `src/hooks/useReports.ts`

**Implementation:**
- Pie chart for risk levels using Recharts
- Line charts for trends
- Risk calculation logic:
  - High: ≤30 days OR ≤33% AND ≤3 sessions remaining
  - Medium: ≤60 days OR ≤60% AND ≤15 sessions remaining
  - Low: ≥61 days AND ≥61% AND ≥16 sessions remaining
- Export to CSV functionality

---

## Implementation Order

| Priority | Module | Files | Effort |
|----------|--------|-------|--------|
| 1 | Schedule & Lobby | 6 files | High |
| 2 | Notifications | 3 files | Medium |
| 3 | Activity Log & Announcements | 5 files | Medium |
| 4 | Member Details Tabs | 2 files | High |
| 5 | Settings Persistence | 6 files | Medium |
| 6 | Reports (Optional) | 5 files | High |

---

## Quality Checklist (Per Module)

- [ ] Database connection with React Query
- [ ] Loading skeletons
- [ ] Empty state display
- [ ] Error handling with toast
- [ ] Search functionality (debounced)
- [ ] Status tabs with real counts
- [ ] Create dialog with Zod validation
- [ ] i18n for all text
- [ ] Responsive design

---

## First Implementation Batch

Starting with **Phase 2: Schedule & Lobby** as these are core daily operations:

1. Create `useSchedule.ts` hook
2. Create `useLobby.ts` hook
3. Update `Schedule.tsx` with database connection
4. Update `Lobby.tsx` with database connection
5. Create `ScheduleClassDialog.tsx`
6. Create `CheckInDialog.tsx`

This provides:
- Real-time class scheduling
- Trainer assignment
- Member check-in tracking
- Daily operations visibility

