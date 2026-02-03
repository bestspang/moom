
# แผนอัพเดทหน้าตั้งค่าที่เหลือ (Remaining Settings Tabs)

## สรุปการเปลี่ยนแปลง

จากภาพตัวอย่าง ต้องอัพเดท 4 หน้าให้มี layout เหมือน Settings General:

---

## 1. SettingsClass.tsx (การบริหารจัดการคลาส)

### โครงสร้างใหม่: Sidebar + Content

**Sidebar Menu:**
| ID | Label (TH) | Label (EN) |
|----|------------|------------|
| booking | การจองคลาส | Class Booking |
| checkin | การเช็คอิน | Check-in |
| waitlist | รายชื่อผู้รอเรียก | Waitlist |
| cancellation | การยกเลิก | Cancellation |
| noshow | การไม่เข้าคลาส | No-show |

**Section Content:**

### A. การจองคลาส (Class Booking)
- กำหนดระยะเวลาที่สมาชิกสามารถเริ่มจองคลาสล่วงหน้าได้*
  - `3 วัน ก่อนเริ่มคลาส` + edit icon
- กำหนดระยะเวลาสุดท้ายที่สมาชิกสามารถจองคลาสล่วงหน้าได้*
  - `5 นาที ก่อนเริ่มคลาส` + edit icon
- กำหนดจำนวนที่นั่งสูงสุดที่สมาชิกสามารถจองได้ต่อคลาส*
  - `1 ที่นั่งเท่านั้น` + edit icon

### B. การเช็คอิน (Check-in)
- กำหนดระยะเวลาที่สมาชิกสามารถเช็คอินด้วย QR code ได้ก่อนเวลาเริ่มของคลาส*
  - `1 ชั่วโมง ก่อนเริ่มคลาส` + edit icon
- กำหนดระยะเวลาที่สมาชิกสามารถเช็คอินได้สายที่สุดด้วย QR code*
  - `15 นาที หลังจากเริ่มคลาส` + edit icon

### C. รายชื่อผู้รอเรียก (Waitlist)
- ค่าเริ่มต้นสำหรับความจุรายชื่อผู้รอเรียก*
  - `จำนวนเดียวกับความจุของห้องที่เลือก` + edit icon
- ระยะเวลาที่ช้าที่สุดที่สมาชิกสามารถเลื่อนจากรายชื่อผู้รอเรียกไปเป็นการจองที่ว่างโดยอัตโนมัติได้*
  - `1 ชั่วโมง ก่อนเริ่มคลาส` + edit icon

### D. การยกเลิก (Cancellation)
- ช่วงเวลาที่บทลงโทษจะมีผลบังคับใช้สำหรับการยกเลิกการจอง
- ระยะเวลาที่ช้าที่สุดที่สมาชิกสามารถยกเลิกการจองได้ก่อนที่จะถึงช่วงเวลาที่มีบทลงโทษ*
  - `15 นาที ก่อนเริ่มคลาส` + edit icon
- **การยกเลิกการจองที่ใช้แพ็กเกจแบบไม่จำกัด**
  - จำนวนครั้งสูงสุดที่สมาชิกสามารถยกเลิกคลาสล่าช้าที่จองโดยใช้แพ็กเกจแบบไม่จำกัดได้ก่อนจะถูกระงับอัตโนมัติ*
  - `ไม่มี` + edit icon
- **การยกเลิกการจองที่ใช้แพ็กเกจแบบเซสชัน**
  - จำนวนครั้งสูงสุดที่สมาชิกสามารถยกเลิกคลาสล่าช้าที่จองโดยใช้แพ็กเกจแบบเซสชันได้ก่อนจะถูกระงับอัตโนมัติ*
  - `ไม่มี` + edit icon
- การคืนเซสชันในกรณีที่ยกเลิกล่าช้าสำหรับการจองที่ใช้แพ็กเกจแบบเซสชัน*
  - `ไม่คืนเซสชัน` + edit icon

### E. การไม่เข้าคลาส (No-show)
- บทลงโทษสำหรับการไม่เข้าคลาสด้วยแพ็กเกจแบบไม่จำกัด
- จำนวนครั้งสูงสุดที่สมาชิกสามารถไม่เข้าคลาสที่จองโดยใช้แพ็กเกจแบบไม่จำกัดได้ก่อนจะถูกระงับอัตโนมัติ*
  - `2 ครั้ง ใน 7 วัน, ดำเนินการระงับโดยอัตโนมัติเป็นเวลา 7 วัน` + edit icon

---

## 2. SettingsClient.tsx (การบริหารจัดการลูกค้า)

### โครงสร้างใหม่: Sidebar + Content

**Sidebar Menu:**
| ID | Label (TH) |
|----|------------|
| injured | สมาชิกที่มีอาการบาดเจ็บ |
| suspended | สมาชิกที่ถูกระงับ |
| paused | สมาชิกที่พักการใช้งาน |

**Section Content:**

### A. สมาชิกที่มีอาการบาดเจ็บ (Injured Members)
- Description: "กำหนดว่าจะอนุญาตให้สมาชิกที่มีอาการบาดเจ็บจองคลาสหรือไม่"
- Toggle: `อนุญาตการจองทั้งหมดสำหรับสมาชิกที่มีอาการบาดเจ็บ` (enabled in screenshot)
- Toggle: `การจองผ่านแอป Gymmo บนมือถือ` + description (enabled)
- Toggle: `การจองบน Gymmo Console` + description (enabled)

### B. สมาชิกที่ถูกระงับ (Suspended Members)
- Description: "กำหนดว่าจะอนุญาตให้สมาชิกที่ถูกระงับจองคลาสหรือไม่"
- Toggle: `อนุญาตการจองทั้งหมดสำหรับสมาชิกที่ถูกระงับ` (disabled in screenshot)
- Toggle: `การจองผ่านแอป Gymmo บนมือถือ` + description (disabled)
- Toggle: `การจองบน Gymmo Console` + description (disabled)

### C. สมาชิกที่พักการใช้งาน (Paused Members)
- Description: "กำหนดว่าจะอนุญาตให้สมาชิกเปิดใช้งานแพ็กเกจที่พักการใช้งานอีกครั้งหรือไม่"
- Toggle: `สมาชิกสามารถเปิดใช้งานแพ็กเกจที่พักการใช้งานไว้อีกครั้งได้บนแอป Gymmo บนมือถือ`
- Description detail about Gymmo app functionality

---

## 3. SettingsPackage.tsx (แพ็กเกจ)

### โครงสร้างใหม่: Simple content (no sidebar)

**Content:**
- หัวข้อ: `วันหมดอายุ` (orange text)
- Description: "กำหนดเงื่อนไขการเปิดใช้งานแพ็กเกจเพื่อเริ่มนับถอยหลังวันหมดอายุ"
- Value: `เมื่อจองคลาส` + edit icon

---

## 4. SettingsContracts.tsx (สัญญาสมาชิก)

### โครงสร้างใหม่: Simple content (no sidebar)

**Content:**
- หัวข้อ: `สัญญาสมาชิก` (orange text)
- Description: "สัญญาสมาชิกสามารถเปิดให้สมาชิกเซ็นผ่านแอปพลิเคชันหรือปิดได้ ขึ้นอยู่กับการตั้งค่าที่คุณเลือก"
- Toggle: `อนุญาตให้สมาชิกเซ็นสัญญาผ่านแอปพลิเคชันสำหรับสมาชิก`
- Description: "เมื่อเปิดใช้งาน สมาชิกจะได้รับการแจ้งเตือนให้เซ็นสัญญาผ่านแอปพลิเคชันสำหรับสมาชิก"
- Button: `ตั้งค่าสัญญาสมาชิก` (orange outline)

---

## Files to Modify

| File | Description |
|------|-------------|
| `src/pages/settings/SettingsClass.tsx` | Major rewrite - add sidebar + 5 sections |
| `src/pages/settings/SettingsClient.tsx` | Major rewrite - add sidebar + 3 sections |
| `src/pages/settings/SettingsPackage.tsx` | Update layout to match screenshot |
| `src/pages/settings/SettingsContracts.tsx` | Update layout to match screenshot |
| `src/i18n/locales/en.ts` | Add new i18n keys |
| `src/i18n/locales/th.ts` | Add Thai translations |

---

## New i18n Keys (Thai)

```typescript
settings: {
  class: {
    // Sidebar
    booking: 'การจองคลาส',
    checkin: 'การเช็คอิน',
    waitlist: 'รายชื่อผู้รอเรียก',
    cancellation: 'การยกเลิก',
    noshow: 'การไม่เข้าคลาส',
    
    // Booking section
    bookingAdvanceDesc: 'กำหนดระยะเวลาที่สมาชิกสามารถเริ่มจองคลาสล่วงหน้าได้',
    bookingLastDesc: 'กำหนดระยะเวลาสุดท้ายที่สมาชิกสามารถจองคลาสล่วงหน้าได้',
    maxSpotsDesc: 'กำหนดจำนวนที่นั่งสูงสุดที่สมาชิกสามารถจองได้ต่อคลาส',
    daysBeforeClass: '{n} วัน ก่อนเริ่มคลาส',
    minsBeforeClass: '{n} นาที ก่อนเริ่มคลาส',
    hoursBeforeClass: '{n} ชั่วโมง ก่อนเริ่มคลาส',
    minsAfterClass: '{n} นาที หลังจากเริ่มคลาส',
    seatsOnly: '{n} ที่นั่งเท่านั้น',
    
    // Check-in section
    checkinBeforeDesc: 'กำหนดระยะเวลาที่สมาชิกสามารถเช็คอินด้วย QR code ได้ก่อนเวลาเริ่มของคลาส',
    checkinAfterDesc: 'กำหนดระยะเวลาที่สมาชิกสามารถเช็คอินได้สายที่สุดด้วย QR code',
    
    // Waitlist section
    waitlistCapacityDesc: 'ค่าเริ่มต้นสำหรับความจุรายชื่อผู้รอเรียก',
    sameAsRoomCapacity: 'จำนวนเดียวกับความจุของห้องที่เลือก',
    waitlistPromoteDesc: 'ระยะเวลาที่ช้าที่สุดที่สมาชิกสามารถเลื่อนจากรายชื่อผู้รอเรียกไปเป็นการจองที่ว่างโดยอัตโนมัติได้',
    
    // Cancellation section
    cancellationPenaltyDesc: 'ช่วงเวลาที่บทลงโทษจะมีผลบังคับใช้สำหรับการยกเลิกการจอง',
    lateCancelDeadlineDesc: 'ระยะเวลาที่ช้าที่สุดที่สมาชิกสามารถยกเลิกการจองได้ก่อนที่จะถึงช่วงเวลาที่มีบทลงโทษ',
    unlimitedCancelTitle: 'การยกเลิกการจองที่ใช้แพ็กเกจแบบไม่จำกัด',
    unlimitedCancelDesc: 'จำนวนครั้งสูงสุดที่สมาชิกสามารถยกเลิกคลาสล่าช้าที่จองโดยใช้แพ็กเกจแบบไม่จำกัดได้ก่อนจะถูกระงับอัตโนมัติ',
    sessionCancelTitle: 'การยกเลิกการจองที่ใช้แพ็กเกจแบบเซสชัน',
    sessionCancelDesc: 'จำนวนครั้งสูงสุดที่สมาชิกสามารถยกเลิกคลาสล่าช้าที่จองโดยใช้แพ็กเกจแบบเซสชันได้ก่อนจะถูกระงับอัตโนมัติ',
    sessionRefundDesc: 'การคืนเซสชันในกรณีที่ยกเลิกล่าช้าสำหรับการจองที่ใช้แพ็กเกจแบบเซสชัน',
    none: 'ไม่มี',
    noRefund: 'ไม่คืนเซสชัน',
    
    // No-show section
    noshowPenaltyTitle: 'บทลงโทษสำหรับการไม่เข้าคลาสด้วยแพ็กเกจแบบไม่จำกัด',
    noshowPenaltyDesc: 'จำนวนครั้งสูงสุดที่สมาชิกสามารถไม่เข้าคลาสที่จองโดยใช้แพ็กเกจแบบไม่จำกัดได้ก่อนจะถูกระงับอัตโนมัติ',
    noshowLimit: '{n} ครั้ง ใน {days} วัน, ดำเนินการระงับโดยอัตโนมัติเป็นเวลา {suspend} วัน',
  },
  client: {
    // Sidebar
    injuredMembers: 'สมาชิกที่มีอาการบาดเจ็บ',
    suspendedMembers: 'สมาชิกที่ถูกระงับ',
    pausedMembers: 'สมาชิกที่พักการใช้งาน',
    
    // Injured section
    injuredDesc: 'กำหนดว่าจะอนุญาตให้สมาชิกที่มีอาการบาดเจ็บจองคลาสหรือไม่',
    allowAllInjured: 'อนุญาตการจองทั้งหมดสำหรับสมาชิกที่มีอาการบาดเจ็บ',
    bookOnGymmoApp: 'การจองผ่านแอป Gymmo บนมือถือ',
    bookOnGymmoAppDesc: 'สมาชิกที่มีอาการบาดเจ็บสามารถจองคลาสบนแอป Gymmo บนมือถือได้',
    bookOnGymmoConsole: 'การจองบน Gymmo Console',
    bookOnGymmoConsoleDesc: 'อนุญาตให้พนักงานจองคลาสให้กับสมาชิกที่มีอาการบาดเจ็บบน Gymmo Console ได้',
    
    // Suspended section
    suspendedDesc: 'กำหนดว่าจะอนุญาตให้สมาชิกที่ถูกระงับจองคลาสหรือไม่',
    allowAllSuspended: 'อนุญาตการจองทั้งหมดสำหรับสมาชิกที่ถูกระงับ',
    suspendedBookOnAppDesc: 'สมาชิกที่ถูกระงับสามารถจองคลาสบนแอป Gymmo บนมือถือได้',
    suspendedBookOnConsoleDesc: 'อนุญาตให้พนักงานจองคลาสให้กับสมาชิกที่ถูกระงับบน Gymmo Console ได้',
    
    // Paused section
    pausedDesc: 'กำหนดว่าจะอนุญาตให้สมาชิกเปิดใช้งานแพ็กเกจที่พักการใช้งานอีกครั้งหรือไม่',
    allowReactivate: 'สมาชิกสามารถเปิดใช้งานแพ็กเกจที่พักการใช้งานไว้อีกครั้งได้บนแอป Gymmo บนมือถือ',
    pausedReactivateDesc: 'สมาชิกสามารถเปิดใช้งานแพ็กเกจที่พักการใช้งานไว้อีกครั้งได้บนแอป Gymmo บนมือถือ โดยไม่ต้องติดต่อฟิตเนส เมื่อเปิดใช้งานแพ็กเกจอีกครั้งแล้ว สมาชิกจะสามารถดำเนินการจองคลาสต่อได้',
  },
  package: {
    expirationTitle: 'วันหมดอายุ',
    expirationDesc: 'กำหนดเงื่อนไขการเปิดใช้งานแพ็กเกจเพื่อเริ่มนับถอยหลังวันหมดอายุ',
    whenBooking: 'เมื่อจองคลาส',
  },
  memberContracts: {
    title: 'สัญญาสมาชิก',
    description: 'สัญญาสมาชิกสามารถเปิดให้สมาชิกเซ็นผ่านแอปพลิเคชันหรือปิดได้ ขึ้นอยู่กับการตั้งค่าที่คุณเลือก',
    allowSigning: 'อนุญาตให้สมาชิกเซ็นสัญญาผ่านแอปพลิเคชันสำหรับสมาชิก',
    signingDescription: 'เมื่อเปิดใช้งาน สมาชิกจะได้รับการแจ้งเตือนให้เซ็นสัญญาผ่านแอปพลิเคชันสำหรับสมาชิก',
    setupContracts: 'ตั้งค่าสัญญาสมาชิก',
  },
}
```

---

## Layout Pattern (Sidebar Pages)

```text
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────────────────────────┐ │
│ │ การจองคลาส   │ │ การจองคลาส (orange heading)         │ │
│ │ การเช็คอิน   │ │                                     │ │
│ │ รายชื่อผู้รอเรียก│ │ กำหนดระยะเวลาที่สมาชิก...*        │ │
│ │ การยกเลิก    │ │   3 วัน ก่อนเริ่มคลาส ✏️            │ │
│ │ การไม่เข้าคลาส│ │                                     │ │
│ │             │ │ กำหนดระยะเวลาสุดท้าย...*            │ │
│ │             │ │   5 นาที ก่อนเริ่มคลาส ✏️            │ │
│ │             │ │                                     │ │
│ │             │ │ กำหนดจำนวนที่นั่งสูงสุด...*          │ │
│ │             │ │   1 ที่นั่งเท่านั้น ✏️               │ │
│ └─────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Sidebar Component Pattern (reusable)
```typescript
const menuItems = [
  { id: 'booking', label: t('settings.class.booking') },
  { id: 'checkin', label: t('settings.class.checkin') },
  // ...
];

const [activeSection, setActiveSection] = useState('booking');
```

### Setting Item with Edit Icon Pattern
```typescript
<div className="space-y-2">
  <Label className="text-sm text-primary">
    {label} <span className="text-destructive">*</span>
  </Label>
  <div className="flex items-center gap-2">
    <span className="text-sm">{value}</span>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <Pencil className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### Toggle with Description Pattern
```typescript
<div className="space-y-3">
  <div className="flex items-center gap-3">
    <Switch checked={value} onCheckedChange={onChange} />
    <span className="text-sm font-medium">{label}</span>
  </div>
  <p className="text-sm text-muted-foreground ml-12">{description}</p>
</div>
```

---

## Estimated Effort

| Task | Time |
|------|------|
| SettingsClass.tsx rewrite | 1.5 hours |
| SettingsClient.tsx rewrite | 45 min |
| SettingsPackage.tsx update | 15 min |
| SettingsContracts.tsx update | 15 min |
| i18n updates (EN + TH) | 30 min |
| Testing | 30 min |
| **Total** | ~4 hours |

---

## Success Criteria
1. Settings Class มี sidebar 5 sections พร้อม content ครบถ้วน
2. Settings Client มี sidebar 3 sections พร้อม toggles และ descriptions
3. Settings Package แสดง layout ใหม่พร้อม edit icon
4. Settings Contracts แสดง toggle + button ตามตัวอย่าง
5. รองรับ i18n EN/TH ครบถ้วน
6. Edit icon ทำงาน (แม้จะยังไม่มี modal - future development)
