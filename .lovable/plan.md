

# Phase 3: LINE Auth Edge Function + LIFF Login Flow

## Overview

สร้าง Edge Function สำหรับ verify LINE LIFF token และ LIFF login shell — วาง infrastructure ไว้ก่อน แล้วค่อยใส่ LINE credentials ทีหลัง

---

## 1. Edge Function: `line-auth`

สร้าง `supabase/functions/line-auth/index.ts`

**Endpoints:**
- `POST /` — รับ `idToken` จาก LIFF SDK → verify กับ LINE API → หา/สร้าง user ใน `line_users` → return session info
- Flow:
  1. รับ `{ idToken, liffAccessToken? }` จาก client
  2. Verify idToken กับ `https://api.line.me/oauth2/v2.1/verify` (ต้องใช้ `LINE_CHANNEL_ID`)
  3. ได้ `sub` (lineUserId), `name`, `picture`
  4. ค้นหา `line_users` ตาม `line_user_id`
     - ถ้ามี → update `last_login_at`, return member info
     - ถ้าไม่มี → return `{ needsLinking: true, lineProfile }` เพื่อให้ client ไปหน้า link account
  5. ถ้า linked กับ member → return member data + session token

**Config:** เพิ่มใน `supabase/config.toml`:
```toml
[functions.line-auth]
verify_jwt = false
```

**Secrets ที่ต้องใส่ภายหลัง:** `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`

---

## 2. LIFF App Routes + Shell

### A. New Routes (public, ไม่ผ่าน ProtectedRoute)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/liff/member` | LiffMemberApp | Member LIFF shell |
| `/liff/trainer` | LiffTrainerApp | Trainer LIFF shell |
| `/liff/callback` | LiffCallback | Handle LIFF login redirect |

### B. LIFF Context Provider

สร้าง `src/contexts/LiffContext.tsx`:
- Detect ว่าเปิดจาก LIFF หรือไม่ (check URL params / user agent)
- เก็บ LINE profile (userId, displayName, pictureUrl)
- เก็บ linked member info (ถ้ามี)
- Provide `isInLiff`, `lineProfile`, `memberData`, `isLinked`

### C. LIFF Member Shell (`src/pages/liff/LiffMemberApp.tsx`)

Mobile-first layout:
- Bottom navigation: หน้าแรก / จองคลาส / แพ็กเกจ / QR เช็คอิน / โปรไฟล์
- หน้าแรก: แสดงชื่อ + แพ็กเกจเหลือ + คลาสถัดไป
- ทุกหน้าเป็น Coming Soon placeholder ก่อน

### D. LIFF Trainer Shell (`src/pages/liff/LiffTrainerApp.tsx`)

Mobile-first layout:
- Bottom navigation: ตารางวันนี้ / เช็คชื่อ / PT Log / สมาชิก
- ทุกหน้าเป็น Coming Soon placeholder ก่อน

---

## 3. Hook: `useLineAuth`

สร้าง `src/hooks/useLineAuth.ts`:
- `loginWithLine(idToken)` → call edge function
- `linkAccount(lineUserId, memberId)` → link LINE to member
- `getLineProfile()` → get profile from context
- Handle error states (token expired, already linked, etc.)

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/line-auth/index.ts` | LINE token verification edge function |
| `src/contexts/LiffContext.tsx` | LIFF state management |
| `src/pages/liff/LiffMemberApp.tsx` | Member LIFF shell |
| `src/pages/liff/LiffTrainerApp.tsx` | Trainer LIFF shell |
| `src/pages/liff/LiffCallback.tsx` | LIFF login callback handler |
| `src/hooks/useLineAuth.ts` | LINE auth hook |
| `src/components/liff/LiffBottomNav.tsx` | Shared bottom navigation |
| `src/components/liff/LiffComingSoon.tsx` | Coming soon placeholder for LIFF pages |

## 5. Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/liff/*` public routes |
| `supabase/config.toml` | Add `[functions.line-auth]` |
| `src/i18n/locales/en.ts` | Add LIFF i18n keys |
| `src/i18n/locales/th.ts` | Add LIFF i18n keys |

---

## 6. Implementation Order

1. Create `line-auth` edge function (with placeholder for LINE_CHANNEL_ID)
2. Create `LiffContext` provider
3. Create `LiffBottomNav` + `LiffComingSoon` components
4. Create Member LIFF shell
5. Create Trainer LIFF shell
6. Create `LiffCallback` page
7. Create `useLineAuth` hook
8. Add routes to App.tsx
9. Add i18n keys

---

## 7. Edge Function: Designed for Future

เมื่อมี LINE credentials:
1. ใส่ `LINE_CHANNEL_ID` + `LINE_CHANNEL_SECRET` เป็น secrets
2. Edge function จะ verify token กับ LINE API ได้จริง
3. LIFF SDK จะ init ได้ (ต้องใส่ LIFF ID)

ตอนนี้ edge function จะ return mock/error response ที่บอกว่ายังไม่ได้ config credentials เพื่อให้ทดสอบ flow ได้

