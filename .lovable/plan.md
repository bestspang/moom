

# Redesign: Member Check-In Page — Thumb-Friendly 3-Zone Layout

## ปัญหา UX ปัจจุบัน
1. **ปุ่ม "Tap to Scan" อยู่บนสุด** — ไกลนิ้วโป้ง ใช้มือเดียวลำบาก
2. **Member QR อยู่กลาง** — ขนาดเล็ก ข้อมูลรอบข้างแน่น
3. **ช่อง code input อยู่ล่าง** — ตำแหน่งดี แต่ไม่มี context ว่าใช้ทำอะไร
4. **Streak แสดงแค่ตัวเลข** — ไม่ motivate ให้อยากกลับมา
5. **ไม่มี feedback สถานะว่าวันนี้เช็คอินแล้วหรือยัง**

## Layout ใหม่ (Mobile-First, Thumb Zone Design)

```text
┌──────────────────────────────┐
│  Header: "เช็คอิน" + สถานะ  │  ← บอกชัดว่าวันนี้เช็คอินแล้วหรือยัง
│                              │
│  ┌────────────────────────┐  │
│  │   ▓▓▓ Member QR ▓▓▓   │  │  ← ใหญ่ขึ้น, เด่นชัด
│  │   (staff scans this)   │  │
│  │   ⏱ 0:25              │  │  ← countdown ในการ์ดเดียวกัน
│  └────────────────────────┘  │
│                              │
│  ── or enter code ──        │
│  [ Enter code...    ] [→]   │
│                              │
│  🔥 5 wk streak  M T W T F │  ← streak + weekly dots
│                              │
│  ┌────────────────────────┐  │
│  │  📷  Scan QR at gym    │  │  ← CTA button ใหญ่, อยู่ล่าง
│  │  (tap to open camera)  │  │     ใกล้นิ้วโป้ง, กดได้ทันที
│  └────────────────────────┘  │
│                              │
│  [bottom nav]               │
└──────────────────────────────┘
```

## เหตุผลของ layout นี้

| ตำแหน่ง | สิ่งที่ใส่ | ทำไม |
|---------|-----------|------|
| **บนสุด** | สถานะเช็คอิน | ดูปุ๊บรู้เลยว่าวันนี้ทำแล้วยัง |
| **กลาง** | Member QR ขนาดใหญ่ | use case หลัก — ยื่นให้ staff สแกน, เห็นชัด |
| **กลาง-ล่าง** | Code input + Streak | ข้อมูลเสริม + motivation |
| **ล่างสุด** | ปุ่ม Scan QR (primary CTA) | **Thumb zone** — กดสะดวกมือเดียว |

## รายละเอียดการเปลี่ยนแปลง

### 1. Header Status Bar (ใหม่)
- แสดงข้อความสั้น: "พร้อมเช็คอิน" หรือ "เช็คอินแล้ววันนี้ ✓"
- ใช้สีเขียว/primary ตาม status

### 2. Member QR Section — ย้ายขึ้นบน, ขยายใหญ่
- QR size: `200px` (จาก 160px)
- Card style: padding มากขึ้น, shadow เด่นขึ้น
- Countdown อยู่ในการ์ดเดียวกัน แทนที่จะเป็นข้อความแยก
- ข้อความ "แสดงให้พนักงาน" ชัดเจนขึ้น

### 3. Code Input — เหมือนเดิม แต่ปรับ styling
- Placeholder ชัดขึ้น: "กรอกรหัสเช็คอินหรือรีดีม"
- rounded-full สำหรับปุ่ม submit ให้ดูนุ่มขึ้น

### 4. Streak — ย้ายมาอยู่กลาง, เพิ่ม encouragement
- ย้ายจากล่างสุดมาอยู่ก่อนปุ่ม scan
- เพิ่มข้อความ motivation สั้นๆ เช่น "Keep going! 🔥"

### 5. Scan Button — ย้ายลงล่างสุด (CTA หลัก)
- ปุ่มใหญ่ full-width, primary color
- Icon กล้อง + ข้อความ "สแกน QR ที่ยิม"
- เมื่อกด → เปิด camera viewfinder เต็มหน้าจอ (overlay)
- **Camera overlay**: เมื่อเปิดกล้อง จะเป็น overlay เต็มจอ + ปุ่ม close
- ไม่ใช่แค่ส่วนเล็กๆ บนหน้า — ทำให้ scan ง่ายขึ้น

### 6. Camera เป็น Full-Screen Overlay
- เมื่อกด Scan → overlay เต็มจอ มี viewfinder ตรงกลาง
- ปุ่ม X ที่มุมบน close กลับมาหน้าเดิม
- Processing state แสดงใน overlay เดียวกัน
- เหตุผล: กล้องต้องการพื้นที่ + ไม่ต้อง scroll ดู QR ของตัวเอง

## ไฟล์ที่เปลี่ยน

| # | ไฟล์ | การเปลี่ยนแปลง |
|---|------|----------------|
| 1 | `src/apps/member/pages/MemberCheckInPage.tsx` | เขียนใหม่: สลับ layout, ปุ่ม scan ลงล่าง, QR ขึ้นบน, camera เป็น overlay |
| 2 | `src/i18n/locales/en.ts` | เพิ่ม keys: `readyToCheckIn`, `checkedInToday`, `scanAtGym`, `keepGoing` |
| 3 | `src/i18n/locales/th.ts` | เพิ่ม keys เดียวกันภาษาไทย |

## สิ่งที่ไม่เปลี่ยน
- Camera state machine logic (ready/scanning/processing/fallback) — เหมือนเดิม
- `useValidateQRToken`, `fireGamificationEvent` — ใช้ตัวเดิม
- `CheckInCelebration` dialog — เหมือนเดิม
- `MemberBottomNav` — ไม่แตะ
- ไม่มี backend change

