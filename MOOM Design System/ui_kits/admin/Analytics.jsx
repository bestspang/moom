/* MOOM Admin — Analytics page
   Real analytics workbench: date range + compare, tabbed drill-downs
   (Revenue / Members / Classes), charts as pure SVG.
*/

const { useState: useStateA, useMemo: useMemoA, useEffect: useEffectA } = React;

/* ---------- Shared mock data ---------- */
const A_RANGES = [
  { id: '7d',  label: '7 วัน',   days: 7 },
  { id: '30d', label: '30 วัน',  days: 30 },
  { id: '90d', label: '90 วัน',  days: 90 },
  { id: 'ytd', label: 'YTD',     days: 110 },
];

/* Synthesize 30 daily points */
const genSeries = (n, base, vol, seed = 1) => {
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 0.7 + seed) * vol + (Math.cos(i * 0.23 + seed * 2) * vol * 0.4);
    v = Math.max(base * 0.5, base + r + i * (base * 0.015));
    out.push(Math.round(v));
  }
  return out;
};

/* ---------- Shared tiny primitives ---------- */
const A_Chip = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{
    height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
    border: 0, fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    background: active ? adminTokens.surface : 'transparent',
    color: active ? adminTokens.black : adminTokens.muted,
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
  }}>{children}</button>
);

const A_Card = ({ title, subtitle, action, children, padding = 16, minH }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    display: 'flex', flexDirection: 'column', minHeight: minH,
  }}>
    {title && (
      <div style={{
        padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${adminTokens.border}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    <div style={{ padding, flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
  </div>
);

const A_Delta = ({ v, suffix = '%' }) => {
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

/* ---------- KPI Card with sparkline ---------- */
let _akpiGidSeq = 0;
const AKpi = ({ label, value, delta, compare, accent = 'orange', icon, series }) => {
  const gid = useMemoA(() => `kpi-g-${++_akpiGidSeq}`, []);
  const map = {
    orange:  { fg: adminTokens.orange,  bg: adminTokens.orangeSoft },
    teal:    { fg: adminTokens.teal,    bg: adminTokens.tealSoft },
    info:    { fg: adminTokens.info,    bg: adminTokens.infoSoft },
    pink:    { fg: adminTokens.pink,    bg: 'hsl(330 80% 58% / 0.12)' },
  };
  const a = map[accent];
  const min = Math.min(...series), max = Math.max(...series);
  const range = max - min || 1;
  const w = 120, h = 34;
  const pts = series.map((v, i) => [
    (i / (series.length - 1)) * w,
    h - ((v - min) / range) * h,
  ]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, padding: 16, boxShadow: adminTokens.shadowSm,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: a.bg, color: a.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <A_Icon d={icon} size={16} stroke={2.2}/>
        </div>
        <div style={{ fontSize: 12, color: adminTokens.muted, fontWeight: 600, flex: 1 }}>{label}</div>
        {delta !== undefined && <A_Delta v={delta}/>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: adminTokens.black,
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1.1 }}>
            {value}
          </div>
          {compare && <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 2 }}>
            vs ช่วงก่อน: <span style={{ color: adminTokens.ink2, fontWeight: 600 }}>{compare}</span>
          </div>}
        </div>
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={a.fg} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={a.fg} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`}/>
          <path d={path} fill="none" stroke={a.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={a.fg} stroke="#fff" strokeWidth="1.5"/>
        </svg>
      </div>
    </div>
  );
};

/* =============================================================
 *  HEADER TOOLBAR — range picker + compare toggle
 * =========================================================== */
const AnalyticsToolbar = ({ range, setRange, compare, setCompare }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px' }}>
      <A_Icon d={aIcons.cal} size={14}/>
      <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>ช่วงวันที่</span>
    </div>
    <div style={{ display: 'flex', border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                  padding: 2, background: adminTokens.subtle }}>
      {A_RANGES.map(r => (
        <A_Chip key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>{r.label}</A_Chip>
      ))}
    </div>
    <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 500 }}>
      20 มี.ค. – 19 เม.ย. 2026
    </div>
    <div style={{ flex: 1 }}/>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '0 4px', fontSize: 12, color: adminTokens.black, fontWeight: 600 }}>
      <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}
             style={{ accentColor: adminTokens.orange, width: 14, height: 14 }}/>
      เทียบช่วงก่อน
    </label>
    <button style={{
      height: 34, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
      border: `1px solid ${adminTokens.border}`, background: adminTokens.surface,
      fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: adminTokens.black,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <A_Icon d={aIcons.bar} size={13}/> ส่งออก
    </button>
    <HeaderBtnV2 icon={aIcons.pulse}>ตั้งเป้าหมาย</HeaderBtnV2>
  </div>
);

/* =============================================================
 *  AI INSIGHTS STRIP
 * =========================================================== */
const AInsights = () => {
  const items = [
    { kind: 'up',   icon: aIcons.trend,  title: 'Unlimited +24%', desc: 'แพ็คเกจ Unlimited โตเร็วสุด — เหมาะจะดันต่อ' },
    { kind: 'down', icon: aIcons.alert,  title: 'Yoga utilization ลดลง', desc: 'เฉลี่ย 52% ลดจาก 68% — ลองเปลี่ยนเวลา 18:30?' },
    { kind: 'info', icon: aIcons.star,   title: 'Coach Best ขึ้นแท่น #1', desc: 'เรตติ้ง 4.9 + 142 คลาส เดือนนี้' },
  ];
  const kMap = {
    up:   { fg: adminTokens.success, bg: adminTokens.successSoft },
    down: { fg: adminTokens.destr,   bg: adminTokens.destrSoft },
    info: { fg: adminTokens.info,    bg: adminTokens.infoSoft },
  };
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      padding: 14, display: 'flex', alignItems: 'stretch', gap: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px 0 4px',
        borderRight: `1px solid ${adminTokens.divider}`,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: adminTokens.orange,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><A_Icon d={aIcons.pulse} size={15}/></div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: adminTokens.orange,
                        letterSpacing: '.08em', textTransform: 'uppercase' }}>AI Insights</div>
          <div style={{ fontSize: 10, color: adminTokens.muted }}>จากข้อมูล 30 วัน</div>
        </div>
      </div>
      {items.map((it, i) => {
        const k = kMap[it.kind];
        return (
          <div key={i} style={{ flex: 1, display: 'flex', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: k.bg, color: k.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><A_Icon d={it.icon} size={14}/></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{it.title}</div>
              <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1, lineHeight: 1.4 }}>{it.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* =============================================================
 *  REVENUE TAB
 * =========================================================== */
const RevenueTab = ({ compare }) => {
  /* Stacked area chart — 30 days × 3 package types */
  const days = 30;
  const unlimited = genSeries(days, 8000, 1800, 1);
  const classes10 = genSeries(days, 5200, 1100, 3);
  const trial     = genSeries(days, 2100, 900, 5);
  const prev      = genSeries(days, 12000, 2000, 7); // prev period total

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
      {/* Chart */}
      <A_Card title="รายได้รายวัน แยกตามแพ็คเกจ" subtitle={compare ? 'พร้อมเส้นเปรียบเทียบช่วงก่อน' : '30 วันล่าสุด'}
              action={<LegendDot items={[
                { c: adminTokens.orange, l: 'Unlimited' },
                { c: adminTokens.info,   l: '10 คลาส' },
                { c: adminTokens.teal,   l: 'Trial' },
                compare && { c: adminTokens.mutedLight, l: 'ช่วงก่อน', dashed: true },
              ].filter(Boolean)}/>}>
        <StackedAreaChart
          data={[unlimited, classes10, trial]}
          colors={[adminTokens.orange, adminTokens.info, adminTokens.teal]}
          compareLine={compare ? prev : null}
        />
      </A_Card>

      {/* Right column: donut + top items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <A_Card title="สัดส่วนรายได้ 30 วัน">
          <Donut data={[
            { label: 'Unlimited',  value: 245000, color: adminTokens.orange },
            { label: '10 คลาส',    value: 156000, color: adminTokens.info },
            { label: 'PT 1-on-1', value: 98000,  color: adminTokens.pink },
            { label: 'Trial',      value: 62000,  color: adminTokens.teal },
            { label: 'Drop-in',    value: 34000,  color: adminTokens.warn },
          ]} total="฿595k"/>
        </A_Card>
      </div>

      {/* Full-width: top packages table */}
      <div style={{ gridColumn: '1 / -1' }}>
        <A_Card title="แพ็คเกจขายดีที่สุด" subtitle="30 วัน">
          <TopPackages/>
        </A_Card>
      </div>
    </div>
  );
};

/* ---------- Stacked Area Chart ---------- */
const StackedAreaChart = ({ data, colors, compareLine }) => {
  const w = 720, h = 280, pad = { t: 10, r: 16, b: 30, l: 44 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const n = data[0].length;
  const totals = Array.from({ length: n }, (_, i) => data.reduce((s, d) => s + d[i], 0));
  const max = Math.max(...totals, ...(compareLine || [0])) * 1.1;
  const x = i => pad.l + (i / (n - 1)) * cw;
  const y = v => pad.t + ch - (v / max) * ch;

  // Build stacked paths (top-down layering)
  const stacks = [];
  const bottoms = Array(n).fill(0);
  data.forEach((series, di) => {
    const tops = series.map((v, i) => bottoms[i] + v);
    const pathTop = tops.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const pathBot = bottoms.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).reverse().join(' ').replace('L', 'L');
    stacks.push({ d: `${pathTop} ${pathBot} Z`, color: colors[di] });
    series.forEach((v, i) => { bottoms[i] += v; });
  });

  // Compare line (dashed)
  const cmpPath = compareLine && compareLine.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const yTicks = [0, max * 0.5, max].map(v => Math.round(v / 1000));
  const xLabels = ['20 มี.ค.', '27', '3 เม.ย.', '10', '17'];

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {/* Grid */}
      {[0, 0.5, 1].map((p, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={pad.t + ch * (1-p)} y2={pad.t + ch * (1-p)}
                stroke={adminTokens.divider} strokeDasharray="2 4"/>
          <text x={pad.l - 8} y={pad.t + ch * (1-p) + 3} fontSize="10"
                fill={adminTokens.mutedLight} textAnchor="end" fontFamily="inherit">
            ฿{yTicks[i]}k
          </text>
        </g>
      ))}
      {/* Stacks */}
      {stacks.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity={0.75}/>
      ))}
      {/* Compare line */}
      {cmpPath && <path d={cmpPath} fill="none" stroke={adminTokens.mutedLight}
                         strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round"/>}
      {/* X labels */}
      {xLabels.map((lbl, i) => (
        <text key={i} x={pad.l + (i / (xLabels.length - 1)) * cw} y={h - 8}
              fontSize="10" fill={adminTokens.muted} textAnchor="middle" fontFamily="inherit">{lbl}</text>
      ))}
    </svg>
  );
};

const LegendDot = ({ items }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
    {items.map((it, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {it.dashed ? (
          <span style={{ width: 14, height: 2, borderTop: `2px dashed ${it.c}` }}/>
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: 2, background: it.c }}/>
        )}
        <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{it.l}</span>
      </div>
    ))}
  </div>
);

/* ---------- Donut ---------- */
const Donut = ({ data, total }) => {
  const size = 150, R = 60, r = 40;
  const sum = data.reduce((s, d) => s + d.value, 0);
  let a = -Math.PI / 2;
  const arcs = data.map(d => {
    const frac = d.value / sum;
    const a2 = a + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = size/2 + R * Math.cos(a), y1 = size/2 + R * Math.sin(a);
    const x2 = size/2 + R * Math.cos(a2), y2 = size/2 + R * Math.sin(a2);
    const x3 = size/2 + r * Math.cos(a2), y3 = size/2 + r * Math.sin(a2);
    const x4 = size/2 + r * Math.cos(a), y4 = size/2 + r * Math.sin(a);
    const d_ = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`;
    a = a2;
    return { d: d_, color: d.color, label: d.label, value: d.value, frac };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color}/>)}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>ทั้งหมด</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>{total}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0 }}/>
            <span style={{ color: adminTokens.black, fontWeight: 600, flex: 1 }}>{a.label}</span>
            <span style={{ color: adminTokens.muted, fontWeight: 600,
                           fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(a.frac * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Top Packages table ---------- */
const TopPackages = () => {
  const rows = [
    { name: 'Unlimited Monthly',  sales: 68, rev: 238000, pct: 100, color: adminTokens.orange },
    { name: '10 คลาส / เดือน',     sales: 41, rev: 143500, pct: 60,  color: adminTokens.info },
    { name: 'PT 1-on-1 × 8',      sales: 22, rev: 98000,  pct: 41,  color: adminTokens.pink },
    { name: 'Unlimited Quarterly', sales: 11, rev: 77000,  pct: 32,  color: adminTokens.orange },
    { name: 'Drop-in Day Pass',   sales: 34, rev: 34000,  pct: 14,  color: adminTokens.warn },
  ];
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ color: adminTokens.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700 }}>แพ็คเกจ</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, width: 80 }}>ขาย</th>
          <th style={{ textAlign: 'left', padding: '6px 14px', fontWeight: 700 }}>สัดส่วนรายได้</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, width: 100 }}>รายได้</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, width: 70 }}>เติบโต</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${adminTokens.divider}` }}>
            <td style={{ padding: '10px 0', color: adminTokens.black, fontWeight: 600 }}>{r.name}</td>
            <td style={{ padding: '10px 0', textAlign: 'right', color: adminTokens.ink2,
                         fontVariantNumeric: 'tabular-nums' }}>{r.sales}</td>
            <td style={{ padding: '10px 14px' }}>
              <div style={{ height: 6, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.color }}/>
              </div>
            </td>
            <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: adminTokens.black,
                         fontVariantNumeric: 'tabular-nums' }}>
              ฿{r.rev.toLocaleString()}
            </td>
            <td style={{ padding: '10px 0', textAlign: 'right' }}>
              <A_Delta v={[24, 8, -3, 12, -8][i]}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* =============================================================
 *  MEMBERS TAB — funnel + cohort heatmap + churn
 * =========================================================== */
const MembersTab = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
    <A_Card title="Acquisition Funnel" subtitle="เส้นทางลูกค้า 30 วัน">
      <Funnel steps={[
        { l: 'เข้าชมเว็บ/App',   v: 4280, c: adminTokens.info },
        { l: 'สร้างบัญชี',         v: 1120, c: adminTokens.teal },
        { l: 'ทดลองเรียน (Trial)', v: 287,  c: adminTokens.success },
        { l: 'ซื้อแพ็คเกจ',        v: 124,  c: adminTokens.orange },
        { l: 'ต่ออายุ (เดือน 2)',  v: 78,   c: adminTokens.pink },
      ]}/>
    </A_Card>

    <A_Card title="การกระจาย Tier" subtitle="247 สมาชิก Active">
      <TierDist/>
    </A_Card>

    <div style={{ gridColumn: '1 / -1' }}>
      <A_Card title="Cohort Retention" subtitle="% สมาชิกที่ยังใช้บริการอยู่ แยกตามเดือนที่สมัคร">
        <CohortHeatmap/>
      </A_Card>
    </div>

    <A_Card title="สาเหตุการยกเลิก" subtitle="จาก 24 คนที่ churn เดือนนี้">
      <ChurnReasons/>
    </A_Card>

    <A_Card title="สมาชิกเสี่ยง Churn" subtitle="ไม่มาเกิน 14 วัน + ใกล้หมดอายุ">
      <AtRiskMembers/>
    </A_Card>
  </div>
);

const Funnel = ({ steps }) => {
  const max = steps[0].v;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((s, i) => {
        const pct = s.v / max * 100;
        const conv = i > 0 ? (s.v / steps[i-1].v * 100).toFixed(1) : null;
        return (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <div style={{ flex: 1, fontSize: 12, color: adminTokens.black, fontWeight: 600 }}>
                <span style={{ color: adminTokens.mutedLight, marginRight: 6, fontWeight: 700 }}>{i+1}</span>
                {s.l}
              </div>
              {conv && (
                <span style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 600 }}>
                  {conv}% ส่งต่อ
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                             fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em', minWidth: 46,
                             textAlign: 'right' }}>
                {s.v.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 26, background: adminTokens.subtle, borderRadius: 6, overflow: 'hidden',
                          position: 'relative' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${s.c}, ${s.c})`,
                transition: 'width .5s', display: 'flex', alignItems: 'center',
                paddingLeft: 8, color: '#fff', fontSize: 10, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}>{pct.toFixed(0)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TierDist = () => {
  const tiers = [
    { l: 'Platinum', c: 'hsl(200 30% 45%)', v: 28,  emoji: '💠' },
    { l: 'Gold',     c: 'hsl(45 85% 50%)',  v: 98,  emoji: '🥇' },
    { l: 'Silver',   c: 'hsl(210 10% 55%)', v: 82,  emoji: '🥈' },
    { l: 'Bronze',   c: 'hsl(30 50% 45%)',  v: 39,  emoji: '🥉' },
  ];
  const total = tiers.reduce((s, t) => s + t.v, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 38, borderRadius: 8, overflow: 'hidden',
                    border: `1px solid ${adminTokens.divider}` }}>
        {tiers.map((t, i) => (
          <div key={i} style={{
            width: `${t.v / total * 100}%`, background: t.c, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
          }}>
            {t.v / total > 0.1 && <span>{t.emoji} {t.v}</span>}
          </div>
        ))}
      </div>
      {/* Rows */}
      {tiers.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15 }}>{t.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black, flex: 1 }}>{t.l}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                         fontVariantNumeric: 'tabular-nums' }}>{t.v}</span>
          <span style={{ fontSize: 11, color: adminTokens.muted, fontVariantNumeric: 'tabular-nums',
                         minWidth: 34, textAlign: 'right' }}>
            {(t.v / total * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
};

const CohortHeatmap = () => {
  const cohorts = ['พ.ย. 25', 'ธ.ค. 25', 'ม.ค. 26', 'ก.พ. 26', 'มี.ค. 26', 'เม.ย. 26'];
  // % retained at month 0..5
  const rows = [
    [100, 82, 71, 64, 58, 54],
    [100, 79, 68, 62, 56, null],
    [100, 84, 74, 68, null, null],
    [100, 86, 76, null, null, null],
    [100, 88, null, null, null, null],
    [100, null, null, null, null, null],
  ];
  const colorFor = v => {
    if (v === null) return { bg: adminTokens.subtle, fg: adminTokens.mutedLight };
    const t = v / 100;
    const hue = 22;     // orange brand
    const light = 95 - t * 45;   // 50–95%
    const sat = 30 + t * 65;     // 30–95%
    return {
      bg: `hsl(${hue} ${sat}% ${light}%)`,
      fg: t > 0.6 ? '#fff' : adminTokens.black,
    };
  };
  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 8px', color: adminTokens.muted, fontWeight: 700, fontSize: 10 }}>Cohort</th>
            <th style={{ textAlign: 'center', padding: '4px 0', color: adminTokens.muted, fontWeight: 700, fontSize: 10 }}>ขนาด</th>
            {['M0','M1','M2','M3','M4','M5'].map(m => (
              <th key={m} style={{ textAlign: 'center', padding: '4px 0', color: adminTokens.muted, fontWeight: 700, fontSize: 10 }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c, i) => {
            const sizes = [42, 38, 51, 47, 62, 55];
            return (
              <tr key={c}>
                <td style={{ padding: '4px 8px', color: adminTokens.black, fontWeight: 700, whiteSpace: 'nowrap' }}>{c}</td>
                <td style={{ textAlign: 'center', color: adminTokens.muted, fontWeight: 600,
                             fontVariantNumeric: 'tabular-nums' }}>{sizes[i]}</td>
                {rows[i].map((v, j) => {
                  const { bg, fg } = colorFor(v);
                  return (
                    <td key={j} style={{
                      background: bg, color: fg, textAlign: 'center', fontWeight: 700,
                      padding: '8px 4px', borderRadius: 6, fontVariantNumeric: 'tabular-nums',
                      minWidth: 48,
                    }}>{v === null ? '—' : `${v}%`}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: adminTokens.muted }}>0%</span>
        <div style={{
          width: 120, height: 8, borderRadius: 9999,
          background: 'linear-gradient(90deg, hsl(22 30% 95%), hsl(22 95% 50%))',
        }}/>
        <span style={{ fontSize: 10, color: adminTokens.muted }}>100%</span>
      </div>
    </div>
  );
};

const ChurnReasons = () => {
  const reasons = [
    { l: 'ราคาแพงเกินไป',       v: 34, c: adminTokens.destr },
    { l: 'ย้ายที่ทำงาน/ที่อยู่', v: 21, c: adminTokens.warn },
    { l: 'เวลาคลาสไม่ตรงกับชีวิต', v: 17, c: adminTokens.info },
    { l: 'ไม่เห็นผลลัพธ์',        v: 12, c: adminTokens.pink },
    { l: 'เหตุผลอื่น',           v: 16, c: adminTokens.muted },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reasons.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
            <span style={{ flex: 1, fontSize: 12, color: adminTokens.black, fontWeight: 600 }}>{r.l}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: r.c,
                           fontVariantNumeric: 'tabular-nums' }}>{r.v}%</span>
          </div>
          <div style={{ height: 6, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{ width: `${r.v}%`, height: '100%', background: r.c }}/>
          </div>
        </div>
      ))}
    </div>
  );
};

const AtRiskMembers = () => {
  const rows = [
    { n: 'Mook Thana',   pkg: '10 คลาส',  last: '14 วัน', exp: '2 พ.ค.',   r: 'high', c: 'hsl(270 60% 60%)' },
    { n: 'Joe L.',       pkg: 'รายเดือน', last: '9 วัน',  exp: '18 พ.ค.',  r: 'med',  c: 'hsl(45 70% 50%)' },
    { n: 'Natty Prach',  pkg: 'รายเดือน', last: '3 วัน',  exp: '21 เม.ย.', r: 'high', c: 'hsl(25 95% 55%)' },
    { n: 'Eve Kwan',     pkg: 'Unlimited', last: '5 วัน',  exp: '3 มิ.ย.',  r: 'med',  c: 'hsl(150 50% 50%)' },
  ];
  const rs = { high: { fg: adminTokens.destr, bg: adminTokens.destrSoft, l: 'High' },
               med:  { fg: adminTokens.warn,  bg: adminTokens.warnSoft,  l: 'Med'  } };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
          background: adminTokens.subtle, borderRadius: 8, border: `1px solid ${adminTokens.divider}`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: r.c, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800,
          }}>{r.n.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{r.n}</div>
            <div style={{ fontSize: 10, color: adminTokens.muted }}>
              {r.pkg} · ไม่มา {r.last} · หมดอายุ {r.exp}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, color: rs[r.r].fg, background: rs[r.r].bg,
            padding: '2px 7px', borderRadius: 4,
          }}>{rs[r.r].l}</span>
          <button style={{
            fontSize: 10, fontWeight: 700, color: '#fff', background: adminTokens.orange,
            border: 0, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
          }}>ติดต่อ</button>
        </div>
      ))}
    </div>
  );
};

/* =============================================================
 *  CLASSES TAB — heatmap + top coaches + hot hours
 * =========================================================== */
const ClassesTab = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
    <A_Card title="Utilization Heatmap" subtitle="% ความจุเฉลี่ย แยกตามวัน × เวลา (7 วันล่าสุด)">
      <UtilHeatmap/>
    </A_Card>

    <A_Card title="ประเภทคลาสยอดนิยม" subtitle="จำนวนจอง 30 วัน">
      <ClassTypeBars/>
    </A_Card>

    <div style={{ gridColumn: '1 / -1' }}>
      <A_Card title="อันดับเทรนเนอร์" subtitle="เรียงตามเรตติ้ง + จำนวนคลาส">
        <CoachLeaderboard/>
      </A_Card>
    </div>
  </div>
);

const UtilHeatmap = () => {
  const days = ['จ','อ','พ','พฤ','ศ','ส','อา'];
  const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  // Generate util values
  const grid = days.map((_, di) =>
    hours.map((h, hi) => {
      // Peak: 7-9am and 17-20pm on weekdays, lighter weekends
      const morning = Math.exp(-Math.pow(h - 8, 2) / 4) * 85;
      const evening = Math.exp(-Math.pow(h - 18, 2) / 3) * 95;
      const weekend = di >= 5 ? 0.7 : 1;
      const noise = (Math.sin(di * 7 + hi * 3) + 1) * 5;
      const v = Math.min(100, Math.max(5, Math.round((morning + evening) * weekend + noise + 15)));
      return v;
    })
  );

  const colorFor = v => {
    const t = v / 100;
    const hue = 22;
    const light = 95 - t * 45;
    const sat = 30 + t * 65;
    return {
      bg: `hsl(${hue} ${sat}% ${light}%)`,
      fg: t > 0.55 ? '#fff' : adminTokens.black,
    };
  };

  return (
    <div style={{ overflow: 'auto' }}>
      <div style={{ display: 'grid',
                    gridTemplateColumns: `40px repeat(${hours.length}, 1fr)`,
                    gap: 3, fontSize: 10 }}>
        <div/>
        {hours.map(h => (
          <div key={h} style={{ textAlign: 'center', color: adminTokens.muted, fontWeight: 700,
                                 padding: '2px 0', fontVariantNumeric: 'tabular-nums' }}>
            {h}
          </div>
        ))}
        {days.map((d, di) => (
          <React.Fragment key={d}>
            <div style={{ color: adminTokens.black, fontWeight: 700, display: 'flex',
                          alignItems: 'center', padding: '0 6px' }}>{d}</div>
            {hours.map((h, hi) => {
              const v = grid[di][hi];
              const { bg, fg } = colorFor(v);
              return (
                <div key={hi} title={`${d} ${h}:00 — ${v}%`} style={{
                  background: bg, color: fg, textAlign: 'center', padding: '8px 0',
                  borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'default',
                  fontVariantNumeric: 'tabular-nums',
                }}>{v >= 40 ? v : ''}</div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: adminTokens.muted }}>ว่าง</span>
        <div style={{ width: 120, height: 8, borderRadius: 9999,
                      background: 'linear-gradient(90deg, hsl(22 30% 95%), hsl(22 95% 50%))' }}/>
        <span style={{ fontSize: 10, color: adminTokens.muted }}>เต็ม</span>
      </div>
    </div>
  );
};

const ClassTypeBars = () => {
  const data = [
    { l: 'HIIT',     v: 412, c: 'hsl(25 95% 55%)' },
    { l: 'Yoga',     v: 368, c: 'hsl(270 60% 60%)' },
    { l: 'Spin',     v: 324, c: 'hsl(200 70% 55%)' },
    { l: 'Strength', v: 287, c: 'hsl(150 50% 45%)' },
    { l: 'Pilates',  v: 201, c: 'hsl(180 55% 45%)' },
    { l: 'Boxing',   v: 142, c: 'hsl(0 72% 55%)' },
    { l: 'Mobility', v: 88,  c: 'hsl(340 70% 60%)' },
  ];
  const max = data[0].v;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 64, fontSize: 12, color: adminTokens.black, fontWeight: 600 }}>{d.l}</span>
          <div style={{ flex: 1, height: 18, background: adminTokens.subtle, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${d.v / max * 100}%`, height: '100%', background: d.c,
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          padding: '0 6px', color: '#fff', fontSize: 10, fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums' }}>{d.v}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CoachLeaderboard = () => {
  const coaches = [
    { name: 'Best',  col: 'hsl(25 95% 55%)',  rating: 4.9, classes: 142, attend: 94, util: 88, trend: +12 },
    { name: 'Nok',   col: 'hsl(270 60% 60%)', rating: 4.8, classes: 128, attend: 91, util: 84, trend: +6  },
    { name: 'Arm',   col: 'hsl(200 60% 55%)', rating: 4.7, classes: 118, attend: 89, util: 82, trend: -2  },
    { name: 'P',     col: 'hsl(150 50% 50%)', rating: 4.6, classes: 96,  attend: 87, util: 72, trend: +3  },
    { name: 'Mild',  col: 'hsl(340 70% 60%)', rating: 4.8, classes: 74,  attend: 90, util: 78, trend: +9  },
    { name: 'Jo',    col: 'hsl(180 55% 45%)', rating: 4.5, classes: 52,  attend: 82, util: 64, trend: -4  },
  ];
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ color: adminTokens.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700, width: 40 }}>#</th>
          <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700 }}>เทรนเนอร์</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700 }}>เรตติ้ง</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700 }}>คลาส</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700 }}>% เข้าเรียน</th>
          <th style={{ textAlign: 'left', padding: '6px 14px', fontWeight: 700 }}>Utilization</th>
          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700, width: 70 }}>เติบโต</th>
        </tr>
      </thead>
      <tbody>
        {coaches.map((c, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${adminTokens.divider}` }}>
            <td style={{ padding: '10px 0' }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: i < 3 ? adminTokens.orangeSoft : adminTokens.subtle,
                color: i < 3 ? adminTokens.orange : adminTokens.muted,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800,
              }}>{i+1}</span>
            </td>
            <td style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: c.col, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                }}>{c.name[0]}</div>
                <span style={{ fontWeight: 700, color: adminTokens.black }}>Coach {c.name}</span>
              </div>
            </td>
            <td style={{ padding: '10px 0', textAlign: 'right' }}>
              <span style={{ fontWeight: 700, color: adminTokens.black,
                             fontVariantNumeric: 'tabular-nums' }}>★ {c.rating}</span>
            </td>
            <td style={{ padding: '10px 0', textAlign: 'right', color: adminTokens.ink2,
                         fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{c.classes}</td>
            <td style={{ padding: '10px 0', textAlign: 'right', color: adminTokens.ink2,
                         fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{c.attend}%</td>
            <td style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: adminTokens.subtle,
                              borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${c.util}%`, height: '100%', background: c.col }}/>
                </div>
                <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums',
                               color: adminTokens.black, fontWeight: 700, minWidth: 32 }}>{c.util}%</span>
              </div>
            </td>
            <td style={{ padding: '10px 0', textAlign: 'right' }}>
              <A_Delta v={c.trend}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* =============================================================
 *  MAIN PAGE
 * =========================================================== */
const AnalyticsPageV2 = () => {
  const [range, setRange] = useStateA('30d');
  const [compare, setCompare] = useStateA(true);
  const [tab, setTab] = useStateA(() => localStorage.getItem('moom-an-tab') || 'revenue');
  useEffectA(() => { localStorage.setItem('moom-an-tab', tab); }, [tab]);

  /* Seed sparkline series */
  const spRev    = useMemoA(() => genSeries(30, 14000, 3500, 1),  []);
  const spMember = useMemoA(() => genSeries(30, 230,   14,   2),  []);
  const spUtil   = useMemoA(() => genSeries(30, 72,    8,    3),  []);
  const spArpu   = useMemoA(() => genSeries(30, 2400,  180,  4),  []);

  return (
    <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 14,
                  maxWidth: 1400, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.02em' }}>
            วิเคราะห์ธุรกิจ
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: adminTokens.muted }}>
            รายได้ · สมาชิก · คลาส — ดูแนวโน้ม เปรียบเทียบ และลงลึกในตัวเลขของยิม
          </p>
        </div>
      </div>

      <AnalyticsToolbar range={range} setRange={setRange} compare={compare} setCompare={setCompare}/>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <AKpi label="รายได้รวม"         value="฿595,420" delta={12.4} compare="฿529,850"
              accent="orange" icon={aIcons.cash}  series={spRev}/>
        <AKpi label="สมาชิก Active"     value="247"      delta={5.8}  compare="234"
              accent="teal"   icon={aIcons.users} series={spMember}/>
        <AKpi label="Class Utilization" value="78%"      delta={-2.1} compare="80%"
              accent="info"   icon={aIcons.pulse} series={spUtil}/>
        <AKpi label="ARPU"              value="฿2,410"   delta={3.2}  compare="฿2,336"
              accent="pink"   icon={aIcons.trend} series={spArpu}/>
      </div>

      <AInsights/>

      {/* Tabs */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, padding: 4, display: 'inline-flex', gap: 2,
        boxShadow: adminTokens.shadowSm, alignSelf: 'flex-start',
      }}>
        {[
          { id: 'revenue', label: 'รายได้',  icon: aIcons.cash },
          { id: 'members', label: 'สมาชิก',   icon: aIcons.users },
          { id: 'classes', label: 'คลาส',     icon: aIcons.cal },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            height: 34, padding: '0 14px', borderRadius: 8, border: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            background: tab === t.id ? adminTokens.orange : 'transparent',
            color: tab === t.id ? '#fff' : adminTokens.muted,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <A_Icon d={t.icon} size={13}/> {t.label}
          </button>
        ))}
      </div>

      {tab === 'revenue' && <RevenueTab compare={compare}/>}
      {tab === 'members' && <MembersTab/>}
      {tab === 'classes' && <ClassesTab/>}
    </div>
  );
};

Object.assign(window, { AnalyticsPageV2 });
