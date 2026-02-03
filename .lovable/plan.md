
# Implementation Plan: Authentication, Data Fetching & CRUD Operations

## Overview
This plan implements four key features:
1. Real data fetching for Dashboard stats
2. Members page database connection with CRUD
3. Authentication system with role-based access
4. Navigation and page load verification

---

## 1. Authentication System

### 1.1 Create Auth Context
**File: `src/contexts/AuthContext.tsx`**
- AuthProvider component managing session state
- Uses `onAuthStateChange` listener (set up BEFORE `getSession()`)
- Fetches user's role from `user_roles` table after authentication
- Provides: user, session, role, accessLevel, loading, signIn, signUp, signOut

### 1.2 Login Page
**File: `src/pages/Auth/Login.tsx`**
- Email/password form with validation (Zod + react-hook-form)
- "Remember me" checkbox
- Link to signup page
- Error handling with toast notifications
- Redirect to dashboard on success
- MOOM CLUB branding consistent with design system

### 1.3 Signup Page
**File: `src/pages/Auth/Signup.tsx`**
- Form fields: First name, Last name, Email, Password, Confirm password
- Form validation with Zod
- Creates auth user, then creates staff record
- Default role: front_desk (Level 1: Minimum)
- Email verification required (no auto-confirm)
- Redirects to login after signup

### 1.4 Protected Routes
**File: `src/components/auth/ProtectedRoute.tsx`**
- Checks for valid session
- Redirects to /login if unauthenticated
- Optional minAccessLevel prop for role-based protection
- Loading state while checking auth

### 1.5 Update App Routing
**File: `src/App.tsx`**
- Add AuthProvider wrapper
- Add login/signup routes (public)
- Wrap MainLayout routes with ProtectedRoute
- Add role-based route protection for sensitive pages

---

## 2. Dashboard Real Data Fetching

### 2.1 Dashboard Hooks
**File: `src/hooks/useDashboardStats.ts`**
- Custom hook using React Query
- Queries:
  - `member_attendance` for today's check-ins (filter by date)
  - `schedule` for today's classes count
  - `members` with `risk_level = 'high'` for high-risk members
  - `leads` with `status = 'interested'` for hot leads
  - `members` for upcoming birthdays (within 7 days)

### 2.2 Dashboard Page Updates
**File: `src/pages/Dashboard.tsx`**
- Replace static data with useDashboardStats hook
- Add loading states (Skeleton components)
- Add error handling
- Calculate comparison percentages (today vs yesterday)
- Fetch schedule items for the selected date

### 2.3 Data Types
**File: `src/types/dashboard.ts`**
- DashboardStats interface
- ScheduleItem interface (matching DB schema)
- RiskMember interface
- HotLead interface

---

## 3. Members Page Database Integration

### 3.1 Members API Hooks
**File: `src/hooks/useMembers.ts`**
- useMembers: Fetch paginated members with filters (status, search)
- useMember: Fetch single member by ID
- useCreateMember: Mutation for creating members
- useUpdateMember: Mutation for updating members
- useMemberStats: Aggregate counts by status for tabs

### 3.2 Member ID Generator
**File: `src/lib/memberIdGenerator.ts`**
- Function to generate next member ID (M-0000001 format)
- Query max existing ID and increment

### 3.3 Create Member Form
**File: `src/components/members/CreateMemberDialog.tsx`**
- Dialog/Sheet component
- Form fields: First name*, Last name*, Nickname, Email, Phone, Date of birth, Gender, Address
- Form validation with Zod
- Auto-generate member_id on create
- Submit creates member record
- Success toast and table refresh

### 3.4 Edit Member Form
**File: `src/components/members/EditMemberDialog.tsx`**
- Pre-populated form with existing data
- Same validation as create
- Update mutation on submit
- Optimistic UI updates

### 3.5 Members Page Updates
**File: `src/pages/Members.tsx`**
- Replace mock data with useMembers hook
- Wire status tabs to actual counts from useMemberStats
- Implement search with debounce
- Add pagination controls
- Connect Create button to CreateMemberDialog
- Add edit action to table rows

### 3.6 CSV Export
**File: `src/lib/exportCsv.ts`**
- Generic CSV export utility
- Export current filtered/searched results
- Columns: ID, Name, Nickname, Email, Phone, Status, Member Since

---

## 4. Header & Layout Auth Integration

### 4.1 Header Updates
**File: `src/components/layout/Header.tsx`**
- Display actual user name/initials from auth context
- Show user's role
- Wire logout button to signOut function
- Fetch unread notifications count from DB

### 4.2 Sidebar Role-Based Menu
**File: `src/components/layout/Sidebar.tsx`**
- Filter menu items based on user's access level
- Level 1 (Front desk): Dashboard, Lobby, Members, Leads
- Level 2 (Operator): + Schedule, Classes, Packages
- Level 3 (Manager): + Staff, Locations, Finance, Settings
- Level 4 (Master): All items including Roles

---

## 5. Navigation Testing & Verification

### 5.1 Test All Routes
Ensure each page loads without errors:
- Dashboard (/)
- Lobby (/lobby)
- Members (/members)
- Member Details (/members/:id/detail)
- Leads (/leads)
- Packages (/package)
- Create Package (/package/create)
- Promotions (/promotion)
- Schedule (/calendar)
- Rooms (/room)
- Classes (/class)
- Class Categories (/class-category)
- Staff (/admin)
- Roles (/roles)
- Locations (/location)
- Activity Log (/activity-log)
- Announcements (/announcement)
- Workout List (/workout-list)
- Transfer Slips (/transfer-slip)
- Finance (/finance)
- Reports (/report/*)
- Notifications (/notifications)
- Settings (/setting/*)

### 5.2 Add Error Boundaries
**File: `src/components/common/ErrorBoundary.tsx`**
- Catch rendering errors
- Display user-friendly error message
- "Try again" button
- Log errors for debugging

---

## Technical Implementation Details

### Database Queries (Dashboard)
```sql
-- Today's check-ins
SELECT COUNT(*) FROM member_attendance 
WHERE DATE(check_in_time) = CURRENT_DATE;

-- Classes scheduled today
SELECT COUNT(*) FROM schedule 
WHERE scheduled_date = CURRENT_DATE;

-- High-risk members (packages expiring soon)
SELECT * FROM members 
WHERE risk_level = 'high' AND status = 'active';
```

### Security Considerations
- All data fetching uses RLS policies
- User role checked server-side via security definer functions
- No sensitive data in localStorage (session managed by Supabase Auth)
- Protected routes verify session before rendering

### Translation Updates
**Files: `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts`**
Add keys for:
- auth.login, auth.signup, auth.email, auth.password
- auth.forgotPassword, auth.rememberMe
- members.createMember, members.editMember
- Validation error messages

---

## File Structure Summary

```text
src/
  contexts/
    AuthContext.tsx (NEW)
  pages/
    Auth/
      Login.tsx (NEW)
      Signup.tsx (NEW)
    Dashboard.tsx (MODIFY)
    Members.tsx (MODIFY)
  components/
    auth/
      ProtectedRoute.tsx (NEW)
    members/
      CreateMemberDialog.tsx (NEW)
      EditMemberDialog.tsx (NEW)
    common/
      ErrorBoundary.tsx (NEW)
    layout/
      Header.tsx (MODIFY)
      Sidebar.tsx (MODIFY)
  hooks/
    useDashboardStats.ts (NEW)
    useMembers.ts (NEW)
  lib/
    memberIdGenerator.ts (NEW)
    exportCsv.ts (NEW)
  types/
    dashboard.ts (NEW)
```

---

## Implementation Order

1. **Auth Context & Login/Signup** - Foundation for all protected features
2. **Protected Routes** - Secure the application
3. **Header/Sidebar Auth Integration** - Show user info, role-based menu
4. **Dashboard Data Fetching** - Real stats from database
5. **Members CRUD** - Full create/edit functionality
6. **Navigation Testing** - Verify all pages work
