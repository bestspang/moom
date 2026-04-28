/* MOOM Admin — Gamification page
   Operator view of the member gamification system:
   - Health hero: is it working?
   - Tabs: Overview / Tiers / Quests / Badges / Rewards / Leaderboard
   All interactive pieces use local state. Pure SVG charts. */

const { useState: useStateG, useMemo: useMemoG, useEffect: useEffectG } = React;

/* ---------- Tier ladder (6 tiers, matches repo TIER_CONFIG) ---------- */
const TIERS = [
  { id: 'starter',   label: 'Starter',   color: 'hsl(220 10% 60%)', min: 0,    max: 199,   icon: '◦' },
  { id: 'regular',   label: 'Regular',   color: 'hsl(25 80% 50%)',  min: 200,  max: 599,   icon: '◆' },
  { id: 'dedicated', label: 'Dedicated', color: 'hsl(210 70% 55%)', min: 600,  max: 1499,  icon: '◈' },
  { id: 'elite',     label: 'Elite',     color: 'hsl(280 65% 55%)', min: 1500, max: 3499,  icon: '✦' },
  { id: 'champion',  label: 'Champion',  color: 'hsl(38 92% 50%)',  min: 3500, max: 6999,  icon: '★' },
  { id: 'legend',    label: 'Legend',    color: 'hsl(45 93% 47%)',  min: 7000, max: null,  icon: '♛' },
];

/* Icons specific to Gamification */
const gIcons = {
  flame:   <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  zap:     <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  crown:   <><path d="M2 20h20M5 20l-2-9 5 3 4-8 4 8 5-3-2 9"/></>,
  medal:   <><circle cx="12" cy="15" r="6"/><path d="M8 10L5 3h14l-3 7"/></>,
  target:  <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  coin:    <><circle cx="12" cy="12" r="10"/><path d="M12 7v10M9 10h4.5a1.5 1.5 0 110 3H9h5a1.5 1.5 0 110 3H9"/></>,
  gift:    <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter:  <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  play:    <><polygon points="5 3 19 12 5 21 5 3"/></>,
  pause:   <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  up:      <><polyline points="18 15 12 9 6 15"/></>,
  down:    <><polyline points="6 9 12 15 18 9"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  chart:   <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></>,
  users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
};

/* ---------- Primitives ---------- */
const GCard = ({ title, subtitle, action, children, pad = 16, minH }) => (
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

const GPill = ({ children, color = adminTokens.muted, bg, strong }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 9999,
    fontSize: 11, fontWeight: strong ? 800 : 700, letterSpacing: '.02em',
    background: bg || `${color} / 0.12`, color,
    whiteSpace: 'nowrap',
  }}>{children}</span>
);

const GDelta = ({ v, suffix = '%' }) => {
  const up = v >= 0;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 9999,
      display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
      color: up ? adminTokens.success : adminTokens.destr,
      background: up ? adminTokens.successSoft : adminTokens.destrSoft,
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{transform: up?'none':'rotate(180deg)'}}>
        <polyline points="6 15 12 9 18 15"/>
      </svg>
      {up ? '+' : ''}{v}{suffix}
    </span>
  );
};

const GIcon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const GChip = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{
    height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
    border: 0, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    background: active ? adminTokens.surface : 'transparent',
    color: active ? adminTokens.black : adminTokens.muted,
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
    display: 'flex', alignItems: 'center', gap: 6,
  }}>{children}</button>
);

const GButton = ({ children, icon, primary, danger, ghost, onClick, small }) => {
  const h = small ? 30 : 36;
  const p = small ? '0 10px' : '0 14px';
  let bg, color, border;
  if (primary) { bg = adminTokens.orange; color = '#fff'; border = 0; }
  else if (danger) { bg = adminTokens.surface; color = adminTokens.destr; border = `1px solid ${adminTokens.border}`; }
  else if (ghost) { bg = 'transparent'; color = adminTokens.muted; border = 0; }
  else { bg = adminTokens.surface; color = adminTokens.black; border = `1px solid ${adminTokens.border}`; }
  return (
    <button onClick={onClick} style={{
      background: bg, color, border, height: h, padding: p, borderRadius: adminTokens.r2,
      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      boxShadow: primary ? adminTokens.shadowOrange : 'none',
    }}>
      {icon && <GIcon d={icon} size={13} stroke={2.2}/>} {children}
    </button>
  );
};

/* Sparkline */
const GSpark = ({ series, w = 80, h = 24, color = adminTokens.orange }) => {
  if (!series || !series.length) return null;
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
 *  HEALTH HERO — big, answers "is this working?"
 * =========================================================== */
const GamiHero = () => {
  const stats = [
    { label: 'สมาชิกที่เข้าร่วม', value: '184', sub: 'จาก 247 (74%)', delta: 8,  color: adminTokens.teal,    spark: [120,135,142,148,160,170,178,184] },
    { label: 'XP ที่มอบวันนี้',   value: '12,840', sub: '⚡ เฉลี่ย 69/คน', delta: 12, color: adminTokens.orange, spark: [8000,9200,10100,10800,11400,11900,12300,12840] },
    { label: 'อัตราแลก RP',      value: '68%',   sub: '68 / 100 RP ใช้งาน', delta: 4, color: adminTokens.info,  spark: [58,60,61,64,65,66,67,68] },
    { label: 'Quest สำเร็จ',      value: '347',   sub: '7 quest ใช้งาน',    delta: -3, color: adminTokens.pink,  spark: [380,395,410,400,385,372,360,347] },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 16, boxShadow: adminTokens.shadowSm,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ fontSize: 12, color: adminTokens.muted, fontWeight: 600 }}>{s.label}</div>
            <GDelta v={s.delta}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 3 }}>{s.sub}</div>
            </div>
            <GSpark series={s.spark} color={s.color}/>
          </div>
        </div>
      ))}
    </div>
  );
};

/* =============================================================
 *  SYSTEM HEALTH STRIP — rule coverage + quick toggles
 * =========================================================== */
const GamiSystemStrip = ({ enabled, setEnabled }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    padding: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 0 4px',
      borderRight: `1px solid ${adminTokens.divider}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: adminTokens.orange,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><GIcon d={gIcons.flame} size={17}/></div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black }}>ระบบ Gamification</div>
        <div style={{ fontSize: 11, color: adminTokens.muted }}>
          เปิดใช้งานอยู่ · {enabled ? 'กำลังทำงาน' : 'หยุดชั่วคราว'}
        </div>
      </div>
    </div>

    {/* Inline rule counters */}
    {[
      { label: 'XP Rules',   value: 12, icon: gIcons.zap,   fg: adminTokens.orange },
      { label: 'Quests',     value: 7,  icon: gIcons.target,fg: adminTokens.info },
      { label: 'Badges',     value: 24, icon: gIcons.medal, fg: adminTokens.pink },
      { label: 'Rewards',    value: 18, icon: gIcons.gift,  fg: adminTokens.teal },
    ].map((it, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${it.fg.replace(')', ' / 0.12)')}`, color: it.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><GIcon d={it.icon} size={14}/></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: adminTokens.black, lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{it.value}</div>
          <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600, marginTop: 2 }}>{it.label}</div>
        </div>
      </div>
    ))}

    <div style={{ flex: 1 }}/>
    <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 500 }}>
      อัปเดตล่าสุด · 2 นาทีที่แล้ว
    </div>
    {/* Toggle */}
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>
        {enabled ? 'ใช้งาน' : 'หยุด'}
      </span>
      <div onClick={() => setEnabled(!enabled)} style={{
        width: 38, height: 22, borderRadius: 9999, padding: 2,
        background: enabled ? adminTokens.orange : adminTokens.border,
        transition: 'background .2s', position: 'relative',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transform: enabled ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }}/>
      </div>
    </label>
  </div>
);

/* =============================================================
 *  TABS BAR
 * =========================================================== */
const GamiTabs = ({ tab, setTab }) => {
  const items = [
    { id: 'overview',    label: 'ภาพรวม',      icon: gIcons.chart },
    { id: 'tiers',       label: 'Tiers & XP',   icon: gIcons.crown },
    { id: 'quests',      label: 'Quests',       icon: gIcons.target },
    { id: 'badges',      label: 'Badges',       icon: gIcons.medal },
    { id: 'rewards',     label: 'Rewards',      icon: gIcons.gift },
    { id: 'leaderboard', label: 'Leaderboard',  icon: gIcons.users },
  ];
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      padding: 6, display: 'flex', gap: 2, overflowX: 'auto',
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)} style={{
          height: 36, padding: '0 14px', borderRadius: 10, cursor: 'pointer', border: 0,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
          background: tab === it.id ? adminTokens.orange : 'transparent',
          color: tab === it.id ? '#fff' : adminTokens.black,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: tab === it.id ? adminTokens.shadowOrange : 'none',
        }}>
          <GIcon d={it.icon} size={14} stroke={2.2}/>
          {it.label}
        </button>
      ))}
    </div>
  );
};

/* =============================================================
 *  OVERVIEW TAB
 * =========================================================== */

/* Tier distribution — horizontal stacked bar + side legend */
const TierDistribution = () => {
  const data = [
    { id: 'starter',   count: 58,  pct: 23.5 },
    { id: 'regular',   count: 72,  pct: 29.1 },
    { id: 'dedicated', count: 54,  pct: 21.9 },
    { id: 'elite',     count: 38,  pct: 15.4 },
    { id: 'champion',  count: 19,  pct: 7.7 },
    { id: 'legend',    count: 6,   pct: 2.4 },
  ];
  return (
    <GCard title="การกระจาย Tier" subtitle="สมาชิก 247 คน · แบ่งตาม Momentum tier"
           action={<GPill color={adminTokens.muted} bg={adminTokens.subtle}>เดือนนี้</GPill>}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 40, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        {data.map(d => {
          const t = TIERS.find(t => t.id === d.id);
          return (
            <div key={d.id} title={`${t.label}: ${d.count}`} style={{
              background: t.color, flex: d.pct,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '.02em',
            }}>{d.pct > 6 ? d.count : ''}</div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {data.map(d => {
          const t = TIERS.find(t => t.id === d.id);
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }}/>
              <div style={{ fontSize: 12, color: adminTokens.black, fontWeight: 600 }}>{t.label}</div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums' }}>
                {d.count} <span style={{ color: adminTokens.mutedLight }}>· {d.pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </GCard>
  );
};

/* Engagement trend — area chart */
const EngagementTrend = () => {
  const W = 520, H = 200, PAD = { t: 12, r: 12, b: 28, l: 36 };
  const days = 30;
  const active = Array.from({length: days}, (_, i) =>
    120 + Math.round(Math.sin(i * 0.5) * 12 + Math.cos(i * 0.2) * 8 + i * 1.8)
  );
  const xp = Array.from({length: days}, (_, i) =>
    8000 + Math.round(Math.sin(i * 0.4) * 1000 + i * 150 + Math.cos(i * 0.15) * 500)
  );
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const maxA = Math.max(...active), minA = Math.min(...active);
  const x = (i) => PAD.l + (i / (days - 1)) * innerW;
  const yA = (v) => PAD.t + innerH - ((v - minA) / (maxA - minA)) * innerH;
  const path = active.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yA(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(days-1)},${PAD.t + innerH} L${x(0)},${PAD.t + innerH} Z`;

  return (
    <GCard title="การมีส่วนร่วมรายวัน" subtitle="สมาชิก active ใน gamification · 30 วันล่าสุด"
           action={
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                 <div style={{ width: 10, height: 2, background: adminTokens.orange, borderRadius: 2 }}/>
                 <span style={{ color: adminTokens.muted, fontWeight: 600 }}>Active</span>
               </div>
             </div>}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="gami-eng-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={adminTokens.orange} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={adminTokens.orange} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid + axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = PAD.t + innerH * p;
          const v = Math.round(maxA - (maxA - minA) * p);
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                    stroke={adminTokens.divider} strokeDasharray={i === 4 ? 'none' : '2 3'}/>
              <text x={PAD.l - 6} y={y + 3} fontSize="9" fill={adminTokens.mutedLight} textAnchor="end"
                    fontFamily="inherit">{v}</text>
            </g>
          );
        })}
        {/* X labels */}
        {[0, 7, 14, 21, 29].map(i => (
          <text key={i} x={x(i)} y={H - 10} fontSize="9" fill={adminTokens.mutedLight} textAnchor="middle"
                fontFamily="inherit">D-{29 - i}</text>
        ))}
        <path d={area} fill="url(#gami-eng-grad)"/>
        <path d={path} fill="none" stroke={adminTokens.orange} strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </GCard>
  );
};

/* Top earners — compact list */
const TopEarners = () => {
  const people = [
    { name: 'Thanin S.',    tier: 'legend',    xp: 8420, delta: '+320', avatar: 'TS' },
    { name: 'Napat K.',     tier: 'champion',  xp: 6140, delta: '+285', avatar: 'NK' },
    { name: 'Preecha M.',   tier: 'champion',  xp: 5890, delta: '+240', avatar: 'PM' },
    { name: 'Suda W.',      tier: 'elite',     xp: 3220, delta: '+195', avatar: 'SW' },
    { name: 'Korn T.',      tier: 'elite',     xp: 2980, delta: '+180', avatar: 'KT' },
    { name: 'Anong P.',     tier: 'dedicated', xp: 1340, delta: '+120', avatar: 'AP' },
  ];
  return (
    <GCard title="Top Earners" subtitle="XP 7 วันล่าสุด"
           action={<GButton small ghost>ดูทั้งหมด →</GButton>} pad={0}>
      <div>
        {people.map((p, i) => {
          const t = TIERS.find(t => t.id === p.tier);
          return (
            <div key={i} style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === people.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            }}>
              <div style={{
                width: 22, textAlign: 'center', fontSize: 11, fontWeight: 800,
                color: i < 3 ? adminTokens.orange : adminTokens.mutedLight,
                fontVariantNumeric: 'tabular-nums',
              }}>#{i + 1}</div>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${t.color}, ${t.color} 80%)`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>{p.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{p.name}</div>
                <div style={{ fontSize: 10, color: t.color, fontWeight: 700,
                              letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  {t.icon} {t.label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums' }}>
                  {p.xp.toLocaleString()} <span style={{ color: adminTokens.orange, fontSize: 10 }}>XP</span>
                </div>
                <div style={{ fontSize: 10, color: adminTokens.success, fontWeight: 700 }}>{p.delta} 7d</div>
              </div>
            </div>
          );
        })}
      </div>
    </GCard>
  );
};

/* XP source breakdown — donut + list */
const XPSources = () => {
  const sources = [
    { label: 'เช็คอินคลาส',   value: 38, color: adminTokens.orange },
    { label: 'จองล่วงหน้า',    value: 22, color: adminTokens.info },
    { label: 'Streak โบนัส',  value: 16, color: adminTokens.pink },
    { label: 'Quest สำเร็จ',  value: 14, color: adminTokens.teal },
    { label: 'Badge ปลดล็อก',  value: 6,  color: adminTokens.warn },
    { label: 'อื่น ๆ',         value: 4,  color: adminTokens.slate },
  ];
  const total = sources.reduce((a, b) => a + b.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <GCard title="แหล่งที่มาของ XP" subtitle="7 วันล่าสุด · รวม 12,840 XP">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
            {sources.map((s, i) => {
              const len = (s.value / total) * C;
              const el = <circle key={i} cx="65" cy="65" r={R} fill="none" stroke={s.color} strokeWidth="14"
                         strokeDasharray={`${len} ${C}`} strokeDashoffset={-off}/>;
              off += len;
              return el;
            })}
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black, lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums' }}>12.8K</div>
            <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 2 }}>XP</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sources.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }}/>
              <div style={{ fontSize: 12, color: adminTokens.black, fontWeight: 600, flex: 1 }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums' }}>{s.value}%</div>
            </div>
          ))}
        </div>
      </div>
    </GCard>
  );
};

/* Attention / alerts */
const GamiAttention = () => {
  const items = [
    { tone: 'warn', title: 'Quest "7-day streak" ต่ำกว่าเป้า',
      desc: 'อัตราสำเร็จ 24% · เป้า 40% — ลองลดเกณฑ์เหลือ 5 วัน?', cta: 'ดู Quest' },
    { tone: 'info', title: 'Reward "ฟรีน้ำ Detox" ใกล้หมด',
      desc: 'เหลือ 8 ชิ้น · คาดว่าหมดใน 2 วัน', cta: 'เติมสต็อก' },
    { tone: 'success', title: '6 สมาชิกพร้อม Legend',
      desc: 'Champions ที่ XP ≥ 6,500 · เตรียมส่งสิทธิพิเศษ', cta: 'ดูรายชื่อ' },
  ];
  const toneMap = {
    warn:    { fg: adminTokens.warn,    bg: adminTokens.warnSoft },
    info:    { fg: adminTokens.info,    bg: adminTokens.infoSoft },
    success: { fg: adminTokens.success, bg: adminTokens.successSoft },
  };
  return (
    <GCard title="ต้องดู" subtitle="เรื่องที่ต้องจัดการในสัปดาห์นี้" pad={0}>
      <div>
        {items.map((it, i) => {
          const t = toneMap[it.tone];
          return (
            <div key={i} style={{
              padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
              borderBottom: i === items.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}><GIcon d={gIcons.flame} size={14}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{it.title}</div>
                <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
              </div>
              <button style={{
                height: 26, padding: '0 10px', borderRadius: 8, border: 0, cursor: 'pointer',
                background: adminTokens.subtle, color: adminTokens.black,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>{it.cta} →</button>
            </div>
          );
        })}
      </div>
    </GCard>
  );
};

const GamiOverviewTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <EngagementTrend/>
      <TierDistribution/>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      <XPSources/>
      <TopEarners/>
      <GamiAttention/>
    </div>
  </div>
);

/* =============================================================
 *  TIERS & XP TAB
 * =========================================================== */

/* Visual tier ladder — horizontal progression */
const TierLadderVisual = () => {
  const counts = { starter: 58, regular: 72, dedicated: 54, elite: 38, champion: 19, legend: 6 };
  return (
    <GCard title="Momentum Ladder" subtitle="6 tiers · XP thresholds กำหนดโดยคุณ"
           action={<GButton small icon={gIcons.edit}>แก้ XP Thresholds</GButton>}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginTop: 4 }}>
        {TIERS.map((t, i) => (
          <div key={t.id} style={{ flex: 1, position: 'relative' }}>
            {/* arrow */}
            {i < TIERS.length - 1 && (
              <div style={{
                position: 'absolute', right: -6, top: 46, zIndex: 2,
                color: adminTokens.mutedLight, fontSize: 14, fontWeight: 800,
              }}>›</div>
            )}
            <div style={{
              background: `linear-gradient(180deg, ${t.color}, ${t.color} 60%)`,
              borderRadius: 12, padding: '14px 12px', textAlign: 'center',
              color: '#fff', minHeight: 96, display: 'flex', flexDirection: 'column',
              justifyContent: 'center', gap: 4,
              boxShadow: `0 4px 12px ${t.color.replace(')', ' / 0.25)')}`,
            }}>
              <div style={{ fontSize: 20 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em',
                            textTransform: 'uppercase' }}>{t.label}</div>
              <div style={{ fontSize: 10, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                {t.min.toLocaleString()}{t.max ? `–${t.max.toLocaleString()}` : '+'} XP
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums' }}>{counts[t.id]}</div>
              <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>สมาชิก</div>
            </div>
          </div>
        ))}
      </div>
    </GCard>
  );
};

/* XP rules editor — actions that award XP */
const XPRulesTable = () => {
  const [rules, setRules] = useStateG([
    { id: 1, label: 'เช็คอินคลาส',         event: 'class.check_in',      xp: 10, enabled: true,  freq: 'ทุกคลาส' },
    { id: 2, label: 'จองคลาสล่วงหน้า 24 ชม.', event: 'class.book_early',  xp: 5,  enabled: true,  freq: 'ทุกการจอง' },
    { id: 3, label: 'Streak 3 วัน',         event: 'streak.3',            xp: 25, enabled: true,  freq: 'รายสัปดาห์' },
    { id: 4, label: 'Streak 7 วัน',         event: 'streak.7',            xp: 75, enabled: true,  freq: 'รายสัปดาห์' },
    { id: 5, label: 'Quest สำเร็จ',          event: 'quest.complete',     xp: 50, enabled: true,  freq: 'ต่อ quest' },
    { id: 6, label: 'Badge ใหม่',            event: 'badge.earned',       xp: 30, enabled: true,  freq: 'ต่อ badge' },
    { id: 7, label: 'แนะนำเพื่อน',           event: 'referral.signup',    xp: 200,enabled: true,  freq: 'ต่อการสมัคร' },
    { id: 8, label: 'รีวิว 5 ดาว',            event: 'review.5star',       xp: 40, enabled: false, freq: 'ต่อเดือน' },
    { id: 9, label: 'ซื้อแพ็คเกจ Unlimited',   event: 'package.unlimited',  xp: 500,enabled: true,  freq: 'ต่อการซื้อ' },
  ]);

  const toggle = (id) => setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const updateXP = (id, v) => setRules(rs => rs.map(r => r.id === id ? { ...r, xp: Math.max(0, parseInt(v) || 0) } : r));

  return (
    <GCard title="XP Rules" subtitle="กฎการได้ XP · คลิกเพื่อแก้ค่า"
           action={<GButton small primary icon={gIcons.plus}>เพิ่มกฎ</GButton>} pad={0}>
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 90px 120px 60px 40px',
          padding: '10px 16px', fontSize: 10, fontWeight: 700, color: adminTokens.muted,
          letterSpacing: '.06em', textTransform: 'uppercase',
          borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
        }}>
          <div>กฎ</div><div>Event</div><div style={{textAlign:'right'}}>XP</div>
          <div>ความถี่</div><div>สถานะ</div><div/>
        </div>
        {rules.map((r, i) => (
          <div key={r.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 90px 120px 60px 40px',
            padding: '12px 16px', alignItems: 'center',
            borderBottom: i === rules.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            opacity: r.enabled ? 1 : 0.55,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{r.label}</div>
            <div style={{ fontSize: 11, color: adminTokens.muted, fontFamily: 'ui-monospace, monospace' }}>{r.event}</div>
            <div style={{ textAlign: 'right' }}>
              <input type="number" value={r.xp} onChange={e => updateXP(r.id, e.target.value)}
                     style={{
                       width: 64, height: 28, padding: '0 8px', textAlign: 'right',
                       border: `1px solid ${adminTokens.border}`, borderRadius: 6,
                       fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                       color: adminTokens.orange, background: adminTokens.orangeSoft,
                       fontVariantNumeric: 'tabular-nums',
                     }}/>
            </div>
            <div style={{ fontSize: 11, color: adminTokens.muted }}>{r.freq}</div>
            <div>
              <div onClick={() => toggle(r.id)} style={{
                width: 32, height: 18, borderRadius: 9999, padding: 2, cursor: 'pointer',
                background: r.enabled ? adminTokens.orange : adminTokens.border, transition: 'background .2s',
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                  transform: r.enabled ? 'translateX(14px)' : 'translateX(0)',
                  transition: 'transform .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                }}/>
              </div>
            </div>
            <button style={{
              background: 'transparent', border: 0, color: adminTokens.mutedLight,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
            }}><GIcon d={gIcons.dots} size={14}/></button>
          </div>
        ))}
      </div>
    </GCard>
  );
};

/* Tier progression chart — line of tier growth over 90d */
const TierProgressionChart = () => {
  const W = 520, H = 180, PAD = { t: 10, r: 12, b: 24, l: 30 };
  const days = 12; // monthly-ish buckets
  const series = TIERS.slice(0, 6).map((t, ti) => ({
    id: t.id, color: t.color,
    data: Array.from({length: days}, (_, i) =>
      Math.max(0, [40, 55, 40, 25, 10, 2][ti] + Math.round(Math.sin(i * 0.5 + ti) * 4 + i * [0.6, 0.8, 0.8, 0.6, 0.4, 0.15][ti]))
    ),
  }));
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals), min = 0;
  const x = (i) => PAD.l + (i / (days - 1)) * innerW;
  const y = (v) => PAD.t + innerH - ((v - min) / (max - min)) * innerH;

  return (
    <GCard title="การเติบโตของแต่ละ Tier" subtitle="12 สัปดาห์ล่าสุด">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={PAD.l} y1={PAD.t + innerH * p} x2={W - PAD.r} y2={PAD.t + innerH * p}
                stroke={adminTokens.divider} strokeDasharray={i === 4 ? 'none' : '2 3'}/>
        ))}
        {series.map(s => {
          const path = s.data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          return <path key={s.id} d={path} fill="none" stroke={s.color} strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>;
        })}
        {[0, 3, 6, 9, 11].map(i => (
          <text key={i} x={x(i)} y={H - 8} fontSize="9" fill={adminTokens.mutedLight}
                textAnchor="middle" fontFamily="inherit">W{i + 1}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
        {TIERS.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 2, background: t.color, borderRadius: 2 }}/>
            <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </GCard>
  );
};

const GamiTiersTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TierLadderVisual/>
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
      <XPRulesTable/>
      <TierProgressionChart/>
    </div>
  </div>
);

/* Export to window for sibling files */
Object.assign(window, {
  TIERS, gIcons, GCard, GPill, GDelta, GIcon, GChip, GButton, GSpark,
  GamiHero, GamiSystemStrip, GamiTabs,
  GamiOverviewTab, GamiTiersTab,
});
