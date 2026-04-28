/* MOOM Admin — Promotions (โปรโมชั่น)
   Operator tool for running discount campaigns & codes.
   Sections: KPI strip → quick-launch templates → active campaigns grid
             → code library table → performance chart → detail drawer */

const { useState: useStatePr, useMemo: useMemoPr, useEffect: useEffectPr, useRef: useRefPr } = React;

/* ---------- Icons ---------- */
const prIcons = {
  gift:    <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  copy:    <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  pause:   <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  play:    <><polygon points="5 3 19 12 5 21 5 3"/></>,
  archive: <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  chev:    <><polyline points="6 9 12 15 18 9"/></>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
  cash:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  percent: <><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>,
  trendU:  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  trendD:  <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  bolt:    <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  link:    <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
  qr:      <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  star:    <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  heart:   <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  share:   <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  flame:   <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  megaphone:<><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></>,
  target:  <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  filter:  <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  sort:    <><polyline points="21 10 3 10"/><polyline points="17 6 3 6"/><polyline points="13 14 3 14"/><polyline points="9 18 3 18"/></>,
  users2:  <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  book:    <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  refresh: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
  sparkle: <><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></>,
};

/* ---------- Promo dataset ---------- */
const PROMO_TYPES = {
  percent:    { label: 'ลด %',          color: adminTokens.orange, bg: adminTokens.orangeSoft, icon: prIcons.percent },
  fixed:      { label: 'ลด ฿',          color: adminTokens.info,   bg: adminTokens.infoSoft,   icon: prIcons.cash    },
  bogo:       { label: 'ซื้อ 1 แถม 1',    color: adminTokens.pink,   bg: 'hsl(330 80% 58% / 0.12)', icon: prIcons.gift },
  trial:      { label: 'ขยายทดลอง',     color: adminTokens.teal,   bg: adminTokens.tealSoft,   icon: prIcons.sparkle },
  referral:   { label: 'แนะนำเพื่อน',     color: 'hsl(260 70% 60%)', bg: 'hsl(260 70% 60% / 0.12)', icon: prIcons.share },
  firsttime:  { label: 'สมาชิกใหม่',      color: adminTokens.success,bg: adminTokens.successSoft,icon: prIcons.star    },
};

const STATUS = {
  active:    { label: 'กำลังใช้', color: adminTokens.success, bg: adminTokens.successSoft, dot: true },
  scheduled: { label: 'รออัพ',    color: adminTokens.info,    bg: adminTokens.infoSoft },
  paused:    { label: 'หยุด',     color: adminTokens.warn,    bg: adminTokens.warnSoft },
  ended:     { label: 'จบแล้ว',   color: adminTokens.muted,   bg: adminTokens.subtle },
  draft:     { label: 'ร่าง',     color: adminTokens.slate,   bg: 'hsl(220 14% 50% / 0.1)' },
};

const PROMOS = [
  { id:1, code:'SONGKRAN26', name:'สงกรานต์ไฟเดือด', type:'percent', value:30, status:'active',
    starts:'2026-04-10', ends:'2026-04-20', audience:'ทุกคน', applies:'ทุกแพ็คเกจ',
    used:287, limit:500, revenue:284900, views:4120, conv:6.96,
    daily:[8,12,18,24,22,28,34,38,42,36,25], featured:true, channels:['in-app','email','facebook'],
    desc:'ลด 30% ทุกแพ็คเกจช่วงสงกรานต์ — ขยายแรงซื้อช่วงวันหยุด' },
  { id:2, code:'NEW2026', name:'สมาชิกใหม่ 50%', type:'firsttime', value:50, status:'active',
    starts:'2026-01-01', ends:'2026-12-31', audience:'สมาชิกใหม่', applies:'เดือนแรก',
    used:142, limit:null, revenue:98200, views:3450, conv:4.12,
    daily:[3,4,6,5,7,8,6,9,11,8,7], channels:['in-app','landing'],
    desc:'เดือนแรก 50% สำหรับสมาชิกใหม่ — ตลอดปี' },
  { id:3, code:'REFER500', name:'แนะนำเพื่อนรับ ฿500', type:'referral', value:500, status:'active',
    starts:'2026-02-01', ends:'2026-06-30', audience:'สมาชิก Active', applies:'เครดิต',
    used:64, limit:null, revenue:38400, views:1890, conv:3.39,
    daily:[4,3,5,6,4,7,5,8,6,9,7], channels:['in-app','referral-link'],
    desc:'ผู้แนะนำได้ ฿500 เครดิต เพื่อนใหม่ได้ 20% เดือนแรก' },
  { id:4, code:'YOGA20', name:'Yoga Pass 20% Off', type:'percent', value:20, status:'active',
    starts:'2026-04-01', ends:'2026-04-30', audience:'ทุกคน', applies:'Yoga Pass',
    used:38, limit:100, revenue:18240, views:890, conv:4.27,
    daily:[2,3,4,3,5,4,6,5,4,3,5], channels:['in-app'],
    desc:'เฉพาะ Yoga Pass 8 และ Yoga Pass 12' },
  { id:5, code:'MAY2FOR1', name:'May Fever 2-for-1', type:'bogo', value:0, status:'scheduled',
    starts:'2026-05-01', ends:'2026-05-07', audience:'สมาชิก Active', applies:'Drop-in',
    used:0, limit:200, revenue:0, views:420, conv:0,
    daily:[0,0,0,0,0,0,0,0,0,0,0], channels:['in-app','email'],
    desc:'ซื้อ Drop-in 1 ใบแถมให้เพื่อน 1 ใบ' },
  { id:6, code:'TRIAL14', name:'ขยายทดลอง 14 วัน', type:'trial', value:7, status:'paused',
    starts:'2026-03-15', ends:'2026-04-15', audience:'Trial ที่ยังไม่เริ่ม', applies:'Trial Week',
    used:12, limit:50, revenue:0, views:180, conv:6.67,
    daily:[1,2,1,2,1,1,2,1,1,0,0], channels:['email'],
    desc:'ขยายช่วงทดลองจาก 7 เป็น 14 วัน — พักอยู่เพราะ conv ต่ำ' },
  { id:7, code:'STUDENT36', name:'ส่วนลดนักศึกษา 36%', type:'percent', value:36, status:'active',
    starts:'2026-01-15', ends:'2026-12-31', audience:'นักศึกษา', applies:'Unlimited Monthly',
    used:58, limit:null, revenue:87000, views:1240, conv:4.68,
    daily:[4,5,5,6,5,7,6,6,5,5,4], channels:['landing','partner'],
    desc:'ต้องแสดงบัตรนักศึกษา — ใช้เดือนละครั้ง' },
  { id:8, code:'WINBACK25', name:'Winback สมาชิกหมดอายุ', type:'percent', value:25, status:'ended',
    starts:'2026-02-01', ends:'2026-03-31', audience:'หมดอายุ 30-90 วัน', applies:'ทุกแพ็คเกจ',
    used:23, limit:100, revenue:43700, views:680, conv:3.38,
    daily:[2,3,2,3,4,2,3,2,1,1,0], channels:['email','sms'],
    desc:'ดึงกลับมาลูกค้าที่หมดอายุ — ปิดตามแผน' },
  { id:9, code:'BFF300', name:'พากันมา คู่ละ ฿300', type:'fixed', value:300, status:'draft',
    starts:'2026-04-25', ends:'2026-05-25', audience:'ทุกคน', applies:'Drop-in ≥2 คน',
    used:0, limit:null, revenue:0, views:0, conv:0,
    daily:[0,0,0,0,0,0,0,0,0,0,0], channels:[],
    desc:'ร่าง — ยังไม่ได้เปิดใช้' },
];

const TEMPLATES = [
  { id:'t1', title:'ลดเปอร์เซ็นต์', sub:'เลือก % ลด · ช่วงเวลา', type:'percent', icon:prIcons.percent },
  { id:'t2', title:'สมาชิกใหม่',    sub:'เดือนแรก / แพ็คเกจแรก', type:'firsttime', icon:prIcons.star    },
  { id:'t3', title:'แนะนำเพื่อน',    sub:'เครดิตผู้แนะนำ + ส่วนลดใหม่', type:'referral', icon:prIcons.share },
  { id:'t4', title:'Winback',      sub:'ดึงหมดอายุกลับมา',    type:'percent', icon:prIcons.refresh },
];

/* ---------- Primitives ---------- */
const PrIcon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const PrPill = ({ children, color = adminTokens.muted, bg, dot, strong }) => (
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

const PrBtn = ({ children, icon, iconRight, primary, ghost, danger, onClick, small, active }) => {
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
      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      boxShadow: primary ? adminTokens.shadowOrange : 'none', transition: 'all .15s',
    }}>
      {icon && <PrIcon d={icon} size={13} stroke={2.2}/>}
      {children}
      {iconRight && <PrIcon d={iconRight} size={13} stroke={2.2}/>}
    </button>
  );
};

const PrCard = ({ title, subtitle, action, children, pad = 16, noBody }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
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

const PrSpark = ({ series, w = 110, h = 32, color = adminTokens.orange, filled }) => {
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

const PrDelta = ({ v }) => {
  const up = v >= 0;
  const fg = v === 0 ? adminTokens.muted : up ? adminTokens.success : adminTokens.destr;
  const bg = v === 0 ? adminTokens.subtle : up ? adminTokens.successSoft : adminTokens.destrSoft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 9999,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      color: fg, background: bg, whiteSpace: 'nowrap',
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
const PromoKpiStrip = () => {
  const active = PROMOS.filter(p => p.status === 'active').length;
  const totalRedemptions = PROMOS.reduce((s, p) => s + p.used, 0);
  const totalRevenue = PROMOS.reduce((s, p) => s + p.revenue, 0);
  const totalViews = PROMOS.reduce((s, p) => s + p.views, 0);
  const conv = ((totalRedemptions / totalViews) * 100).toFixed(1);

  const cards = [
    { label:'โปรที่กำลังใช้', value:active, sub:`จาก ${PROMOS.length} โปรทั้งหมด`,
      delta:null, accent:adminTokens.orange, accentBg:adminTokens.orangeSoft, icon:prIcons.gift,
      spark:[3,4,4,5,5,5,4,5] },
    { label:'การใช้งานเดือนนี้', value:totalRedemptions.toLocaleString(), sub:'+48 วันนี้',
      delta:18, accent:adminTokens.success, accentBg:adminTokens.successSoft, icon:prIcons.check,
      spark:[42,58,64,72,88,94,102,118] },
    { label:'รายได้จากโปร', value:`฿${(totalRevenue/1000).toFixed(0)}K`, sub:'18% ของรายได้รวม',
      delta:24, accent:adminTokens.info, accentBg:adminTokens.infoSoft, icon:prIcons.cash,
      spark:[28,38,52,64,70,82,94,108] },
    { label:'Conversion rate', value:`${conv}%`, sub:`${totalViews.toLocaleString()} การเข้าชม`,
      delta:-0.8, accent:adminTokens.pink, accentBg:'hsl(330 80% 58% / 0.12)', icon:prIcons.target,
      spark:[5.8,5.2,5.4,5.6,5.1,4.9,5.2,4.9] },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 16, position: 'relative', overflow: 'hidden',
          boxShadow: adminTokens.shadowSm,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: c.accentBg,
              color: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PrIcon d={c.icon} size={15} stroke={2.2}/>
            </div>
            <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 700,
                          letterSpacing: '.02em', textTransform: 'uppercase', flex: 1 }}>
              {c.label}
            </div>
            {c.delta !== null && <PrDelta v={c.delta}/>}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: adminTokens.black,
                            letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {c.value}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.sub}
              </div>
            </div>
            <PrSpark series={c.spark} color={c.accent} w={70} h={28} filled/>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------- Quick-launch templates ---------- */
const QuickLaunch = ({ onPick }) => (
  <div style={{
    background: `linear-gradient(135deg, ${adminTokens.black} 0%, #1a1d26 100%)`,
    borderRadius: adminTokens.r3, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', right: -40, top: -40, width: 260, height: 260,
      background: `radial-gradient(circle, ${adminTokens.orange}33 0%, transparent 70%)`, pointerEvents: 'none',
    }}/>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, position: 'relative' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.08)',
        color: adminTokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PrIcon d={prIcons.bolt} size={16} stroke={2.4}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.01em' }}>สร้างโปรด่วน</div>
        <div style={{ fontSize: 11, opacity: .6, fontWeight: 600 }}>เลือกเทมเพลต กรอก 3 ช่อง เปิดใช้ได้ทันที</div>
      </div>
      <PrBtn small icon={prIcons.book} onClick={() => onPick('library')}>
        <span style={{ color: '#fff', opacity: .85 }}>ดูไลบรารีทั้งหมด</span>
      </PrBtn>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, position: 'relative' }}>
      {TEMPLATES.map(t => {
        const tp = PROMO_TYPES[t.type];
        return (
          <button key={t.id} onClick={() => onPick(t.id)} style={{
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 12, padding: 14, cursor: 'pointer', color: '#fff',
            fontFamily: 'inherit', textAlign: 'left', transition: 'all .2s',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.09)'; e.currentTarget.style.borderColor = tp.color; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, background: `${tp.color}22`,
                color: tp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <PrIcon d={t.icon} size={13} stroke={2.2}/>
              </div>
              <PrIcon d={prIcons.plus} size={12} stroke={2.4}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{t.title}</div>
              <div style={{ fontSize: 10.5, opacity: .55, fontWeight: 600 }}>{t.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

/* ---------- Promo card (grid view) ---------- */
const PromoCard = ({ p, onOpen, onAction }) => {
  const tp = PROMO_TYPES[p.type];
  const st = STATUS[p.status];
  const pct = p.limit ? Math.min(100, Math.round((p.used / p.limit) * 100)) : null;
  const daysLeft = Math.max(0, Math.ceil((new Date(p.ends) - new Date('2026-04-19')) / 86400000));
  const urgent = p.status === 'active' && daysLeft <= 3;

  const valueLabel =
    p.type === 'percent'   ? `−${p.value}%` :
    p.type === 'fixed'     ? `−฿${p.value}` :
    p.type === 'bogo'      ? '2-for-1' :
    p.type === 'trial'     ? `+${p.value} วัน` :
    p.type === 'referral'  ? `฿${p.value} เครดิต` :
    p.type === 'firsttime' ? `−${p.value}%` : '';

  return (
    <div onClick={() => onOpen(p)} style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, overflow: 'hidden', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', boxShadow: adminTokens.shadowSm,
      transition: 'all .15s', position: 'relative',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = tp.color; e.currentTarget.style.boxShadow = adminTokens.shadowLg; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.boxShadow = adminTokens.shadowSm; }}>

      {/* coupon-style header */}
      <div style={{
        background: `linear-gradient(135deg, ${tp.color} 0%, ${tp.color} 60%, ${tp.color}dd 100%)`,
        padding: '14px 16px', color: '#fff', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', background: 'rgba(255,255,255,.22)',
                borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.02em',
              }}>
                <PrIcon d={tp.icon} size={10} stroke={2.5}/>
                {tp.label}
              </span>
              {p.featured && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', background: '#fff', color: tp.color,
                  borderRadius: 6, fontSize: 10, fontWeight: 800,
                }}>
                  <PrIcon d={prIcons.star} size={9} stroke={2.5}/> เด่น
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.25,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
              {p.name}
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.03em',
                        fontVariantNumeric: 'tabular-nums', lineHeight: 1, whiteSpace: 'nowrap' }}>
            {valueLabel}
          </div>
        </div>
        {/* perforated edge illusion */}
        <div style={{
          position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 8, borderRadius: '50%', background: adminTokens.surface,
        }}/>
        <div style={{
          position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 8, borderRadius: '50%', background: adminTokens.surface,
        }}/>
      </div>

      {/* code row */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px dashed ${adminTokens.border}`,
        display: 'flex', alignItems: 'center', gap: 8, background: adminTokens.subtle,
      }}>
        <div style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13, fontWeight: 800, color: adminTokens.black, letterSpacing: '.06em', flex: 1,
        }}>
          {p.code}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAction('copy', p); }} style={{
          background: 'transparent', border: 0, padding: 4, borderRadius: 6,
          cursor: 'pointer', color: adminTokens.muted, display: 'flex',
        }} title="คัดลอกโค้ด">
          <PrIcon d={prIcons.copy} size={14}/>
        </button>
        <PrPill {...st} dot={st.dot}>{st.label}</PrPill>
      </div>

      {/* stats + progress */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>ใช้</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {p.used}{p.limit && <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>/{p.limit}</span>}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>รายได้</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', marginTop: 2, whiteSpace: 'nowrap' }}>
              ฿{(p.revenue/1000).toFixed(0)}K
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Conv.</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {p.conv.toFixed(1)}%
            </div>
          </div>
        </div>

        {pct !== null && (
          <div>
            <div style={{ height: 5, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: pct > 80 ? adminTokens.warn : tp.color,
                borderRadius: 9999, transition: 'width .3s',
              }}/>
            </div>
            <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 4, fontWeight: 600 }}>
              {pct}% ของโควต้า · เหลือ {(p.limit - p.used).toLocaleString()} สิทธิ์
            </div>
          </div>
        )}

        {/* sparkline */}
        <PrSpark series={p.daily} color={tp.color} w={200} h={28} filled/>

        {/* footer meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10,
                      borderTop: `1px solid ${adminTokens.divider}` }}>
          <PrIcon d={prIcons.cal} size={11} stroke={2}/>
          <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.status === 'active' && daysLeft > 0 && (
              <span style={{ color: urgent ? adminTokens.destr : adminTokens.muted, fontWeight: urgent ? 800 : 600 }}>
                เหลือ {daysLeft} วัน
              </span>
            )}
            {p.status === 'scheduled' && `เริ่ม ${p.starts}`}
            {p.status === 'paused' && 'พักไว้'}
            {p.status === 'ended' && 'จบแล้ว'}
            {p.status === 'draft' && 'ร่าง'}
          </span>
          <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600,
                         display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <PrIcon d={prIcons.users} size={11} stroke={2}/>
            {p.audience}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------- Table row (list view) ---------- */
const PromoRow = ({ p, onOpen, onAction }) => {
  const tp = PROMO_TYPES[p.type];
  const st = STATUS[p.status];
  const pct = p.limit ? Math.min(100, Math.round((p.used / p.limit) * 100)) : null;
  const daysLeft = Math.max(0, Math.ceil((new Date(p.ends) - new Date('2026-04-19')) / 86400000));
  const valueLabel =
    p.type === 'percent'   ? `−${p.value}%` :
    p.type === 'fixed'     ? `−฿${p.value}` :
    p.type === 'bogo'      ? '2-for-1' :
    p.type === 'trial'     ? `+${p.value}d` :
    p.type === 'referral'  ? `฿${p.value}` :
    p.type === 'firsttime' ? `−${p.value}%` : '';

  return (
    <div onClick={() => onOpen(p)} style={{
      display: 'grid',
      gridTemplateColumns: '2.4fr 1fr 1fr 1.2fr 1fr 1fr 100px',
      alignItems: 'center', gap: 10, padding: '12px 16px',
      borderBottom: `1px solid ${adminTokens.divider}`, cursor: 'pointer',
      transition: 'background .1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = adminTokens.subtle; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

      {/* Name + code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: tp.bg,
          color: tp.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <PrIcon d={tp.icon} size={16} stroke={2.2}/>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <code style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11, fontWeight: 700, color: adminTokens.muted,
              background: adminTokens.subtle, padding: '1px 6px', borderRadius: 4, letterSpacing: '.04em',
            }}>{p.code}</code>
            <span style={{ fontSize: 11, color: adminTokens.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              · {p.audience}
            </span>
          </div>
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontSize: 14, fontWeight: 800, color: tp.color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>{valueLabel}</div>

      {/* Status */}
      <div><PrPill {...st} dot={st.dot}>{st.label}</PrPill></div>

      {/* Usage + bar */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
          {p.used}{p.limit && <span style={{ color: adminTokens.muted, fontWeight: 600 }}>/{p.limit}</span>}
        </div>
        {pct !== null && (
          <div style={{ height: 3, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? adminTokens.warn : tp.color }}/>
          </div>
        )}
      </div>

      {/* Revenue */}
      <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        ฿{p.revenue.toLocaleString()}
      </div>

      {/* Sparkline */}
      <PrSpark series={p.daily} color={tp.color} w={80} h={24}/>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {p.status === 'active' && (
          <button onClick={(e) => { e.stopPropagation(); onAction('pause', p); }} style={actionBtn} title="พัก">
            <PrIcon d={prIcons.pause} size={13}/>
          </button>
        )}
        {(p.status === 'paused' || p.status === 'draft') && (
          <button onClick={(e) => { e.stopPropagation(); onAction('play', p); }} style={actionBtn} title="เปิด">
            <PrIcon d={prIcons.play} size={13}/>
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onAction('copy', p); }} style={actionBtn} title="คัดลอก">
          <PrIcon d={prIcons.copy} size={13}/>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAction('more', p); }} style={actionBtn} title="เพิ่มเติม">
          <PrIcon d={prIcons.dots} size={13}/>
        </button>
      </div>
    </div>
  );
};

const actionBtn = {
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${adminTokens.border}`,
  background: adminTokens.surface, color: adminTokens.muted, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

/* ---------- Performance chart (stacked daily) ---------- */
const PerformanceChart = () => {
  const days = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
  // stacked by top 4 campaigns
  const top = PROMOS.filter(p => p.status === 'active').slice(0, 4);
  const totals = days.map((_, i) => top.reduce((s, p) => s + (p.daily[i] || 0), 0));
  const max = Math.max(...totals, 60);

  return (
    <PrCard
      title="การใช้งานรายวัน"
      subtitle="11 วันล่าสุด · แบ่งตามแคมเปญ"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PrBtn small ghost>7 วัน</PrBtn>
          <PrBtn small active ghost>30 วัน</PrBtn>
          <PrBtn small ghost>90 วัน</PrBtn>
        </div>
      }>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', minHeight: 200 }}>
        {/* Chart area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 180, gap: 4 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums' }}>
                  {totals[i]}
                </div>
                <div style={{ width: '100%', height: 140, background: adminTokens.subtle,
                              borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                  {top.map((p, pi) => {
                    const v = p.daily[i] || 0;
                    const h = (v / max) * 140;
                    return (
                      <div key={pi} style={{
                        width: '100%', height: h,
                        background: PROMO_TYPES[p.type].color,
                        opacity: 0.65 + (top.length - pi) * 0.08,
                      }}/>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11,
                                     fontWeight: 600, color: adminTokens.muted }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Legend + totals */}
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8,
                      borderLeft: `1px solid ${adminTokens.divider}`, paddingLeft: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: adminTokens.muted,
                        textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
            Top แคมเปญ
          </div>
          {top.map(p => {
            const tp = PROMO_TYPES[p.type];
            const total = p.daily.reduce((s, v) => s + v, 0);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: tp.color, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>
                    {total} ครั้ง · ฿{(p.revenue/1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PrCard>
  );
};

/* ---------- Insights sidebar ---------- */
const InsightCard = ({ tone, icon, title, body, cta }) => {
  const toneMap = {
    good: { fg: adminTokens.success, bg: adminTokens.successSoft },
    warn: { fg: adminTokens.warn,    bg: adminTokens.warnSoft },
    bad:  { fg: adminTokens.destr,   bg: adminTokens.destrSoft },
    info: { fg: adminTokens.info,    bg: adminTokens.infoSoft },
  };
  const t = toneMap[tone];
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r2, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <PrIcon d={icon} size={14} stroke={2.3}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: adminTokens.muted, lineHeight: 1.5, fontWeight: 500 }}>
          {body}
        </div>
        {cta && (
          <button style={{
            marginTop: 8, background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: t.fg,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            {cta} →
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------- Detail drawer ---------- */
const PromoDrawer = ({ promo, onClose, onAction }) => {
  const [tab, setTab] = useStatePr('overview');
  if (!promo) return null;
  const tp = PROMO_TYPES[promo.type];
  const st = STATUS[promo.status];
  const pct = promo.limit ? Math.round((promo.used / promo.limit) * 100) : null;

  const tabs = [
    { id: 'overview', label: 'ภาพรวม' },
    { id: 'rules',    label: 'เงื่อนไข' },
    { id: 'audience', label: 'กลุ่มเป้า' },
    { id: 'channels', label: 'ช่องทาง' },
    { id: 'activity', label: 'ผู้ใช้' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 200,
      display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 640, maxWidth: '95vw', background: adminTokens.surface,
        display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 48px rgba(15,23,42,.2)',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${tp.color} 0%, ${tp.color}dd 100%)`,
          color: '#fff', padding: '18px 22px', position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', background: 'rgba(255,255,255,.22)',
                  borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.02em',
                }}>
                  <PrIcon d={tp.icon} size={11} stroke={2.5}/>
                  {tp.label}
                </span>
                <PrPill {...st} dot={st.dot}>{st.label}</PrPill>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2 }}>
                {promo.name}
              </div>
              <div style={{ fontSize: 12, opacity: .85, marginTop: 4, fontWeight: 500 }}>
                {promo.desc}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,.15)', border: 0, width: 32, height: 32,
              borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <PrIcon d={prIcons.x} size={16}/>
            </button>
          </div>
          {/* Code + actions */}
          <div style={{
            marginTop: 16, padding: '12px 14px', background: 'rgba(0,0,0,.15)',
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 10, opacity: .7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                โค้ด
              </div>
              <div style={{
                fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 18, fontWeight: 800,
                letterSpacing: '.08em', marginTop: 2,
              }}>
                {promo.code}
              </div>
            </div>
            <div style={{ flex: 1 }}/>
            <button onClick={() => onAction('copy', promo)} style={drawerHeaderBtn}>
              <PrIcon d={prIcons.copy} size={12}/> คัดลอก
            </button>
            <button onClick={() => onAction('qr', promo)} style={drawerHeaderBtn}>
              <PrIcon d={prIcons.qr} size={12}/> QR
            </button>
            <button onClick={() => onAction('share', promo)} style={drawerHeaderBtn}>
              <PrIcon d={prIcons.share} size={12}/> แชร์
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '0 20px', borderBottom: `1px solid ${adminTokens.divider}`,
        }}>
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
              {/* Live stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'ใช้แล้ว', value: promo.used.toLocaleString(), sub: promo.limit ? `/${promo.limit}` : 'ไม่จำกัด', fg: adminTokens.black },
                  { label: 'รายได้', value: `฿${(promo.revenue/1000).toFixed(0)}K`, sub: 'จากโปรนี้', fg: adminTokens.success },
                  { label: 'การเข้าชม', value: promo.views.toLocaleString(), sub: 'ทั้งหมด', fg: adminTokens.info },
                  { label: 'Conversion', value: `${promo.conv.toFixed(1)}%`, sub: 'view → ใช้', fg: adminTokens.pink },
                ].map((k, i) => (
                  <div key={i} style={{
                    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k.fg, marginTop: 4, letterSpacing: '-.01em', fontVariantNumeric: 'tabular-nums' }}>
                      {k.value}
                    </div>
                    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              {pct !== null && (
                <PrCard title="โควต้า" pad={14}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {promo.used}<span style={{ fontSize: 16, color: adminTokens.muted }}> / {promo.limit}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: pct > 80 ? adminTokens.warn : tp.color }}>
                      {pct}%
                    </div>
                  </div>
                  <div style={{ height: 8, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 9999,
                      background: pct > 80 ? adminTokens.warn : tp.color,
                    }}/>
                  </div>
                  <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 8, fontWeight: 600 }}>
                    ที่เหลือ {(promo.limit - promo.used).toLocaleString()} สิทธิ์ · คาดใช้หมดใน 8 วัน
                  </div>
                </PrCard>
              )}

              {/* Timeline */}
              <PrCard title="ระยะเวลา" pad={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase' }}>เริ่ม</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, marginTop: 2 }}>{promo.starts}</div>
                  </div>
                  <div style={{ flex: 1, height: 6, background: adminTokens.subtle, borderRadius: 9999, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '65%', height: '100%',
                                   background: tp.color, borderRadius: 9999 }}/>
                    <div style={{
                      position: 'absolute', left: '65%', top: '50%', transform: 'translate(-50%, -50%)',
                      width: 14, height: 14, borderRadius: '50%', background: tp.color, border: '3px solid #fff',
                      boxShadow: '0 0 0 2px ' + tp.color,
                    }}/>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase' }}>จบ</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, marginTop: 2 }}>{promo.ends}</div>
                  </div>
                </div>
              </PrCard>

              {/* AI suggestion */}
              <div style={{
                background: `linear-gradient(135deg, ${tp.color}10, ${tp.color}05)`,
                border: `1px solid ${tp.color}33`, borderRadius: adminTokens.r2,
                padding: 14, display: 'flex', gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, background: tp.color,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <PrIcon d={prIcons.sparkle} size={15} stroke={2.2}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black, marginBottom: 4 }}>
                    คำแนะนำจาก AI
                  </div>
                  <div style={{ fontSize: 12, color: adminTokens.black, lineHeight: 1.6, fontWeight: 500 }}>
                    Conv. ของโปรนี้สูงกว่าค่าเฉลี่ย {((promo.conv / 4) - 1) * 100 | 0}% — พิจารณาเพิ่มโควต้าอีก 100 สิทธิ์
                    หรือขยายเวลาอีก 7 วัน เพื่อแม็กซิไมซ์รายได้
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <PrCard title="เงื่อนไขหลัก" pad={14}>
                {[
                  { label: 'ประเภทส่วนลด', value: tp.label },
                  { label: 'มูลค่า', value: promo.type === 'fixed' ? `฿${promo.value}` : promo.type === 'percent' || promo.type === 'firsttime' ? `${promo.value}%` : `${promo.value}` },
                  { label: 'ใช้กับ', value: promo.applies },
                  { label: 'จำกัดต่อคน', value: '1 ครั้ง / สมาชิก' },
                  { label: 'ใช้ร่วมกับโปรอื่น', value: 'ไม่ได้' },
                  { label: 'โควต้ารวม', value: promo.limit ? `${promo.limit} สิทธิ์` : 'ไม่จำกัด' },
                  { label: 'ยอดขั้นต่ำ', value: '฿500' },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                    borderBottom: i < 6 ? `1px solid ${adminTokens.divider}` : 'none', gap: 12,
                  }}>
                    <div style={{ fontSize: 12, color: adminTokens.muted, fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: adminTokens.black, fontWeight: 700 }}>{r.value}</div>
                  </div>
                ))}
              </PrCard>
            </div>
          )}

          {tab === 'audience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <PrCard title="กลุ่มเป้าหมาย" subtitle={promo.audience} pad={14}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'เข้าเกณฑ์', value: '1,284', fg: adminTokens.info },
                    { label: 'ได้เห็นโปร', value: promo.views.toLocaleString(), fg: adminTokens.orange },
                    { label: 'ใช้แล้ว', value: promo.used.toLocaleString(), fg: adminTokens.success },
                  ].map((k, i) => (
                    <div key={i} style={{ background: adminTokens.subtle, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: k.fg, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted, marginBottom: 8 }}>
                    Funnel (เข้าเกณฑ์ → เห็น → ใช้)
                  </div>
                  <div style={{ display: 'flex', gap: 2, height: 26 }}>
                    <div style={{ flex: 1.284, background: adminTokens.info, borderRadius: '6px 0 0 6px',
                                   display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                      100%
                    </div>
                    <div style={{ flex: promo.views/1000, background: adminTokens.orange,
                                   display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                      {Math.round(promo.views / 1284 * 100)}%
                    </div>
                    <div style={{ flex: Math.max(0.1, promo.used/1000), background: adminTokens.success, borderRadius: '0 6px 6px 0',
                                   display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                      {Math.round(promo.used / 1284 * 100)}%
                    </div>
                  </div>
                </div>
              </PrCard>
            </div>
          )}

          {tab === 'channels' && (
            <PrCard title="ช่องทางเผยแพร่" pad={14}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['in-app','email','sms','facebook','line','landing','referral-link','partner'].map(ch => {
                  const on = promo.channels.includes(ch);
                  return (
                    <div key={ch} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 10, border: `1px solid ${on ? tp.color : adminTokens.border}`,
                      background: on ? tp.bg : 'transparent',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, background: on ? tp.color : adminTokens.subtle,
                        color: on ? '#fff' : adminTokens.muted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <PrIcon d={prIcons.megaphone} size={13}/>
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
                        {ch}
                      </div>
                      {on ? (
                        <PrPill color={tp.color} bg={tp.bg}>เปิด</PrPill>
                      ) : (
                        <PrPill color={adminTokens.muted} bg={adminTokens.subtle}>ปิด</PrPill>
                      )}
                    </div>
                  );
                })}
              </div>
            </PrCard>
          )}

          {tab === 'activity' && (
            <PrCard title="ผู้ใช้โปรล่าสุด" subtitle={`${promo.used} คน`} pad={0}>
              <div>
                {['Korn Thanakit','Pim Chaiwat','Nattaya M.','Somchai R.','Thanin S.','Napat K.','Supaporn K.'].map((n, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderBottom: i < 6 ? `1px solid ${adminTokens.divider}` : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: tp.bg, color: tp.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                    }}>{n.split(' ').map(s => s[0]).slice(0,2).join('')}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{n}</div>
                      <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, marginTop: 1 }}>
                        {['2 ชม.','4 ชม.','7 ชม.','เมื่อวาน','เมื่อวาน','2 วันก่อน','3 วันก่อน'][i]} · ฿{[990,1450,2900,350,3900,5200,2400][i]}
                      </div>
                    </div>
                    <PrIcon d={prIcons.chev} size={14}/>
                  </div>
                ))}
              </div>
            </PrCard>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '14px 22px', borderTop: `1px solid ${adminTokens.divider}`,
          display: 'flex', gap: 8, background: adminTokens.surface,
        }}>
          <PrBtn icon={prIcons.edit}>แก้ไข</PrBtn>
          <PrBtn icon={prIcons.copy}>ทำซ้ำ</PrBtn>
          <div style={{ flex: 1 }}/>
          {promo.status === 'active' && <PrBtn icon={prIcons.pause} danger>พัก</PrBtn>}
          {(promo.status === 'paused' || promo.status === 'draft') && <PrBtn icon={prIcons.play} primary>เปิดใช้</PrBtn>}
          {promo.status === 'ended' && <PrBtn icon={prIcons.refresh} primary>เริ่มอีกครั้ง</PrBtn>}
        </div>
      </div>
    </div>
  );
};

const drawerHeaderBtn = {
  background: 'rgba(255,255,255,.18)', border: 0, color: '#fff', padding: '8px 12px',
  borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 5,
};

/* ---------- Main page ---------- */
const PromosPageV2 = () => {
  const [view, setView]       = useStatePr(() => localStorage.getItem('moom-promos-view') || 'grid');
  const [filter, setFilter]   = useStatePr('all');        // status filter
  const [typeFilter, setType] = useStatePr('all');
  const [sort, setSort]       = useStatePr('newest');
  const [search, setSearch]   = useStatePr('');
  const [open, setOpen]       = useStatePr(null);
  const [toast, setToast]     = useStatePr(null);

  useEffectPr(() => { localStorage.setItem('moom-promos-view', view); }, [view]);

  const handleAction = (kind, p) => {
    if (kind === 'copy') {
      try { navigator.clipboard?.writeText(p.code); } catch {}
      setToast(`คัดลอกโค้ด ${p.code} แล้ว`);
      setTimeout(() => setToast(null), 1800);
    } else if (kind === 'pause') {
      setToast(`พักโปร "${p.name}"`);
      setTimeout(() => setToast(null), 1600);
    } else if (kind === 'play') {
      setToast(`เปิดโปร "${p.name}"`);
      setTimeout(() => setToast(null), 1600);
    } else if (kind === 'qr') {
      setToast('สร้าง QR แล้ว');
      setTimeout(() => setToast(null), 1600);
    }
  };

  const handleTemplate = (t) => {
    if (t === 'library') return;
    setToast('เปิดตัวสร้างโปร...');
    setTimeout(() => setToast(null), 1400);
  };

  const filtered = useMemoPr(() => {
    let rows = PROMOS;
    if (filter !== 'all')    rows = rows.filter(p => p.status === filter);
    if (typeFilter !== 'all')rows = rows.filter(p => p.type === typeFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      rows = rows.filter(p => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
    }
    const order = { newest:'id', used:'used', revenue:'revenue', conv:'conv' };
    const key = order[sort] || 'id';
    rows = [...rows].sort((a, b) => b[key] - a[key]);
    return rows;
  }, [filter, typeFilter, sort, search]);

  const counts = useMemoPr(() => {
    const c = { all: PROMOS.length };
    for (const p of PROMOS) c[p.status] = (c[p.status] || 0) + 1;
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
            โปรโมชั่น & โค้ดส่วนลด
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                            padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
                            background: adminTokens.successSoft, color: adminTokens.success }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: adminTokens.success,
                             animation: 'admin-pulse 1.6s ease-in-out infinite' }}/>
              {counts.active || 0} กำลังใช้
            </span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            จัดการแคมเปญ โค้ดส่วนลด และติดตามผลแบบเรียลไทม์
          </p>
        </div>
        <PrBtn icon={prIcons.book}>ไลบรารี</PrBtn>
        <PrBtn icon={prIcons.sparkle}>AI ช่วยสร้าง</PrBtn>
        <PrBtn icon={prIcons.plus} primary>สร้างโปรใหม่</PrBtn>
      </div>

      {/* KPI strip */}
      <PromoKpiStrip/>

      {/* Quick launch */}
      <QuickLaunch onPick={handleTemplate}/>

      {/* Perf chart + insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
        <PerformanceChart/>
        <PrCard title="อินไซต์จากโปร" subtitle="สัปดาห์นี้">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InsightCard tone="good" icon={prIcons.trendU} title="SONGKRAN26 กำลังไปได้สวย"
              body="Conv. 6.96% สูงกว่าเป้า 40% — เพิ่มโควต้าเพื่อต่อความแรง" cta="เพิ่ม 100 สิทธิ์"/>
            <InsightCard tone="warn" icon={prIcons.trendD} title="TRIAL14 conv. ต่ำ"
              body="เพิ่งใช้ไป 12/50 — ลองทดลอง A/B ใหม่" cta="สร้าง A/B"/>
            <InsightCard tone="info" icon={prIcons.clock} title="3 โปรใกล้จบ"
              body="SONGKRAN26 จบใน 1 วัน · YOGA20 จบใน 11 วัน · TRIAL14 (พัก)" cta="ดูทั้งหมด"/>
            <InsightCard tone="bad" icon={prIcons.alert} title="WINBACK25 จบแล้ว"
              body="แคมเปญนี้ดึงกลับ 23 คน ฿43.7K — ลองทำใหม่สำหรับ Q2" cta="ทำซ้ำ"/>
          </div>
        </PrCard>
      </div>

      {/* Filters bar */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{
          flex: 1, minWidth: 200, maxWidth: 320, height: 36, padding: '0 12px',
          background: adminTokens.subtle, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <PrIcon d={prIcons.search} size={14}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="ค้นหาชื่อโปร หรือโค้ด..."
                 style={{ flex: 1, border: 0, background: 'transparent', outline: 'none',
                          fontFamily: 'inherit', fontSize: 13, color: adminTokens.black }}/>
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 0, padding: 2, cursor: 'pointer', color: adminTokens.muted }}>
              <PrIcon d={prIcons.x} size={12}/>
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 2, padding: 3, background: adminTokens.subtle, borderRadius: 9 }}>
          {[
            { id: 'all',       label: 'ทั้งหมด',  count: counts.all },
            { id: 'active',    label: 'กำลังใช้', count: counts.active || 0 },
            { id: 'scheduled', label: 'นัดอัพ',  count: counts.scheduled || 0 },
            { id: 'paused',    label: 'พัก',     count: counts.paused || 0 },
            { id: 'ended',     label: 'จบ',     count: counts.ended || 0 },
            { id: 'draft',     label: 'ร่าง',    count: counts.draft || 0 },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              height: 30, padding: '0 12px', borderRadius: 7, border: 0,
              background: filter === t.id ? adminTokens.surface : 'transparent',
              boxShadow: filter === t.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              color: filter === t.id ? adminTokens.black : adminTokens.muted,
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
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

        {/* Type filter */}
        <select value={typeFilter} onChange={e => setType(e.target.value)} style={selectStyle}>
          <option value="all">ทุกประเภท</option>
          {Object.entries(PROMO_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
          <option value="newest">ล่าสุดก่อน</option>
          <option value="used">ใช้มากสุด</option>
          <option value="revenue">รายได้สูงสุด</option>
          <option value="conv">Conv. สูงสุด</option>
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, padding: 3, background: adminTokens.subtle, borderRadius: 9 }}>
          <button onClick={() => setView('grid')} style={{
            width: 32, height: 30, borderRadius: 7, border: 0, cursor: 'pointer',
            background: view === 'grid' ? adminTokens.surface : 'transparent',
            color: view === 'grid' ? adminTokens.black : adminTokens.muted,
            boxShadow: view === 'grid' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }} title="กริด"><PrIcon d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>} size={13}/></button>
          <button onClick={() => setView('list')} style={{
            width: 32, height: 30, borderRadius: 7, border: 0, cursor: 'pointer',
            background: view === 'list' ? adminTokens.surface : 'transparent',
            color: view === 'list' ? adminTokens.black : adminTokens.muted,
            boxShadow: view === 'list' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }} title="ตาราง"><PrIcon d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} size={13}/></button>
        </div>
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div style={{
          background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 60, textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: adminTokens.muted }}>
            ไม่พบโปรที่ตรงกับตัวกรอง
          </div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(p => <PromoCard key={p.id} p={p} onOpen={setOpen} onAction={handleAction}/>)}
        </div>
      ) : (
        <PrCard noBody>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.4fr 1fr 1fr 1.2fr 1fr 1fr 100px',
            alignItems: 'center', gap: 10, padding: '10px 16px',
            background: adminTokens.subtle, borderBottom: `1px solid ${adminTokens.divider}`,
            fontSize: 10, fontWeight: 800, color: adminTokens.muted,
            textTransform: 'uppercase', letterSpacing: '.04em',
          }}>
            <div>โปรโมชั่น</div>
            <div>ส่วนลด</div>
            <div>สถานะ</div>
            <div>การใช้</div>
            <div>รายได้</div>
            <div>Trend</div>
            <div style={{ textAlign: 'right' }}>การกระทำ</div>
          </div>
          {filtered.map(p => <PromoRow key={p.id} p={p} onOpen={setOpen} onAction={handleAction}/>)}
        </PrCard>
      )}

      {/* Drawer */}
      {open && <PromoDrawer promo={open} onClose={() => setOpen(null)} onAction={handleAction}/>}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: adminTokens.black, color: '#fff', padding: '10px 18px', borderRadius: 9999,
          fontSize: 13, fontWeight: 700, boxShadow: adminTokens.shadowLg, zIndex: 300,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <PrIcon d={prIcons.check} size={14} stroke={2.5}/>
          {toast}
        </div>
      )}
    </div>
  );
};

const selectStyle = {
  height: 36, padding: '0 10px', borderRadius: 9,
  border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
  color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', outline: 'none',
};

/* Export */
Object.assign(window, { PromosPageV2 });
