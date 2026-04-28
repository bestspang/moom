/* MOOM Admin — หมวดหมู่คลาส (Class Categories)
   Taxonomy management for class types. Simpler than Classes page — but fully functional.

   UX design philosophy for this page: KEEP IT VISUAL.
   Categories have visual identity (color + icon) — this page is about managing that identity,
   not about data ops. So we lean into big colored cards, inline editing, and drag-reorder.

   Features:
   - Big category cards, drag-to-reorder
   - Click card → inline modal editor (name, color, icon, description, visibility)
   - Visibility toggle (hide from member app without deleting)
   - Merge suggestion when a category has < 2 classes
   - "วิเคราะห์" — per-category revenue share bar
   - 12 preset color swatches + 20 curated icons (no raw hex input needed)
   - Preview strip — how it will look in the member app
   - Empty state for new gyms
*/

const { useState: useStateCT, useMemo: useMemoCT, useEffect: useEffectCT, useRef: useRefCT } = React;

/* =============================================================
 *  SEED DATA
 * =========================================================== */
const CT_COLOR_PRESETS = [
  { hex: 'hsl(25 95% 55%)',  name: 'ส้ม' },
  { hex: 'hsl(0 72% 55%)',   name: 'แดง' },
  { hex: 'hsl(340 70% 60%)', name: 'ชมพู' },
  { hex: 'hsl(270 60% 60%)', name: 'ม่วง' },
  { hex: 'hsl(212 80% 55%)', name: 'น้ำเงิน' },
  { hex: 'hsl(200 70% 55%)', name: 'ฟ้า' },
  { hex: 'hsl(180 55% 45%)', name: 'เทอควอยซ์' },
  { hex: 'hsl(168 75% 42%)', name: 'เขียวมิ้นต์' },
  { hex: 'hsl(150 50% 45%)', name: 'เขียว' },
  { hex: 'hsl(80 55% 45%)',  name: 'เขียวอ่อน' },
  { hex: 'hsl(38 92% 50%)',  name: 'เหลือง' },
  { hex: 'hsl(220 14% 50%)', name: 'เทา' },
];

const CT_ICON_PRESETS = [
  { id: 'bike',   label: 'จักรยาน',      path: <><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></> },
  { id: 'fire',   label: 'ไฟ',           path: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/> },
  { id: 'yoga',   label: 'โยคะ',         path: <><circle cx="12" cy="4" r="2"/><path d="M12 6v6M8 12h8M6 20l6-8 6 8"/></> },
  { id: 'dumb',   label: 'ดัมเบล',       path: <><path d="M6 12h12M4 8v8M8 6v12M16 6v12M20 8v8"/></> },
  { id: 'heart',  label: 'หัวใจ',        path: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/> },
  { id: 'box',    label: 'นวม',          path: <><path d="M18 3a3 3 0 013 3v4a3 3 0 01-1 2.2V17a4 4 0 01-4 4H8a4 4 0 01-4-4v-4.8A3 3 0 013 10V6a3 3 0 013-3h12z"/><path d="M8 12h8"/></> },
  { id: 'wave',   label: 'คลื่น',         path: <path d="M3 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3M3 18c3 0 3-3 6-3s3 3 6 3 3-3 6-3"/> },
  { id: 'leaf',   label: 'ใบไม้',        path: <><path d="M6 21c0-9 7-15 15-15 0 9-6 15-15 15z"/><path d="M6 21c0-7 4-11 10-13"/></> },
  { id: 'zap',    label: 'สายฟ้า',       path: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/> },
  { id: 'run',    label: 'วิ่ง',          path: <><circle cx="14" cy="4" r="2"/><path d="M4 22l5-7 4-3-2-5 5 3 3-3M10 14l2 4-4 5"/></> },
  { id: 'music',  label: 'เพลง',         path: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></> },
  { id: 'sun',    label: 'ตะวัน',        path: <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></> },
  { id: 'moon',   label: 'จันทร์',       path: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/> },
  { id: 'target', label: 'เป้า',         path: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></> },
  { id: 'stretch',label: 'ยืดเหยียด',    path: <><path d="M4 17h3l2-4h4M15 7l3-4 3 4-3 4-3-4zM9 13l-3 4 3 4"/></> },
  { id: 'swim',   label: 'ว่ายน้ำ',       path: <><path d="M2 20s2-2 5-2 3 2 5 2 3-2 5-2 3 2 5 2M2 16s2-2 5-2 3 2 5 2 3-2 5-2 3 2 5 2"/><circle cx="18" cy="6" r="2"/><path d="M5 12l3-3 6 5-2 2"/></> },
  { id: 'core',   label: 'แกน',          path: <><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M8 9h8M8 15h8"/></> },
  { id: 'medal',  label: 'เหรียญ',       path: <><circle cx="12" cy="15" r="6"/><path d="M12 3l3 6h-6l3-6zM9 15l1-3h4l1 3"/></> },
  { id: 'clock2', label: 'นาฬิกา',       path: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
  { id: 'sparkle',label: 'ประกาย',       path: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/> },
];

/* Seed categories — each with stats (totalClasses, totalBookings30, totalRevenue30, trend 8-pt) */
const CT_CATEGORIES = [
  { id: 'spin',     name: 'Spin',      desc: 'คลาสจักรยานในร่ม ให้ความรู้สึกเหมือนปั่นกลางแจ้ง',       color: 'hsl(200 70% 55%)', icon: 'bike',    classes: 2,  bookings30: 592, revenue30: 118400, trend: [45,55,68,72,78,84,88,92], visible: true,  order: 0 },
  { id: 'hiit',     name: 'HIIT',      desc: 'คาร์ดิโอความเข้มข้นสูง ช่วยเบิร์นแคลอรี่ได้เร็ว',         color: 'hsl(25 95% 55%)',  icon: 'fire',    classes: 3,  bookings30: 968, revenue30: 193600, trend: [78,82,88,95,98,102,108,112], visible: true,  order: 1 },
  { id: 'yoga',     name: 'Yoga',      desc: 'โยคะหลากรูปแบบ ตั้งแต่ผ่อนคลายจนถึงกระฉับกระเฉง',     color: 'hsl(270 60% 60%)', icon: 'yoga',    classes: 3,  bookings30: 608, revenue30: 121600, trend: [52,56,62,68,72,76,80,82], visible: true,  order: 2 },
  { id: 'strength', name: 'Strength',  desc: 'ยกน้ำหนักและสร้างกล้ามเนื้อ',                            color: 'hsl(150 50% 45%)', icon: 'dumb',    classes: 3,  bookings30: 544, revenue30: 108800, trend: [48,52,58,62,66,68,72,74], visible: true,  order: 3 },
  { id: 'mobility', name: 'Mobility',  desc: 'ยืดเหยียดและเพิ่มความยืดหยุ่นให้ร่างกาย',                  color: 'hsl(340 70% 60%)', icon: 'stretch', classes: 2,  bookings30: 164, revenue30: 27400,  trend: [18,20,22,22,24,24,26,26], visible: true,  order: 4 },
  { id: 'boxing',   name: 'Boxing',    desc: 'มวยและคาร์ดิโอกระจายพลัง',                              color: 'hsl(0 72% 55%)',   icon: 'box',     classes: 2,  bookings30: 156, revenue30: 31200,  trend: [14,16,18,19,20,21,22,22], visible: true,  order: 5 },
  { id: 'pilates',  name: 'Pilates',   desc: 'พิลาทิสบนเสื่อและอุปกรณ์ เน้นแกนกลางลำตัว',             color: 'hsl(180 55% 45%)', icon: 'core',    classes: 2,  bookings30: 220, revenue30: 44000,  trend: [22,24,26,28,28,30,30,30], visible: true,  order: 6 },
  { id: 'dance',    name: 'Dance',     desc: 'เต้นให้สนุก เบิร์นแคลอรี่แบบไม่รู้ตัว',                    color: 'hsl(330 80% 58%)', icon: 'music',   classes: 1,  bookings30: 38,  revenue30: 7600,   trend: [4,5,5,6,6,7,7,8],     visible: false, order: 7 },
];

/* =============================================================
 *  HELPERS
 * =========================================================== */
const ctFmtMoney = (n) => {
  if (n >= 1000000) return '฿' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return '฿' + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return '฿' + n;
};

const CT_Icon = ({ d, size = 14, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);

const ctIcons = {
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff:  <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
  merge:   <><path d="M6 3v12a4 4 0 004 4h8M14 9l4-4-4-4"/></>,
  drag:    <><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  check:   <polyline points="20 6 9 17 4 12"/>,
  chev:    <polyline points="6 9 12 15 18 9"/>,
  list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  fire:    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>,
  info:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  arrow:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  copy:    <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  sparkle: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  warn:    <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  rows:    <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
};

const getIconPath = (id) => CT_ICON_PRESETS.find(i => i.id === id)?.path || CT_ICON_PRESETS[0].path;

/* tiny sparkline */
const CtSpark = ({ data, color, w = 80, h = 22 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 3) - 1.5;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polygon points={area} fill={color} opacity=".18"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/* =============================================================
 *  HEADER + KPI STRIP
 * =========================================================== */
const CtHeader = ({ total, visibleCnt, onNew }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>
        หมวดหมู่คลาส
      </h1>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
        จัดกลุ่มประเภทคลาสเพื่อให้ลูกค้าค้นหาง่ายในแอป · {total} หมวด · แสดง {visibleCnt}
      </p>
    </div>
    <button onClick={onNew} style={{
      height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
      background: adminTokens.orange, color: '#fff', border: 0,
      fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
    }}>
      <CT_Icon d={ctIcons.plus} size={14}/> เพิ่มหมวดหมู่
    </button>
  </div>
);

/* Cross-category bar chart: revenue share */
const CtShareBar = ({ categories }) => {
  const visible = categories.filter(c => c.visible);
  const totalRev = visible.reduce((s, c) => s + c.revenue30, 0) || 1;
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, background: adminTokens.orangeSoft,
          color: adminTokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CT_Icon d={ctIcons.fire} size={13} stroke={2.2}/>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.01em' }}>
            สัดส่วนรายได้ตามหมวด · 30 วัน
          </div>
          <div style={{ fontSize: 11, color: adminTokens.muted }}>
            รวม {ctFmtMoney(totalRev)} — เห็นภาพใหญ่ว่าหมวดไหนทำเงินที่สุด
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{
        height: 14, borderRadius: 9999, overflow: 'hidden', display: 'flex',
        background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
      }}>
        {visible.sort((a,b) => b.revenue30 - a.revenue30).map(c => (
          <div key={c.id}
               title={`${c.name} · ${Math.round(c.revenue30/totalRev*100)}% · ${ctFmtMoney(c.revenue30)}`}
               style={{
                 width: `${(c.revenue30 / totalRev) * 100}%`,
                 background: c.color, transition: 'all .3s',
               }}/>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
        {visible.sort((a,b) => b.revenue30 - a.revenue30).map(c => {
          const pct = Math.round(c.revenue30 / totalRev * 100);
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: adminTokens.black, fontWeight: 600,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }}/>
              {c.name}
              <span style={{ color: adminTokens.muted, fontVariantNumeric: 'tabular-nums' }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =============================================================
 *  CATEGORY CARD
 * =========================================================== */
const CategoryCard = ({ cat, onEdit, onToggleVisible, onDelete, onDuplicate, onDragStart, onDragOver, onDrop, dragging }) => {
  const [hover, setHover] = useStateCT(false);
  const [menuOpen, setMenuOpen] = useStateCT(false);
  const menuRef = useRefCT();
  useEffectCT(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const sparse = cat.classes < 2;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(); }}
      onDrop={onDrop}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: cat.visible ? adminTokens.surface : adminTokens.subtle,
        border: `1px solid ${hover ? cat.color : adminTokens.border}`,
        boxShadow: hover && !dragging ? adminTokens.shadowMd : adminTokens.shadowSm,
        borderRadius: adminTokens.r3, padding: 16, position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: dragging ? 0.4 : (cat.visible ? 1 : 0.78),
        transition: 'all .15s', cursor: 'grab',
      }}
    >
      {/* Color strip top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: cat.color, borderRadius: '14px 14px 0 0',
      }}/>

      {/* Top row: drag handle + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: `linear-gradient(135deg, ${cat.color}, ${cat.color})`,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: `0 4px 12px ${cat.color}40`,
        }}>
          <CT_Icon d={getIconPath(cat.icon)} size={28} stroke={2}/>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              fontSize: 17, fontWeight: 800, color: adminTokens.black,
              letterSpacing: '-.01em', lineHeight: 1.15,
            }}>{cat.name}</div>
            {!cat.visible && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: adminTokens.muted,
                background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
                padding: '2px 6px', borderRadius: 4, letterSpacing: '.04em',
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <CT_Icon d={ctIcons.eyeOff} size={9}/> ซ่อน
              </span>
            )}
          </div>
          <div style={{
            fontSize: 11, color: adminTokens.muted, marginTop: 3, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            minHeight: 28,
          }}>{cat.desc || <span style={{ color: adminTokens.mutedLight, fontStyle: 'italic' }}>ไม่มีคำอธิบาย</span>}</div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }} ref={menuRef}>
          <button
            title="ลาก เพื่อเรียงลำดับ"
            style={{
              width: 26, height: 26, borderRadius: 6, border: 0,
              background: hover ? adminTokens.subtle : 'transparent',
              color: adminTokens.muted, cursor: 'grab',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: hover ? 1 : 0, transition: 'opacity .1s',
            }}>
            <CT_Icon d={ctIcons.drag} size={13}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }} style={{
            width: 26, height: 26, borderRadius: 6, border: 0,
            background: 'transparent', color: adminTokens.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = adminTokens.subtle}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <CT_Icon d={ctIcons.dots} size={14}/>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 40,
              background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
              borderRadius: 10, boxShadow: adminTokens.shadowMd, padding: 4, minWidth: 180,
            }}>
              <CtMenuItem icon={ctIcons.edit} onClick={() => { onEdit(); setMenuOpen(false); }}>แก้ไข</CtMenuItem>
              <CtMenuItem icon={ctIcons.copy} onClick={() => { onDuplicate(); setMenuOpen(false); }}>ทำสำเนา</CtMenuItem>
              <CtMenuItem
                icon={cat.visible ? ctIcons.eyeOff : ctIcons.eye}
                onClick={() => { onToggleVisible(); setMenuOpen(false); }}
              >{cat.visible ? 'ซ่อนจากแอป' : 'แสดงในแอป'}</CtMenuItem>
              <div style={{ height: 1, background: adminTokens.divider, margin: '4px 0' }}/>
              <CtMenuItem icon={ctIcons.trash} danger onClick={() => { onDelete(); setMenuOpen(false); }}>ลบหมวดหมู่</CtMenuItem>
            </div>
          )}
        </div>
      </div>

      {/* Stats band */}
      <div style={{
        background: adminTokens.subtle, borderRadius: 10, padding: '10px 12px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
      }}>
        <CtStat label="คลาส" value={cat.classes} fg={adminTokens.black}/>
        <CtStat label="จอง 30 วัน" value={cat.bookings30} fg={cat.color}/>
        <CtStat label="รายได้" value={ctFmtMoney(cat.revenue30)} fg={adminTokens.black}/>
      </div>

      {/* Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 10, color: adminTokens.muted, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}>แนวโน้ม 8 สัปดาห์</span>
        <div style={{ flex: 1 }}/>
        <CtSpark data={cat.trend} color={cat.color} w={110} h={22}/>
      </div>

      {/* Sparse warning */}
      {sparse && cat.classes > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', background: adminTokens.warnSoft,
          border: `1px solid ${adminTokens.warn}30`, borderRadius: 8,
        }}>
          <span style={{ color: adminTokens.warn, display: 'flex' }}>
            <CT_Icon d={ctIcons.warn} size={13} stroke={2.2}/>
          </span>
          <div style={{ fontSize: 11, color: adminTokens.black, fontWeight: 600, flex: 1 }}>
            มีแค่ {cat.classes} คลาส — พิจารณารวมกับหมวดอื่น
          </div>
        </div>
      )}

      {cat.classes === 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', background: adminTokens.subtle,
          border: `1px dashed ${adminTokens.border}`, borderRadius: 8,
        }}>
          <span style={{ color: adminTokens.muted, display: 'flex' }}>
            <CT_Icon d={ctIcons.info} size={13}/>
          </span>
          <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, flex: 1 }}>
            ยังไม่มีคลาสในหมวดนี้
          </div>
        </div>
      )}

      {/* Footer: visibility toggle + edit */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        paddingTop: 10, borderTop: `1px dashed ${adminTokens.divider}`,
      }}>
        <VisToggle visible={cat.visible} color={cat.color} onToggle={onToggleVisible}/>
        <div style={{ flex: 1 }}/>
        <button onClick={onEdit} style={{
          height: 30, padding: '0 12px', borderRadius: 7, cursor: 'pointer',
          border: `1px solid ${hover ? cat.color : adminTokens.border}`,
          background: hover ? cat.color : adminTokens.surface,
          color: hover ? '#fff' : adminTokens.black,
          fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all .12s',
        }}>
          <CT_Icon d={ctIcons.edit} size={11}/> แก้ไข
        </button>
      </div>
    </div>
  );
};

const CtStat = ({ label, value, fg }) => (
  <div style={{ padding: '0 8px', textAlign: 'center', borderRight: `1px solid ${adminTokens.border}` }}
       className="ct-stat">
    <div style={{
      fontSize: 15, fontWeight: 800, color: fg,
      fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1.1,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{value}</div>
    <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>{label}</div>
  </div>
);

const CtMenuItem = ({ icon, children, danger, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', padding: '8px 10px', border: 0, borderRadius: 6, cursor: 'pointer',
    background: 'transparent', color: danger ? adminTokens.destr : adminTokens.black,
    fontFamily: 'inherit', fontSize: 12, fontWeight: 600, textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 8,
  }}
  onMouseEnter={e => e.currentTarget.style.background = danger ? adminTokens.destrSoft : adminTokens.subtle}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    <CT_Icon d={icon} size={13}/>{children}
  </button>
);

const VisToggle = ({ visible, color, onToggle }) => (
  <button onClick={onToggle} style={{
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
    fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
    color: visible ? adminTokens.black : adminTokens.muted,
  }}>
    <div style={{
      width: 28, height: 16, borderRadius: 9999, padding: 2,
      background: visible ? color : adminTokens.borderStrong,
      display: 'flex', alignItems: 'center',
      justifyContent: visible ? 'flex-end' : 'flex-start',
      transition: 'all .15s',
    }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,.2)' }}/>
    </div>
    {visible ? 'แสดงในแอป' : 'ซ่อน'}
  </button>
);

/* =============================================================
 *  EDITOR MODAL
 * =========================================================== */
const EditorModal = ({ cat, existingNames, onSave, onClose }) => {
  const isNew = !cat.id;
  const [name, setName] = useStateCT(cat.name || '');
  const [desc, setDesc] = useStateCT(cat.desc || '');
  const [color, setColor] = useStateCT(cat.color || CT_COLOR_PRESETS[0].hex);
  const [icon, setIcon] = useStateCT(cat.icon || CT_ICON_PRESETS[0].id);
  const [visible, setVisible] = useStateCT(cat.visible !== false);
  const [iconQ, setIconQ] = useStateCT('');
  const nameRef = useRefCT();

  useEffectCT(() => { nameRef.current?.focus(); }, []);

  const trimmed = name.trim();
  const nameError = !trimmed ? 'กรอกชื่อหมวดหมู่'
    : existingNames.filter(n => n !== cat.name).map(n => n.toLowerCase()).includes(trimmed.toLowerCase())
      ? 'ชื่อนี้มีอยู่แล้ว' : null;

  const iconList = iconQ
    ? CT_ICON_PRESETS.filter(i => i.label.includes(iconQ) || i.id.includes(iconQ.toLowerCase()))
    : CT_ICON_PRESETS;

  const canSave = !nameError;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 100,
        animation: 'ct-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 560, maxHeight: '88vh', zIndex: 101,
        background: adminTokens.surface, borderRadius: adminTokens.r4,
        boxShadow: '0 24px 60px rgba(15,23,42,.24)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'ct-pop .22s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          background: `linear-gradient(135deg, ${color}, ${color.replace(/(\d+%)\)$/, '45%)')})`,
          color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            <CT_Icon d={getIconPath(icon)} size={26}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                          textTransform: 'uppercase' }}>
              {isNew ? 'สร้างหมวดหมู่ใหม่' : 'แก้ไขหมวดหมู่'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2 }}>
              {trimmed || 'หมวดหมู่ใหม่'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0,
            background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CT_Icon d={ctIcons.x} size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div>
            <CtLabel>ชื่อหมวดหมู่ <span style={{ color: adminTokens.destr }}>*</span></CtLabel>
            <input
              ref={nameRef} value={name} onChange={e => setName(e.target.value)}
              placeholder="เช่น Spin, HIIT, Yoga"
              maxLength={40}
              style={{
                width: '100%', height: 40, padding: '0 12px', borderRadius: 9,
                border: `1.5px solid ${nameError && trimmed ? adminTokens.destr : adminTokens.border}`,
                background: adminTokens.surface, outline: 'none',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: adminTokens.black,
              }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = nameError && trimmed ? adminTokens.destr : adminTokens.border}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontSize: 11, color: nameError && trimmed ? adminTokens.destr : adminTokens.muted }}>
                {nameError && trimmed ? nameError : 'ชื่อจะปรากฏในแอปลูกค้าและรายงาน'}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, fontVariantNumeric: 'tabular-nums' }}>
                {name.length}/40
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <CtLabel>คำอธิบายสั้นๆ <span style={{ fontWeight: 500, color: adminTokens.muted }}>(ทางเลือก)</span></CtLabel>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="เช่น คลาสจักรยานในร่ม ให้ความรู้สึกเหมือนปั่นกลางแจ้ง"
              maxLength={120} rows={2}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 9,
                border: `1.5px solid ${adminTokens.border}`,
                background: adminTokens.surface, outline: 'none', resize: 'none',
                fontFamily: 'inherit', fontSize: 13, color: adminTokens.black, lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = adminTokens.border}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, fontVariantNumeric: 'tabular-nums' }}>
                {desc.length}/120
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <CtLabel>สีประจำหมวด</CtLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
              {CT_COLOR_PRESETS.map(c => (
                <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name} style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer', position: 'relative',
                  background: c.hex, border: color === c.hex
                    ? `3px solid ${adminTokens.surface}`
                    : `1.5px solid ${adminTokens.border}`,
                  boxShadow: color === c.hex
                    ? `0 0 0 2px ${c.hex}, 0 2px 6px ${c.hex}60`
                    : 'none',
                  padding: 0, transition: 'all .12s',
                }}>
                  {color === c.hex && (
                    <span style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}>
                      <CT_Icon d={ctIcons.check} size={13} stroke={3}/>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <CtLabel nom>ไอคอน</CtLabel>
              <div style={{
                height: 28, padding: '0 10px', borderRadius: 7,
                background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
                display: 'flex', alignItems: 'center', gap: 6, minWidth: 140,
              }}>
                <CT_Icon d={ctIcons.search} size={11}/>
                <input value={iconQ} onChange={e => setIconQ(e.target.value)}
                       placeholder="ค้นหาไอคอน"
                       style={{
                         flex: 1, border: 0, background: 'transparent', outline: 'none',
                         fontFamily: 'inherit', fontSize: 11, color: adminTokens.black,
                       }}/>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6,
              maxHeight: 180, overflowY: 'auto', padding: 2,
            }}>
              {iconList.map(i => (
                <button key={i.id} onClick={() => setIcon(i.id)} title={i.label} style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer', padding: 0,
                  background: icon === i.id ? color : adminTokens.surface,
                  color: icon === i.id ? '#fff' : adminTokens.muted,
                  border: `1.5px solid ${icon === i.id ? color : adminTokens.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .1s',
                }}
                onMouseEnter={e => { if (icon !== i.id) { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; } }}
                onMouseLeave={e => { if (icon !== i.id) { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.color = adminTokens.muted; } }}>
                  <CT_Icon d={i.path} size={16}/>
                </button>
              ))}
              {iconList.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20,
                              fontSize: 12, color: adminTokens.muted }}>
                  ไม่พบไอคอน
                </div>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div style={{
            padding: '12px 14px', borderRadius: 10, background: adminTokens.subtle,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: visible ? color + '30' : adminTokens.border,
              color: visible ? color : adminTokens.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CT_Icon d={visible ? ctIcons.eye : ctIcons.eyeOff} size={15}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
                {visible ? 'แสดงในแอปลูกค้า' : 'ซ่อนจากแอปลูกค้า'}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>
                {visible
                  ? 'ลูกค้าเห็นหมวดนี้เมื่อเลือกคลาส'
                  : 'หมวดนี้ยังคงมีอยู่แต่ลูกค้าจะไม่เห็น'}
              </div>
            </div>
            <VisToggle visible={visible} color={color} onToggle={() => setVisible(v => !v)}/>
          </div>

          {/* Preview strip */}
          <div>
            <CtLabel>ตัวอย่างในแอปลูกค้า</CtLabel>
            <div style={{
              background: adminTokens.black, borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 10, overflowX: 'auto',
            }}>
              <PreviewChip color={color} icon={icon} name={trimmed || 'หมวดหมู่ใหม่'} active/>
              <PreviewChip color="#444" icon="dumb" name="อื่นๆ"/>
              <PreviewChip color="#444" icon="heart" name="อื่นๆ"/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          background: adminTokens.surface, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {!isNew && (
            <div style={{ fontSize: 11, color: adminTokens.muted }}>
              ID: <span style={{ fontFamily: 'monospace', color: adminTokens.ink2 }}>CAT-{String(cat.order ?? 0).padStart(3,'0')}</span>
            </div>
          )}
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={{
            height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}>ยกเลิก</button>
          <button
            onClick={() => canSave && onSave({ ...cat, name: trimmed, desc, color, icon, visible })}
            disabled={!canSave}
            style={{
              height: 36, padding: '0 18px', borderRadius: 9, cursor: canSave ? 'pointer' : 'not-allowed',
              border: 0, background: canSave ? color : adminTokens.border,
              color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              boxShadow: canSave ? `0 4px 12px ${color}60` : 'none',
              display: 'flex', alignItems: 'center', gap: 6, opacity: canSave ? 1 : 0.6,
            }}>
            <CT_Icon d={ctIcons.check} size={12} stroke={3}/>
            {isNew ? 'สร้างหมวดหมู่' : 'บันทึก'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ct-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ct-pop  { from { opacity: 0; transform: translate(-50%,-48%) scale(.96); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      `}</style>
    </>
  );
};

const CtLabel = ({ children, nom }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: adminTokens.muted,
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: nom ? 0 : 8,
  }}>{children}</div>
);

const PreviewChip = ({ color, icon, name, active }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0,
  }}>
    <div style={{
      width: 54, height: 54, borderRadius: 14,
      background: active ? color : '#222',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? `0 4px 12px ${color}70` : 'none',
      border: active ? `2px solid #fff` : '2px solid transparent',
    }}>
      <CT_Icon d={getIconPath(icon)} size={24} stroke={active ? 2.2 : 2}/>
    </div>
    <div style={{
      fontSize: 10, color: active ? '#fff' : '#888',
      fontWeight: active ? 800 : 600, maxWidth: 60,
      textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{name}</div>
  </div>
);

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const CategoriesPage = () => {
  const [cats, setCats] = useStateCT(CT_CATEGORIES);
  const [editing, setEditing] = useStateCT(null); // cat object or { isNew: true }
  const [query, setQuery] = useStateCT('');
  const [showHidden, setShowHidden] = useStateCT(true);
  const [dragId, setDragId] = useStateCT(null);
  const [overId, setOverId] = useStateCT(null);

  const filtered = useMemoCT(() => {
    let list = [...cats].sort((a,b) => a.order - b.order);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || (c.desc || '').toLowerCase().includes(q));
    }
    if (!showHidden) list = list.filter(c => c.visible);
    return list;
  }, [cats, query, showHidden]);

  const total = cats.length;
  const visibleCnt = cats.filter(c => c.visible).length;

  const save = (cat) => {
    if (cat.id) {
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, ...cat } : c));
    } else {
      const id = (cat.name || 'cat').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      setCats(prev => [...prev, {
        ...cat, id, classes: 0, bookings30: 0, revenue30: 0, trend: [0,0,0,0,0,0,0,0],
        order: prev.length,
      }]);
    }
    setEditing(null);
  };

  const toggleVis = (id) => {
    setCats(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };
  const remove = (id) => {
    if (confirm('ลบหมวดหมู่นี้? คลาสที่อยู่ในหมวดจะไม่ถูกลบ แต่จะไม่มีหมวดหมู่')) {
      setCats(prev => prev.filter(c => c.id !== id));
    }
  };
  const duplicate = (cat) => {
    const newCat = { ...cat, id: cat.id + '-copy-' + Date.now(), name: cat.name + ' (สำเนา)',
                     classes: 0, bookings30: 0, revenue30: 0, trend: [0,0,0,0,0,0,0,0],
                     order: cats.length };
    setCats(prev => [...prev, newCat]);
  };

  /* drag-reorder */
  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    setCats(prev => {
      const sorted = [...prev].sort((a,b) => a.order - b.order);
      const fromIdx = sorted.findIndex(c => c.id === dragId);
      const toIdx = sorted.findIndex(c => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = sorted.splice(fromIdx, 1);
      sorted.splice(toIdx, 0, moved);
      return sorted.map((c, i) => ({ ...c, order: i }));
    });
    setDragId(null); setOverId(null);
  };

  return (
    <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14,
                  maxWidth: 1400, margin: '0 auto' }}>
      <CtHeader total={total} visibleCnt={visibleCnt} onNew={() => setEditing({ isNew: true })}/>

      <CtShareBar categories={cats}/>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 10,
      }}>
        <div style={{
          flex: 1, minWidth: 240, height: 34,
          background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
          borderRadius: 9, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <CT_Icon d={ctIcons.search} size={13}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="ค้นหาหมวดหมู่"
                 style={{
                   flex: 1, height: 32, border: 0, background: 'transparent', outline: 'none',
                   fontFamily: 'inherit', fontSize: 13, color: adminTokens.black,
                 }}/>
          {query && (
            <button onClick={() => setQuery('')} style={{
              width: 18, height: 18, border: 0, borderRadius: 4, cursor: 'pointer',
              background: adminTokens.border, color: adminTokens.muted, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CT_Icon d={ctIcons.x} size={10}/>
            </button>
          )}
        </div>

        <button onClick={() => setShowHidden(s => !s)} style={{
          height: 34, padding: '0 11px', borderRadius: 9, cursor: 'pointer',
          border: `1px solid ${showHidden ? adminTokens.border : adminTokens.orange}`,
          background: showHidden ? adminTokens.surface : adminTokens.orangeSoft,
          color: showHidden ? adminTokens.black : adminTokens.orange,
          fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <CT_Icon d={showHidden ? ctIcons.eye : ctIcons.eyeOff} size={12}/>
          {showHidden ? 'แสดงทั้งหมด' : 'เฉพาะที่เปิด'}
        </button>

        <div style={{
          fontSize: 11, color: adminTokens.muted, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <CT_Icon d={ctIcons.info} size={11}/>
          ลากการ์ดเพื่อเรียงลำดับ
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14,
      }}>
        {filtered.map(cat => (
          <CategoryCard
            key={cat.id} cat={cat}
            onEdit={() => setEditing(cat)}
            onToggleVisible={() => toggleVis(cat.id)}
            onDelete={() => remove(cat.id)}
            onDuplicate={() => duplicate(cat)}
            onDragStart={() => setDragId(cat.id)}
            onDragOver={() => setOverId(cat.id)}
            onDrop={() => handleDrop(cat.id)}
            dragging={dragId === cat.id}
          />
        ))}

        {/* Add-new ghost card */}
        {!query && (
          <button onClick={() => setEditing({ isNew: true })} style={{
            background: 'transparent', border: `2px dashed ${adminTokens.border}`,
            borderRadius: adminTokens.r3, padding: 16, minHeight: 260, cursor: 'pointer',
            fontFamily: 'inherit', color: adminTokens.muted,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = adminTokens.orange; e.currentTarget.style.color = adminTokens.orange; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.color = adminTokens.muted; }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: adminTokens.subtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CT_Icon d={ctIcons.plus} size={20} stroke={2.2}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>เพิ่มหมวดหมู่ใหม่</div>
            <div style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.4, maxWidth: 200 }}>
              จัดกลุ่มคลาสของคุณเพื่อให้ลูกค้าค้นหาง่ายขึ้น
            </div>
          </button>
        )}

        {filtered.length === 0 && query && (
          <div style={{
            gridColumn: '1 / -1', padding: 60, textAlign: 'center',
            background: adminTokens.surface, border: `1px dashed ${adminTokens.border}`,
            borderRadius: adminTokens.r3,
          }}>
            <div style={{ fontSize: 14, color: adminTokens.muted, fontWeight: 600 }}>
              ไม่พบ "{query}"
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditorModal
          cat={editing.isNew ? {} : editing}
          existingNames={cats.map(c => c.name)}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

Object.assign(window, {
  CT_COLOR_PRESETS, CT_ICON_PRESETS, CT_CATEGORIES, ctFmtMoney,
  CT_Icon, ctIcons, getIconPath, CtSpark,
  CtHeader, CtShareBar, CategoryCard, CtStat, CtMenuItem, VisToggle,
  EditorModal, CtLabel, PreviewChip, CategoriesPage,
});
