

# Plan: Add Debug Logging + Error Boundary for MemberHeader

## Analysis

Code review ของ `MemberHeader.tsx` และ `MemberLayout.tsx` — ไม่มี condition ที่จะซ่อน header เอง ปัญหาน่าจะเป็น:
1. **MemberHeader crash silently** — hook ข้างใน (เช่น `useNotifications`, `useMemberSession`) throw error ทำให้ component ไม่ render
2. **Auth state race** — `user` เป็น `null` ชั่วขณะ ทำให้ redirect ไป `/login`

## Changes

### 1. Add Error Boundary component (`src/apps/member/components/MemberHeaderErrorBoundary.tsx`)
- React class component Error Boundary ครอบ `MemberHeader`
- Fallback: แสดง header bar เรียบๆ (brand + "MOOM") + error message ใน console
- จะ catch ทุก render error ที่เกิดใน MemberHeader

### 2. Add console.log debug ใน `MemberLayout.tsx`
- Log `user`, `loading` state ทุกครั้งที่ render
- Log which branch is taken (loading / redirect / render layout)

### 3. Add console.log debug ใน `MemberHeader.tsx`
- Log mount/render + key state values (`allRoles`, `user?.id`, `firstName`)

### 4. Update `MemberLayout.tsx` to wrap MemberHeader with Error Boundary

## Files
1. **NEW** `src/apps/member/components/MemberHeaderErrorBoundary.tsx`
2. **EDIT** `src/apps/member/layouts/MemberLayout.tsx` — add debug logs + wrap with error boundary
3. **EDIT** `src/apps/member/components/MemberHeader.tsx` — add debug log at top of render

