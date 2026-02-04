
# Phase 2: Database Foundation + Hooks Implementation

## Overview

ขั้นตอนต่อไปตาม roadmap คือ **Phase 2: Database Foundation** เพื่อวางโครงสร้างฐานข้อมูลสำหรับ LINE Integration และ Mobile App features

---

## 1. Database Migration

### A. New Tables (9 tables)

```text
┌─────────────────────────────────────────────────────────────────┐
│ LINE Integration Tables                                          │
├─────────────────────────────────────────────────────────────────┤
│ • line_users          - LINE identity mapping                    │
│ • line_message_log    - LINE push message tracking               │
├─────────────────────────────────────────────────────────────────┤
│ Booking & Attendance Tables                                      │
├─────────────────────────────────────────────────────────────────┤
│ • class_bookings      - Member class reservations                │
│ • class_waitlist      - Waitlist queue management                │
│ • package_usage_ledger- Usage tracking (anti-fraud)              │
│ • checkin_qr_tokens   - QR code tokens for check-in              │
├─────────────────────────────────────────────────────────────────┤
│ Event & Feature System                                           │
├─────────────────────────────────────────────────────────────────┤
│ • event_outbox        - Event-driven notifications               │
│ • feature_flags       - Feature toggle configuration             │
│ • feature_flag_assignments - Per-location/user overrides         │
└─────────────────────────────────────────────────────────────────┘
```

### B. New Enums

| Enum | Values |
|------|--------|
| `booking_status` | booked, cancelled, attended, no_show |
| `waitlist_status` | waiting, promoted, expired, cancelled |
| `usage_type_ledger` | checkin, booking, pt_session, adjustment |
| `event_status` | pending, processing, done, failed |
| `message_status` | pending, sent, failed |
| `flag_scope` | global, location, user |

---

## 2. SQL Migration Details

### A. line_users Table

```sql
CREATE TABLE line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  line_user_id TEXT UNIQUE NOT NULL,
  line_display_name TEXT,
  line_picture_url TEXT,
  line_id_token TEXT,
  linked_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### B. class_bookings Table

```sql
CREATE TYPE booking_status AS ENUM ('booked', 'cancelled', 'attended', 'no_show');

CREATE TABLE class_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_package_id UUID REFERENCES member_packages(id),
  status booking_status DEFAULT 'booked',
  booked_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, member_id)
);
```

### C. class_waitlist Table

```sql
CREATE TYPE waitlist_status AS ENUM ('waiting', 'promoted', 'expired', 'cancelled');

CREATE TABLE class_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INT NOT NULL,
  status waitlist_status DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT now(),
  promoted_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  UNIQUE(schedule_id, member_id)
);
```

### D. package_usage_ledger Table

```sql
CREATE TYPE usage_type_ledger AS ENUM ('checkin', 'booking', 'pt_session', 'adjustment');

CREATE TABLE package_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_package_id UUID NOT NULL REFERENCES member_packages(id) ON DELETE CASCADE,
  usage_type usage_type_ledger NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  delta_sessions INT NOT NULL,
  balance_after INT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### E. event_outbox Table

```sql
CREATE TYPE event_status AS ENUM ('pending', 'processing', 'done', 'failed');

CREATE TABLE event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status event_status DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_event_outbox_status ON event_outbox(status, scheduled_for);
```

### F. line_message_log Table

```sql
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE line_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL,
  template_key TEXT,
  payload JSONB DEFAULT '{}',
  status message_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_line_message_log_user ON line_message_log(line_user_id, created_at);
```

### G. checkin_qr_tokens Table

```sql
CREATE TABLE checkin_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  token_type TEXT DEFAULT 'checkin',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qr_tokens_member ON checkin_qr_tokens(member_id, expires_at);
CREATE INDEX idx_qr_tokens_token ON checkin_qr_tokens(token) WHERE used_at IS NULL;
```

### H. feature_flags Tables

```sql
CREATE TYPE flag_scope AS ENUM ('global', 'location', 'user');

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scope flag_scope DEFAULT 'global',
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE feature_flag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (location_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_flag_assignments_lookup ON feature_flag_assignments(flag_id, location_id, user_id);
```

---

## 3. RLS Policies

### A. line_users

```sql
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own LINE link" ON line_users
  FOR SELECT USING (user_id = auth.uid() OR has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Users can insert own LINE link" ON line_users
  FOR INSERT WITH CHECK (user_id = auth.uid() OR has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "Operators can manage LINE users" ON line_users
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_2_operator'));
```

### B. class_bookings

```sql
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all bookings" ON class_bookings
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Operators can manage bookings" ON class_bookings
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_2_operator'));
```

### C. package_usage_ledger

```sql
ALTER TABLE package_usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read usage ledger" ON package_usage_ledger
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_1_minimum'));

CREATE POLICY "Operators can insert usage" ON package_usage_ledger
  FOR INSERT WITH CHECK (has_min_access_level(auth.uid(), 'level_2_operator'));
```

### D. event_outbox

```sql
ALTER TABLE event_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can read events" ON event_outbox
  FOR SELECT USING (has_min_access_level(auth.uid(), 'level_2_operator'));

CREATE POLICY "System can manage events" ON event_outbox
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));
```

### E. feature_flags

```sql
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can read feature flags" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage feature flags" ON feature_flags
  FOR ALL USING (has_min_access_level(auth.uid(), 'level_3_manager'));
```

---

## 4. Files to Create

### A. Hooks (5 files)

| File | Purpose |
|------|---------|
| `src/hooks/useClassBookings.ts` | Booking CRUD + waitlist management |
| `src/hooks/useFeatureFlags.ts` | Feature flag queries + toggles |
| `src/hooks/useLineUsers.ts` | LINE user identity management |
| `src/hooks/usePackageUsage.ts` | Usage ledger queries |
| `src/hooks/useCheckinQR.ts` | QR token generation + validation |

### B. Hook Details

```typescript
// useClassBookings.ts
export const useClassBookings = (scheduleId?: string) => { ... }
export const useMemberBookings = (memberId: string) => { ... }
export const useCreateBooking = () => { ... }
export const useCancelBooking = () => { ... }
export const useMarkAttendance = () => { ... }
export const useWaitlist = (scheduleId: string) => { ... }
export const useJoinWaitlist = () => { ... }
export const useLeaveWaitlist = () => { ... }

// useFeatureFlags.ts
export const useFeatureFlags = () => { ... }
export const useFeatureFlag = (key: string) => { ... }
export const useIsFeatureEnabled = (key: string, locationId?: string) => { ... }
export const useToggleFeatureFlag = () => { ... }
export const useCreateFeatureFlag = () => { ... }

// useLineUsers.ts
export const useLineUser = (lineUserId: string) => { ... }
export const useMemberLineLink = (memberId: string) => { ... }
export const useLinkLineAccount = () => { ... }
export const useUnlinkLineAccount = () => { ... }

// usePackageUsage.ts
export const usePackageUsageHistory = (memberPackageId: string) => { ... }
export const useRecordUsage = () => { ... }
export const useRefundUsage = () => { ... }

// useCheckinQR.ts
export const useGenerateQRToken = () => { ... }
export const useValidateQRToken = () => { ... }
export const useActiveQRToken = (memberId: string) => { ... }
```

---

## 5. Seed Data for Feature Flags

```sql
INSERT INTO feature_flags (key, name, description, scope, enabled) VALUES
  ('line_login', 'LINE Login', 'Enable LINE LIFF login for members', 'global', false),
  ('class_booking', 'Class Booking', 'Allow members to book classes via app', 'global', false),
  ('qr_checkin', 'QR Check-in', 'Enable QR code check-in', 'global', false),
  ('waitlist', 'Waitlist', 'Enable class waitlist feature', 'global', false),
  ('member_app', 'Member App', 'Enable Member LIFF App', 'global', false),
  ('trainer_app', 'Trainer App', 'Enable Trainer LIFF App', 'global', false),
  ('line_notifications', 'LINE Notifications', 'Send notifications via LINE', 'global', false),
  ('contract_esign', 'Contract E-Sign', 'Enable digital contract signing', 'global', false),
  ('payment_slip_upload', 'Payment Slip Upload', 'Allow slip upload for payment', 'global', false);
```

---

## 6. i18n Keys to Add

```typescript
// เพิ่มใน locales
featureFlags: {
  title: 'Feature Flags',
  description: 'ควบคุมการเปิด/ปิดฟีเจอร์ในระบบ',
  enabled: 'เปิดใช้งาน',
  disabled: 'ปิดใช้งาน',
  global: 'ทั้งระบบ',
  perLocation: 'ตามสาขา',
  perUser: 'ตามผู้ใช้',
  flags: {
    line_login: 'LINE Login',
    class_booking: 'การจองคลาส',
    qr_checkin: 'QR Check-in',
    waitlist: 'รายชื่อรอ',
    member_app: 'Member App',
    trainer_app: 'Trainer App',
    line_notifications: 'LINE Notifications',
    contract_esign: 'เซ็นสัญญาออนไลน์',
    payment_slip_upload: 'อัปโหลดสลิป',
  },
},

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
  bookingSuccess: 'จองสำเร็จ!',
  cancelSuccess: 'ยกเลิกการจองแล้ว',
  waitlistSuccess: 'เข้ารายชื่อรอแล้ว',
},

packageUsage: {
  title: 'ประวัติการใช้งาน',
  type: 'ประเภท',
  sessions: 'จำนวน',
  balance: 'คงเหลือ',
  checkin: 'เช็คอิน',
  booking: 'จองคลาส',
  ptSession: 'PT Session',
  adjustment: 'ปรับยอด',
  refund: 'คืน session',
},
```

---

## 7. Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Create database migration | SQL migration file |
| 2 | Create useFeatureFlags hook | `src/hooks/useFeatureFlags.ts` |
| 3 | Create useClassBookings hook | `src/hooks/useClassBookings.ts` |
| 4 | Create usePackageUsage hook | `src/hooks/usePackageUsage.ts` |
| 5 | Create useCheckinQR hook | `src/hooks/useCheckinQR.ts` |
| 6 | Create useLineUsers hook | `src/hooks/useLineUsers.ts` |
| 7 | Add i18n translations | `en.ts`, `th.ts` |
| 8 | Update types (auto-generated) | - |

---

## 8. Success Criteria

1. **Database**
   - 9 new tables created with proper constraints
   - All RLS policies in place
   - Indexes for performance
   - Seed data for feature flags

2. **Hooks**
   - All CRUD operations working
   - Proper error handling
   - Query invalidation on mutations
   - TypeScript types from generated schema

3. **Feature Flags**
   - Can toggle flags via hook
   - Location/user overrides work
   - Real-time flag checking

---

## 9. Estimated Timeline

| Task | Duration |
|------|----------|
| Database migration | 30 min |
| useFeatureFlags hook | 30 min |
| useClassBookings hook | 45 min |
| usePackageUsage hook | 20 min |
| useCheckinQR hook | 20 min |
| useLineUsers hook | 20 min |
| i18n updates | 15 min |
| Testing | 30 min |
| **Total** | ~3.5 hours |

---

## 10. Notes

### A. Security Considerations
- QR tokens are short-lived (30-120 seconds)
- Usage ledger is append-only (no delete/update)
- LINE tokens should be stored securely

### B. Future Integration Points
- Event outbox will be processed by Edge Functions
- LINE message log connects to LINE Messaging API
- Feature flags control rollout to locations

### C. Backward Compatibility
- Existing `member_attendance` table remains
- New `class_bookings` works alongside current system
- Gradual migration path planned
