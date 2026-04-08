

# Redesign: หน้ารายละเอียดสมาชิก — Package Management UX Overhaul

## ปัญหาที่พบ (ทั้งที่ผู้ใช้บอก + ที่วิเคราะห์เพิ่ม)

### ปัญหาหลัก — Package Management ยากใช้
| # | ปัญหา | Root Cause | ผลกระทบ |
|---|--------|-----------|---------|
| 1 | **เริ่มใช้ Package ยาก** — ต้องกด Edit → เลือกวัน activation → save | EditMemberPackageDialog ไม่มีปุ่ม "Activate Now" แยกต่างหาก | Staff ต้อง 3 clicks แทนที่จะ 1 click |
| 2 | **Activation date ไม่ default วันนี้** | `activationDate` default เป็น empty string เมื่อ pkg ยังไม่มี `activation_date` | Staff ต้องเลือกวันเอง ทุกครั้ง |
| 3 | **Expiry date ไม่ auto-calculate** | ไม่มี logic คำนวณ `activation_date + term_days` | Staff ต้องนับวันเอง เสี่ยงผิดพลาด |
| 4 | **ซื้อแพ็กเกจ → Step 2 ใส่ส่วนลด → ไม่เห็นราคาเปลี่ยน real-time** | Discount breakdown แสดงเฉพาะ Step 3 (Summary) ไม่มีใน Step 2 | Staff ใส่ส่วนลดแบบ blind ไม่รู้ว่าราคาสุทธิเป็นเท่าไหร่ |
| 5 | **ปุ่ม "ซื้อแพ็คเกจสำหรับสมาชิกนี้" text ยาว** | i18n key `purchasePackage` ภาษาไทยอาจยาวเกิน | ปุ่มแตกหรือดันเกินขอบ |
| 6 | **MemberPackagesTab: status tabs + purchase button อัดกัน** | FlexBox justify-between ในพื้นที่จำกัด, 4 tabs + 1 button | Layout แตกบน tablet/mobile |
| 7 | **Status ใน EditDialog แสดงเป็น English raw** | `s.replace(/_/g, ' ')` ไม่ได้ใช้ i18n | ไม่สอดคล้องกับ default language เป็นไทย |
| 8 | **Package tab ไม่มี quick action "Activate"** | ไม่มีปุ่ม Activate ใน row actions dropdown | Flow ที่ใช้บ่อยที่สุด (เปิดใช้แพ็กเกจ) ซ่อนอยู่ลึก |
| 9 | **Edit dialog ใช้ native date input** | `<Input type="date">` แทน Calendar/DatePicker component | UX ไม่ consistent กับส่วนอื่นของ app |

### ปัญหาเสริมที่ตรวจเจอ
| # | ปัญหา |
|---|--------|
| 10 | MemberPackagesTab: ไม่แสดง expiry countdown (เหลือกี่วัน) ใน DataTable |
| 11 | Purchase dialog: promotion/coupon ที่เลือกแล้วไม่แสดง discount amount ใน Step 2 |
| 12 | Edit Package: เปลี่ยน status เป็น "active" แต่ไม่ auto-fill activation_date = today |

## แผนแก้ไข (7 changes, surgical)

### Change 1: EditMemberPackageDialog — Smart Defaults + Auto-Calculate
**File:** `src/components/members/tabs/EditMemberPackageDialog.tsx`
- เมื่อ `activationDate` ว่าง → default เป็นวันนี้
- เมื่อเปลี่ยน `activationDate` → auto-calculate `expiryDate = activationDate + term_days`
- เมื่อเปลี่ยน status เป็น `active` → auto-fill activationDate = today ถ้ายังว่าง
- Status options ใช้ i18n labels แทน raw English
- เปลี่ยนจาก `<Input type="date">` เป็น Popover+Calendar (Shadcn DatePicker)

### Change 2: MemberPackagesTab — Add "Activate" Quick Action + Compact Layout
**File:** `src/components/members/tabs/MemberPackagesTab.tsx`
- เพิ่ม "เปิดใช้งาน" (Activate) ใน row dropdown → set status=active, activation_date=today, expiry_date=today+term_days → one click
- ย้ายปุ่ม "ซื้อแพ็กเกจ" ไปด้านบนสุดแยกจาก tabs → ใช้ text สั้น "ซื้อแพ็กเกจ" (ไม่ต้อง "สำหรับสมาชิกนี้")
- เพิ่มคอลัมน์ "เหลือ" (days remaining) แสดง countdown badge สีตามความเร่งด่วน
- Status tabs → compact: ใช้ badge count แทน full text ถ้าจอเล็ก

### Change 3: PurchasePackageDialog — Real-time Price Preview in Step 2
**File:** `src/components/members/PurchasePackageDialog.tsx`
- เพิ่ม "Price Summary Card" ที่ bottom ของ Step 2 (ก่อนปุ่ม Next)
- แสดง: Original Price → Promotion (−xxx) → Coupon (−xxx) → Manual (−xxx) → **Net: xxx฿**
- Update real-time ทุกครั้งที่เลือก promotion/coupon/manual discount
- Card ใช้ sticky bottom ไม่หายไปเมื่อ scroll

### Change 4: i18n Keys — Package Status Labels
**Files:** `src/i18n/locales/en.ts`, `src/i18n/locales/th.ts`
- เพิ่ม keys: `packageStatus.active`, `packageStatus.ready_to_use`, `packageStatus.on_hold`, `packageStatus.completed`, `packageStatus.expired`
- เพิ่ม keys: `members.activatePackage`, `members.daysRemaining`, `members.activateConfirm`
- ปรับ `purchasePackage` ให้สั้นลง (ใช้ "ซื้อแพ็กเกจ" แทน "ซื้อแพ็กเกจสำหรับสมาชิกนี้")

### Change 5: Activate Package Mutation
**File:** `src/hooks/useMemberDetails.ts`
- เพิ่ม `useActivateMemberPackage` mutation → update status=active, activation_date=today, expiry_date=today+term_days, one-click
- Activity logging + invalidation เหมือน useUpdateMemberPackage

### Change 6: Quick Actions Sidebar — เพิ่มปุ่ม "เปิดใช้แพ็กเกจ"
**File:** `src/pages/MemberDetails.tsx`
- เพิ่ม quick action ให้สามารถกดไปที่ Packages tab ตรง (ใช้ `setActiveTab('packages')`)
- ปุ่ม "ซื้อแพ็กเกจ" text สั้นลง

### Change 7: PurchasePackageDialog Step 2 — Discount Real-time Feedback
**File:** `src/components/members/PurchasePackageDialog.tsx`
- เมื่อเลือก promotion → แสดง badge "(−500฿)" ข้าง select ทันที
- เมื่อเลือก coupon → แสดง badge "(−10%)" ข้าง select ทันที
- Manual discount → แสดง net price realtime ด้านล่าง input

## สิ่งที่ไม่เปลี่ยน
- DB schema / RLS / Edge Functions
- MemberOverviewTab, MemberBillingTab, MemberRecordsTab
- Purchase flow logic (mutation, transaction creation)
- Auth / Routing
- Other pages

## Smoke Test
1. Packages tab → เห็น "เปิดใช้งาน" ใน dropdown ของ ready_to_use package → กด → status เปลี่ยนเป็น active + วันที่ auto-fill
2. Edit package → วัน activation default เป็นวันนี้ → เปลี่ยนวัน → expiry auto-calculate
3. Edit package → เปลี่ยน status เป็น active → activation date auto-fill วันนี้
4. ซื้อแพ็กเกจ → Step 2 → เลือก promotion → เห็นราคาสุทธิ real-time
5. ซื้อแพ็กเกจ → Step 2 → ใส่ manual discount → เห็น net price เปลี่ยนทันที
6. ปุ่ม "ซื้อแพ็กเกจ" text ไม่เกินขอบ
7. Status labels แสดงเป็นภาษาไทย
8. Package tab แสดง countdown "เหลือ X วัน" พร้อมสี
9. Dark mode ยังแสดงผลถูกต้อง
10. ทุก tab อื่นยังทำงานเหมือนเดิม

