

# Phase 4: Detail Pages Polish + Consistency Pass

## สิ่งที่เสร็จแล้ว ✅
- Phase 1: Critical fixes (i18n, fake buttons, spacing, dead code)
- Phase 2: Member Packages (icons, progress bar, urgency colors)
- Phase 3: Staff + Trainer polish (recent check-ins, tap hints)

## สิ่งที่ยังเหลือ — Detail Pages มีปัญหาเดียวกับ Phase 1

### ปัญหาที่พบ

| # | ปัญหา | ไฟล์ | ผลกระทบ |
|---|-------|------|---------|
| 1 | **`pt-12` padding ซ้ำ** — BackButton wrapper ใช้ `pt-12` ทำให้มีช่องว่างบนเกิน | `MemberClassDetailPage.tsx`, `MemberBookingDetailPage.tsx` | UI ดูเหมือนมีพื้นที่หายไป — same bug เราแก้ไปแล้วใน Upload/Edit pages |
| 2 | **ไม่ใช้ MobilePageHeader** — ทั้ง 2 หน้าใช้ inline BackButton แทน ทำให้ไม่ consistent กับทุกหน้าอื่น | ทั้ง 2 ไฟล์ | UX ไม่ consistent |
| 3 | **MemberClassDetailPage ไม่มี MobilePageHeader title** — ไม่มี page title/context ชัดเจน | `MemberClassDetailPage.tsx` | ผู้ใช้ไม่รู้ว่าอยู่หน้าอะไร |

### แผนแก้ไข

**4.1 MemberClassDetailPage — เปลี่ยนเป็น MobilePageHeader + ลบ pt-12**
- ใช้ `MobilePageHeader` พร้อม back button + title "Class Details"
- ลบ inline `BackButton` component
- ลบ `pt-12` padding ทั้งหมด

**4.2 MemberBookingDetailPage — เหมือนกัน**
- ใช้ `MobilePageHeader` พร้อม back button + title "Booking Details"
- ลบ inline `BackButton` + `pt-12`

**4.3 i18n keys**
- เพิ่ม `member.classDetails` / `member.bookingDetails` header keys (ถ้ายังไม่มี)

## ไฟล์ที่แก้

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/apps/member/pages/MemberClassDetailPage.tsx` | ลบ inline BackButton + pt-12, ใช้ MobilePageHeader |
| 2 | `src/apps/member/pages/MemberBookingDetailPage.tsx` | เหมือนกัน |
| 3 | `src/i18n/locales/en.ts` | เพิ่ม keys ถ้าจำเป็น |
| 4 | `src/i18n/locales/th.ts` | เพิ่ม keys ถ้าจำเป็น |

## สิ่งที่ไม่เปลี่ยน
- Logic ทั้งหมด (booking, cancel, rating)
- Backend / DB / Auth
- หน้าที่แก้ไปแล้วใน Phase 1-3
- Routing / shared components

## Smoke Test
1. Member class detail: มี MobilePageHeader ไม่มีช่องว่างบนเกิน
2. Member class detail: กดจอง + ยืนยันยังทำงานได้
3. Member booking detail: มี MobilePageHeader ไม่มีช่องว่างบนเกิน
4. Member booking detail: กดยกเลิก + rating ยังทำงานได้
5. Dark mode ทั้ง 2 หน้ายังดูดี
6. Published site ทำงานปกติ

