/* MOOM Admin — Schedule page v2
   Full calendar experience: week grid + day focus + list view,
   with filters, capacity heatmap, live-now line, click-to-drawer.
*/

const { useState: useStateS, useMemo: useMemoS, useEffect: useEffectS, useRef: useRefS } = React;

/* ---------- Dummy data generators ---------- */
const COACHES = [
  { id: 'arm',  name: 'Arm',  color: 'hsl(200 60% 55%)' },
  { id: 'mild', name: 'Mild', color: 'hsl(340 70% 60%)' },
  { id: 'best', name: 'Best', color: 'hsl(25 95% 55%)'  },
  { id: 'p',    name: 'P',    color: 'hsl(150 50% 50%)' },
  { id: 'nok',  name: 'Nok',  color: 'hsl(270 60% 60%)' },
  { id: 'jo',   name: 'Jo',   color: 'hsl(180 55% 45%)' },
];
const ROOMS = [
  { id: 'A', label: 'ห้อง A' },
  { id: 'B', label: 'ห้อง B' },
  { id: 'C', label: 'ห้อง C' },
];
const CLASS_TYPES = {
  'Spin':      { color: 'hsl(200 70% 55%)', soft: 'hsl(200 70% 55% / 0.12)' },
  'HIIT':      { color: 'hsl(25 95% 55%)',  soft: 'hsl(25 95% 55% / 0.14)' },
  'Yoga':      { color: 'hsl(270 60% 60%)', soft: 'hsl(270 60% 60% / 0.12)' },
  'Strength':  { color: 'hsl(150 50% 45%)', soft: 'hsl(150 50% 45% / 0.12)' },
  'Mobility':  { color: 'hsl(340 70% 60%)', soft: 'hsl(340 70% 60% / 0.12)' },
  'Boxing':    { color: 'hsl(0 72% 55%)',   soft: 'hsl(0 72% 55% / 0.12)' },
  'Pilates':   { color: 'hsl(180 55% 45%)', soft: 'hsl(180 55% 45% / 0.12)' },
};

/* Week starting Mon 2026-04-13 — "today" is Wed Apr 15 in this mock */
const WEEK_DAYS = [
  { idx: 0, dow: 'จ', full: 'จันทร์',  date: 13 },
  { idx: 1, dow: 'อ', full: 'อังคาร',  date: 14 },
  { idx: 2, dow: 'พ', full: 'พุธ',     date: 15, isToday: true },
  { idx: 3, dow: 'พฤ',full: 'พฤหัส',   date: 16 },
  { idx: 4, dow: 'ศ', full: 'ศุกร์',    date: 17 },
  { idx: 5, dow: 'ส', full: 'เสาร์',    date: 18 },
  { idx: 6, dow: 'อา',full: 'อาทิตย์', date: 19 },
];

/* Hour range for the grid */
const HOUR_START = 6;  // 06:00
const HOUR_END   = 21; // 21:00 (ends)
const HOUR_PX    = 56; // each hour row is 56px tall
const DAY_COL_PX = 148;
const TIME_COL_PX = 64;

/* Synthetic class list — mix of types, coaches, and rooms across week */
const SEED_CLASSES = [
  // Monday
  { day: 0, start: 7.00, end: 8.00, type: 'Spin',     title: 'Spin · High Intensity', coach: 'arm',  room: 'A', filled: 18, total: 20 },
  { day: 0, start: 9.00, end: 10.0, type: 'Yoga',     title: 'Morning Flow',          coach: 'nok',  room: 'B', filled: 9,  total: 15 },
  { day: 0, start: 12.0, end: 12.5, type: 'HIIT',     title: 'HIIT Express',          coach: 'best', room: 'A', filled: 12, total: 20 },
  { day: 0, start: 17.0, end: 18.0, type: 'Strength', title: 'Lower Body',            coach: 'p',    room: 'C', filled: 14, total: 16 },
  { day: 0, start: 18.5, end: 19.5, type: 'Yoga',     title: 'Vinyasa Flow',          coach: 'nok',  room: 'B', filled: 20, total: 20 },
  // Tuesday
  { day: 1, start: 6.50, end: 7.50, type: 'Boxing',   title: 'Boxing Basics',         coach: 'jo',   room: 'A', filled: 6,  total: 12 },
  { day: 1, start: 10.0, end: 11.0, type: 'Pilates',  title: 'Mat Pilates',           coach: 'mild', room: 'B', filled: 11, total: 12 },
  { day: 1, start: 17.5, end: 18.5, type: 'HIIT',     title: 'Tabata 40/20',          coach: 'best', room: 'A', filled: 20, total: 20, waitlist: 4 },
  { day: 1, start: 19.0, end: 20.0, type: 'Spin',     title: 'Spin · Endurance',      coach: 'arm',  room: 'A', filled: 17, total: 20 },
  // Wednesday (today)
  { day: 2, start: 7.00, end: 8.00, type: 'Spin',     title: 'Spin · High Intensity', coach: 'arm',  room: 'A', filled: 17, total: 20, done: true },
  { day: 2, start: 8.50, end: 9.50, type: 'Mobility', title: 'Mobility + Stretch',    coach: 'mild', room: 'B', filled: 6,  total: 12, done: true },
  { day: 2, start: 12.0, end: 12.5, type: 'HIIT',     title: 'HIIT Express',          coach: 'best', room: 'A', filled: 14, total: 20, live: true },
  { day: 2, start: 17.0, end: 18.0, type: 'Strength', title: 'Lower Body',            coach: 'p',    room: 'C', filled: 12, total: 20 },
  { day: 2, start: 18.5, end: 19.5, type: 'Yoga',     title: 'Vinyasa Flow',          coach: 'nok',  room: 'B', filled: 18, total: 20 },
  // Thursday
  { day: 3, start: 6.50, end: 7.50, type: 'HIIT',     title: 'Sunrise HIIT',          coach: 'best', room: 'A', filled: 8,  total: 20 },
  { day: 3, start: 9.00, end: 10.0, type: 'Pilates',  title: 'Core Focus',            coach: 'mild', room: 'B', filled: 10, total: 12 },
  { day: 3, start: 17.5, end: 18.5, type: 'Boxing',   title: 'Boxing Conditioning',   coach: 'jo',   room: 'A', filled: 9,  total: 12 },
  { day: 3, start: 19.0, end: 20.0, type: 'Strength', title: 'Upper Body',            coach: 'p',    room: 'C', filled: 15, total: 16 },
  // Friday
  { day: 4, start: 7.00, end: 8.00, type: 'Yoga',     title: 'Morning Flow',          coach: 'nok',  room: 'B', filled: 12, total: 15 },
  { day: 4, start: 12.0, end: 12.5, type: 'HIIT',     title: 'HIIT Express',          coach: 'best', room: 'A', filled: 16, total: 20 },
  { day: 4, start: 17.0, end: 18.0, type: 'Spin',     title: 'Spin · Friday Burn',    coach: 'arm',  room: 'A', filled: 20, total: 20, waitlist: 6 },
  { day: 4, start: 18.5, end: 19.5, type: 'Strength', title: 'Full Body',             coach: 'p',    room: 'C', filled: 10, total: 16 },
  // Saturday
  { day: 5, start: 8.00, end: 9.00, type: 'Spin',     title: 'Weekend Ride',          coach: 'arm',  room: 'A', filled: 19, total: 20 },
  { day: 5, start: 9.50, end: 10.5, type: 'Yoga',     title: 'Slow Flow',             coach: 'nok',  room: 'B', filled: 14, total: 15 },
  { day: 5, start: 11.0, end: 12.0, type: 'Boxing',   title: 'Boxing Open Gym',       coach: 'jo',   room: 'A', filled: 4,  total: 12 },
  // Sunday
  { day: 6, start: 9.00, end: 10.0, type: 'Yoga',     title: 'Restorative',           coach: 'nok',  room: 'B', filled: 7,  total: 15 },
  { day: 6, start: 10.5, end: 11.5, type: 'Mobility', title: 'Deep Stretch',          coach: 'mild', room: 'B', filled: 5,  total: 12 },
];

/* ---------- Helpers ---------- */
const fmtTime = (h) => {
  const hr = Math.floor(h);
  const mn = Math.round((h - hr) * 60);
  return `${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
};
const capacityColor = (pct) => {
  if (pct >= 100) return { fg: adminTokens.destr,  bg: 'hsl(0 78% 60% / 0.14)'  };
  if (pct >= 85)  return { fg: adminTokens.warn,   bg: 'hsl(38 95% 55% / 0.14)' };
  if (pct >= 50)  return { fg: adminTokens.success,bg: 'hsl(152 55% 45% / 0.12)' };
  return            { fg: adminTokens.info,    bg: adminTokens.infoSoft };
};

/* =============================================================
 *  TOP TOOLBAR — date nav + view switch + filters
 * =========================================================== */
const ScheduleToolbar = ({ view, setView, weekLabel, onPrev, onNext, onToday, filters, setFilters }) => {
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: `1px solid ${adminTokens.border}`,
                    borderRadius: 10, padding: 2, background: adminTokens.subtle }}>
        <IconBtn onClick={onPrev} title="สัปดาห์ก่อน"><A_Icon d={<><polyline points="15 18 9 12 15 6"/></>} size={14}/></IconBtn>
        <button onClick={onToday} style={{
          height: 30, padding: '0 12px', borderRadius: 8, border: 0, background: 'transparent',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: adminTokens.black, cursor: 'pointer',
        }}>วันนี้</button>
        <IconBtn onClick={onNext} title="สัปดาห์ถัดไป"><A_Icon d={<><polyline points="9 18 15 12 9 6"/></>} size={14}/></IconBtn>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: adminTokens.black, letterSpacing: '-.01em', minWidth: 180 }}>
        {weekLabel}
      </div>

      <div style={{ flex: 1 }}/>

      {/* View switcher */}
      <div style={{ display: 'flex', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                    padding: 2, background: adminTokens.subtle }}>
        {[
          { id: 'week', label: 'สัปดาห์' },
          { id: 'day',  label: 'วัน' },
          { id: 'list', label: 'รายการ' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            height: 30, padding: '0 14px', borderRadius: 8, border: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            background: view === v.id ? adminTokens.surface : 'transparent',
            color: view === v.id ? adminTokens.black : adminTokens.muted,
            boxShadow: view === v.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
          }}>{v.label}</button>
        ))}
      </div>

      {/* Filter: Room */}
      <FilterDropdown
        icon={aIcons.layout}
        label="ห้อง"
        value={filters.room}
        options={[{v:'all',l:'ทุกห้อง'}, ...ROOMS.map(r=>({v:r.id,l:r.label}))]}
        onChange={v => setFilters(f => ({ ...f, room: v }))}
      />
      {/* Filter: Coach */}
      <FilterDropdown
        icon={aIcons.userOne}
        label="เทรนเนอร์"
        value={filters.coach}
        options={[{v:'all',l:'ทุกคน'}, ...COACHES.map(c=>({v:c.id,l:`Coach ${c.name}`}))]}
        onChange={v => setFilters(f => ({ ...f, coach: v }))}
      />
      {/* Filter: Type */}
      <FilterDropdown
        icon={aIcons.tag}
        label="ประเภท"
        value={filters.type}
        options={[{v:'all',l:'ทุกประเภท'}, ...Object.keys(CLASS_TYPES).map(t=>({v:t,l:t}))]}
        onChange={v => setFilters(f => ({ ...f, type: v }))}
      />

      <HeaderBtnV2 icon={aIcons.plus} primary>เพิ่มคลาส</HeaderBtnV2>
    </div>
  );
};

const IconBtn = ({ children, onClick, title }) => (
  <button onClick={onClick} title={title} style={{
    width: 30, height: 30, borderRadius: 8, border: 0, background: 'transparent',
    cursor: 'pointer', color: adminTokens.black, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}
  onMouseEnter={e => e.currentTarget.style.background = adminTokens.surface}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    {children}
  </button>
);

const FilterDropdown = ({ icon, label, value, options, onChange }) => {
  const [open, setOpen] = useStateS(false);
  const ref = useRefS();
  useEffectS(() => {
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const current = options.find(o => o.v === value) || options[0];
  const active = value !== 'all';
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        height: 34, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${active ? adminTokens.orange : adminTokens.border}`,
        background: active ? adminTokens.orangeSoft : adminTokens.surface,
        color: active ? adminTokens.orange : adminTokens.black,
        fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <A_Icon d={icon} size={13}/>
        <span style={{ color: active ? adminTokens.orange : adminTokens.muted }}>{label}:</span>
        <span>{current.l}</span>
        <A_Icon d={aIcons.chev} size={12}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: 10, boxShadow: adminTokens.shadowMd, padding: 4, minWidth: 160,
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
 *  STATS STRIP — class-ops focused KPIs
 * =========================================================== */
const ScheduleStats = ({ classes }) => {
  const total = classes.length;
  const avgUtil = total ? Math.round(classes.reduce((s, c) => s + (c.filled / c.total), 0) / total * 100) : 0;
  const waitlist = classes.reduce((s, c) => s + (c.waitlist || 0), 0);
  const empty = classes.filter(c => c.filled / c.total < 0.3).length;
  const full = classes.filter(c => c.filled >= c.total).length;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      <MiniStat label="คลาสสัปดาห์นี้" value={total} suffix="คลาส"
                icon={aIcons.cal} accent="info"/>
      <MiniStat label="อัตราความจุเฉลี่ย" value={`${avgUtil}%`}
                icon={aIcons.pulse} accent={avgUtil >= 80 ? 'success' : avgUtil >= 50 ? 'warn' : 'info'}
                sub={avgUtil >= 80 ? 'สูงมาก — เพิ่มรอบ?' : avgUtil >= 50 ? 'อยู่ในเกณฑ์ดี' : 'ต่ำ — ต้องโปรโมท'}/>
      <MiniStat label="คลาสเต็ม + Waitlist" value={`${full}/${waitlist}`} suffix="คน รอคิว"
                icon={aIcons.hand} accent="orange"/>
      <MiniStat label="คลาสที่คนน้อย" value={empty} suffix="ต่ำกว่า 30%"
                icon={aIcons.alert} accent={empty > 2 ? 'warn' : 'success'}/>
    </div>
  );
};

const MiniStat = ({ label, value, suffix, icon, accent, sub }) => {
  const map = {
    info:    { fg: adminTokens.info,    bg: adminTokens.infoSoft },
    success: { fg: adminTokens.success, bg: adminTokens.successSoft },
    warn:    { fg: adminTokens.warn,    bg: adminTokens.warnSoft },
    orange:  { fg: adminTokens.orange,  bg: adminTokens.orangeSoft },
  };
  const a = map[accent] || map.info;
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
        <A_Icon d={icon} size={17} stroke={2.2}/>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                         fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{value}</span>
          {suffix && <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 500 }}>{suffix}</span>}
        </div>
        {sub && <div style={{ fontSize: 10, color: a.fg, fontWeight: 600, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
};

/* =============================================================
 *  WEEK GRID — time rows × 7 day cols, colored class blocks
 * =========================================================== */
const WeekGrid = ({ classes, onSelect, selectedId }) => {
  const hours = [];
  for (let h = HOUR_START; h < HOUR_END; h++) hours.push(h);
  const totalH = HOUR_END - HOUR_START;

  // "Now" line — today is day idx 2, 14:23 in our mock
  const nowDay = 2;
  const nowHour = 14 + 23/60;
  const nowOK = nowHour >= HOUR_START && nowHour < HOUR_END;

  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_PX}px repeat(7, 1fr)`,
        borderBottom: `1px solid ${adminTokens.border}`,
        background: adminTokens.subtle,
      }}>
        <div/>
        {WEEK_DAYS.map(d => (
          <div key={d.idx} style={{
            padding: '10px 12px', textAlign: 'center', borderLeft: `1px solid ${adminTokens.divider}`,
            background: d.isToday ? adminTokens.orangeSoft : 'transparent',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: d.isToday ? adminTokens.orange : adminTokens.muted,
                          textTransform: 'uppercase', letterSpacing: '.08em' }}>{d.dow}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: d.isToday ? adminTokens.orange : adminTokens.black,
                          fontVariantNumeric: 'tabular-nums', marginTop: 2, letterSpacing: '-.02em' }}>
              {String(d.date).padStart(2,'0')}
            </div>
          </div>
        ))}
      </div>

      {/* Body: relative container with absolute-positioned class blocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_PX}px repeat(7, 1fr)`,
        position: 'relative',
      }}>
        {/* Time gutter */}
        <div>
          {hours.map(h => (
            <div key={h} style={{
              height: HOUR_PX, borderBottom: `1px solid ${adminTokens.divider}`,
              paddingRight: 8, paddingTop: 2, textAlign: 'right',
              fontSize: 10, color: adminTokens.mutedLight, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(h).padStart(2,'0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {WEEK_DAYS.map(day => (
          <div key={day.idx} style={{
            position: 'relative', borderLeft: `1px solid ${adminTokens.divider}`,
            background: day.isToday ? 'hsl(22 95% 55% / 0.025)' : 'transparent',
          }}>
            {/* Hour grid lines */}
            {hours.map(h => (
              <div key={h} style={{
                height: HOUR_PX,
                borderBottom: `1px solid ${adminTokens.divider}`,
                position: 'relative',
              }}>
                {/* half-hour subtle line */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: HOUR_PX/2,
                              borderBottom: `1px dashed ${adminTokens.divider}`, opacity: .5 }}/>
              </div>
            ))}

            {/* Now line (today only) */}
            {day.isToday && nowOK && (
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: ((nowHour - HOUR_START) / totalH) * (HOUR_PX * totalH),
                borderTop: `2px solid ${adminTokens.destr}`, zIndex: 3, pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%',
                  background: adminTokens.destr, boxShadow: '0 0 0 3px hsl(0 78% 60% / 0.25)',
                }}/>
                <div style={{
                  position: 'absolute', right: 4, top: -16, fontSize: 9, fontWeight: 800,
                  color: adminTokens.destr, background: adminTokens.surface,
                  padding: '1px 5px', borderRadius: 3, border: `1px solid ${adminTokens.destr}`,
                  letterSpacing: '.04em',
                }}>NOW {fmtTime(nowHour)}</div>
              </div>
            )}

            {/* Class blocks for this day */}
            {classes.filter(c => c.day === day.idx).map((c, i) => {
              const top = ((c.start - HOUR_START) / totalH) * (HOUR_PX * totalH);
              const height = ((c.end - c.start) / totalH) * (HOUR_PX * totalH);
              const ct = CLASS_TYPES[c.type];
              const pct = (c.filled / c.total) * 100;
              const isSelected = selectedId === c._id;
              const isDone = c.done;
              const isLive = c.live;
              return (
                <button key={i} onClick={() => onSelect(c)} style={{
                  position: 'absolute', left: 4, right: 4,
                  top: top + 1, height: height - 2,
                  background: isDone ? adminTokens.subtle : ct.soft,
                  borderLeft: `3px solid ${isDone ? adminTokens.mutedLight : ct.color}`,
                  border: `1px solid ${isSelected ? ct.color : (isDone ? adminTokens.divider : 'transparent')}`,
                  borderLeftWidth: 3,
                  borderRadius: 6, padding: '5px 7px 4px 8px', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  color: isDone ? adminTokens.muted : ct.color,
                  display: 'flex', flexDirection: 'column', gap: 1,
                  overflow: 'hidden', minWidth: 0,
                  boxShadow: isSelected ? `0 0 0 2px ${ct.color}, 0 4px 12px ${ct.color}33` : 'none',
                  transition: 'all .12s',
                  opacity: isDone ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = ct.color + '22'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDone ? adminTokens.subtle : ct.soft; }}>
                  {isLive && (
                    <div style={{
                      position: 'absolute', top: 4, right: 5, fontSize: 8, fontWeight: 800,
                      color: '#fff', background: adminTokens.destr, padding: '1px 5px', borderRadius: 3,
                      letterSpacing: '.08em',
                      animation: 'admin-pulse 1.4s ease-in-out infinite',
                    }}>LIVE</div>
                  )}
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: isDone ? adminTokens.muted : adminTokens.black,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    lineHeight: 1.2, paddingRight: isLive ? 32 : 0,
                    textDecoration: isDone ? 'line-through' : 'none',
                    textDecorationColor: adminTokens.mutedLight,
                  }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isDone ? adminTokens.mutedLight : ct.color,
                                fontVariantNumeric: 'tabular-nums' }}>
                    {fmtTime(c.start)} · {COACHES.find(x=>x.id===c.coach)?.name}
                  </div>
                  {height > 40 && (
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        flex: 1, height: 3, borderRadius: 9999,
                        background: isDone ? adminTokens.divider : 'rgba(255,255,255,.5)',
                        overflow: 'hidden', minWidth: 10,
                      }}>
                        <div style={{
                          width: `${Math.min(pct, 100)}%`, height: '100%',
                          background: pct >= 100 ? adminTokens.destr : pct >= 85 ? adminTokens.warn : (isDone ? adminTokens.mutedLight : ct.color),
                        }}/>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700,
                                     color: isDone ? adminTokens.mutedLight : adminTokens.black,
                                     fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {c.filled}/{c.total}{c.waitlist ? ` +${c.waitlist}` : ''}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        padding: '10px 14px', borderTop: `1px solid ${adminTokens.border}`,
        background: adminTokens.subtle, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: adminTokens.muted,
                       textTransform: 'uppercase', letterSpacing: '.06em' }}>ประเภทคลาส</span>
        {Object.entries(CLASS_TYPES).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: v.color }}/>
            <span style={{ fontSize: 11, color: adminTokens.ink2, fontWeight: 500 }}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =============================================================
 *  LIST VIEW — scannable table grouped by day
 * =========================================================== */
const ScheduleList = ({ classes, onSelect, selectedId }) => {
  const byDay = {};
  classes.forEach(c => { (byDay[c.day] = byDay[c.day] || []).push(c); });
  Object.values(byDay).forEach(list => list.sort((a,b) => a.start - b.start));

  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
    }}>
      {WEEK_DAYS.map(d => {
        const rows = byDay[d.idx] || [];
        if (!rows.length) return null;
        return (
          <div key={d.idx}>
            <div style={{
              padding: '10px 16px', background: d.isToday ? adminTokens.orangeSoft : adminTokens.subtle,
              borderBottom: `1px solid ${adminTokens.divider}`,
              display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 2,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: d.isToday ? adminTokens.orange : adminTokens.black,
                            textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {d.full} · {String(d.date).padStart(2,'0')} เม.ย.
                {d.isToday && <span style={{ marginLeft: 8, fontSize: 10, color: adminTokens.orange,
                                              background: adminTokens.surface, padding: '2px 6px', borderRadius: 3,
                                              border: `1px solid ${adminTokens.orange}` }}>วันนี้</span>}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 500 }}>
                {rows.length} คลาส · {rows.reduce((s,c)=>s+c.filled,0)} จอง
              </div>
            </div>
            {rows.map((c, i) => {
              const ct = CLASS_TYPES[c.type];
              const pct = (c.filled / c.total) * 100;
              const isSelected = selectedId === c._id;
              return (
                <button key={i} onClick={() => onSelect(c)} style={{
                  width: '100%', padding: '12px 16px', border: 0,
                  background: isSelected ? ct.soft : 'transparent',
                  borderBottom: `1px solid ${adminTokens.divider}`,
                  borderLeft: `3px solid ${isSelected ? ct.color : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'background .12s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = adminTokens.subtle; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ width: 68, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>
                      {fmtTime(c.start)}
                    </div>
                    <div style={{ fontSize: 10, color: adminTokens.mutedLight, fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round((c.end-c.start)*60)} นาที
                    </div>
                  </div>
                  <div style={{ width: 3, height: 36, background: ct.color, borderRadius: 3, flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: ct.color, background: ct.soft,
                        padding: '2px 7px', borderRadius: 4, letterSpacing: '.02em',
                      }}>{c.type}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{c.title}</span>
                      {c.live && <span style={{
                        fontSize: 9, fontWeight: 800, color: '#fff', background: adminTokens.destr,
                        padding: '1px 6px', borderRadius: 3, letterSpacing: '.06em',
                        animation: 'admin-pulse 1.4s ease-in-out infinite',
                      }}>● LIVE</span>}
                      {c.done && <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>เสร็จแล้ว</span>}
                    </div>
                    <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 3,
                                  display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={COACHES.find(x=>x.id===c.coach)?.name} color={COACHES.find(x=>x.id===c.coach)?.color}/>
                      <span>Coach {COACHES.find(x=>x.id===c.coach)?.name}</span>
                      <span style={{ color: adminTokens.mutedLight }}>·</span>
                      <span>{ROOMS.find(r=>r.id===c.room)?.label}</span>
                    </div>
                  </div>
                  <div style={{ width: 170, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black,
                                     fontVariantNumeric: 'tabular-nums' }}>
                        {c.filled}<span style={{ color: adminTokens.mutedLight, fontWeight: 500 }}>/{c.total}</span>
                      </span>
                      {c.waitlist > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: adminTokens.orange,
                                       background: adminTokens.orangeSoft, padding: '1px 5px', borderRadius: 3 }}>
                          +{c.waitlist} รอคิว
                        </span>
                      )}
                    </div>
                    <div style={{ height: 4, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(pct, 100)}%`, height: '100%',
                        background: pct >= 100 ? adminTokens.destr : pct >= 85 ? adminTokens.warn : ct.color,
                      }}/>
                    </div>
                  </div>
                  <A_Icon d={aIcons.chevR} size={14}/>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const Avatar = ({ name, color, size = 18 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: color,
    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.48, fontWeight: 800, flexShrink: 0,
  }}>{(name || '?')[0]}</div>
);

/* =============================================================
 *  DETAIL DRAWER — slides in from right
 * =========================================================== */
const ClassDrawer = ({ klass, onClose }) => {
  if (!klass) return null;
  const ct = CLASS_TYPES[klass.type];
  const coach = COACHES.find(c => c.id === klass.coach);
  const pct = (klass.filled / klass.total) * 100;
  const roster = [
    { n: 'Ploy Chanakarn', t: '2 ชม.ที่แล้ว',  s: 'confirmed' },
    { n: 'Arm Siriwat',    t: '3 ชม.ที่แล้ว',  s: 'confirmed' },
    { n: 'Natty Prach',    t: 'เมื่อวาน',        s: 'confirmed' },
    { n: 'Eve Kwan',       t: 'เมื่อวาน',        s: 'confirmed' },
    { n: 'Mook Thana',     t: '2 วันที่แล้ว',    s: 'confirmed' },
    { n: 'Joe L.',         t: '3 วันที่แล้ว',    s: 'confirmed' },
  ].slice(0, klass.filled);
  const waitlist = klass.waitlist ? [
    { n: 'Pun K.',  t: '30 นาที',  pos: 1 },
    { n: 'Milk R.', t: '1 ชม.',    pos: 2 },
    { n: 'Ben S.',  t: '2 ชม.',    pos: 3 },
    { n: 'Jane T.', t: '4 ชม.',    pos: 4 },
  ].slice(0, klass.waitlist) : [];

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.25)', zIndex: 100,
        animation: 'admin-fade 0.18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 101,
        background: adminTokens.surface, boxShadow: '-8px 0 32px rgba(15,23,42,.12)',
        display: 'flex', flexDirection: 'column',
        animation: 'admin-slide-in .22s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header band */}
        <div style={{
          padding: '18px 20px 14px',
          background: `linear-gradient(135deg, ${ct.color}, ${ct.color.replace('55%)', '45%)')})`,
          color: '#fff', position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8,
            border: 0, background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <A_Icon d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} size={14}/>
          </button>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', opacity: .9, textTransform: 'uppercase' }}>
            {klass.type}
            {klass.live && <span style={{ marginLeft: 8, background: '#fff', color: ct.color, padding: '1px 6px', borderRadius: 3 }}>● LIVE</span>}
            {klass.done && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,.25)', padding: '1px 6px', borderRadius: 3 }}>เสร็จแล้ว</span>}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', marginTop: 4 }}>
            {klass.title}
          </div>
          <div style={{ fontSize: 12, marginTop: 6, opacity: .95, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <A_Icon d={aIcons.cal} size={12}/>
              {WEEK_DAYS[klass.day].full} {fmtTime(klass.start)}–{fmtTime(klass.end)}
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <A_Icon d={aIcons.layout} size={12}/>
              {ROOMS.find(r=>r.id===klass.room)?.label}
            </span>
          </div>
        </div>

        {/* Body (scrolls) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Coach card */}
          <div style={{
            background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
            borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: coach.color,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800,
            }}>{coach.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black }}>Coach {coach.name}</div>
              <div style={{ fontSize: 11, color: adminTokens.muted }}>
                ★ 4.8 · 142 คลาสเดือนนี้
              </div>
            </div>
            <button style={{
              height: 30, padding: '0 10px', borderRadius: 8,
              border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: adminTokens.black, cursor: 'pointer',
            }}>ดูโปรไฟล์</button>
          </div>

          {/* Capacity panel */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                            textTransform: 'uppercase', letterSpacing: '.04em' }}>ความจุ</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
                {klass.filled}<span style={{ color: adminTokens.mutedLight, fontWeight: 500 }}>/{klass.total}</span>
                <span style={{ fontSize: 13, color: capacityColor(pct).fg, marginLeft: 6, fontWeight: 700 }}>
                  {Math.round(pct)}%
                </span>
              </div>
            </div>
            {/* Seat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(klass.total, 10)}, 1fr)`, gap: 4, marginBottom: 10 }}>
              {Array.from({ length: klass.total }).map((_, i) => (
                <div key={i} style={{
                  height: 20, borderRadius: 4,
                  background: i < klass.filled ? ct.color : adminTokens.divider,
                  opacity: i < klass.filled ? 1 : .5,
                }}/>
              ))}
            </div>
            {klass.waitlist > 0 && (
              <div style={{
                background: adminTokens.orangeSoft, border: `1px solid ${adminTokens.orange}33`,
                borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <A_Icon d={aIcons.hand} size={14}/>
                <span style={{ fontSize: 11, fontWeight: 600, color: adminTokens.orange, flex: 1 }}>
                  มี <b>{klass.waitlist} คน</b> อยู่ในคิวรอ
                </span>
                <button style={{
                  fontSize: 11, fontWeight: 700, color: '#fff', background: adminTokens.orange,
                  border: 0, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                }}>เปิดรอบเสริม</button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            <DrawerAction icon={aIcons.plus}   label="เพิ่มสมาชิก"/>
            <DrawerAction icon={aIcons.cal}    label="ทำซ้ำ"/>
            <DrawerAction icon={aIcons.userOne} label="เปลี่ยนโค้ช"/>
            <DrawerAction icon={aIcons.alert}  label="ยกเลิก" danger/>
          </div>

          {/* Roster */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                            textTransform: 'uppercase', letterSpacing: '.04em' }}>รายชื่อผู้จอง</div>
              <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>({roster.length})</span>
              <div style={{ flex: 1 }}/>
              <button style={{
                fontSize: 11, fontWeight: 700, color: adminTokens.orange, background: 'transparent',
                border: 0, cursor: 'pointer', fontFamily: 'inherit',
              }}>Export CSV</button>
            </div>
            <div style={{ border: `1px solid ${adminTokens.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {roster.map((r, i) => (
                <div key={i} style={{
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: i < roster.length - 1 ? `1px solid ${adminTokens.divider}` : 0,
                }}>
                  <Avatar name={r.n} color={COACHES[i % COACHES.length].color} size={26}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{r.n}</div>
                    <div style={{ fontSize: 10, color: adminTokens.mutedLight }}>จอง {r.t}</div>
                  </div>
                  {klass.done ? (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: adminTokens.success,
                      background: adminTokens.successSoft, padding: '2px 6px', borderRadius: 3,
                    }}>เช็คอิน</span>
                  ) : (
                    <button style={{
                      background: 'transparent', border: `1px solid ${adminTokens.border}`,
                      width: 24, height: 24, borderRadius: 6, cursor: 'pointer', color: adminTokens.muted,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <A_Icon d={<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>} size={12}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist */}
          {waitlist.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.orange,
                              textTransform: 'uppercase', letterSpacing: '.04em' }}>คิวรอ</div>
                <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>({waitlist.length})</span>
              </div>
              <div style={{ border: `1px dashed ${adminTokens.orange}55`, borderRadius: 10, overflow: 'hidden',
                            background: adminTokens.orangeSoft + '55' }}>
                {waitlist.map((r, i) => (
                  <div key={i} style={{
                    padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: i < waitlist.length - 1 ? `1px dashed ${adminTokens.orange}33` : 0,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: adminTokens.orange,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                    }}>#{r.pos}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{r.n}</div>
                      <div style={{ fontSize: 10, color: adminTokens.mutedLight }}>รอมา {r.t}</div>
                    </div>
                    <button style={{
                      fontSize: 10, fontWeight: 700, color: '#fff', background: adminTokens.orange,
                      border: 0, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                    }}>เลื่อนขึ้น</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes admin-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes admin-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

const DrawerAction = ({ icon, label, danger }) => (
  <button style={{
    background: danger ? 'hsl(0 78% 60% / 0.08)' : adminTokens.subtle,
    border: `1px solid ${danger ? 'hsl(0 78% 60% / 0.25)' : adminTokens.border}`,
    borderRadius: 10, padding: '10px 4px', cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    color: danger ? adminTokens.destr : adminTokens.black,
    transition: 'all .12s',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = danger ? 'hsl(0 78% 60% / 0.14)' : adminTokens.divider; }}
  onMouseLeave={e => { e.currentTarget.style.background = danger ? 'hsl(0 78% 60% / 0.08)' : adminTokens.subtle; }}>
    <A_Icon d={icon} size={16}/>
    <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
  </button>
);

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const SchedulePageV2 = () => {
  const [view, setView] = useStateS(() => localStorage.getItem('moom-sched-view') || 'week');
  const [filters, setFilters] = useStateS({ room: 'all', coach: 'all', type: 'all' });
  const [selectedId, setSelectedId] = useStateS(null);

  useEffectS(() => { localStorage.setItem('moom-sched-view', view); }, [view]);

  // Assign ids
  const allClasses = useMemoS(() => SEED_CLASSES.map((c, i) => ({ ...c, _id: `c${i}` })), []);

  // Apply filters
  const filtered = useMemoS(() => allClasses.filter(c => {
    if (filters.room !== 'all' && c.room !== filters.room) return false;
    if (filters.coach !== 'all' && c.coach !== filters.coach) return false;
    if (filters.type !== 'all' && c.type !== filters.type) return false;
    return true;
  }), [allClasses, filters]);

  const selected = filtered.find(c => c._id === selectedId) || null;

  // Keyboard shortcuts
  useEffectS(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') setSelectedId(null);
      else if (e.key === '1') setView('week');
      else if (e.key === '2') setView('day');
      else if (e.key === '3') setView('list');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>
            ตารางเรียน
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            จัดการคลาส · ดูความจุ · ติดตามคิวรอ แบบเรียลไทม์
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: adminTokens.mutedLight }}>
          <kbd style={kbdStyle}>1</kbd> สัปดาห์
          <kbd style={kbdStyle}>2</kbd> วัน
          <kbd style={kbdStyle}>3</kbd> รายการ
          <kbd style={kbdStyle}>Esc</kbd> ปิด
        </div>
      </div>

      <ScheduleStats classes={filtered}/>

      <ScheduleToolbar
        view={view} setView={setView}
        weekLabel="13 – 19 เมษายน 2026"
        onPrev={() => {}} onNext={() => {}} onToday={() => {}}
        filters={filters} setFilters={setFilters}
      />

      {view === 'week' && <WeekGrid classes={filtered} onSelect={c => setSelectedId(c._id)} selectedId={selectedId}/>}
      {view === 'day'  && <DayFocusView classes={filtered} onSelect={c => setSelectedId(c._id)} selectedId={selectedId}/>}
      {view === 'list' && <ScheduleList classes={filtered} onSelect={c => setSelectedId(c._id)} selectedId={selectedId}/>}

      {selected && <ClassDrawer klass={selected} onClose={() => setSelectedId(null)}/>}
    </div>
  );
};

const kbdStyle = {
  fontSize: 10, fontWeight: 700, color: adminTokens.muted,
  background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
  padding: '1px 5px', borderRadius: 4, fontFamily: 'inherit', marginRight: 2, marginLeft: 4,
};

/* =============================================================
 *  DAY FOCUS VIEW — single column deep focus, with timeline
 * =========================================================== */
const DayFocusView = ({ classes, onSelect, selectedId }) => {
  const [dayIdx, setDayIdx] = useStateS(2); // today
  const day = WEEK_DAYS[dayIdx];
  const rows = classes.filter(c => c.day === dayIdx).sort((a,b) => a.start - b.start);
  const total = rows.length;
  const booked = rows.reduce((s, c) => s + c.filled, 0);
  const capacity = rows.reduce((s, c) => s + c.total, 0);
  const util = capacity ? Math.round(booked / capacity * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
      {/* Day picker rail */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 10,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {WEEK_DAYS.map(d => {
          const dayRows = classes.filter(c => c.day === d.idx);
          const isActive = d.idx === dayIdx;
          return (
            <button key={d.idx} onClick={() => setDayIdx(d.idx)} style={{
              padding: '10px 12px', border: 0, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              background: isActive ? adminTokens.orangeSoft : 'transparent',
              color: isActive ? adminTokens.orange : adminTokens.black,
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              fontWeight: isActive ? 700 : 500, transition: 'all .12s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = adminTokens.subtle; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: isActive ? adminTokens.orange : adminTokens.subtle,
                color: isActive ? '#fff' : adminTokens.black,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: d.isToday && !isActive ? `2px solid ${adminTokens.orange}` : 'none',
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, lineHeight: 1, letterSpacing: '.05em' }}>{d.dow}</div>
                <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1,
                              fontVariantNumeric: 'tabular-nums' }}>{d.date}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{d.full}</div>
                <div style={{ fontSize: 10, color: isActive ? adminTokens.orange : adminTokens.muted }}>
                  {dayRows.length} คลาส
                </div>
              </div>
              {d.isToday && <span style={{
                fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                background: isActive ? '#fff' : adminTokens.orange, color: isActive ? adminTokens.orange : '#fff',
                letterSpacing: '.04em',
              }}>วันนี้</span>}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${adminTokens.border}`,
          display: 'flex', alignItems: 'center', gap: 14, background: adminTokens.subtle,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.01em' }}>
              {day.full} {String(day.date).padStart(2,'0')} เมษายน 2026
            </div>
            <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2 }}>
              {total} คลาส · {booked}/{capacity} ที่นั่งถูกจอง · ความจุ {util}%
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: adminTokens.muted }}>
            {COACHES.slice(0, 4).map(c => (
              <Avatar key={c.id} name={c.name} color={c.color} size={22}/>
            ))}
            <span style={{ marginLeft: 4 }}>โค้ช {new Set(rows.map(r=>r.coach)).size} คน</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: adminTokens.muted, fontSize: 13 }}>
            ไม่มีคลาสในวันนี้ตามตัวกรอง
          </div>
        ) : rows.map((c, i) => {
          const ct = CLASS_TYPES[c.type];
          const coach = COACHES.find(x => x.id === c.coach);
          const pct = (c.filled / c.total) * 100;
          const isSelected = selectedId === c._id;
          return (
            <button key={i} onClick={() => onSelect(c)} style={{
              width: '100%', padding: '16px 18px', border: 0,
              background: isSelected ? ct.soft : 'transparent',
              borderBottom: i < rows.length - 1 ? `1px solid ${adminTokens.divider}` : 0,
              borderLeft: `4px solid ${isSelected ? ct.color : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s',
              opacity: c.done ? 0.65 : 1,
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = adminTokens.subtle; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: 70, flexShrink: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>
                  {fmtTime(c.start)}
                </div>
                <div style={{ fontSize: 11, color: adminTokens.mutedLight, fontVariantNumeric: 'tabular-nums' }}>
                  – {fmtTime(c.end)}
                </div>
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: 12, background: ct.soft, color: ct.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontWeight: 800, fontSize: 11, letterSpacing: '-.01em', textAlign: 'center',
              }}>{c.type}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black }}>{c.title}</span>
                  {c.live && <span style={{
                    fontSize: 10, fontWeight: 800, color: '#fff', background: adminTokens.destr,
                    padding: '2px 6px', borderRadius: 3,
                    animation: 'admin-pulse 1.4s ease-in-out infinite',
                  }}>● LIVE</span>}
                  {c.waitlist > 0 && <span style={{
                    fontSize: 10, fontWeight: 800, color: adminTokens.orange,
                    background: adminTokens.orangeSoft, padding: '2px 6px', borderRadius: 3,
                  }}>+{c.waitlist} รอคิว</span>}
                </div>
                <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 5,
                              display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={coach.name} color={coach.color} size={20}/>
                  <span style={{ fontWeight: 600, color: adminTokens.ink2 }}>Coach {coach.name}</span>
                  <span style={{ color: adminTokens.mutedLight }}>·</span>
                  <span>{ROOMS.find(r=>r.id===c.room)?.label}</span>
                  <span style={{ color: adminTokens.mutedLight }}>·</span>
                  <span>{Math.round((c.end-c.start)*60)} นาที</span>
                </div>
              </div>
              <div style={{ width: 200, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                                 fontVariantNumeric: 'tabular-nums' }}>
                    {c.filled}<span style={{ color: adminTokens.mutedLight, fontWeight: 500 }}>/{c.total}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700,
                                 color: capacityColor(pct).fg,
                                 background: capacityColor(pct).bg,
                                 padding: '1px 6px', borderRadius: 3 }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div style={{ height: 6, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(pct, 100)}%`, height: '100%',
                    background: pct >= 100 ? adminTokens.destr : pct >= 85 ? adminTokens.warn : ct.color,
                    transition: 'width .4s',
                  }}/>
                </div>
              </div>
              <A_Icon d={aIcons.chevR} size={16}/>
            </button>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { SchedulePageV2 });
