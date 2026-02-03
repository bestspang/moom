
# UX/UI Audit & Improvement Plan - MOOM CLUB v0.0.1

## Progress Status

### ✅ Phase 1: Critical (COMPLETED)
1. ✅ แก้ไข non-functional buttons (QR hidden, Report cards show "coming soon" toast, Support is now tel: link)
2. ✅ สร้าง ForgotPassword page (`src/pages/Auth/ForgotPassword.tsx`)
3. ✅ สร้าง Profile page (`src/pages/Profile.tsx`)
4. ✅ แก้ไข hardcoded English text เป็น i18n
   - CreateMemberDialog: nickname, gender, date of birth, address
   - Members table: nickname, ID columns
   - Dashboard: attendees, MOOM CLUB Main
   - NotFound: page not found message
5. ✅ Fix Edit Profile navigation in Header
6. ✅ Remove dead Terms/Privacy links from Sidebar

### Phase 2: High (สำคัญ) - UX Issues
- [ ] ปรับปรุง EmptyState ให้มี context-aware icon และ CTA
- [ ] แก้ไข form validation messages เป็น i18n
- [ ] ปรับปรุง mobile responsiveness (DataTable, Dialogs)

### Phase 3: Medium (ปานกลาง) - Polish
- [ ] ปรับปรุง color contrast
- [ ] เพิ่ม loading/transition animations
- [ ] Accessibility improvements (aria-labels, focus states)

### Phase 4: Low (ทำทีหลังได้) - Enhancement
- [ ] Dashboard cards navigation
- [ ] Skeleton loader sizing
- [ ] Settings tab semantics

---

## Files Created
- `src/pages/Auth/ForgotPassword.tsx`
- `src/pages/Profile.tsx`

## Files Modified
- `src/i18n/locales/en.ts` - Added new translation keys
- `src/i18n/locales/th.ts` - Added Thai translations
- `src/components/members/CreateMemberDialog.tsx` - i18n for form fields
- `src/pages/Members.tsx` - i18n for table headers
- `src/pages/Dashboard.tsx` - i18n for hardcoded strings, removed QR button
- `src/pages/NotFound.tsx` - i18n and improved design
- `src/components/layout/Header.tsx` - Support link and Edit Profile navigation
- `src/components/layout/Sidebar.tsx` - Removed dead links
- `src/pages/Schedule.tsx` - Removed non-functional QR column
- `src/pages/Reports.tsx` - Added "Coming soon" toast on click
- `src/App.tsx` - Added new routes

---

## หมวดที่ 7: Button & Element Functionality

### ปัญหาที่พบ

| Element | ปัญหา | Functional? | แนวทางแก้ไข |
|---------|-------|-------------|--------------|
| **QR button** (Schedule) | มีปุ่มแต่ไม่ทำอะไร | ❌ | ซ่อนไว้ก่อน หรือ implement QR generation |
| **Report cards** | Clickable appearance แต่ไม่ navigate | ❌ | เพิ่ม routing หรือ show "Coming soon" toast |
| **Terms & Privacy links** | `href="#"` - ไม่ไปไหน | ❌ | สร้างหน้า Terms/Privacy หรือ link ไปภายนอก |
| **Support button** | Clickable แต่ไม่ทำอะไร | ❌ | เพิ่ม tel: link หรือ support modal |
| **Edit profile** | ใน user dropdown แต่ไม่ navigate | ❌ | สร้างหน้า Profile หรือ modal |
| **Forgot password** | Link ไป `/forgot-password` ที่ไม่มี | ❌ | สร้างหน้า ForgotPassword |
| **Remember me checkbox** | มี checkbox แต่ไม่ implement | ❌ | Implement localStorage หรือซ่อน |
| **Notification click** | Mark as read แต่ไม่ navigate ไปที่เกี่ยวข้อง | ⚠️ | เพิ่ม navigation based on notification type |

### Files ที่ต้องแก้ไข
- `src/pages/Schedule.tsx`
- `src/pages/Reports.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/pages/Auth/Login.tsx`
- Need to create: `src/pages/Auth/ForgotPassword.tsx`, `src/pages/Profile.tsx`

---

## หมวดที่ 8: Loading & Transition States

### ปัญหาที่พบ

| Component | ปัญหา | แนวทางแก้ไข |
|-----------|-------|-------------|
| **Skeleton loaders** | ใช้ fixed heights (h-12, h-32) - ไม่ match content จริง | ใช้ aspect-ratio หรือ match real content size |
| **Page transitions** | ไม่มี transition animation ระหว่างหน้า | เพิ่ม fade/slide transition |
| **Button loading** | บาง buttons ใช้ Loader2 บางที่ไม่ใช้ | Standardize loading indicator |
| **Tab switching** | ไม่มี animation | เพิ่ม smooth transition |
| **Sidebar collapse** | `transition-transform duration-200` - อาจเร็วไป | เพิ่มเป็น 300ms |

---

## หมวดที่ 9: Accessibility Issues

### ปัญหาที่พบ

| Element | ปัญหา | แนวทางแก้ไข |
|---------|-------|-------------|
| **Icons without labels** | QrCode, MoreVertical, Bell icons ไม่มี aria-label | เพิ่ม aria-label หรือ sr-only text |
| **Color alone for status** | StatusBadge ใช้สีอย่างเดียว distinguish status | เพิ่ม icon หรือ pattern |
| **Focus states** | ไม่เห็นชัด บางที่ไม่มีเลย | เพิ่ม visible focus ring |
| **Skip links** | ไม่มี skip to main content link | เพิ่มสำหรับ keyboard users |
| **Form labels** | บาง inputs ไม่มี associated label | ตรวจสอบ htmlFor ทุก input |

---

## หมวดที่ 10: Consistency & Polish

### ปัญหาที่พบ

| Pattern | Inconsistency | แนวทางแก้ไข |
|---------|---------------|--------------|
| **Button text** | บางที่ใช้ "Create member" บางที่ "สร้างสมาชิก" - ขึ้นกับ language | OK - i18n ทำงานถูกต้อง |
| **Date formats** | ใช้ `d MMM yyyy` แต่ไม่ localize month names | ใช้ date-fns locale |
| **Currency format** | `formatCurrency` OK แต่ hardcode ฿ | ดึงจาก settings |
| **Spacing** | `mb-6` ใช้ทั่วไป แต่บางที่ใช้ `mb-4` | Standardize spacing scale |
| **Card shadows** | `shadow-card` define แต่บางที่ไม่ใช้ | Apply consistently |

---

## Implementation Priority

### Phase 1: Critical (ทำก่อน) - Functional Issues
1. แก้ไข non-functional buttons (QR, Report cards, Terms, Support)
2. สร้าง ForgotPassword page
3. แก้ไข hardcoded English text เป็น i18n

### Phase 2: High (สำคัญ) - UX Issues
4. ปรับปรุง EmptyState ให้มี context-aware icon และ CTA
5. แก้ไข form validation messages เป็น i18n
6. ปรับปรุง mobile responsiveness (DataTable, Dialogs)

### Phase 3: Medium (ปานกลาง) - Polish
7. ปรับปรุง color contrast
8. เพิ่ม loading/transition animations
9. Accessibility improvements (aria-labels, focus states)

### Phase 4: Low (ทำทีหลังได้) - Enhancement
10. Dashboard cards navigation
11. Skeleton loader sizing
12. Settings tab semantics

---

## Files to Create
```text
src/pages/Auth/ForgotPassword.tsx
src/pages/Profile.tsx
src/pages/TermsAndConditions.tsx
src/pages/PrivacyPolicy.tsx
```

## Files to Modify (Total: ~25 files)
```text
src/i18n/locales/en.ts
src/i18n/locales/th.ts
src/index.css
src/components/common/EmptyState.tsx
src/components/common/StatusBadge.tsx
src/components/common/DataTable.tsx
src/components/members/CreateMemberDialog.tsx
src/components/schedule/ScheduleClassDialog.tsx
src/components/layout/Header.tsx
src/components/layout/Sidebar.tsx
src/pages/Auth/Login.tsx
src/pages/Dashboard.tsx
src/pages/Members.tsx
src/pages/Schedule.tsx
src/pages/Reports.tsx
src/pages/Settings.tsx
src/pages/NotFound.tsx
src/pages/Finance.tsx
src/App.tsx (add new routes)
```

---

## Estimated Effort

| Phase | Files | Estimated Time |
|-------|-------|----------------|
| Phase 1 | 8 files | 4-6 hours |
| Phase 2 | 10 files | 6-8 hours |
| Phase 3 | 8 files | 4-6 hours |
| Phase 4 | 6 files | 3-4 hours |
| **Total** | ~25 files | 17-24 hours |

---

## Next Steps

1. **Approve this plan** to begin implementation
2. Start with **Phase 1: Critical Issues** - fixing non-functional elements
3. Test all changes on mobile and desktop
4. Verify Thai/English language switching works correctly
