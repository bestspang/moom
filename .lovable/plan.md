

# Fix: Duplicate Members from Case-Sensitive Email Matching

## Root Cause

จากภาพหน้า Members: มี 2 รายการที่ email เดียวกันแต่ตัวพิมพ์ต่างกัน — `pinpossawee@gmail.com` vs `Pinpossawee@gmail.com`

สาเหตุ: `handle_new_user` trigger ใช้ `WHERE email = NEW.email` ซึ่งเป็น **case-sensitive** match

```text
Admin สร้างสมาชิก → email: "Pinpossawee@gmail.com" (ตัว P ใหญ่)
User ล็อกอินผ่าน Google → email: "pinpossawee@gmail.com" (ตัว p เล็ก)
Trigger: WHERE email = NEW.email → ไม่เจอ → สร้างสมาชิกใหม่ซ้ำ!
```

นอกจากนี้ `MemberSignup.tsx` ยังมี bug เดิมที่ยังไม่ได้แก้: `isCustomDomain()` branch ยังใช้ `supabase.auth.signInWithOAuth` แทน `lovable.auth.signInWithOAuth`

## Plan

### 1. DB Migration — Case-insensitive email matching in trigger

อัพเดท `handle_new_user()`:
- เปลี่ยน `WHERE email = NEW.email` → `WHERE lower(email) = lower(NEW.email)`
- ป้องกันการสร้างซ้ำในอนาคตทุกกรณี

### 2. Fix MemberSignup.tsx — Remove isCustomDomain() branch

เหมือนที่แก้ใน `MemberLogin.tsx` และ `AdminLogin.tsx` แล้ว:
- ลบ `isCustomDomain()` branch
- ใช้ `lovable.auth.signInWithOAuth("google", ...)` เสมอ

### 3. Clean up existing duplicate

ใช้ `delete_member_cascade` RPC ลบรายการ "Member" (M-44599719) ที่เป็นตัวซ้ำ เพราะตัวนี้ไม่มีข้อมูลจริง (ไม่มีเบอร์โทร ไม่มีสาขา ไม่มีชื่อเล่น)

แล้วอัพเดท `identity_map` ให้ auth user id ของ Google login ชี้ไปที่ member record ตัวจริง (พศวีร์ ศิลพันธุ์)

## Files to change

| # | File | Change |
|---|------|--------|
| 1 | DB Migration | `handle_new_user()` — `lower(email)` matching |
| 2 | `src/pages/Auth/MemberSignup.tsx` | Remove `isCustomDomain()` branch, always use `lovable.auth` |
| 3 | Data cleanup | Delete duplicate member + relink identity_map |
| 4 | `docs/DEVLOG.md` | Log changes |

## What stays the same
- Admin member CRUD
- Existing login flows (MemberLogin, AdminLogin already fixed)
- All other auth/RLS/permissions
- All other member data

## Smoke Test
1. Google signup ไม่สร้างสมาชิกซ้ำเมื่อ email ต่างแค่ตัวพิมพ์
2. Google login ยังทำงานได้ทั้ง preview และ custom domain
3. หน้า Members แสดงรายการถูกต้อง (ไม่มีซ้ำ)
4. MemberSignup Google button ทำงานได้

