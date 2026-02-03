

# MOOM CLUB v0.0.1 - Completion Plan

## Current State Analysis

### Already Implemented
- **Database Schema**: Comprehensive tables for all entities (members, packages, classes, schedule, staff, roles, locations, transactions, etc.)
- **Authentication**: Full auth flow with login/signup, protected routes, and RBAC context
- **Dashboard**: Real data fetching with hooks for check-ins, classes, high-risk members, hot leads, birthdays
- **Members Module**: Full CRUD with database integration, create/edit dialogs
- **i18n**: Complete bilingual support (EN/TH)
- **Design System**: Colors, typography, spacing as per spec
- **24+ Page Structures**: All pages exist with basic layouts

### Pages Needing Database Connection (Currently Mock/Empty Data)
- Packages (mock data, no DB submit)
- Classes, Class Categories, Rooms
- Staff, Roles
- Locations
- Leads
- Promotions
- Schedule
- Finance, Transfer Slips
- Activity Log
- Announcements

---

## Implementation Plan

### Phase 1: Core Entity CRUD Operations (High Priority)

#### 1.1 Packages Module - Database Connection
**Files to modify:**
- `src/hooks/usePackages.ts` (NEW)
- `src/pages/Packages.tsx` (MODIFY)
- `src/pages/CreatePackage.tsx` (MODIFY)

**Work:**
- Create `usePackages` hook with React Query for fetching packages from `packages` table
- Implement `useCreatePackage` mutation for form submission
- Implement `useUpdatePackage` for editing
- Connect status tabs to real counts from database
- Add Zod validation schema for package form

#### 1.2 Classes Module - Full Implementation
**Files to create/modify:**
- `src/hooks/useClasses.ts` (NEW)
- `src/pages/Classes.tsx` (MODIFY)
- `src/components/classes/CreateClassDialog.tsx` (NEW)
- `src/pages/ClassCategories.tsx` (MODIFY)
- `src/hooks/useClassCategories.ts` (NEW)

**Work:**
- Fetch classes from `classes` table with category joins
- Create class/PT creation dialog
- Fetch categories from `class_categories` table
- Category creation functionality
- Connect status tabs to real counts

#### 1.3 Staff & Roles Module
**Files to create/modify:**
- `src/hooks/useStaff.ts` (NEW)
- `src/hooks/useRoles.ts` (NEW)
- `src/pages/Staff.tsx` (MODIFY)
- `src/pages/Roles.tsx` (MODIFY)
- `src/components/staff/CreateStaffDialog.tsx` (NEW)

**Work:**
- Connect to `staff` and `roles` tables
- Staff CRUD with role assignment
- Display actual assigned accounts count for roles

#### 1.4 Locations & Rooms Module
**Files to create/modify:**
- `src/hooks/useLocations.ts` (NEW)
- `src/hooks/useRooms.ts` (NEW)
- `src/pages/Locations.tsx` (MODIFY)
- `src/pages/Rooms.tsx` (MODIFY)

**Work:**
- Connect to `locations` and `rooms` tables
- Status tabs (Open/Closed) with real counts
- CRUD operations for both entities

---

### Phase 2: Schedule & Lobby (Medium Priority)

#### 2.1 Schedule Page Enhancement
**Files to modify:**
- `src/hooks/useSchedule.ts` (NEW)
- `src/pages/Schedule.tsx` (MODIFY)
- `src/components/schedule/ScheduleClassDialog.tsx` (NEW)

**Work:**
- Fetch schedule data with joins to classes, trainers, rooms, locations
- Stats calculation (classes count, PT count, avg capacity, cancellations)
- Trainer filter functionality (fetch trainers from staff)
- Schedule class dialog with form validation
- QR code generation for classes

#### 2.2 Lobby/Check-in Enhancement
**Files to modify:**
- `src/hooks/useLobbyCheckins.ts` (NEW)
- `src/pages/Lobby.tsx` (MODIFY)
- `src/components/lobby/CheckInDialog.tsx` (NEW)

**Work:**
- Fetch today's check-ins from `member_attendance`
- Search by member name
- Check-in dialog with member lookup
- Package usage display

---

### Phase 3: Finance & Transfer Slips (Medium Priority)

#### 3.1 Finance Page
**Files to create/modify:**
- `src/hooks/useFinance.ts` (NEW)
- `src/pages/Finance.tsx` (MODIFY)

**Work:**
- Connect to `transactions` table
- Date range filtering
- Calculate stats (transactions count, total sales, net income, refunds)
- Transaction table with member joins
- Status badges for Paid/Pending/Voided

#### 3.2 Transfer Slips
**Files to modify:**
- `src/hooks/useTransferSlips.ts` (NEW)
- `src/pages/TransferSlips.tsx` (MODIFY)

**Work:**
- Filter transactions by payment method (bank transfer)
- Status update functionality (Needs review -> Paid/Voided)
- Status tabs with counts

---

### Phase 4: Reports & Analytics (Medium Priority)

#### 4.1 Members At Risk Report
**Files to create:**
- `src/pages/reports/MembersAtRisk.tsx` (NEW)

**Work:**
- Risk level pie chart using Recharts
- Risk calculation based on spec:
  - High: ≤30 days OR ≤33% AND ≤3 sessions
  - Medium: ≤60 days OR ≤60% AND ≤15 sessions
  - Low: ≥61 days AND ≥61% AND ≥16 sessions
- Filterable table by risk level
- Export to CSV

#### 4.2 Other Report Pages
**Files to create:**
- `src/pages/reports/ActiveMembers.tsx` (NEW)
- `src/pages/reports/PackageSales.tsx` (NEW)
- `src/pages/reports/ClassCapacity.tsx` (NEW)

**Work:**
- Line/bar charts for trends
- Date range selection
- Data aggregation queries

---

### Phase 5: Leads & Promotions (Medium Priority)

#### 5.1 Leads Module
**Files to create/modify:**
- `src/hooks/useLeads.ts` (NEW)
- `src/pages/Leads.tsx` (MODIFY)
- `src/components/leads/CreateLeadDialog.tsx` (NEW)

**Work:**
- Connect to `leads` table
- CRUD operations
- Status tracking (interested, contacted, converted, etc.)

#### 5.2 Promotions Module
**Files to create/modify:**
- `src/hooks/usePromotions.ts` (NEW)
- `src/pages/Promotions.tsx` (MODIFY)
- `src/components/promotions/CreatePromotionDialog.tsx` (NEW)

**Work:**
- Connect to `promotions` table
- Promo code generation
- Discount type (percentage/fixed)
- Date range for active period

---

### Phase 6: Activity Log & Announcements (Lower Priority)

#### 6.1 Activity Log
**Files to modify:**
- `src/hooks/useActivityLog.ts` (NEW)
- `src/pages/ActivityLog.tsx` (MODIFY)

**Work:**
- Fetch from `activity_log` table
- Date range filtering
- Display old/new values for changes
- Staff member display

#### 6.2 Announcements
**Files to modify:**
- `src/hooks/useAnnouncements.ts` (NEW)
- `src/pages/Announcements.tsx` (MODIFY)
- `src/components/announcements/CreateAnnouncementDialog.tsx` (NEW)

**Work:**
- Connect to `announcements` table
- Status tabs (Active, Scheduled, Completed)
- Scheduling functionality

---

### Phase 7: Notifications System (Medium Priority)

#### 7.1 Notifications Enhancement
**Files to create/modify:**
- `src/hooks/useNotifications.ts` (NEW)
- `src/pages/Notifications.tsx` (MODIFY)
- `src/components/layout/NotificationDropdown.tsx` (NEW)

**Work:**
- Fetch from `notifications` table
- Mark as read functionality
- Filter by status and type
- Header dropdown with recent notifications
- Unread count badge in header

---

### Phase 8: Settings Persistence (Lower Priority)

#### 8.1 Settings State Management
**Files to modify:**
- `src/pages/settings/SettingsGeneral.tsx` (MODIFY)
- `src/pages/settings/SettingsClass.tsx` (MODIFY)
- `src/pages/settings/SettingsClient.tsx` (MODIFY)
- `src/pages/settings/SettingsPackage.tsx` (MODIFY)
- `src/pages/settings/SettingsContracts.tsx` (MODIFY)

**Work:**
- Create settings table in database OR use local storage for MVP
- Save/load toggle states
- Theme color persistence
- Payment method configurations

---

### Phase 9: Member Details Enhancement (Lower Priority)

#### 9.1 Member Details Tabs
**Files to modify:**
- `src/pages/MemberDetails.tsx` (MODIFY)
- `src/hooks/useMemberDetails.ts` (NEW)

**Work:**
- Fetch member packages from `member_packages`
- Attendance history from `member_attendance`
- Billing from `member_billing`
- Notes from `member_notes`
- Injuries from `member_injuries`
- Suspensions from `member_suspensions`
- Contracts from `member_contracts`

---

## Database Hooks Pattern

All hooks will follow this consistent pattern:

```typescript
// Example: src/hooks/usePackages.ts
export const usePackages = (status?: string, search?: string) => {
  return useQuery({
    queryKey: ['packages', status, search],
    queryFn: async () => {
      let query = supabase.from('packages').select('*');
      if (status && status !== 'all') query = query.eq('status', status);
      if (search) query = query.ilike('name_en', `%${search}%`);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
};

export const usePackageStats = () => {
  return useQuery({
    queryKey: ['package-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('status');
      if (error) throw error;
      return {
        on_sale: data.filter(p => p.status === 'on_sale').length,
        scheduled: data.filter(p => p.status === 'scheduled').length,
        drafts: data.filter(p => p.status === 'drafts').length,
        archive: data.filter(p => p.status === 'archive').length,
      };
    }
  });
};

export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePackageInput) => {
      const { error } = await supabase.from('packages').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package created successfully');
    }
  });
};
```

---

## Implementation Priority Order

1. **Week 1**: Packages, Classes, Class Categories (core business entities)
2. **Week 2**: Staff, Roles, Locations, Rooms (gym management)
3. **Week 3**: Schedule, Lobby check-ins (daily operations)
4. **Week 4**: Finance, Transfer Slips, Leads, Promotions
5. **Week 5**: Reports with charts, Activity Log, Announcements
6. **Week 6**: Notifications, Settings persistence, Member Details tabs

---

## Quality Checklist for Each Module

For every module implementation:
- [ ] Database connection with React Query
- [ ] Loading skeletons
- [ ] Empty state display
- [ ] Error handling with toast notifications
- [ ] Search functionality (debounced)
- [ ] Status tabs with real counts
- [ ] Pagination (if applicable)
- [ ] Create dialog with Zod validation
- [ ] Edit functionality
- [ ] Delete with confirmation
- [ ] i18n for all text (check both EN and TH)
- [ ] Responsive design (mobile, tablet, desktop)

---

## Files Summary

**New Files to Create:**
- 15+ custom hooks (usePackages, useClasses, useStaff, etc.)
- 10+ dialog components (CreateClassDialog, CreateStaffDialog, etc.)
- 4+ report pages with charts
- NotificationDropdown component

**Files to Modify:**
- 18+ page components to connect to database
- Header.tsx for notification dropdown
- Sidebar.tsx (already has RBAC filtering)

**Estimated Total: ~50 file changes**

