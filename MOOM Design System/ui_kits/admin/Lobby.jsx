/* MOOM Admin — Lobby (live check-in view)
   Front-desk operator view: who's here, who's coming, quick check-in. */

const { useState: useStateL, useMemo: useMemoL, useEffect: useEffectL, useRef: useRefL } = React;

/* Icons */
const lIcons = {
  door:     <><path d="M4 4v16h12V4H4z"/><circle cx="13" cy="12" r="1"/><path d="M16 4h4v16h-4"/></>,
  scan:     <><path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/><path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
  search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  check:    <><polyline points="20 6 9 17 4 12"/></>,
  x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  alert:    <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  star:     <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  users:    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  arrow:    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  out:      <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  in:       <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
  bolt:     <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  dots:     <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  dumb:     <><path d="M14.4 14.4L9.6 9.6"/><path d="M18.657 21.485a2 2 0 01-2.829 0l-1.767-1.768a2 2 0 010-2.829l6.364-6.364a2 2 0 012.829 0l1.767 1.768a2 2 0 010 2.829z"/><path d="M2.343 10.657a2 2 0 012.829 0l1.767 1.768a2 2 0 010 2.829l-6.364 6.364"/><path d="M21.485 5.343a2 2 0 00-2.829 0l-6.364 6.364a2 2 0 000 2.829l1.767 1.768a2 2 0 002.829 0"/></>,
  heart:    <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  coffee:   <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>,
  crown:    <><path d="M2 20h20"/><path d="M5 20V9l4 3 3-6 3 6 4-3v11"/></>,
  bell:     <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
};

/* Live mock data — 22 guests, 8 incoming, 5 departed */
const LOBBY = {
  capacity: 120,
  zones: [
    { id: 'floor',  label: 'ฟิตเนสฟลอร์', cap: 60, color: adminTokens.orange, icon: lIcons.dumb },
    { id: 'studio1',label: 'Studio A',    cap: 24, color: adminTokens.info,   icon: lIcons.heart },
    { id: 'studio2',label: 'Studio B',    cap: 20, color: adminTokens.pink,   icon: lIcons.heart },
    { id: 'cafe',   label: 'คาเฟ่',        cap: 16, color: adminTokens.teal,   icon: lIcons.coffee },
  ],
  present: [
    { id: 1,  name: 'Korn Thanakit',       ini: 'KT', zone: 'floor',   since: '06:42', dur: 92,  pkg: 'Unlimited',   tier: 'gold', status: 'ok',    class: null, streak: 18 },
    { id: 2,  name: 'Pim Chaiwat',         ini: 'PC', zone: 'studio1', since: '07:48', dur: 26,  pkg: '10-Class',    tier: 'std',  status: 'ok',    class: 'HIIT 08:00', streak: 6 },
    { id: 3,  name: 'Nattaya Mongkon',     ini: 'NM', zone: 'floor',   since: '07:12', dur: 62,  pkg: 'PT Package',  tier: 'gold', status: 'pt',    class: 'w/ Coach Nok', streak: 41 },
    { id: 4,  name: 'Somchai Ruamsak',     ini: 'SR', zone: 'studio2', since: '07:55', dur: 19,  pkg: 'Yoga Pass',   tier: 'std',  status: 'ok',    class: 'Flow Yoga 08:00', streak: 3 },
    { id: 5,  name: 'Thanin Sriprasert',   ini: 'TS', zone: 'floor',   since: '07:30', dur: 44,  pkg: 'Unlimited',   tier: 'std',  status: 'expired', class: null, streak: 0 },
    { id: 6,  name: 'Napat Kongphop',      ini: 'NK', zone: 'floor',   since: '07:05', dur: 69,  pkg: 'Unlimited',   tier: 'gold', status: 'ok',    class: null, streak: 89 },
    { id: 7,  name: 'Supaporn Keaw',       ini: 'SK', zone: 'cafe',    since: '07:28', dur: 46,  pkg: 'Unlimited',   tier: 'std',  status: 'ok',    class: null, streak: 12 },
    { id: 8,  name: 'Urai Thanakit',       ini: 'UT', zone: 'floor',   since: '07:58', dur: 16,  pkg: '20-Class',    tier: 'std',  status: 'first', class: null, streak: 1 },
    { id: 9,  name: 'Boonrod Wichai',      ini: 'BW', zone: 'studio1', since: '07:52', dur: 22,  pkg: 'HIIT Pass',   tier: 'std',  status: 'ok',    class: 'HIIT 08:00', streak: 9 },
    { id: 10, name: 'Niran Ploytong',      ini: 'NP', zone: 'studio1', since: '07:50', dur: 24,  pkg: 'Unlimited',   tier: 'std',  status: 'ok',    class: 'HIIT 08:00', streak: 14 },
    { id: 11, name: 'Anong Prasertsak',    ini: 'AP', zone: 'floor',   since: '07:40', dur: 34,  pkg: 'Trial',       tier: 'trial',status: 'trial', class: null, streak: 1 },
    { id: 12, name: 'Wirat Phanich',       ini: 'WP', zone: 'studio2', since: '07:54', dur: 20,  pkg: 'Yoga Pass',   tier: 'std',  status: 'ok',    class: 'Flow Yoga 08:00', streak: 22 },
    { id: 13, name: 'Ton Srisuk',          ini: 'TS', zone: 'floor',   since: '07:22', dur: 52,  pkg: 'Unlimited',   tier: 'std',  status: 'ok',    class: null, streak: 7 },
    { id: 14, name: 'Siriporn Chai',       ini: 'SC', zone: 'studio2', since: '07:56', dur: 18,  pkg: 'Yoga Pass',   tier: 'std',  status: 'ok',    class: 'Flow Yoga 08:00', streak: 5 },
    { id: 15, name: 'Preecha Manop',       ini: 'PM', zone: 'floor',   since: '06:55', dur: 79,  pkg: 'Unlimited',   tier: 'gold', status: 'ok',    class: null, streak: 55 },
    { id: 16, name: 'Suda Wongsawat',      ini: 'SW', zone: 'cafe',    since: '07:18', dur: 56,  pkg: 'Unlimited',   tier: 'std',  status: 'ok',    class: null, streak: 11 },
    { id: 17, name: 'Chalermchai Yon',     ini: 'CY', zone: 'floor',   since: '07:44', dur: 30,  pkg: '10-Class',    tier: 'std',  status: 'ok',    class: null, streak: 4 },
  ],
  incoming: [
    { id: 101, name: 'Pranee Somchai',      ini: 'PS', eta: 4,  forClass: 'Pilates 09:00',  pkg: 'Pilates Pass', tier: 'std',   firstVisit: false },
    { id: 102, name: 'Arthit Kornpong',     ini: 'AK', eta: 8,  forClass: 'Pilates 09:00',  pkg: 'Unlimited',     tier: 'gold',  firstVisit: false },
    { id: 103, name: 'Malee Watana',        ini: 'MW', eta: 12, forClass: 'Spin 09:30',     pkg: 'Trial Week',    tier: 'trial', firstVisit: true  },
    { id: 104, name: 'Kittipong Rattana',   ini: 'KR', eta: 18, forClass: 'PT 09:30',       pkg: 'PT Package',    tier: 'gold',  firstVisit: false },
    { id: 105, name: 'Wichai Sriprasert',   ini: 'WS', eta: 22, forClass: 'Spin 09:30',     pkg: 'Unlimited',     tier: 'std',   firstVisit: false },
  ],
  departed: [
    { id: 201, name: 'Prasert Chaiya',      ini: 'PC', left: '07:55', dur: 89,  zone: 'floor'   },
    { id: 202, name: 'Nida Thong',          ini: 'NT', left: '07:52', dur: 62,  zone: 'studio1' },
    { id: 203, name: 'Vichit Bunma',        ini: 'VB', left: '07:48', dur: 74,  zone: 'floor'   },
    { id: 204, name: 'Ratree Srisuk',       ini: 'RS', left: '07:40', dur: 55,  zone: 'cafe'    },
  ],
  alerts: [
    { id: 'a1', kind: 'expired', name: 'Thanin Sriprasert', detail: 'แพ็คเกจหมดอายุเมื่อ 18 วันก่อน', action: 'ต่ออายุ' },
    { id: 'a2', kind: 'trial',   name: 'Anong Prasertsak',  detail: 'Trial วันที่ 6/7 — พร้อมอัพเกรด', action: 'เสนอแพ็คเกจ' },
    { id: 'a3', kind: 'vip',     name: 'Napat Kongphop',    detail: 'VIP Gold · streak 89 วัน',        action: 'ทักทาย' },
    { id: 'a4', kind: 'first',   name: 'Urai Thanakit',     detail: 'มาครั้งแรก — ทัวร์ต้องการ',       action: 'เริ่มทัวร์' },
  ],
  recent: [
    { t: '08:02', kind: 'checkin', name: 'Chalermchai Yon' },
    { t: '08:01', kind: 'checkin', name: 'Siriporn Chai' },
    { t: '08:00', kind: 'class',   name: 'HIIT 08:00 เริ่ม' },
    { t: '07:58', kind: 'checkin', name: 'Urai Thanakit' },
    { t: '07:56', kind: 'checkin', name: 'Wirat Phanich' },
    { t: '07:55', kind: 'checkout',name: 'Prasert Chaiya' },
    { t: '07:54', kind: 'checkin', name: 'Boonrod Wichai' },
    { t: '07:52', kind: 'checkout',name: 'Nida Thong' },
  ],
};

/* Primitives with L-prefix */
const LIcon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const LPill = ({ children, color = adminTokens.muted, bg }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', borderRadius: 9999, fontSize: 10,
    fontWeight: 700, whiteSpace: 'nowrap', background: bg, color,
  }}>{children}</span>
);
const LBtn = ({ children, icon, primary, danger, small, ghost, onClick }) => {
  const h = small ? 28 : 34;
  const p = small ? '0 10px' : '0 14px';
  let bg, color, border;
  if (primary)      { bg = adminTokens.orange; color = '#fff'; border = 0; }
  else if (danger)  { bg = adminTokens.surface; color = adminTokens.destr; border = `1px solid ${adminTokens.border}`; }
  else if (ghost)   { bg = 'transparent'; color = adminTokens.muted; border = 0; }
  else              { bg = adminTokens.surface; color = adminTokens.black; border = `1px solid ${adminTokens.border}`; }
  return (
    <button onClick={onClick} style={{
      background: bg, color, border, height: h, padding: p, borderRadius: adminTokens.r2,
      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      boxShadow: primary ? adminTokens.shadowOrange : 'none',
    }}>
      {icon && <LIcon d={icon} size={12} stroke={2.2}/>} {children}
    </button>
  );
};
const LCard = ({ title, subtitle, action, children, pad = 14, accent }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }}>
    {accent && <div style={{ height: 3, background: accent }}/>}
    {title && (
      <div style={{
        padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${adminTokens.divider}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    <div style={{ padding: pad, flex: 1 }}>{children}</div>
  </div>
);

const Avatar = ({ ini, tier = 'std', size = 32, showStatus }) => {
  const bgMap = {
    gold:  { bg: '#fef3c7', fg: '#92400e' },
    std:   { bg: adminTokens.orangeSoft, fg: adminTokens.orange },
    trial: { bg: '#dbeafe', fg: '#1e40af' },
  };
  const { bg, fg } = bgMap[tier];
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, color: fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 800,
      }}>{ini}</div>
      {tier === 'gold' && (
        <div style={{
          position: 'absolute', top: -3, right: -3, background: '#fbbf24',
          width: 14, height: 14, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', border: '2px solid #fff',
        }}>
          <LIcon d={lIcons.crown} size={7} stroke={2.5}/>
        </div>
      )}
    </div>
  );
};

/* ============ LIVE HERO — big occupancy + quick stats ============ */
const LobbyHero = ({ now }) => {
  const L = LOBBY;
  const pct = Math.round((L.present.length / L.capacity) * 100);
  const checkinsToday = 87;
  const noShows = 4;
  const classSoon = 'HIIT 08:00';

  return (
    <div style={{
      background: `linear-gradient(135deg, ${adminTokens.black} 0%, #1a1a1a 100%)`,
      borderRadius: adminTokens.r3, padding: 22,
      display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr', gap: 24,
      color: '#fff', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 300, height: 300,
        background: `radial-gradient(circle, ${adminTokens.orange}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      {/* Occupancy */}
      <div style={{ position: 'relative', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, whiteSpace: 'nowrap' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: adminTokens.success, flexShrink: 0,
            animation: 'lobby-pulse 1.6s ease-in-out infinite',
          }}/>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                          textTransform: 'uppercase', color: '#fff', opacity: .75,
                          whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            สด · {now}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#fff', opacity: .7, fontWeight: 600 }}>
          อยู่ในสถานที่ตอนนี้
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#fff',
                        letterSpacing: '-.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {L.present.length}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', opacity: .5 }}>
            / {L.capacity}
          </div>
        </div>
        <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,.1)',
                      borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${adminTokens.orange}, #ff8a4c)`,
            borderRadius: 9999,
          }}/>
        </div>
        <div style={{ fontSize: 11, color: '#fff', opacity: .6, marginTop: 6, fontWeight: 600 }}>
          {pct}% ความจุ · พีคเวลา 18:30 (คาดการณ์)
        </div>
      </div>

      {/* Check-ins today */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,.1)', paddingLeft: 24, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#fff', opacity: .55, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.08em' }}>
          เช็คอินวันนี้
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff',
                      letterSpacing: '-.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
          {checkinsToday}
        </div>
        <div style={{ fontSize: 11, color: adminTokens.success, fontWeight: 700, marginTop: 2 }}>
          +12% vs ค่าเฉลี่ย
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 3, alignItems: 'flex-end', height: 32 }}>
          {[4,6,9,8,11,13,15,12,9].map((v, i) => (
            <div key={i} style={{
              flex: 1, height: `${(v/15)*100}%`,
              background: i >= 6 ? adminTokens.orange : 'rgba(255,255,255,.25)',
              borderRadius: '2px 2px 0 0', minHeight: 3,
            }}/>
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#fff', opacity: .4, marginTop: 4,
                      display: 'flex', justifyContent: 'space-between' }}>
          <span>6a</span><span>10a</span><span>2p</span><span>6p</span><span>10p</span>
        </div>
      </div>

      {/* No-shows */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,.1)', paddingLeft: 24, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#fff', opacity: .55, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.08em' }}>
          ไม่มา (no-show)
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff',
                      letterSpacing: '-.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
          {noShows}
        </div>
        <div style={{ fontSize: 11, color: '#fff', opacity: .5, fontWeight: 600, marginTop: 2 }}>
          จาก 91 จอง · 4.4%
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          {[
            { name: 'Sarawut K.', class: 'Spin 07:30' },
            { name: 'Malee T.',   class: 'Yoga 07:00' },
            { name: 'Kosin P.',   class: 'HIIT 08:00' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
                                   fontSize: 11, color: '#fff', opacity: .75, whiteSpace: 'nowrap' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: adminTokens.destr, flexShrink: 0 }}/>
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
              <span style={{ opacity: .6, overflow: 'hidden', textOverflow: 'ellipsis' }}>· {r.class}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next class */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,.1)', paddingLeft: 24, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#fff', opacity: .55, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.08em' }}>
          คลาสถัดไป
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff',
                      letterSpacing: '-.01em', marginTop: 6 }}>
          {classSoon}
        </div>
        <div style={{ fontSize: 11, color: '#fff', opacity: .7, fontWeight: 600, marginTop: 2 }}>
          Studio A · Coach Nok · <span style={{ color: adminTokens.orange }}>เริ่มใน 12 นาที</span>
        </div>
        <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,.06)',
                      borderRadius: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>18/24</div>
              <div style={{ fontSize: 10, color: '#fff', opacity: .6, marginTop: 2, whiteSpace: 'nowrap' }}>ลงทะเบียน</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.success, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>3</div>
              <div style={{ fontSize: 10, color: '#fff', opacity: .6, marginTop: 2, whiteSpace: 'nowrap' }}>เช็คอินแล้ว</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.warn, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>15</div>
              <div style={{ fontSize: 10, color: '#fff', opacity: .6, marginTop: 2, whiteSpace: 'nowrap' }}>รอ</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes lobby-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.3)}}`}</style>
    </div>
  );
};

/* ============ CHECK-IN COMPOSER ============ */
const CheckInComposer = ({ onPick }) => {
  const [q, setQ] = useStateL('');
  const matches = useMemoL(() => {
    if (!q.trim()) return [];
    const lc = q.toLowerCase();
    return [
      { ini: 'PS', name: 'Pranee Somchai', pkg: 'Pilates Pass · 4 คลาส เหลือ', tier: 'std',   next: 'Pilates 09:00' },
      { ini: 'PK', name: 'Pongchai Kraivichien', pkg: 'Unlimited · หมดอายุ 12 ก.พ.', tier: 'gold', next: null },
      { ini: 'PM', name: 'Pim Malivan', pkg: '10-Class · 7 ครั้ง เหลือ', tier: 'std', next: null },
    ].filter(m => m.name.toLowerCase().includes(lc));
  }, [q]);

  return (
    <LCard accent={adminTokens.orange}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: adminTokens.orangeSoft, color: adminTokens.orange,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><LIcon d={lIcons.in} size={16} stroke={2.2}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black }}>เช็คอินด่วน</div>
          <div style={{ fontSize: 11, color: adminTokens.muted }}>สแกน QR หรือค้นหาสมาชิก</div>
        </div>
        <LBtn small icon={lIcons.scan} primary>สแกน QR</LBtn>
      </div>

      <div style={{
        height: 44, padding: '0 14px', border: `1.5px solid ${q ? adminTokens.orange : adminTokens.border}`,
        borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
        background: adminTokens.surface, transition: 'border-color .15s',
      }}>
        <LIcon d={lIcons.search} size={15} stroke={2.2}/>
        <input value={q} onChange={e => setQ(e.target.value)}
               placeholder="พิมพ์ชื่อ เบอร์ หรือรหัสสมาชิก..." style={{
          border: 0, outline: 'none', flex: 1, fontSize: 14, fontFamily: 'inherit',
          color: adminTokens.black, background: 'transparent', fontWeight: 600,
        }}/>
        {q && <button onClick={() => setQ('')} style={{
          background: 'transparent', border: 0, color: adminTokens.mutedLight, cursor: 'pointer',
          width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><LIcon d={lIcons.x} size={14}/></button>}
      </div>

      {matches.length > 0 && (
        <div style={{
          marginTop: 8, border: `1px solid ${adminTokens.border}`, borderRadius: 10,
          overflow: 'hidden', background: adminTokens.surface, boxShadow: adminTokens.shadowMd,
        }}>
          {matches.map((m, i) => (
            <div key={i} onClick={() => { onPick?.(m); setQ(''); }} style={{
              padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: i === matches.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = adminTokens.subtle}
            onMouseLeave={e => e.currentTarget.style.background = adminTokens.surface}>
              <Avatar ini={m.ini} tier={m.tier} size={34}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{m.name}</div>
                <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{m.pkg}</div>
              </div>
              {m.next && <LPill color={adminTokens.info} bg={adminTokens.infoSoft}>→ {m.next}</LPill>}
              <LBtn small primary icon={lIcons.check}>เช็คอิน</LBtn>
            </div>
          ))}
        </div>
      )}

      {!q && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
          {[
            { icon: lIcons.plus,  label: 'สมาชิกใหม่' },
            { icon: lIcons.users, label: 'กลุ่ม / แขก' },
            { icon: lIcons.bolt,  label: 'Drop-in' },
          ].map((a, i) => (
            <button key={i} style={{
              height: 38, border: `1px solid ${adminTokens.border}`, borderRadius: 10,
              background: adminTokens.surface, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, color: adminTokens.black,
            }}>
              <LIcon d={a.icon} size={13} stroke={2.2}/> {a.label}
            </button>
          ))}
        </div>
      )}
    </LCard>
  );
};

/* ============ ALERTS STRIP ============ */
const AlertsStrip = () => {
  const alertMap = {
    expired: { c: adminTokens.destr,   bg: adminTokens.destrSoft,   icon: lIcons.alert, label: 'ต้องต่ออายุ' },
    trial:   { c: adminTokens.info,    bg: adminTokens.infoSoft,    icon: lIcons.star,  label: 'Trial' },
    vip:     { c: '#ca8a04',           bg: '#fef3c7',               icon: lIcons.crown, label: 'VIP' },
    first:   { c: adminTokens.success, bg: adminTokens.successSoft, icon: lIcons.heart, label: 'มาครั้งแรก' },
  };
  return (
    <LCard title="ต้องใส่ใจ" subtitle={`${LOBBY.alerts.length} เรื่องที่ต้องทำตอนนี้`}
           action={<LBtn small ghost>ดูทั้งหมด</LBtn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LOBBY.alerts.map(a => {
          const m = alertMap[a.kind];
          return (
            <div key={a.id} style={{
              padding: '10px 12px', borderRadius: 10, display: 'flex',
              alignItems: 'center', gap: 10, background: m.bg,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: '#fff',
                color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><LIcon d={m.icon} size={13} stroke={2.2}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.name}
                  </span>
                  <LPill color={m.c} bg="#fff">{m.label}</LPill>
                </div>
                <div style={{ fontSize: 11, color: adminTokens.ink2, marginTop: 1,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.detail}
                </div>
              </div>
              <button style={{
                height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
                border: 0, background: adminTokens.black, color: '#fff',
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>{a.action}</button>
            </div>
          );
        })}
      </div>
    </LCard>
  );
};

/* ============ ZONE OCCUPANCY ============ */
const ZoneOccupancyCard = () => {
  const L = LOBBY;
  const byZone = L.zones.map(z => ({
    ...z,
    count: L.present.filter(p => p.zone === z.id).length,
    pct: (L.present.filter(p => p.zone === z.id).length / z.cap) * 100,
  }));
  return (
    <LCard title="ความหนาแน่นตามโซน" subtitle="ตอนนี้" >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {byZone.map(z => (
          <div key={z.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: z.color.replace(')', ' / 0.14)'), color: z.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><LIcon d={z.icon} size={12} stroke={2.2}/></div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
                {z.label}
              </div>
              <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums',
                            color: adminTokens.black, fontWeight: 700 }}>
                <span style={{ color: z.color }}>{z.count}</span>
                <span style={{ color: adminTokens.mutedLight, fontWeight: 600 }}> / {z.cap}</span>
              </div>
            </div>
            <div style={{ height: 6, background: adminTokens.subtle, borderRadius: 9999,
                          overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, z.pct)}%`, height: '100%',
                background: z.pct > 85 ? adminTokens.destr : z.color,
                borderRadius: 9999, transition: 'width .3s',
              }}/>
            </div>
          </div>
        ))}
      </div>
    </LCard>
  );
};

/* ============ PRESENT LIST — grouped by zone ============ */
const PresentList = () => {
  const [view, setView] = useStateL('grid'); // grid | list
  const [filterZone, setFilterZone] = useStateL('all');
  const [q, setQ] = useStateL('');

  const statusMap = {
    ok:      { label: 'ปกติ',    fg: adminTokens.success, bg: adminTokens.successSoft },
    pt:      { label: 'PT',       fg: adminTokens.info,    bg: adminTokens.infoSoft },
    expired: { label: 'หมดอายุ',  fg: adminTokens.destr,   bg: adminTokens.destrSoft },
    first:   { label: 'ครั้งแรก', fg: '#be185d',           bg: '#fce7f3' },
    trial:   { label: 'Trial',    fg: '#1e40af',           bg: '#dbeafe' },
  };

  const filtered = useMemoL(() => LOBBY.present.filter(p => {
    if (filterZone !== 'all' && p.zone !== filterZone) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [filterZone, q]);

  const zones = [{ id: 'all', label: 'ทั้งหมด', count: LOBBY.present.length }, ...LOBBY.zones.map(z => ({
    id: z.id, label: z.label, count: LOBBY.present.filter(p => p.zone === z.id).length, color: z.color,
  }))];

  return (
    <LCard
      title={`อยู่ในสถานที่ (${filtered.length})`}
      subtitle="อัปเดตเรียลไทม์"
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle, borderRadius: 8 }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                width: 28, height: 24, border: 0, cursor: 'pointer', borderRadius: 5,
                background: view === v ? adminTokens.surface : 'transparent',
                color: view === v ? adminTokens.black : adminTokens.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: view === v ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              }}>
                <LIcon d={v === 'grid' ? (<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>) : (<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>)} size={13}/>
              </button>
            ))}
          </div>
        </div>
      } pad={0}>

      {/* Filter bar */}
      <div style={{
        padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {zones.map(z => (
            <button key={z.id} onClick={() => setFilterZone(z.id)} style={{
              height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
              border: 0, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              background: filterZone === z.id ? adminTokens.surface : 'transparent',
              color: filterZone === z.id ? adminTokens.black : adminTokens.muted,
              boxShadow: filterZone === z.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
            }}>
              {z.color && <div style={{ width: 6, height: 6, borderRadius: 2, background: z.color }}/>}
              {z.label}
              <span style={{ fontSize: 10, color: adminTokens.mutedLight, fontWeight: 800 }}>{z.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{
          height: 26, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
          background: adminTokens.surface, minWidth: 160,
        }}>
          <LIcon d={lIcons.search} size={11} stroke={2.2}/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหา..."
                 style={{ border: 0, outline: 'none', fontSize: 11, fontFamily: 'inherit',
                          flex: 1, background: 'transparent' }}/>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{
          padding: 12,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10,
        }}>
          {filtered.map(p => {
            const s = statusMap[p.status];
            const zone = LOBBY.zones.find(z => z.id === p.zone);
            return (
              <div key={p.id} style={{
                padding: 10, border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                background: adminTokens.surface, display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .15s', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = adminTokens.shadowSm;
                                   e.currentTarget.style.borderColor = zone.color.replace(')', ' / 0.4)'); }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none';
                                   e.currentTarget.style.borderColor = adminTokens.border; }}>
                <Avatar ini={p.ini} tier={p.tier} size={34}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name.split(' ')[0]} {p.name.split(' ')[1]?.[0]}.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: zone.color }}/>
                    <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>{zone.label}</span>
                    <span style={{ fontSize: 10, color: adminTokens.mutedLight }}>· {p.dur}m</span>
                  </div>
                </div>
                {p.status !== 'ok' && <LPill color={s.fg} bg={s.bg}>{s.label}</LPill>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {filtered.map((p, i) => {
            const s = statusMap[p.status];
            const zone = LOBBY.zones.find(z => z.id === p.zone);
            return (
              <div key={p.id} style={{
                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
              }}>
                <Avatar ini={p.ini} tier={p.tier} size={36}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                                   whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </span>
                    {p.streak > 10 && (
                      <LPill color="#ea580c" bg="#ffedd5">🔥 {p.streak}d</LPill>
                    )}
                    {p.tier === 'gold' && <LPill color="#92400e" bg="#fef3c7">VIP</LPill>}
                    <LPill color={s.fg} bg={s.bg}>{s.label}</LPill>
                  </div>
                  <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {zone.label} · {p.pkg} {p.class && `· ${p.class}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: adminTokens.mutedLight }}>เข้า {p.since}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                                fontVariantNumeric: 'tabular-nums' }}>{p.dur} นาที</div>
                </div>
                <button style={{
                  width: 28, height: 28, border: `1px solid ${adminTokens.border}`,
                  borderRadius: 6, background: adminTokens.surface, cursor: 'pointer',
                  color: adminTokens.muted, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}><LIcon d={lIcons.out} size={12} stroke={2.2}/></button>
              </div>
            );
          })}
        </div>
      )}
    </LCard>
  );
};

/* ============ INCOMING & DEPARTED ============ */
const IncomingCard = () => {
  return (
    <LCard title="กำลังมา" subtitle="30 นาทีถัดไป" accent={adminTokens.info}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LOBBY.incoming.map(p => (
          <div key={p.id} style={{
            padding: '8px 10px', borderRadius: 8, display: 'flex',
            alignItems: 'center', gap: 10, background: adminTokens.subtle,
          }}>
            <Avatar ini={p.ini} tier={p.tier} size={30}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                               whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </span>
                {p.firstVisit && <LPill color="#be185d" bg="#fce7f3">ใหม่</LPill>}
              </div>
              <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 1,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.forClass}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.info,
                            fontVariantNumeric: 'tabular-nums' }}>
                {p.eta}m
              </div>
              <div style={{ fontSize: 9, color: adminTokens.mutedLight, fontWeight: 700,
                             letterSpacing: '.08em', textTransform: 'uppercase' }}>ETA</div>
            </div>
          </div>
        ))}
      </div>
    </LCard>
  );
};

const ActivityFeed = () => {
  const kindMap = {
    checkin: { icon: lIcons.in,  c: adminTokens.success, label: 'เข้า' },
    checkout:{ icon: lIcons.out, c: adminTokens.muted,   label: 'ออก' },
    class:   { icon: lIcons.bolt,c: adminTokens.orange,  label: 'คลาส' },
  };
  return (
    <LCard title="ประวัติสด" subtitle="กิจกรรมล่าสุด">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {LOBBY.recent.map((r, i) => {
          const k = kindMap[r.kind];
          return (
            <div key={i} style={{
              padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: i === LOBBY.recent.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: k.c.replace(')', ' / 0.14)'), color: k.c,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><LIcon d={k.icon} size={11} stroke={2.2}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: adminTokens.black,
                               whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.name}
                </div>
              </div>
              <div style={{ fontSize: 10, color: adminTokens.mutedLight, fontWeight: 700,
                             fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {r.t}
              </div>
            </div>
          );
        })}
      </div>
    </LCard>
  );
};

/* ============ PAGE SHELL ============ */
const LobbyPageV2 = () => {
  const [now, setNow] = useStateL(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  });
  useEffectL(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 14,
      maxWidth: 1440, margin: '0 auto',
    }}>
      <LobbyHero now={now}/>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <CheckInComposer/>
        <AlertsStrip/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <PresentList/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ZoneOccupancyCard/>
          <IncomingCard/>
          <ActivityFeed/>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LobbyPageV2, LOBBY });
