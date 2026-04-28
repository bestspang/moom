/* MOOM Admin — Finance page
   - KPI strip (revenue, outstanding, refunds, payouts)
   - Revenue chart (stacked area, source breakdown, period switcher)
   - Operational row: outstanding invoices, payment methods, next payout
   - Transactions table
   - Tax & reports strip */

const { useState: useStateF, useMemo: useMemoF, useEffect: useEffectF } = React;

/* ---------- Icons ---------- */
const fIcons = {
  cash:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  card:    <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  alert:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  bank:    <><polygon points="3 21 21 21 21 10 12 3 3 10 3 21"/><line x1="8" y1="21" x2="8" y2="13"/><line x1="12" y1="21" x2="12" y2="13"/><line x1="16" y1="21" x2="16" y2="13"/></>,
  refund:  <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
  download:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload:  <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter:  <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  send:    <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  doc:     <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  tax:     <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
  trend:   <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  arrowR:  <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  apple:   <><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></>,
  line:    <><path d="M19.365 9.863c.349 0 .63.287.63.642 0 .354-.281.641-.63.641H17.61v1.125h1.755c.349 0 .63.287.63.642 0 .354-.281.641-.63.641h-2.386c-.349 0-.631-.287-.631-.641V8.228c0-.355.282-.641.631-.641h2.386c.349 0 .63.286.63.641 0 .354-.281.641-.63.641H17.61v1.125h1.755v-.131zm-3.855 2.49a.64.64 0 01-.635.636.637.637 0 01-.511-.255L12.518 10.4v2.273a.64.64 0 11-1.281 0V8.228a.641.641 0 011.145-.4l1.847 2.334V8.228a.641.641 0 111.281 0v4.447zM10.65 12.909a.637.637 0 01-.635.637.637.637 0 01-.635-.637V8.228a.641.641 0 011.27 0v4.681zM8.733 12.909a.64.64 0 01-.636.641H5.8a.64.64 0 01-.636-.641V8.228a.641.641 0 011.271 0v4.041h1.661c.349 0 .635.287.635.641zM24 10.314C24 4.943 18.615.571 12 .571S0 4.943 0 10.314c0 4.811 4.27 8.843 10.035 9.608.391.084.923.257 1.058.589.121.301.079.772.039 1.078l-.17 1.02c-.053.301-.24 1.179 1.034.642 1.274-.537 6.859-4.039 9.368-6.914 1.716-1.88 2.636-3.744 2.636-6.023z"/></>,
  qr:      <><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><path d="M15 15h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/></>,
  wallet:  <><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 000 4h16v4"/><path d="M16 12h5v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7"/><circle cx="16" cy="15" r="1"/></>,
};

/* ---------- Mock data ---------- */
const FINANCE_DATA = {
  // 30 days of revenue by source (packages, pt, retail, dropin)
  daily: Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const base = 28000 + Math.sin(i * 0.3) * 8000 + i * 400;
    // Weekend boost
    const dow = (i + 3) % 7;
    const weekend = (dow === 5 || dow === 6) ? 1.25 : 1;
    return {
      day,
      packages: Math.round(base * 0.62 * weekend),
      pt:       Math.round(base * 0.20 * weekend),
      retail:   Math.round(base * 0.10 * weekend),
      dropin:   Math.round(base * 0.08 * weekend),
    };
  }),
  outstanding: [
    { id: 'INV-00318', name: 'Thanin Sriprasert',  amount: 3900,  due: '12 ม.ค.', overdue: 18, attempt: 3, pkg: 'Unlimited Monthly', method: 'card' },
    { id: 'INV-00324', name: 'Korn Thanakit',      amount: 5200,  due: '14 ม.ค.', overdue: 16, attempt: 2, pkg: '20 Class Bundle', method: 'promptpay' },
    { id: 'INV-00347', name: 'Preecha Manop',      amount: 3900,  due: '19 ม.ค.', overdue: 11, attempt: 2, pkg: 'Unlimited Monthly', method: 'card' },
    { id: 'INV-00362', name: 'Anong Prasertsak',   amount: 2900,  due: '22 ม.ค.', overdue: 8,  attempt: 1, pkg: '10 Class Bundle', method: 'card' },
    { id: 'INV-00389', name: 'Suda Wongsawat',     amount: 10500, due: '26 ม.ค.', overdue: 4,  attempt: 1, pkg: 'Unlimited Quarterly', method: 'transfer' },
    { id: 'INV-00401', name: 'Napat Kongphop',     amount: 3900,  due: '28 ม.ค.', overdue: 2,  attempt: 0, pkg: 'Unlimited Monthly', method: 'card' },
    { id: 'INV-00412', name: 'Wirat Phanich',      amount: 2400,  due: '29 ม.ค.', overdue: 1,  attempt: 0, pkg: 'Yoga Pass 8', method: 'promptpay' },
    { id: 'INV-00418', name: 'Siriporn Chai',      amount: 3600,  due: '30 ม.ค.', overdue: 0,  attempt: 0, pkg: 'HIIT Pass 12', method: 'card' },
  ],
  txns: [
    { id: 'TXN-7G3H2K', date: '30 ม.ค. 14:32', name: 'Pim Chaiwat',       pkg: 'Unlimited Monthly',  amount: 3900,  net: 3803,  fee: 97,  method: 'card',      status: 'paid' },
    { id: 'TXN-7G3H1F', date: '30 ม.ค. 13:18', name: 'Ton Srisuk',        pkg: '10 Class Bundle',     amount: 2900,  net: 2828,  fee: 72,  method: 'promptpay', status: 'paid' },
    { id: 'TXN-7G3G9Z', date: '30 ม.ค. 11:05', name: 'Korn Thanakit',     pkg: '20 Class Bundle',     amount: 5200,  net: 5070,  fee: 130, method: 'promptpay', status: 'failed' },
    { id: 'TXN-7G3G2X', date: '30 ม.ค. 10:42', name: 'Nattaya Mongkon',   pkg: 'PT — 5 sessions',     amount: 7500,  net: 7312,  fee: 188, method: 'card',      status: 'paid' },
    { id: 'TXN-7G3F8Q', date: '30 ม.ค. 09:21', name: 'Boonrod Wichai',    pkg: 'Unlimited Monthly',   amount: 3900,  net: 3803,  fee: 97,  method: 'card',      status: 'paid' },
    { id: 'TXN-7G3F2A', date: '29 ม.ค. 18:44', name: 'Somchai Ruamsak',   pkg: 'Drop-in Single',      amount: 350,   net: 341,   fee: 9,   method: 'cash',      status: 'paid' },
    { id: 'TXN-7G3E9P', date: '29 ม.ค. 17:12', name: 'Urai Thanakit',     pkg: 'Protein Bar x10',     amount: 850,   net: 829,   fee: 21,  method: 'card',      status: 'paid' },
    { id: 'TXN-7G3E4K', date: '29 ม.ค. 15:55', name: 'Thanin Sriprasert', pkg: 'Refund — INV-00298', amount: -1450, net: -1450, fee: 0,   method: 'card',      status: 'refund' },
    { id: 'TXN-7G3D1L', date: '29 ม.ค. 14:27', name: 'Niran Ploytong',    pkg: 'Yoga Pass 8',         amount: 2400,  net: 2340,  fee: 60,  method: 'promptpay', status: 'paid' },
    { id: 'TXN-7G3C8H', date: '29 ม.ค. 11:09', name: 'Supaporn Keaw',     pkg: 'Unlimited Quarterly', amount: 10500, net: 10239, fee: 261, method: 'transfer',  status: 'pending' },
  ],
};

/* ---------- Primitives (F-prefix to avoid collisions) ---------- */
const FCard = ({ title, subtitle, action, children, pad = 16, minH, accent }) => (
  <div style={{
    background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
    display: 'flex', flexDirection: 'column', minHeight: minH, overflow: 'hidden',
  }}>
    {accent && <div style={{ height: 3, background: accent }}/>}
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

const FIcon = ({ d, size = 16, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const FPill = ({ children, color = adminTokens.muted, bg }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 9999, fontSize: 11,
    fontWeight: 700, whiteSpace: 'nowrap',
    background: bg, color,
  }}>{children}</span>
);

const FDelta = ({ v, suffix = '%' }) => {
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

const FBtn = ({ children, icon, primary, ghost, danger, onClick, small }) => {
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
      {icon && <FIcon d={icon} size={13} stroke={2.2}/>} {children}
    </button>
  );
};

const FSpark = ({ series, w = 80, h = 22, color = adminTokens.orange }) => {
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
 *  KPI STRIP — 4 hero cards
 * =========================================================== */
const FinanceKpi = () => {
  const d = FINANCE_DATA.daily;
  const totalMTD = d.reduce((s, r) => s + r.packages + r.pt + r.retail + r.dropin, 0);
  const dailyTotals = d.map(r => r.packages + r.pt + r.retail + r.dropin);
  const outstandingTotal = FINANCE_DATA.outstanding.reduce((s, r) => s + r.amount, 0);
  const refundsTotal = 8670;
  const fees = Math.round(totalMTD * 0.025);
  const netPayout = totalMTD - fees - refundsTotal;

  const kpis = [
    { label: 'รายได้เดือนนี้', value: `฿${(totalMTD/1000).toFixed(0)}K`,
      sub: `เฉลี่ย ฿${Math.round(totalMTD/30/1000)}K/วัน`,
      c: adminTokens.orange, icon: fIcons.cash, delta: 14,
      spark: dailyTotals.filter((_, i) => i % 3 === 0) },
    { label: 'ค้างชำระ', value: `฿${(outstandingTotal/1000).toFixed(0)}K`,
      sub: `${FINANCE_DATA.outstanding.length} ใบแจ้งหนี้`,
      c: adminTokens.destr, icon: fIcons.alert, delta: -5,
      spark: [28, 32, 35, 38, 36, 33, 29] },
    { label: 'คืนเงิน 30 วัน', value: `฿${(refundsTotal/1000).toFixed(1)}K`,
      sub: '3 รายการ',
      c: adminTokens.warn, icon: fIcons.refund, delta: -12,
      spark: [12, 14, 11, 10, 9, 8, 8.6] },
    { label: 'โอนเข้าบัญชี', value: `฿${(netPayout/1000).toFixed(0)}K`,
      sub: 'รอบถัดไป 2 ก.พ.',
      c: adminTokens.success, icon: fIcons.bank, delta: 16,
      spark: dailyTotals.filter((_, i) => i % 3 === 0).map(v => v * 0.92) },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          borderRadius: adminTokens.r3, padding: 16, boxShadow: adminTokens.shadowSm,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: k.c.replace(')', ' / 0.12)'), color: k.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><FIcon d={k.icon} size={16} stroke={2.2}/></div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: adminTokens.muted,
                          fontWeight: 600, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.label}</div>
            <FDelta v={k.delta}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1.1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 3 }}>{k.sub}</div>
            </div>
            <FSpark series={k.spark} color={k.c}/>
          </div>
        </div>
      ))}
    </div>
  );
};

/* =============================================================
 *  REVENUE CHART — 30-day stacked area by source
 * =========================================================== */
const RevenueChart = () => {
  const [period, setPeriod] = useStateF('30d');
  const periods = [
    { id: '7d',  label: '7 วัน' },
    { id: '30d', label: '30 วัน' },
    { id: 'mtd', label: 'MTD' },
    { id: 'ytd', label: 'YTD' },
  ];
  const d = FINANCE_DATA.daily.slice(period === '7d' ? -7 : 0);
  const sources = [
    { key: 'packages', label: 'แพ็คเกจ', color: adminTokens.orange },
    { key: 'pt',       label: 'PT',       color: adminTokens.info },
    { key: 'retail',   label: 'ร้านค้า',  color: adminTokens.teal },
    { key: 'dropin',   label: 'Drop-in',  color: adminTokens.pink },
  ];
  const total = d.reduce((s, r) => s + r.packages + r.pt + r.retail + r.dropin, 0);
  const maxDay = Math.max(...d.map(r => r.packages + r.pt + r.retail + r.dropin));
  const tallMax = Math.ceil(maxDay / 10000) * 10000;

  const W = 860, H = 280, PAD = { t: 16, r: 20, b: 32, l: 56 };
  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const x = i => PAD.l + (i / (d.length - 1)) * innerW;
  const y = v => PAD.t + innerH - (v / tallMax) * innerH;

  // build stacked areas
  const stacks = d.map(r => {
    let cum = 0;
    return sources.map(s => { const from = cum; cum += r[s.key]; return { from, to: cum }; });
  });
  const areaFor = (sIdx) => {
    const top = d.map((_, i) => `${x(i).toFixed(1)},${y(stacks[i][sIdx].to).toFixed(1)}`);
    const bot = d.map((_, i) => `${x(i).toFixed(1)},${y(stacks[i][sIdx].from).toFixed(1)}`).reverse();
    return `M${top.join(' L')} L${bot.join(' L')} Z`;
  };

  // legend totals
  const legendTotals = sources.map(s => ({ ...s, total: d.reduce((sum, r) => sum + r[s.key], 0) }));

  return (
    <FCard
      title="รายได้รายวัน"
      subtitle={`รวม ฿${(total/1000).toFixed(0)}K · เฉลี่ย ฿${Math.round(total/d.length/1000)}K/วัน`}
      action={
        <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle, borderRadius: 8 }}>
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
              border: 0, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              background: period === p.id ? adminTokens.surface : 'transparent',
              color: period === p.id ? adminTokens.black : adminTokens.muted,
              boxShadow: period === p.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            }}>{p.label}</button>
          ))}
        </div>
      }>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {legendTotals.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }}/>
            <div>
              <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums' }}>
                ฿{(s.total/1000).toFixed(0)}K
                <span style={{ fontSize: 11, color: adminTokens.mutedLight, fontWeight: 600, marginLeft: 4 }}>
                  {Math.round((s.total/total)*100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={PAD.t + innerH * p} x2={W - PAD.r} y2={PAD.t + innerH * p}
                  stroke={adminTokens.divider} strokeDasharray={i === 4 ? 'none' : '2 3'}/>
            <text x={PAD.l - 8} y={PAD.t + innerH * p + 4} fontSize="10"
                  fill={adminTokens.mutedLight} textAnchor="end">
              ฿{((tallMax * (1 - p))/1000).toFixed(0)}K
            </text>
          </g>
        ))}
        {/* stacked areas */}
        {sources.map((s, idx) => (
          <path key={s.key} d={areaFor(idx)} fill={s.color} opacity={0.85}/>
        ))}
        {/* x-axis ticks */}
        {d.map((r, i) => (i % Math.ceil(d.length / 8) === 0) && (
          <text key={i} x={x(i)} y={H - 10} fontSize="10" fill={adminTokens.mutedLight}
                textAnchor="middle">{r.day}</text>
        ))}
      </svg>
    </FCard>
  );
};

/* =============================================================
 *  OUTSTANDING INVOICES
 * =========================================================== */
const agingBucket = overdue => {
  if (overdue > 14) return { label: '15+ วัน', fg: adminTokens.destr, bg: adminTokens.destrSoft };
  if (overdue > 7)  return { label: '8–14 วัน', fg: adminTokens.warn,  bg: '#fef3c7' };
  if (overdue > 0)  return { label: '1–7 วัน',  fg: adminTokens.info,  bg: adminTokens.infoSoft };
  return { label: 'ครบกำหนด', fg: adminTokens.muted, bg: adminTokens.subtle };
};

const MethodIcon = ({ m, size = 14 }) => {
  const map = {
    card:      { d: fIcons.card,  c: adminTokens.info },
    promptpay: { d: fIcons.qr,    c: adminTokens.success },
    transfer:  { d: fIcons.bank,  c: adminTokens.teal },
    cash:      { d: fIcons.cash,  c: adminTokens.warn },
    apple:     { d: fIcons.apple, c: adminTokens.black },
    line:      { d: fIcons.line,  c: adminTokens.success },
  };
  const { d, c } = map[m] || map.card;
  return (
    <span style={{
      width: size + 12, height: size + 12, borderRadius: 8,
      background: c.replace(')', ' / 0.12)'), color: c,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}><FIcon d={d} size={size} stroke={2}/></span>
  );
};

const OutstandingCard = () => {
  const list = FINANCE_DATA.outstanding;
  const buckets = {
    gt14: list.filter(r => r.overdue > 14).reduce((s, r) => s + r.amount, 0),
    d7_14: list.filter(r => r.overdue > 7 && r.overdue <= 14).reduce((s, r) => s + r.amount, 0),
    d1_7: list.filter(r => r.overdue > 0 && r.overdue <= 7).reduce((s, r) => s + r.amount, 0),
    d0: list.filter(r => r.overdue === 0).reduce((s, r) => s + r.amount, 0),
  };
  const total = buckets.gt14 + buckets.d7_14 + buckets.d1_7 + buckets.d0 || 1;
  return (
    <FCard
      title="ค้างชำระ"
      subtitle={`${list.length} ใบแจ้งหนี้ · ฿${(list.reduce((s,r) => s+r.amount, 0)/1000).toFixed(0)}K`}
      action={<FBtn small icon={fIcons.send}>ส่งเตือนทั้งหมด</FBtn>}
      pad={0}
      accent={adminTokens.destr}>
      {/* Aging buckets — stacked bar */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${adminTokens.divider}` }}>
        <div style={{ display: 'flex', height: 8, borderRadius: 9999, overflow: 'hidden',
                      background: adminTokens.subtle, marginBottom: 8 }}>
          <div style={{ width: `${(buckets.gt14/total)*100}%`,  background: adminTokens.destr }}/>
          <div style={{ width: `${(buckets.d7_14/total)*100}%`, background: adminTokens.warn }}/>
          <div style={{ width: `${(buckets.d1_7/total)*100}%`,  background: adminTokens.info }}/>
          <div style={{ width: `${(buckets.d0/total)*100}%`,    background: adminTokens.muted }}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, fontSize: 10 }}>
          {[
            { c: adminTokens.destr, label: '15+ วัน',  v: buckets.gt14 },
            { c: adminTokens.warn,  label: '8–14',    v: buckets.d7_14 },
            { c: adminTokens.info,  label: '1–7',     v: buckets.d1_7 },
            { c: adminTokens.muted, label: 'ครบกำหนด', v: buckets.d0 },
          ].map((b, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: b.c }}/>
                <span style={{ color: adminTokens.muted, fontWeight: 600 }}>{b.label}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                ฿{(b.v/1000).toFixed(1)}K
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {list.map((r, i) => {
          const a = agingBucket(r.overdue);
          return (
            <div key={r.id} style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: i === list.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            }}>
              <MethodIcon m={r.method}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black,
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.name}
                  </span>
                  <FPill color={a.fg} bg={a.bg}>{r.overdue > 0 ? `+${r.overdue}d` : a.label}</FPill>
                </div>
                <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 1,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.id} · {r.pkg} · พยายาม {r.attempt}x
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black,
                              fontVariantNumeric: 'tabular-nums' }}>
                  ฿{r.amount.toLocaleString()}
                </div>
                <button style={{
                  marginTop: 2, background: 'transparent', border: 0, cursor: 'pointer',
                  color: adminTokens.orange, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                  padding: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                  ส่งเตือน <FIcon d={fIcons.send} size={10}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </FCard>
  );
};

/* =============================================================
 *  PAYMENT METHODS — donut + gateway fees
 * =========================================================== */
const PaymentMethodsCard = () => {
  const methods = [
    { id: 'card',      label: 'บัตรเครดิต/เดบิต', pct: 48, amount: 420500, fee: 2.8, color: adminTokens.info },
    { id: 'promptpay', label: 'PromptPay QR',    pct: 31, amount: 271600, fee: 0.5, color: adminTokens.success },
    { id: 'transfer',  label: 'โอนธนาคาร',        pct: 14, amount: 122600, fee: 0.0, color: adminTokens.teal },
    { id: 'cash',      label: 'เงินสด',           pct: 5,  amount: 43800,  fee: 0.0, color: adminTokens.warn },
    { id: 'apple',     label: 'Apple/Google Pay', pct: 2,  amount: 17500,  fee: 3.0, color: adminTokens.muted },
  ];

  // Build donut
  const size = 140, stroke = 22, cx = size/2, cy = size/2, r = (size - stroke)/2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <FCard title="วิธีชำระเงิน" subtitle="30 วันล่าสุด">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
        <svg width={size} height={size} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={adminTokens.subtle} strokeWidth={stroke}/>
          {methods.map(m => {
            const dash = (m.pct / 100) * C;
            const el = (
              <circle key={m.id} cx={cx} cy={cy} r={r} fill="none"
                      stroke={m.color} strokeWidth={stroke}
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={-offset}/>
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>รวมทั้งหมด</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: adminTokens.black,
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
            ฿{(methods.reduce((s, m) => s + m.amount, 0)/1000).toFixed(0)}K
          </div>
          <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 8, fontWeight: 600 }}>
            ค่าธรรมเนียมรวม
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: adminTokens.destr,
                        fontVariantNumeric: 'tabular-nums' }}>
            −฿{Math.round(methods.reduce((s, m) => s + m.amount * m.fee / 100, 0)).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
                    paddingTop: 10, borderTop: `1px solid ${adminTokens.divider}` }}>
        {methods.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: adminTokens.ink2,
                          fontWeight: 600, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</div>
            <div style={{ fontSize: 11, color: adminTokens.mutedLight, fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums' }}>
              {m.fee > 0 ? `${m.fee}%` : 'ฟรี'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black,
                          fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>
              {m.pct}%
            </div>
          </div>
        ))}
      </div>
    </FCard>
  );
};

/* =============================================================
 *  NEXT PAYOUT — highlighted card
 * =========================================================== */
const NextPayoutCard = () => {
  const rows = [
    { label: 'ยอดขายรวม',           v: 876400,  op: '+' },
    { label: 'ค่าธรรมเนียมชำระเงิน', v: -17600, op: '-' },
    { label: 'คืนเงิน',              v: -8670,  op: '-' },
    { label: 'ส่วนลด (รวมใน POS)',   v: -2400,  op: '-' },
  ];
  const net = rows.reduce((s, r) => s + r.v, 0);
  return (
    <FCard
      title="รอบการโอนถัดไป"
      subtitle="รอบ 1–31 ม.ค. · โอน 2 ก.พ."
      action={<FBtn small icon={fIcons.download}>Statement</FBtn>}
      accent={adminTokens.success}>
      <div style={{
        padding: 14, borderRadius: 12,
        background: `linear-gradient(135deg, ${adminTokens.successSoft} 0%, ${adminTokens.subtle} 100%)`,
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#fff',
            color: adminTokens.success, display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: adminTokens.shadowSm,
          }}><FIcon d={fIcons.bank} size={20} stroke={2.2}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>โอนเข้า</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              SCB xxx-xxx-3482
            </div>
            <div style={{ fontSize: 10, color: adminTokens.mutedLight }}>MOOM Fitness Co., Ltd.</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>ยอดโอนสุทธิ</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: adminTokens.black,
                      fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1.1 }}>
          ฿{net.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: adminTokens.muted, fontWeight: 600 }}>{r.label}</span>
            <span style={{ color: r.v < 0 ? adminTokens.destr : adminTokens.black,
                           fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {r.v < 0 ? '−' : '+'}฿{Math.abs(r.v).toLocaleString()}
            </span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '10px 0 0',
          borderTop: `1px dashed ${adminTokens.divider}`, marginTop: 4,
        }}>
          <span style={{ fontSize: 12, color: adminTokens.black, fontWeight: 800 }}>สุทธิ</span>
          <span style={{ fontSize: 14, color: adminTokens.success, fontWeight: 800,
                         fontVariantNumeric: 'tabular-nums' }}>
            ฿{net.toLocaleString()}
          </span>
        </div>
      </div>
    </FCard>
  );
};

/* =============================================================
 *  TRANSACTIONS TABLE — filterable + searchable
 * =========================================================== */
const TransactionsTable = () => {
  const [statusFilter, setStatusFilter] = useStateF('all');
  const [query, setQuery] = useStateF('');
  const [dateRange, setDateRange] = useStateF('30d');

  const statusMap = {
    paid:    { label: 'สำเร็จ',  fg: adminTokens.success, bg: adminTokens.successSoft },
    pending: { label: 'รอดำเนินการ', fg: adminTokens.warn,    bg: '#fef3c7' },
    failed:  { label: 'ล้มเหลว',   fg: adminTokens.destr,   bg: adminTokens.destrSoft },
    refund:  { label: 'คืนเงิน',   fg: adminTokens.muted,   bg: adminTokens.subtle },
  };

  const filtered = useMemoF(() => {
    return FINANCE_DATA.txns.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.pkg.toLowerCase().includes(q);
      }
      return true;
    });
  }, [statusFilter, query]);

  const statuses = [
    { id: 'all',     label: 'ทั้งหมด',   count: FINANCE_DATA.txns.length },
    { id: 'paid',    label: 'สำเร็จ',    count: FINANCE_DATA.txns.filter(t => t.status === 'paid').length },
    { id: 'pending', label: 'รอ',        count: FINANCE_DATA.txns.filter(t => t.status === 'pending').length },
    { id: 'failed',  label: 'ล้มเหลว',   count: FINANCE_DATA.txns.filter(t => t.status === 'failed').length },
    { id: 'refund',  label: 'คืนเงิน',   count: FINANCE_DATA.txns.filter(t => t.status === 'refund').length },
  ];

  const cols = '150px 1.4fr 1fr 120px 100px 120px 110px 40px';
  return (
    <FCard
      title="ธุรกรรม"
      subtitle={`${filtered.length} จากทั้งหมด ${FINANCE_DATA.txns.length} รายการ`}
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <FBtn small icon={fIcons.download}>ส่งออก CSV</FBtn>
        </div>
      } pad={0}>
      <div style={{
        padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', padding: 2, background: adminTokens.surface,
                      borderRadius: 8, border: `1px solid ${adminTokens.border}` }}>
          {statuses.map(s => (
            <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{
              height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
              border: 0, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              background: statusFilter === s.id ? adminTokens.orange : 'transparent',
              color: statusFilter === s.id ? '#fff' : adminTokens.muted,
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
            }}>
              {s.label}
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 9999,
                background: statusFilter === s.id ? 'rgba(255,255,255,.25)' : adminTokens.subtle,
                color: statusFilter === s.id ? '#fff' : adminTokens.muted,
              }}>{s.count}</span>
            </button>
          ))}
        </div>

        <div style={{
          height: 30, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
          background: adminTokens.surface, flex: 1, minWidth: 180, maxWidth: 280,
        }}>
          <FIcon d={fIcons.search} size={13} stroke={2.2}/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="ค้นหาชื่อ, รหัส TXN, แพ็คเกจ..." style={{
            border: 0, outline: 'none', fontSize: 12, fontFamily: 'inherit',
            flex: 1, background: 'transparent',
          }}/>
        </div>

        <div style={{ flex: 1 }}/>

        <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{
          height: 30, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
          borderRadius: 8, fontSize: 11, fontFamily: 'inherit', fontWeight: 700,
          background: adminTokens.surface, color: adminTokens.black, cursor: 'pointer',
        }}>
          <option value="today">วันนี้</option>
          <option value="7d">7 วันล่าสุด</option>
          <option value="30d">30 วันล่าสุด</option>
          <option value="custom">กำหนดเอง...</option>
        </select>
      </div>

      {/* Header row */}
      <div style={{
        display: 'grid', gridTemplateColumns: cols, padding: '10px 16px',
        fontSize: 10, fontWeight: 700, color: adminTokens.muted,
        letterSpacing: '.06em', textTransform: 'uppercase',
        borderBottom: `1px solid ${adminTokens.divider}`,
      }}>
        <div>วันที่ · TXN</div>
        <div>สมาชิก / รายการ</div>
        <div>วิธีชำระ</div>
        <div style={{ textAlign: 'right' }}>ยอด</div>
        <div style={{ textAlign: 'right' }}>ค่าธรรมเนียม</div>
        <div style={{ textAlign: 'right' }}>สุทธิ</div>
        <div>สถานะ</div>
        <div/>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: adminTokens.muted, fontSize: 13,
        }}>ไม่พบธุรกรรมที่ตรงกับเกณฑ์</div>
      ) : filtered.map((t, i) => {
        const s = statusMap[t.status];
        return (
          <div key={t.id} style={{
            display: 'grid', gridTemplateColumns: cols, padding: '14px 16px',
            alignItems: 'center',
            borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
            opacity: t.status === 'refund' ? 0.75 : 1,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{t.date}</div>
              <div style={{ fontSize: 10, color: adminTokens.mutedLight,
                            fontFamily: 'ui-monospace, Menlo, monospace' }}>{t.id}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 1,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.pkg}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MethodIcon m={t.method}/>
              <span style={{ fontSize: 12, color: adminTokens.ink2, fontWeight: 600 }}>
                {{card:'Card', promptpay:'PromptPay', transfer:'Transfer', cash:'Cash', apple:'Apple Pay', line:'LINE'}[t.method]}
              </span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800,
                          color: t.amount < 0 ? adminTokens.destr : adminTokens.black,
                          fontVariantNumeric: 'tabular-nums' }}>
              {t.amount < 0 ? '−' : ''}฿{Math.abs(t.amount).toLocaleString()}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: adminTokens.mutedLight,
                          fontVariantNumeric: 'tabular-nums' }}>
              {t.fee > 0 ? `−฿${t.fee}` : '—'}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700,
                          color: t.net < 0 ? adminTokens.destr : adminTokens.black,
                          fontVariantNumeric: 'tabular-nums' }}>
              {t.net < 0 ? '−' : ''}฿{Math.abs(t.net).toLocaleString()}
            </div>
            <div><FPill color={s.fg} bg={s.bg}>{s.label}</FPill></div>
            <button style={{
              background: 'transparent', border: 0, color: adminTokens.mutedLight, cursor: 'pointer',
              width: 28, height: 28, borderRadius: 6, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}><FIcon d={fIcons.dots} size={14}/></button>
          </div>
        );
      })}
    </FCard>
  );
};

/* =============================================================
 *  TAX & REPORTS STRIP
 * =========================================================== */
const TaxReportsCard = () => {
  const items = [
    { label: 'VAT 7% จัดเก็บ',  value: '฿61,348',  sub: 'ม.ค. 2025',          c: adminTokens.info,    icon: fIcons.tax },
    { label: 'ภาษีหัก ณ ที่จ่าย', value: '฿3,240',   sub: 'PT freelancer 3 คน', c: adminTokens.warn,    icon: fIcons.doc },
    { label: 'รายงาน P&L',       value: 'ม.ค. 2025', sub: 'พร้อมดาวน์โหลด',     c: adminTokens.success, icon: fIcons.trend, isAction: true },
    { label: 'ใบกำกับภาษี',      value: '128 ใบ',   sub: 'ส่ง e-Tax แล้ว',    c: adminTokens.teal,    icon: fIcons.doc },
  ];
  return (
    <FCard title="ภาษี & รายงาน" subtitle="เตรียมข้อมูลสำหรับบัญชี">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 12, background: adminTokens.subtle,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: it.c.replace(')', ' / 0.15)'), color: it.c,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><FIcon d={it.icon} size={14} stroke={2.2}/></div>
              <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600, flex: 1, minWidth: 0,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {it.label}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: adminTokens.black,
                            letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                {it.value}
              </div>
              <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 2 }}>{it.sub}</div>
            </div>
            <button style={{
              background: adminTokens.surface, color: adminTokens.black,
              border: `1px solid ${adminTokens.border}`, borderRadius: 8, padding: '6px 10px',
              fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              marginTop: 'auto',
            }}>
              <FIcon d={fIcons.download} size={11}/> ดาวน์โหลด
            </button>
          </div>
        ))}
      </div>
    </FCard>
  );
};

/* =============================================================
 *  PAGE SHELL
 * =========================================================== */
const FinancePageV2 = () => {
  return (
    <div style={{
      padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18,
      maxWidth: 1400, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: adminTokens.black,
                       letterSpacing: '-.02em' }}>การเงิน</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: adminTokens.muted }}>
            รายได้ ค้างชำระ การโอน และรายงานภาษี
          </p>
        </div>
        <FBtn icon={fIcons.upload}>อัพโหลดใบเสร็จ</FBtn>
        <FBtn primary icon={fIcons.download}>ส่งออกรายงาน</FBtn>
      </div>

      <FinanceKpi/>

      <RevenueChart/>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 14 }}>
        <OutstandingCard/>
        <PaymentMethodsCard/>
        <NextPayoutCard/>
      </div>

      <TransactionsTable/>

      <TaxReportsCard/>
    </div>
  );
};

Object.assign(window, { FinancePageV2, FINANCE_DATA });
