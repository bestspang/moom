

# Fix: StatusBadge forwardRef Warning + Members Page Audit

## ปัญหาที่พบ

### 1. StatusBadge forwardRef Warning (Console Error)
**Root Cause:** `StatusBadge` เป็น function component ธรรมดาที่ถูก render ภายใน `DataTable` → React พยายาม pass ref ให้แต่ component ไม่รองรับ `forwardRef`

**Fix:** Wrap `StatusBadge` ด้วย `React.forwardRef` — เปลี่ยนแค่ signature ไม่เปลี่ยน behavior

### 2. BulkActionBar — Duplicate button is a no-op stub
**Root Cause:** `onDuplicate={() => {}}` ใน Members.tsx — กดแล้วไม่ทำอะไร ละเมิด No-Stub Policy

**Fix:** ซ่อนปุ่ม Duplicate จาก BulkActionBar โดยทำให้ `onDuplicate` เป็น optional prop — ถ้าไม่ส่งก็ไม่แสดงปุ่ม

### 3. ปุ่มอื่นๆ — ตรวจแล้วทำงานปกติ
| ปุ่ม | สถานะ |
|------|--------|
| Create Member | ✅ เปิด dialog |
| Manage > Import CSV | ✅ เปิด ImportCenterDialog |
| Manage > Export | ✅ เรียก exportMembers |
| Manage > Download Template | ✅ สร้าง CSV |
| Search | ✅ filter + reset page |
| Status Tabs | ✅ filter + reset page + clear selection |
| Row Click → Detail | ✅ navigate |
| Row Edit (dropdown) | ✅ เปิด EditMemberDialog (permission-gated) |
| Bulk Select/All | ✅ toggle |
| Bulk Change Status | ✅ mutation + toast |
| Bulk Export | ✅ export selected |
| Bulk Delete | ✅ confirm dialog + mutation |
| Pagination | ✅ page change + clear selection |

## Implementation Plan

| # | File | Change |
|---|------|--------|
| 1 | `src/components/common/StatusBadge.tsx` | Wrap with `React.forwardRef` |
| 2 | `src/components/common/BulkActionBar.tsx` | Make `onDuplicate` optional, hide button when not provided |
| 3 | `src/pages/Members.tsx` | Remove `onDuplicate={() => {}}` prop |

## สิ่งที่ไม่เปลี่ยน
- DataTable logic
- All other buttons/functions
- DB / Auth / RLS
- Other pages using StatusBadge (backward compatible — forwardRef is additive)

## Smoke Test
1. Members page loads without console warnings
2. All buttons still work (create, import, export, template, edit, bulk actions)
3. Bulk action bar ไม่แสดงปุ่ม Duplicate
4. StatusBadge ยังแสดงผลถูกต้องทุกหน้าที่ใช้

