
# แผนการอัพเดทหน้า ตั้งค่า > ทั่วไป

## สรุปการเปลี่ยนแปลง

จากภาพตัวอย่าง หน้า Settings > General ต้องมีโครงสร้างใหม่ดังนี้:

### 1. Layout Structure
**ปัจจุบัน**: Card แบบธรรมดาเรียงต่อกัน
**ใหม่**: แบ่งเป็น 2 columns
- **ซ้าย**: Sidebar menu (วิธีการชำระเงิน, สีธีม, เขตเวลา, ท่าออกกำลังกาย, ยิมเช็คอิน)
- **ขวา**: Content area ตาม menu ที่เลือก

### 2. เนื้อหาแต่ละ Section

#### A. วิธีการชำระเงิน (Payment Methods)
- คำอธิบาย: "วิธีการชำระเงินสามารถเปิดใช้และปิดใช้ได้ ขึ้นอยู่กับเวลาที่ผิดตลับเลือกรับหรือเลือกไม่รับ"
- **โอนผ่านบัญชีธนาคาร**: 
  - Collapsible accordion
  - Toggle per location (Muang Roi Et)
  - ปุ่ม "ระบุบัญชีธนาคาร" (orange outline)
- **Credit card (Stripe)**:
  - Collapsible accordion
  - Fee info: 3.65% + 10 บาท ในประเทศ, 4.75% + 10 บาท ต่างประเทศ
  - Toggle per location
  - ปุ่ม "ตั้งค่า Stripe" (orange outline)
- **QR PromptPay**:
  - Collapsible accordion
  - Fee info: 1.65% + ฿10 per refund
  - Toggle per location
  - ปุ่ม "ตั้งค่า Stripe"
- **ใบกำกับภาษี (Tax Invoice)**:
  - Collapsible section
  - ข้อมูลบริษัท per location
  - Edit icon

#### B. สีธีม (Theme Color)
- หัวข้อ: "เลือกสี"
- **สีเริ่มต้น**: Purple theme card (selected by default)
- **สีธีม ๆ**: Grid of color cards:
  - Orange, Red, Yellow (Orange selected in screenshot)
  - Tan, Olive, Green
  - Lime, Blue, Teal, Gray
- Each card shows: Header bar + 3 accent swatches

#### C. เขตเวลา (Timezone)
- หัวข้อ: "เลือกเขตเวลา"
- Display: "Asia/Bangkok (GMT +07:00)" + edit icon

#### D. ท่าออกกำลังกาย (Workout)
- หัวข้อ: "ท่าออกกำลังกาย"
- Toggle: "รายการท่าออกกำลังกาย"
- Description: "เมื่อใช้รายการท่าออกกำลังกาย เพื่อให้สมาชิกสามารถบันทึกการออกกำลังกายผ่านแอป Gymmo ได้ หากต้องการบันทึกกิจกรรมออกกำลังกาย ให้ไปที่: Gymmo app → Profile → My Workout"

#### E. ยิมเช็คอิน (Gym Check-in)
- หัวข้อ: "ยิมเช็คอิน"
- Toggle: "เปิดใช้งานยิมเช็คอิน" 
- Description about QR code check-in
- **ระบุช่วงเวลาให้สมาชิกเช็คอินยิม***: 
  - "เวลาใดก็ได้" + edit icon

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/settings/SettingsGeneral.tsx` | **Major Rewrite** | New layout with sidebar + sections |
| `src/i18n/locales/en.ts` | Modify | Add new i18n keys |
| `src/i18n/locales/th.ts` | Modify | Add Thai translations |

---

## Implementation Details

### Step 1: Update i18n Locales

เพิ่ม keys ใหม่ใน `settings.general`:

```typescript
settings: {
  general: {
    // ... existing
    // Payment section
    paymentDescription: 'Payment methods can be enabled and disabled...',
    bankTransferDesc: 'Bank account information will be displayed...',
    specifyBankAccount: 'Specify bank account',
    setupStripe: 'Setup Stripe',
    stripeFeeDesc: 'Payment via credit card through Stripe...',
    promptPayDesc: 'PromptPay payment supports bank transfer...',
    
    // Tax Invoice
    taxInvoice: 'Tax invoice',
    taxInvoiceInfo: 'Tax invoice information...',
    
    // Theme
    selectColor: 'Select color',
    defaultColor: 'Default',
    otherColors: 'Other colors',
    
    // Timezone
    selectTimezone: 'Select timezone',
    
    // Workout
    workoutDesc: 'When using workout list, members can log...',
    
    // Gym Check-in
    enableGymCheckin: 'Enable gym check-in',
    gymCheckinDesc: 'Allow members to check-in via QR code...',
    specifyCheckinTime: 'Specify check-in time for members',
    anytime: 'Anytime',
  }
}
```

### Step 2: Rewrite SettingsGeneral.tsx

**New Structure:**

```
┌──────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌────────────────────────────────────┐   │
│ │ วิธีการชำระเงิน│ │ วิธีการชำระเงิน                      │   │
│ │ สีธีม        │ │ [description text]                │   │
│ │ เขตเวลา      │ │                                   │   │
│ │ ท่าออกกำลังกาย│ │ ▼ โอนผ่านบัญชีธนาคาร              │   │
│ │ ยิมเช็คอิน    │ │   [toggle] Muang Roi Et [button] │   │
│ │             │ │                                   │   │
│ │             │ │ ▼ Credit card (Stripe)            │   │
│ │             │ │   [description]                   │   │
│ │             │ │   [toggle] Muang Roi Et [button] │   │
│ │             │ │                                   │   │
│ │             │ │ ▼ QR PromptPay                    │   │
│ │             │ │   ...                             │   │
│ └─────────────┘ └────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Components to use:**
- `useState` for active section
- `Accordion` from Radix UI for collapsible payment sections
- Radio card layout for theme colors
- Grid layout for theme color cards

### Step 3: Theme Color Cards

Each card structure:
```
┌─────────────────────────────┐
│ ████████████████████████████│ ← Header bar (main color)
│                             │
│ ██    ██    ██              │ ← 3 accent swatches
└─────────────────────────────┘
```

Color themes to support:
1. Purple (default) - #9b87f5
2. Magenta - #D946EF
3. Red - #ea384c
4. Orange - #FF9500 (app primary)
5. Tan - #C4A77D
6. Olive - #9B8E5E
7. Green - #22C55E
8. Lime - #84CC16
9. Blue - #0EA5E9
10. Teal - #14B8A6
11. Gray - #6B7280

---

## UI/UX Notes

### Sidebar Menu Styling
- Active item: Orange text + orange left border
- Inactive: Gray text
- Hover: Slight background highlight

### Accordion Styling
- Chevron icon for expand/collapse
- Orange heading text
- Smooth animation

### Theme Card Styling
- Selected: Orange border ring
- Unselected: Light border
- Clickable with hover effect

---

## Technical Notes

### State Management
```typescript
const [activeSection, setActiveSection] = useState<'payment' | 'theme' | 'timezone' | 'workout' | 'gymCheckin'>('payment');
```

### Theme Colors Data Structure
```typescript
const themeColors = [
  { id: 'purple', main: '#9b87f5', accents: ['#6E59A5', '#8B5CF6', '#C4B5FD'] },
  { id: 'orange', main: '#FF9500', accents: ['#C27500', '#FF9500', '#FFB84D'] },
  // ...
];
```

---

## Estimated Effort

| Task | Time |
|------|------|
| i18n updates | 20 min |
| SettingsGeneral.tsx rewrite | 1.5 hours |
| Theme color cards | 30 min |
| Accordion styling | 20 min |
| Testing | 30 min |
| **Total** | ~3 hours |

---

## Success Criteria
1. Sidebar menu แสดง 5 sections และเปลี่ยน content ตามที่เลือก
2. Payment methods มี accordion แบบ collapsible
3. Theme colors แสดง cards แทน circles
4. Timezone แสดง "Asia/Bangkok (GMT +07:00)" พร้อม edit icon
5. Gym check-in มี toggle และ time configuration
6. รองรับ i18n EN/TH ครบถ้วน
