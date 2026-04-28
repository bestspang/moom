/* MOOM Admin — Trainers (เทรนเนอร์)
   Manage trainers, shifts, PT sessions, specialties, earnings.
   Sections: KPI strip → on-shift now → quick-book PT → roster grid/list
             → performance leaderboard → profile drawer */

const { useState: useStateT, useMemo: useMemoT, useEffect: useEffectT } = React;

/* ---------- Icons ---------- */
const tIcons = {
  userOne: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  cash:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  star:    <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  starO:   <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  heart:   <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  dumb:    <><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></>,
  users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  message: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  phone:   <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  copy:    <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  chev:    <><polyline points="6 9 12 15 18 9"/></>,
  chevR:   <><polyline points="9 18 15 12 9 6"/></>,
  trendU:  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  bolt:    <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  award:   <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
  medal:   <><circle cx="12" cy="15" r="6"/><path d="M8.5 2h7l2 4h-11z"/></>,
  book:    <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  filter:  <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  mail:    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  sparkle: <><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></>,
  map:     <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  flame:   <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  badge:   <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
  refresh: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
};

/* ---------- Data ---------- */
const SPECIALTIES = {
  strength: { label: 'Strength',   color: adminTokens.orange,      bg: adminTokens.orangeSoft,       icon: tIcons.dumb },
  hiit:     { label: 'HIIT',       color: adminTokens.destr,       bg: adminTokens.destrSoft,        icon: tIcons.flame },
  yoga:     { label: 'Yoga',       color: 'hsl(280 60% 55%)',      bg: 'hsl(280 60% 55% / 0.12)',    icon: tIcons.heart },
  pilates:  { label: 'Pilates',    color: adminTokens.pink,        bg: 'hsl(330 80% 58% / 0.12)',    icon: tIcons.heart },
  cardio:   { label: 'Cardio',     color: adminTokens.info,        bg: adminTokens.infoSoft,         icon: tIcons.trendU },
  mobility: { label: 'Mobility',   color: adminTokens.teal,        bg: adminTokens.tealSoft,         icon: tIcons.bolt },
  rehab:    { label: 'Rehab',      color: adminTokens.success,     bg: adminTokens.successSoft,      icon: tIcons.heart },
  boxing:   { label: 'Boxing',     color: 'hsl(40 90% 50%)',       bg: 'hsl(40 90% 50% / 0.14)',     icon: tIcons.bolt },
};

const NOW_MIN = 14 * 60 + 36; // 14:36 today

const TRAINERS = [
  { id: 1, name: 'Coach Arm',   fullName: 'อาร์ม ธนกฤต',     ini: 'AT',
    spec: ['hiit','strength'], rate: 1500, lvl: 'Senior', yrs: 7,
    ptClients: 18, ptToday: 3, classesWeek: 14, rating: 4.9, reviews: 186,
    status: 'onshift', nextSlot: '15:00 · PT w/ Pim',
    shift: { start: 8*60, end: 18*60 }, busy: [[9*60,10*60],[11*60,12*60],[14*60,15*60]],
    mthRevenue: 84500, mthGrowth: 12, utilization: 78,
    bio: 'อดีตนักกีฬา HIIT ทีมชาติ · สอนมา 7 ปี · ถนัดคนที่อยากลดไขมันเร็ว',
    certs: ['NASM-CPT','CrossFit L2','FMS'], langs: ['ไทย','English'],
    weekSpark: [8,10,11,9,12,14,13], ratingSpark: [4.7,4.8,4.9,4.9,4.9,4.9,4.9],
  },
  { id: 2, name: 'Coach Nok',   fullName: 'นก พิชา',           ini: 'PN',
    spec: ['yoga','mobility'], rate: 1200, lvl: 'Senior', yrs: 9,
    ptClients: 24, ptToday: 2, classesWeek: 18, rating: 4.95, reviews: 248,
    status: 'onshift', nextSlot: '15:30 · Yoga Flow',
    shift: { start: 9*60, end: 20*60 }, busy: [[10*60,11*60],[13*60,14*60],[18.5*60,19.5*60]],
    mthRevenue: 92000, mthGrowth: 8, utilization: 84,
    bio: 'Yoga Alliance 500hr · เชี่ยวชาญ Vinyasa & Yin · สอนหัวใจคือลมหายใจ',
    certs: ['Yoga Alliance RYT-500','Precision Movement'], langs: ['ไทย','English','ญี่ปุ่น'],
    weekSpark: [10,12,11,14,13,15,16], ratingSpark: [4.9,4.9,4.95,4.95,4.95,4.95,4.95],
  },
  { id: 3, name: 'Coach Best',  fullName: 'เบสท์ วรพล',         ini: 'WB',
    spec: ['hiit','cardio','boxing'], rate: 1400, lvl: 'Senior', yrs: 6,
    ptClients: 16, ptToday: 0, classesWeek: 16, rating: 4.85, reviews: 164,
    status: 'break', nextSlot: '16:00 · Spin Class',
    shift: { start: 10*60, end: 21*60 }, busy: [[11*60,12*60],[16*60,17*60],[19*60,20*60]],
    mthRevenue: 76500, mthGrowth: 15, utilization: 71,
    bio: 'โค้ช Boxing & HIIT — ผลงาน: ช่วยลูกค้าลด 12 กก. ใน 3 เดือน',
    certs: ['NASM-CPT','Boxing Thailand L3'], langs: ['ไทย','English'],
    weekSpark: [9,10,11,12,11,13,14], ratingSpark: [4.8,4.8,4.85,4.85,4.85,4.85,4.85],
  },
  { id: 4, name: 'Coach P',     fullName: 'ป วิทวัส',           ini: 'PV',
    spec: ['strength','rehab'], rate: 1800, lvl: 'Lead', yrs: 11,
    ptClients: 22, ptToday: 4, classesWeek: 10, rating: 4.92, reviews: 312,
    status: 'onshift', nextSlot: '14:45 · PT w/ Kongphop (12 นาที)',
    shift: { start: 7*60, end: 17*60 }, busy: [[8*60,9*60],[10*60,11*60],[14.75*60,15.75*60],[16*60,17*60]],
    mthRevenue: 124000, mthGrowth: 5, utilization: 92,
    bio: 'Head Coach · พัฒนาโปรแกรม Strength ของ MOOM · ถนัด rehab บาดเจ็บหลัง/เข่า',
    certs: ['NSCA-CSCS','FRC','PRI'], langs: ['ไทย','English','จีน'],
    weekSpark: [12,13,14,15,14,16,17], ratingSpark: [4.9,4.9,4.92,4.92,4.92,4.92,4.92],
  },
  { id: 5, name: 'Coach Mild',  fullName: 'มายด์ ปิยะภรณ์',     ini: 'PM',
    spec: ['pilates','mobility','yoga'], rate: 1300, lvl: 'Mid', yrs: 4,
    ptClients: 14, ptToday: 2, classesWeek: 12, rating: 4.88, reviews: 98,
    status: 'onshift', nextSlot: '17:00 · Pilates Reformer',
    shift: { start: 11*60, end: 20*60 }, busy: [[12*60,13*60],[15*60,16*60],[17*60,18*60]],
    mthRevenue: 64000, mthGrowth: 22, utilization: 68,
    bio: 'Reformer Pilates + Yin Yoga · สอนคนออฟฟิศให้กลับมาเดินตรง',
    certs: ['BASI Pilates','Yoga Alliance RYT-200'], langs: ['ไทย','English'],
    weekSpark: [6,7,8,9,10,11,12], ratingSpark: [4.85,4.86,4.87,4.88,4.88,4.88,4.88],
  },
  { id: 6, name: 'Coach Ice',   fullName: 'ไอซ์ ณัฐชยา',         ini: 'NI',
    spec: ['cardio','strength'], rate: 1200, lvl: 'Mid', yrs: 3,
    ptClients: 11, ptToday: 1, classesWeek: 14, rating: 4.7, reviews: 72,
    status: 'off', nextSlot: 'พรุ่งนี้ 09:00',
    shift: { start: 0, end: 0 }, busy: [],
    mthRevenue: 48000, mthGrowth: 18, utilization: 62,
    bio: 'อดีตนักวิ่งมาราธอน · โปรแกรมลดไขมันแบบนุ่มๆ',
    certs: ['ACE-CPT'], langs: ['ไทย','English'],
    weekSpark: [7,8,7,9,10,10,11], ratingSpark: [4.6,4.65,4.7,4.7,4.7,4.7,4.7],
  },
  { id: 7, name: 'Coach Nat',   fullName: 'นัท วีรภัทร',          ini: 'VN',
    spec: ['boxing','hiit'], rate: 1400, lvl: 'Senior', yrs: 8,
    ptClients: 19, ptToday: 3, classesWeek: 10, rating: 4.86, reviews: 144,
    status: 'onshift', nextSlot: '15:15 · Boxing Basic',
    shift: { start: 12*60, end: 21*60 }, busy: [[13*60,14*60],[15.25*60,16.25*60],[18*60,19*60]],
    mthRevenue: 78000, mthGrowth: 10, utilization: 74,
    bio: 'Muay Thai + Western Boxing · สอนได้ทั้งเด็กและผู้ใหญ่',
    certs: ['Muay Thai Federation','NASM-CPT'], langs: ['ไทย','English'],
    weekSpark: [8,9,10,9,11,12,11], ratingSpark: [4.8,4.83,4.86,4.86,4.86,4.86,4.86],
  },
  { id: 8, name: 'Coach Pim',   fullName: 'พิม อภิชญา',           ini: 'AP',
    spec: ['yoga','pilates'], rate: 1100, lvl: 'Mid', yrs: 5,
    ptClients: 13, ptToday: 2, classesWeek: 16, rating: 4.9, reviews: 132,
    status: 'onshift', nextSlot: '15:00 · Hot Yoga',
    shift: { start: 8*60, end: 16*60 }, busy: [[9*60,10*60],[15*60,16*60]],
    mthRevenue: 58000, mthGrowth: 14, utilization: 70,
    bio: 'Hot Yoga + Pilates Mat · บรรยากาศอบอุ่น สอนผู้เริ่มต้น',
    certs: ['Yoga Alliance RYT-200','STOTT Pilates'], langs: ['ไทย','English'],
    weekSpark: [10,11,12,11,13,14,15], ratingSpark: [4.88,4.89,4.9,4.9,4.9,4.9,4.9],
  },
  { id: 9, name: 'Coach Jay',   fullName: 'เจ กิตติชัย',           ini: 'KJ',
    spec: ['strength','hiit','rehab'], rate: 1600, lvl: 'Senior', yrs: 10,
    ptClients: 20, ptToday: 2, classesWeek: 8, rating: 4.88, reviews: 220,
    status: 'onshift', nextSlot: '16:30 · PT w/ Nattaya',
    shift: { start: 13*60, end: 22*60 }, busy: [[14*60,15*60],[16.5*60,17.5*60],[20*60,21*60]],
    mthRevenue: 98000, mthGrowth: 7, utilization: 88,
    bio: 'โปรแกรมสร้างกล้ามเนื้อแบบปลอดภัย · ถนัดคนเข่าไม่แข็งแรง',
    certs: ['NSCA-CSCS','FMS','TRX'], langs: ['ไทย','English'],
    weekSpark: [10,11,12,13,12,14,15], ratingSpark: [4.85,4.87,4.88,4.88,4.88,4.88,4.88],
  },
  { id: 10, name: 'Coach Toey', fullName: 'เต้ย ภาสกร',           ini: 'PT',
    spec: ['cardio','cycling'], rate: 1100, lvl: 'Mid', yrs: 4,
    ptClients: 9, ptToday: 1, classesWeek: 18, rating: 4.75, reviews: 86,
    status: 'leave', nextSlot: 'ลาป่วยถึงศุกร์',
    shift: { start: 0, end: 0 }, busy: [],
    mthRevenue: 42000, mthGrowth: -8, utilization: 55,
    bio: 'Spin Class specialist · พลังแรง เพลงฟังสนุก',
    certs: ['Schwinn Cycling','NASM-CPT'], langs: ['ไทย'],
    weekSpark: [9,10,8,6,4,2,0], ratingSpark: [4.7,4.72,4.75,4.75,4.75,4.75,4.75],
  },
];

const STATUS_T = {
  onshift: { label: 'กำลังทำงาน', color: adminTokens.success, bg: adminTokens.successSoft, dot: true },
  break:   { label: 'พักอยู่',    color: adminTokens.warn,    bg: adminTokens.warnSoft,    dot: true },
  off:     { label: 'เลิกงานแล้ว', color: adminTokens.muted,   bg: adminTokens.subtle },
  leave:   { label: 'ลา',         color: adminTokens.destr,   bg: adminTokens.destrSoft },
};

/* ---------- Primitives ---------- */
const TIcon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const TPill = ({ children, color = adminTokens.muted, bg, dot, strong }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 9999, fontSize: 11,
    fontWeight: strong ? 800 : 700, letterSpacing: '.01em',
    background: bg, color, whiteSpace: 'nowrap',
  }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color,
                            animation: 'admin-pulse 1.6s ease-in-out infinite' }}/>}
    {children}
  </span>
);

const TBtn = ({ children, icon, iconRight, primary, ghost, danger, onClick, small, active }) => {
  const h = small ? 30 : 36;
  const p = small ? '0 10px' : '0 14px';
  let bg, color, border;
  if (primary)      { bg = adminTokens.orange; color = '#fff'; border = 0; }
  else if (danger)  { bg = adminTokens.surface; color = adminTokens.destr; border = `1px solid ${adminTokens.border}`; }
  else if (ghost)   { bg = active ? adminTokens.subtle : 'transparent'; color = adminTokens.muted; border = 0; }
  else              { bg = adminTokens.surface; color = adminTokens.black; border = `1px solid ${adminTokens.border}`; }
  return (
    <button onClick={onClick} style={{
      background: bg, color, border, height: h, padding: p, borderRadius: adminTokens.r2,
      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      boxShadow: primary ? adminTokens.shadowOrange : 'none',
    }}>
      {icon && <TIcon d={icon} size={13} stroke={2.2}/>}
      {children}
      {iconRight && <TIcon d={iconRight} size={13} stroke={2.2}/>}
    </button>
  );
};

const TCard = ({ title, subtitle, action, children, pad = 16, noBody, accent }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    {accent && <div style={{ height: 3, background: accent }}/>}
    {title && (
      <div style={{
        padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${adminTokens.divider}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.005em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    {!noBody && <div style={{ padding: pad, flex: 1 }}>{children}</div>}
    {noBody && children}
  </div>
);

const TAvatar = ({ t, size = 44, showStatus = true }) => {
  const specColor = SPECIALTIES[t.spec[0]]?.color || adminTokens.orange;
  const specBg    = SPECIALTIES[t.spec[0]]?.bg    || adminTokens.orangeSoft;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: specBg, color: specColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.34, fontWeight: 800, letterSpacing: '.02em',
      }}>{t.ini}</div>
      {showStatus && t.status !== 'off' && t.status !== 'leave' && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: size * 0.32, height: size * 0.32, borderRadius: '50%',
          background: STATUS_T[t.status].color, border: `2px solid ${adminTokens.surface}`,
        }}/>
      )}
      {t.lvl === 'Lead' && (
        <div style={{
          position: 'absolute', top: -3, right: -3,
          width: 18, height: 18, borderRadius: '50%', background: '#fbbf24',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', border: `2px solid ${adminTokens.surface}`,
        }}>
          <TIcon d={tIcons.star} size={9} stroke={2.5}/>
        </div>
      )}
    </div>
  );
};

const Stars = ({ rating, size = 12 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {[0,1,2,3,4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
             fill={i < full ? '#fbbf24' : i === full && half ? 'url(#halfStar)' : 'none'}
             stroke="#fbbf24" strokeWidth="2">
          <polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/>
        </svg>
      ))}
    </span>
  );
};

const TSpark = ({ series, w = 80, h = 24, color = adminTokens.orange, filled }) => {
  if (!series?.length) return <div style={{ width: w, height: h }}/>;
  const min = Math.min(...series), max = Math.max(...series);
  const range = max - min || 1;
  const step = w / (series.length - 1 || 1);
  const pts = series.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {filled && <path d={area} fill={color} opacity=".14"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color}/>
    </svg>
  );
};

const TDelta = ({ v }) => {
  const up = v >= 0;
  const fg = v === 0 ? adminTokens.muted : up ? adminTokens.success : adminTokens.destr;
  const bg = v === 0 ? adminTokens.subtle : up ? adminTokens.successSoft : adminTokens.destrSoft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 9999,
      display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
      color: fg, background: bg,
    }}>
      {v !== 0 && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
             style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
          <polyline points="6 15 12 9 18 15"/>
        </svg>
      )}
      {up && v !== 0 ? '+' : ''}{v}%
    </span>
  );
};

/* ---------- KPI strip ---------- */
const TrainerKpi = () => {
  const active = TRAINERS.filter(t => t.status === 'onshift' || t.status === 'break').length;
  const ptToday = TRAINERS.reduce((s, t) => s + t.ptToday, 0);
  const revenue = TRAINERS.reduce((s, t) => s + t.mthRevenue, 0);
  const avgRating = (TRAINERS.reduce((s, t) => s + t.rating, 0) / TRAINERS.length);

  const cards = [
    { label:'เทรนเนอร์กำลังทำงาน', value:active, sub:`จาก ${TRAINERS.length} คนทั้งหมด`,
      delta:null, fg:adminTokens.success, bg:adminTokens.successSoft, icon:tIcons.userOne,
      spark:[5,6,6,7,6,7,active] },
    { label:'PT วันนี้', value:ptToday, sub:'+4 จากเมื่อวาน',
      delta:12, fg:adminTokens.orange, bg:adminTokens.orangeSoft, icon:tIcons.dumb,
      spark:[14,16,18,15,17,20,ptToday] },
    { label:'รายได้จาก PT เดือนนี้', value:`฿${(revenue/1000).toFixed(0)}K`, sub:'61% ของเป้าหมาย',
      delta:8, fg:adminTokens.info, bg:adminTokens.infoSoft, icon:tIcons.cash,
      spark:[520,560,610,640,680,720,Math.round(revenue/1000)] },
    { label:'คะแนนเฉลี่ย', value:avgRating.toFixed(2), sub:`${TRAINERS.reduce((s,t)=>s+t.reviews,0).toLocaleString()} รีวิว`,
      delta:null, fg:'#fbbf24', bg:'rgba(251,191,36,.14)', icon:tIcons.star,
      spark:[4.82,4.84,4.86,4.87,4.87,4.88,avgRating] },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 16, boxShadow: adminTokens.shadowSm,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{
              width:30, height:30, borderRadius:8, background:c.bg, color:c.fg,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <TIcon d={c.icon} size={15} stroke={2.2}/>
            </div>
            <div style={{ fontSize:11, color:adminTokens.muted, fontWeight:700,
                          letterSpacing:'.02em', textTransform:'uppercase', flex:1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.label}
            </div>
            {c.delta !== null && <TDelta v={c.delta}/>}
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:8 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:30, fontWeight:800, color:adminTokens.black,
                            letterSpacing:'-.02em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                {c.value}
              </div>
              <div style={{ fontSize:11, color:adminTokens.muted, marginTop:6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.sub}
              </div>
            </div>
            <TSpark series={c.spark} color={c.fg} w={70} h={28} filled/>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------- Now on shift (live timeline) ---------- */
const ShiftTimeline = ({ trainer, width }) => {
  const dayStart = 6 * 60, dayEnd = 22 * 60, range = dayEnd - dayStart;
  const px = m => ((m - dayStart) / range) * width;
  const nowInShift = trainer.shift.start <= NOW_MIN && NOW_MIN <= trainer.shift.end;

  return (
    <div style={{ position: 'relative', width, height: 22 }}>
      {/* base line */}
      <div style={{ position:'absolute', left:0, right:0, top:8, height:6,
                    background: adminTokens.subtle, borderRadius: 9999 }}/>
      {/* shift */}
      {trainer.shift.start > 0 && (
        <div style={{
          position:'absolute', left: px(trainer.shift.start),
          width: px(trainer.shift.end) - px(trainer.shift.start),
          top:8, height:6, background: STATUS_T[trainer.status].color + '33',
          borderRadius: 9999,
        }}/>
      )}
      {/* busy blocks */}
      {trainer.busy.map((b, i) => (
        <div key={i} style={{
          position:'absolute', left: px(b[0]), width: px(b[1]) - px(b[0]),
          top: 6, height: 10, background: adminTokens.orange,
          borderRadius: 3, opacity: 0.85,
        }}/>
      ))}
      {/* now marker */}
      {nowInShift && (
        <div style={{
          position:'absolute', left: px(NOW_MIN), top: 0, height: 22,
          width: 2, background: adminTokens.destr, transform: 'translateX(-1px)',
        }}>
          <div style={{
            position:'absolute', top:-4, left:-4, width:10, height:10,
            borderRadius:'50%', background: adminTokens.destr,
            boxShadow: `0 0 0 3px ${adminTokens.destr}33`,
          }}/>
        </div>
      )}
    </div>
  );
};

const NowOnShift = ({ onOpen, onBook }) => {
  const working = TRAINERS.filter(t => t.status === 'onshift' || t.status === 'break');
  return (
    <div style={{
      background: `linear-gradient(135deg, ${adminTokens.black} 0%, #171b22 100%)`,
      borderRadius: adminTokens.r3, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -60, top: -60, width: 280, height: 280,
        background: `radial-gradient(circle, ${adminTokens.orange}2a 0%, transparent 70%)`, pointerEvents: 'none',
      }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, position: 'relative' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: adminTokens.success,
          animation: 'admin-pulse 1.6s ease-in-out infinite',
        }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.01em' }}>
            กำลังทำงานตอนนี้ · {working.length} คน
          </div>
          <div style={{ fontSize: 11, opacity: .6, fontWeight: 600 }}>
            เวลา 14:36 · แถบส้มคือช่วงที่จอง · เส้นแดงคือเวลานี้
          </div>
        </div>
        <TBtn small onClick={onBook} icon={tIcons.plus}>
          <span style={{ color: '#fff', opacity: .85 }}>จอง PT ใหม่</span>
        </TBtn>
      </div>

      {/* time scale */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, alignItems: 'center' }}>
          <div/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                        fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 6,
                        fontVariantNumeric: 'tabular-nums' }}>
            {['06','08','10','12','14','16','18','20','22'].map(h => <span key={h}>{h}:00</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {working.map(t => (
            <button key={t.id} onClick={() => onOpen(t)} style={{
              display: 'grid', gridTemplateColumns: '180px 1fr 80px', gap: 14, alignItems: 'center',
              padding: '8px 10px', background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, cursor: 'pointer',
              color: '#fff', fontFamily: 'inherit', textAlign: 'left', transition: 'background .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <TAvatar t={t} size={34}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, opacity: .6, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.nextSlot}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ShiftTimeline trainer={t} width={420}/>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)',
                             whiteSpace: 'nowrap', textAlign: 'right' }}>
                {t.ptToday} PT / {t.utilization}%
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- Trainer card (grid) ---------- */
const TrainerCard = ({ t, onOpen, onAction }) => {
  const st = STATUS_T[t.status];
  const topSpec = SPECIALTIES[t.spec[0]];

  return (
    <div onClick={() => onOpen(t)} style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, overflow: 'hidden', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', boxShadow: adminTokens.shadowSm,
      transition: 'all .15s', position: 'relative',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = topSpec.color; e.currentTarget.style.boxShadow = adminTokens.shadowLg; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.boxShadow = adminTokens.shadowSm; }}>

      {/* banner */}
      <div style={{
        height: 50, background: `linear-gradient(135deg, ${topSpec.color} 0%, ${topSpec.color} 60%, ${topSpec.bg} 100%)`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6,
        }}>
          <TPill {...st} dot={st.dot} strong>{st.label}</TPill>
        </div>
      </div>

      {/* identity */}
      <div style={{ padding: '0 16px 12px', marginTop: -22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{
            padding: 3, background: adminTokens.surface, borderRadius: '50%', flexShrink: 0,
          }}>
            <TAvatar t={t} size={56} showStatus={false}/>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                background: t.lvl === 'Lead' ? '#fef3c7' : t.lvl === 'Senior' ? adminTokens.orangeSoft : adminTokens.subtle,
                color: t.lvl === 'Lead' ? '#92400e' : t.lvl === 'Senior' ? adminTokens.orange : adminTokens.muted,
              }}>{t.lvl}</span>
              <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>· {t.yrs} ปี</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.01em' }}>
            {t.name}
          </div>
          <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.fullName}
          </div>
        </div>

        {/* specialties */}
        <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
          {t.spec.slice(0, 3).map(s => {
            const sp = SPECIALTIES[s];
            if (!sp) return null;
            return (
              <span key={s} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: sp.bg, color: sp.color, whiteSpace: 'nowrap',
              }}>
                <TIcon d={sp.icon} size={10} stroke={2.3}/>
                {sp.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* rating + reviews */}
      <div style={{
        padding: '10px 16px', background: adminTokens.subtle,
        display: 'flex', alignItems: 'center', gap: 8,
        borderTop: `1px dashed ${adminTokens.border}`,
        borderBottom: `1px dashed ${adminTokens.border}`,
      }}>
        <Stars rating={t.rating}/>
        <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
          {t.rating.toFixed(2)}
        </div>
        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
          {t.reviews} รีวิว
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 700 }}>
          ฿{t.rate.toLocaleString()}<span style={{ fontWeight: 500 }}>/ชม.</span>
        </div>
      </div>

      {/* stats */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>PT ลูกค้า</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {t.ptClients}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>คลาส/สัปดาห์</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {t.classesWeek}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Util.</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.utilization > 85 ? adminTokens.warn : adminTokens.black, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {t.utilization}%
            </div>
          </div>
        </div>

        {/* utilization bar */}
        <div>
          <div style={{ height: 5, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              width: `${t.utilization}%`, height: '100%',
              background: t.utilization > 85 ? adminTokens.warn : t.utilization > 60 ? adminTokens.success : adminTokens.info,
              borderRadius: 9999, transition: 'width .3s',
            }}/>
          </div>
          <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 4, fontWeight: 600,
                         display: 'flex', justifyContent: 'space-between' }}>
            <span>รายได้เดือนนี้ ฿{(t.mthRevenue/1000).toFixed(0)}K</span>
            <TDelta v={t.mthGrowth}/>
          </div>
        </div>

        {/* next action */}
        <div style={{
          padding: '8px 10px', background: topSpec.bg, borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
        }}>
          <TIcon d={tIcons.clock} size={12}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: topSpec.color, flex: 1,
                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ต่อไป · {t.nextSlot}
          </span>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onAction('book', t); }} style={cardBtnPrimary}>
            <TIcon d={tIcons.plus} size={12} stroke={2.4}/>
            จอง PT
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAction('message', t); }} style={cardBtnSecondary} title="แชท">
            <TIcon d={tIcons.message} size={13}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAction('schedule', t); }} style={cardBtnSecondary} title="ตาราง">
            <TIcon d={tIcons.cal} size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
};

const cardBtnPrimary = {
  flex: 1, height: 34, borderRadius: 8, border: 0,
  background: adminTokens.black, color: '#fff',
  fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
};
const cardBtnSecondary = {
  width: 34, height: 34, borderRadius: 8, border: `1px solid ${adminTokens.border}`,
  background: adminTokens.surface, color: adminTokens.muted, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

/* ---------- List row ---------- */
const TrainerRow = ({ t, onOpen, onAction }) => {
  const st = STATUS_T[t.status];
  const topSpec = SPECIALTIES[t.spec[0]];
  return (
    <div onClick={() => onOpen(t)} style={{
      display: 'grid',
      gridTemplateColumns: '2.2fr 1.3fr 0.9fr 1fr 1fr 0.9fr 110px',
      alignItems: 'center', gap: 10, padding: '12px 16px',
      borderBottom: `1px solid ${adminTokens.divider}`, cursor: 'pointer',
      transition: 'background .1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = adminTokens.subtle; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

      {/* Name + specialty */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <TAvatar t={t} size={36}/>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.name}
          </div>
          <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, marginTop: 2,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.lvl} · {t.yrs} ปี
          </div>
        </div>
      </div>

      {/* Specs */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {t.spec.slice(0, 2).map(s => {
          const sp = SPECIALTIES[s];
          if (!sp) return null;
          return (
            <span key={s} style={{
              padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
              background: sp.bg, color: sp.color, whiteSpace: 'nowrap',
            }}>{sp.label}</span>
          );
        })}
      </div>

      {/* Status */}
      <div><TPill {...st} dot={st.dot}>{st.label}</TPill></div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        <TIcon d={<polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/>} size={12} stroke={0}/>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
          <polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
          {t.rating.toFixed(2)}
        </span>
        <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
          ({t.reviews})
        </span>
      </div>

      {/* Utilization */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 5, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              width: `${t.utilization}%`, height: '100%',
              background: t.utilization > 85 ? adminTokens.warn : topSpec.color,
            }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
            {t.utilization}%
          </span>
        </div>
        <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 3 }}>
          {t.ptClients} PT · {t.classesWeek} คลาส
        </div>
      </div>

      {/* Revenue */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
          ฿{(t.mthRevenue/1000).toFixed(0)}K
        </div>
        <div style={{ marginTop: 3 }}><TDelta v={t.mthGrowth}/></div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        <button onClick={(e) => { e.stopPropagation(); onAction('book', t); }} style={rowBtn} title="จอง PT">
          <TIcon d={tIcons.plus} size={13} stroke={2.4}/>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAction('message', t); }} style={rowBtn} title="แชท">
          <TIcon d={tIcons.message} size={13}/>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAction('schedule', t); }} style={rowBtn} title="ตาราง">
          <TIcon d={tIcons.cal} size={13}/>
        </button>
      </div>
    </div>
  );
};

const rowBtn = {
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${adminTokens.border}`,
  background: adminTokens.surface, color: adminTokens.muted, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

/* ---------- Leaderboard ---------- */
const Leaderboard = () => {
  const sorted = [...TRAINERS].sort((a, b) => b.mthRevenue - a.mthRevenue).slice(0, 6);
  const max = sorted[0].mthRevenue;
  return (
    <TCard title="ผลงาน · เดือนนี้" subtitle="Top 6 · จัดตามรายได้ PT"
           action={<TBtn small ghost icon={tIcons.filter}>กรอง</TBtn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((t, i) => {
          const pct = (t.mthRevenue / max) * 100;
          const topSpec = SPECIALTIES[t.spec[0]];
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 22, textAlign: 'center', fontSize: 11, fontWeight: 800,
                color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : adminTokens.muted,
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </div>
              <TAvatar t={t} size={30} showStatus={false}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    ฿{(t.mthRevenue/1000).toFixed(0)}K
                  </div>
                </div>
                <div style={{ height: 5, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: topSpec.color, borderRadius: 9999 }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </TCard>
  );
};

/* ---------- Quick-book panel ---------- */
const QuickBook = ({ onBook }) => {
  const [q, setQ] = useStateT('');
  const available = TRAINERS.filter(t => t.status === 'onshift').slice(0, 4);
  const slots = ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
  return (
    <TCard title="จอง PT ด่วน" subtitle="วันนี้ (19 เม.ย.)"
           action={<TBtn small ghost icon={tIcons.cal}>เปลี่ยนวัน</TBtn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* member picker */}
        <div style={{
          height: 40, padding: '0 12px', background: adminTokens.subtle, borderRadius: 9,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <TIcon d={tIcons.search} size={14}/>
          <input value={q} onChange={e => setQ(e.target.value)}
                 placeholder="เลือกสมาชิก..."
                 style={{ flex: 1, border: 0, background: 'transparent', outline: 'none',
                          fontFamily: 'inherit', fontSize: 13, color: adminTokens.black }}/>
        </div>
        {/* slot chips */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: adminTokens.muted,
                        textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
            ช่วงเวลาว่าง
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {slots.map(s => (
              <button key={s} style={{
                height: 34, borderRadius: 7, border: `1px solid ${adminTokens.border}`,
                background: adminTokens.surface, color: adminTokens.black,
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
              }}>{s}</button>
            ))}
          </div>
        </div>
        {/* suggested trainers */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: adminTokens.muted,
                        textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
            เทรนเนอร์ว่าง
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.map(t => (
              <button key={t.id} onClick={() => onBook(t)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', border: `1px solid ${adminTokens.border}`,
                borderRadius: 10, background: adminTokens.surface, cursor: 'pointer',
                fontFamily: 'inherit', color: adminTokens.black,
              }}>
                <TAvatar t={t} size={32} showStatus={false}/>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {t.spec.slice(0,2).map(s => SPECIALTIES[s]?.label).join(' · ')}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: adminTokens.black, whiteSpace: 'nowrap' }}>
                  ฿{t.rate.toLocaleString()}
                </div>
                <TIcon d={tIcons.chevR} size={12}/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </TCard>
  );
};

/* ---------- Drawer ---------- */
const TrainerDrawer = ({ trainer, onClose, onAction }) => {
  const [tab, setTab] = useStateT('overview');
  if (!trainer) return null;
  const st = STATUS_T[trainer.status];
  const topSpec = SPECIALTIES[trainer.spec[0]];

  const tabs = [
    { id: 'overview', label: 'ภาพรวม' },
    { id: 'schedule', label: 'ตาราง' },
    { id: 'clients',  label: 'ลูกค้า PT' },
    { id: 'reviews',  label: 'รีวิว' },
    { id: 'earnings', label: 'รายได้' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 200,
      display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 660, maxWidth: '95vw', background: adminTokens.surface,
        display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 48px rgba(15,23,42,.2)',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${topSpec.color} 0%, ${topSpec.color} 55%, ${topSpec.bg} 100%)`,
          color: '#fff', padding: '20px 22px 18px', position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,.15)', border: 0, width: 32, height: 32,
            borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <TIcon d={tIcons.x} size={16}/>
          </button>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              padding: 3, background: 'rgba(255,255,255,.25)', borderRadius: '50%', flexShrink: 0,
            }}>
              <TAvatar t={trainer} size={68} showStatus={false}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,.25)', letterSpacing: '.04em',
                }}>{trainer.lvl.toUpperCase()}</span>
                <TPill {...st} dot={st.dot}>{st.label}</TPill>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2 }}>
                {trainer.name}
              </div>
              <div style={{ fontSize: 12, opacity: .85, marginTop: 2, fontWeight: 600 }}>
                {trainer.fullName} · ประสบการณ์ {trainer.yrs} ปี
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Stars rating={trainer.rating} size={14}/>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{trainer.rating.toFixed(2)}</span>
                <span style={{ fontSize: 11, opacity: .75, fontWeight: 600 }}>
                  ({trainer.reviews} รีวิว)
                </span>
                <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,.3)' }}/>
                <span style={{ fontSize: 13, fontWeight: 800 }}>฿{trainer.rate.toLocaleString()}</span>
                <span style={{ fontSize: 11, opacity: .75, fontWeight: 600 }}>/ชม.</span>
              </div>
            </div>
          </div>

          {/* actions row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => onAction('book', trainer)} style={drawerActionPrimary}>
              <TIcon d={tIcons.plus} size={13} stroke={2.4}/> จอง PT
            </button>
            <button onClick={() => onAction('message', trainer)} style={drawerAction}>
              <TIcon d={tIcons.message} size={13}/> แชท
            </button>
            <button onClick={() => onAction('phone', trainer)} style={drawerAction}>
              <TIcon d={tIcons.phone} size={13}/> โทร
            </button>
            <button onClick={() => onAction('edit', trainer)} style={drawerAction}>
              <TIcon d={tIcons.edit} size={13}/> แก้ไข
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '0 20px',
                       borderBottom: `1px solid ${adminTokens.divider}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'transparent', border: 0, padding: '14px 14px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              color: tab === t.id ? adminTokens.black : adminTokens.muted,
              borderBottom: tab === t.id ? `2px solid ${adminTokens.orange}` : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22, background: adminTokens.bg }}>
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { l:'PT ลูกค้า',      v: trainer.ptClients,    s:'active',           fg: adminTokens.orange },
                  { l:'คลาส/สัปดาห์',   v: trainer.classesWeek,  s:'เฉลี่ย 4 วัน',      fg: adminTokens.info },
                  { l:'Utilization',    v: `${trainer.utilization}%`, s:'ของเวลาทำงาน', fg: trainer.utilization > 85 ? adminTokens.warn : adminTokens.success },
                  { l:'รายได้เดือนนี้',  v: `฿${(trainer.mthRevenue/1000).toFixed(0)}K`, s:`${trainer.mthGrowth > 0 ? '+' : ''}${trainer.mthGrowth}%`, fg: adminTokens.black },
                ].map((k, i) => (
                  <div key={i} style={{
                    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k.fg, marginTop: 4, letterSpacing: '-.01em', fontVariantNumeric: 'tabular-nums' }}>
                      {k.v}
                    </div>
                    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>{k.s}</div>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <TCard title="เกี่ยวกับ" pad={14}>
                <div style={{ fontSize: 13, color: adminTokens.black, lineHeight: 1.6, fontWeight: 500 }}>
                  {trainer.bio}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {trainer.spec.map(s => {
                    const sp = SPECIALTIES[s];
                    if (!sp) return null;
                    return (
                      <span key={s} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                        background: sp.bg, color: sp.color,
                      }}>
                        <TIcon d={sp.icon} size={11} stroke={2.3}/>
                        {sp.label}
                      </span>
                    );
                  })}
                </div>
              </TCard>

              {/* Certs + langs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <TCard title="ใบรับรอง" pad={14}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {trainer.certs.map(c => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, background: adminTokens.orangeSoft,
                          color: adminTokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <TIcon d={tIcons.badge} size={11} stroke={2.3}/>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </TCard>
                <TCard title="ภาษา" pad={14}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {trainer.langs.map(l => (
                      <span key={l} style={{
                        padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                        background: adminTokens.subtle, color: adminTokens.black,
                      }}>{l}</span>
                    ))}
                  </div>
                </TCard>
              </div>

              {/* Trend */}
              <TCard title="PT สัปดาห์ที่ผ่านมา" pad={14}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {trainer.weekSpark.map((v, i) => {
                    const max = Math.max(...trainer.weekSpark);
                    const h = (v / max) * 70;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: adminTokens.muted }}>{v}</div>
                        <div style={{
                          width: '100%', height: h, minHeight: 4,
                          background: topSpec.color, opacity: i === 6 ? 1 : 0.4 + i * 0.1,
                          borderRadius: '4px 4px 0 0',
                        }}/>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['จ','อ','พ','พฤ','ศ','ส','อา'].map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11,
                                           fontWeight: 700, color: adminTokens.muted }}>
                      {d}
                    </div>
                  ))}
                </div>
              </TCard>
            </div>
          )}

          {tab === 'schedule' && (
            <TCard title="ตารางวันนี้" subtitle="19 เมษายน · 14:36 ตอนนี้" pad={14}>
              {/* timeline */}
              <div style={{ position: 'relative', paddingTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                              fontWeight: 700, color: adminTokens.muted, marginBottom: 6,
                              fontVariantNumeric: 'tabular-nums' }}>
                  {['06','09','12','15','18','21'].map(h => <span key={h}>{h}:00</span>)}
                </div>
                <div style={{ height: 14, background: adminTokens.subtle, borderRadius: 9999,
                               position: 'relative', overflow: 'visible' }}>
                  {trainer.shift.start > 0 && (() => {
                    const dayStart = 6 * 60, range = 16 * 60;
                    const l = ((trainer.shift.start - dayStart) / range) * 100;
                    const w = ((trainer.shift.end - trainer.shift.start) / range) * 100;
                    return (
                      <div style={{
                        position: 'absolute', left: `${l}%`, width: `${w}%`, top: 0, height: 14,
                        background: topSpec.bg, border: `1px solid ${topSpec.color}`,
                        borderRadius: 9999,
                      }}/>
                    );
                  })()}
                  {trainer.busy.map((b, i) => {
                    const dayStart = 6 * 60, range = 16 * 60;
                    const l = ((b[0] - dayStart) / range) * 100;
                    const w = ((b[1] - b[0]) / range) * 100;
                    return (
                      <div key={i} style={{
                        position: 'absolute', left: `${l}%`, width: `${w}%`, top: 2, height: 10,
                        background: topSpec.color, borderRadius: 9999,
                      }}/>
                    );
                  })}
                  {/* now */}
                  <div style={{
                    position: 'absolute',
                    left: `${Math.max(0, Math.min(100, ((NOW_MIN - 6*60) / (16*60)) * 100))}%`,
                    top: -6, height: 26, width: 2, background: adminTokens.destr,
                    transform: 'translateX(-1px)',
                  }}>
                    <div style={{
                      position: 'absolute', top: -6, left: -6, width: 14, height: 14,
                      borderRadius: '50%', background: adminTokens.destr,
                      boxShadow: `0 0 0 3px ${adminTokens.destr}33`,
                    }}/>
                  </div>
                </div>
              </div>

              {/* session list */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { t:'08:00-09:00', label:'PT w/ Nattaya M.', typ:'PT',    done: true },
                  { t:'10:00-11:00', label:'PT w/ Korn T.',     typ:'PT',    done: true },
                  { t:'14:45-15:45', label:'PT w/ Kongphop',    typ:'PT',    done: false, next: true },
                  { t:'16:00-17:00', label:'HIIT Express',      typ:'Class', done: false },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 9,
                    border: `1px solid ${s.next ? adminTokens.orange : adminTokens.border}`,
                    background: s.next ? adminTokens.orangeSoft : adminTokens.surface,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: s.done ? adminTokens.success : s.next ? adminTokens.orange : adminTokens.muted,
                    }}/>
                    <div style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums', minWidth: 86 }}>
                      {s.t}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: adminTokens.black }}>
                      {s.label}
                      {s.next && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: adminTokens.orange }}>· ถัดไป</span>}
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                      background: s.typ === 'PT' ? adminTokens.orangeSoft : adminTokens.infoSoft,
                      color: s.typ === 'PT' ? adminTokens.orange : adminTokens.info,
                    }}>{s.typ}</span>
                  </div>
                ))}
              </div>
            </TCard>
          )}

          {tab === 'clients' && (
            <TCard title={`ลูกค้า PT · ${trainer.ptClients} คน`} pad={0}>
              <div>
                {[
                  { name:'Nattaya Mongkon', ini:'NM', sessions:24, left:6,  pkg:'PT Package 30', last:'วันนี้',  tier:'gold' },
                  { name:'Kongphop Chai',   ini:'KC', sessions:18, left:12, pkg:'PT Package 30', last:'เมื่อวาน',  tier:'gold' },
                  { name:'Pim Chaiwat',     ini:'PC', sessions:10, left:2,  pkg:'PT Package 12', last:'2 วัน',    tier:'std' },
                  { name:'Korn Thanakit',   ini:'KT', sessions:8,  left:4,  pkg:'PT Package 12', last:'3 วัน',    tier:'std' },
                  { name:'Somchai R.',      ini:'SR', sessions:6,  left:6,  pkg:'PT Package 12', last:'5 วัน',    tier:'std' },
                  { name:'Urai T.',         ini:'UT', sessions:3,  left:9,  pkg:'PT Package 12', last:'สัปดาห์',   tier:'trial' },
                ].map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderBottom: i < 5 ? `1px solid ${adminTokens.divider}` : 'none',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: topSpec.bg, color: topSpec.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                    }}>{c.ini}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, marginTop: 1 }}>
                        {c.pkg} · ล่าสุด {c.last}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
                        {c.sessions}<span style={{ color: adminTokens.muted, fontWeight: 600 }}>/{c.sessions + c.left}</span>
                      </div>
                      <div style={{ fontSize: 10, color: c.left <= 3 ? adminTokens.destr : adminTokens.muted, fontWeight: 700, marginTop: 2 }}>
                        เหลือ {c.left} {c.left <= 3 && '⚠'}
                      </div>
                    </div>
                    <TIcon d={tIcons.chevR} size={14}/>
                  </div>
                ))}
              </div>
            </TCard>
          )}

          {tab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TCard pad={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: adminTokens.black,
                                   letterSpacing: '-.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {trainer.rating.toFixed(2)}
                    </div>
                    <Stars rating={trainer.rating} size={14}/>
                    <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, marginTop: 4 }}>
                      {trainer.reviews} รีวิว
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[5,4,3,2,1].map(stars => {
                      const pct = stars === 5 ? 82 : stars === 4 ? 14 : stars === 3 ? 2 : stars === 2 ? 1 : 1;
                      return (
                        <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted, width: 14 }}>{stars}★</span>
                          <div style={{ flex: 1, height: 6, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24', borderRadius: 9999 }}/>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted, width: 30, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TCard>
              <TCard title="รีวิวล่าสุด" pad={0}>
                {[
                  { name:'Nattaya M.', ini:'NM', rating:5, time:'เมื่อวาน',  text:'โค้ชให้คำแนะนำดีมาก เน้นเทคนิค ไม่รีบ ไม่กดดัน รู้สึกปลอดภัยและได้ผลจริง 👍' },
                  { name:'Korn T.',    ini:'KT', rating:5, time:'3 วันก่อน', text:'เห็นผลเลยในเดือนแรก โปรแกรมคำนวณตามร่างกายของเรา ชอบมาก' },
                  { name:'Pim C.',     ini:'PC', rating:4, time:'สัปดาห์',    text:'ดีมาก แต่อยากให้โค้ชคุยภาษาอังกฤษได้เยอะกว่านี้' },
                ].map((r, i) => (
                  <div key={i} style={{
                    padding: 16, borderBottom: i < 2 ? `1px solid ${adminTokens.divider}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: topSpec.bg, color: topSpec.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800,
                      }}>{r.ini}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, flex: 1 }}>{r.name}</div>
                      <Stars rating={r.rating} size={11}/>
                      <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{r.time}</div>
                    </div>
                    <div style={{ fontSize: 12, color: adminTokens.black, lineHeight: 1.6, fontWeight: 500 }}>
                      {r.text}
                    </div>
                  </div>
                ))}
              </TCard>
            </div>
          )}

          {tab === 'earnings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TCard pad={14}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { l:'เดือนนี้',    v:`฿${(trainer.mthRevenue/1000).toFixed(0)}K`, s:`${trainer.mthGrowth > 0 ? '+':''}${trainer.mthGrowth}% vs เดือนก่อน`, fg: adminTokens.black },
                    { l:'เฉลี่ย/สัปดาห์',v:`฿${Math.round(trainer.mthRevenue/4/1000).toFixed(0)}K`, s:'~7 PT/สัปดาห์',            fg: adminTokens.info },
                    { l:'ส่วนแบ่ง 60%',  v:`฿${Math.round(trainer.mthRevenue*0.6/1000)}K`, s:'ก่อนหักภาษี',                    fg: adminTokens.success },
                  ].map((k, i) => (
                    <div key={i} style={{ background: adminTokens.subtle, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase' }}>{k.l}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: k.fg, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
                      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>{k.s}</div>
                    </div>
                  ))}
                </div>
              </TCard>
              <TCard title="รายได้ 6 เดือนล่าสุด" pad={14}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                  {[62,68,71,75,78,trainer.mthRevenue/1000].map((v, i) => {
                    const max = 100;
                    const h = (v / max) * 110;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums' }}>
                          ฿{v|0}K
                        </div>
                        <div style={{
                          width: '100%', height: h, minHeight: 6,
                          background: i === 5 ? topSpec.color : adminTokens.subtle,
                          borderRadius: '4px 4px 0 0',
                          border: i === 5 ? 'none' : `1px solid ${adminTokens.border}`,
                        }}/>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {['พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.'].map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11,
                                           fontWeight: 700, color: i === 5 ? adminTokens.black : adminTokens.muted }}>
                      {d}
                    </div>
                  ))}
                </div>
              </TCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const drawerActionPrimary = {
  padding: '0 16px', height: 38, borderRadius: 9, border: 0,
  background: '#fff', color: adminTokens.black,
  fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const drawerAction = {
  padding: '0 14px', height: 38, borderRadius: 9, border: 0,
  background: 'rgba(255,255,255,.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 5,
};

/* ---------- Main page ---------- */
const TrainersPageV2 = () => {
  const [view, setView]         = useStateT(() => localStorage.getItem('moom-trainers-view') || 'grid');
  const [filter, setFilter]     = useStateT('all');
  const [specFilter, setSpec]   = useStateT('all');
  const [sort, setSort]         = useStateT('rating');
  const [search, setSearch]     = useStateT('');
  const [open, setOpen]         = useStateT(null);
  const [toast, setToast]       = useStateT(null);

  useEffectT(() => { localStorage.setItem('moom-trainers-view', view); }, [view]);

  const handleAction = (kind, t) => {
    const m =
      kind === 'book'     ? `เปิดจอง PT กับ ${t.name}...` :
      kind === 'message'  ? `เปิดแชทกับ ${t.name}` :
      kind === 'phone'    ? `กำลังโทร ${t.name}...` :
      kind === 'schedule' ? `ดูตารางของ ${t.name}` :
      kind === 'edit'     ? `แก้ไขโปรไฟล์ ${t.name}` : '';
    if (m) { setToast(m); setTimeout(() => setToast(null), 1800); }
  };

  const filtered = useMemoT(() => {
    let rows = TRAINERS;
    if (filter !== 'all')     rows = rows.filter(t => t.status === filter);
    if (specFilter !== 'all') rows = rows.filter(t => t.spec.includes(specFilter));
    if (search.trim()) {
      const s = search.toLowerCase();
      rows = rows.filter(t => t.name.toLowerCase().includes(s) || t.fullName.toLowerCase().includes(s));
    }
    const order = { rating:'rating', revenue:'mthRevenue', utilization:'utilization', clients:'ptClients' };
    const key = order[sort] || 'rating';
    rows = [...rows].sort((a, b) => b[key] - a[key]);
    return rows;
  }, [filter, specFilter, sort, search]);

  const counts = useMemoT(() => {
    const c = { all: TRAINERS.length };
    for (const t of TRAINERS) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, []);

  return (
    <div style={{ padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 16,
                   maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em',
                        display: 'flex', alignItems: 'center', gap: 10 }}>
            เทรนเนอร์ & โค้ช
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                            padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
                            background: adminTokens.successSoft, color: adminTokens.success }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: adminTokens.success,
                             animation: 'admin-pulse 1.6s ease-in-out infinite' }}/>
              {(counts.onshift || 0) + (counts.break || 0)} กำลังทำงาน
            </span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            จัดการเทรนเนอร์ กะทำงาน PT ค่าคอมมิชชั่น และผลงาน
          </p>
        </div>
        <TBtn icon={tIcons.cal}>ตารางกะ</TBtn>
        <TBtn icon={tIcons.cash}>ค่าคอม</TBtn>
        <TBtn icon={tIcons.plus} primary>เพิ่มเทรนเนอร์</TBtn>
      </div>

      {/* KPI strip */}
      <TrainerKpi/>

      {/* Now on shift */}
      <NowOnShift onOpen={setOpen} onBook={() => handleAction('book', TRAINERS[0])}/>

      {/* Quick-book + leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <QuickBook onBook={t => { setOpen(t); }}/>
        <Leaderboard/>
      </div>

      {/* Filters bar */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1, minWidth: 200, maxWidth: 320, height: 36, padding: '0 12px',
          background: adminTokens.subtle, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <TIcon d={tIcons.search} size={14}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="ค้นหาชื่อเทรนเนอร์..."
                 style={{ flex: 1, border: 0, background: 'transparent', outline: 'none',
                          fontFamily: 'inherit', fontSize: 13, color: adminTokens.black }}/>
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 0, padding: 2, cursor: 'pointer', color: adminTokens.muted }}>
              <TIcon d={tIcons.x} size={12}/>
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 2, padding: 3, background: adminTokens.subtle, borderRadius: 9 }}>
          {[
            { id: 'all',      label: 'ทั้งหมด',     count: counts.all },
            { id: 'onshift',  label: 'ทำงาน',      count: counts.onshift || 0 },
            { id: 'break',    label: 'พัก',        count: counts.break || 0 },
            { id: 'off',      label: 'เลิกงาน',     count: counts.off || 0 },
            { id: 'leave',    label: 'ลา',         count: counts.leave || 0 },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              height: 30, padding: '0 12px', borderRadius: 7, border: 0,
              background: filter === t.id ? adminTokens.surface : 'transparent',
              boxShadow: filter === t.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              color: filter === t.id ? adminTokens.black : adminTokens.muted,
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 9999,
                background: filter === t.id ? adminTokens.subtle : 'rgba(0,0,0,.05)',
                color: adminTokens.muted, fontWeight: 700,
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}/>

        <select value={specFilter} onChange={e => setSpec(e.target.value)} style={selectStyleT}>
          <option value="all">ทุกทักษะ</option>
          {Object.entries(SPECIALTIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyleT}>
          <option value="rating">คะแนนสูงสุด</option>
          <option value="revenue">รายได้สูงสุด</option>
          <option value="utilization">Utilization สูงสุด</option>
          <option value="clients">ลูกค้าเยอะสุด</option>
        </select>

        <div style={{ display: 'flex', gap: 2, padding: 3, background: adminTokens.subtle, borderRadius: 9 }}>
          <button onClick={() => setView('grid')} style={{
            width: 32, height: 30, borderRadius: 7, border: 0, cursor: 'pointer',
            background: view === 'grid' ? adminTokens.surface : 'transparent',
            color: view === 'grid' ? adminTokens.black : adminTokens.muted,
            boxShadow: view === 'grid' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }} title="กริด"><TIcon d={tIcons.grid} size={13}/></button>
          <button onClick={() => setView('list')} style={{
            width: 32, height: 30, borderRadius: 7, border: 0, cursor: 'pointer',
            background: view === 'list' ? adminTokens.surface : 'transparent',
            color: view === 'list' ? adminTokens.black : adminTokens.muted,
            boxShadow: view === 'list' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }} title="ตาราง"><TIcon d={tIcons.list} size={13}/></button>
        </div>
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div style={{
          background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 60, textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: adminTokens.muted }}>
            ไม่พบเทรนเนอร์ที่ตรงกับตัวกรอง
          </div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
          {filtered.map(t => <TrainerCard key={t.id} t={t} onOpen={setOpen} onAction={handleAction}/>)}
        </div>
      ) : (
        <TCard noBody>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.3fr 0.9fr 1fr 1fr 0.9fr 110px',
            alignItems: 'center', gap: 10, padding: '10px 16px',
            background: adminTokens.subtle, borderBottom: `1px solid ${adminTokens.divider}`,
            fontSize: 10, fontWeight: 800, color: adminTokens.muted,
            textTransform: 'uppercase', letterSpacing: '.04em',
          }}>
            <div>เทรนเนอร์</div>
            <div>ทักษะ</div>
            <div>สถานะ</div>
            <div>คะแนน</div>
            <div>Utilization</div>
            <div>รายได้</div>
            <div style={{ textAlign: 'right' }}>การกระทำ</div>
          </div>
          {filtered.map(t => <TrainerRow key={t.id} t={t} onOpen={setOpen} onAction={handleAction}/>)}
        </TCard>
      )}

      {/* Drawer */}
      {open && <TrainerDrawer trainer={open} onClose={() => setOpen(null)} onAction={handleAction}/>}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: adminTokens.black, color: '#fff', padding: '10px 18px', borderRadius: 9999,
          fontSize: 13, fontWeight: 700, boxShadow: adminTokens.shadowLg, zIndex: 300,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <TIcon d={tIcons.check} size={14} stroke={2.5}/>
          {toast}
        </div>
      )}
    </div>
  );
};

const selectStyleT = {
  height: 36, padding: '0 10px', borderRadius: 9,
  border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
  color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', outline: 'none',
};

/* Export */
Object.assign(window, { TrainersPageV2 });
