

# แก้ไข 404 หน้ารายงาน

## สาเหตุของปัญหา

| ไฟล์ | ปัจจุบัน | ควรจะเป็น |
|------|---------|----------|
| Sidebar.tsx (line 132) | `/report/member` | `/report` |
| App.tsx (line 98) | `/report` | ถูกต้องแล้ว |

Sidebar ลิงก์ไปที่ `/report/member` แต่ route ที่มีใน App.tsx คือ `/report` เท่านั้น

---

## วิธีแก้ไข

แก้ไขไฟล์ `src/components/layout/Sidebar.tsx` บรรทัด 132:

**Before:**
```typescript
{ label: t('nav.reports'), path: '/report/member', icon: BarChart3, minLevel: 'level_2_operator' },
```

**After:**
```typescript
{ label: t('nav.reports'), path: '/report', icon: BarChart3, minLevel: 'level_2_operator' },
```

---

## ไฟล์ที่ต้องแก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `src/components/layout/Sidebar.tsx` | แก้ path จาก `/report/member` เป็น `/report` |

---

## ผลที่คาดหวัง

- กดเมนู "รายงาน" แล้วเข้าหน้า Reports ได้ปกติ
- แสดง tabs สมาชิก/คลาส/แพ็กเกจ

