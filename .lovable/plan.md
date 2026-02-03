
# แผนอัพเดทหน้ารายงาน (Reports)

## สรุปการเปลี่ยนแปลง

จากภาพตัวอย่าง หน้า Reports ต้องเปลี่ยน layout และเพิ่ม report detail pages ใหม่

---

## 1. Reports Index Page (หน้าหลัก)

### ปัจจุบัน vs ใหม่

| ปัจจุบัน | ใหม่ |
|---------|-----|
| Grid cards 4 columns | List format แนวตั้ง |
| Card with title + description | Title (สีส้ม) + description + button |
| Click card to navigate | Button "ดูรายงานฉบับเต็ม" หรือ "ส่งออกรายงาน" |

### Layout ใหม่
```
┌─────────────────────────────────────────────────────────────────┐
│ รายงาน                                                          │
├─────────────────────────────────────────────────────────────────┤
│ [สมาชิก] [คลาส] [แพ็กเกจ]                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ จำนวนสมาชิกที่มีการใช้งานอยู่ (รวมยอดทั้งหมดที่ผ่านมา)           │
│ แสดงจำนวนสมาชิกที่มีการใช้งานฟิตเนสนี้ (รวมยอดทั้งหมดที่ผ่านมา)     │ [ดูรายงานฉบับเต็ม] │
│                                                                 │
│ สมาชิกกลุ่มเสี่ยง                                                 │
│ แสดงจำนวนสมาชิกที่เสี่ยงตามจำนวนครั้งที่เหลือและวันหมดอายุของแพ็กเกจ │ [ดูรายงานฉบับเต็ม] │
│                                                                 │
│ การใช้งานแพ็กเกจของสมาชิก                                        │
│ แสดงภาพรวมการใช้งานแพ็กเกจของสมาชิกภายในช่วงเวลาที่เลือก           │ [ส่งออกรายงาน] │
│                                                                 │
│ แพ็กเกจสมาชิกที่มีความเสี่ยง                                       │
│ แสดงแพ็กเกจที่มีความเสี่ยงของสมาชิก โดยพิจารณาจากจำนวนคงเหลือและวันหมดอายุ │ [ส่งออกรายงาน] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Report Detail Pages (ต้องสร้างใหม่)

### A. จำนวนสมาชิกที่มีการใช้งานอยู่ (Active Members Over Time)
**Route**: `/report/member/active-members`

**Components:**
- Filters: วันที่, อายุ, เพศ, สาขา
- Stats Cards:
  - สมาชิกที่มีการใช้งานมากที่สุดในหนึ่งวัน
  - สมาชิกที่มีการใช้งานน้อยที่สุดในหนึ่งวัน
  - จำนวนสมาชิกที่มีการใช้งานโดยเฉลี่ยต่อวัน
  - จำนวนสมาชิกใหม่ที่มีการใช้งานโดยเฉลี่ยต่อวัน
- Chart: Bar chart แสดง active members ตาม date
- Table: วันที่, จำนวนสมาชิกที่มีการใช้งานอยู่, สาขา, อายุ, เพศ

### B. สมาชิกกลุ่มเสี่ยง (Members At Risk) - ปรับปรุง
**Route**: `/report/member/members-at-risk` (มีอยู่แล้ว)

**ปรับปรุง:**
- เปลี่ยน Pie Chart เป็น Donut Chart ขนาดใหญ่ขึ้น
- ปรับ layout stat cards ด้านขวา
- ปรับ filter buttons ด้านล่าง chart
- ปรับ table columns ให้ตรงกับภาพ

### C. ความจุของคลาสตามชั่วโมงของวัน (Class Capacity by Hour)
**Route**: `/report/class/capacity-by-hour`

**Components:**
- Filters: วันที่, เทรนเนอร์, สาขา
- Stats Cards:
  - ความจุของคลาสโดยเฉลี่ย
  - คลาสที่มีการจอง
  - จำนวนคลาสโดยเฉลี่ยต่อวัน
  - วันและเวลาที่มีความจุคลาสสูงสุด
- Heatmap: ตารางแสดงความจุตามวัน (อาทิตย์-เสาร์) x ชั่วโมง (12AM-11PM)

### D. ความจุของคลาส (Class Capacity Over Time)
**Route**: `/report/class/capacity-over-time`

**Components:**
- Filters: วันที่, เทรนเนอร์, สาขา
- Stats Cards:
  - ความจุของคลาสโดยเฉลี่ย
  - คลาสที่มีการจอง
  - จำนวนคลาสโดยเฉลี่ยต่อวัน
- Chart: Line chart แสดง capacity % และจำนวนคลาส
- Table: วันที่, เทรนเนอร์, สาขา, คลาสที่มีการจองเวลาไว้, ความจุของคลาสโดยเฉลี่ย

### E. การขายแพ็กเกจ (Package Sales)
**Route**: `/report/package/sales`

**Components:**
- Filters: วันที่, ประเภทแพ็กเกจ, หมวดหมู่
- Stats Cards:
  - จำนวนหน่วยสูงสุดที่ขายได้จากแพ็กเกจ
  - จำนวนหน่วยต่ำสุดที่ขายได้จากแพ็กเกจ
  - รายได้สูงสุดที่เกิดจากการขายแพ็กเกจ
  - รายได้ต่ำสุดที่เกิดจากการขายแพ็กเกจ
- Chart: Double horizontal bar chart (จำนวนหน่วย | รายได้)
- Table: ชื่อแพ็กเกจ, ประเภทแพ็กเกจ, หมวดหมู่, จำนวนหน่วยที่ขายแล้ว, รายได้ (฿)

### F. ยอดขายแพ็กเกจ (Package Sales Over Time)
**Route**: `/report/package/sales-over-time`

**Components:**
- Filters: วันที่, แพ็กเกจ, ประเภทแพ็กเกจ, หมวดหมู่
- Stats Cards:
  - จำนวนรวมของแพ็กเกจที่ขายได้
  - ยอดขายแพ็กเกจโดยเฉลี่ยต่อวัน
  - รายได้
  - รายได้เฉลี่ยต่อวัน
- Toggle: วัน | สัปดาห์ | เดือน | ปี
- Chart: Combo chart (bar = จำนวน, line = รายได้)
- Table: วันที่, แพ็กเกจ, ประเภทแพ็กเกจ, หมวดหมู่, จำนวนหน่วยที่ขายแล้ว, รายได้ (บาท)

---

## 3. Files to Create/Modify

### New Files
| File | Description |
|------|-------------|
| `src/pages/reports/ActiveMembers.tsx` | Active members over time report |
| `src/pages/reports/ClassCapacityByHour.tsx` | Class capacity by hour heatmap |
| `src/pages/reports/ClassCapacityOverTime.tsx` | Class capacity over time |
| `src/pages/reports/PackageSales.tsx` | Package sales comparison |
| `src/pages/reports/PackageSalesOverTime.tsx` | Package sales trend |
| `src/components/reports/ReportFilters.tsx` | Reusable filter component |
| `src/components/reports/StatCard.tsx` | Report stat card with info icon |
| `src/components/reports/ManageDropdown.tsx` | จัดการ dropdown button |

### Modified Files
| File | Description |
|------|-------------|
| `src/pages/Reports.tsx` | เปลี่ยนเป็น list format |
| `src/pages/reports/MembersAtRisk.tsx` | ปรับ layout ให้ตรงกับภาพ |
| `src/hooks/useReports.ts` | เพิ่ม hooks สำหรับ reports ใหม่ |
| `src/i18n/locales/en.ts` | เพิ่ม i18n keys |
| `src/i18n/locales/th.ts` | เพิ่ม Thai translations |
| `src/App.tsx` | เพิ่ม routes |

---

## 4. New i18n Keys

```typescript
reports: {
  // ... existing keys
  
  // New titles (Thai)
  activeMembersTitle: 'จำนวนสมาชิกที่มีการใช้งานอยู่ (รวมยอดทั้งหมดที่ผ่านมา)',
  activeMembersDesc: 'แสดงจำนวนสมาชิกที่มีการใช้งานฟิตเนสนี้ (รวมยอดทั้งหมดที่ผ่านมา)',
  membersAtRiskDesc: 'แสดงจำนวนสมาชิกที่เสี่ยงตามจำนวนครั้งที่เหลือและวันหมดอายุของแพ็กเกจ',
  packageUsageDesc: 'แสดงภาพรวมการใช้งานแพ็กเกจของสมาชิกภายในช่วงเวลาที่เลือก',
  packageAtRiskDesc: 'แสดงแพ็กเกจที่มีความเสี่ยงของสมาชิก โดยพิจารณาจากจำนวนคงเหลือและวันหมดอายุ',
  
  classCapacityByHourTitle: 'ความจุของคลาสตามชั่วโมงของวัน',
  classCapacityByHourDesc: 'แสดงความจุของคลาสของฟิตเนสนี้ทุกชั่วโมงของวัน',
  classCapacityTitle: 'ความจุของคลาส (รวมยอดทั้งหมดที่ผ่านมา)',
  classCapacityDesc: 'แสดงความจุของคลาสของฟิตเนสนี้ (รวมยอดทั้งหมดที่ผ่านมา)',
  classCategoryPopularityDesc: 'แสดงการจัดอันดับหมวดหมู่คลาสตามความจุของคลาส',
  classPopularityDesc: 'แสดงการจัดอันดับคลาสตามจำนวนผู้เข้าคลาส หรือความจุของคลาส',
  
  packageSalesTitle: 'การขายแพ็กเกจ',
  packageSalesDesc: 'แสดงการเปรียบเทียบยอดขายแพ็กเกจของฟิตเนสนี้ตามจำนวนหน่วยที่ขายและรายได้',
  packageSalesOverTimeTitle: 'ยอดขายแพ็กเกจ (รวมยอดทั้งหมดที่ผ่านมา)',
  packageSalesOverTimeDesc: 'แสดงยอดขายแพ็กเกจของฟิตเนสนี้ทั้งหมดตามจำนวนหน่วยที่ขายและรายได้ (รวมยอดทั้งหมดที่ผ่านมา)',
  
  // Buttons
  viewFullReport: 'ดูรายงานฉบับเต็ม',
  exportReport: 'ส่งออกรายงาน',
  manage: 'จัดการ',
  
  // Filters
  dateRange: 'วันที่',
  trainer: 'เทรนเนอร์',
  allTrainers: 'เทรนเนอร์ทั้งหมด',
  allLocations: 'สาขาทั้งหมด',
  allPackages: 'แพ็กเกจทั้งหมด',
  allTypes: 'ประเภทแพ็กเกจทั้งหมด',
  allCategories: 'หมวดหมู่ทั้งหมด',
  age: 'อายุ',
  allAges: 'ทุกอายุ',
  gender: 'เพศ',
  allGenders: 'ทุกเพศ',
  
  // Stats
  mostActiveDay: 'สมาชิกที่มีการใช้งานมากที่สุดในหนึ่งวัน',
  leastActiveDay: 'สมาชิกที่มีการใช้งานน้อยที่สุดในหนึ่งวัน',
  avgActivePerDay: 'จำนวนสมาชิกที่มีการใช้งานโดยเฉลี่ยต่อวัน',
  newActivePerDay: 'จำนวนสมาชิกใหม่ที่มีการใช้งานโดยเฉลี่ยต่อวัน',
  avgCapacity: 'ความจุของคลาสโดยเฉลี่ย',
  classesWithBookings: 'คลาสที่มีการจอง',
  avgClassesPerDay: 'จำนวนคลาสโดยเฉลี่ยต่อวัน',
  peakCapacityTime: 'วันและเวลาที่มีความจุคลาสสูงสุด',
  totalPackagesSold: 'จำนวนรวมของแพ็กเกจที่ขายได้',
  avgPackagesPerDay: 'ยอดขายแพ็กเกจโดยเฉลี่ยต่อวัน',
  revenue: 'รายได้',
  avgRevenuePerDay: 'รายได้เฉลี่ยต่อวัน',
  maxUnitsSold: 'จำนวนหน่วยสูงสุดที่ขายได้จากแพ็กเกจ',
  minUnitsSold: 'จำนวนหน่วยต่ำสุดที่ขายได้จากแพ็กเกจ',
  maxRevenue: 'รายได้สูงสุดที่เกิดจากการขายแพ็กเกจ',
  minRevenue: 'รายได้ต่ำสุดที่เกิดจากการขายแพ็กเกจ',
  
  // Table columns
  date: 'วันที่',
  activeMembers: 'จำนวนสมาชิกที่มีการใช้งานอยู่',
  classesBooked: 'คลาสที่มีการจองเวลาไว้',
  unitsSold: 'จำนวนหน่วยที่ขายแล้ว',
  
  // Time period toggle
  day: 'วัน',
  week: 'สัปดาห์',
  month: 'เดือน',
  year: 'ปี',
  
  // Updated timestamp
  updatedAt: 'อัปเดตเมื่อ',
}
```

---

## 5. Component Patterns

### ReportItem Component (Reports Index)
```typescript
interface ReportItemProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant: 'view' | 'export';
  onClick: () => void;
}

<div className="py-4 border-b last:border-0">
  <h3 className="text-primary font-medium mb-1">{title}</h3>
  <div className="flex justify-between items-start gap-4">
    <p className="text-sm text-muted-foreground flex-1">{description}</p>
    <Button variant="outline" className="shrink-0 border-primary text-primary">
      {buttonVariant === 'export' && <Download className="h-4 w-4 mr-2" />}
      {buttonText}
    </Button>
  </div>
</div>
```

### Report Detail Page Layout
```typescript
<div>
  {/* Breadcrumb + Back */}
  <div className="flex items-center gap-2 text-sm mb-4">
    <Button variant="ghost" size="icon" onClick={() => navigate('/report')}>
      <ArrowLeft className="h-4 w-4" />
    </Button>
    <span className="text-muted-foreground">รายงาน</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
    <span>{reportTitle}</span>
  </div>
  
  {/* Title + Timestamp + Manage */}
  <div className="flex justify-between items-start mb-6">
    <div>
      <h1 className="text-xl font-semibold">{reportTitle}</h1>
      <p className="text-sm text-muted-foreground">
        🔄 อัปเดตเมื่อ {format(new Date(), 'd MMM yyyy, HH:mm')} (Bangkok GMT +07:00)
      </p>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-primary text-primary">
          <FileText className="h-4 w-4 mr-2" />
          จัดการ
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      {/* ... menu items */}
    </DropdownMenu>
  </div>
  
  {/* Filters */}
  <ReportFilters filters={...} onChange={...} />
  
  {/* Stats Cards */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <StatCard title={...} value={...} subtitle={...} color={...} />
    {/* ... */}
  </div>
  
  {/* Chart + Table */}
</div>
```

### StatCard for Reports
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'purple';
  info?: string;
  trend?: { value: number; isPositive: boolean };
}

<Card className={cn('border-t-4', colorClasses[color])}>
  <CardContent className="pt-4">
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
      {title}
      {info && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
            <TooltipContent>{info}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <div className={cn('text-2xl font-bold', textColorClasses[color])}>
      {value}
    </div>
    {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    {trend && (
      <div className={cn('text-xs mt-1', trend.isPositive ? 'text-green-500' : 'text-red-500')}>
        {trend.isPositive ? '▲' : '▼'} {trend.value}% เทียบกับระยะเวลาก่อนหน้า
      </div>
    )}
  </CardContent>
</Card>
```

---

## 6. Estimated Effort

| Task | Time |
|------|------|
| Reports Index page (list format) | 30 min |
| Active Members report page | 1.5 hours |
| Update Members At Risk page | 1 hour |
| Class Capacity by Hour (heatmap) | 2 hours |
| Class Capacity Over Time | 1.5 hours |
| Package Sales page | 1.5 hours |
| Package Sales Over Time | 1.5 hours |
| Shared components | 1 hour |
| i18n updates | 30 min |
| Routes + hooks | 30 min |
| Testing | 1 hour |
| **Total** | ~12 hours |

---

## 7. Success Criteria

1. ✅ หน้า Reports หลักแสดงเป็น list format ตามภาพ
2. ✅ ปุ่ม "ดูรายงานฉบับเต็ม" นำไปหน้า report detail ที่ถูกต้อง
3. ✅ ปุ่ม "ส่งออกรายงาน" export เป็น CSV
4. ✅ Report detail pages มี:
   - Breadcrumb + Back button
   - Title + timestamp + "จัดการ" dropdown
   - Filters (date range, dropdown selects)
   - Stats cards with info icons
   - Charts (bar, line, heatmap)
   - Data table with pagination
5. ✅ Mobile responsive ทุกหน้า
6. ✅ รองรับ i18n EN/TH ครบถ้วน
