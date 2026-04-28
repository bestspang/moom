/* MOOM Admin — Packages page
   Operator view of packages/plans:
   - KPI strip
   - Filter + sort + view toggle
   - Grid OR table view of packages
   - Detail drawer (tabs)
   - Promo rules section */

const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

/* ---------- Icons ---------- */
const pIcons = {
  plus:   <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:      <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  grid:   <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list:   <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  edit:   <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  copy:   <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  trash:  <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
  dots:   <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  check:  <><polyline points="20 6 9 17 4 12"/></>,
  chev:   <><polyline points="6 9 12 15 18 9"/></>,
  up:     <><polyline points="18 15 12 9 6 15"/></>,
  down:   <><polyline points="6 9 12 15 18 9"/></>,
  users:  <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
  cash:   <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  cal:    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  tag:    <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  tick:   <><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></>,
  inf:    <><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></>,
  ticket: <><path d="M3 7v2a3 3 0 010 6v2c0 1.1.9 2 2 2h14a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/><line x1="13" y1="5" x2="13" y2="7"/><line x1="13" y1="11" x2="13" y2="13"/><line x1="13" y1="17" x2="13" y2="19"/></>,
  star:   <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  alert:  <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></>,
  save:   <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
};

/* ---------- Package dataset (mock) ---------- */
const PKG_TYPES = {
  visit:      { label: 'Drop-in',     color: 'hsl(22 95% 55%)',  icon: pIcons.ticket },
  unlimited:  { label: 'Unlimited',   color: 'hsl(212 95% 56%)', icon: pIcons.inf },
  classpass:  { label: 'Class Pass',  color: 'hsl(280 65% 55%)', icon: pIcons.star },
};

const PACKAGES = [
  { id: 1,  name: 'Drop-in Single',       type: 'visit',     price: 350,   duration: '1 ครั้ง',   visits: 1,  validDays: 30,  status: 'active', subs: 42,  revenue: 14700,  growth: 5,  trending: [30,32,35,38,40,41,42], featured: false, inclusions: ['เข้าฟิตเนสทุกประเภท','ล็อคเกอร์', 'Wi-Fi'], desc: 'ทดลอง 1 ครั้ง สำหรับผู้เริ่มต้น' },
  { id: 2,  name: '10 Class Bundle',      type: 'visit',     price: 2900,  duration: '10 ครั้ง',   visits: 10, validDays: 90,  status: 'active', subs: 68,  revenue: 197200, growth: 12, trending: [45,50,55,58,62,65,68], featured: true,  inclusions: ['10 คลาสในทุกประเภท','ใช้ได้ 90 วัน','ฝากคลาสได้ 2 ครั้ง','ล็อคเกอร์','Wi-Fi'], desc: 'คุ้มสุดสำหรับผู้มาเป็นประจำ' },
  { id: 3,  name: '20 Class Bundle',      type: 'visit',     price: 5200,  duration: '20 ครั้ง',   visits: 20, validDays: 120, status: 'active', subs: 28,  revenue: 145600, growth: 8,  trending: [20,22,24,25,26,27,28], featured: false, inclusions: ['20 คลาสในทุกประเภท','ใช้ได้ 120 วัน','ฝากคลาสได้ 4 ครั้ง','ส่วนลด 10% ร้านค้า','ล็อคเกอร์'], desc: 'สำหรับผู้ที่เข้ายิมสัปดาห์ละ 3 ครั้งขึ้นไป' },
  { id: 4,  name: 'Unlimited Monthly',    type: 'unlimited', price: 3900,  duration: '1 เดือน',    visits: null,validDays: 30, status: 'active', subs: 94,  revenue: 366600, growth: 18, trending: [60,65,72,78,82,88,94], featured: true,  inclusions: ['ไม่จำกัดคลาส','ไม่จำกัดเวลา','พกไปคลาส Hot Yoga ได้','ล็อคเกอร์','Wi-Fi','ส่วนลด 15% ร้านค้า'], desc: 'เข้ายิมไม่จำกัด — คุ้มสุดถ้าเข้า 8+ ครั้งต่อเดือน' },
  { id: 5,  name: 'Unlimited Quarterly',  type: 'unlimited', price: 10500, duration: '3 เดือน',   visits: null,validDays: 90, status: 'active', subs: 38,  revenue: 399000, growth: 6,  trending: [28,30,32,34,36,37,38], featured: false, inclusions: ['ไม่จำกัดคลาส 90 วัน','ประหยัด 10% จากรายเดือน','พกไปคลาส Hot Yoga','รวม PT 1 ครั้ง','ล็อคเกอร์VIP'], desc: 'รายไตรมาสสำหรับสมาชิกระยะยาว' },
  { id: 6,  name: 'Unlimited Annual',     type: 'unlimited', price: 36000, duration: '12 เดือน',  visits: null,validDays: 365, status: 'active',subs: 18,  revenue: 648000, growth: 2,  trending: [14,15,16,17,17,18,18], featured: false, inclusions: ['ไม่จำกัด 1 ปี','ประหยัด 23%','PT 6 ครั้งฟรี','ล็อคเกอร์ VIP','ระงับ 30 วัน/ปี','ส่วนลด 20% ร้านค้า'], desc: 'รายปี สำหรับสมาชิกตัวจริง' },
  { id: 7,  name: 'Yoga Pass 8',          type: 'classpass', price: 2400,  duration: '8 คลาส',    visits: 8,  validDays: 60,  status: 'active', subs: 32,  revenue: 76800,  growth: 15, trending: [22,24,26,27,29,30,32], featured: false, inclusions: ['8 คลาส Yoga','ใช้ได้ 60 วัน','Mat + Props ฟรี','Hot Yoga รวม'], desc: 'สำหรับสมาชิก Yoga โดยเฉพาะ' },
  { id: 8,  name: 'HIIT Pass 12',         type: 'classpass', price: 3600,  duration: '12 คลาส',   visits: 12, validDays: 90,  status: 'active', subs: 24,  revenue: 86400,  growth: 20, trending: [14,16,18,20,21,23,24], featured: true,  inclusions: ['12 คลาส HIIT','ใช้ได้ 90 วัน','Heart rate monitor ฟรี','Post-workout shake 3 ครั้ง'], desc: 'สำหรับคนชอบเผาผลาญ' },
  { id: 9,  name: 'Student Monthly',      type: 'unlimited', price: 2500,  duration: '1 เดือน',   visits: null,validDays: 30, status: 'draft', subs: 0,   revenue: 0,      growth: 0,  trending: [0,0,0,0,0,0,0], featured: false, inclusions: ['ไม่จำกัดคลาส','ต้องแสดงบัตร นศ.','อายุไม่เกิน 25 ปี','ส่วนลด 36%'], desc: 'พิเศษสำหรับนักศึกษา' },
  { id: 10, name: 'Trial Week',           type: 'unlimited', price: 499,   duration: '7 วัน',      visits: null,validDays: 7, status: 'archived', subs: 0, revenue: 67600, growth: 0,  trending: [0,0,0,0,0,0,0], featured: false, inclusions: ['ทดลองฟรี 7 วัน','1 คน 1 ครั้ง','ยกเลิกอัตโนมัติ'], desc: 'ทดลองฟรี (ปิดชั่วคราว)' },
];

/* ---------- Shared UI primitives (scoped names) ---------- */
const PCard = ({ title, subtitle, action, children, pad = 16, minH }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    display: 'flex', flexDirection: 'column', minHeight: minH,
  }}>
    {title && (
      <div style={{
        padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${adminTokens.divider}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    <div style={{ padding: pad, flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
  </div>
);

const PIcon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const PPill = ({ children, color = adminTokens.muted, bg, strong }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 9999, fontSize: 11,
    fontWeight: strong ? 800 : 700, letterSpacing: '.02em',
    background: bg || `${color} / 0.12`, color, whiteSpace: 'nowrap',
  }}>{children}</span>
);

const PChip = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{
    height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
    border: 0, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    background: active ? adminTokens.surface : 'transparent',
    color: active ? adminTokens.black : adminTokens.muted,
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  }}>{children}</button>
);

const PBtn = ({ children, icon, primary, ghost, danger, onClick, small }) => {
  const h = small ? 30 : 36;
  const p = small ? '0 10px' : '0 14px';
  let bg, color, border;
  if (primary)      { bg = adminTokens.orange; color = '#fff'; border = 0; }
  else if (danger)  { bg = adminTokens.surface; color = adminTokens.destr; border = `1px solid ${adminTokens.border}`; }
  else if (ghost)   { bg = 'transparent'; color = adminTokens.muted; border = 0; }
  else              { bg = adminTokens.surface; color = adminTokens.black; border = `1px solid ${adminTokens.border}`; }
  return (
    <button onClick={onClick} style={{
      background: bg, color, border, height: h, padding: p, borderRadius: adminTokens.r2,
      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      boxShadow: primary ? adminTokens.shadowOrange : 'none',
    }}>
      {icon && <PIcon d={icon} size={13} stroke={2.2}/>} {children}
    </button>
  );
};

const PDelta = ({ v, suffix = '%' }) => {
  const up = v >= 0;
  const fg = v === 0 ? adminTokens.muted : up ? adminTokens.success : adminTokens.destr;
  const bg = v === 0 ? adminTokens.subtle : up ? adminTokens.successSoft : adminTokens.destrSoft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 9999,
      display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
      color: fg, background: bg,
    }}>
      {v !== 0 && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
             style={{ transform: up?'none':'rotate(180deg)' }}>
          <polyline points="6 15 12 9 18 15"/>
        </svg>
      )}
      {up && v !== 0 ? '+' : ''}{v}{suffix}
    </span>
  );
};

const PSpark = ({ series, w = 80, h = 22, color = adminTokens.orange }) => {
  if (!series?.length) return null;
  const min = Math.min(...series), max = Math.max(...series);
  const range = max - min || 1;
  const pts = series.map((v, i) => [
    (i / (series.length - 1)) * w,
    h - ((v - min) / range) * h,
  ]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.2" fill={color}/>
    </svg>
  );
};

/* =============================================================
 *  KPI STRIP
 * =========================================================== */
const PackagesKpiStrip = () => {
  const stats = [
    { label: 'แพ็คเกจใช้งาน',  value: '8',     sub: 'จากทั้งหมด 10',    c: adminTokens.orange, icon: pIcons.tag,
      spark: [6,7,7,7,8,8,8], delta: 0 },
    { label: 'Active subscriptions', value: '344', sub: 'สมาชิกที่กำลังใช้', c: adminTokens.teal,   icon: pIcons.users,
      spark: [280,295,310,322,330,338,344], delta: 12 },
    { label: 'รายได้ 30 วัน',       value: '฿1.93M', sub: 'จากแพ็คเกจทั้งหมด', c: adminTokens.info,   icon: pIcons.cash,
      spark: [1.4,1.5,1.6,1.7,1.78,1.85,1.93], delta: 14 },
    { label: 'ARPU',               value: '฿5,610', sub: 'เฉลี่ยต่อสมาชิก',   c: adminTokens.pink,   icon: pIcons.star,
      spark: [5200,5280,5350,5420,5480,5550,5610], delta: 4 },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 16, boxShadow: adminTokens.shadowSm,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: s.c.replace(')', ' / 0.12)'), color: s.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><PIcon d={s.icon} size={16} stroke={2.2}/></div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: adminTokens.muted,
                          fontWeight: 600, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
            <PDelta v={s.delta}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 3 }}>{s.sub}</div>
            </div>
            <PSpark series={s.spark} color={s.c}/>
          </div>
        </div>
      ))}
    </div>
  );
};

/* =============================================================
 *  TOOLBAR — type filter + status + sort + view toggle + new
 * =========================================================== */
const PackagesToolbar = ({ typeFilter, setTypeFilter, statusFilter, setStatusFilter,
                          sort, setSort, view, setView, query, setQuery, onNew, counts }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    padding: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  }}>
    {/* Type filter */}
    <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle, borderRadius: 10 }}>
      <PChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
        ทั้งหมด
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 9999,
          background: typeFilter === 'all' ? adminTokens.orangeSoft : adminTokens.border,
          color: typeFilter === 'all' ? adminTokens.orange : adminTokens.muted,
        }}>{counts.all}</span>
      </PChip>
      {Object.entries(PKG_TYPES).map(([id, t]) => (
        <PChip key={id} active={typeFilter === id} onClick={() => setTypeFilter(id)}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }}/>
          {t.label}
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 9999,
            background: typeFilter === id ? adminTokens.orangeSoft : adminTokens.border,
            color: typeFilter === id ? adminTokens.orange : adminTokens.muted,
          }}>{counts[id]}</span>
        </PChip>
      ))}
    </div>

    {/* Search */}
    <div style={{
      height: 32, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
      background: adminTokens.surface, minWidth: 180,
    }}>
      <PIcon d={pIcons.search} size={13} stroke={2.2}/>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหา..." style={{
        border: 0, outline: 'none', fontSize: 12, fontFamily: 'inherit',
        flex: 1, background: 'transparent',
      }}/>
    </div>

    <div style={{ flex: 1 }}/>

    {/* Status filter dropdown */}
    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
      height: 32, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
      borderRadius: 8, fontSize: 12, fontFamily: 'inherit', fontWeight: 700,
      background: adminTokens.surface, color: adminTokens.black, cursor: 'pointer',
    }}>
      <option value="all">ทุกสถานะ</option>
      <option value="active">ใช้งาน</option>
      <option value="draft">ร่าง</option>
      <option value="archived">เก็บถาวร</option>
    </select>

    {/* Sort */}
    <select value={sort} onChange={e => setSort(e.target.value)} style={{
      height: 32, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
      borderRadius: 8, fontSize: 12, fontFamily: 'inherit', fontWeight: 700,
      background: adminTokens.surface, color: adminTokens.black, cursor: 'pointer',
    }}>
      <option value="popular">เรียง: ยอดขาย</option>
      <option value="revenue">เรียง: รายได้</option>
      <option value="growth">เรียง: เติบโต</option>
      <option value="price-asc">ราคา: น้อย → มาก</option>
      <option value="price-desc">ราคา: มาก → น้อย</option>
    </select>

    {/* View toggle */}
    <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle,
                  borderRadius: 8, gap: 0 }}>
      <button onClick={() => setView('grid')} style={{
        width: 30, height: 28, borderRadius: 6, border: 0, cursor: 'pointer',
        background: view === 'grid' ? adminTokens.surface : 'transparent',
        color: view === 'grid' ? adminTokens.black : adminTokens.muted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: view === 'grid' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
      }}><PIcon d={pIcons.grid} size={14}/></button>
      <button onClick={() => setView('table')} style={{
        width: 30, height: 28, borderRadius: 6, border: 0, cursor: 'pointer',
        background: view === 'table' ? adminTokens.surface : 'transparent',
        color: view === 'table' ? adminTokens.black : adminTokens.muted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: view === 'table' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
      }}><PIcon d={pIcons.list} size={14}/></button>
    </div>

    <PBtn small primary icon={pIcons.plus} onClick={onNew}>แพ็คเกจใหม่</PBtn>
  </div>
);

/* =============================================================
 *  GRID VIEW — package card
 * =========================================================== */
const PackageCard = ({ p, onOpen }) => {
  const t = PKG_TYPES[p.type];
  const statusMap = {
    active:   { label: 'ใช้งาน',     fg: adminTokens.success, bg: adminTokens.successSoft },
    draft:    { label: 'ร่าง',        fg: adminTokens.muted,   bg: adminTokens.subtle },
    archived: { label: 'เก็บถาวร',    fg: adminTokens.destr,   bg: adminTokens.destrSoft },
  };
  const s = statusMap[p.status];

  return (
    <div onClick={onOpen} style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer',
      transition: 'all .15s', position: 'relative',
      opacity: p.status === 'archived' ? 0.7 : 1,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = adminTokens.shadowMd;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = t.color.replace(')', ' / 0.4)');
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = adminTokens.shadowSm;
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.borderColor = adminTokens.border;
    }}>
      {/* Top accent band */}
      <div style={{ height: 4, background: t.color }}/>

      {p.featured && (
        <div style={{
          position: 'absolute', top: 12, right: 12, display: 'flex',
          alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 9999,
          background: adminTokens.orangeSoft, color: adminTokens.orange,
          fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
        }}>
          <PIcon d={pIcons.star} size={10} stroke={2.5}/> Featured
        </div>
      )}

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Type + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 9999,
            background: t.color.replace(')', ' / 0.12)'), color: t.color,
            fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
          }}>
            <PIcon d={t.icon} size={11} stroke={2.5}/> {t.label}
          </div>
          <PPill color={s.fg} bg={s.bg}>{s.label}</PPill>
        </div>

        {/* Title + desc */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black,
                        letterSpacing: '-.01em' }}>{p.name}</div>
          <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2, lineHeight: 1.5,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.desc}</div>
        </div>

        {/* Price block */}
        <div style={{
          padding: '12px 0', borderTop: `1px dashed ${adminTokens.divider}`,
          borderBottom: `1px dashed ${adminTokens.divider}`,
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: adminTokens.black,
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1 }}>
            ฿{p.price.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
            / {p.duration}
          </div>
          {p.visits && (
            <div style={{ marginLeft: 'auto', fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
              ฿{Math.round(p.price / p.visits)} /ครั้ง
            </div>
          )}
        </div>

        {/* Inclusions (top 3) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p.inclusions.slice(0, 3).map((inc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
                                  fontSize: 12, lineHeight: 1.4, minWidth: 0 }}>
              <span style={{ color: t.color, display: 'flex', flexShrink: 0 }}>
                <PIcon d={pIcons.check} size={12} stroke={2.5}/>
              </span>
              <span style={{ color: adminTokens.ink2, flex: 1, minWidth: 0,
                             whiteSpace: 'nowrap', overflow: 'hidden',
                             textOverflow: 'ellipsis' }}>{inc}</span>
            </div>
          ))}
          {p.inclusions.length > 3 && (
            <div style={{ fontSize: 11, color: adminTokens.mutedLight, paddingLeft: 19 }}>
              + อีก {p.inclusions.length - 3} สิทธิพิเศษ
            </div>
          )}
        </div>
      </div>

      {/* Perf footer */}
      <div style={{
        padding: 14, background: adminTokens.subtle, marginTop: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        borderTop: `1px solid ${adminTokens.divider}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                          fontVariantNumeric: 'tabular-nums' }}>{p.subs}</div>
            <PDelta v={p.growth}/>
          </div>
          <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>
            สมาชิกใช้งาน · ฿{(p.revenue/1000).toFixed(0)}K
          </div>
        </div>
        <PSpark series={p.trending} color={t.color} w={70} h={20}/>
      </div>
    </div>
  );
};

/* =============================================================
 *  TABLE VIEW
 * =========================================================== */
const PackagesTable = ({ rows, onOpen }) => {
  const statusMap = {
    active:   { label: 'ใช้งาน',     fg: adminTokens.success, bg: adminTokens.successSoft },
    draft:    { label: 'ร่าง',        fg: adminTokens.muted,   bg: adminTokens.subtle },
    archived: { label: 'เก็บถาวร',    fg: adminTokens.destr,   bg: adminTokens.destrSoft },
  };
  const cols = '1fr 120px 120px 90px 130px 120px 100px 40px';
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: cols, padding: '12px 18px',
        fontSize: 10, fontWeight: 700, color: adminTokens.muted,
        letterSpacing: '.06em', textTransform: 'uppercase',
        borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
      }}>
        <div>แพ็คเกจ</div>
        <div>ประเภท</div>
        <div style={{ textAlign: 'right' }}>ราคา</div>
        <div style={{ textAlign: 'right' }}>ขาย</div>
        <div style={{ textAlign: 'right' }}>รายได้ 30d</div>
        <div>เทรนด์</div>
        <div>สถานะ</div>
        <div/>
      </div>
      {rows.map((p, i) => {
        const t = PKG_TYPES[p.type];
        const s = statusMap[p.status];
        return (
          <div key={p.id} onClick={() => onOpen(p)} style={{
            display: 'grid', gridTemplateColumns: cols, padding: '14px 18px',
            alignItems: 'center', cursor: 'pointer', transition: 'background .1s',
            borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            opacity: p.status === 'archived' ? 0.65 : 1,
          }}
          onMouseEnter={e => e.currentTarget.style.background = adminTokens.subtle}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: t.color.replace(')', ' / 0.12)'), color: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}><PIcon d={t.icon} size={15} stroke={2.2}/></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                              display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.name}
                  {p.featured && <PIcon d={pIcons.star} size={11} stroke={2.5}/>}
                </div>
                <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 1 }}>{p.duration}</div>
              </div>
            </div>
            <div>
              <PPill color={t.color} bg={t.color.replace(')', ' / 0.12)')}>{t.label}</PPill>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800,
                          color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
              ฿{p.price.toLocaleString()}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums' }}>{p.subs}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>
                <PDelta v={p.growth}/>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700,
                          color: adminTokens.black, fontVariantNumeric: 'tabular-nums' }}>
              ฿{(p.revenue/1000).toFixed(0)}K
            </div>
            <div><PSpark series={p.trending} color={t.color} w={90} h={22}/></div>
            <div><PPill color={s.fg} bg={s.bg}>{s.label}</PPill></div>
            <button onClick={e => { e.stopPropagation(); }} style={{
              background: 'transparent', border: 0, color: adminTokens.mutedLight, cursor: 'pointer',
              width: 28, height: 28, borderRadius: 6, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}><PIcon d={pIcons.dots} size={14}/></button>
          </div>
        );
      })}
    </div>
  );
};

/* =============================================================
 *  DETAIL DRAWER — tabs: Overview / Pricing / Inclusions / Subscribers / Analytics
 * =========================================================== */
const PkgDrawer = ({ pkg, onClose }) => {
  const [tab, setTab] = useStateP('overview');
  if (!pkg) return null;
  const t = PKG_TYPES[pkg.type];

  const tabs = [
    { id: 'overview',    label: 'ภาพรวม' },
    { id: 'pricing',     label: 'ราคา' },
    { id: 'inclusions',  label: 'สิทธิพิเศษ' },
    { id: 'subs',        label: `สมาชิก (${pkg.subs})` },
    { id: 'analytics',   label: 'วิเคราะห์' },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 50,
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, zIndex: 51,
        background: adminTokens.surface, boxShadow: '-4px 0 24px rgba(15,23,42,.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px 0', display: 'flex', alignItems: 'flex-start', gap: 12,
          borderBottom: `1px solid ${adminTokens.divider}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: t.color.replace(')', ' / 0.14)'), color: t.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><PIcon d={t.icon} size={22} stroke={2.2}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <PPill color={t.color} bg={t.color.replace(')', ' / 0.12)')}>{t.label}</PPill>
              {pkg.featured && <PPill color={adminTokens.orange} bg={adminTokens.orangeSoft}>Featured</PPill>}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                          letterSpacing: '-.02em' }}>{pkg.name}</div>
            <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 2 }}>{pkg.desc}</div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginTop: 14, marginBottom: -1 }}>
              {tabs.map(t2 => (
                <button key={t2.id} onClick={() => setTab(t2.id)} style={{
                  padding: '10px 12px', border: 0, cursor: 'pointer',
                  background: 'transparent', whiteSpace: 'nowrap',
                  color: tab === t2.id ? adminTokens.orange : adminTokens.muted,
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  borderBottom: `2px solid ${tab === t2.id ? adminTokens.orange : 'transparent'}`,
                }}>{t2.label}</button>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0, cursor: 'pointer',
            background: adminTokens.subtle, color: adminTokens.black,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><PIcon d={pIcons.x} size={16}/></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22,
                      display: 'flex', flexDirection: 'column', gap: 18 }}>
          {tab === 'overview' && <DrawerOverview p={pkg}/>}
          {tab === 'pricing' && <DrawerPricing p={pkg}/>}
          {tab === 'inclusions' && <DrawerInclusions p={pkg}/>}
          {tab === 'subs' && <DrawerSubs p={pkg}/>}
          {tab === 'analytics' && <DrawerAnalytics p={pkg}/>}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px', borderTop: `1px solid ${adminTokens.divider}`,
          display: 'flex', gap: 8, justifyContent: 'space-between',
          background: adminTokens.subtle,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <PBtn small icon={pIcons.copy}>ทำซ้ำ</PBtn>
            <PBtn small danger icon={pIcons.trash}>เก็บถาวร</PBtn>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <PBtn small onClick={onClose}>ปิด</PBtn>
            <PBtn small primary icon={pIcons.save}>บันทึก</PBtn>
          </div>
        </div>
      </div>
    </>
  );
};

/* Drawer tab: Overview */
const DrawerOverview = ({ p }) => {
  const t = PKG_TYPES[p.type];
  const stats = [
    { label: 'ราคา',             value: `฿${p.price.toLocaleString()}`, sub: `/ ${p.duration}` },
    { label: 'สมาชิกใช้งาน',     value: p.subs.toString(),               sub: `${p.growth >= 0 ? '+' : ''}${p.growth}%` },
    { label: 'รายได้ 30 วัน',    value: `฿${(p.revenue/1000).toFixed(0)}K`, sub: null },
    { label: 'อายุการใช้งาน',    value: `${p.validDays} วัน`,             sub: p.visits ? `${p.visits} ครั้ง` : 'ไม่จำกัด' },
  ];
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 12, background: adminTokens.subtle,
          }}>
            <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: adminTokens.black,
                          fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', marginTop: 3 }}>
              {s.value}
            </div>
            {s.sub && <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>
      <PCard title="ยอดขาย 7 วันล่าสุด" pad={16}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                      gap: 4, height: 80, marginBottom: 6 }}>
          {p.trending.map((v, i) => {
            const max = Math.max(...p.trending);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', height: `${(v / max) * 70}px`,
                  background: t.color, borderRadius: '6px 6px 0 0', minHeight: 4,
                }}/>
                <div style={{ fontSize: 10, color: adminTokens.mutedLight,
                              fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            );
          })}
        </div>
      </PCard>
    </>
  );
};

/* Drawer tab: Pricing */
const DrawerPricing = ({ p }) => {
  const [price, setPrice] = useStateP(p.price);
  const [featured, setFeatured] = useStateP(p.featured);
  return (
    <>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                        letterSpacing: '.04em', textTransform: 'uppercase' }}>ราคา (฿)</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
          <div style={{
            height: 44, padding: '0 14px', border: `1px solid ${adminTokens.border}`,
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4, flex: 1,
            background: adminTokens.surface,
          }}>
            <span style={{ fontSize: 18, color: adminTokens.mutedLight, fontWeight: 700 }}>฿</span>
            <input type="number" value={price} onChange={e => setPrice(+e.target.value)} style={{
              border: 0, outline: 'none', flex: 1, fontSize: 22, fontWeight: 800,
              fontFamily: 'inherit', color: adminTokens.black,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em',
            }}/>
          </div>
          {p.visits && (
            <div style={{ padding: 12, borderRadius: 10, background: adminTokens.subtle,
                          textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>ต่อครั้ง</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.orange,
                            fontVariantNumeric: 'tabular-nums' }}>
                ฿{Math.round(price / p.visits)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                        letterSpacing: '.04em', textTransform: 'uppercase' }}>อายุการใช้งาน</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {[7, 30, 90, 180, 365].map(d => (
            <button key={d} style={{
              flex: 1, height: 40, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
              border: p.validDays === d ? 0 : `1px solid ${adminTokens.border}`,
              background: p.validDays === d ? adminTokens.orange : adminTokens.surface,
              color: p.validDays === d ? '#fff' : adminTokens.black,
              fontSize: 12, fontWeight: 700,
            }}>{d}d</button>
          ))}
        </div>
      </div>
      {p.visits && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                          letterSpacing: '.04em', textTransform: 'uppercase' }}>จำนวนครั้ง</label>
          <input type="number" defaultValue={p.visits} style={{
            width: '100%', height: 44, padding: '0 14px', marginTop: 6,
            border: `1px solid ${adminTokens.border}`, borderRadius: 10,
            fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
            color: adminTokens.black,
          }}/>
        </div>
      )}
      {/* Featured toggle */}
      <div style={{
        padding: 14, borderRadius: 12, background: adminTokens.orangeSoft,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: '#fff',
          color: adminTokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><PIcon d={pIcons.star} size={16} stroke={2.5}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>โปรโมท (Featured)</div>
          <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>
            แสดงเด่นในหน้าจองของสมาชิก
          </div>
        </div>
        <div onClick={() => setFeatured(!featured)} style={{
          width: 38, height: 22, borderRadius: 9999, padding: 2, cursor: 'pointer',
          background: featured ? adminTokens.orange : adminTokens.border,
          transition: 'background .2s',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            transform: featured ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          }}/>
        </div>
      </div>
    </>
  );
};

/* Drawer tab: Inclusions */
const DrawerInclusions = ({ p }) => {
  const [items, setItems] = useStateP(p.inclusions);
  const [draft, setDraft] = useStateP('');
  const t = PKG_TYPES[p.type];

  const add = () => {
    if (draft.trim()) { setItems([...items, draft.trim()]); setDraft(''); }
  };

  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>
            สิ่งที่สมาชิกจะได้รับ
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
            {items.length} รายการ
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((inc, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 10,
              background: adminTokens.subtle,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: t.color, display: 'flex' }}>
                <PIcon d={pIcons.check} size={14} stroke={2.5}/>
              </span>
              <span style={{ flex: 1, fontSize: 13, color: adminTokens.black, fontWeight: 500 }}>{inc}</span>
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{
                background: 'transparent', border: 0, color: adminTokens.mutedLight,
                cursor: 'pointer', width: 24, height: 24, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><PIcon d={pIcons.trash} size={13}/></button>
            </div>
          ))}
        </div>
      </div>
      <div style={{
        display: 'flex', gap: 8,
      }}>
        <input value={draft} onChange={e => setDraft(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && add()}
               placeholder="เพิ่มสิทธิพิเศษใหม่..."
               style={{
                 flex: 1, height: 40, padding: '0 12px',
                 border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                 fontSize: 13, fontFamily: 'inherit', outline: 'none',
               }}/>
        <PBtn primary icon={pIcons.plus} onClick={add}>เพิ่ม</PBtn>
      </div>
    </>
  );
};

/* Drawer tab: Subs */
const DrawerSubs = ({ p }) => {
  const sample = [
    { name: 'Thanin Sriprasert', joined: '12 เม.ย. 2025', expires: '12 เม.ย. 2026', remaining: p.visits ? Math.floor(p.visits * 0.4) : null },
    { name: 'Napat Kongphop',    joined: '3 เม.ย. 2025',  expires: '3 เม.ย. 2026',  remaining: p.visits ? Math.floor(p.visits * 0.8) : null },
    { name: 'Preecha Manop',     joined: '28 มี.ค. 2025', expires: '28 มี.ค. 2026', remaining: p.visits ? Math.floor(p.visits * 0.2) : null },
    { name: 'Suda Wongsawat',    joined: '22 มี.ค. 2025', expires: '22 มี.ค. 2026', remaining: p.visits ? Math.floor(p.visits * 0.6) : null },
    { name: 'Korn Thanakit',     joined: '15 มี.ค. 2025', expires: '15 มี.ค. 2026', remaining: p.visits ? Math.floor(p.visits * 0.5) : null },
    { name: 'Anong Prasertsak',  joined: '10 มี.ค. 2025', expires: '10 มี.ค. 2026', remaining: p.visits ? Math.floor(p.visits * 0.3) : null },
  ];
  if (p.subs === 0) {
    return (
      <div style={{
        padding: 30, textAlign: 'center', background: adminTokens.subtle,
        borderRadius: 12, color: adminTokens.muted, fontSize: 13,
      }}>ยังไม่มีสมาชิกในแพ็คเกจนี้</div>
    );
  }
  return (
    <>
      <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
        แสดง {sample.length} จาก {p.subs} สมาชิก · เรียงตามล่าสุด
      </div>
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {sample.map((s, i) => (
          <div key={i} style={{
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: i === sample.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: adminTokens.orangeSoft, color: adminTokens.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, flexShrink: 0,
            }}>{s.name.split(' ').map(w => w[0]).join('')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{s.name}</div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 1 }}>
                เริ่ม {s.joined} · หมดอายุ {s.expires}
              </div>
            </div>
            {s.remaining !== null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums' }}>{s.remaining}</div>
                <div style={{ fontSize: 10, color: adminTokens.mutedLight }}>คงเหลือ</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

/* Drawer tab: Analytics */
const DrawerAnalytics = ({ p }) => {
  const t = PKG_TYPES[p.type];
  const W = 500, H = 180, PAD = { t: 10, r: 10, b: 24, l: 30 };
  // Fake 30-day revenue curve
  const series = Array.from({length: 30}, (_, i) =>
    Math.max(0, p.revenue / 30 + Math.sin(i * 0.5) * (p.revenue / 100) + i * (p.revenue / 500))
  );
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const max = Math.max(...series);
  const x = (i) => PAD.l + (i / (series.length - 1)) * innerW;
  const y = (v) => PAD.t + innerH - (v / max) * innerH;
  const path = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(series.length-1)},${PAD.t + innerH} L${x(0)},${PAD.t + innerH} Z`;

  return (
    <>
      <PCard title="รายได้ 30 วัน" subtitle={`รวม ฿${(p.revenue/1000).toFixed(0)}K · เฉลี่ย ฿${Math.round(p.revenue/30).toLocaleString()}/วัน`}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id={`pkg-analytics-${p.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={t.color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={t.color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((pp, i) => (
            <line key={i} x1={PAD.l} y1={PAD.t + innerH * pp} x2={W - PAD.r} y2={PAD.t + innerH * pp}
                  stroke={adminTokens.divider} strokeDasharray={i === 4 ? 'none' : '2 3'}/>
          ))}
          <path d={area} fill={`url(#pkg-analytics-${p.id})`}/>
          <path d={path} fill="none" stroke={t.color} strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </PCard>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {[
          { label: 'อัตราต่ออายุ', value: '74%',  sub: '+6% vs เดือนก่อน' },
          { label: 'Churn',         value: '8%',   sub: '-2% vs เดือนก่อน' },
          { label: 'คะแนนความพึงพอใจ', value: '4.6', sub: 'จาก 5 (128 รีวิว)' },
          { label: 'Upgrade จาก trial', value: '42%',  sub: 'จาก Trial Week' },
        ].map((s, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, background: adminTokens.subtle }}>
            <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                          fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', marginTop: 3 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: adminTokens.success, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </>
  );
};

/* =============================================================
 *  PROMO RULES SECTION
 * =========================================================== */
const PromoRules = () => {
  const rules = [
    { code: 'NEWYEAR25',   kind: 'percent', value: 25, scope: 'ทุกแพ็คเกจ Unlimited', uses: 142, max: 500, until: '31 ม.ค.', active: true },
    { code: 'FRIEND500',   kind: 'amount',  value: 500, scope: 'ผู้แนะนำเพื่อน',       uses: 68,  max: null, until: 'ตลอดไป',  active: true },
    { code: 'STUDENT20',   kind: 'percent', value: 20, scope: 'นักศึกษา',               uses: 28,  max: null, until: '30 มิ.ย.', active: true },
    { code: 'TRIAL50',     kind: 'percent', value: 50, scope: 'Trial Week',            uses: 412, max: null, until: '31 ธ.ค.', active: true },
    { code: 'SUMMER10',    kind: 'percent', value: 10, scope: 'ทุกแพ็คเกจ',             uses: 0,   max: 200, until: '31 ส.ค.', active: false },
  ];
  return (
    <PCard title="รหัสส่วนลด" subtitle={`${rules.filter(r => r.active).length} active / ${rules.length} total`}
           action={<PBtn small primary icon={pIcons.plus}>รหัสใหม่</PBtn>} pad={0}>
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 100px 100px 80px 40px',
          padding: '10px 16px', fontSize: 10, fontWeight: 700, color: adminTokens.muted,
          letterSpacing: '.06em', textTransform: 'uppercase',
          borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
        }}>
          <div>รหัส</div><div>ส่วนลด</div><div>ใช้กับ</div>
          <div style={{textAlign:'right'}}>ใช้แล้ว</div>
          <div>หมดอายุ</div><div>สถานะ</div><div/>
        </div>
        {rules.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 100px 100px 80px 40px',
            padding: '14px 16px', alignItems: 'center',
            borderBottom: i === rules.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            opacity: r.active ? 1 : 0.55,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 8,
              background: adminTokens.orangeSoft, color: adminTokens.orange,
              fontSize: 12, fontWeight: 800, fontFamily: 'ui-monospace, Menlo, monospace',
              letterSpacing: '.03em', width: 'fit-content',
            }}>
              <PIcon d={pIcons.ticket} size={12} stroke={2.5}/> {r.code}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.success,
                          fontVariantNumeric: 'tabular-nums' }}>
              {r.kind === 'percent' ? `${r.value}%` : `฿${r.value}`} <span style={{ color: adminTokens.muted, fontWeight: 600, fontSize: 11 }}>OFF</span>
            </div>
            <div style={{ fontSize: 12, color: adminTokens.ink2 }}>{r.scope}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums' }}>
                {r.uses}{r.max ? ` / ${r.max}` : ''}
              </div>
              {r.max && (
                <div style={{ height: 4, borderRadius: 9999, background: adminTokens.border,
                              overflow: 'hidden', marginTop: 4 }}>
                  <div style={{
                    width: `${Math.min(100, (r.uses/r.max)*100)}%`, height: '100%',
                    background: adminTokens.orange, borderRadius: 9999,
                  }}/>
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{r.until}</div>
            <div>
              {r.active ? (
                <PPill color={adminTokens.success} bg={adminTokens.successSoft}>เปิด</PPill>
              ) : (
                <PPill color={adminTokens.muted} bg={adminTokens.subtle}>ปิด</PPill>
              )}
            </div>
            <button style={{
              background: 'transparent', border: 0, color: adminTokens.mutedLight, cursor: 'pointer',
              width: 28, height: 28, borderRadius: 6, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}><PIcon d={pIcons.dots} size={14}/></button>
          </div>
        ))}
      </div>
    </PCard>
  );
};

/* =============================================================
 *  PAGE SHELL
 * =========================================================== */
const PackagesPageV2 = () => {
  const [typeFilter, setTypeFilter] = useStateP('all');
  const [statusFilter, setStatusFilter] = useStateP('active');
  const [sort, setSort] = useStateP('popular');
  const [view, setView] = useStateP(() => localStorage.getItem('moom-admin-pkg-view') || 'grid');
  const [query, setQuery] = useStateP('');
  const [drawerPkg, setDrawerPkg] = useStateP(null);

  useEffectP(() => { localStorage.setItem('moom-admin-pkg-view', view); }, [view]);

  const counts = useMemoP(() => ({
    all: PACKAGES.length,
    visit: PACKAGES.filter(p => p.type === 'visit').length,
    unlimited: PACKAGES.filter(p => p.type === 'unlimited').length,
    classpass: PACKAGES.filter(p => p.type === 'classpass').length,
  }), []);

  const filtered = useMemoP(() => {
    let list = PACKAGES.filter(p => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    const sorters = {
      popular: (a, b) => b.subs - a.subs,
      revenue: (a, b) => b.revenue - a.revenue,
      growth:  (a, b) => b.growth - a.growth,
      'price-asc':  (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
    };
    return [...list].sort(sorters[sort]);
  }, [typeFilter, statusFilter, query, sort]);

  return (
    <div style={{
      padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18,
      maxWidth: 1400, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: adminTokens.black,
                       letterSpacing: '-.02em' }}>แพ็คเกจ & แผน</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: adminTokens.muted }}>
            จัดการแพ็คเกจ ราคา สิทธิพิเศษ และรหัสส่วนลด
          </p>
        </div>
        <PBtn icon={pIcons.copy}>ส่งออก</PBtn>
        <PBtn primary icon={pIcons.plus} onClick={() => setDrawerPkg(PACKAGES[0])}>แพ็คเกจใหม่</PBtn>
      </div>

      <PackagesKpiStrip/>

      <PackagesToolbar
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        sort={sort} setSort={setSort}
        view={view} setView={setView}
        query={query} setQuery={setQuery}
        counts={counts}
        onNew={() => setDrawerPkg(PACKAGES[0])}/>

      {filtered.length === 0 ? (
        <div style={{
          background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 60, textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, color: adminTokens.muted }}>
            ไม่พบแพ็คเกจที่ตรงกับตัวกรอง — ลองปรับเกณฑ์หรือ{' '}
            <a style={{ color: adminTokens.orange, fontWeight: 700, cursor: 'pointer' }}
               onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setQuery(''); }}>
              ล้างทั้งหมด
            </a>
          </div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(p => <PackageCard key={p.id} p={p} onOpen={() => setDrawerPkg(p)}/>)}
        </div>
      ) : (
        <PackagesTable rows={filtered} onOpen={setDrawerPkg}/>
      )}

      <PromoRules/>

      {drawerPkg && <PkgDrawer pkg={drawerPkg} onClose={() => setDrawerPkg(null)}/>}
    </div>
  );
};

Object.assign(window, { PackagesPageV2, PACKAGES, PKG_TYPES });
