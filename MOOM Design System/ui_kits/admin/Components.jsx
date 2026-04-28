const { useState } = React;

const adminTokens = {
  orange: 'hsl(32 100% 50%)',
  orangeSoft: 'hsl(32 100% 95%)',
  cream: 'hsl(36 33% 94%)',
  creamHover: 'hsl(36 33% 90%)',
  black: 'hsl(0 0% 15%)',
  border: 'hsl(0 0% 88%)',
  muted: 'hsl(0 0% 45%)',
  mutedLight: 'hsl(0 0% 65%)',
  bg: 'hsl(0 0% 98%)',
  teal: 'hsl(168 75% 43%)',
  warn: 'hsl(38 92% 50%)',
  destr: 'hsl(0 72% 71%)',
  info: 'hsl(210 70% 55%)',
  pink: 'hsl(330 75% 58%)',
  slate: 'hsl(220 10% 55%)',
};

const A_Icon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const aIcons = {
  grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  door:    <><path d="M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16"/><path d="M3 21h18"/><circle cx="16" cy="12" r="1"/></>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
  userOne: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  star:    <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  gift:    <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,
  cash:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  bar:     <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></>,
  trophy:  <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 4h3v3a3 3 0 01-3 3M7 4H4v3a3 3 0 003 3"/></>,
  building:<><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/></>,
  list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  groups:  <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  layout:  <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
  dumbbell:<><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/></>,
  sun:     <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  chev:    <><polyline points="6 9 12 15 18 9"/></>,
  chevR:   <><polyline points="9 18 15 12 9 6"/></>,
  hand:    <><path d="M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 112.83-2.82L7 15"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  target:  <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  alert:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  trend:   <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  trendD:  <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  activity:<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  qr:      <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M20 14v7M14 20h3"/></>,
  pulse:   <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
  shield:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  pin:     <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  mega:    <><path d="M3 11l18-8v18L3 13zM11.6 16.8a3 3 0 11-5.8-1.6"/></>,
  logPage: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></>,
  gear:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
};

// ---- MoomMark (square orange tile + wordmark) ----
const MoomMark = ({ size = 28 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: size, height: size, borderRadius: 6, background: adminTokens.orange,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: size * 0.5, letterSpacing: '-.02em' }}>M</div>
    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: adminTokens.black }}>MOOM CLUB</div>
  </div>
);

// ---- Sidebar (grouped, chevron sections, orange icons) ----
const Sidebar = ({ page, setPage }) => {
  const [open, setOpen] = useState({ people: true, business: true, gym: true });
  const groups = [
    { items: [
        { id: 'dashboard', label: 'แดชบอร์ด', d: aIcons.grid },
        { id: 'lobby', label: 'ล็อบบี้', d: aIcons.door },
        { id: 'schedule', label: 'ตารางเรียน', d: aIcons.cal },
    ]},
    { group: 'people', label: 'บุคคล', items: [
        { id: 'members', label: 'สมาชิก', d: aIcons.users },
        { id: 'leads', label: 'ลีด', d: aIcons.star },
    ]},
    { group: 'business', label: 'ธุรกิจ', items: [
        { id: 'packages', label: 'แพ็คเกจ', d: aIcons.tag },
        { id: 'promos', label: 'โปรโมชั่น', d: aIcons.gift },
        { id: 'finance', label: 'การเงิน', d: aIcons.cash },
        { id: 'analytics', label: 'วิเคราะห์ธุรกิจ', d: aIcons.bar },
        { id: 'gami', label: 'Gamification', d: aIcons.trophy },
    ]},
    { group: 'gym', label: 'จัดการยิม', items: [
        { id: 'classes', label: 'รายการคลาส', d: aIcons.list },
        { id: 'categories', label: 'หมวดหมู่คลาส', d: aIcons.groups },
        { id: 'rooms', label: 'ผังห้อง', d: aIcons.layout },
        { id: 'programs', label: 'โปรแกรมฝึก', d: aIcons.dumbbell },
        { id: 'exercises', label: 'รายการออกกำลังกาย', d: aIcons.pulse },
        { id: 'staff', label: 'พนักงาน', d: aIcons.userOne },
        { id: 'roles', label: 'บทบาท', d: aIcons.shield },
        { id: 'branches', label: 'สาขา', d: aIcons.pin },
        { id: 'announce', label: 'ประกาศ', d: aIcons.mega },
        { id: 'activity', label: 'บันทึกกิจกรรม', d: aIcons.logPage },
        { id: 'settings', label: 'ตั้งค่า', d: aIcons.gear },
    ]},
  ];

  const Item = ({ it }) => {
    const active = page === it.id;
    return (
      <button onClick={() => setPage(it.id)}
        style={{ background: active ? adminTokens.orange : 'transparent',
                 color: active ? '#fff' : adminTokens.black,
                 border: 0, borderRadius: 8, padding: '8px 12px',
                 display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                 fontWeight: active ? 600 : 500, cursor: 'pointer', marginTop: 2,
                 textAlign: 'left', fontFamily: 'inherit', width: '100%' }}
        onMouseEnter={e => !active && (e.currentTarget.style.background = adminTokens.creamHover)}
        onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}>
        <span style={{ color: active ? '#fff' : adminTokens.orange, display: 'flex' }}>
          <A_Icon d={it.d} size={16} stroke={active ? 2.25 : 2}/>
        </span>
        {it.label}
      </button>
    );
  };

  return (
    <div style={{ width: 220, background: adminTokens.cream, borderRight: `1px solid ${adminTokens.border}`,
                  display: 'flex', flexDirection: 'column', padding: '14px 10px', overflowY: 'auto' }}>
      <div style={{ padding: '2px 6px 14px' }}><MoomMark/></div>
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 6 }}>
          {g.group ? (
            <button onClick={() => setOpen(o => ({ ...o, [g.group]: !o[g.group] }))}
              style={{ background: 'transparent', border: 0, width: '100%',
                       display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit',
                       color: adminTokens.black, fontSize: 13, fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: adminTokens.orange, display: 'flex' }}>
                  <A_Icon d={g.group === 'people' ? aIcons.users :
                            g.group === 'business' ? aIcons.building : aIcons.building} size={16}/>
                </span>
                {g.label}
              </span>
              <span style={{ color: adminTokens.muted, transform: open[g.group] ? 'none' : 'rotate(-90deg)',
                             transition: 'transform .15s', display: 'flex' }}>
                <A_Icon d={aIcons.chev} size={14}/>
              </span>
            </button>
          ) : null}
          {(!g.group || open[g.group]) && (
            <div style={{ paddingLeft: g.group ? 16 : 0 }}>
              {g.items.map(it => <Item key={it.id} it={it}/>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ---- TopHeader (theme / bell / lang / avatar) ----
const TopHeader = () => (
  <div style={{ height: 60, borderBottom: `1px solid ${adminTokens.border}`, background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                padding: '0 24px', gap: 8 }}>
    <button style={{ background: 'transparent', border: 0, width: 36, height: 36, borderRadius: 8,
                     color: adminTokens.black, cursor: 'pointer', display: 'flex',
                     alignItems: 'center', justifyContent: 'center' }}>
      <A_Icon d={aIcons.sun} size={18}/>
    </button>
    <button style={{ background: 'transparent', border: 0, width: 36, height: 36, borderRadius: 8,
                     color: adminTokens.black, cursor: 'pointer', display: 'flex',
                     alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <A_Icon d={aIcons.bell} size={18}/>
      <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%',
                     background: adminTokens.destr }}/>
    </button>
    <button style={{ background: 'transparent', border: 0, height: 36, padding: '0 10px', borderRadius: 8,
                     color: adminTokens.black, cursor: 'pointer', display: 'flex',
                     alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>
      TH <A_Icon d={aIcons.chev} size={14}/>
    </button>
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: adminTokens.orange,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, marginLeft: 4 }}>KS</div>
  </div>
);

// ---- PageHeader (greeting + action bar) ----
const PageHeader = ({ title, subtitle, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 13, color: adminTokens.muted, marginTop: 4 }}>{subtitle}</div>}
    </div>
    {children && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{children}</div>}
  </div>
);

const HeaderBtn = ({ icon, children, primary }) => (
  <button style={{ background: primary ? adminTokens.orange : '#fff',
                   color: primary ? '#fff' : adminTokens.black,
                   border: primary ? 0 : `1px solid ${adminTokens.border}`,
                   height: 36, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                   cursor: 'pointer', fontFamily: 'inherit',
                   display: 'flex', alignItems: 'center', gap: 6 }}>
    {icon && <A_Icon d={icon} size={14}/>} {children}
  </button>
);

// ---- SectionTitle (orange dot + bold + trailing btn) ----
const SectionTitle = ({ icon = aIcons.target, children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 10px' }}>
    <span style={{ color: adminTokens.orange, display: 'flex' }}>
      <A_Icon d={icon} size={16}/>
    </span>
    <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{children}</div>
    {action}
  </div>
);

// ---- KpiCard (right-side muted icon, big number on top) ----
const KpiCard = ({ label, value, suffix, accent = 'orange', icon }) => {
  const accents = { orange: adminTokens.orange, teal: adminTokens.teal, info: adminTokens.info,
                    destr: adminTokens.destr, pink: adminTokens.pink, slate: adminTokens.slate };
  return (
    <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`,
                  borderLeft: `4px solid ${accents[accent]}`, borderRadius: 10, padding: 16,
                  boxShadow: '0 1px 2px rgba(0,0,0,.04)', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', minHeight: 92 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: adminTokens.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      color: adminTokens.black, lineHeight: 1 }}>{value}</div>
        {suffix && <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 6 }}>{suffix}</div>}
      </div>
      {icon && <div style={{ color: adminTokens.mutedLight, flexShrink: 0 }}>
        <A_Icon d={icon} size={22}/>
      </div>}
    </div>
  );
};

// ---- HealthCard (donut ring + micro bars) ----
const HealthCard = () => (
  <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                padding: 14, display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
    <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
      <svg width="68" height="68" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={adminTokens.orangeSoft} strokeWidth="3.5"/>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={adminTokens.orange} strokeWidth="3.5"
                strokeDasharray="35, 100" strokeLinecap="round" transform="rotate(-90 18 18)"/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>35</div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.pulse} size={14}/></span>
        <div style={{ fontSize: 13, fontWeight: 700 }}>สุขภาพธุรกิจ</div>
        <span style={{ color: adminTokens.muted, display: 'flex', marginLeft: 'auto' }}><A_Icon d={aIcons.trend} size={14}/></span>
      </div>
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {[
          { l: 'การรักษา…', v: 75, c: adminTokens.teal },
          { l: 'รายได้',    v: 40, c: adminTokens.warn },
          { l: 'อัตราใช้…', v: 55, c: adminTokens.teal },
          { l: 'แปลงลีด',   v: 25, c: adminTokens.destr },
        ].map((b, i) => (
          <div key={i}>
            <div style={{ height: 3, background: 'hsl(210 20% 92%)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ width: `${b.v}%`, height: '100%', background: b.c }}/>
            </div>
            <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 3,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---- RevenueForecast ----
const RevenueForecast = () => {
  const rows = [
    { label: 'เดือนที่แล้ว', value: '฿120,433', bar: 100, chip: null, barColor: adminTokens.orange },
    { label: 'เดือนนี้', value: '฿9,999', bar: 8, chip: { text: '-92%', tone: 'destr' }, barColor: adminTokens.orange },
    { label: 'เดือนหน้า', sublabel: '(ประมาณการ)', value: '฿9,999', bar: 8, chip: null, barColor: adminTokens.orangeSoft, barFg: adminTokens.orange, dashed: true },
  ];
  return (
    <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                  padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.trend} size={16}/></span>
        <div style={{ fontSize: 14, fontWeight: 700 }}>พยากรณ์รายได้</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ marginTop: i ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: adminTokens.black, fontWeight: 500 }}>{r.label}</span>
              {r.sublabel && <span style={{ fontSize: 11, color: adminTokens.muted }}>{r.sublabel}</span>}
              {r.chip && (
                <span style={{ background: 'hsl(0 100% 95%)', color: adminTokens.destr,
                               padding: '1px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>{r.chip.text}</span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.value}</div>
          </div>
          <div style={{ height: 8, background: 'hsl(32 100% 96%)', borderRadius: 9999, overflow: 'hidden',
                        border: r.dashed ? `1px dashed ${adminTokens.orange}` : 'none' }}>
            <div style={{ width: `${r.bar}%`, height: '100%',
                          background: r.dashed ? 'repeating-linear-gradient(-45deg, hsl(32 100% 80%), hsl(32 100% 80%) 4px, hsl(32 100% 90%) 4px, hsl(32 100% 90%) 8px)' : r.barColor }}/>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- AttentionCard ----
const AttentionCard = () => (
  <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                padding: 14, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ color: adminTokens.warn, display: 'flex' }}><A_Icon d={aIcons.alert} size={16}/></span>
      <div style={{ fontSize: 14, fontWeight: 700 }}>ต้องดำเนินการ</div>
      <span style={{ fontSize: 11, color: adminTokens.muted, background: adminTokens.bg,
                     padding: '1px 8px', borderRadius: 9999, fontWeight: 600 }}>1</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'hsl(0 100% 96%)',
                    color: adminTokens.destr, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.05 }}>
        แพ็ค<br/>เกจ<br/>ใกล้<br/>หมด
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12 }}>แจ้งเตือนทั้งหมด <span style={{ color: adminTokens.muted }}>· ดูทั้งหมด</span></div>
      </div>
    </div>
  </div>
);

// ---- EmptyPanel ----
const EmptyPanel = ({ title, icon, action, subtitle }) => (
  <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                padding: 14, boxShadow: '0 1px 2px rgba(0,0,0,.04)', minHeight: 140,
                display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={icon} size={16}/></span>}
      <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{title}</div>
      {action}
    </div>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: adminTokens.muted, textAlign: 'center', padding: 20 }}>
      {subtitle}
    </div>
  </div>
);

// ---- ClassSchedule ----
const ClassSchedule = () => {
  const rows = [
    { time: '07:00', title: 'Spin · High Intensity', coach: 'Coach Arm', filled: 17, total: 20, tone: adminTokens.teal },
    { time: '08:30', title: 'Mobility + Stretch', coach: 'Coach Mild', filled: 6, total: 12, tone: adminTokens.teal },
    { time: '12:00', title: 'HIIT Express · 30 min', coach: 'Coach Best', filled: 20, total: 20, tone: adminTokens.destr },
    { time: '17:00', title: 'Strength · Lower body', coach: 'Coach P', filled: 12, total: 20, tone: adminTokens.warn },
    { time: '18:30', title: 'Yoga · Vinyasa Flow', coach: 'Coach Nok', filled: 18, total: 20, tone: adminTokens.warn },
  ];
  return (
    <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                  overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${adminTokens.border}`,
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.cal} size={16}/></span>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>ตารางเรียนวันนี้</div>
        <span style={{ fontSize: 11, color: adminTokens.muted }}>{rows.length} sessions</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14,
                              borderBottom: i < rows.length-1 ? `1px solid ${adminTokens.border}` : 'none' }}>
          <div style={{ width: 44, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: adminTokens.muted }}>{r.time}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
            <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{r.coach}</div>
          </div>
          <div style={{ width: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'hsl(210 20% 92%)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ width: `${(r.filled/r.total)*100}%`, height: '100%', background: r.tone }}/>
            </div>
            <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.filled}/{r.total}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- MembersTable ----
const MembersTable = () => {
  const rows = [
    { name: 'Ploy Chanakarn', tier: 'gold', pkg: 'Unlimited', expires: 'May 12', risk: 'low', last: '2h ago' },
    { name: 'Arm Siriwat', tier: 'platinum', pkg: '20 classes', expires: 'Apr 28', risk: 'low', last: 'Yesterday' },
    { name: 'Natty Prach', tier: 'silver', pkg: 'Monthly', expires: 'Apr 21', risk: 'high', last: '3 days ago' },
    { name: 'Eve Kwan', tier: 'gold', pkg: 'Unlimited', expires: 'Jun 03', risk: 'med', last: '5 days ago' },
    { name: 'Mook Thana', tier: 'gold', pkg: '10 classes', expires: 'May 02', risk: 'high', last: '14 days ago' },
    { name: 'Joe L.', tier: 'bronze', pkg: 'Monthly', expires: 'May 18', risk: 'med', last: '9 days ago' },
  ];
  const riskPill = r => {
    const m = { low: [adminTokens.teal, 'hsl(168 70% 95%)', 'Low'],
                med: [adminTokens.warn, 'hsl(38 92% 92%)', 'Med'],
                high: [adminTokens.destr, 'hsl(0 100% 95%)', 'High'] }[r];
    return <span style={{ background: m[1], color: m[0], padding: '1px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>{m[2]}</span>;
  };
  const tierEmoji = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💠', diamond: '💎', black: '🖤' };
  return (
    <div style={{ background: '#fff', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                  overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${adminTokens.border}`,
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.users} size={16}/></span>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>สมาชิก · 247 คน</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: adminTokens.bg, color: adminTokens.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Member</th>
            <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Tier</th>
            <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Package</th>
            <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Expires</th>
            <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Risk</th>
            <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Last visit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${adminTokens.border}`, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = adminTokens.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>{r.name}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>{tierEmoji[r.tier]}</span><span style={{ textTransform: 'capitalize' }}>{r.tier}</span>
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>{r.pkg}</td>
              <td style={{ padding: '12px 16px', fontVariantNumeric: 'tabular-nums' }}>{r.expires}</td>
              <td style={{ padding: '12px 16px' }}>{riskPill(r.risk)}</td>
              <td style={{ padding: '12px 16px', color: adminTokens.muted }}>{r.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Object.assign(window, { adminTokens, A_Icon, aIcons, MoomMark, Sidebar, TopHeader,
                         PageHeader, HeaderBtn, SectionTitle, KpiCard, HealthCard,
                         RevenueForecast, AttentionCard, EmptyPanel,
                         ClassSchedule, MembersTable });
