

# Enhance UX/UI — หน้ารายละเอียดสมาชิก (Member Details)

## Current Issues

1. **Sidebar ไม่มี Quick Actions** — ไม่มีปุ่มดำเนินการเร็ว (Edit, Suspend, Purchase) ต้องเข้าไปหาในแต่ละ tab
2. **Tab bar อัดแน่น 10 tabs** — แถบ tab ยาวเกิน wrap หลายแถว ดู cluttered โดยเฉพาะบน laptop
3. **Home tab ซ้ำกับ sidebar** — แสดง member_id, status, joined date ซ้ำกับ sidebar card
4. **StatCards ไม่มี icon** — 4 stat cards ด้านบนดูเรียบเกิน ไม่มี visual cue
5. **Sidebar contact card ไม่มี click actions** — เบอร์โทร/email ไม่สามารถกดโทร/ส่งเมลได้
6. **Front Desk Notes ลอยล่างสุด** — อยู่ไกลจาก sidebar ทั้งที่เป็นข้อมูลที่ staff ใช้บ่อย
7. **Camera button ไม่ทำงาน** — ปุ่ม Camera บน avatar เป็น stub (ไม่มี logic)
8. **Profile tab UX ไม่ดี** — ทุก field แสดงเป็น Input readOnly ดูเหมือนฟอร์ม แต่ไม่ใช่ form
9. **Engagement score badge เล็กเกินไป** — ข้อมูลสำคัญแต่แสดงเป็น badge เล็กจิ๋ว

## Implementation Plan

### Part 1: Sidebar Enhancement

| # | File | Change |
|---|------|--------|
| 1 | `MemberDetails.tsx` | ย้าย Front Desk Notes ไป sidebar (ใต้ contact card), เพิ่ม Quick Actions card (Edit Profile, Purchase Package, Suspend/Unsuspend), ลบ Camera button stub |
| 2 | `MemberDetails.tsx` | เพิ่ม Engagement Score mini-card ใน sidebar แทน badge เล็ก — แสดง score + level + ring chart |

### Part 2: Tab Consolidation & Cleanup

| # | File | Change |
|---|------|--------|
| 3 | `MemberDetails.tsx` | ลด tabs จาก 10 → 7: merge Home+Profile → "ภาพรวม", merge Notes+Communications → "บันทึก", ใส่ icon ใน tab trigger |
| 4 | `MemberHomeTab.tsx` | Rename → MemberOverviewTab: รวม account details grid + profile fields (read-only display, ไม่ใช่ Input) + Edit button เปิด EditMemberDialog |
| 5 | `MemberNotesTab.tsx` | รวม Communication Log เข้ามาเป็น unified feed — filter chips แยก note/call/line/email |

### Part 3: StatCards Visual Polish

| # | File | Change |
|---|------|--------|
| 6 | `MemberDetails.tsx` | เพิ่ม icon ให้ StatCards ทั้ง 4: Calendar, Trophy, Wallet, Clock |

### Part 4: Contact Card Clickable Actions

| # | File | Change |
|---|------|--------|
| 7 | `MemberDetails.tsx` | Phone → `tel:` link, Email → `mailto:` link, เพิ่ม copy-to-clipboard icon |

### Part 5: Profile Tab → Read-Only Display

| # | File | Change |
|---|------|--------|
| 8 | `MemberProfileTab.tsx` → ย้ายเข้า Overview tab | แสดงข้อมูลเป็น label-value pairs (ไม่ใช่ Input readOnly), ปุ่ม Edit เปิด EditMemberDialog modal แทนการ edit inline |

### Part 6: i18n + Docs

| # | File | Change |
|---|------|--------|
| 9 | `en.ts` + `th.ts` | เพิ่ม keys: members.tabs.overview, members.tabs.records, members.quickActions, members.copyEmail, members.copyPhone |
| 10 | `docs/DEVLOG.md` | Log changes |

## สิ่งที่ไม่เปลี่ยน
- Backend / DB / RLS — ไม่มีการเปลี่ยน
- Tab content logic ของ Attendance, Packages, Billing, Injuries, Suspensions, Contracts — คงเดิม
- EditMemberDialog — ใช้ของเดิม (เปิดจาก Quick Actions แทน)
- PurchasePackageDialog — คงเดิม
- MemberTimeline — คงเดิม

## Smoke Test
1. เข้าหน้า Member Detail → Sidebar แสดง avatar, ชื่อ, contact (กดโทร/email ได้), Quick Actions, Desk Notes, LINE Identity
2. กดปุ่ม Quick Action "แก้ไขโปรไฟล์" → เปิด EditMemberDialog → save ได้
3. กดปุ่ม Quick Action "ซื้อแพ็กเกจ" → เปิด PurchasePackageDialog
4. Tab "ภาพรวม" แสดง account details + profile info เป็น read-only + Timeline
5. Tab "บันทึก" แสดง notes + communications รวมกัน พร้อม filter chips
6. Tab ที่เหลือ (Attendance, Packages, Billing, Injuries, Suspensions, Contracts) ยังทำงานเหมือนเดิม
7. StatCards แสดง icon ทั้ง 4
8. Dark mode ยังดูดี
9. Responsive: tablet/mobile sidebar stack ลงล่าง

