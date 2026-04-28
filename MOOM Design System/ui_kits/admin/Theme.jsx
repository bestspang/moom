/* MOOM Admin — 2026 theme refresh
   A modern, light, fast admin palette grounded in the existing orange brand
   but with better depth, color temperature, and readability.
   This file PATCHES adminTokens after Components.jsx loads, and exposes a
   handful of modernized primitives. */

(function() {
  if (typeof adminTokens === 'undefined') return;

  /* -------- Refreshed palette (modern slate + warm orange) -------- */
  Object.assign(adminTokens, {
    /* Brand */
    orange:       'hsl(22 95% 55%)',   /* slightly warmer, richer */
    orangeDeep:   'hsl(20 90% 46%)',   /* pressed / hover */
    orangeSoft:   'hsl(22 95% 55% / 0.10)',
    orangeTint:   'hsl(28 90% 97%)',
    orangeBorder: 'hsl(22 95% 55% / 0.22)',

    /* Surfaces — cool off-white, layered */
    bg:           'hsl(220 20% 98%)',  /* page */
    surface:      'hsl(0 0% 100%)',    /* card */
    subtle:       'hsl(220 20% 96%)',  /* sunken */
    cream:        'hsl(28 30% 97%)',   /* sidebar — warmer */
    creamHover:   'hsl(28 30% 93%)',

    /* Borders — cooler, softer */
    border:       'hsl(220 16% 90%)',
    borderStrong: 'hsl(220 16% 85%)',
    divider:      'hsl(220 16% 94%)',

    /* Text — deep slate, improved contrast */
    black:        'hsl(222 28% 12%)',  /* was 15% — more legible */
    ink2:         'hsl(222 20% 25%)',
    muted:        'hsl(220 10% 46%)',  /* AAA on #fff */
    mutedLight:   'hsl(220 12% 65%)',

    /* Status — modern, vibrant */
    teal:         'hsl(168 75% 42%)',
    tealSoft:     'hsl(168 75% 42% / 0.12)',
    info:         'hsl(212 95% 56%)',  /* brighter blue */
    infoSoft:     'hsl(212 95% 56% / 0.12)',
    warn:         'hsl(38 92% 50%)',
    warnSoft:     'hsl(38 92% 50% / 0.15)',
    destr:        'hsl(0 78% 60%)',    /* was 71% — more readable red */
    destrSoft:    'hsl(0 78% 60% / 0.12)',
    pink:         'hsl(330 80% 58%)',
    slate:        'hsl(220 14% 50%)',
    success:      'hsl(152 60% 42%)',
    successSoft:  'hsl(152 60% 42% / 0.14)',

    /* Elevation (box-shadow tokens) */
    shadowSm:     '0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.04)',
    shadowMd:     '0 2px 4px rgba(15,23,42,.04), 0 4px 12px rgba(15,23,42,.05)',
    shadowLg:     '0 8px 24px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.04)',
    shadowOrange: '0 4px 14px hsl(22 95% 55% / 0.28)',

    /* Radius scale */
    r1: '6px', r2: '10px', r3: '14px', r4: '18px',
  });

  /* Push the new bg into html */
  const htmlStyle = document.documentElement.style;
  htmlStyle.setProperty('--admin-bg', adminTokens.bg);
  document.body.style.background = adminTokens.bg;
  document.body.style.color = adminTokens.black;
})();

/* -------- Modernized primitives -------- */

/* Refined KPI card: no hard left-bar, pill icon chip in tinted tone */
const KpiCardV2 = ({ label, value, suffix, accent = 'orange', icon, delta }) => {
  const accentMap = {
    orange: { fg: adminTokens.orange, bg: adminTokens.orangeSoft },
    teal:   { fg: adminTokens.teal,   bg: adminTokens.tealSoft },
    info:   { fg: adminTokens.info,   bg: adminTokens.infoSoft },
    pink:   { fg: adminTokens.pink,   bg: 'hsl(330 80% 58% / 0.12)' },
    slate:  { fg: adminTokens.slate,  bg: 'hsl(220 14% 50% / 0.1)' },
    warn:   { fg: adminTokens.warn,   bg: adminTokens.warnSoft },
    success:{ fg: adminTokens.success,bg: adminTokens.successSoft },
  };
  const a = accentMap[accent] || accentMap.orange;
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, padding: 16,
      boxShadow: adminTokens.shadowSm,
      display: 'flex', flexDirection: 'column', gap: 10, minHeight: 108,
      transition: 'all .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = adminTokens.shadowMd; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = adminTokens.shadowSm; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: a.bg, color: a.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon && <A_Icon d={icon} size={16} stroke={2.2}/>}</div>
        {delta && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: delta.startsWith('-') ? adminTokens.destr : adminTokens.success,
            background: delta.startsWith('-') ? adminTokens.destrSoft : adminTokens.successSoft,
            padding: '2px 8px', borderRadius: 9999,
          }}>{delta}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 12, color: adminTokens.muted, fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{
          fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          color: adminTokens.black, lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>{value}</div>
        {suffix && <div style={{ fontSize: 11, color: adminTokens.mutedLight, marginTop: 4 }}>{suffix}</div>}
      </div>
    </div>
  );
};

/* Refined HeaderBtn with press state and subtle depth */
const HeaderBtnV2 = ({ icon, children, primary, onClick }) => (
  <button onClick={onClick} style={{
    background: primary ? adminTokens.orange : adminTokens.surface,
    color: primary ? '#fff' : adminTokens.black,
    border: primary ? 0 : `1px solid ${adminTokens.border}`,
    height: 38, padding: '0 14px', borderRadius: adminTokens.r2,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: primary ? adminTokens.shadowOrange : adminTokens.shadowSm,
    transition: 'all .15s',
  }}
  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
    {icon && <A_Icon d={icon} size={14} stroke={2.2}/>} {children}
  </button>
);

/* Modern SearchBar for command-bar feel in top header */
const AdminSearch = () => (
  <div style={{
    height: 38, flex: 1, maxWidth: 360,
    background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
    borderRadius: adminTokens.r2, padding: '0 12px',
    display: 'flex', alignItems: 'center', gap: 8, color: adminTokens.muted,
  }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
    <input placeholder="ค้นหาสมาชิก, คลาส, แพ็คเกจ..." style={{
      border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit',
      fontSize: 13, color: adminTokens.black, flex: 1,
    }}/>
    <kbd style={{
      fontSize: 10, fontWeight: 700, color: adminTokens.muted,
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
    }}>⌘K</kbd>
  </div>
);

Object.assign(window, { KpiCardV2, HeaderBtnV2, AdminSearch });
