

# UX/UI Audit ทุกหน้า — ปัญหาจริงที่พบ + แผนแก้ไข

## การตรวจสอบที่ทำแล้ว

อ่านทุก surface page: Member (Home, Schedule, Bookings, Check-In, Rewards, Coupons, Profile, Edit Profile, Security, Notifications, Packages), Trainer (Home, Schedule, Roster, Workouts, Profile, Header), Staff (Home, Check-in, Members, Payments, Profile), Admin (Dashboard, Lobby, Leads, Schedule, Finance, Members), Shared (Layouts, Components, Bottom Nav)

---

## ปัญหาจริงที่พบ (Verified, Prioritized)

### 🔴 BUG: StaffProfilePage — Admin Portal ไม่แสดงสำหรับ trainer/front_desk
**ไฟล์:** `src/apps/staff/pages/StaffProfilePage.tsx` line 14
```typescript
const ADMIN_CAPABLE_ROLES: AppRole[] = ['owner', 'admin'];  // ← ขาด trainer, freelance_trainer, front_desk
```
TrainerProfilePage แก้แล้ว แต่ StaffProfilePage ยังเป็น list เดิม → Staff ที่มี role เป็น `trainer` หรือ `front_desk` จะไม่เห็นปุ่ม Admin Portal

### 🔴 BUG: MemberProfilePage — Admin Portal ใช้ hardcoded URL
**ไฟล์:** `src/apps/member/pages/MemberProfilePage.tsx` line 154
```typescript
href={isDevEnvironment() ? '/?surface=admin' : 'https://admin.moom.fit'}
```
ไม่ใช้ `buildSessionTransferUrl` เหมือน Trainer/Staff → session อาจหลุดเมื่อ switch surface, ไม่ consistent

### 🟡 UX: TrainerProfilePage — Coming Soon items ใช้ opacity+pointer-events แทน visual cue
3 items (Notifications, Preferences, Help) ถูก disabled ด้วย `opacity-60 pointer-events-none` แต่ไม่มี subtitle "เร็วๆ นี้" ใน StaffProfilePage (ใช้ wrapper div ซ้อนอีกชั้น) → inconsistent pattern

### 🟡 UX: Trainer/Staff Profile — ไม่มี language/theme toggle
TrainerHeader มี language + dark mode toggle ใน dropdown → แต่ TrainerProfilePage ไม่มี → user ต้องไปกดที่ header
StaffLayout ไม่มี header เลย → **Staff ไม่สามารถเปลี่ยนภาษาหรือ theme ได้**

### 🟡 UX: StaffHomePage — "ดูตาราง" (View Schedule) นำไปหน้า Admin `/calendar`
**ไฟล์:** `src/apps/staff/pages/StaffHomePage.tsx` line 116
```typescript
onClick={() => navigate('/calendar')}
```
Staff surface อยู่ที่ `/staff/*` แต่ `/calendar` เป็น Admin route → ถ้า Staff ไม่มี admin access จะเจอ ProtectedRoute block → redirect ไป login

### 🟡 UX: MemberEditProfilePage — ไม่มี back navigation ที่ consistent
ใช้ custom `<button onClick={() => navigate(-1)}>` ใน MobilePageHeader action → ไม่ consistent กับ standard เพราะไม่มี dedicated back pattern

### 🟡 UX: Date formatting ไม่ localize ตาม i18n
- `MemberRewardsPage` line 143: `format(date, 'MMM d, yyyy · h:mm a')` → แสดงเป็น English เสมอ
- `MemberCouponsPage` line 70-73: `format(date, 'MMM d, yyyy')` → ไม่ localize
- `TrainerSchedulePage` line 78: `format(date, 'EEEE, d MMM')` → ไม่ส่ง locale
- `MemberSchedulePage` line 74: `format(date, 'EEEE, d MMM')` → ไม่ส่ง locale

### 🟢 UX: MemberBottomNav — Check-In button อาจถูกบังโดย safe-area
ใช้ `-mt-4` เพื่อยกปุ่ม Check-In ขึ้น → ดีแล้วในแง่ design แต่ `safe-bottom` class ไม่ได้ทดสอบกับ iPhone ที่มี home indicator

---

## แผนแก้ไข (8 surgical fixes)

| # | ไฟล์ | การแก้ไข | ความเสี่ยง |
|---|------|----------|-----------|
| 1 | `StaffProfilePage.tsx` | เพิ่ม `trainer, freelance_trainer, front_desk` ใน `ADMIN_CAPABLE_ROLES` | ต่ำมาก |
| 2 | `MemberProfilePage.tsx` | ใช้ `buildSessionTransferUrl + buildCrossSurfaceUrl` แทน hardcoded URL | ต่ำ |
| 3 | `StaffProfilePage.tsx` | เพิ่ม Language + Theme toggle (เหมือน TrainerHeader pattern) | ต่ำ |
| 4 | `StaffHomePage.tsx` | เปลี่ยน `/calendar` → Coming Soon หรือ inline schedule preview | ต่ำ |
| 5 | `MemberRewardsPage.tsx` | เพิ่ม `{ locale }` ใน date-fns format calls | ต่ำมาก |
| 6 | `MemberCouponsPage.tsx` | เพิ่ม `{ locale }` ใน date-fns format calls | ต่ำมาก |
| 7 | `MemberSchedulePage.tsx` + `TrainerSchedulePage.tsx` | เพิ่ม `{ locale }` ใน date-fns format calls | ต่ำมาก |
| 8 | `StaffProfilePage.tsx` | ทำ Coming Soon items ให้ consistent กับ TrainerProfilePage (ใช้ subtitle แทน wrapper div) | ต่ำมาก |

### สิ่งที่ไม่เปลี่ยน
- DB schema / RLS / Edge Functions
- Auth flow / Login routing
- Admin pages (Dashboard, Lobby, Finance, etc.) — ทำงานดีอยู่แล้ว
- Member Home / Check-In / Bottom Nav — UX ดีอยู่แล้ว
- TrainerHeader — แก้ไขแล้วในรอบก่อน
- MemberEditProfilePage back button — เป็น pattern ที่ใช้ได้ ไม่ break UX

### Smoke Test
1. Staff Profile → เห็น Admin Portal (ถ้ามี role trainer/front_desk)
2. Staff Profile → เปลี่ยนภาษา TH/EN ได้
3. Staff Profile → สลับ Dark/Light mode ได้
4. Member Profile → กด Admin Portal → session ไม่หลุด (ใช้ session transfer)
5. Staff Home → ปุ่ม "ดูตาราง" ไม่ redirect ไป login
6. Member Rewards → วันที่แสดงเป็นภาษาไทย (เมื่อตั้งค่าภาษาเป็นไทย)
7. Member Coupons → วันที่แสดงเป็นภาษาไทย
8. Member/Trainer Schedule → วันแสดง localized (e.g. "จันทร์, 8 เม.ย.")
9. ทุก tab/page อื่นยังทำงานเหมือนเดิม

