/* MOOM Admin — ผังห้อง (Rooms)
   Physical room management with a focus on UTILIZATION — the killer insight
   is "which rooms are sitting empty when."

   Design philosophy:
   - Hero is a heatmap (7 days × 14 hours × N rooms). One glance tells you
     where the dead zones are.
   - Rooms list below is cards (not table) — consistent with Categories page
   - Click room → detail drawer: equipment, upcoming classes, utilization stats
   - Conflict detection banner if two classes overlap in same room
   - Edit modal: name, color, capacity, equipment inventory, hours
*/

const { useState: useStateRM, useMemo: useMemoRM, useEffect: useEffectRM, useRef: useRefRM } = React;

/* =============================================================
 *  DATA
 * =========================================================== */
const RM_ROOMS = [
  {
    id: 'studio-a', name: 'Studio A', color: 'hsl(25 95% 55%)', icon: 'fire',
    capacity: 25, area: '85 ตร.ม.', floor: 'ชั้น 2',
    desc: 'สตูดิโอใหญ่ ใช้สำหรับ HIIT และคาร์ดิโอกลุ่มใหญ่',
    hours: '06:00 – 22:00',
    equipment: [
      { name: 'ดัมเบลชุด', qty: 20 }, { name: 'เสื่อโยคะ', qty: 30 },
      { name: 'แผ่นสเต็ป', qty: 15 }, { name: 'สายยืด', qty: 20 },
    ],
    classesThisWeek: 18, bookingsThisWeek: 412, conflicts: 0,
    /* utilization per day (0-6 = Sun-Sat), per hour (6-22) : 0..100 */
  },
  {
    id: 'spin', name: 'Spin Room', color: 'hsl(200 70% 55%)', icon: 'bike',
    capacity: 20, area: '55 ตร.ม.', floor: 'ชั้น 2',
    desc: 'ห้องจักรยานปั่นในร่ม พร้อมระบบเสียงและไฟสเตจ',
    hours: '06:00 – 21:00',
    equipment: [
      { name: 'จักรยาน Spin', qty: 20 }, { name: 'ผ้าขนหนู', qty: 40 },
      { name: 'ลำโพง 2.1', qty: 1 }, { name: 'ไฟ LED stage', qty: 6 },
    ],
    classesThisWeek: 12, bookingsThisWeek: 236, conflicts: 0,
  },
  {
    id: 'yoga', name: 'Yoga Studio', color: 'hsl(270 60% 60%)', icon: 'yoga',
    capacity: 18, area: '48 ตร.ม.', floor: 'ชั้น 3',
    desc: 'ห้องโยคะเงียบสงบ พื้นไม้ อากาศถ่ายเท',
    hours: '07:00 – 21:00',
    equipment: [
      { name: 'เสื่อโยคะ premium', qty: 20 }, { name: 'บล็อคโยคะ', qty: 40 },
      { name: 'สายโยคะ', qty: 25 }, { name: 'หมอนรองเมดิเทชั่น', qty: 20 },
    ],
    classesThisWeek: 14, bookingsThisWeek: 220, conflicts: 1,
  },
  {
    id: 'weights', name: 'Weight Room', color: 'hsl(150 50% 45%)', icon: 'dumb',
    capacity: 30, area: '120 ตร.ม.', floor: 'ชั้น 1',
    desc: 'โซนยกน้ำหนักหลัก เปิดใช้ทั่วไป + คลาส Strength',
    hours: '05:00 – 23:00',
    equipment: [
      { name: 'บาร์เบล', qty: 8 }, { name: 'แร็คสควอท', qty: 4 },
      { name: 'ดัมเบล คู่', qty: 24 }, { name: 'ม้านั่งปรับระดับ', qty: 6 },
      { name: 'เคเบิลเครื่อง', qty: 2 },
    ],
    classesThisWeek: 8, bookingsThisWeek: 134, conflicts: 0,
  },
  {
    id: 'boxing', name: 'Boxing Ring', color: 'hsl(0 72% 55%)', icon: 'box',
    capacity: 12, area: '40 ตร.ม.', floor: 'ชั้น 1',
    desc: 'พื้นที่มวย พร้อมกระสอบทราย 4 จุด และริงจำลอง',
    hours: '10:00 – 21:00',
    equipment: [
      { name: 'กระสอบทราย', qty: 4 }, { name: 'นวมมวย', qty: 12 },
      { name: 'เป้าปา', qty: 6 }, { name: 'สายพันมือ', qty: 20 },
    ],
    classesThisWeek: 6, bookingsThisWeek: 68, conflicts: 0,
  },
  {
    id: 'studio-b', name: 'Studio B', color: 'hsl(340 70% 60%)', icon: 'stretch',
    capacity: 15, area: '45 ตร.ม.', floor: 'ชั้น 3',
    desc: 'สตูดิโอเล็ก เหมาะกับ Mobility, Pilates, คลาสส่วนตัว',
    hours: '07:00 – 21:00',
    equipment: [
      { name: 'เสื่อโยคะ', qty: 15 }, { name: 'ลูกบอลพิลาทิส', qty: 12 },
      { name: 'โฟมโรลเลอร์', qty: 10 },
    ],
    classesThisWeek: 7, bookingsThisWeek: 98, conflicts: 0,
  },
];

/* Generate a plausible utilization pattern:
   - Morning peak (6-9), evening peak (17-21)
   - Weekends stronger mornings
   - Studio A / Spin hottest, Boxing coldest
*/
const rmGenUtil = (roomId) => {
  const baseMap = {
    'studio-a': 0.75, 'spin': 0.65, 'yoga': 0.55,
    'weights': 0.40, 'boxing': 0.28, 'studio-b': 0.42,
  };
  const base = baseMap[roomId] || 0.5;
  const hours = [];
  for (let d = 0; d < 7; d++) {      // 0=Sun, 6=Sat
    const row = [];
    const isWeekend = d === 0 || d === 6;
    for (let h = 6; h <= 22; h++) {
      let v = 0;
      // morning peak
      if (h >= 6 && h <= 9)  v = (h === 7 || h === 8 ? 0.95 : 0.75) * (isWeekend ? 1.05 : 1);
      // midday lull
      else if (h >= 10 && h <= 15) v = 0.35 * (isWeekend ? 1.2 : 1);
      // evening peak
      else if (h >= 17 && h <= 20) v = (h === 18 || h === 19 ? 1.0 : 0.85) * (isWeekend ? 0.7 : 1);
      else if (h === 21 || h === 22) v = 0.45;
      else v = 0.2;
      v *= base;
      // add some variability
      v += (Math.sin(roomId.charCodeAt(0) + d * 7 + h * 3) * 0.08);
      v = Math.max(0, Math.min(1, v));
      row.push(v);
    }
    hours.push(row);
  }
  return hours;
};

/* Upcoming classes per room (for drawer) */
const RM_CLASSES = {
  'studio-a': [
    { day: 'จ.', time: '07:00', name: 'HIIT Burn 45', coach: 'Kwan', booked: 22, cap: 25 },
    { day: 'จ.', time: '18:00', name: 'Power HIIT',   coach: 'Ton',  booked: 25, cap: 25 },
    { day: 'อ.', time: '07:00', name: 'HIIT Burn 45', coach: 'Kwan', booked: 20, cap: 25 },
    { day: 'อ.', time: '19:00', name: 'Cardio Blast', coach: 'Mia',  booked: 18, cap: 25 },
    { day: 'พ.', time: '07:00', name: 'HIIT Burn 45', coach: 'Kwan', booked: 23, cap: 25 },
  ],
  'spin': [
    { day: 'จ.', time: '06:30', name: 'Morning Ride',   coach: 'Max',   booked: 18, cap: 20 },
    { day: 'จ.', time: '19:00', name: 'Rhythm Ride',    coach: 'Jaa',   booked: 20, cap: 20 },
    { day: 'อ.', time: '18:30', name: 'Spin + Core',    coach: 'Max',   booked: 16, cap: 20 },
    { day: 'พ.', time: '06:30', name: 'Morning Ride',   coach: 'Jaa',   booked: 14, cap: 20 },
  ],
  'yoga': [
    { day: 'จ.', time: '08:00', name: 'Vinyasa Flow',   coach: 'Praew', booked: 12, cap: 18 },
    { day: 'จ.', time: '18:00', name: 'Hatha Basic',    coach: 'Lily',  booked: 15, cap: 18 },
    { day: 'อ.', time: '17:30', name: 'Yin Yoga',       coach: 'Praew', booked: 18, cap: 18 },
    { day: 'อ.', time: '17:30', name: 'Meditation',     coach: 'Lily',  booked: 10, cap: 18 },
  ],
  'weights': [
    { day: 'จ.', time: '17:00', name: 'Strength 101',   coach: 'Boss',  booked: 12, cap: 15 },
    { day: 'พ.', time: '17:00', name: 'Power Lifting',  coach: 'Boss',  booked: 10, cap: 15 },
  ],
  'boxing': [
    { day: 'อ.', time: '19:00', name: 'Box Fit',        coach: 'Aek',   booked: 8,  cap: 12 },
    { day: 'ศ.', time: '19:00', name: 'Box Advanced',   coach: 'Aek',   booked: 10, cap: 12 },
  ],
  'studio-b': [
    { day: 'จ.', time: '10:00', name: 'Pilates Mat',    coach: 'Ing',   booked: 10, cap: 15 },
    { day: 'พ.', time: '10:00', name: 'Mobility Flow',  coach: 'Ing',   booked: 8,  cap: 15 },
  ],
};

/* =============================================================
 *  HELPERS
 * =========================================================== */
const RM_Icon = ({ d, size = 14, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);

const rmIcons = {
  plus: ctIcons.plus, x: ctIcons.x, search: ctIcons.search,
  edit: ctIcons.edit, trash: ctIcons.trash, dots: ctIcons.dots,
  chev: ctIcons.chev, check: ctIcons.check, info: ctIcons.info,
  warn: ctIcons.warn,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  ruler: <><path d="M3 3h18v5H3zM3 11h18v5H3zM3 19h18v2H3z"/></>,
  layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  building: <><path d="M3 21h18M6 21V3h12v18M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  trend: <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>,
};

const getRoomIcon = (id) => CT_ICON_PRESETS.find(i => i.id === id)?.path || CT_ICON_PRESETS[0].path;

/* Heat color: 0..1 → HSL orange scale */
const rmHeatColor = (v, color) => {
  if (v < 0.05) return adminTokens.subtle;
  const alpha = Math.max(0.1, Math.min(1, v));
  return `color-mix(in oklab, ${color} ${Math.round(alpha * 100)}%, transparent)`;
};

const rmDayLabels = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const rmHourLabels = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

/* =============================================================
 *  HEATMAP — the hero
 * =========================================================== */
const RmHeatmap = ({ rooms, selectedRoomId, onSelectRoom }) => {
  const [hoverCell, setHoverCell] = useStateRM(null); // { roomId, day, hour }

  // Aggregate or per-room view?
  const [mode, setMode] = useStateRM('per-room'); // 'per-room' | 'aggregate'

  const roomUtils = useMemoRM(() => rooms.map(r => ({ ...r, util: rmGenUtil(r.id) })), [rooms]);

  // Aggregate: sum all rooms / num rooms
  const aggUtil = useMemoRM(() => {
    const n = roomUtils.length || 1;
    const agg = Array.from({ length: 7 }, () => Array(17).fill(0));
    roomUtils.forEach(r => r.util.forEach((row, d) => row.forEach((v, h) => { agg[d][h] += v / n; })));
    return agg;
  }, [roomUtils]);

  // avg utilization overall
  const avgUtil = useMemoRM(() => {
    const flat = aggUtil.flat();
    return flat.reduce((s, v) => s + v, 0) / flat.length;
  }, [aggUtil]);

  // Peak hour
  const peakInfo = useMemoRM(() => {
    let best = { d: 0, h: 6, v: 0 };
    aggUtil.forEach((row, d) => row.forEach((v, h) => {
      if (v > best.v) best = { d, h: h + 6, v };
    }));
    return best;
  }, [aggUtil]);

  // Dead zones (hours with <15% avg util during business hours)
  const deadZones = useMemoRM(() => {
    const dead = [];
    aggUtil.forEach((row, d) => row.forEach((v, h) => {
      const hour = h + 6;
      if (hour >= 9 && hour <= 20 && v < 0.18) dead.push({ d, h: hour, v });
    }));
    return dead;
  }, [aggUtil]);

  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: adminTokens.orangeSoft,
          color: adminTokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <RM_Icon d={rmIcons.zap} size={16} stroke={2.2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.01em' }}>
            การใช้งานห้อง · สัปดาห์นี้
          </div>
          <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 2 }}>
            {mode === 'aggregate'
              ? `ค่าเฉลี่ยห้องทั้งหมด — เวลาที่เสียเปล่าคือโอกาส`
              : `ดูทีละห้อง · คลิกเพื่อเลือกห้อง`}
          </div>
        </div>

        {/* Mode switch */}
        <div style={{
          display: 'inline-flex', background: adminTokens.subtle,
          border: `1px solid ${adminTokens.border}`, borderRadius: 9, padding: 2,
        }}>
          {[
            { id: 'per-room', label: 'ทีละห้อง' },
            { id: 'aggregate', label: 'ภาพรวม' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              height: 28, padding: '0 12px', border: 0, borderRadius: 7, cursor: 'pointer',
              background: mode === m.id ? adminTokens.surface : 'transparent',
              color: mode === m.id ? adminTokens.black : adminTokens.muted,
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              boxShadow: mode === m.id ? adminTokens.shadowSm : 'none',
            }}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
      }}>
        <RmStat
          label="ใช้งานเฉลี่ย"
          value={`${Math.round(avgUtil * 100)}%`}
          sub="ของความจุทั้งหมด"
          color={adminTokens.orange}
          icon={rmIcons.trend}
        />
        <RmStat
          label="ช่วงพีค"
          value={`${rmDayLabels[peakInfo.d]} ${String(peakInfo.h).padStart(2,'0')}:00`}
          sub={`${Math.round(peakInfo.v * 100)}% เต็ม`}
          color={adminTokens.info}
          icon={rmIcons.zap}
        />
        <RmStat
          label="ช่วงว่าง"
          value={`${deadZones.length} ชั่วโมง`}
          sub="< 18% ใน 9:00-20:00"
          color={deadZones.length > 10 ? adminTokens.destr : adminTokens.success}
          icon={rmIcons.clock}
        />
      </div>

      {/* HEATMAP */}
      {mode === 'aggregate' ? (
        <RmHeatGrid
          util={aggUtil}
          color={adminTokens.orange}
          hoverCell={hoverCell} setHoverCell={setHoverCell}
          roomLabel="ทุกห้อง"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {roomUtils.map(r => (
            <div key={r.id} onClick={() => onSelectRoom(r.id)} style={{
              cursor: 'pointer', paddingBottom: 14,
              borderBottom: `1px dashed ${adminTokens.divider}`,
              outline: selectedRoomId === r.id ? `2px solid ${r.color}` : 'none',
              outlineOffset: 4, borderRadius: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, background: r.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RM_Icon d={getRoomIcon(r.icon)} size={14}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                                letterSpacing: '-.01em' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 10, color: adminTokens.muted }}>
                    {r.floor} · {r.capacity} คน · {r.classesThisWeek} คลาสสัปดาห์นี้
                  </div>
                </div>
                <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
                  ใช้งานเฉลี่ย{' '}
                  <span style={{ color: r.color, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(r.util.flat().reduce((s, v) => s + v, 0) / r.util.flat().length * 100)}%
                  </span>
                </div>
              </div>
              <RmHeatGrid
                util={r.util} color={r.color}
                hoverCell={hoverCell} setHoverCell={setHoverCell}
                roomLabel={r.name} compact
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RmStat = ({ label, value, sub, color, icon }) => (
  <div style={{
    padding: 12, background: adminTokens.subtle,
    border: `1px solid ${adminTokens.border}`, borderRadius: 10,
    display: 'flex', gap: 10, alignItems: 'center',
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: color + '20', color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <RM_Icon d={icon} size={15} stroke={2.2}/>
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black,
                    letterSpacing: '-.01em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1 }}>{sub}</div>
    </div>
  </div>
);

/* Just the cells grid */
const RmHeatGrid = ({ util, color, hoverCell, setHoverCell, roomLabel, compact }) => {
  const cellH = compact ? 16 : 22;
  return (
    <div style={{ position: 'relative' }}>
      {/* Hour labels top */}
      <div style={{ display: 'flex', paddingLeft: 28, gap: 2, marginBottom: 3 }}>
        {rmHourLabels.map(h => (
          <div key={h} style={{
            flex: 1, fontSize: 9, color: adminTokens.muted, fontWeight: 600,
            textAlign: 'center', fontVariantNumeric: 'tabular-nums',
          }}>
            {h % 3 === 0 ? h : ''}
          </div>
        ))}
      </div>

      {/* Day rows */}
      {util.map((row, d) => (
        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
          <div style={{
            width: 26, fontSize: 10, color: adminTokens.muted, fontWeight: 700,
            textAlign: 'right', paddingRight: 4,
          }}>{rmDayLabels[d]}</div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {row.map((v, h) => {
              const hour = h + 6;
              const isHovered = hoverCell?.day === d && hoverCell?.hour === hour;
              return (
                <div key={h}
                     onMouseEnter={() => setHoverCell({ day: d, hour })}
                     onMouseLeave={() => setHoverCell(null)}
                     style={{
                       flex: 1, height: cellH,
                       background: rmHeatColor(v, color),
                       borderRadius: 3, position: 'relative',
                       border: isHovered ? `1.5px solid ${color}` : `1px solid ${adminTokens.border}`,
                       transition: 'all .1s', cursor: 'pointer',
                     }}>
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: adminTokens.black, color: '#fff',
                      padding: '5px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,.3)',
                    }}>
                      <div style={{ opacity: .75, fontSize: 9 }}>{roomLabel}</div>
                      <div>{rmDayLabels[d]} {String(hour).padStart(2,'0')}:00 · {Math.round(v * 100)}%</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      {!compact && (
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end',
        }}>
          <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>ว่าง</span>
          <div style={{ display: 'flex', gap: 1 }}>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
              <div key={v} style={{
                width: 14, height: 10, background: rmHeatColor(v, color),
                border: `1px solid ${adminTokens.border}`, borderRadius: 2,
              }}/>
            ))}
          </div>
          <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>เต็ม</span>
        </div>
      )}
    </div>
  );
};

/* =============================================================
 *  ROOM CARD
 * =========================================================== */
const RoomCard = ({ room, onOpen, onEdit, onDelete, active }) => {
  const [hover, setHover] = useStateRM(false);
  const util = useMemoRM(() => rmGenUtil(room.id), [room.id]);
  const avg = Math.round(util.flat().reduce((s, v) => s + v, 0) / util.flat().length * 100);

  const totalEq = room.equipment.reduce((s, e) => s + e.qty, 0);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: adminTokens.surface,
        border: `1px solid ${active ? room.color : (hover ? room.color : adminTokens.border)}`,
        boxShadow: (hover || active) ? adminTokens.shadowMd : adminTokens.shadowSm,
        borderRadius: adminTokens.r3, padding: 16, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 12, position: 'relative',
        transition: 'all .15s',
      }}
    >
      {/* Color strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: room.color, borderRadius: '14px 14px 0 0',
      }}/>

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 50, height: 50, borderRadius: 12, background: room.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: `0 4px 12px ${room.color}40`,
        }}>
          <RM_Icon d={getRoomIcon(room.icon)} size={24}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black,
                        letterSpacing: '-.01em', lineHeight: 1.15 }}>
            {room.name}
          </div>
          <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2,
                        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <RM_Icon d={rmIcons.building} size={10}/> {room.floor}
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <RM_Icon d={rmIcons.ruler} size={10}/> {room.area}
            </span>
          </div>
        </div>

        {room.conflicts > 0 && (
          <div title={`${room.conflicts} conflicts`} style={{
            width: 22, height: 22, borderRadius: '50%', background: adminTokens.destr, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
          }}>!</div>
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 11, color: adminTokens.muted, lineHeight: 1.45,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        minHeight: 31,
      }}>{room.desc}</div>

      {/* Stats */}
      <div style={{
        background: adminTokens.subtle, borderRadius: 10, padding: '10px 12px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      }}>
        <RmStatMini label="ความจุ" value={`${room.capacity}`} sub="คน" fg={adminTokens.black}/>
        <RmStatMini label="คลาส/สัปดาห์" value={room.classesThisWeek} fg={room.color}/>
        <RmStatMini label="ใช้งาน" value={`${avg}%`} fg={avg > 60 ? adminTokens.success : avg > 35 ? adminTokens.warn : adminTokens.destr}/>
      </div>

      {/* Utilization mini strip (1-day avg) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                         textTransform: 'uppercase', letterSpacing: '.05em' }}>
            วันนี้ · ทุกชั่วโมง
          </span>
          <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600,
                         fontVariantNumeric: 'tabular-nums' }}>
            06 — 22
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {util[1].map((v, i) => (  // Monday as proxy
            <div key={i} style={{
              flex: 1, height: 14, background: rmHeatColor(v, room.color),
              borderRadius: 2, border: `1px solid ${adminTokens.border}`,
            }}/>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingTop: 10, borderTop: `1px dashed ${adminTokens.divider}`,
      }}>
        <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600,
                       display: 'flex', alignItems: 'center', gap: 4 }}>
          <RM_Icon d={rmIcons.layers} size={10}/>
          {totalEq} อุปกรณ์ · {room.equipment.length} ชนิด
        </span>
        <div style={{ flex: 1 }}/>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{
          height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
          border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
          color: adminTokens.black, fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <RM_Icon d={rmIcons.edit} size={10}/> แก้ไข
        </button>
      </div>
    </div>
  );
};

const RmStatMini = ({ label, value, sub, fg }) => (
  <div style={{ padding: '0 6px', textAlign: 'center',
                borderRight: `1px solid ${adminTokens.border}`,
                ...(sub ? {} : {}) }} className="rm-stat">
    <div style={{
      fontSize: 15, fontWeight: 800, color: fg,
      fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', lineHeight: 1.1,
    }}>
      {value}
      {sub && <span style={{ fontSize: 9, fontWeight: 600, color: adminTokens.muted, marginLeft: 2 }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 600, marginTop: 2,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {label}
    </div>
  </div>
);

/* =============================================================
 *  ROOM DETAIL DRAWER
 * =========================================================== */
const RoomDrawer = ({ room, onClose, onEdit }) => {
  const classes = RM_CLASSES[room.id] || [];
  const util = useMemoRM(() => rmGenUtil(room.id), [room.id]);
  const avg = Math.round(util.flat().reduce((s, v) => s + v, 0) / util.flat().length * 100);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 90,
        animation: 'rm-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, zIndex: 91,
        background: adminTokens.surface, boxShadow: '-20px 0 60px rgba(15,23,42,.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'rm-slide .25s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          background: `linear-gradient(135deg, ${room.color}, ${room.color})`,
          color: '#fff', display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', flexShrink: 0,
          }}>
            <RM_Icon d={getRoomIcon(room.icon)} size={28}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                          textTransform: 'uppercase' }}>
              {room.floor}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2 }}>
              {room.name}
            </div>
            <div style={{ fontSize: 12, opacity: .9, marginTop: 4, lineHeight: 1.45 }}>
              {room.desc}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0, flexShrink: 0,
            background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RM_Icon d={rmIcons.x} size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex',
                      flexDirection: 'column', gap: 20 }}>

          {room.conflicts > 0 && (
            <div style={{
              padding: '10px 12px', background: adminTokens.destrSoft,
              border: `1px solid ${adminTokens.destr}50`, borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: adminTokens.destr, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RM_Icon d={rmIcons.warn} size={15} stroke={2.2}/>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.destr }}>
                  พบความขัดแย้งตาราง {room.conflicts} รายการ
                </div>
                <div style={{ fontSize: 11, color: adminTokens.black, marginTop: 2 }}>
                  มี 2 คลาสจองห้องนี้ในช่วงเวลาเดียวกัน · ตรวจสอบตารางเรียน
                </div>
              </div>
            </div>
          )}

          {/* KPI grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          }}>
            <RmDrawerStat label="ความจุ"       value={room.capacity}          unit="คน"     color={room.color}/>
            <RmDrawerStat label="พื้นที่"       value={room.area}              unit=""        color={adminTokens.ink2}/>
            <RmDrawerStat label="คลาส/สัปดาห์"  value={room.classesThisWeek}   unit=""        color={adminTokens.info}/>
            <RmDrawerStat label="ใช้งานเฉลี่ย"  value={avg + '%'}              unit=""        color={avg > 60 ? adminTokens.success : adminTokens.warn}/>
          </div>

          {/* Heatmap */}
          <div>
            <RmSectionLabel>ใช้งานรายชั่วโมง · 7 วัน</RmSectionLabel>
            <RmHeatGrid util={util} color={room.color} hoverCell={null} setHoverCell={() => {}} roomLabel={room.name}/>
          </div>

          {/* Equipment */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <RmSectionLabel nom>อุปกรณ์ในห้อง</RmSectionLabel>
              <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
                {room.equipment.length} ชนิด · {room.equipment.reduce((s, e) => s + e.qty, 0)} ชิ้น
              </span>
            </div>
            <div style={{
              background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              {room.equipment.map((eq, i) => (
                <div key={eq.name} style={{
                  display: 'flex', alignItems: 'center', padding: '10px 12px',
                  borderBottom: i < room.equipment.length - 1 ? `1px solid ${adminTokens.border}` : 'none',
                  background: adminTokens.surface,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: room.color + '20',
                    color: room.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginRight: 10,
                  }}>
                    <RM_Icon d={rmIcons.layers} size={13}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: adminTokens.black }}>
                    {eq.name}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: adminTokens.black,
                    fontVariantNumeric: 'tabular-nums',
                    padding: '2px 10px', background: adminTokens.subtle,
                    border: `1px solid ${adminTokens.border}`, borderRadius: 6,
                  }}>
                    {eq.qty} ชิ้น
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming classes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <RmSectionLabel nom>คลาสในสัปดาห์</RmSectionLabel>
              <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
                {classes.length} คลาส
              </span>
            </div>
            {classes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {classes.map((c, i) => {
                  const pct = Math.round(c.booked / c.cap * 100);
                  const full = pct >= 95;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 9,
                      background: adminTokens.surface,
                      border: `1px solid ${adminTokens.border}`,
                    }}>
                      <div style={{
                        width: 44, textAlign: 'center', flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 700 }}>{c.day}</div>
                        <div style={{ fontSize: 13, color: adminTokens.black, fontWeight: 800,
                                      fontVariantNumeric: 'tabular-nums' }}>{c.time}</div>
                      </div>
                      <div style={{ width: 1, height: 30, background: adminTokens.border }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 11, color: adminTokens.muted }}>
                          {c.coach}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 800,
                                      color: full ? adminTokens.destr : adminTokens.black,
                                      fontVariantNumeric: 'tabular-nums' }}>
                          {c.booked}/{c.cap}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700,
                                      color: full ? adminTokens.destr : adminTokens.muted }}>
                          {full ? 'เต็ม' : `${pct}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: 20, textAlign: 'center', borderRadius: 9,
                background: adminTokens.subtle, border: `1px dashed ${adminTokens.border}`,
                fontSize: 12, color: adminTokens.muted, fontWeight: 600,
              }}>
                ยังไม่มีคลาสในห้องนี้สัปดาห์นี้
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          display: 'flex', gap: 8,
        }}>
          <button onClick={onClose} style={{
            flex: 1, height: 38, borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}>ปิด</button>
          <button onClick={onEdit} style={{
            flex: 1, height: 38, borderRadius: 9, cursor: 'pointer',
            border: 0, background: room.color, color: '#fff',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: `0 4px 12px ${room.color}60`,
          }}>
            <RM_Icon d={rmIcons.edit} size={12}/> แก้ไขห้อง
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rm-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rm-slide { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
};

const RmSectionLabel = ({ children, nom }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: adminTokens.muted,
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: nom ? 0 : 10,
  }}>{children}</div>
);

const RmDrawerStat = ({ label, value, unit, color }) => (
  <div style={{
    padding: 10, background: adminTokens.subtle, borderRadius: 9,
    border: `1px solid ${adminTokens.border}`, textAlign: 'center',
  }}>
    <div style={{
      fontSize: 16, fontWeight: 800, color, letterSpacing: '-.01em',
      fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
    }}>
      {value}
      {unit && <span style={{ fontSize: 10, color: adminTokens.muted, marginLeft: 2, fontWeight: 600 }}>{unit}</span>}
    </div>
    <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700, marginTop: 4,
                  textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {label}
    </div>
  </div>
);

/* =============================================================
 *  EDITOR MODAL
 * =========================================================== */
const RoomEditorModal = ({ room, onSave, onClose, onDelete }) => {
  const isNew = !room.id;
  const [name, setName]   = useStateRM(room.name || '');
  const [desc, setDesc]   = useStateRM(room.desc || '');
  const [color, setColor] = useStateRM(room.color || CT_COLOR_PRESETS[0].hex);
  const [icon, setIcon]   = useStateRM(room.icon || 'dumb');
  const [cap, setCap]     = useStateRM(room.capacity || 20);
  const [area, setArea]   = useStateRM(room.area || '');
  const [floor, setFloor] = useStateRM(room.floor || 'ชั้น 1');
  const [hours, setHours] = useStateRM(room.hours || '06:00 – 22:00');
  const [eq, setEq]       = useStateRM(room.equipment || []);

  const nameRef = useRefRM();
  useEffectRM(() => { nameRef.current?.focus(); }, []);

  const addEq = () => setEq(p => [...p, { name: '', qty: 1 }]);
  const removeEq = (i) => setEq(p => p.filter((_, j) => j !== i));
  const updateEq = (i, k, v) => setEq(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e));

  const canSave = name.trim().length > 0;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 100,
        animation: 'rm-fade .18s ease-out',
      }}/>
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 620, maxHeight: '90vh', zIndex: 101,
        background: adminTokens.surface, borderRadius: adminTokens.r4,
        boxShadow: '0 24px 60px rgba(15,23,42,.24)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'rm-pop .22s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          background: `linear-gradient(135deg, ${color}, ${color})`,
          color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RM_Icon d={getRoomIcon(icon)} size={26}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, letterSpacing: '.06em',
                          textTransform: 'uppercase' }}>
              {isNew ? 'เพิ่มห้องใหม่' : 'แก้ไขห้อง'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginTop: 2 }}>
              {name.trim() || 'ห้องใหม่'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0,
            background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RM_Icon d={rmIcons.x} size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex',
                      flexDirection: 'column', gap: 16 }}>
          {/* Name + floor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 10 }}>
            <div>
              <CtLabel>ชื่อห้อง <span style={{ color: adminTokens.destr }}>*</span></CtLabel>
              <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
                     placeholder="เช่น Studio A, Spin Room"
                     style={rmInputStyle(color)}
                     onFocus={e => e.target.style.borderColor = color}
                     onBlur={e => e.target.style.borderColor = adminTokens.border}/>
            </div>
            <div>
              <CtLabel>ชั้น</CtLabel>
              <select value={floor} onChange={e => setFloor(e.target.value)}
                      style={{ ...rmInputStyle(color), paddingRight: 24 }}>
                <option>ชั้น 1</option><option>ชั้น 2</option>
                <option>ชั้น 3</option><option>ชั้น 4</option>
              </select>
            </div>
          </div>

          {/* Desc */}
          <div>
            <CtLabel>คำอธิบาย</CtLabel>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder="เช่น สตูดิโอใหญ่ ใช้สำหรับคลาสกลุ่มใหญ่"
                      rows={2} maxLength={120}
                      style={{ ...rmInputStyle(color), height: 'auto', padding: '10px 12px',
                               resize: 'none', lineHeight: 1.5 }}/>
          </div>

          {/* Capacity + area + hours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <CtLabel>ความจุ</CtLabel>
              <div style={{ position: 'relative' }}>
                <input type="number" value={cap} onChange={e => setCap(Number(e.target.value))}
                       min="1" max="200" style={rmInputStyle(color)}
                       onFocus={e => e.target.style.borderColor = color}
                       onBlur={e => e.target.style.borderColor = adminTokens.border}/>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                               fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>คน</span>
              </div>
            </div>
            <div>
              <CtLabel>พื้นที่</CtLabel>
              <input value={area} onChange={e => setArea(e.target.value)}
                     placeholder="85 ตร.ม." style={rmInputStyle(color)}
                     onFocus={e => e.target.style.borderColor = color}
                     onBlur={e => e.target.style.borderColor = adminTokens.border}/>
            </div>
            <div>
              <CtLabel>เวลาเปิด</CtLabel>
              <input value={hours} onChange={e => setHours(e.target.value)}
                     placeholder="06:00 – 22:00" style={rmInputStyle(color)}
                     onFocus={e => e.target.style.borderColor = color}
                     onBlur={e => e.target.style.borderColor = adminTokens.border}/>
            </div>
          </div>

          {/* Color */}
          <div>
            <CtLabel>สีประจำห้อง</CtLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
              {CT_COLOR_PRESETS.map(c => (
                <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name} style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer', padding: 0,
                  background: c.hex, border: color === c.hex
                    ? `3px solid ${adminTokens.surface}` : `1.5px solid ${adminTokens.border}`,
                  boxShadow: color === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
                  position: 'relative', transition: 'all .1s',
                }}>
                  {color === c.hex && (
                    <span style={{ position: 'absolute', inset: 0, display: 'flex',
                                   alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <RM_Icon d={rmIcons.check} size={12} stroke={3}/>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <CtLabel>ไอคอน</CtLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
              {CT_ICON_PRESETS.slice(0, 20).map(i => (
                <button key={i.id} onClick={() => setIcon(i.id)} title={i.label} style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer', padding: 0,
                  background: icon === i.id ? color : adminTokens.surface,
                  color: icon === i.id ? '#fff' : adminTokens.muted,
                  border: `1.5px solid ${icon === i.id ? color : adminTokens.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RM_Icon d={i.path} size={15}/>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <CtLabel nom>อุปกรณ์ในห้อง</CtLabel>
              <button onClick={addEq} style={{
                height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${color}`, background: color + '15', color,
                fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <RM_Icon d={rmIcons.plus} size={11}/> เพิ่มอุปกรณ์
              </button>
            </div>
            {eq.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {eq.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input value={e.name} onChange={ev => updateEq(i, 'name', ev.target.value)}
                           placeholder="ชื่ออุปกรณ์"
                           style={{ ...rmInputStyle(color), flex: 1, height: 34 }}
                           onFocus={ev => ev.target.style.borderColor = color}
                           onBlur={ev => ev.target.style.borderColor = adminTokens.border}/>
                    <input type="number" value={e.qty} onChange={ev => updateEq(i, 'qty', Number(ev.target.value))}
                           placeholder="0" min="0"
                           style={{ ...rmInputStyle(color), width: 70, height: 34, textAlign: 'center' }}
                           onFocus={ev => ev.target.style.borderColor = color}
                           onBlur={ev => ev.target.style.borderColor = adminTokens.border}/>
                    <button onClick={() => removeEq(i)} style={{
                      width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
                      border: `1px solid ${adminTokens.border}`,
                      background: adminTokens.surface, color: adminTokens.destr,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <RM_Icon d={rmIcons.trash} size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 14, textAlign: 'center', borderRadius: 9,
                background: adminTokens.subtle, border: `1px dashed ${adminTokens.border}`,
                fontSize: 11, color: adminTokens.muted, fontWeight: 600,
              }}>
                ยังไม่มีอุปกรณ์ในห้องนี้
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${adminTokens.border}`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {!isNew && onDelete && (
            <button onClick={onDelete} style={{
              height: 36, padding: '0 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${adminTokens.destr}50`, background: adminTokens.destrSoft,
              color: adminTokens.destr, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <RM_Icon d={rmIcons.trash} size={12}/> ลบห้อง
            </button>
          )}
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={{
            height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
            color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          }}>ยกเลิก</button>
          <button
            onClick={() => canSave && onSave({
              ...room, name: name.trim(), desc, color, icon,
              capacity: cap, area, floor, hours, equipment: eq.filter(e => e.name.trim()),
            })}
            disabled={!canSave}
            style={{
              height: 36, padding: '0 18px', borderRadius: 9, cursor: canSave ? 'pointer' : 'not-allowed',
              border: 0, background: canSave ? color : adminTokens.border,
              color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              boxShadow: canSave ? `0 4px 12px ${color}60` : 'none',
              display: 'flex', alignItems: 'center', gap: 6, opacity: canSave ? 1 : 0.6,
            }}>
            <RM_Icon d={rmIcons.check} size={12} stroke={3}/>
            {isNew ? 'สร้างห้อง' : 'บันทึก'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rm-pop { from { opacity: 0; transform: translate(-50%,-48%) scale(.96); }
                            to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      `}</style>
    </>
  );
};

const rmInputStyle = (color) => ({
  width: '100%', height: 38, padding: '0 12px', borderRadius: 9,
  border: `1.5px solid ${adminTokens.border}`,
  background: adminTokens.surface, outline: 'none',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: adminTokens.black,
});

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const RoomsPage = () => {
  const [rooms, setRooms] = useStateRM(RM_ROOMS);
  const [openRoom, setOpenRoom] = useStateRM(null);
  const [editRoom, setEditRoom] = useStateRM(null); // room obj or {} for new
  const [query, setQuery] = useStateRM('');
  const [viewMode, setViewMode] = useStateRM('cards'); // 'cards' | 'heatmap'

  const filtered = useMemoRM(() => {
    if (!query.trim()) return rooms;
    const q = query.toLowerCase();
    return rooms.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.floor.includes(query)
    );
  }, [rooms, query]);

  const totalRooms = rooms.length;
  const totalCap = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalClasses = rooms.reduce((s, r) => s + r.classesThisWeek, 0);
  const totalConflicts = rooms.reduce((s, r) => s + r.conflicts, 0);

  const save = (room) => {
    if (room.id) {
      setRooms(p => p.map(r => r.id === room.id ? { ...r, ...room } : r));
    } else {
      const id = (room.name || 'room').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      setRooms(p => [...p, { ...room, id,
        classesThisWeek: 0, bookingsThisWeek: 0, conflicts: 0 }]);
    }
    setEditRoom(null);
  };

  const remove = (id) => {
    if (confirm('ลบห้องนี้? คลาสที่ใช้ห้องนี้จะต้องกำหนดห้องใหม่')) {
      setRooms(p => p.filter(r => r.id !== id));
      setEditRoom(null); setOpenRoom(null);
    }
  };

  return (
    <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14,
                  maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>
            ผังห้อง
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            {totalRooms} ห้อง · รวม {totalCap} คน · {totalClasses} คลาสสัปดาห์นี้
            {totalConflicts > 0 && (
              <span style={{ color: adminTokens.destr, fontWeight: 700, marginLeft: 8 }}>
                · ⚠ {totalConflicts} ขัดแย้ง
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setEditRoom({})} style={{
          height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
          background: adminTokens.orange, color: '#fff', border: 0,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, boxShadow: adminTokens.shadowOrange,
        }}>
          <RM_Icon d={rmIcons.plus} size={14}/> เพิ่มห้อง
        </button>
      </div>

      {/* Conflict banner */}
      {totalConflicts > 0 && (
        <div style={{
          padding: '12px 14px', background: adminTokens.destrSoft,
          border: `1px solid ${adminTokens.destr}50`, borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: adminTokens.destr, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RM_Icon d={rmIcons.warn} size={15} stroke={2.2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.destr }}>
              พบความขัดแย้งตาราง {totalConflicts} รายการ
            </div>
            <div style={{ fontSize: 11, color: adminTokens.black, marginTop: 2 }}>
              2+ คลาสจองห้องเดียวกันในเวลาเดียวกัน · เปิดห้องที่มี{' '}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 14, height: 14, borderRadius: '50%', background: adminTokens.destr,
                color: '#fff', fontSize: 10, fontWeight: 800, verticalAlign: 'middle',
              }}>!</span>{' '}เพื่อดูรายละเอียด
            </div>
          </div>
        </div>
      )}

      {/* HEATMAP HERO */}
      <RmHeatmap rooms={rooms} selectedRoomId={openRoom?.id} onSelectRoom={(id) => {
        setOpenRoom(rooms.find(r => r.id === id));
      }}/>

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
          <RM_Icon d={rmIcons.search} size={13}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="ค้นหาห้องหรือชั้น"
                 style={{
                   flex: 1, height: 32, border: 0, background: 'transparent', outline: 'none',
                   fontFamily: 'inherit', fontSize: 13, color: adminTokens.black,
                 }}/>
        </div>

        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>
          {filtered.length} ห้อง
        </div>
      </div>

      {/* Rooms grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map(r => (
          <RoomCard key={r.id} room={r}
                    active={openRoom?.id === r.id}
                    onOpen={() => setOpenRoom(r)}
                    onEdit={() => setEditRoom(r)}/>
        ))}
        {!query && (
          <button onClick={() => setEditRoom({})} style={{
            background: 'transparent', border: `2px dashed ${adminTokens.border}`,
            borderRadius: adminTokens.r3, padding: 16, minHeight: 280, cursor: 'pointer',
            fontFamily: 'inherit', color: adminTokens.muted,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = adminTokens.orange; e.currentTarget.style.color = adminTokens.orange; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.color = adminTokens.muted; }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: adminTokens.subtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RM_Icon d={rmIcons.plus} size={20} stroke={2.2}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>เพิ่มห้องใหม่</div>
            <div style={{ fontSize: 11, textAlign: 'center', maxWidth: 200, lineHeight: 1.4 }}>
              สร้างห้องเพิ่มพร้อมอุปกรณ์และความจุ
            </div>
          </button>
        )}
      </div>

      {/* Drawer */}
      {openRoom && (
        <RoomDrawer room={openRoom} onClose={() => setOpenRoom(null)}
                    onEdit={() => { setEditRoom(openRoom); setOpenRoom(null); }}/>
      )}

      {/* Editor */}
      {editRoom && (
        <RoomEditorModal room={editRoom} onSave={save} onClose={() => setEditRoom(null)}
                         onDelete={editRoom.id ? () => remove(editRoom.id) : null}/>
      )}
    </div>
  );
};

Object.assign(window, {
  RM_ROOMS, RM_CLASSES, rmGenUtil, RM_Icon, rmIcons, getRoomIcon, rmHeatColor,
  rmDayLabels, rmHourLabels, RmHeatmap, RmStat, RmHeatGrid,
  RoomCard, RmStatMini, RoomDrawer, RmSectionLabel, RmDrawerStat,
  RoomEditorModal, rmInputStyle, RoomsPage,
});
