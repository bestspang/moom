

# Feature Flags Management + Booking UI Plan

## Overview

สร้าง 2 ฟีเจอร์:
1. **Feature Flags page** ใน Settings — แสดงรายการ flags ทั้งหมด พร้อม toggle เปิด/ปิดได้
2. **Booking Management** ใน Schedule page — staff คลิกที่คลาสแล้วจอง/ยกเลิก/เช็คชื่อสมาชิกได้

---

## 1. Feature Flags Settings Page

### New File: `src/pages/settings/SettingsFeatureFlags.tsx`

- ใช้ `SettingsLayout` pattern เดิม (sidebar + content)
- แสดงรายการ feature flags จาก `useFeatureFlags()` hook
- แต่ละ flag แสดง: name, description, scope badge, Switch toggle
- Toggle เรียก `useToggleFeatureFlag()` mutation
- Loading skeleton + empty state
- ไม่ต้องมี create/delete UI ตอนนี้ (flags มาจาก seed data)

### Modified Files

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | เพิ่ม tab "Feature Flags" |
| `src/App.tsx` | เพิ่ม route `/setting/feature-flags` |
| `src/i18n/locales/en.ts` | เพิ่ม settings.tabs.featureFlags key |
| `src/i18n/locales/th.ts` | เพิ่ม settings.tabs.featureFlags key |

---

## 2. Booking Management UI for Schedule

### New File: `src/components/schedule/BookingManagementDialog.tsx`

Dialog/Drawer ที่เปิดเมื่อ staff คลิกที่ row ในตาราง Schedule:

```text
┌─────────────────────────────────────────┐
│ Yoga Flow — 09:00-10:00                 │
│ Trainer: สมชาย  |  Room: A  |  4/20     │
├─────────────────────────────────────────┤
│ [+ Add Member]                          │
│                                         │
│ Bookings (4)                            │
│ ┌───────────────────────────────────┐   │
│ │ 🟢 สมหญิง (M001) — booked       │   │
│ │    [✓ Attended] [✗ No Show] [Cancel]│  │
│ │ 🟢 สมศรี (M002) — booked         │   │
│ │    [✓ Attended] [✗ No Show] [Cancel]│  │
│ └───────────────────────────────────┘   │
│                                         │
│ Waitlist (1)                            │
│ ┌───────────────────────────────────┐   │
│ │ #1 สมปอง (M003)  [Promote]       │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Features:**
- แสดง bookings list พร้อม status badge
- ปุ่ม "Add Member" → เปิด member search combobox → เลือก → create booking
- ปุ่ม mark attended / no_show / cancel per booking
- แสดง waitlist พร้อมปุ่ม promote
- Mobile: ใช้ Drawer, Desktop: ใช้ Dialog

### New File: `src/components/schedule/AddBookingForm.tsx`

- Member search (combobox) ค้นหาจาก `useMembers` hook
- เลือก member → auto-create booking
- แสดง error ถ้า member จองอยู่แล้ว

### Modified: `src/pages/Schedule.tsx`

- เพิ่ม `onRowClick` handler ที่เปิด `BookingManagementDialog`
- เพิ่ม column "Actions" หรือ "Booked" count ที่คลิกได้
- เพิ่ม state สำหรับ selected schedule

---

## 3. i18n Keys to Add

```typescript
// settings
settings.tabs.featureFlags: 'Feature Flags' / 'Feature Flags'

// booking management  
schedule.manageBookings: 'Manage Bookings' / 'จัดการการจอง'
schedule.addMember: 'Add Member' / 'เพิ่มสมาชิก'
schedule.searchMember: 'Search member...' / 'ค้นหาสมาชิก...'
schedule.bookings: 'Bookings' / 'การจอง'
schedule.markAttended: 'Attended' / 'เข้าเรียนแล้ว'
schedule.markNoShow: 'No Show' / 'ไม่มาเรียน'
schedule.promote: 'Promote' / 'โปรโมท'
schedule.booked: 'Booked' / 'จองแล้ว'
```

---

## 4. Implementation Order

1. Create `SettingsFeatureFlags.tsx`
2. Add Feature Flags tab to Settings + route
3. Create `BookingManagementDialog.tsx` + `AddBookingForm.tsx`
4. Update `Schedule.tsx` with row click → booking dialog
5. Add all i18n keys
6. Test both features

---

## 5. Files Summary

### Create (3 files)
| File | Purpose |
|------|---------|
| `src/pages/settings/SettingsFeatureFlags.tsx` | Feature flags management page |
| `src/components/schedule/BookingManagementDialog.tsx` | Booking list + actions per schedule |
| `src/components/schedule/AddBookingForm.tsx` | Member search + add booking |

### Modify (5 files)
| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | +1 tab |
| `src/App.tsx` | +1 route |
| `src/pages/Schedule.tsx` | +row click → dialog |
| `src/i18n/locales/en.ts` | +booking management keys |
| `src/i18n/locales/th.ts` | +booking management keys |

