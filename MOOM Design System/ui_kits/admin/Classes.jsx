/* MOOM Admin — รายการคลาส (Class Catalog)
   The operator-facing library of class TEMPLATES (not the calendar).
   Each class template is something you can schedule into sessions.

   UX pillars:
   1. Fast scanning  — grid of cards with colored type strip, key stats
   2. Powerful filter — search (⌘K), type, status, coach, duration chips
   3. Two views      — grid (visual) + table (dense scan)
   4. Side drawer    — full details, recent sessions, roster snapshot, actions
   5. Bulk actions   — multi-select with contextual action bar
   6. Inline state   — toggle active/paused without opening
*/

const { useState: useStateC, useMemo: useMemoC, useEffect: useEffectC, useRef: useRefC } = React;

/* =============================================================
 *  SEED DATA
 * =========================================================== */
const CL_TYPES = {
  spin:     { label: 'Spin',     color: 'hsl(200 70% 55%)', soft: 'hsl(200 70% 55% / 0.12)' },
  hiit:     { label: 'HIIT',     color: 'hsl(25 95% 55%)',  soft: 'hsl(25 95% 55% / 0.14)' },
  yoga:     { label: 'Yoga',     color: 'hsl(270 60% 60%)', soft: 'hsl(270 60% 60% / 0.12)' },
  strength: { label: 'Strength', color: 'hsl(150 50% 45%)', soft: 'hsl(150 50% 45% / 0.12)' },
  mobility: { label: 'Mobility', color: 'hsl(340 70% 60%)', soft: 'hsl(340 70% 60% / 0.12)' },
  boxing:   { label: 'Boxing',   color: 'hsl(0 72% 55%)',   soft: 'hsl(0 72% 55% / 0.12)' },
  pilates:  { label: 'Pilates',  color: 'hsl(180 55% 45%)', soft: 'hsl(180 55% 45% / 0.12)' },
};

const CL_LEVELS = {
  beginner:     { label: 'เริ่มต้น',   color: 'hsl(152 55% 42%)' },
  intermediate: { label: 'ปานกลาง',    color: 'hsl(38 92% 50%)' },
  advanced:     { label: 'ขั้นสูง',     color: 'hsl(0 72% 55%)' },
  all:          { label: 'ทุกระดับ',   color: 'hsl(220 10% 46%)' },
};

const CL_COACHES = [
  { id: 'arm',  name: 'Arm Siriwat',   short: 'Arm',  color: 'hsl(200 60% 55%)' },
  { id: 'mild', name: 'Mild Suchada',  short: 'Mild', color: 'hsl(340 70% 60%)' },
  { id: 'best', name: 'Best Thanakit', short: 'Best', color: 'hsl(25 95% 55%)' },
  { id: 'p',    name: 'P Chanatip',    short: 'P',    color: 'hsl(150 50% 50%)' },
  { id: 'nok',  name: 'Nok Pattaree',  short: 'Nok',  color: 'hsl(270 60% 60%)' },
  { id: 'jo',   name: 'Jo Kanokporn',  short: 'Jo',   color: 'hsl(180 55% 45%)' },
];

const CL_CLASSES = [
  { id: 1, name: 'Spin · High Intensity',  type: 'spin',     level: 'intermediate', coaches: ['arm', 'best'],     duration: 60, capacity: 20, equip: 'จักรยาน · ผ้าเช็ดตัว',   sessions30: 24, booked30: 412, fillPct: 86, waitlist: 8,  revenue: 82400,  rating: 4.8, status: 'active', trend: [12,14,16,15,18,20,22,24], featured: true, created: 'ม.ค. 2026' },
  { id: 2, name: 'Morning Flow Yoga',      type: 'yoga',     level: 'all',          coaches: ['nok'],             duration: 60, capacity: 15, equip: 'เสื่อโยคะ',              sessions30: 20, booked30: 248, fillPct: 82, waitlist: 3,  revenue: 49600,  rating: 4.9, status: 'active', trend: [10,12,14,15,16,17,18,20], featured: true, created: 'พ.ย. 2025' },
  { id: 3, name: 'HIIT Express · 30 min',  type: 'hiit',     level: 'intermediate', coaches: ['best'],            duration: 30, capacity: 20, equip: 'Heart rate monitor',      sessions30: 28, booked30: 520, fillPct: 92, waitlist: 14, revenue: 104000, rating: 4.7, status: 'active', trend: [18,20,22,24,25,26,27,28], featured: true, created: 'ต.ค. 2025' },
  { id: 4, name: 'Lower Body Strength',    type: 'strength', level: 'intermediate', coaches: ['p'],               duration: 60, capacity: 16, equip: 'บาร์เบล · ดัมเบล',        sessions30: 16, booked30: 208, fillPct: 81, waitlist: 2,  revenue: 41600,  rating: 4.6, status: 'active', trend: [10,11,12,13,14,15,16,16], featured: false, created: 'ต.ค. 2025' },
  { id: 5, name: 'Vinyasa Flow',           type: 'yoga',     level: 'intermediate', coaches: ['nok', 'mild'],     duration: 60, capacity: 20, equip: 'เสื่อโยคะ · blocks',      sessions30: 16, booked30: 288, fillPct: 90, waitlist: 6,  revenue: 57600,  rating: 4.8, status: 'active', trend: [12,13,14,15,15,16,16,16], featured: false, created: 'ก.ย. 2025' },
  { id: 6, name: 'Boxing Basics',          type: 'boxing',   level: 'beginner',     coaches: ['jo'],              duration: 60, capacity: 12, equip: 'นวม · wraps',             sessions30: 12, booked30: 84,  fillPct: 58, waitlist: 0,  revenue: 16800,  rating: 4.5, status: 'active', trend: [6,7,7,8,8,9,9,10], featured: false, created: 'ธ.ค. 2025' },
  { id: 7, name: 'Boxing Conditioning',    type: 'boxing',   level: 'advanced',     coaches: ['jo'],              duration: 60, capacity: 12, equip: 'นวม · wraps · rope',      sessions30: 8,  booked30: 72,  fillPct: 75, waitlist: 1,  revenue: 14400,  rating: 4.7, status: 'active', trend: [6,6,7,7,8,8,9,9], featured: false, created: 'ธ.ค. 2025' },
  { id: 8, name: 'Mobility + Stretch',     type: 'mobility', level: 'all',          coaches: ['mild'],            duration: 45, capacity: 15, equip: 'เสื่อ · foam roller',      sessions30: 12, booked30: 108, fillPct: 60, waitlist: 0,  revenue: 16200,  rating: 4.6, status: 'active', trend: [7,8,8,9,9,9,10,9], featured: false, created: 'ส.ค. 2025' },
  { id: 9, name: 'Mat Pilates',            type: 'pilates',  level: 'beginner',     coaches: ['mild'],            duration: 60, capacity: 12, equip: 'เสื่อ · ring',             sessions30: 12, booked30: 132, fillPct: 92, waitlist: 4,  revenue: 26400,  rating: 4.8, status: 'active', trend: [8,9,10,10,11,11,12,12], featured: false, created: 'ก.ค. 2025' },
  { id: 10,name: 'Core Focus Pilates',     type: 'pilates',  level: 'intermediate', coaches: ['mild'],            duration: 45, capacity: 12, equip: 'เสื่อ · ring · band',     sessions30: 8,  booked30: 88,  fillPct: 92, waitlist: 2,  revenue: 17600,  rating: 4.7, status: 'active', trend: [6,6,7,7,8,8,8,8], featured: false, created: 'ก.ค. 2025' },
  { id: 11,name: 'Tabata 40/20',           type: 'hiit',     level: 'advanced',     coaches: ['best', 'p'],       duration: 45, capacity: 20, equip: 'Heart rate monitor',      sessions30: 16, booked30: 304, fillPct: 95, waitlist: 18, revenue: 60800,  rating: 4.9, status: 'active', trend: [14,14,15,15,16,16,16,16], featured: true, created: 'มิ.ย. 2025' },
  { id: 12,name: 'Spin · Endurance',       type: 'spin',     level: 'intermediate', coaches: ['arm'],             duration: 75, capacity: 20, equip: 'จักรยาน · ผ้าเช็ดตัว',   sessions30: 12, booked30: 180, fillPct: 75, waitlist: 2,  revenue: 36000,  rating: 4.6, status: 'active', trend: [9,10,11,11,12,12,12,12], featured: false, created: 'พ.ค. 2025' },
  { id: 13,name: 'Upper Body Strength',    type: 'strength', level: 'intermediate', coaches: ['p'],               duration: 60, capacity: 16, equip: 'บาร์เบล · ดัมเบล',        sessions30: 16, booked30: 192, fillPct: 75, waitlist: 0,  revenue: 38400,  rating: 4.6, status: 'active', trend: [11,12,13,13,14,15,16,16], featured: false, created: 'พ.ค. 2025' },
  { id: 14,name: 'Restorative Yoga',       type: 'yoga',     level: 'beginner',     coaches: ['nok'],             duration: 75, capacity: 15, equip: 'เสื่อ · bolster',         sessions30: 8,  booked30: 72,  fillPct: 60, waitlist: 0,  revenue: 14400,  rating: 4.8, status: 'active', trend: [5,6,6,7,7,7,8,8], featured: false, created: 'เม.ย. 2025' },
  { id: 15,name: 'Sunrise HIIT',           type: 'hiit',     level: 'intermediate', coaches: ['best'],            duration: 45, capacity: 20, equip: 'Heart rate monitor',      sessions30: 12, booked30: 144, fillPct: 60, waitlist: 0,  revenue: 28800,  rating: 4.4, status: 'active', trend: [8,9,10,10,11,11,12,12], featured: false, created: 'เม.ย. 2025' },
  { id: 16,name: 'Full Body Strength',     type: 'strength', level: 'all',          coaches: ['p', 'best'],       duration: 60, capacity: 16, equip: 'บาร์เบล · ดัมเบล',        sessions30: 12, booked30: 144, fillPct: 75, waitlist: 0,  revenue: 28800,  rating: 4.5, status: 'active', trend: [9,10,10,11,11,12,12,12], featured: false, created: 'มี.ค. 2025' },
  { id: 17,name: 'Deep Stretch',           type: 'mobility', level: 'all',          coaches: ['mild', 'nok'],     duration: 60, capacity: 12, equip: 'เสื่อ · foam roller',     sessions30: 8,  booked30: 56,  fillPct: 58, waitlist: 0,  revenue: 11200,  rating: 4.7, status: 'paused', trend: [5,5,5,6,6,6,7,7], featured: false, created: 'มี.ค. 2025' },
  { id: 18,name: 'Prenatal Yoga',          type: 'yoga',     level: 'beginner',     coaches: ['nok'],             duration: 60, capacity: 10, equip: 'เสื่อ · bolster',         sessions30: 0,  booked30: 0,   fillPct: 0,  waitlist: 0,  revenue: 0,      rating: 0,   status: 'draft',  trend: [0,0,0,0,0,0,0,0], featured: false, created: '18 เม.ย.' },
];

const FEATURED_IDS = [3, 11, 1, 5];  /* top picks this week */

/* =============================================================
 *  HELPERS
 * =========================================================== */
const cFmtMoney = (n) => '฿' + n.toLocaleString('en-US');
const cFmtMoneyShort = (n) => {
  if (n >= 1000000) return '฿' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return '฿' + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return '฿' + n;
};
const cFillTone = (pct) => {
  if (pct >= 90) return { fg: adminTokens.destr,   bg: adminTokens.destrSoft,   label: 'เต็มบ่อย' };
  if (pct >= 70) return { fg: adminTokens.success, bg: adminTokens.successSoft, label: 'ดี' };
  if (pct >= 40) return { fg: adminTokens.warn,    bg: adminTokens.warnSoft,    label: 'พอใช้' };
  return              { fg: adminTokens.muted,   bg: adminTokens.subtle,      label: 'ต่ำ' };
};
const CL_STATUS = {
  active: { label: 'ใช้งาน',   fg: adminTokens.success, bg: adminTokens.successSoft },
  paused: { label: 'พัก',       fg: adminTokens.warn,    bg: adminTokens.warnSoft },
  draft:  { label: 'แบบร่าง',   fg: adminTokens.muted,   bg: adminTokens.subtle },
};

/* =============================================================
 *  MICRO PRIMITIVES
 * =========================================================== */
const CL_Icon = ({ d, size = 14, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);
const cIcons = {
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  rows:    <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
  fire:    <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  cash:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  star:    <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  chev:    <><polyline points="6 9 12 15 18 9"/></>,
  chevR:   <><polyline points="9 18 15 12 9 6"/></>,
  play:    <><polygon points="5 3 19 12 5 21 5 3"/></>,
  pause:   <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  copy:    <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
  dumb:    <><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  flame:   <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  sparkle: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
};

const CoachDot = ({ coach, size = 22, ring = true }) => (
  <div title={coach.name} style={{
    width: size, height: size, borderRadius: '50%', background: coach.color,
    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.44, fontWeight: 800, flexShrink: 0,
    boxShadow: ring ? `0 0 0 2px ${adminTokens.surface}` : 'none',
  }}>{coach.short[0]}</div>
);

const CoachStack = ({ coachIds, size = 22, max = 3 }) => {
  const list = coachIds.map(id => CL_COACHES.find(c => c.id === id)).filter(Boolean);
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((c, i) => (
        <div key={c.id} style={{ marginLeft: i === 0 ? 0 : -6 }}>
          <CoachDot coach={c} size={size}/>
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -6, width: size, height: size, borderRadius: '50%',
          background: adminTokens.subtle, color: adminTokens.muted,
          fontSize: size * 0.42, fontWeight: 800, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 2px ${adminTokens.surface}`,
        }}>+{extra}</div>
      )}
    </div>
  );
};

/* tiny inline sparkline */
const Spark = ({ data, color, w = 80, h = 24 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity=".15"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/* =============================================================
 *  PAGE HEADER + KPI STRIP
 * =========================================================== */
const ClPageHeader = ({ total, activeCnt, onNew }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>
        รายการคลาส
      </h1>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
        คลังคลาสทั้งหมด · {total} รายการ · ใช้งานอยู่ {activeCnt}
      </p>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button style={{
        height: 38, padding: '0 14px', borderRadius: 10, cursor: 'pointer',
        background: adminTokens.surface, color: adminTokens.black,
        border: `1px solid ${adminTokens.border}`, fontFamily: 'inherit',
        fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: adminTokens.shadowSm,
      }}>
        <CL_Icon d={cIcons.copy} size={14}/> นำเข้า CSV
      </button>
      <button onClick={onNew} style={{
        height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
        background: adminTokens.orange, color: '#fff', border: 0,
        fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
      }}>
        <CL_Icon d={cIcons.plus} size={14}/> เพิ่มคลาสใหม่
      </button>
    </div>
  </div>
);

const ClKpiStrip = ({ classes }) => {
  const total = classes.length;
  const active = classes.filter(c => c.status === 'active').length;
  const avgFill = total ? Math.round(classes.reduce((s,c) => s + c.fillPct, 0) / total) : 0;
  const totalRev = classes.reduce((s,c) => s + c.revenue, 0);
  const lowPerf = classes.filter(c => c.status === 'active' && c.fillPct < 50).length;
  const topClass = classes.filter(c => c.status === 'active').sort((a,b) => b.booked30 - a.booked30)[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      <KpiMini label="คลาสทั้งหมด" value={total} sub={`${active} ใช้งาน · ${total - active} อื่นๆ`}
               icon={cIcons.dumb} accent="orange"/>
      <KpiMini label="อัตราความจุเฉลี่ย" value={`${avgFill}%`}
               sub={avgFill >= 75 ? 'เต็มสม่ำเสมอ' : avgFill >= 50 ? 'อยู่ในเกณฑ์ดี' : 'ต้องโปรโมท'}
               icon={cIcons.flame} accent={avgFill >= 75 ? 'success' : avgFill >= 50 ? 'warn' : 'destr'}/>
      <KpiMini label="คลาสฮิตสุด 30 วัน" value={topClass?.booked30 || 0} suffix="จอง"
               sub={topClass?.name || '—'} icon={cIcons.sparkle} accent="info"/>
      <KpiMini label="คลาสที่คนน้อย" value={lowPerf} suffix={lowPerf > 0 ? 'ต่ำกว่า 50%' : ''}
               sub={lowPerf > 0 ? 'พิจารณาปรับเวลาหรือปิด' : 'ทุกคลาสดี ไม่ต้องแก้'}
               icon={cIcons.flame} accent={lowPerf > 2 ? 'destr' : lowPerf > 0 ? 'warn' : 'success'}/>
    </div>
  );
};

const KpiMini = ({ label, value, suffix, sub, icon, accent }) => {
  const map = {
    orange:  { fg: adminTokens.orange,  bg: adminTokens.orangeSoft },
    info:    { fg: adminTokens.info,    bg: adminTokens.infoSoft },
    success: { fg: adminTokens.success, bg: adminTokens.successSoft },
    warn:    { fg: adminTokens.warn,    bg: adminTokens.warnSoft },
    destr:   { fg: adminTokens.destr,   bg: adminTokens.destrSoft },
  };
  const a = map[accent] || map.orange;
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: adminTokens.shadowSm,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: a.bg, color: a.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <CL_Icon d={icon} size={17} stroke={2.2}/>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                         fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{value}</span>
          {suffix && <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 500 }}>{suffix}</span>}
        </div>
        <div style={{
          fontSize: 10, color: a.fg, fontWeight: 600, marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{sub}</div>
      </div>
    </div>
  );
};

/* =============================================================
 *  FEATURED ROW — "ฮิตสัปดาห์นี้"
 * =========================================================== */
const ClFeaturedRow = ({ classes, onOpen }) => {
  const list = FEATURED_IDS.map(id => classes.find(c => c.id === id)).filter(Boolean);
  if (!list.length) return null;
  return (
    <div style={{
      background: `linear-gradient(135deg, hsl(22 95% 55% / 0.08), hsl(22 95% 55% / 0.02))`,
      border: `1px solid ${adminTokens.orangeBorder}`,
      borderRadius: adminTokens.r3, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, background: adminTokens.orange, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CL_Icon d={cIcons.sparkle} size={13} stroke={2.4}/>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.01em' }}>
            ฮิตสัปดาห์นี้
          </div>
          <div style={{ fontSize: 11, color: adminTokens.muted }}>4 คลาสที่ทำผลงานดีที่สุด</div>
        </div>
        <div style={{ flex: 1 }}/>
        <button style={{
          fontSize: 12, fontWeight: 600, color: adminTokens.orange, background: 'transparent',
          border: 0, cursor: 'pointer', fontFamily: 'inherit',
        }}>ดูทั้งหมด →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {list.map(c => {
          const t = CL_TYPES[c.type];
          return (
            <button key={c.id} onClick={() => onOpen(c.id)} style={{
              background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
              borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.transform = 'none'; }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: t.soft, color: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 14, fontWeight: 800, letterSpacing: '-.02em',
              }}>{t.label[0]}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: adminTokens.black,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '-.01em',
                }}>{c.name}</div>
                <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {c.booked30} จอง · {c.fillPct}%
                </div>
              </div>
              <Spark data={c.trend} color={t.color} w={36} h={20}/>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* =============================================================
 *  TOOLBAR — search + type chips + filters + view switch + sort
 * =========================================================== */
const ClToolbar = ({
  query, setQuery, typeFilter, setTypeFilter, statusFilter, setStatusFilter,
  coachFilter, setCoachFilter, durationFilter, setDurationFilter,
  sort, setSort, view, setView, searchRef, resultCount,
}) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 10,
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    {/* Row 1: search + sort + view */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{
        flex: 1, minWidth: 240, height: 36,
        background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
        borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: adminTokens.muted, display: 'flex' }}>
          <CL_Icon d={cIcons.search} size={14}/>
        </span>
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ค้นหาคลาส · ชื่อ · เทรนเนอร์ · ประเภท"
          style={{
            flex: 1, height: 34, border: 0, background: 'transparent', outline: 'none',
            fontSize: 13, color: adminTokens.black, fontFamily: 'inherit',
          }}/>
        <kbd style={{
          fontSize: 10, fontWeight: 700, color: adminTokens.muted,
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
        }}>⌘K</kbd>
      </div>

      <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {resultCount} ผลลัพธ์
      </div>

      <FilterSelect
        label="เทรนเนอร์"
        value={coachFilter}
        options={[{ v: 'all', l: 'ทุกคน' }, ...CL_COACHES.map(c => ({ v: c.id, l: c.name }))]}
        onChange={setCoachFilter}
      />
      <FilterSelect
        label="ระยะเวลา"
        value={durationFilter}
        options={[
          { v: 'all',  l: 'ทั้งหมด' },
          { v: 'short',l: '≤ 30 นาที' },
          { v: 'mid',  l: '45–60 นาที' },
          { v: 'long', l: '> 60 นาที' },
        ]}
        onChange={setDurationFilter}
      />
      <FilterSelect
        label="เรียงโดย"
        value={sort}
        options={[
          { v: 'popular',  l: 'ยอดนิยม' },
          { v: 'revenue',  l: 'รายได้สูงสุด' },
          { v: 'fill',     l: 'ความจุสูงสุด' },
          { v: 'newest',   l: 'ใหม่ล่าสุด' },
          { v: 'name',     l: 'ชื่อ A→Z' },
        ]}
        onChange={setSort}
      />

      <div style={{ display: 'flex', border: `1px solid ${adminTokens.border}`, borderRadius: 8,
                    padding: 2, background: adminTokens.subtle }}>
        {[
          { id: 'grid',  d: cIcons.grid, label: 'การ์ด' },
          { id: 'table', d: cIcons.rows, label: 'ตาราง' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} title={v.label} style={{
            width: 32, height: 28, border: 0, borderRadius: 6, cursor: 'pointer',
            background: view === v.id ? adminTokens.surface : 'transparent',
            color: view === v.id ? adminTokens.black : adminTokens.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: view === v.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
          }}>
            <CL_Icon d={v.d} size={14} stroke={view === v.id ? 2.3 : 2}/>
          </button>
        ))}
      </div>
    </div>

    {/* Row 2: type chips + status chips */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <TypeChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}
                  color={adminTokens.black} label="ทุกประเภท"/>
        {Object.entries(CL_TYPES).map(([k, t]) => (
          <TypeChip key={k} active={typeFilter === k} onClick={() => setTypeFilter(k)}
                    color={t.color} label={t.label}/>
        ))}
      </div>

      <div style={{ width: 1, height: 20, background: adminTokens.divider }}/>

      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { v: 'all',    l: 'ทั้งหมด' },
          { v: 'active', l: 'ใช้งาน',   fg: adminTokens.success },
          { v: 'paused', l: 'พัก',      fg: adminTokens.warn },
          { v: 'draft',  l: 'แบบร่าง',   fg: adminTokens.muted },
        ].map(s => (
          <button key={s.v} onClick={() => setStatusFilter(s.v)} style={{
            height: 28, padding: '0 10px', border: 0, borderRadius: 6, cursor: 'pointer',
            background: statusFilter === s.v ? adminTokens.subtle : 'transparent',
            color: statusFilter === s.v ? (s.fg || adminTokens.black) : adminTokens.muted,
            fontFamily: 'inherit', fontSize: 12, fontWeight: statusFilter === s.v ? 700 : 500,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {s.fg && <span style={{ width: 6, height: 6, borderRadius: 3, background: s.fg }}/>}
            {s.l}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const TypeChip = ({ active, onClick, color, label }) => (
  <button onClick={onClick} style={{
    height: 28, padding: '0 11px', borderRadius: 14, cursor: 'pointer',
    background: active ? color : adminTokens.subtle,
    color: active ? '#fff' : adminTokens.black,
    border: `1px solid ${active ? color : adminTokens.border}`,
    fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 600,
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all .12s',
  }}>
    <span style={{
      width: 8, height: 8, borderRadius: 4,
      background: active ? '#fff' : color, opacity: active ? 1 : 0.9,
    }}/>
    {label}
  </button>
);

const FilterSelect = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useStateC(false);
  const ref = useRefC();
  useEffectC(() => {
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const current = options.find(o => o.v === value) || options[0];
  const isDefault = value === options[0].v;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        height: 34, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${!isDefault ? adminTokens.orange : adminTokens.border}`,
        background: !isDefault ? adminTokens.orangeSoft : adminTokens.surface,
        color: !isDefault ? adminTokens.orange : adminTokens.black,
        fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}>
        <span style={{ color: !isDefault ? adminTokens.orange : adminTokens.muted }}>{label}:</span>
        <span style={{ fontWeight: 700 }}>{current.l}</span>
        <CL_Icon d={cIcons.chev} size={11}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: 10, boxShadow: adminTokens.shadowMd, padding: 4, minWidth: 180,
          maxHeight: 320, overflowY: 'auto',
        }}>
          {options.map(o => (
            <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6,
              border: 0, background: value === o.v ? adminTokens.orangeSoft : 'transparent',
              color: value === o.v ? adminTokens.orange : adminTokens.black,
              fontFamily: 'inherit', fontSize: 12, fontWeight: value === o.v ? 700 : 500,
              cursor: 'pointer', display: 'block',
            }}
            onMouseEnter={e => { if (value !== o.v) e.currentTarget.style.background = adminTokens.subtle; }}
            onMouseLeave={e => { if (value !== o.v) e.currentTarget.style.background = 'transparent'; }}>
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* =============================================================
 *  CLASS CARD (grid view)
 * =========================================================== */
const ClassCard = ({ cls, selected, onSelect, onOpen, onToggleStatus }) => {
  const t = CL_TYPES[cls.type];
  const level = CL_LEVELS[cls.level];
  const status = CL_STATUS[cls.status];
  const fill = cFillTone(cls.fillPct);
  const [hover, setHover] = useStateC(false);

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: adminTokens.surface,
        border: `1px solid ${selected ? t.color : (hover ? adminTokens.borderStrong : adminTokens.border)}`,
        boxShadow: selected ? `0 0 0 3px ${t.color}22, ${adminTokens.shadowMd}` : (hover ? adminTokens.shadowMd : adminTokens.shadowSm),
        borderRadius: adminTokens.r3,
        padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'pointer', transition: 'all .15s', position: 'relative',
        minWidth: 0,
      }}
      onClick={() => onOpen(cls.id)}
    >
      {/* colored top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: t.color, borderRadius: '14px 14px 0 0',
      }}/>

      {/* top row: checkbox + type badge + status + menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox checked={selected} onChange={() => onSelect(cls.id)}
                  onClick={e => e.stopPropagation()}/>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
          color: t.color, background: t.soft, padding: '3px 8px',
          borderRadius: 9999, textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: t.color }}/>
          {t.label}
        </span>
        {cls.featured && (
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.04em',
            color: adminTokens.orange, background: adminTokens.orangeSoft,
            padding: '3px 6px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <CL_Icon d={cIcons.sparkle} size={9}/> HOT
          </span>
        )}
        <div style={{ flex: 1 }}/>
        <StatusPill status={cls.status}/>
        <RowMenu
          onClick={e => e.stopPropagation()}
          onToggleStatus={() => onToggleStatus(cls.id)}
          isActive={cls.status === 'active'}
        />
      </div>

      {/* title + level */}
      <div>
        <div style={{
          fontSize: 15, fontWeight: 800, color: adminTokens.black,
          letterSpacing: '-.01em', lineHeight: 1.25,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: 38,
        }}>{cls.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, color: level.color,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: level.color }}/>
            {level.label}
          </span>
          <span style={{ color: adminTokens.mutedLight, fontSize: 11 }}>·</span>
          <span style={{
            fontSize: 11, color: adminTokens.muted, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <CL_Icon d={cIcons.clock} size={11}/>{cls.duration} นาที
          </span>
          <span style={{ color: adminTokens.mutedLight, fontSize: 11 }}>·</span>
          <span style={{
            fontSize: 11, color: adminTokens.muted, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <CL_Icon d={cIcons.users} size={11}/>{cls.capacity}
          </span>
        </div>
      </div>

      {/* coaches */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CoachStack coachIds={cls.coaches}/>
        <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 500 }}>
          {cls.coaches.length === 1
            ? 'Coach ' + CL_COACHES.find(c => c.id === cls.coaches[0])?.short
            : `${cls.coaches.length} เทรนเนอร์`}
        </span>
      </div>

      {/* stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
        background: adminTokens.subtle, borderRadius: 10, padding: '10px 4px',
      }}>
        <Stat label="จอง 30 วัน" value={cls.booked30} fg={adminTokens.black}/>
        <Stat label="ความจุ" value={`${cls.fillPct}%`} fg={fill.fg}/>
        <Stat label="รายได้" value={cFmtMoneyShort(cls.revenue)} fg={adminTokens.black}/>
      </div>

      {/* trend + fill bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>
              ความจุเฉลี่ย
            </span>
            <span style={{
              fontSize: 10, color: fill.fg, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              {cls.waitlist > 0 && <>
                <span style={{ color: adminTokens.orange }}>+{cls.waitlist} รอคิว</span>
                <span style={{ color: adminTokens.mutedLight }}>·</span>
              </>}
              {fill.label}
            </span>
          </div>
          <div style={{ height: 5, background: adminTokens.divider, borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(cls.fillPct, 100)}%`, height: '100%',
              background: `linear-gradient(90deg, ${t.color}, ${t.color})`,
            }}/>
          </div>
        </div>
        <Spark data={cls.trend} color={t.color} w={60} h={22}/>
      </div>

      {/* footer: rating + schedule button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingTop: 8, borderTop: `1px dashed ${adminTokens.divider}`,
      }}>
        {cls.rating > 0 ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: adminTokens.warn,
          }}>
            <CL_Icon d={cIcons.star} size={11} stroke={2.2}/>
            {cls.rating.toFixed(1)}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: adminTokens.mutedLight, fontWeight: 500 }}>ยังไม่มีรีวิว</span>
        )}
        <div style={{ flex: 1 }}/>
        <button onClick={e => { e.stopPropagation(); onOpen(cls.id); }} style={{
          height: 28, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
          background: hover ? adminTokens.orange : adminTokens.surface,
          color: hover ? '#fff' : adminTokens.black,
          borderColor: hover ? adminTokens.orange : adminTokens.border,
          borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all .12s',
        }}>
          รายละเอียด <CL_Icon d={cIcons.chevR} size={11}/>
        </button>
      </div>
    </div>
  );
};

const Stat = ({ label, value, fg, small }) => (
  <div style={{ padding: '0 8px', textAlign: 'center', minWidth: 0, borderRight: `1px solid ${adminTokens.border}`,
                borderRightWidth: 1, ...(small ? {} : {}) }} className="cl-stat">
    <div style={{
      fontSize: small ? 12 : 14, fontWeight: 800, color: fg,
      fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1.1,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{value}</div>
    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>{label}</div>
  </div>
);

const StatusPill = ({ status }) => {
  const s = CL_STATUS[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color: s.fg, background: s.bg,
      padding: '2px 7px', borderRadius: 9999,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: s.fg }}/>
      {s.label}
    </span>
  );
};

const Checkbox = ({ checked, onChange, onClick }) => (
  <button onClick={e => { onClick?.(e); onChange?.(); }} style={{
    width: 18, height: 18, borderRadius: 5, cursor: 'pointer', padding: 0,
    border: `1.5px solid ${checked ? adminTokens.orange : adminTokens.borderStrong}`,
    background: checked ? adminTokens.orange : adminTokens.surface,
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    {checked && <CL_Icon d={cIcons.check} size={11} stroke={3}/>}
  </button>
);

const RowMenu = ({ onClick, onToggleStatus, isActive }) => {
  const [open, setOpen] = useStateC(false);
  const ref = useRefC();
  useEffectC(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={onClick}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: 24, height: 24, borderRadius: 6, border: 0, background: 'transparent',
        color: adminTokens.muted, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.background = adminTokens.subtle}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <CL_Icon d={cIcons.dots} size={14}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 40,
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: 10, boxShadow: adminTokens.shadowMd, padding: 4, minWidth: 160,
        }}>
          <MenuItem icon={cIcons.edit}>แก้ไข</MenuItem>
          <MenuItem icon={cIcons.copy}>ทำสำเนา</MenuItem>
          <MenuItem icon={cIcons.cal}>เพิ่มในตาราง</MenuItem>
          <div style={{ height: 1, background: adminTokens.divider, margin: '4px 0' }}/>
          <MenuItem
            icon={isActive ? cIcons.pause : cIcons.play}
            onClick={() => { onToggleStatus(); setOpen(false); }}
          >{isActive ? 'พักคลาส' : 'เปิดใช้งาน'}</MenuItem>
          <MenuItem icon={cIcons.trash} danger>ลบ</MenuItem>
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon, children, danger, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', padding: '8px 10px', border: 0, borderRadius: 6, cursor: 'pointer',
    background: 'transparent', color: danger ? adminTokens.destr : adminTokens.black,
    fontFamily: 'inherit', fontSize: 12, fontWeight: 600, textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 8,
  }}
  onMouseEnter={e => e.currentTarget.style.background = danger ? adminTokens.destrSoft : adminTokens.subtle}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    <CL_Icon d={icon} size={13}/>{children}
  </button>
);

/* =============================================================
 *  TABLE VIEW
 * =========================================================== */
const ClTable = ({ classes, selected, setSelected, onOpen, onToggleStatus }) => {
  const allSelected = classes.length > 0 && classes.every(c => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(classes.map(c => c.id)));
  };
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 2.4fr 1fr 1fr 1.4fr 1fr 1fr 110px 40px',
        padding: '10px 14px', borderBottom: `1px solid ${adminTokens.border}`,
        background: adminTokens.subtle, alignItems: 'center',
        fontSize: 10, fontWeight: 700, color: adminTokens.muted,
        textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        <Checkbox checked={allSelected} onChange={toggleAll}/>
        <div>ชื่อคลาส</div>
        <div>ประเภท</div>
        <div>ระดับ · เวลา</div>
        <div>เทรนเนอร์</div>
        <div style={{ textAlign: 'right' }}>จอง 30 วัน</div>
        <div>ความจุ</div>
        <div>สถานะ</div>
        <div/>
      </div>
      {classes.map((c, i) => {
        const t = CL_TYPES[c.type];
        const level = CL_LEVELS[c.level];
        const fill = cFillTone(c.fillPct);
        const isSel = selected.has(c.id);
        return (
          <div key={c.id} onClick={() => onOpen(c.id)} style={{
            display: 'grid',
            gridTemplateColumns: '40px 2.4fr 1fr 1fr 1.4fr 1fr 1fr 110px 40px',
            padding: '12px 14px',
            borderBottom: i < classes.length - 1 ? `1px solid ${adminTokens.divider}` : 0,
            alignItems: 'center', cursor: 'pointer',
            background: isSel ? adminTokens.orangeSoft : 'transparent',
            transition: 'background .1s',
          }}
          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = adminTokens.subtle; }}
          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
            <div onClick={e => e.stopPropagation()}>
              <Checkbox checked={isSel} onChange={() => {
                const n = new Set(selected);
                if (n.has(c.id)) n.delete(c.id); else n.add(c.id);
                setSelected(n);
              }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 3, height: 32, background: t.color, borderRadius: 3, flexShrink: 0 }}/>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: adminTokens.black,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '-.01em',
                }}>
                  {c.name}
                  {c.featured && <span style={{
                    marginLeft: 6, fontSize: 9, fontWeight: 800, letterSpacing: '.04em',
                    color: adminTokens.orange, background: adminTokens.orangeSoft,
                    padding: '1px 5px', borderRadius: 4, verticalAlign: 'middle',
                  }}>HOT</span>}
                </div>
                <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 2 }}>
                  สร้างเมื่อ {c.created} · {c.sessions30} รอบ / 30 วัน
                </div>
              </div>
            </div>
            <div>
              <span style={{
                fontSize: 10, fontWeight: 800, color: t.color, background: t.soft,
                padding: '3px 7px', borderRadius: 4, letterSpacing: '.02em',
              }}>{t.label}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: level.color,
                            display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: 3, background: level.color }}/>
                {level.label}
              </div>
              <div style={{ fontSize: 10, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                {c.duration} นาที · {c.capacity} ที่นั่ง
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CoachStack coachIds={c.coaches} size={22}/>
              <span style={{ fontSize: 11, color: adminTokens.black, fontWeight: 600,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.coaches.length === 1
                  ? CL_COACHES.find(x => x.id === c.coaches[0])?.short
                  : `${c.coaches.length} คน`}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>
                {c.booked30}
              </div>
              <div style={{ fontSize: 10, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums' }}>
                {cFmtMoney(c.revenue)}
              </div>
            </div>
            <div style={{ minWidth: 0, paddingRight: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: fill.fg,
                               fontVariantNumeric: 'tabular-nums' }}>{c.fillPct}%</span>
                {c.waitlist > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: adminTokens.orange,
                                 background: adminTokens.orangeSoft, padding: '1px 5px', borderRadius: 3 }}>
                    +{c.waitlist}
                  </span>
                )}
              </div>
              <div style={{ height: 4, background: adminTokens.divider, borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(c.fillPct, 100)}%`, height: '100%', background: t.color }}/>
              </div>
            </div>
            <div>
              <StatusPill status={c.status}/>
            </div>
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <RowMenu
                onToggleStatus={() => onToggleStatus(c.id)}
                isActive={c.status === 'active'}
              />
            </div>
          </div>
        );
      })}
      {classes.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: adminTokens.muted, fontSize: 13 }}>
          ไม่พบคลาสที่ตรงกับเงื่อนไข
        </div>
      )}
    </div>
  );
};

/* =============================================================
 *  GRID VIEW
 * =========================================================== */
const ClGrid = ({ classes, selected, setSelected, onOpen, onToggleStatus }) => {
  const select = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
      {classes.map(c => (
        <ClassCard
          key={c.id} cls={c}
          selected={selected.has(c.id)}
          onSelect={select}
          onOpen={onOpen}
          onToggleStatus={onToggleStatus}
        />
      ))}
      {classes.length === 0 && (
        <div style={{
          gridColumn: '1 / -1', padding: 60, textAlign: 'center',
          background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
          borderRadius: adminTokens.r3,
        }}>
          <div style={{ fontSize: 14, color: adminTokens.muted, fontWeight: 600 }}>
            ไม่พบคลาสที่ตรงกับเงื่อนไข
          </div>
          <div style={{ fontSize: 12, color: adminTokens.mutedLight, marginTop: 4 }}>
            ลองเปลี่ยนตัวกรองหรือเพิ่มคลาสใหม่
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  CL_TYPES, CL_LEVELS, CL_COACHES, CL_CLASSES, CL_STATUS, FEATURED_IDS,
  CL_Icon, cIcons, CoachDot, CoachStack, Spark, cFmtMoney, cFillTone,
  ClPageHeader, ClKpiStrip, ClFeaturedRow, ClToolbar, TypeChip, FilterSelect,
  ClassCard, Stat, StatusPill, Checkbox, RowMenu, MenuItem,
  ClTable, ClGrid,
});
