
# MOOM CLUB v0.0.1 - Complete Implementation Plan

## 🎯 Overview
A comprehensive fitness/gym management system with full backend powered by Supabase, supporting 4 user roles, bilingual interface (EN/TH), and 24+ pages with complete CRUD operations.

---

## Phase 1: Foundation & Backend Setup

### 1.1 Design System Implementation
- Custom CSS variables for the MOOM CLUB color palette (orange #FF9500, teal #1ABFA8, etc.)
- Typography system with Sarabun font support for Thai
- Reusable component library: DataTable, StatusTabs, SearchBar, DateRangePicker, StatCard, Badge, Toggle, EmptyState
- Bangkok timezone (GMT+7) and THB currency formatting

### 1.2 Supabase Database Schema
**Core Tables:**
- `members` - Member profiles with all fields (ID, contact, status, risk level)
- `packages` - Package definitions (Unlimited/Session/PT types)
- `classes` - Class definitions with categories
- `schedule` - Class schedule entries
- `rooms` - Room configurations
- `transactions` - Financial transactions
- `staff` - Staff members
- `user_roles` - RBAC role assignments (separate table for security)
- `roles` - Role definitions (4 levels: Minimum → Master)
- `locations` - Multi-location support
- `leads` - Lead management
- `promotions` - Promo codes and discounts
- `activity_log` - Audit trail
- `announcements` - System announcements
- `notifications` - User notifications
- `workouts` - CrossFit/workout tracking
- `member_packages` - Junction table for member package ownership
- `member_attendance` - Check-in records
- `member_billing` - Billing history
- `settings` - App settings (JSON storage per section)

### 1.3 Authentication & RBAC
- Supabase Auth with email/password login
- 4-level role system: Owner, Admin, Trainer, Front desk
- Row Level Security (RLS) policies on all tables
- Security definer functions for role checks
- Menu visibility based on access level

---

## Phase 2: Core Layout & Navigation

### 2.1 Header (Fixed Top)
- MOOM CLUB logo with hamburger menu
- Support button: "Support: 099-616-3666"
- Notification bell with unread count (red dot)
- Language switcher (EN/TH dropdown)
- User avatar with dropdown (Edit profile, Logout)

### 2.2 Sidebar (Fixed Left ~220px)
- Collapsible menu groups with icons
- Active state highlighting
- Footer: "© 2026 MOOM CLUB | Version 0.0.1"
- Terms/Privacy links
- Responsive: collapses on tablet, drawer on mobile

### 2.3 Main Content Area
- Breadcrumb navigation
- Page title with "Updated" timestamp
- Consistent action button placement

---

## Phase 3: All Pages Implementation

### Dashboard (/)
- 3 stat cards: Check-ins today, Currently in class, Classes scheduled
- Toggle tabs: Classes | Gym check-in
- Today's schedule table with date picker
- Right sidebar: High risk members, Hot leads, Upcoming birthdays

### Lobby (/lobby)
- Real-time check-in monitoring
- Date selector, search, and Check-in button
- Table: Time, Name, Package used, Usage, Location, Status

### Member Management
- **Members List (/members)**: Searchable table with status tabs (Active/Suspended/On hold/Inactive), CSV export, pagination
- **Member Details (/members/:id/detail)**: 9 tabs (Home, Profile, Attendance, Packages, Billing, Injuries, Notes, Suspensions, Contract), editable avatar, stat cards

### Leads (/leads)
- Lead tracking with contact status
- Create lead form

### Package Management
- **Packages List (/package)**: All package types with status tabs
- **Create Package (/package/create)**: Multi-step form with type selection (Unlimited/Session/PT), pricing, term settings, access rules, preview sidebar, validation

### Promotions (/promotion)
- Promo code management with discount types
- Status tabs: Active/Scheduled/Drafts/Archive

### Class Management
- **Schedule (/calendar)**: Day view with stats, trainer filter, capacity visualization
- **Room Layouts (/room)**: Room configuration with capacity
- **Class List (/class)**: Class/PT definitions
- **Categories (/class-category)**: Category management with class counts

### Your Gym
- **Staff (/admin)**: Staff management with role assignment
- **Roles (/roles)**: RBAC configuration (4 levels)
- **Locations (/location)**: Multi-location management
- **Activity Log (/activity-log)**: Audit trail with date range filter
- **Announcements (/announcement)**: System announcements
- **Workout List (/workout-list)**: CrossFit workouts (Fran, Grace, Isabel, etc.)

### Finance
- **Transfer Slips (/transfer-slip)**: Payment verification with status tabs
- **Finance (/finance)**: Transaction dashboard with stats (Total sales, Net income, Refunds)

### Reports (/report/*)
- **Member Reports**: Active members trend, Members at risk (pie chart), Package usage
- **Class Reports**: Capacity by hour, Popularity rankings
- **Package Reports**: Sales comparison, Sales over time

### Notifications (/notifications)
- Full notification center with date/status filters
- Event types: Booking, Cancellation, Payment, Registration, Expiry

### Settings (/setting/*)
- **General**: Payment methods (Bank/Stripe/PromptPay), Appearance (theme colors), Timezone, Workout toggle, Gym check-in
- **Class**: Booking rules, Check-in, Waitlisting, Cancellations, No-show
- **Client**: Injured/Suspended/On hold member rules
- **Package**: Expiration conditions
- **Member Contracts**: E-signing toggle

---

## Phase 4: Internationalization (i18n)

- Complete EN/TH translation system
- Language context provider
- Date format: "D MMM YYYY" (e.g., "3 FEB 2026")
- Time format: 24-hour
- All UI labels, messages, and validation errors in both languages

---

## Phase 5: Polish & Stability

### Quality Requirements
- Loading states on all data fetches
- Empty state illustrations on all tables
- Error handling with user-friendly messages
- Form validation with Thai language support
- Search, filter, sort, pagination working on all tables
- Responsive design: Desktop → Tablet (collapsible sidebar) → Mobile (bottom nav, drawer)

### Sample Data
- Pre-populated workout list (CrossFit workouts)
- Sample member IDs (M-0000001 format)
- Sample transactions and packages

---

## Technical Architecture

**Frontend:**
- React + TypeScript + Vite
- Tailwind CSS with custom design tokens
- React Router for navigation
- React Query for data fetching
- react-i18next for translations
- Lucide React for icons

**Backend:**
- Supabase Database (PostgreSQL)
- Supabase Auth
- Row Level Security (RLS)
- Edge Functions for complex operations

---

## Deliverables for v0.0.1
✅ All 24+ pages fully functional
✅ Complete CRUD operations
✅ RBAC enforced (4 levels)
✅ Bilingual (EN/TH)
✅ Bangkok timezone + THB currency
✅ Real database with sample data
✅ CSV export functionality
✅ Notification system
✅ Theme customization
✅ Member risk analytics
