

# เพิ่มความสามารถแก้ไข/เพิ่ม/ลบ การเรียกเก็บเงิน (Billing) ในหน้ารายละเอียดสมาชิก

## สถานะปัจจุบัน

- `MemberBillingTab` เป็น read-only DataTable + ปุ่ม "เพิ่มรายการ" ที่ disabled (Coming soon)
- ไม่มี mutation hooks สำหรับ billing (create/update/delete)
- DB table `member_billing` มี fields: id, member_id, amount, description, billing_date, transaction_id

## แผนการแก้ไข

| # | File | Change |
|---|------|--------|
| 1 | `src/hooks/useMemberDetails.ts` | เพิ่ม `useCreateMemberBilling`, `useUpdateMemberBilling`, `useDeleteMemberBilling` mutations |
| 2 | `src/components/members/tabs/MemberBillingTab.tsx` | เปิดปุ่ม "เพิ่มรายการ" ให้ทำงาน, เพิ่ม row actions (Edit/Delete), เพิ่ม Add/Edit dialog inline |
| 3 | `src/i18n/locales/en.ts` + `th.ts` | เพิ่ม keys: editBilling, deleteBilling, confirmDeleteBilling, billingDescription, billingAmount, billingDate |

### Billing Dialog Fields
- **คำอธิบาย** (Description) — text input
- **จำนวนเงิน** (Amount) — number input
- **วันที่** (Billing Date) — DatePicker
- **รหัสธุรกรรม** (Transaction) — optional select จาก transactions ที่มีอยู่

### Row Actions
- **แก้ไข** → เปิด dialog พร้อม prefill ข้อมูลเดิม
- **ลบ** → confirm dialog → delete จาก member_billing + activity log

## สิ่งที่ไม่เปลี่ยน
- DB schema (ใช้ table เดิม, ไม่ต้อง migration)
- Finance/Transaction pages
- ทุก tab อื่นใน Member Details

## Smoke Test
1. เปิด Billing tab → กดปุ่ม "เพิ่มรายการ" → กรอกข้อมูล → save → แสดงในตาราง
2. กด Edit row → แก้จำนวนเงิน → save → อัพเดทในตาราง
3. กด Delete row → confirm → หายจากตาราง
4. Billing ที่ผูกกับ transaction → แสดง transaction ID ถูกต้อง

