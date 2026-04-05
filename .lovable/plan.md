

# Full UX/UI Redesign — ทุก Surface

## สิ่งที่ตรวจพบจากการ audit โค้ดทั้งหมด

### A. ปัญหา UX ระดับ Critical (ผู้ใช้จะสังเกตเห็นทันที)

| # | ปัญหา | ไฟล์ | ผลกระทบ |
|---|-------|------|---------|
| 1 | **StaffProfilePage hardcoded English ทั้งหมด** — "Profile", "Settings", "Notifications", "Help & Support", "Sign Out" ไม่มี i18n | `StaffProfilePage.tsx` | Staff ไทยเห็นภาษาอังกฤษตลอด |
| 2 | **StaffProfilePage ปุ่ม 3 ตัวกดแล้วไม่ทำอะไร** — Notifications, Preferences, Help มี chevron แต่ไม่มี onClick | `StaffProfilePage.tsx` | ละเมิด "No fake actions" policy |
| 3 | **MemberUploadSlipPage + MemberEditProfilePage มี `pt-12`** — ช่องว่างด้านบนใหญ่เกินไป (48px) ซ้ำกับ header ที่มี padding อยู่แล้ว | ทั้ง 2 ไฟล์ | ดูเหมือนมีพื้นที่หายไป |
| 4 | **MemberHomePage ยาวเกิน** — 10+ sections ต้องเลื่อนมาก, Quick Actions + QuickMenuStrip ซ้ำซ้อน (มี check-in + schedule ทั้ง 2 ที่) | `MemberHomePage.tsx` | Information overload |
| 5 | **MemberRunClubPage เป็น Coming Soon** แต่โชว์ใน QuickMenuStrip ตำแหน่งแรก | `QuickMenuStrip.tsx` | ผู้ใช้กดแล้วผิดหวัง |
| 6 | **MemberBottomNav `handleNavClick` เป็นฟังก์ชันเปล่า** | `MemberBottomNav.tsx` | Dead code |

### B. ปัญหา Consistency + Polish

| # | ปัญหา | ที่ |
|---|-------|-----|
| 7 | บาง page ใช้ `useLanguage()` บางตัวใช้ `useTranslation()` — ไม่ consistent (แต่ทำงานได้) | ทั่วไป |
| 8 | MemberProfilePage menu items ทุกตัวดูเหมือนกันหมด — ไม่มี visual grouping | `MemberProfilePage.tsx` |
| 9 | TrainerProfilePage ปุ่ม Notifications/Preferences/Help มี "Coming Soon" subtitle แต่ยังมี chevron → ดูเหมือนกดได้ | `TrainerProfilePage.tsx` |
| 10 | Admin Sidebar version "0.0.1" — ดู unprofessional | `Sidebar.tsx` |

### C. Flow/Journey ที่ปรับปรุงได้

| # | โอกาส | ที่ |
|---|-------|-----|
| 11 | Member Home → ลดความซ้ำซ้อน, จัดลำดับ priority ใหม่ | `MemberHomePage.tsx` |
| 12 | Staff Home → sparse มาก, ขาด quick navigation ไปหน้าอื่น | `StaffHomePage.tsx` |
| 13 | Trainer Home → Impact card ที่กดได้แต่ไม่บอกว่ากดได้ | `TrainerHomePage.tsx` |

---

## แผนแก้ไข — แบ่งเป็น Phase เพื่อความปลอดภัย

เนื่องจากเป็น Full Redesign ทุก surface ต้องแบ่งเป็น **3 Phases** เพื่อไม่ให้พัง:

### Phase 1: Fix Critical Issues + Polish (ทำก่อน)
ขอบเขต: แก้ปัญหาที่ส่งผลต่อผู้ใช้จริงทันที

**1.1 StaffProfilePage — เพิ่ม i18n + ลบ fake buttons**
- เพิ่ม i18n keys ใน `en.ts` / `th.ts` สำหรับ Staff surface
- ลบ Notifications/Preferences/Help ที่ไม่มี onClick ออก (หรือเปลี่ยนเป็น disabled + "Coming Soon")
- เพิ่ม surface switcher (Admin/Member) เหมือน TrainerProfilePage

**1.2 Fix spacing + dead code**
- `MemberUploadSlipPage.tsx` + `MemberEditProfilePage.tsx`: เปลี่ยน `pt-12` เป็น `pt-4`
- `MemberBottomNav.tsx`: ลบ empty `handleNavClick`
- `Sidebar.tsx`: เปลี่ยน version เป็น "v1.0"

**1.3 TrainerProfilePage — ปรับ Coming Soon items**
- ลบ chevron จากรายการที่ยังไม่มีฟังก์ชัน
- เพิ่ม disabled styling ให้ชัดเจนขึ้น

**1.4 QuickMenuStrip — เอา Run Club ออกจากตำแหน่งแรก**
- สลับลำดับ: Coupons, Packages, Attendance (ที่ใช้งานได้จริง)
- ย้าย Run Club ไปอยู่ใน "More" dialog เท่านั้น

### Phase 2: Member App Flow Redesign
ขอบเขต: ปรับ layout + flow ของ Member surface ให้กระชับขึ้น

**2.1 MemberHomePage — ลดจาก 10+ sections เหลือ 6-7**
- รวม Quick Actions + DailyBonusCard เป็น row เดียว
- ลบ QuickMenuStrip ออก (ซ้ำกับ bottom nav + profile menu)
- ย้าย ReferralCard + SuggestedClassCard ไว้ล่างสุด (low priority)
- ลำดับใหม่:
  ```
  1. Greeting + subtitle
  2. Announcement/Onboarding (conditional)
  3. Today's class (if any)
  4. Quick Actions (Check-in + Book) + Daily Bonus inline
  5. Momentum Card
  6. Next Up bookings
  7. Active Packages (with expiry)
  8. Referral + Suggested (secondary)
  ```

**2.2 MemberProfilePage — Visual grouping**
- แบ่ง menu เป็น 2 กลุ่ม: "Activity" (Edit, Attendance, Rewards, Badges, Squad) + "Settings" (Security, Notifications)
- เพิ่ม section divider + subtle group headers

**2.3 MemberPackagesPage — Tab UX polish**
- เพิ่ม icon ให้ tab (My / Browse)
- เพิ่ม session progress bar ใน My Packages cards

### Phase 3: Admin + Trainer + Staff Surface Polish
ขอบเขต: Desktop admin + mobile staff/trainer

**3.1 Admin Dashboard** — เพิ่งทำไปแล้ว ✅ ไม่แตะ

**3.2 Staff Home — เพิ่ม utility**
- เพิ่ม "Recent Check-ins" list (5 ล่าสุด)
- เพิ่ม quick link ไป Payments

**3.3 Trainer Home — Micro improvements**
- เพิ่ม "Tap to see details" hint บน Impact card
- เพิ่ม badge count ถ้ามี

**3.4 Admin Sidebar — Minor polish**
- Update version text
- Consider adding user avatar at bottom

---

## ไฟล์ที่แก้ (Phase 1 — ทำก่อน)

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/apps/staff/pages/StaffProfilePage.tsx` | เพิ่ม i18n, ลบ/disable fake buttons, เพิ่ม surface switcher |
| 2 | `src/apps/member/pages/MemberUploadSlipPage.tsx` | แก้ `pt-12` → `pt-4` |
| 3 | `src/apps/member/pages/MemberEditProfilePage.tsx` | แก้ `pt-12` → `pt-4` |
| 4 | `src/apps/member/components/MemberBottomNav.tsx` | ลบ empty handleNavClick |
| 5 | `src/apps/member/components/QuickMenuStrip.tsx` | สลับลำดับ items, ย้าย Run Club |
| 6 | `src/apps/trainer/pages/TrainerProfilePage.tsx` | ลบ chevron จาก Coming Soon items |
| 7 | `src/components/layout/Sidebar.tsx` | Update version text |
| 8 | `src/i18n/locales/en.ts` | เพิ่ม Staff i18n keys |
| 9 | `src/i18n/locales/th.ts` | เพิ่ม Staff i18n keys ภาษาไทย |
| 10 | `src/apps/member/pages/MemberHomePage.tsx` | ลด sections, ลบ QuickMenuStrip, จัดลำดับใหม่ |
| 11 | `src/apps/member/pages/MemberProfilePage.tsx` | เพิ่ม visual grouping |

## สิ่งที่ไม่เปลี่ยน
- Backend / DB / Edge Functions — ไม่แตะ
- Auth / RLS — ไม่แตะ
- Admin Dashboard — เพิ่ง redesign ✅
- Check-In Page 3-Zone — เพิ่ง redesign ✅
- Shared components (ListCard, EmptyState, etc.) — ไม่แตะ
- Routing structure — ไม่แตะ

## Smoke Test
1. Staff profile แสดงภาษาไทยเมื่อเลือก TH
2. Staff profile ไม่มีปุ่มที่กดแล้วไม่ทำอะไร
3. Member upload slip ไม่มีช่องว่างใหญ่ด้านบน
4. Member edit profile เหมือนกัน
5. Member home ยาวน้อยลง ไม่มี QuickMenuStrip
6. QuickMenuStrip (ใน More dialog ของ profile) ไม่ขึ้น Run Club เป็นตัวแรก
7. Trainer profile Coming Soon items ไม่มี chevron หลอก
8. Published site ยังทำงานได้ปกติ
9. Dark mode ทุกหน้าที่แก้ยังดูดี
10. Bottom nav ยังทำงานปกติ

---

Phase 2 + 3 จะเป็น follow-up หลังจาก Phase 1 เสร็จและ verify แล้ว

