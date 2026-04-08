

# Fix: Trainer App — Admin Portal Button Not Showing

## Root Cause

**TrainerProfilePage line 22:**
```typescript
const hasAdminAccess = allRoles.some(r => ['owner', 'admin'].includes(r));
```
ตรวจแค่ `owner` และ `admin` — ถ้า user มี role เป็น `trainer` หรือ `front_desk` จะไม่เห็นปุ่ม

**MemberProfilePage** ใช้ list ที่กว้างกว่า:
```typescript
const ADMIN_CAPABLE_ROLES = ['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk'];
```

นอกจากนี้ **TrainerHeader** (dropdown menu ที่เห็นในภาพ) ไม่มี link ไป Admin Portal เลย — ควรเพิ่มเป็น quick access

## Plan

| # | File | Change |
|---|------|--------|
| 1 | `TrainerProfilePage.tsx` | เปลี่ยน `hasAdminAccess` ให้ใช้ list เดียวกับ MemberProfilePage: `['owner', 'admin', 'trainer', 'freelance_trainer', 'front_desk']` |
| 2 | `TrainerHeader.tsx` | เพิ่ม "Admin Portal" menu item ใน dropdown (เฉพาะ user ที่มี admin-capable role) — อยู่ก่อน Sign Out |

## สิ่งที่ไม่เปลี่ยน
- MemberProfilePage (ถูกต้องอยู่แล้ว)
- Auth / RLS / routing
- TrainerLayout, bottom nav

## Smoke Test
1. Login ด้วย user ที่มี role `trainer` → Trainer Profile → เห็นปุ่ม Admin Portal
2. Header dropdown → เห็น Admin Portal menu item
3. กดแล้วนำไปหน้า Admin ถูกต้อง

