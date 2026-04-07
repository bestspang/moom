

# System Audit: ปัญหาที่พบจริง + แผนแก้ไข

## การตรวจสอบที่ทำแล้ว

อ่านไฟล์หลักทั้งหมดที่เกี่ยวข้อง: `MemberDetails.tsx`, `useMemberDetails.ts`, `PurchasePackageDialog.tsx`, `MemberPackagesTab.tsx`, `MemberBillingTab.tsx`, `MemberRecordsTab.tsx`, `MemberOverviewTab.tsx`, `EditMemberPackageDialog.tsx`, `formatters.ts`, `tabs/index.ts`, `App.tsx`

---

## ปัญหาที่พบจริง (Verified Issues)

### BUG 1: Duplicate React Query Hooks — ยิง request ซ้ำ 2 ครั้ง (CONFIRMED)
**ไฟล์:** `src/pages/MemberDetails.tsx` lines 61-71
```
const { data: packages = [] } = useMemberPackages(id);     // ← call #1
const { data: attendance = [] } = useMemberAttendance(id);  // ← call #1
...
const { isLoading: attendanceLoading } = useMemberAttendance(id);  // ← call #2 (duplicate!)
const { isLoading: packagesLoading } = useMemberPackages(id);      // ← call #2 (duplicate!)
```
**ผลกระทบ:** React Query cache ช่วยไม่ให้ request ซ้ำจริง แต่สร้าง subscription ซ้ำ 2 ตัว → re-render เพิ่ม + โค้ดสับสน
**Fix:** รวมเป็น call เดียว ดึง `isLoading` จาก call แรก

### BUG 2: Gamification Event ส่ง net_paid ผิด (CONFIRMED)
**ไฟล์:** `src/hooks/useMemberDetails.ts` line 695
```
net_paid: variables.pkg.price,  // ← ใช้ราคาเต็ม ไม่ใช่ราคาหลังส่วนลด
```
**ผลกระทบ:** เมื่อสมาชิกซื้อแพ็กเกจพร้อมส่วนลด (promotion/coupon/manual) ระบบ gamification จะคำนวณ XP/SP ตามราคาเต็ม ไม่ใช่ราคาที่จ่ายจริง → ได้ XP เกินจริง
**Fix:** ส่ง net price จาก `discountBreakdown` แทน (ต้องคำนวณในตัว mutation)

### BUG 3: Promotion/Coupon Select "none" value ส่งเป็น promotionId (CONFIRMED)
**ไฟล์:** `src/components/members/PurchasePackageDialog.tsx` lines 345, 368
เมื่อเลือก `<SelectItem value="none">` แล้ว `selectedPromotionId` จะเป็น `"none"` (string) ไม่ใช่ empty string → `promotionId: selectedPromotionId || undefined` จะส่ง `"none"` เป็น promotionId → insert `promotion_redemptions` ด้วย id = "none" → DB error (uuid mismatch)
**Fix:** ใช้ `selectedPromotionId && selectedPromotionId !== 'none'` ในทุกที่ที่ใช้ค่านี้

### BUG 4: EditMemberPackageDialog ไม่มี DialogDescription (CONFIRMED)
**ไฟล์:** `src/components/members/tabs/EditMemberPackageDialog.tsx`
Radix Dialog ต้องมี `DialogDescription` หรือ `aria-describedby` ไม่งั้นจะมี accessibility warning ใน console
**Fix:** เพิ่ม `DialogDescription`

### BUG 5: MemberRecordsTab ดึง notes ซ้ำกับ parent (CONFIRMED)
**ไฟล์:** `src/pages/MemberDetails.tsx` ส่ง `notes` prop ลงไป + `MemberRecordsTab` ใช้ prop นั้น แต่ก็ query `member_notes` อีกรอบผ่าน `commLogs` query ที่ filter `neq('note_type', 'note')` — ตรงนี้ ok จริงเพราะมันดึงคนละ subset (notes = type 'note', commLogs = type อื่น) → **ไม่ใช่ bug** แต่ `notes` prop ที่ส่งมาจาก parent ไม่ได้ filter by `note_type = 'note'` → **มี duplicate ที่ feed ถ้า note มี note_type ไม่ใช่ 'note'**

**Analysis ลึกขึ้น:** `useMemberNotes` query ไม่ได้ filter by `note_type` → ดึงทุกประเภทรวมถึง call, line, email → `MemberRecordsTab` เอา `notes` (ทุกประเภท) + `commLogs` (ไม่ใช่ 'note') มารวม → **records ที่ note_type ≠ 'note' จะแสดงซ้ำ 2 ครั้ง**
**Fix:** กรอง notes prop เฉพาะ `note_type === 'note' || !note_type` ก่อนรวม

### ISSUE 6: Dead Code — Legacy Tab Exports (LOW)
**ไฟล์:** `src/components/members/tabs/index.ts` lines 10-12
```
export { MemberHomeTab } from './MemberHomeTab';
export { MemberProfileTab } from './MemberProfileTab';
```
ไม่มีที่ไหน import ใช้แล้ว (verified: ไม่เจอใน src/pages/) แต่ไม่ทำให้พัง → low priority cleanup

### ISSUE 7: MemberCommunicationLog.tsx — Dead Component (LOW)
ไม่มีที่ไหน import ใช้นอกจาก barrel export → dead code เหลือค้าง

---

## สิ่งที่ตรวจแล้ว ไม่มีปัญหา

| ตรวจอะไร | ผลลัพธ์ |
|---|---|
| Routing ซ้ำ | ✅ ไม่ซ้ำ — analytics → /insights redirect เป็น intent |
| Timezone ใน formatters | ✅ ปลอดภัย — ใช้ date-fns ไม่มี manual TZ offset |
| RLS policies | ✅ operator level มีสิทธิ์ UPDATE/DELETE member_packages, member_billing |
| Purchase flow VAT calculation | ✅ ถูกต้อง — คำนวณ VAT บน net price |
| Billing CRUD | ✅ ทำงานถูกต้อง — create/update/delete wired properly |
| Package CRUD | ✅ ทำงานถูกต้อง — edit/delete wired properly |
| Member status update on suspend | ✅ ถูกต้อง — update member.status + create suspension |

---

## แผนแก้ไข (Minimal, Surgical Fixes)

| # | ไฟล์ | การแก้ไข | ความเสี่ยง |
|---|------|----------|-----------|
| 1 | `src/pages/MemberDetails.tsx` | ลบ duplicate hook calls (lines 70-71) → ใช้ `isLoading` จาก call แรก | ต่ำมาก |
| 2 | `src/hooks/useMemberDetails.ts` | แก้ gamification event `net_paid` → คำนวณจาก `pkg.price - totalDiscount` | ต่ำ |
| 3 | `src/components/members/PurchasePackageDialog.tsx` | แก้ "none" value → เช็ค `!== 'none'` ก่อนใช้ promotionId/couponId | ต่ำ |
| 4 | `src/components/members/tabs/EditMemberPackageDialog.tsx` | เพิ่ม `DialogDescription` | ต่ำมาก |
| 5 | `src/components/members/tabs/MemberRecordsTab.tsx` | กรอง `notes` prop ให้เฉพาะ type 'note' ก่อนรวม feed | ต่ำ |

### สิ่งที่ไม่เปลี่ยน
- DB schema / RLS policies
- ทุก mutation logic (create/update/delete)
- ทุก tab อื่นๆ
- Routing / Auth / Edge Functions
- formatters.ts
- Dead code (legacy exports) — ไม่ลบตอนนี้เพื่อลดความเสี่ยง

### Smoke Test
1. เปิดหน้า Member Detail → ไม่มี duplicate network requests
2. ซื้อ Package พร้อม promotion → ส่ง gamification event ด้วย net price ที่ถูกต้อง
3. เลือก promotion แล้วยกเลิก (เลือก "none") → ไม่ error
4. Records tab → ไม่แสดง entries ซ้ำ
5. Edit Package dialog → ไม่มี accessibility warning ใน console
6. ทุก tab ยังทำงานเหมือนเดิม

