
# แผนการพัฒนาหน้า Room Layouts ให้ตรงกับตัวอย่าง

## สรุปสิ่งที่ต้องเพิ่ม

จากภาพตัวอย่าง พบว่าต้องเพิ่มฟีเจอร์ดังนี้:

### 1. Database Changes
ตาราง `rooms` ปัจจุบันมี: `id`, `name`, `categories[]`, `location_id`, `max_capacity`, `status`

**ต้องเพิ่ม columns:**
| Column | Type | Description |
|--------|------|-------------|
| `name_th` | `text` | ชื่อห้อง (TH) - optional |
| `layout_type` | `enum('open', 'fixed')` | รูปแบบห้อง: เปิดโล่ง / ตำแหน่งคงที่ |

### 2. Room List Page Enhancements

**Current → Target:**
- [x] Search bar
- [x] Create room button
- [x] Status tabs (Open/Closed)
- [ ] **เพิ่ม** คอลัมน์ "รูปแบบ" (Layout type) - แสดง "เปิดโล่ง" หรือ "ตำแหน่งคงที่"
- [ ] **เพิ่ม** Total count header "ทั้งหมด X ห้อง"
- [ ] **เพิ่ม** Pagination display
- [ ] **เพิ่ม** Category filter dropdown
- [ ] **เพิ่ม** Selectable rows (checkboxes)

### 3. Create Room Form (New)

สร้างหน้า/dialog สำหรับสร้างห้องใหม่ตามตัวอย่าง:

**Section: ข้อมูล (Information)**
- ชื่อห้อง (EN)* - required
- ชื่อห้อง (TH) - optional
- สาขา* - Location dropdown (required)

**Section: สิทธิ์เข้าถึง (Access)**
- หมวดหมู่คลาสที่ใช้งานห้องนี้ได้*
  - Radio: ทุกหมวดหมู่คลาส (All) | ระบุหมวดหมู่คลาส (Specific)

**Section: รูปแบบห้อง (Room Layout)**
- รูปแบบห้อง*
  - Radio: พื้นที่แบบเปิดโล่ง (Open) | พื้นที่แบบตำแหน่งคงที่ (Fixed)
- ความจุสูงสุด* - number input

**Footer:**
- Helper text: "โปรดดำเนินการสร้างห้อง"
- ละทิ้ง (Discard) - link style
- บันทึก (Save) - orange button

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_add_room_fields.sql` | Create | Add name_th, layout_type columns + enum |
| `src/components/rooms/CreateRoomDialog.tsx` | Create | Form dialog component |
| `src/pages/Rooms.tsx` | Modify | Add layout column, pagination, filter, checkbox |
| `src/hooks/useRooms.ts` | Modify | Add category filter parameter |
| `src/i18n/locales/en.ts` | Modify | Add room-related i18n keys |
| `src/i18n/locales/th.ts` | Modify | Add Thai translations |

---

## Implementation Steps

### Step 1: Database Migration
```sql
-- Add layout_type enum
CREATE TYPE room_layout_type AS ENUM ('open', 'fixed');

-- Add new columns to rooms table
ALTER TABLE rooms 
  ADD COLUMN name_th TEXT,
  ADD COLUMN layout_type room_layout_type DEFAULT 'open';
```

### Step 2: Update i18n Locales

**English:**
```typescript
rooms: {
  // ... existing
  totalRooms: 'Total {count} rooms',
  layoutType: 'Layout',
  openSpace: 'Open space',
  fixedPositions: 'Fixed positions',
  create: {
    title: 'Create room',
    information: 'Information',
    roomNameEn: 'Room name (EN)',
    roomNameTh: 'Room name (TH)',
    roomNamePlaceholder: 'Enter room name',
    location: 'Location',
    selectLocation: 'Select location',
    access: 'Access',
    categoriesCanUse: 'Class categories that can use this room',
    allCategories: 'All class categories',
    specificCategories: 'Specific class categories',
    roomLayout: 'Room layout',
    openSpaceDesc: 'Open space area',
    fixedPositionsDesc: 'Fixed positions area',
    maxCapacity: 'Maximum capacity',
    maxCapacityPlaceholder: 'Enter maximum capacity',
    helperText: 'Please complete room creation',
    discard: 'Discard',
  },
}
```

**Thai:**
```typescript
rooms: {
  // ... existing
  totalRooms: 'ทั้งหมด {count} ห้อง',
  layoutType: 'รูปแบบ',
  openSpace: 'เปิดโล่ง',
  fixedPositions: 'ตำแหน่งคงที่',
  create: {
    title: 'สร้างห้อง',
    information: 'ข้อมูล',
    roomNameEn: 'ชื่อห้อง (EN)',
    roomNameTh: 'ชื่อห้อง (TH)',
    roomNamePlaceholder: 'ระบุชื่อห้อง',
    location: 'สาขา',
    selectLocation: 'เลือกสาขา',
    access: 'สิทธิ์เข้าถึง',
    categoriesCanUse: 'หมวดหมู่คลาสที่ใช้งานห้องนี้ได้',
    allCategories: 'ทุกหมวดหมู่คลาส',
    specificCategories: 'ระบุหมวดหมู่คลาส',
    roomLayout: 'รูปแบบห้อง',
    openSpaceDesc: 'พื้นที่แบบเปิดโล่ง',
    fixedPositionsDesc: 'พื้นที่แบบตำแหน่งคงที่',
    maxCapacity: 'ความจุสูงสุด',
    maxCapacityPlaceholder: 'ระบุความจุสูงสุด',
    helperText: 'โปรดดำเนินการสร้างห้อง',
    discard: 'ละทิ้ง',
  },
}
```

### Step 3: Create CreateRoomDialog Component

สร้าง `src/components/rooms/CreateRoomDialog.tsx`:
- Form with sections: ข้อมูล, สิทธิ์เข้าถึง, รูปแบบห้อง
- Radio card styling for category and layout selection
- Zod validation with useMemo for i18n
- Integration with useCreateRoom mutation

### Step 4: Update Rooms.tsx

**Changes:**
1. Add `layoutType` column to table
2. Add total count display in header
3. Add pagination support
4. Add category filter dropdown
5. Enable selectable rows
6. Connect "Create room" button to dialog

### Step 5: Update useRooms Hook

- Add `categoryFilter` parameter to query
- Update query to filter by category if specified

---

## Technical Notes

### Radio Card Styling (ตาม Screenshot)
```typescript
<div 
  className={cn(
    "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
    selected 
      ? "border-primary bg-primary/5" 
      : "border-border hover:border-primary/50"
  )}
>
  <RadioGroupItem value={value} />
  <span>{label}</span>
</div>
```

### Form Structure
```text
┌─────────────────────────────────────────┐
│ ← รูปแบบห้อง > สร้างห้อง                    │
├─────────────────────────────────────────┤
│ สร้างห้อง                                  │
│                                          │
│ ข้อมูล (orange heading)                    │
│ ┌───────────────┐ ┌───────────────┐      │
│ │ ชื่อห้อง (EN)* │ │ ชื่อห้อง (TH) │      │
│ └───────────────┘ └───────────────┘      │
│ ┌─────────────────────┐                  │
│ │ สาขา*               ▾│                  │
│ └─────────────────────┘                  │
│                                          │
│ สิทธิ์เข้าถึง (orange heading)              │
│ หมวดหมู่คลาสที่ใช้งานห้องนี้ได้*             │
│ ┌─────────────────┐ ┌─────────────────┐  │
│ │ ● ทุกหมวดหมู่คลาส │ │ ○ ระบุหมวดหมู่คลาส │  │
│ └─────────────────┘ └─────────────────┘  │
│                                          │
│ รูปแบบห้อง (orange heading)                │
│ ┌─────────────────┐ ┌─────────────────┐  │
│ │ ● พื้นที่แบบเปิดโล่ง │ │ ○ พื้นที่แบบตำแหน่งคงที่│  │
│ └─────────────────┘ └─────────────────┘  │
│ ┌─────────────────────┐                  │
│ │ ความจุสูงสุด*        │                  │
│ └─────────────────────┘                  │
├─────────────────────────────────────────┤
│ โปรดดำเนินการสร้างห้อง   [ละทิ้ง] [บันทึก]   │
└─────────────────────────────────────────┘
```

---

## Estimated Effort

| Task | Time |
|------|------|
| Database migration | 10 min |
| i18n updates | 15 min |
| CreateRoomDialog component | 45 min |
| Rooms.tsx enhancements | 30 min |
| useRooms hook update | 10 min |
| Testing | 20 min |
| **Total** | ~2 hours |
