# Moom - Gym Management System: Comprehensive Analysis

## 1. Project Overview

**Moom** คือระบบจัดการฟิตเนส/ยิม (Gym Management System) แบบครบวงจร พัฒนาด้วย React + TypeScript บน Vite, ใช้ Supabase เป็น Backend-as-a-Service, และรองรับ LINE LIFF สำหรับ Member/Trainer App

|항목 | รายละเอียด |
|------|-----------|
| **Framework** | React 18 + TypeScript + Vite |
| **UI Library** | shadcn/ui (Radix UI + Tailwind CSS) |
| **State Management** | TanStack React Query + React Context |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| **Routing** | React Router v6 |
| **Internationalization** | react-i18next (EN/TH) |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Mobile Integration** | LINE LIFF SDK |
| **Styling** | Tailwind CSS + tailwindcss-animate |
| **Testing** | Vitest + Testing Library |
| **Build Tool** | Vite + SWC (via @vitejs/plugin-react-swc) |
| **Source Files** | 175 files, ~26,223 lines of code |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  Pages   │Components│  Hooks   │ Contexts │   Libraries     │
│ (30+)    │ (80+)    │ (25+)    │   (3)    │   (utils/i18n)  │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                  TanStack React Query                        │
├─────────────────────────────────────────────────────────────┤
│                 Supabase Client SDK                          │
├──────────────────────┬──────────────────────────────────────┤
│   Supabase Auth      │     Supabase PostgreSQL              │
│   (Email/Password)   │     (30+ tables, RLS, enums)         │
├──────────────────────┼──────────────────────────────────────┤
│  Edge Functions      │     LINE API Integration             │
│  (line-auth)         │     (LIFF SDK, OAuth2)               │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 3. Routing Structure

### Public Routes (ไม่ต้อง login)
| Path | Page | Description |
|------|------|-------------|
| `/login` | Login | เข้าสู่ระบบ |
| `/signup` | Signup | สมัครสมาชิก staff |
| `/forgot-password` | ForgotPassword | ขอรีเซ็ตรหัสผ่าน |
| `/liff/member` | LiffMemberApp | LINE LIFF app สำหรับสมาชิก |
| `/liff/trainer` | LiffTrainerApp | LINE LIFF app สำหรับเทรนเนอร์ |
| `/liff/callback` | LiffCallback | LINE OAuth callback |

### Protected Routes (ต้อง login + role-based)
| Path | Page | Access Level |
|------|------|-------------|
| `/` | Dashboard | ทุกคน |
| `/lobby` | Lobby (Check-in) | ทุกคน |
| `/members` | Members List | ทุกคน |
| `/members/:id/detail` | Member Details | ทุกคน |
| `/leads` | Lead Management | ทุกคน |
| `/package` | Packages | operator+ |
| `/package/create` | Create Package | operator+ |
| `/promotion` | Promotions | operator+ |
| `/calendar` | Schedule | manager+ |
| `/room` | Rooms | manager+ |
| `/class` | Classes | manager+ |
| `/class-category` | Class Categories | manager+ |
| `/admin` | Staff Management | manager+ |
| `/roles` | Role Management | master only |
| `/location` | Locations | manager+ |
| `/activity-log` | Activity Log | manager+ |
| `/announcement` | Announcements | manager+ |
| `/workout-list` | Workout List | manager+ |
| `/transfer-slip` | Transfer Slips | manager+ |
| `/finance` | Finance | manager+ |
| `/report` | Reports Hub | operator+ |
| `/report/member/*` | Member Reports | operator+ |
| `/report/class/*` | Class Reports | operator+ |
| `/report/package/*` | Package Reports | operator+ |
| `/setting/*` | Settings (5 sub-pages) | manager+ |
| `/profile` | User Profile | ทุกคน |
| `/coming-soon` | Feature Roadmap | operator+ |
| `/member-app` | Member App Preview | - |
| `/trainer-app` | Trainer App Preview | - |

---

## 4. Authentication & Authorization

### Authentication
- ใช้ **Supabase Auth** (email/password)
- Session management ผ่าน `onAuthStateChange` listener
- Sign up → auto-assign default role

### Role-Based Access Control (RBAC)
```
Level 4: master (owner)      → เข้าถึงทุกอย่าง + จัดการ roles
Level 3: manager (admin)     → เข้าถึงการตั้งค่า, การเงิน, staff
Level 2: operator (trainer)  → เข้าถึง reports, packages
Level 1: minimum (front_desk) → เข้าถึงพื้นฐาน (lobby, members, leads)
```

### App Roles → Access Levels Mapping
| App Role | Access Level | Description |
|----------|-------------|-------------|
| `owner` | level_4_master | เจ้าของยิม |
| `admin` | level_3_manager | ผู้จัดการ |
| `trainer` | level_2_operator | เทรนเนอร์ |
| `front_desk` | level_1_minimum | พนักงานหน้าเคาน์เตอร์ |

---

## 5. Database Schema (30+ tables)

### Core Domain: Members
```
members ─────────────────────────────────────────
├── member_packages → packages (แพ็กเกจที่ซื้อ)
│   └── package_usage_ledger (ประวัติการใช้ session)
├── member_attendance → schedule, locations (ประวัติเข้าใช้)
├── member_notes → staff (บันทึกส่วนตัว)
├── member_injuries (ประวัติอาการบาดเจ็บ)
├── member_suspensions (ประวัติพักสมาชิก)
├── member_contracts (สัญญา)
├── member_billing → transactions (ประวัติเรียกเก็บเงิน)
└── line_users (เชื่อมต่อ LINE account)
```

### Core Domain: Classes & Scheduling
```
classes → class_categories
schedule → classes, staff, rooms, locations
├── class_bookings → member_packages (การจอง)
└── class_waitlist → members (waitlist)
```

### Core Domain: Finance
```
transactions → members, packages
├── payment_method: credit_card | bank_transfer | qr_promptpay
└── status: paid | pending | voided | needs_review
```

### Core Domain: Operations
```
staff → roles (access_level)
locations → rooms
leads (sales pipeline)
promotions (โปรโมชั่น)
announcements → staff
```

### System Tables
```
notifications (การแจ้งเตือน)
activity_log (audit trail)
feature_flags → feature_flag_assignments (ระบบ feature flags)
settings (configuration key-value)
checkin_qr_tokens (QR check-in)
user_roles (role mapping)
event_outbox (event sourcing)
```

### Key Enums
| Enum | Values |
|------|--------|
| `member_status` | active, suspended, on_hold, inactive |
| `booking_status` | booked, cancelled, attended, no_show |
| `package_type` | unlimited, session, pt |
| `package_status` | on_sale, scheduled, drafts, archive |
| `transaction_status` | paid, pending, voided, needs_review |
| `payment_method` | credit_card, bank_transfer, qr_promptpay |
| `lead_status` | new, contacted, interested, not_interested, converted |
| `risk_level` | high, medium, low |
| `class_type` | class, pt |
| `class_level` | all_levels, beginner, intermediate, advanced |

---

## 6. Data Layer (Custom Hooks)

ทุก hook ใช้ **TanStack React Query** สำหรับ caching, invalidation, และ optimistic updates

### Member Management
| Hook | Tables | Operations |
|------|--------|-----------|
| `useMembers` | members | LIST (paginated, filtered), CREATE, UPDATE, DELETE, STATS |
| `useMemberDetails` | members + 6 related tables | READ (detailed), CREATE notes, UPDATE |

### Class & Booking
| Hook | Tables | Operations |
|------|--------|-----------|
| `useClasses` | classes, class_categories | LIST, READ, CREATE, UPDATE, DELETE, STATS |
| `useClassCategories` | class_categories | CRUD + search |
| `useClassBookings` | class_bookings + related | READ, CREATE, CANCEL, MARK ATTENDANCE (single/batch) |
| `useSchedule` | schedule + related | LIST by date, CREATE, UPDATE, DELETE, STATS |

### Package & Usage
| Hook | Tables | Operations |
|------|--------|-----------|
| `usePackages` | packages | CRUD + ARCHIVE + STATS |
| `usePackageUsage` | member_packages, package_usage_ledger | RECORD usage, REFUND, ADJUST, READ history |

### Finance & Billing
| Hook | Tables | Operations |
|------|--------|-----------|
| `useFinance` | transactions + related | READ (filtered), STATS, UPDATE status |

### Operations
| Hook | Tables | Operations |
|------|--------|-----------|
| `useStaff` | staff, roles | CRUD + STATS |
| `useRoles` | roles, staff | CRUD + staff count |
| `useLocations` | locations | CRUD + STATS |
| `useRooms` | rooms, locations | CRUD + STATS |
| `useLeads` | leads | CRUD + search |
| `usePromotions` | promotions | CRUD + STATS |
| `useAnnouncements` | announcements, staff | CRUD + STATS |

### System
| Hook | Tables | Operations |
|------|--------|-----------|
| `useNotifications` | notifications | LIST, MARK READ (single/bulk), UNREAD count (auto-refresh 30s) |
| `useActivityLog` | activity_log + related | READ (date range filtered) |
| `useFeatureFlags` | feature_flags + assignments | CRUD + TOGGLE |
| `useSettings` | settings | READ by section, UPDATE (upsert), BATCH update |
| `useCheckinQR` | checkin_qr_tokens | GENERATE, VALIDATE, READ, CLEANUP expired |

### LINE Integration
| Hook | Tables | Operations |
|------|--------|-----------|
| `useLineAuth` | (edge function) | Verify LINE ID token, link account |
| `useLineUsers` | line_users, members | CRUD + LINK/UNLINK + SEARCH |

### Reports & Analytics
| Hook | Tables | Operations |
|------|--------|-----------|
| `useDashboardStats` | multiple | Check-ins, class counts, high-risk members, leads, birthdays |
| `useReports` | multiple | Members at risk, active members, class capacity, package sales |
| `useLobby` | member_attendance + related | Check-in operations |

---

## 7. Key Business Logic

### Risk Level Algorithm (Members at Risk)
```
HIGH RISK:   ≤30 วันก่อนหมด OR (≤33% sessions เหลือ AND ≤3 sessions)
MEDIUM RISK: ≤60 วันก่อนหมด OR (≤60% sessions เหลือ AND ≤15 sessions)
LOW RISK:    >60 วัน AND >60% sessions AND >15 sessions
```

### Package Usage Ledger
- **Ledger-based** tracking (immutable history)
- ทุก operation (checkin, booking, pt_session, adjustment) สร้าง record ใหม่
- Validates sufficient sessions ก่อน deduction
- ป้องกัน negative balance
- รองรับ refund และ manual adjustment

### QR Check-in System
- Token หมดอายุ 2 นาที (configurable)
- Auto-invalidate token เก่าก่อนสร้างใหม่
- ป้องกัน reuse (mark as used with staff_id)
- Track location ที่ check-in

### Member ID Generation
- Format: `M-0000001` (auto-increment)
- Query max existing ID → +1

---

## 8. UI Component Architecture

### Layout System
```
MainLayout
├── Header (fixed top)
│   ├── Logo + Menu toggle
│   ├── Support phone
│   ├── Notifications dropdown (real-time unread count)
│   ├── Language switcher (EN/TH)
│   └── User avatar dropdown (profile + logout)
├── Sidebar (fixed left, 220px, collapsible on mobile)
│   ├── Hierarchical nav groups
│   ├── Access level-based visibility
│   └── Active route highlighting
└── Content area (Outlet)
```

### Shared Components (`src/components/common/`)
| Component | Description |
|-----------|-------------|
| `PageHeader` | Title + breadcrumb + optional action buttons |
| `DataTable` | Sortable, selectable, paginated table with mobile scroll |
| `StatCard` | KPI card with trend indicator (5 color variants) |
| `StatusBadge` | Color-coded status badges (12 variants) |
| `SearchBar` | Real-time search input |
| `EmptyState` | Empty data visualization (9 variants with icons) |
| `StatusTabs` | Tab-style filters with counts |
| `DatePicker` | Single date with navigation arrows |
| `DateRangePicker` | Date range with 2-month calendar |

### Feature Components
| Area | Components |
|------|-----------|
| Members | CreateMemberDialog, EditMemberDialog |
| Schedule | ScheduleClassDialog, BookingManagementDialog, AddBookingForm |
| Lobby | CheckInDialog (member search + package selection) |
| Reports | ReportPageLayout, ReportFilters, ReportStatCard, ManageDropdown |
| Rooms | CreateRoomDialog (with layout & access control) |
| Announcements | CreateAnnouncementDialog |
| Auth | ProtectedRoute (route guard) |
| Settings | SettingsLayout, SettingsSidebar |
| LIFF | LiffBottomNav, LiffComingSoon |
| Roadmap | FeatureCard, VersionBadge, RoadmapCard |

### UI Primitives (shadcn/ui)
48 UI component files based on Radix UI including: Button, Input, Dialog, Drawer, Tabs, Table, Card, Select, Checkbox, Toast, Calendar, Chart, Accordion, etc.

---

## 9. Internationalization (i18n)

- **Supported Languages**: English (en), Thai (th)
- **Library**: react-i18next
- **Persistence**: localStorage
- **Coverage**: UI labels, form validations, status texts, date formatting
- **Date Locale**: date-fns locale support (en-US / th)
- **Currency**: Thai Baht (฿) formatting
- **Timezone**: Bangkok (GMT+7)

---

## 10. LINE LIFF Integration

### Architecture
```
LINE App → LIFF SDK → /liff/callback → verify token → link to member
```

### Components
- **LiffMemberApp**: Mini app สำหรับสมาชิกดู profile, schedule, check-in
- **LiffTrainerApp**: Mini app สำหรับเทรนเนอร์ดู schedule, attendance
- **LiffCallback**: OAuth2 callback handler
- **LiffContext**: Global LIFF state management
- **LiffBottomNav**: Mobile bottom navigation
- **Edge Function `line-auth`**: Verify LINE ID token via LINE API, create/update line_users record

---

## 11. Feature Completeness Assessment

### Fully Implemented
- Dashboard with KPIs (check-ins, classes, high-risk members, leads, birthdays)
- Member CRUD with detailed profile (packages, attendance, billing, notes, injuries, suspensions, contracts)
- Class & category management
- Schedule management with booking & waitlist
- Package CRUD with session tracking (ledger-based)
- Lobby/Check-in system (manual + QR)
- Staff & role management (4-level RBAC)
- Location & room management
- Lead pipeline management
- Financial transactions & transfer slip tracking
- Announcements
- Promotions
- Notifications (real-time refresh)
- Activity log (audit trail)
- Settings (5 sections: general, class, client, package, contracts)
- Feature flags system
- CSV export (members)
- Report pages (6 reports: members at risk, active members, class capacity by hour/over time, package sales/over time)

### In Development / Planned
- Feature Flags UI in Settings (per .lovable/plan.md)
- Enhanced booking management UI in Schedule (per .lovable/plan.md)
- Workout list feature
- Full LINE LIFF member/trainer apps

---

## 12. Technical Patterns

### State Management
- **Server state**: TanStack React Query (caching, invalidation, background refresh)
- **Client state**: React Context (auth, language, LIFF)
- **Form state**: React Hook Form + Zod
- **No Redux/Zustand** — clean architecture with hooks

### Data Flow
```
Page → Custom Hook → TanStack Query → Supabase Client → PostgreSQL
                   ← Cache + Optimistic Update ←
```

### Mobile Responsiveness
- `useIsMobile()` hook for adaptive UI
- Dialog (desktop) ↔ Drawer (mobile) auto-switching
- Collapsible sidebar
- Horizontal scroll with gradient indicator for tables
- Safe-area padding for LIFF bottom nav

### Security
- Supabase Row Level Security (RLS)
- Protected routes with role verification
- QR tokens with expiration
- LINE ID token verification via edge function

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Zod validation on all forms
- Consistent error handling patterns
- Loading skeletons for all data views
- Empty states for all list views

---

## 13. Database Migrations

7 migration files found in `supabase/migrations/` (all from February 2026), indicating the schema was set up incrementally:
1. Initial schema setup
2. Additional tables and relationships
3. Enums and constraints
4. Feature flags system
5. Booking and waitlist system
6. QR check-in tokens
7. Package usage ledger

---

## 14. Edge Functions

### `line-auth` (Supabase Edge Function)
- **Purpose**: Verify LINE ID tokens and manage LINE-member account linking
- **Endpoint**: Called from `useLineAuth` hook
- **Flow**: Receive ID token → Verify with LINE API → Create/update `line_users` → Return profile + linking status
- **Environment**: Requires `LINE_CHANNEL_ID` env variable

---

## 15. Summary

**Moom** เป็นระบบจัดการยิมที่ครบถ้วนและออกแบบมาอย่างดี มีจุดเด่นคือ:

1. **Architecture สะอาด**: แยก concerns ชัดเจน (pages → hooks → supabase)
2. **Type-safe ตลอด**: TypeScript + Zod + Supabase generated types
3. **Scalable**: Feature flags, role-based access, multi-location support
4. **Bilingual**: รองรับ EN/TH อย่างสมบูรณ์
5. **Mobile-ready**: Responsive UI + LINE LIFF integration
6. **Audit-friendly**: Activity log + ledger-based tracking
7. **Business-complete**: ครอบคลุมทุก workflow ของยิม (สมาชิก, คลาส, แพ็กเกจ, การเงิน, รายงาน)
