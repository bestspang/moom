# MOOM - Gym Management Platform: Comprehensive Analysis

## สารบัญ (Table of Contents)

1. [ภาพรวมของระบบ (System Overview)](#1-ภาพรวมของระบบ)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Feature Analysis (วิเคราะห์ทุก Feature)](#3-feature-analysis)
4. [Backend & Database Architecture](#4-backend--database-architecture)
5. [AI & Intelligence Layer](#5-ai--intelligence-layer)
6. [Security & Access Control](#6-security--access-control)
7. [ประเมินจุดแข็ง (Strengths)](#7-ประเมินจุดแข็ง)
8. [ประเมินจุดอ่อน & Technical Debt](#8-ประเมินจุดอ่อน--technical-debt)
9. [System Suggestion & Roadmap](#9-system-suggestion--roadmap)

---

## 1. ภาพรวมของระบบ

**MOOM** เป็นระบบบริหารจัดการยิม (Gym Management System) แบบครบวงจร ออกแบบมาเพื่อรองรับธุรกิจฟิตเนสที่มีหลายสาขา (Multi-location) โดยครอบคลุมตั้งแต่:

- การจัดการสมาชิก (Member Lifecycle Management)
- การจองคลาสและตารางเรียน (Class Scheduling & Booking)
- การขายแพ็กเกจและโปรโมชัน (Package Sales & Promotions)
- ระบบการเงิน (Finance & Payment Processing)
- การเช็คอิน QR Code / LINE LIFF (Check-in System)
- รายงานและ Analytics (Business Intelligence)
- ระบบ AI แนะนำการตัดสินใจ (AI-Powered Suggestions)
- การสื่อสารผ่าน LINE OA (LINE Integration)

**Target Users:**
| Role | Access Level | Description |
|------|-------------|-------------|
| Owner | Level 4 (Master) | เจ้าของยิม - เข้าถึงทุกอย่าง |
| Admin/Manager | Level 3 (Manager) | ผู้จัดการ - จัดการ staff, การเงิน, packages |
| Trainer | Level 2 (Operator) | ผู้ฝึกสอน - จัดการสมาชิก, คลาส, leads |
| Front Desk | Level 1 (Minimum) | พนักงานหน้าเคาน์เตอร์ - เช็คอิน, ดูข้อมูลพื้นฐาน |

---

## 2. Tech Stack & Architecture

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** + **TypeScript** | UI framework with type safety |
| **Vite 5** (SWC) | Build tool with fast HMR |
| **React Router v6** | Client-side routing (50+ routes) |
| **TanStack React Query** | Server state management & caching |
| **Tailwind CSS** + **shadcn/ui** | Styling & component library |
| **Recharts** | Charts & data visualization |
| **react-hook-form** + **Zod** | Form management & validation |
| **i18next** | Internationalization (EN/TH) |
| **Lucide React** | Icon library |
| **date-fns** | Date manipulation |
| **qrcode.react** | QR code generation |
| **cmdk** | Command palette (Cmd+K) |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Supabase** (PostgreSQL) | Database, Auth, Realtime, Storage |
| **Supabase Edge Functions** (Deno) | Serverless backend logic (7 functions) |
| **Supabase RLS** | Row-Level Security (27 tables protected) |
| **Stripe** | Payment processing |
| **LINE LIFF SDK** | LINE mini-app integration |
| **LINE Login** | OAuth authentication for members |
| **Lovable AI Gateway** (Gemini 3 Flash) | AI briefing generation |

### Architecture Pattern
```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React SPA)              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐           │
│  │ React    │ │ React    │ │ i18n      │           │
│  │ Router   │ │ Query    │ │ (EN/TH)   │           │
│  └──────────┘ └──────────┘ └───────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐           │
│  │ Auth     │ │ Feature  │ │ Command   │           │
│  │ Context  │ │ Flags    │ │ Palette   │           │
│  └──────────┘ └──────────┘ └───────────┘           │
├─────────────────────────────────────────────────────┤
│                 Supabase Platform                    │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐           │
│  │ Auth     │ │ Realtime │ │ Edge      │           │
│  │ (JWT)    │ │ Sync     │ │ Functions │           │
│  └──────────┘ └──────────┘ └───────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐           │
│  │PostgreSQL│ │ RLS      │ │ Storage   │           │
│  │(27 tbls) │ │ Policies │ │           │           │
│  └──────────┘ └──────────┘ └───────────┘           │
├─────────────────────────────────────────────────────┤
│              External Services                       │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐           │
│  │ Stripe   │ │ LINE     │ │ Lovable   │           │
│  │ Payment  │ │ LIFF/OA  │ │ AI Gateway│           │
│  └──────────┘ └──────────┘ └───────────┘           │
└─────────────────────────────────────────────────────┘
```

### State Management Strategy
| Layer | Technology | Use Case |
|-------|-----------|----------|
| Server State | React Query | API data, caching (5-15 min stale time) |
| Auth State | React Context (AuthContext) | User session, role, access level |
| Language State | React Context (LanguageContext) | i18n language switching |
| Form State | react-hook-form + Zod | Form validation & submission |
| URL State | React Router (searchParams) | Filters, pagination, tabs |

---

## 3. Feature Analysis

### 3.1 Dashboard (หน้าแรก)
**หน้าที่:** ศูนย์กลางข้อมูลสำหรับ daily operations

**ส่วนประกอบ:**
- **KPI Cards:** เช็คอินวันนี้/เมื่อวาน, คนอยู่ในคลาสตอนนี้, คลาสวันนี้
- **AI Daily Briefing:** สรุปข้อมูลจาก Gemini AI (check-ins, classes, expiring packages, high-risk members)
- **Business Health Score:** คะแนนสุขภาพธุรกิจ composite (Retention 35% + Revenue 30% + Class Util 20% + Lead Conv 15%)
- **Revenue Forecast:** เปรียบเทียบรายได้ เดือนก่อน / เดือนนี้ / เดือนหน้า (projected)
- **Needs Attention Card:** แพ็กเกจใกล้หมด, สมาชิก high-risk, hot leads, transfer slips รอ approve
- **Goal Progress:** ติดตามเป้าหมายธุรกิจ
- **Expiring Packages:** แพ็กเกจที่กำลังจะหมดอายุใน 30 วัน
- **Quick Check-in FAB:** ปุ่มเช็คอินด่วน

**Technical Details:**
- Hooks: `useDashboardStats`, `useScheduleByDate`, `useGymCheckinsByDate`, `useHighRiskMembers`, `useExpiringPackages`
- Bangkok timezone handling via `getBangkokDayRange()` สำหรับ date boundaries ที่ถูกต้อง
- Parallel data fetching ด้วย `Promise.all` สำหรับ efficiency

---

### 3.2 Members (จัดการสมาชิก)
**หน้าที่:** CRM สำหรับสมาชิกทั้งหมด

**ส่วนประกอบ:**
- **Member List:** ตารางสมาชิกพร้อม pagination (50/page)
- **Status Tabs:** Active / Suspended / On Hold / Inactive
- **Search:** ค้นหาตามชื่อ, เบอร์โทร, อีเมล
- **Bulk Actions:** ลบ, export, เปลี่ยนสถานะ หลายรายการพร้อมกัน
- **CSV Import/Export:** นำเข้า-ส่งออกข้อมูลสมาชิก
- **Engagement Score:** คะแนน engagement (high/medium/low) แสดงข้างชื่อ
- **Create/Edit Dialog:** สร้าง/แก้ไขสมาชิก (6-step wizard)

**Member Detail Page (หน้ารายละเอียด):**
- 10 Tabs: Home, Profile, Attendance, Packages, Billing, Injuries, Notes, Communications, Suspensions, Contract
- Stats: วันที่สมัคร, คลาสที่เข้าบ่อยสุด, ยอดใช้จ่าย, วันก่อนแพ็กเกจหมด
- Risk Level Assessment
- LINE Identity Card integration
- Front Desk Notes with auto-save

**Member Wizard (6 Steps):**
1. Profile (ชื่อ, นามสกุล, ชื่อเล่น, วันเกิด, เพศ, สาขา)
2. Contact (เบอร์โทร, อีเมล - ต้องมีอย่างน้อย 1)
3. Address (ที่อยู่, รหัสไปรษณีย์)
4. Emergency Contact (ชื่อผู้ติดต่อฉุกเฉิน, เบอร์โทร, ความสัมพันธ์)
5. Medical Info (โรคประจำตัว, ยินยอม physical contact)
6. Other (แหล่งที่มา, แพ็กเกจที่สนใจ, หมายเหตุ)

**Technical Details:**
- Engagement Score Formula: `Recency(40%) + Frequency(30%) + Usage(30%)`
  - Recency = `max(0, 100 - daysSinceLastVisit/30 * 100)`
  - Frequency = `min(100, visitsPerWeek/4 * 100)`
  - Usage = `min(100, sessionsUsed/totalSessions * 100)`
- Batch enrichment queries หลีกเลี่ยง N+1 problems
- Set-based deduplication สำหรับ latest package/attendance per member

---

### 3.3 Schedule (ตารางคลาส)
**หน้าที่:** จัดการตารางเรียนและการจอง

**ส่วนประกอบ:**
- **Date Picker:** เลือกวันที่ดูตาราง
- **Trainer Filter:** กรองตาม trainer
- **Dual View:** List view + Timeline view (grid by room x time)
- **Stats:** จำนวนคลาส, PT, avg capacity, cancellations
- **Booking Management Dialog:** จัดการจอง, waitlist, mark attendance
- **Schedule Class Creation:** สร้างตารางคลาสใหม่

**Timeline View Technical Details:**
- Grid: Time column (6:00-22:00) x Room columns
- Position calculation: `topPx = ((startMin - START_HOUR*60) / 60) * HOUR_HEIGHT`
- 7-color rotation per unique class_id
- Sticky headers for scroll navigation

**Booking Operations:**
- `markAttendance(bookingId, status)` -> attended / no_show
- `cancelBooking(bookingId, cancelledBy)`
- `promoteFromWaitlist(waitlistId, memberId)` -> สร้าง booking ใหม่จาก waitlist

---

### 3.4 Classes (คลาสเรียน)
**หน้าที่:** จัดการ catalog คลาสทั้งหมด

**ส่วนประกอบ:**
- Status tabs: Active / Drafts / Archive
- Type: Class vs PT (Personal Training)
- Level: All Levels / Beginner / Intermediate / Advanced
- Category assignment
- Duration tracking
- Bulk operations: ลบ, duplicate, เปลี่ยนสถานะ
- CSV import/export

---

### 3.5 Leads (ลูกค้าเป้าหมาย)
**หน้าที่:** Sales pipeline management

**ส่วนประกอบ:**
- **Lead Scoring:** คำนวณคะแนน (high/medium/low) อัตโนมัติ
- **Status Pipeline:** New -> Contacted -> Interested -> Converted / Not Interested
- **Source Tracking:** import, referral ฯลฯ
- **Contact History:** จำนวนครั้งที่ติดต่อ, วันที่ติดต่อล่าสุด
- **Lead-to-Member Conversion:** แปลง lead เป็น member พร้อมข้อมูล pre-filled
- **CSV Import/Export**

---

### 3.6 Lobby (เช็คอิน)
**หน้าที่:** สถานีเช็คอินสำหรับหน้าเคาน์เตอร์

**ส่วนประกอบ:**
- รายการเช็คอินแบบ realtime ตามวันที่
- วิธีเช็คอิน: QR Code, LIFF (LINE), Manual
- ติดตาม package usage (sessions used/remaining)
- ค้นหาสมาชิกและ package
- QR Code Check-in Dialog
- Manual Check-in Dialog

---

### 3.7 Packages (แพ็กเกจสมาชิก)
**หน้าที่:** จัดการแพ็กเกจที่ขาย

**ส่วนประกอบ:**
- **Types:** Unlimited / Session-based / PT (Personal Training)
- **Usage Types:** Class Only / Gym Checkin Only / Both
- Status: On Sale / Scheduled / Drafts / Archive
- ราคา (with VAT 7%)
- ระยะเวลา (validity days)
- จำนวน session limit
- Category & Location access control
- Popular package marking
- Bulk operations + CSV import/export

---

### 3.8 Promotions (โปรโมชัน)
**หน้าที่:** จัดการส่วนลดและ promo codes

**ส่วนประกอบ:**
- **Types:** Promo Code / Discount
- **Modes:** Percentage / Flat Rate
- Date range scheduling
- Promo code + copy-to-clipboard
- Per-package discount overrides (via `promotion_packages` join table)
- Status: Active / Scheduled / Drafts / Archive
- Redemption tracking (usage_count)
- Bulk operations + CSV export

---

### 3.9 Staff (พนักงาน)
**หน้าที่:** จัดการพนักงานและ trainer

**ส่วนประกอบ:**
- Status: Active / Pending / Inactive / Terminated
- Multi-role assignment (staff_positions many-to-many)
- Location scope: All locations / specific
- Invite workflow: `pending -> active -> terminated`
- Contact info management
- CSV export/import

---

### 3.10 Finance (การเงิน)
**หน้าที่:** ระบบจัดการการเงินครบวงจร

**5 Tabs:**

**1. Overview:**
- KPI: จำนวน transactions, total sales, net income, refunds
- Daily revenue chart
- Payment method breakdown (Pie chart)

**2. Transactions:**
- รายการ transactions พร้อม filters (status, payment method, date range)
- Columns: Date, Transaction ID, Order, Source, Type, Member, Location, Amount, Payment, Status

**3. Transfer Slips:**
- สลิปโอนเงินรอ approve
- Status: Needs Review / Approved / Voided
- Slip detail dialog

**4. Forecasting:**
- เปรียบเทียบรายได้ 3 เดือน (last, this, next projected)
- Bar chart visualization

**5. P&L (Profit & Loss):**
- Revenue breakdown: Packages / PT / Other
- Expense categories: Rent, Utilities, Salary, Equipment, Marketing, Maintenance
- Net profit & margin calculation

**VAT Calculation (Thai standard 7%):**
```
exVat = grossAmount / 1.07
vatAmount = grossAmount - exVat
```

---

### 3.11 Analytics & Insights
**หน้าที่:** Business Intelligence dashboard

**Analytics Page:**
- Revenue trends (monthly bar chart)
- Member growth (new vs expired line chart)
- Class fill rate heatmap (Day x Hour grid)
- Lead funnel visualization with conversion %

**Insights Page (Executive Dashboard):**
- **ARPU** (Average Revenue Per User)
- **Retention Rate**
- **Class Utilization**
- **Lead Conversion Rate**
- **Estimated LTV** (Lifetime Value)
- 30-day revenue trend sparkline

---

### 3.12 Reports
**หน้าที่:** Structured reporting

**Member Reports:** Active Members, Members at Risk, Package Usage, Package at Risk
**Class Reports:** Capacity by Hour, Capacity over Time, Category Popularity, Class Popularity
**Package Reports:** Package Sales, Package Sales over Time

---

### 3.13 Announcements (ประกาศ)
**หน้าที่:** ส่งประกาศผ่าน In-App และ LINE

**ส่วนประกอบ:**
- Bilingual support (EN/TH)
- Multi-channel: In-App + LINE
- Location targeting: All / Specific locations
- Date range scheduling
- Status: Active / Scheduled / Completed

---

### 3.14 LINE LIFF Apps (Mini-Apps สำหรับ LINE)
**หน้าที่:** LINE LIFF mini-apps สำหรับสมาชิกและ trainer

**Member App:**
- LINE profile integration (display name, avatar)
- Member data linking
- Tabs: Home / Booking / Packages / Check-in / Profile

**Trainer App:**
- Tabs: Schedule / Attendance / PT Log / Members
- (Coming Soon - placeholder)

**Check-in Redeem:**
- QR token validation + expiry checking
- Member lookup by phone/member ID
- Sanitization against injection attacks
- State machine: Loading -> Member Input -> Checking In -> Success/Error

---

### 3.15 Locations & Rooms (สาขาและห้อง)
**Locations:** จัดการสาขา (Open/Closed), เวลาเปิด-ปิด, categories
**Rooms:** จัดการห้องเรียน, layout type (Fixed/Open Space), max capacity, category availability

---

### 3.16 Roles & Permissions
**หน้าที่:** RBAC (Role-Based Access Control) system

- 4-tier access levels (Master -> Manager -> Operator -> Minimum)
- Granular permission matrix per resource x action
- Multiple roles per staff (OR logic for permissions)
- `usePermissions` hook returns `can(resource, action)` function
- `ProtectedRoute` component enforces minimum access level

---

### 3.17 Workouts (โปรแกรมออกกำลังกาย)
**หน้าที่:** จัดการ training templates และ workout items

- Collapsible training templates
- Nested workout items: Name, Metric, Unit, Goal Type
- Active/Inactive toggle
- Bulk operations + CSV export/import

---

### 3.18 Command Palette (Cmd+K)
**หน้าที่:** Quick navigation system

- Trigger: `Cmd/Ctrl+K`
- 3 categories: People (members+leads), Quick Actions, Pages
- Debounced search (250ms)
- Searches across: first_name, last_name, nickname, phone, member_id
- 20+ page navigation items

---

### 3.19 Settings
**หน้าที่:** System configuration

- General (gym settings)
- Class Management
- Client Management
- Package Settings
- Member Contracts
- Feature Flags (global/location/user scope)
- Import/Export
- Integrations (LINE, Stripe)

---

## 4. Backend & Database Architecture

### 4.1 Database Schema (27 Tables)

**Core Tables:**
```
locations ──── staff ──── user_roles ──── roles
    |              |                        |
    |              |                  role_permissions
    |              |
    |-- rooms      |-- staff_positions
    |              |
    |-- schedule --|
    |   |          |
    |   |-- class_bookings ── members ── leads
    |   |-- class_waitlist      |
    |   |                       |-- member_packages ── packages
    |   |                       |-- member_attendance
    |   |                       |-- member_billing
    |   |                       |-- member_injuries
    |   |                       |-- member_notes
    |   |                       |-- member_suspensions
    |   |                       |-- member_contracts
    |   |                       |
    |   |                       |-- transactions ── transfer_slips
    |   |
    |   |-- classes ── class_categories
    |
    |-- announcements
    |-- workouts ── workout_items
    |-- promotions ── promotion_packages
```

**Supporting Tables:**
- `activity_log` - Audit trail (event_type, entity_type, old_value/new_value JSONB)
- `line_users` - LINE identity mapping
- `line_message_log` - Message delivery tracking (pending/sent/failed)
- `checkin_qr_tokens` - QR code check-in tokens
- `package_usage_ledger` - Append-only usage audit trail
- `event_outbox` - Async event queue (event sourcing pattern)
- `feature_flags` + `feature_flag_assignments` - Feature toggles
- `ai_runs` - AI service execution logs
- `ai_suggestions` - AI-generated suggestions with approval workflow

### 4.2 Edge Functions (7 Functions)

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `line-auth` | LINE OAuth -> verify ID token, create/update line_users | No (initial auth) |
| `daily-briefing` | AI daily summary via Gemini 3 Flash | Level 2+ |
| `approve-slip` | Transfer slip approval + transaction creation | Level 3+ |
| `auto-notifications` | Scheduled alerts (expiring packages, stale leads, inactive members) | System (cron) |
| `stripe-create-checkout` | Create Stripe checkout session | Level 3+ |
| `stripe-webhook` | Handle Stripe payment events (checkout.completed, charge.refunded) | Stripe signature |
| `invite-staff` | Staff onboarding workflow initiation | Level 3+ |

### 4.3 Key Backend Patterns

**Idempotency:** ทุก financial operation ใช้ idempotency key ป้องกัน duplicate processing
**Event Sourcing:** `event_outbox` table สำหรับ async event processing + retry
**Append-Only Ledgers:** `package_usage_ledger`, `line_message_log` - ไม่มี UPDATE/DELETE (tamper-proof)
**Atomic Sequences:** `next_transaction_number()` RPC function ป้องกัน race condition
**Soft Deletes:** ใช้ status enum (active/suspended/terminated) แทนการลบจริง

### 4.4 Transfer Slip Approval Workflow
```
Transfer Slip (needs_review)
  -> Validate amount > 0
  -> Calculate VAT (7% split)
  -> Create Transaction (status: paid)
  -> Create Member Billing entry
  -> Provision Member Package (if package_id provided)
    -> Set expiry_date = now + package.expiration_days
    -> sessions_remaining = package.sessions
  -> Update Slip status -> approved
  -> Log activity with transaction details
```

### 4.5 Stripe Payment Flow
```
Create Checkout -> Stripe Session -> Member pays -> Webhook fires
  -> checkout.session.completed:
    -> Mark Transaction status -> paid
    -> Create Member Billing record
    -> Provision Member Package
  -> charge.refunded:
    -> Mark Transaction status -> refunded
    -> Deactivate Member Packages
```

### 4.6 Auto-Notifications (Scheduled Job)
4 alert categories:
1. **Package Expiration** - แพ็กเกจหมดใน 7 วัน (urgent if <= 3 days)
2. **Stale Leads** - Leads ไม่ได้ติดต่อ 5+ วัน
3. **Inactive Members** - สมาชิก active ไม่เช็คอิน 14+ วัน
4. **Pending Transfers** - Transfer slips รอ review

---

## 5. AI & Intelligence Layer

### 5.1 AI Daily Briefing
- เรียก Lovable AI Gateway (Google Gemini 3 Flash)
- สรุปข้อมูลประจำวัน: check-ins, classes, expiring packages, high-risk members
- Fallback template ภาษาไทย/อังกฤษ เมื่อ AI ไม่ available
- Structured response พร้อม navigation routes

### 5.2 AI Suggestions Framework
```
AI generates suggestion -> User reviews (Dashboard card)
  -> Approve (status='approved' + audit)
  -> Reject (status='rejected')
  -> Apply (status='applied' + timestamp)
```
- Confidence score tracking
- Entity-type polymorphic (member, class, package etc.)
- Logged to `ai_runs` for traceability

### 5.3 Churn Prediction Algorithm
```
ChurnRisk = Members where:
  - prior 30 days attendance >= 2 sessions
  - last 30 days attendance < 50% of prior period

Decline% = (1 - recent/prior) x 100
Ranked by decline%, limited to top 20
```
ตรวจจับ **พฤติกรรมที่เปลี่ยนแปลง** (50%+ drop) ไม่ใช่แค่ low attendance

### 5.4 Business Health Score
```
Score = Retention(35%) + RevenueTrend(30%) + ClassUtil(20%) + LeadConv(15%)

Color coding:
  >= 70: teal (healthy)
  40-69: amber (caution)
  < 40:  red (critical)

Trend Signal:
  "up"     if thisMonth > lastMonth x 1.05
  "down"   if thisMonth < lastMonth x 0.95
  "stable" otherwise
```

### 5.5 Engagement Score System
```
Score = Recency(40%) + Frequency(30%) + Usage(30%)

Recency  = max(0, 100 - daysSinceLastVisit/30 * 100)
Frequency = min(100, visitsPerWeek/4 * 100)
Usage     = min(100, sessionsUsed/totalSessions * 100)

Level: >= 60 = "high", 30-59 = "medium", < 30 = "low"
```

### 5.6 Revenue Forecasting
```
projectedNextMonth =
  IF activePackages x avgPrice > 0:
    activePackages x avgPrice
  ELSE IF history available:
    average(lastMonth, thisMonth)
  ELSE: 0
```

### 5.7 Member Risk Assessment
```
HIGH RISK:   <= 30 days left OR (<= 33% sessions AND <= 3 sessions)
MEDIUM RISK: <= 60 days left OR (<= 60% sessions AND <= 15 sessions)
LOW RISK:    Complement of above
```

---

## 6. Security & Access Control

### 6.1 RLS Policies (Row-Level Security)
- **27 tables** ทุกตารางมี RLS enabled
- **4-tier access hierarchy** enforced at database level
- `SECURITY DEFINER` functions สำหรับ access checks
- Webhook signature verification (Stripe HMAC-SHA256)

### 6.2 Access Control Matrix

| Resource | Read | Write | Delete |
|----------|------|-------|--------|
| Members | Level 1+ | Level 2+ | Level 3+ |
| Staff | Level 1+ | Level 3+ | Level 3+ |
| Transactions | Level 3+ | Level 3+ | Level 4 |
| Roles/Permissions | Level 4 | Level 4 | Level 4 |
| Packages (catalog) | All auth | Level 3+ | Level 3+ |
| Schedule | Level 1+ | Level 2+ | Level 3+ |
| Feature Flags | Level 4 | Level 4 | Level 4 |

### 6.3 Security Strengths
- Financial data (transactions, billing) ต้องการ Level 3+
- Append-only policies บน audit tables (ไม่สามารถ UPDATE/DELETE)
- Auto-logout เมื่อ staff status เป็น inactive
- QR token sanitization ป้องกัน injection attacks
- Service role isolation สำหรับ sensitive operations
- Idempotency keys ป้องกัน duplicate financial transactions

---

## 7. ประเมินจุดแข็ง

### 7.1 Architecture
- **Clean separation of concerns:** Hooks สำหรับ data, Components สำหรับ UI, Contexts สำหรับ global state
- **Type safety:** TypeScript ตลอดทั้ง stack + auto-generated Supabase types
- **Performance:** Parallel queries (`Promise.all`), batch operations, debounced search, proper caching (5-15 min stale time)
- **Real-time:** Supabase Realtime subscriptions สำหรับ live updates

### 7.2 Business Logic
- **Comprehensive member lifecycle:** Lead -> Member -> Active -> Suspended -> Inactive ครบวงจร
- **Sophisticated analytics:** Engagement scoring, churn prediction, business health score, revenue forecasting
- **Multi-channel integration:** LINE LIFF, QR Code, Stripe payments
- **Bilingual support:** EN/TH ทั้ง UI และ database fields (name_en/name_th)

### 7.3 Security
- **Fine-grained RBAC:** 4-tier system + granular permissions per resource/action
- **Idempotency:** ป้องกัน duplicate financial transactions
- **Audit trail:** Activity log บันทึกทุก state change (old_value/new_value JSONB)
- **Append-only ledgers:** Tamper-proof financial records (`package_usage_ledger`)

### 7.4 Developer Experience
- **Command Palette (Cmd+K):** Quick navigation สำหรับ power users
- **Feature Flags:** Safe gradual rollout (global/location/user scope)
- **CSV Import/Export:** ทุก module รองรับ data portability
- **Diagnostics page:** Data audit สำหรับ debugging (master-only)
- **i18n ready:** ไม่ต้อง refactor เพิ่มภาษา

### 7.5 Thai Market Fit
- Thai VAT 7% calculation built-in
- Bangkok timezone handling (`getBangkokDayRange`)
- LINE integration (ผู้ใช้ LINE ในไทย 50M+)
- PromptPay/Bank Transfer payment methods
- Thai language throughout

---

## 8. ประเมินจุดอ่อน & Technical Debt

### 8.1 Mock Data in Reports (Critical)
- `useReports` hooks ใช้ `Math.random()` สร้าง mock data แทน real database queries
- ทุก report (Active Members, Class Capacity, Package Sales) เป็น placeholder
- **Impact:** Reports ไม่สามารถใช้งานจริงได้ - ต้อง implement database queries

### 8.2 AI Service is Stub
- `aiService.ts` เป็น stub service - ยังไม่มี real AI implementation
- AI actions layer มี Zod validation พร้อม แต่ service ยังเป็น placeholder
- `daily-briefing` Edge Function ใช้ Lovable AI Gateway (external dependency)

### 8.3 LINE LIFF Apps (Coming Soon)
- Trainer App ทุก tab เป็น "Coming Soon" placeholder
- Member App มี basic structure แต่ booking/packages ยังไม่ทำงาน
- ขาด LINE push notification implementation จริง (มีแค่ log table)

### 8.4 Client-Side Heavy Computation
- Engagement scores, churn prediction, business health คำนวณ client-side
- สำหรับยิมขนาดเล็ก-กลาง (< 5,000 members) OK
- **จะเป็นปัญหาเมื่อมีสมาชิก 10,000+ คน** - ควรย้ายไป database views / Edge Functions

### 8.5 Missing Features
- **No email integration:** ไม่มี email notification system
- **No SMS integration:** ไม่มี SMS alerts
- **No offline support:** ต้องมี internet เสมอ
- **No mobile native app:** มีแค่ LIFF (LINE mini-app)
- **No automated billing/recurring:** ไม่มีระบบเก็บเงินอัตโนมัติ (Stripe Subscriptions)
- **P&L expenses are mock data:** ยังไม่มี expense tracking จริง

### 8.6 Scalability Concerns
- Client-side aggregation จะช้าเมื่อข้อมูลมาก
- ไม่มี database indexing strategy ที่ชัดเจน (missing composite indexes)
- Transfer slip approval เป็น multi-step ที่ไม่ atomic (ไม่อยู่ใน database transaction)
- `auto-notifications` batch limit 500 อาจไม่พอสำหรับยิมใหญ่
- Offset-based pagination ไม่ efficient สำหรับข้อมูลมาก

### 8.7 Testing Coverage
- มี Vitest setup แต่ไม่พบ test files จำนวนมาก
- ไม่มี E2E testing framework (Playwright/Cypress)
- Missing integration tests สำหรับ Edge Functions

---

## 9. System Suggestion & Roadmap

### 9.1 เร่งด่วน (High Priority - ควรทำก่อน Production)

#### A. Implement Real Report Queries
แทน mock data ด้วย real Supabase queries:
- สร้าง database views สำหรับ report aggregation
- ใช้ materialized views สำหรับ heavy computation
- เพิ่ม date range filtering ที่ database level
- **Estimated effort:** 2-3 weeks

#### B. Move Heavy Computation to Backend
สร้าง scheduled Edge Functions สำหรับ:
- Engagement score calculation -> เก็บใน members table
- Churn prediction -> เก็บใน members table (risk_level field มีแล้ว)
- Business health -> เก็บใน settings/metrics table
- Run ทุก 1-6 ชั่วโมง แทนการคำนวณ real-time ทุก page load
- **Estimated effort:** 1-2 weeks

#### C. Database Transaction Safety
- Wrap `approve-slip` multi-step operations ใน database transaction
- เพิ่ม composite indexes: `(member_id, created_at)`, `(schedule_id, status)`, `(location_id, scheduled_date)`
- **Estimated effort:** 3-5 days

#### D. Testing
- เพิ่ม unit tests สำหรับ business logic (engagement score, churn prediction, VAT calculation)
- เพิ่ม integration tests สำหรับ Edge Functions
- **Estimated effort:** 1-2 weeks

### 9.2 ระยะกลาง (Medium Priority - Post-Launch)

#### E. Complete LINE LIFF Integration
- Implement member booking flow ใน LIFF
- Implement trainer schedule/attendance ใน LIFF
- เพิ่ม LINE push notifications จริง (ไม่ใช่แค่ log)
- Implement Rich Menu integration
- **Estimated effort:** 3-4 weeks

#### F. Automated Billing
- Implement recurring payment via Stripe Subscriptions
- Auto-renew packages ที่ใกล้หมด
- Payment reminder notifications (3 days, 1 day before expiry)
- Failed payment retry logic
- **Estimated effort:** 2-3 weeks

#### G. Notification System Overhaul
- Implement multi-channel: LINE Push + In-App + Email
- Notification preferences per member
- Template system สำหรับ notification content
- Delivery tracking + retry mechanism
- **Estimated effort:** 2-3 weeks

#### H. Real Expense Tracking
- Implement expense CRUD (categories, recurring, one-time)
- Receipt/document upload (Supabase Storage)
- P&L report with real data
- Budget vs actual comparison
- **Estimated effort:** 2 weeks

### 9.3 ระยะยาว (Long-term Vision)

#### I. Real AI Integration
แทน stub service ด้วย real ML models:
- Member churn prediction model (trained on historical data)
- Optimal class scheduling recommendation
- Dynamic pricing suggestions
- Member engagement optimization
- ใช้ Supabase pg_vector สำหรับ embedding-based recommendations

#### J. Mobile App (React Native / Expo)
- Native app สำหรับ member self-service
- Push notifications (FCM/APNs)
- Offline check-in capability
- Biometric authentication

#### K. Multi-Tenant Architecture (SaaS)
- ปัจจุบัน single-tenant (1 gym chain per deployment)
- เพิ่ม tenant isolation layer
- Per-tenant feature flags, branding, pricing
- Shared infrastructure with isolated data

#### L. Advanced Analytics
- Data warehouse integration (BigQuery / Snowflake)
- Custom report builder (drag & drop)
- Cohort analysis
- Predictive analytics dashboard
- A/B testing framework สำหรับ promotions

### 9.4 Recommended Architecture Evolution

```
Current (Good for < 5,000 members):
  React SPA -> Supabase (DB + Auth + Edge Functions)

Scale-up (5,000-50,000 members):
  React SPA -> Supabase (DB + Auth + Realtime)
             -> Dedicated API layer (Express/Fastify on Cloud Run)
             -> Background jobs (Cloud Scheduler + Cloud Functions)
             -> Redis cache (dashboard stats, engagement scores)
             -> CDN for static assets

Enterprise (50,000+ members):
  React SPA -> API Gateway (Kong/Envoy)
             -> Microservices (User, Billing, Scheduling, Notification)
             -> Event bus (Pub/Sub / Kafka)
             -> Read replicas + materialized views
             -> ML pipeline (Vertex AI / SageMaker)
             -> Mobile apps (React Native)
```

---

## สรุป (Summary)

MOOM เป็นระบบ Gym Management ที่ **ครอบคลุมและออกแบบมาดี** สำหรับธุรกิจฟิตเนสในไทย

### What It Does Well:
1. **Comprehensive feature set** - ครอบคลุมทุก workflow: lead -> member -> billing -> analytics
2. **Thai market fit** - LINE, Thai VAT 7%, bilingual EN/TH, Bangkok timezone, PromptPay
3. **Smart analytics** - Engagement scoring, churn prediction, business health, revenue forecast
4. **Strong security** - 4-tier RBAC, RLS on 27 tables, audit trail, idempotent payments
5. **Clean architecture** - TypeScript end-to-end, React Query caching, clean hook patterns

### What Needs Work Before Production:
1. **Reports** - แทน mock data ด้วย real database queries
2. **LINE LIFF** - Complete member/trainer app features
3. **Backend computation** - ย้าย heavy calculation ออกจาก client
4. **Database optimization** - Indexes, transactions, cursor-based pagination
5. **Testing** - Unit + integration + E2E tests

### Overall Assessment: **7.5/10**
โครงสร้างดีมาก มี features ครบถ้วนสำหรับ gym management ในไทย แต่ยังมี placeholder/mock data ใน features สำคัญ (Reports, AI, LIFF) ที่ต้อง implement ก่อนใช้งาน production จริง ระบบพร้อมรองรับ scale-up ด้วย architecture ที่ดี แต่ต้อง optimize performance สำหรับข้อมูลจำนวนมาก
