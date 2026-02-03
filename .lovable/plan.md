
# Coming Soon Features + MOOM CLUB v0.0.2 Development Plan

## Executive Summary

ระบบปัจจุบันมีโครงสร้างที่แข็งแรง (Console Admin ครบ 24+ หน้า) - พร้อมสำหรับ Phase ต่อไป

**แผนงาน:**
1. สร้าง "Coming Soon" page แสดง roadmap สำหรับ development
2. วาง database foundation สำหรับ LINE integration
3. เริ่ม implement LINE LIFF Shell

---

## 1. Coming Soon Page Design

### A. หน้า Coming Soon ที่ควรสร้าง

| Route | Feature | Phase |
|-------|---------|-------|
| `/coming-soon` | Main roadmap page | - |
| `/member-app` | Member LIFF Preview | v0.0.2 |
| `/trainer-app` | Trainer LIFF Preview | v0.0.2 |

### B. Layout Design

```text
┌─────────────────────────────────────────────────────────────────┐
│ MOOM CLUB Roadmap                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [v0.0.1 ✅] [v0.0.2 🚧] [v0.0.3 📋] [v0.1.0 📋]                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ v0.0.2 - LINE Shell + Mobile MVP                                │
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│ │ 📱 Member App   │  │ 💪 Trainer App  │  │ 🔔 Notifications│  │
│ │ • จองคลาส       │  │ • ตารางวันนี้   │  │ • LINE Push     │  │
│ │ • แพ็กเกจของฉัน │  │ • เช็คชื่อ      │  │ • In-app alerts │  │
│ │ • เช็คอิน QR    │  │ • PT log        │  │ • Rich menu     │  │
│ │ Coming Soon...  │  │ Coming Soon...  │  │ Coming Soon...  │  │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ v0.0.3 - Payments & Check-in "ของจริง"                          │
│                                                                 │
│ • PromptPay / โอน + slip upload + review flow                   │
│ • QR check-in + usage ledger + anti-replay                      │
│ • Transfer slips workflow integrate finance console             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ v0.1.0 - Retention Engine                                       │
│                                                                 │
│ • Members at risk ทำงานจริง + one-tap contact                   │
│ • Campaign ผ่าน LINE (renew/winback/birthday)                   │
│ • CRM timeline (เหตุการณ์ของสมาชิกย้อนหลัง)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Extensions (สำหรับ LINE Integration)

### A. Tables ที่ต้องเพิ่ม

```sql
-- 1. LINE User Identity Mapping
CREATE TABLE line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  line_user_id TEXT UNIQUE NOT NULL,
  line_display_name TEXT,
  line_picture_url TEXT,
  linked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Class Bookings (สำหรับ Member App)
CREATE TABLE class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_package_id UUID REFERENCES member_packages(id),
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'attended', 'no_show')),
  booked_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, member_id)
);

-- 3. Waitlist
CREATE TABLE class_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'promoted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  promoted_at TIMESTAMPTZ,
  UNIQUE(schedule_id, member_id)
);

-- 4. Package Usage Ledger (กันโกง + audit)
CREATE TABLE package_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_package_id UUID NOT NULL REFERENCES member_packages(id),
  usage_type TEXT NOT NULL CHECK (usage_type IN ('checkin', 'booking', 'pt_session', 'adjustment')),
  reference_id UUID, -- booking_id, attendance_id, etc.
  delta_sessions INT NOT NULL, -- negative = used, positive = refund/adjustment
  balance_after INT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Event Outbox (สำหรับ notifications/LINE push)
CREATE TABLE event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  retry_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- 6. LINE Message Log
CREATE TABLE line_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  template_key TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Check-in QR Tokens (anti-fraud)
CREATE TABLE checkin_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Feature Flags (rollout control)
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'location', 'user')),
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Feature Flag Assignments (per location/user)
CREATE TABLE feature_flag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (location_id IS NOT NULL OR user_id IS NOT NULL)
);
```

### B. RLS Policies

```sql
-- line_users: User can read their own
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own LINE link" ON line_users
  FOR SELECT USING (user_id = auth.uid() OR has_min_access_level(auth.uid(), 'level_2_operator'));

-- class_bookings: Members see own, staff see all
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see own bookings" ON class_bookings
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE id = member_id) 
    OR has_min_access_level(auth.uid(), 'level_1_minimum')
  );

-- package_usage_ledger: Staff only
ALTER TABLE package_usage_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view usage" ON package_usage_ledger
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_2_operator'));
```

---

## 3. Files to Create/Modify

### A. New Files

| File | Purpose |
|------|---------|
| `src/pages/ComingSoon.tsx` | Main roadmap page |
| `src/pages/MemberAppPreview.tsx` | Member LIFF preview/coming soon |
| `src/pages/TrainerAppPreview.tsx` | Trainer LIFF preview/coming soon |
| `src/components/roadmap/RoadmapCard.tsx` | Reusable roadmap phase card |
| `src/components/roadmap/FeatureCard.tsx` | Feature preview card with status |
| `src/components/roadmap/VersionBadge.tsx` | Version status badge |
| `src/hooks/useFeatureFlags.ts` | Feature flag management |
| `src/hooks/useLineAuth.ts` | LINE authentication (placeholder) |
| `src/hooks/useClassBookings.ts` | Booking management |

### B. Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add new routes |
| `src/components/layout/Sidebar.tsx` | Add Coming Soon menu item |
| `src/i18n/locales/en.ts` | Add roadmap translations |
| `src/i18n/locales/th.ts` | Add roadmap translations |

---

## 4. i18n Keys to Add

```typescript
roadmap: {
  title: 'แผนพัฒนา',
  comingSoon: 'เร็วๆ นี้',
  inProgress: 'กำลังพัฒนา',
  completed: 'เสร็จสิ้น',
  planned: 'วางแผนไว้',
  
  // Versions
  v001: {
    title: 'v0.0.1 - Console Foundation',
    description: '24+ หน้าจัดการครบถ้วน CRUD, RBAC, i18n',
    status: 'completed',
  },
  v002: {
    title: 'v0.0.2 - LINE Shell + Mobile MVP',
    description: 'LIFF login, Member/Trainer apps, LINE notifications',
    status: 'inProgress',
  },
  v003: {
    title: 'v0.0.3 - Payments & Check-in',
    description: 'PromptPay, QR check-in, usage ledger, anti-fraud',
    status: 'planned',
  },
  v010: {
    title: 'v0.1.0 - Retention Engine',
    description: 'Risk automation, LINE campaigns, CRM timeline',
    status: 'planned',
  },
  
  // Features
  memberApp: {
    title: 'Member App',
    description: 'แอปสำหรับสมาชิกใช้งานผ่าน LINE',
    features: [
      'จองคลาส / ยกเลิกการจอง',
      'ดูแพ็กเกจของฉัน',
      'เช็คอินด้วย QR Code',
      'ชำระเงิน / อัปโหลดสลิป',
      'เซ็นสัญญาออนไลน์',
    ],
  },
  trainerApp: {
    title: 'Trainer App',
    description: 'แอปสำหรับเทรนเนอร์ใช้งานผ่าน LINE',
    features: [
      'ตารางคลาสวันนี้',
      'เช็คชื่อผู้เข้าเรียน',
      'บันทึก PT session',
      'ดูข้อมูลสมาชิกแบบด่วน',
      'รายงานผู้ไม่มาเรียน',
    ],
  },
  notifications: {
    title: 'การแจ้งเตือน',
    description: 'ระบบแจ้งเตือนผ่าน LINE และ In-app',
    features: [
      'แจ้งเตือนการจองสำเร็จ',
      'เตือนก่อนคลาสเริ่ม',
      'แจ้งเตือนแพ็กเกจใกล้หมด',
      'ข่าวสารและโปรโมชัน',
    ],
  },
},

// LINE Integration
line: {
  connected: 'เชื่อมต่อ LINE แล้ว',
  notConnected: 'ยังไม่ได้เชื่อมต่อ LINE',
  connect: 'เชื่อมต่อ LINE',
  disconnect: 'ยกเลิกการเชื่อมต่อ',
  richMenu: 'Rich Menu',
  liffApp: 'LIFF App',
},

// Booking
booking: {
  title: 'การจอง',
  book: 'จอง',
  cancel: 'ยกเลิกการจอง',
  booked: 'จองแล้ว',
  cancelled: 'ยกเลิกแล้ว',
  attended: 'เข้าเรียนแล้ว',
  noShow: 'ไม่มาเรียน',
  waitlist: 'รายชื่อรอ',
  joinWaitlist: 'เข้ารายชื่อรอ',
  leaveWaitlist: 'ออกจากรายชื่อรอ',
  position: 'ลำดับที่',
  classFull: 'คลาสเต็มแล้ว',
  confirmCancel: 'ยืนยันยกเลิกการจอง?',
},

// Check-in QR
qrCheckin: {
  title: 'เช็คอิน QR',
  generate: 'สร้าง QR Code',
  scan: 'สแกน QR',
  expires: 'หมดอายุใน',
  expired: 'QR หมดอายุ',
  used: 'QR ถูกใช้แล้ว',
  invalid: 'QR ไม่ถูกต้อง',
  success: 'เช็คอินสำเร็จ!',
},

// Feature Flags
featureFlag: {
  title: 'Feature Flags',
  enabled: 'เปิดใช้งาน',
  disabled: 'ปิดใช้งาน',
  global: 'ทั้งระบบ',
  perLocation: 'ตามสาขา',
  perUser: 'ตามผู้ใช้',
},
```

---

## 5. Coming Soon Page Component

### A. RoadmapCard Component

```typescript
interface RoadmapVersion {
  version: string;
  title: string;
  description: string;
  status: 'completed' | 'inProgress' | 'planned';
  progress?: number;
  features: {
    name: string;
    description: string;
    icon: LucideIcon;
    status: 'done' | 'inProgress' | 'planned';
    href?: string;
  }[];
}

// Status colors
const statusColors = {
  completed: 'bg-green-500',
  inProgress: 'bg-primary',
  planned: 'bg-muted',
};
```

### B. Mobile App Preview Cards

```typescript
// Show mock mobile screens with "Coming Soon" overlay
// Allow navigation to feature preview pages

interface AppPreviewProps {
  title: string;
  description: string;
  features: string[];
  mockScreens: string[]; // Placeholder images
  estimatedRelease: string;
}
```

---

## 6. Navigation Updates

### A. Sidebar Addition

```typescript
// Add to navItems in Sidebar.tsx
{ 
  label: t('nav.comingSoon'), 
  path: '/coming-soon', 
  icon: Rocket, 
  badge: 'v0.0.2' // Show current version being worked on
},
```

### B. Routes to Add

```typescript
// In App.tsx
<Route path="coming-soon" element={<ComingSoon />} />
<Route path="member-app" element={<MemberAppPreview />} />
<Route path="trainer-app" element={<TrainerAppPreview />} />
```

---

## 7. Implementation Order

### Phase 1: Coming Soon Page (Today)
1. Create `ComingSoon.tsx` with roadmap visualization
2. Create `RoadmapCard.tsx` component
3. Create `FeatureCard.tsx` component  
4. Add i18n translations
5. Add routes and sidebar item
6. Create placeholder preview pages for Member/Trainer apps

### Phase 2: Database Foundation (Next)
1. Create database migration with new tables
2. Add RLS policies
3. Create hooks for new tables
4. Add feature flags system

### Phase 3: LINE Integration Shell (After DB)
1. Create LINE auth edge function
2. Create LIFF login flow
3. Create basic Member App shell
4. Create basic Trainer App shell

---

## 8. UI/UX Design Guidelines

### A. Coming Soon Page Style

- **Hero Section**: Large version badge + progress indicator
- **Timeline View**: Horizontal scrolling version cards
- **Feature Cards**: 3-column grid with icons + descriptions
- **Status Indicators**: Checkmark (done), Spinner (in progress), Clock (planned)
- **Mobile**: Single column, collapsible sections

### B. Color Scheme

| Status | Badge Color | Card Border |
|--------|-------------|-------------|
| Completed | `bg-green-500 text-white` | `border-green-500` |
| In Progress | `bg-primary text-white` | `border-primary` |
| Planned | `bg-muted text-muted-foreground` | `border-border` |

### C. Animations

- Fade-in on scroll for feature cards
- Subtle pulse on "In Progress" badges
- Hover lift effect on clickable cards

---

## 9. Files Summary

### Create (9 files)

| File | Lines (est.) |
|------|-------------|
| `src/pages/ComingSoon.tsx` | 250 |
| `src/pages/MemberAppPreview.tsx` | 150 |
| `src/pages/TrainerAppPreview.tsx` | 150 |
| `src/components/roadmap/RoadmapCard.tsx` | 80 |
| `src/components/roadmap/FeatureCard.tsx` | 60 |
| `src/components/roadmap/VersionBadge.tsx` | 40 |
| `src/components/roadmap/index.ts` | 5 |
| `src/hooks/useFeatureFlags.ts` | 50 |
| `src/hooks/useClassBookings.ts` | 80 |

### Modify (4 files)

| File | Changes |
|------|---------|
| `src/App.tsx` | +3 routes |
| `src/components/layout/Sidebar.tsx` | +1 nav item |
| `src/i18n/locales/en.ts` | +100 keys |
| `src/i18n/locales/th.ts` | +100 keys |

---

## 10. Success Criteria

1. **Coming Soon Page**
   - แสดง roadmap ครบ 4 versions
   - Feature cards พร้อม status indicators
   - Mobile responsive
   - i18n EN/TH

2. **App Preview Pages**
   - Mock screens แสดง UI ที่จะมี
   - Feature list ครบถ้วน
   - "Notify me" button (placeholder)

3. **Foundation Ready**
   - Database tables พร้อมสำหรับ LINE integration
   - Feature flags system ใช้งานได้
   - Hooks structure พร้อมสำหรับ development

---

## 11. Technical Notes

### A. LINE LIFF Preparation

```typescript
// Future: LIFF Config structure
interface LIFFConfig {
  liffId: string;
  endpoint: string;
  scope: string[];
  botPrompt: 'normal' | 'aggressive' | 'none';
}

// Future: Rich Menu structure  
interface RichMenuConfig {
  memberId: string;
  trainerId: string;
  areas: RichMenuArea[];
}
```

### B. Event Types for Outbox

```typescript
type EventType =
  | 'booking.created'
  | 'booking.cancelled'
  | 'booking.reminder'
  | 'checkin.completed'
  | 'package.expiring'
  | 'package.expired'
  | 'payment.received'
  | 'payment.slip_uploaded'
  | 'member.birthday'
  | 'waitlist.promoted';
```

### C. QR Token Format

```typescript
interface QRPayload {
  m: string;  // member_id (short key for size)
  l: string;  // location_id
  t: number;  // timestamp
  n: string;  // nonce
  s: string;  // signature (HMAC)
}
```

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| Coming Soon page + components | 2-3 hours |
| i18n translations | 30 min |
| Database migration | 1 hour |
| App preview pages | 1 hour |
| Testing + polish | 1 hour |
| **Total** | ~6 hours |

