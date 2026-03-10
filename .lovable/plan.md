

# UX/UI Re-Audit — Issues Still Present

หลังจาก re-check ทุกไฟล์อีกรอบ ปัญหาทั้งหมดจากรอบแรกยังอยู่ครบ ไม่มีอะไรถูกแก้ไข นี่คือสรุปแบ่งเป็น 3 phases ที่ควรทำตามลำดับ:

---

## Phase A: Critical Bugs (ต้องทำก่อน — app จะพังถ้าไม่แก้)

### A1. React Hooks Violation — `MemberBookingDetailPage.tsx`
- **Line 84**: `useQuery` ถูกเรียกหลัง early return (lines 58-77) → ผิด Rules of Hooks → จะ crash runtime
- **Fix**: ย้าย `useQuery` (existingRating) ขึ้นไปอยู่กับ hooks อื่นๆ ก่อน early returns ทุกอัน

### A2. ListCard `meta` type mismatch
- `meta` typed เป็น `string` แต่ `MemberHomePage.tsx` line 260 ส่ง JSX เข้าด้วย `as any`
- **Fix**: เปลี่ยน `meta?: string` → `meta?: React.ReactNode`

### A3. Hardcoded validation strings — `MemberUploadSlipPage.tsx`
- Line 16-18: `'Required'`, `'Must be positive'` — hardcoded English
- **Fix**: ใช้ i18n keys เช่น `t('validation.required')`

### A4. Premature gamification event — `MemberPurchasePage.tsx`
- Line 45-50: `fireGamificationEvent` ถูกเรียกตอน `createCheckout` สำเร็จ แต่ user ยังไม่ได้จ่ายเงิน → ให้ XP/points ก่อนจ่าย
- **Fix**: ลบ `fireGamificationEvent` ออก (webhook `stripe-webhook` จัดการอยู่แล้ว)

---

## Phase B: UX Fixes (ปรับ flow ให้ดีขึ้นทันที)

### B1. Upload Slip — ไม่มี file input จริง
- Upload area เป็นแค่ visual placeholder (icon + text) ไม่มี `<input type="file">`
- **Fix**: เพิ่ม hidden `<input type="file" accept="image/*">` + preview thumbnail + state management

### B2. Profile "Support" dead-end
- Menu item มี `path: ''` → กดแล้วแสดง "Coming Soon" toast → สร้างความผิดหวัง
- **Fix**: ลบออก หรือเปลี่ยนเป็น action จริง (เช่น `mailto:` หรือ LINE OA link)

### B3. Leaderboard 5 tabs squeeze บน 390px
- `grid-cols-5` ใน 390px → text ถูกตัด อ่านไม่ออก
- **Fix**: เปลี่ยนเป็น horizontally scrollable `TabsList` ด้วย `overflow-x-auto` + `flex` แทน `grid`

### B4. Attendance page — flat list ไม่มี context
- ไม่มี summary stats → user ไม่รู้ว่าเข้ามากี่ครั้ง
- **Fix**: เพิ่ม summary card ด้านบน (Total, This Month, This Week)

### B5. Inconsistent i18n hooks
- `MemberHomePage`, `MemberProfilePage`, `MemberRewardsPage` ใช้ `useLanguage()` → ควรใช้ `useTranslation()` ให้เหมือนกันทุกหน้า
- **Fix**: เปลี่ยนทุกที่เป็น `useTranslation()`

---

## Phase C: Information Architecture (ปรับโครงสร้าง)

### C1. Rewards vs Momentum page ซ้ำ 70%
- **Rewards page** แสดง: points balance, rewards grid, points history
- **Momentum page (Rewards tab)** แสดง: เหมือนกันเป๊ะ
- **Fix**: ลบ Rewards page ออก → Bottom Nav "Rewards" → navigate ไปที่ `/member/momentum` แท็บ rewards โดยตรง

### C2. Home page 10+ sections
- Onboarding + TodayCard + Quick Actions + DailyBonus + MomentumCard + AlmostThere + NextUp + Announcement + Referral + SuggestedClass + ActivePackages = 11 sections
- **Fix**: ลด Home เหลือ 5-6 sections: Today/Quick Actions/Momentum/NextUp/Announcement — ย้าย referral, suggested, packages ไป profile menu

---

## Files ที่จะแก้

| Phase | File | Change |
|-------|------|--------|
| A1 | `MemberBookingDetailPage.tsx` | Move `useQuery` before early returns |
| A2 | `ListCard.tsx` | `meta?: React.ReactNode` |
| A3 | `MemberUploadSlipPage.tsx` | i18n validation messages |
| A4 | `MemberPurchasePage.tsx` | Remove premature gamification event |
| B1 | `MemberUploadSlipPage.tsx` | Add real file input |
| B2 | `MemberProfilePage.tsx` | Remove or replace Support item |
| B3 | `MemberLeaderboardPage.tsx` | Scrollable tabs |
| B4 | `MemberAttendancePage.tsx` | Add stats summary |
| B5 | `MemberHomePage.tsx`, `MemberProfilePage.tsx`, `MemberRewardsPage.tsx` | `useLanguage()` → `useTranslation()` |
| C1 | `MemberBottomNav.tsx`, `MemberRewardsPage.tsx` | Redirect Rewards → Momentum |
| C2 | `MemberHomePage.tsx` | Reduce sections |
| — | `src/i18n/locales/en.ts`, `th.ts` | Add validation + attendance stats keys |

แนะนำ: ทำ Phase A + B พร้อมกัน (bug fixes + UX fixes) แล้วค่อยทำ Phase C (restructure) ทีหลัง

