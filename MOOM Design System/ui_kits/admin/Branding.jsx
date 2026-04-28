/* MOOM Admin — Branding (แบรนด์ยิม)
   Left: editable sections. Right: live preview that updates instantly.
   Sticky save bar, export brand kit, reset-to-defaults. */

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB, useRef: useRefB } = React;

/* ---------- Icons ---------- */
const bIcons = {
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  chev:    <><polyline points="6 9 12 15 18 9"/></>,
  chevR:   <><polyline points="9 18 15 12 9 6"/></>,
  upload:  <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  image:   <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  type:    <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  palette: <><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.8 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  reset:   <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
  save:    <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
  dl:      <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  copy:    <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  info:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  sparkle: <><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></>,
  phone:   <><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12" y2="18"/></>,
  web:     <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
  biz:     <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  ig:      <><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></>,
  fb:      <><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></>,
  tt:      <><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></>,
  yt:      <><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></>,
  line:    <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  map:     <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  mail:    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  phone2:  <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  mobile:  <><rect x="5" y="2" width="14" height="20" rx="3"/></>,
  desktop: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
  card:    <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
};

const BIcon = ({ d, size=16, stroke=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* ---------- Defaults ---------- */
const DEFAULT_BRAND = {
  name: 'MOOM CLUB',
  tagline: 'ฟิตเนสและคลาสสำหรับไลฟ์สไตล์คนกรุง',
  about: 'MOOM CLUB คือคอมมูนิตี้ฟิตเนสที่ช่วยให้คุณเคลื่อนไหวสนุก ฟิตในแบบของคุณ ด้วยคลาสหลากหลาย โค้ชมืออาชีพ และยิมที่ออกแบบมาเพื่อให้คุณมาอยากออกกำลังกายจริงๆ',
  logoLetter: 'M',
  logoStyle: 'square',     // square | circle | wordmark
  primary:   'hsl(22 95% 55%)',
  secondary: 'hsl(222 28% 12%)',
  accent:    'hsl(168 75% 42%)',
  surface:   'hsl(28 30% 97%)',
  font: 'Anuphan',
  fontWeight: 800,
  radius: 12,
  photoStyle: 'warm',      // warm | cool | mono | vibrant
  social: {
    ig:   '@moomclub',
    fb:   'moomclubbkk',
    line: '@moomclub',
    tt:   '',
    yt:   '',
    web:  'moomclub.co',
  },
  contact: {
    phone: '02-234-5678',
    mail:  'hello@moomclub.co',
    addr:  '123 ถนนอโศก แขวงคลองเตย เขตวัฒนา กรุงเทพฯ 10110',
  },
};

const COLOR_PRESETS = [
  { name:'Signature',  primary:'hsl(22 95% 55%)',  secondary:'hsl(222 28% 12%)', accent:'hsl(168 75% 42%)' },
  { name:'Midnight',   primary:'hsl(252 80% 62%)', secondary:'hsl(230 40% 14%)', accent:'hsl(190 85% 55%)' },
  { name:'Forest',     primary:'hsl(152 55% 38%)', secondary:'hsl(160 30% 12%)', accent:'hsl(42 95% 55%)' },
  { name:'Blush',      primary:'hsl(342 75% 55%)', secondary:'hsl(330 25% 14%)', accent:'hsl(28 90% 60%)' },
  { name:'Ocean',      primary:'hsl(212 90% 48%)', secondary:'hsl(220 40% 14%)', accent:'hsl(168 75% 48%)' },
  { name:'Sunset',     primary:'hsl(14 88% 58%)',  secondary:'hsl(280 35% 16%)', accent:'hsl(48 95% 60%)' },
  { name:'Mono',       primary:'hsl(0 0% 14%)',    secondary:'hsl(0 0% 32%)',    accent:'hsl(0 0% 60%)' },
  { name:'Neon',       primary:'hsl(88 85% 50%)',  secondary:'hsl(260 50% 16%)', accent:'hsl(320 90% 60%)' },
];

const FONT_CHOICES = [
  { id:'Anuphan',             label:'Anuphan',        mood:'Modern · Warm'    },
  { id:'IBM Plex Sans Thai',  label:'IBM Plex',       mood:'Clean · Technical'},
  { id:'Noto Sans Thai',      label:'Noto Sans',      mood:'Neutral · Readable'},
  { id:'Sarabun',             label:'Sarabun',        mood:'Classic · Friendly'},
  { id:'Prompt',              label:'Prompt',         mood:'Bold · Sporty'    },
];

const PHOTO_STYLES = [
  { id:'warm',    label:'อบอุ่น',  filter:'saturate(1.1) hue-rotate(-5deg) brightness(1.02)' },
  { id:'cool',    label:'คูล',     filter:'saturate(.9) hue-rotate(15deg) brightness(.98)' },
  { id:'mono',    label:'ขาวดำ',  filter:'saturate(0) contrast(1.1)' },
  { id:'vibrant', label:'สด',      filter:'saturate(1.4) contrast(1.05)' },
];

/* ---------- Shared primitives ---------- */
const BCard = ({ title, subtitle, action, children, icon, accent }) => (
  <div style={{
    background:adminTokens.surface, border:`1px solid ${adminTokens.border}`,
    borderRadius:adminTokens.r3, boxShadow:adminTokens.shadowSm, overflow:'hidden',
  }}>
    {title && (
      <div style={{
        padding:'14px 16px', display:'flex', alignItems:'center', gap:10,
        borderBottom:`1px solid ${adminTokens.divider}`,
      }}>
        {icon && (
          <div style={{
            width:30, height:30, borderRadius:8,
            background: accent ? accent+'22' : adminTokens.orangeSoft,
            color: accent || adminTokens.orange,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><BIcon d={icon} size={15} stroke={2.2}/></div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:adminTokens.black, letterSpacing:'-.005em' }}>{title}</div>
          {subtitle && <div style={{ fontSize:11, color:adminTokens.muted, marginTop:2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    <div style={{ padding:16 }}>{children}</div>
  </div>
);

const BLabel = ({ children, hint, required }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
    <span style={{ fontSize:11, fontWeight:800, color:adminTokens.black,
                    textTransform:'uppercase', letterSpacing:'.04em' }}>{children}</span>
    {required && <span style={{ color:adminTokens.destr, fontSize:11 }}>*</span>}
    {hint && <span style={{ fontSize:10.5, color:adminTokens.muted, fontWeight:500, textTransform:'none', letterSpacing:0 }}>{hint}</span>}
  </div>
);

const BInput = ({ value, onChange, placeholder, prefix, suffix, rows }) => {
  const isTextarea = rows && rows > 1;
  const El = isTextarea ? 'textarea' : 'input';
  return (
    <div style={{
      display:'flex', alignItems: isTextarea ? 'stretch' : 'center', gap:0,
      background:adminTokens.surface, border:`1px solid ${adminTokens.border}`, borderRadius:adminTokens.r2,
      transition:'border-color .15s, box-shadow .15s',
    }}>
      {prefix && (
        <span style={{ padding:'0 10px', display:'flex', alignItems:'center',
                        color:adminTokens.muted, fontSize:12, fontWeight:600,
                        borderRight:`1px solid ${adminTokens.border}`, background:adminTokens.subtle,
                        borderRadius:`${adminTokens.r2}px 0 0 ${adminTokens.r2}px` }}>{prefix}</span>
      )}
      <El value={value || ''} onChange={e => onChange(e.target.value)}
           placeholder={placeholder}
           rows={rows}
           style={{
             flex:1, border:0, outline:'none', background:'transparent',
             padding: isTextarea ? '10px 12px' : '0 12px',
             height: isTextarea ? 'auto' : 36,
             fontFamily:'inherit', fontSize:13, color:adminTokens.black,
             resize: isTextarea ? 'vertical' : 'none',
             minHeight: isTextarea ? 80 : undefined,
           }}/>
      {suffix && (
        <span style={{ padding:'0 10px', color:adminTokens.muted, fontSize:11, fontWeight:600 }}>{suffix}</span>
      )}
    </div>
  );
};

const BBtn = ({ children, icon, primary, ghost, danger, small, onClick, active, title }) => {
  const h = small ? 30 : 34;
  const p = small ? '0 10px' : '0 13px';
  let bg, color, border, sh = 'none';
  if (primary)      { bg=adminTokens.orange; color='#fff'; border=0; sh=adminTokens.shadowOrange; }
  else if (danger)  { bg=adminTokens.surface; color=adminTokens.destr; border=`1px solid ${adminTokens.border}`; }
  else if (ghost)   { bg= active ? adminTokens.subtle : 'transparent'; color= active ? adminTokens.black : adminTokens.muted; border=0; }
  else              { bg=adminTokens.surface; color=adminTokens.black; border=`1px solid ${adminTokens.border}`; }
  return (
    <button onClick={onClick} title={title} style={{
      background:bg, color, border, height:h, padding:p, borderRadius:adminTokens.r2,
      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
      display:'inline-flex', alignItems:'center', gap:6, boxShadow:sh, whiteSpace:'nowrap',
    }}>
      {icon && <BIcon d={icon} size={13} stroke={2.2}/>}
      {children}
    </button>
  );
};

/* ---------- Color picker ---------- */
const hslMatch = (c) => {
  const m = String(c).match(/hsl\(\s*(-?[\d.]+)\s+(-?[\d.]+)%?\s+(-?[\d.]+)%?\s*\)/);
  return m ? { h:+m[1], s:+m[2], l:+m[3] } : { h:22, s:95, l:55 };
};
const hslStr = ({h,s,l}) => `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
const hslToHex = (c) => {
  const {h, s, l} = hslMatch(c);
  const sd = s/100, ld = l/100;
  const k = (n) => (n + h/30) % 12;
  const a = sd * Math.min(ld, 1-ld);
  const f = (n) => {
    const x = ld - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
    return Math.round(255 * x).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
};

const ColorSwatch = ({ color, label, onChange, size=56 }) => {
  const [open, setOpen] = useStateB(false);
  const hsl = hslMatch(color);
  const ref = useRefB(null);

  useEffectB(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', padding:10, background:adminTokens.surface,
        border:`1px solid ${adminTokens.border}`, borderRadius:adminTokens.r2,
        cursor:'pointer', fontFamily:'inherit', textAlign:'left',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{
          width:size, height:size, borderRadius:8, background:color, flexShrink:0,
          boxShadow:'inset 0 0 0 1px rgba(0,0,0,.08)',
        }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10.5, color:adminTokens.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>
            {label}
          </div>
          <div style={{ fontSize:13, fontWeight:800, color:adminTokens.black, fontFamily:'monospace', fontVariantNumeric:'tabular-nums' }}>
            {hslToHex(color).toUpperCase()}
          </div>
          <div style={{ fontSize:10.5, color:adminTokens.mutedLight, fontWeight:600, fontFamily:'monospace' }}>
            H {Math.round(hsl.h)}° · S {Math.round(hsl.s)}% · L {Math.round(hsl.l)}%
          </div>
        </div>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:50,
          background:adminTokens.surface, border:`1px solid ${adminTokens.border}`,
          borderRadius:adminTokens.r3, boxShadow:adminTokens.shadowLg, padding:14,
        }}>
          <div style={{
            height:120, borderRadius:8, marginBottom:10,
            background:`linear-gradient(to right, hsl(0 ${hsl.s}% ${hsl.l}%), hsl(60 ${hsl.s}% ${hsl.l}%), hsl(120 ${hsl.s}% ${hsl.l}%), hsl(180 ${hsl.s}% ${hsl.l}%), hsl(240 ${hsl.s}% ${hsl.l}%), hsl(300 ${hsl.s}% ${hsl.l}%), hsl(360 ${hsl.s}% ${hsl.l}%))`,
            position:'relative',
          }}>
            <div style={{
              position:'absolute', top:4, bottom:4,
              left:`calc(${(hsl.h/360)*100}% - 3px)`,
              width:6, background:'#fff', borderRadius:3,
              boxShadow:'0 0 0 1px rgba(0,0,0,.3)',
            }}/>
          </div>
          {[
            { k:'h', label:'Hue',        min:0, max:360, val:hsl.h, suffix:'°' },
            { k:'s', label:'Saturation', min:0, max:100, val:hsl.s, suffix:'%' },
            { k:'l', label:'Lightness',  min:0, max:100, val:hsl.l, suffix:'%' },
          ].map(sl => (
            <div key={sl.k} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:10.5, fontWeight:800, color:adminTokens.muted, textTransform:'uppercase', letterSpacing:'.04em' }}>{sl.label}</span>
                <span style={{ fontSize:11, fontWeight:800, color:adminTokens.black, fontFamily:'monospace' }}>{Math.round(sl.val)}{sl.suffix}</span>
              </div>
              <input type="range" min={sl.min} max={sl.max} value={sl.val}
                     onChange={e => onChange(hslStr({ ...hsl, [sl.k]: +e.target.value }))}
                     style={{ width:'100%' }}/>
            </div>
          ))}
          <div style={{ display:'flex', gap:6, alignItems:'center', paddingTop:8, borderTop:`1px solid ${adminTokens.divider}` }}>
            <span style={{ fontSize:10.5, fontWeight:700, color:adminTokens.muted }}>HEX</span>
            <input value={hslToHex(color).toUpperCase()} readOnly
                   style={{
                     flex:1, height:28, padding:'0 8px',
                     border:`1px solid ${adminTokens.border}`, borderRadius:6,
                     fontFamily:'monospace', fontSize:12, fontWeight:700, color:adminTokens.black,
                     background:adminTokens.subtle, outline:'none',
                   }}/>
            <button onClick={() => { navigator.clipboard?.writeText(hslToHex(color)); }}
                    style={{ width:28, height:28, border:`1px solid ${adminTokens.border}`,
                              background:adminTokens.surface, borderRadius:6, cursor:'pointer',
                              color:adminTokens.muted,
                              display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                    title="Copy">
              <BIcon d={bIcons.copy} size={12}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Logo preview (rendered from state) ---------- */
const LogoMark = ({ brand, size=56, inverse }) => {
  const isCircle = brand.logoStyle === 'circle';
  const isWord = brand.logoStyle === 'wordmark';
  if (isWord) {
    return (
      <div style={{
        height:size, padding:`0 ${size*0.3}px`,
        background: inverse ? brand.primary : brand.secondary,
        color:'#fff',
        display:'inline-flex', alignItems:'center',
        fontWeight:brand.fontWeight, fontSize:size*0.42, letterSpacing:'.08em',
        borderRadius: brand.radius * 0.6,
        fontFamily: `"${brand.font}", sans-serif`,
      }}>{brand.name}</div>
    );
  }
  return (
    <div style={{
      width:size, height:size,
      background: inverse ? brand.secondary : brand.primary,
      color:'#fff',
      borderRadius: isCircle ? '50%' : brand.radius * (size/80),
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontWeight:brand.fontWeight, fontSize:size*0.5, letterSpacing:'-.02em',
      fontFamily: `"${brand.font}", sans-serif`,
    }}>{brand.logoLetter}</div>
  );
};

/* ---------- Photo placeholder (styled SVG) ---------- */
const PhotoBlock = ({ brand, w=240, h=160, scene='gym' }) => {
  const photoStyle = PHOTO_STYLES.find(p => p.id === brand.photoStyle);
  const gradients = {
    gym:   [['hsl(22 75% 65%)','hsl(22 85% 45%)'], ['hsl(168 55% 55%)','hsl(168 65% 35%)']],
    class: [['hsl(280 60% 60%)','hsl(320 70% 45%)'], ['hsl(42 90% 60%)','hsl(22 90% 50%)']],
    coach: [['hsl(212 70% 55%)','hsl(252 65% 40%)'], ['hsl(22 90% 55%)','hsl(342 75% 50%)']],
  };
  const [a, b] = gradients[scene][0];
  return (
    <div style={{
      width:w, height:h, borderRadius:brand.radius,
      background:`linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
      filter: photoStyle?.filter, position:'relative', overflow:'hidden',
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
        <circle cx={w*0.75} cy={h*0.35} r={h*0.28} fill="rgba(255,255,255,.15)"/>
        <rect x={w*0.1} y={h*0.55} width={w*0.35} height={h*0.3} rx="4" fill="rgba(0,0,0,.15)"/>
        <rect x={w*0.5} y={h*0.65} width={w*0.4} height={h*0.2} rx="4" fill="rgba(255,255,255,.1)"/>
      </svg>
    </div>
  );
};

/* ---------- Preview: App mockup ---------- */
const AppPreview = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  return (
    <div style={{
      width:'100%', maxWidth:360, margin:'0 auto',
      borderRadius:32, background:'#0b0d12', padding:6,
      boxShadow:'0 30px 60px rgba(15,23,42,.18), 0 8px 20px rgba(15,23,42,.08)',
    }}>
      <div style={{
        borderRadius:26, background:brand.surface, overflow:'hidden',
        height:620, display:'flex', flexDirection:'column',
        fontFamily,
      }}>
        {/* Status bar */}
        <div style={{ padding:'12px 18px 6px', display:'flex', justifyContent:'space-between',
                       fontSize:11, fontWeight:700, color:brand.secondary }}>
          <span>9:41</span>
          <span style={{ letterSpacing:'.1em' }}>•••</span>
        </div>

        {/* Header */}
        <div style={{ padding:'8px 18px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <LogoMark brand={brand} size={36}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:brand.fontWeight, color:brand.secondary, letterSpacing:'-.01em' }}>
              {brand.name}
            </div>
            <div style={{ fontSize:10.5, color:brand.secondary, opacity:.6, fontWeight:500,
                           whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {brand.tagline}
            </div>
          </div>
          <div style={{ width:34, height:34, borderRadius:'50%',
                         background:brand.primary+'1f', color:brand.primary,
                         display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BIcon d={bIcons.eye} size={16} stroke={2.2}/>
          </div>
        </div>

        {/* Hero card */}
        <div style={{ padding:'0 14px', marginBottom:14 }}>
          <div style={{
            borderRadius:brand.radius+4, overflow:'hidden', position:'relative',
            background:`linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
            padding:18, color:'#fff', minHeight:130,
          }}>
            <div style={{ fontSize:10.5, fontWeight:700, opacity:.75, textTransform:'uppercase', letterSpacing:'.08em' }}>
              Today
            </div>
            <div style={{ fontSize:20, fontWeight:brand.fontWeight, lineHeight:1.15, letterSpacing:'-.02em', marginTop:6, maxWidth:'70%' }}>
              HIIT กับโค้ชพิม · 18:00
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <div style={{
                padding:'6px 12px', borderRadius:9999, background:'#fff', color:brand.secondary,
                fontSize:11, fontWeight:700,
              }}>จองคลาส</div>
              <div style={{
                padding:'6px 12px', borderRadius:9999,
                background:'rgba(255,255,255,.2)', color:'#fff', fontSize:11, fontWeight:700,
              }}>ดูรายละเอียด</div>
            </div>
            <div style={{
              position:'absolute', right:-20, bottom:-20, width:130, height:130,
              borderRadius:'50%', background:brand.accent+'30',
            }}/>
          </div>
        </div>

        {/* Chips */}
        <div style={{ padding:'0 14px 10px', display:'flex', gap:6, overflow:'hidden' }}>
          {['ทั้งหมด','HIIT','Yoga','Pilates'].map((t, i) => (
            <div key={t} style={{
              padding:'6px 12px', borderRadius:9999,
              background: i===0 ? brand.primary : brand.primary+'18',
              color: i===0 ? '#fff' : brand.primary,
              fontSize:11, fontWeight:700, whiteSpace:'nowrap',
            }}>{t}</div>
          ))}
        </div>

        {/* Cards list */}
        <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:8, flex:1 }}>
          {[
            { t:'Yoga Flow · โค้ชนก',    time:'07:30',  full:'12/16', fill:0.75 },
            { t:'Spin Express · โค้ชอาร์ม', time:'12:00', full:'18/20', fill:0.9 },
            { t:'Pilates Reformer · พิม', time:'18:30', full:'6/10',  fill:0.6 },
          ].map((c, i) => (
            <div key={i} style={{
              borderRadius:brand.radius, background:'#fff',
              border:`1px solid ${brand.secondary}12`, padding:12,
              display:'flex', alignItems:'center', gap:10,
            }}>
              <div style={{
                width:40, height:40, borderRadius:brand.radius*0.7,
                background: brand.accent+'22', color:brand.accent,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:800, flexShrink:0,
              }}>{c.time.split(':')[0]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:brand.secondary,
                               whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.t}</div>
                <div style={{ height:4, background:brand.primary+'1a', borderRadius:9999, marginTop:5, overflow:'hidden' }}>
                  <div style={{ width:`${c.fill*100}%`, height:'100%', background:brand.primary, borderRadius:9999 }}/>
                </div>
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:brand.secondary, opacity:.6 }}>{c.full}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{
          padding:'8px 18px 14px',
          borderTop:`1px solid ${brand.secondary}10`, background:'#fff',
          display:'flex', justifyContent:'space-around',
        }}>
          {[bIcons.grid, bIcons.image, bIcons.sparkle, bIcons.type].map((d, i) => (
            <div key={i} style={{
              color: i === 0 ? brand.primary : brand.secondary,
              opacity: i === 0 ? 1 : 0.4,
            }}>
              <BIcon d={d} size={20} stroke={2.2}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- Preview: marketing web card ---------- */
const WebPreview = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  return (
    <div style={{
      borderRadius:adminTokens.r3, overflow:'hidden',
      border:`1px solid ${adminTokens.border}`, fontFamily,
    }}>
      {/* browser chrome */}
      <div style={{
        height:26, background:adminTokens.subtle,
        borderBottom:`1px solid ${adminTokens.border}`,
        padding:'0 10px', display:'flex', alignItems:'center', gap:6,
      }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'hsl(0 78% 60%)' }}/>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'hsl(38 92% 50%)' }}/>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'hsl(152 60% 42%)' }}/>
        <div style={{ flex:1, marginLeft:6, height:14, background:adminTokens.surface,
                       border:`1px solid ${adminTokens.border}`, borderRadius:4, fontSize:9,
                       display:'flex', alignItems:'center', padding:'0 8px',
                       color:adminTokens.muted, fontWeight:600 }}>
          {brand.social.web || 'moomclub.co'}
        </div>
      </div>

      {/* nav */}
      <div style={{
        padding:'14px 22px', display:'flex', alignItems:'center', gap:20,
        background:'#fff', borderBottom:`1px solid ${brand.secondary}15`,
      }}>
        <LogoMark brand={brand} size={30}/>
        <div style={{ fontSize:13, fontWeight:brand.fontWeight, color:brand.secondary }}>{brand.name}</div>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:11, color:brand.secondary, opacity:.7, fontWeight:600 }}>คลาส</span>
        <span style={{ fontSize:11, color:brand.secondary, opacity:.7, fontWeight:600 }}>แพ็คเกจ</span>
        <span style={{ fontSize:11, color:brand.secondary, opacity:.7, fontWeight:600 }}>เกี่ยวกับ</span>
        <div style={{
          padding:'6px 12px', borderRadius:9999, background:brand.primary, color:'#fff',
          fontSize:11, fontWeight:700,
        }}>เริ่มเลย</div>
      </div>

      {/* hero */}
      <div style={{
        padding:'40px 32px', background:brand.surface, position:'relative', overflow:'hidden',
      }}>
        <div style={{
          display:'inline-block', padding:'4px 10px', borderRadius:9999,
          background:brand.primary+'18', color:brand.primary, fontSize:10, fontWeight:800,
          textTransform:'uppercase', letterSpacing:'.06em',
        }}>โปรใหม่ · เดือนพฤษภาคม</div>
        <div style={{
          fontSize:34, fontWeight:brand.fontWeight, color:brand.secondary,
          lineHeight:1.05, letterSpacing:'-.03em', marginTop:12, maxWidth:'70%',
        }}>
          ฟิตในแบบของคุณ<br/>
          <span style={{ color:brand.primary }}>ที่ {brand.name.toLowerCase()}</span>
        </div>
        <div style={{
          fontSize:13, color:brand.secondary, opacity:.7, marginTop:10, maxWidth:'65%', lineHeight:1.5, fontWeight:500,
        }}>{brand.tagline}</div>
        <div style={{ display:'flex', gap:8, marginTop:18 }}>
          <div style={{
            padding:'10px 18px', borderRadius:brand.radius*0.7, background:brand.primary, color:'#fff',
            fontSize:12, fontWeight:800,
          }}>ลองเลย</div>
          <div style={{
            padding:'10px 18px', borderRadius:brand.radius*0.7,
            background:'#fff', border:`1px solid ${brand.secondary}20`, color:brand.secondary,
            fontSize:12, fontWeight:700,
          }}>ดูแพ็คเกจ</div>
        </div>
        <div style={{
          position:'absolute', right:-40, top:20, width:200, height:200,
          borderRadius:'50%', background:brand.accent+'25',
        }}/>
        <div style={{
          position:'absolute', right:20, bottom:-60, width:120, height:120,
          borderRadius:'50%', background:brand.primary+'30',
        }}/>
      </div>
    </div>
  );
};

/* ---------- Card preview (membership card + email) ---------- */
const CardPreview = ({ brand }) => {
  const fontFamily = `"${brand.font}", 'Anuphan', sans-serif`;
  return (
    <div style={{ fontFamily, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      {/* Membership card */}
      <div style={{
        aspectRatio:'1.586 / 1',
        borderRadius:brand.radius+2, overflow:'hidden', position:'relative',
        background:`linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
        color:'#fff', padding:18,
        boxShadow:'0 10px 24px rgba(15,23,42,.12)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <LogoMark brand={brand} size={28}/>
          <div style={{ fontSize:11, fontWeight:brand.fontWeight, letterSpacing:'.08em' }}>{brand.name}</div>
          <div style={{ flex:1 }}/>
          <div style={{ fontSize:9, fontWeight:700, opacity:.8, padding:'2px 8px', borderRadius:9999, background:'rgba(255,255,255,.22)' }}>GOLD</div>
        </div>
        <div style={{ fontSize:9, opacity:.7, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginTop:26 }}>Member</div>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-.01em', marginTop:2 }}>คุณกิตติ ภาคภูมิ</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'auto', fontSize:9 }}>
          <div>
            <div style={{ opacity:.7, fontWeight:600 }}>ID</div>
            <div style={{ fontFamily:'monospace', fontWeight:700 }}>MM-04891</div>
          </div>
          <div style={{ fontWeight:700, opacity:.8 }}>หมดอายุ 12/26</div>
        </div>
        <div style={{
          position:'absolute', right:-30, top:-30, width:130, height:130,
          borderRadius:'50%', background:brand.accent+'30',
        }}/>
      </div>

      {/* Email header */}
      <div style={{
        borderRadius:brand.radius, overflow:'hidden',
        border:`1px solid ${adminTokens.border}`, background:'#fff',
      }}>
        <div style={{ background:brand.primary, color:'#fff', padding:'18px 14px', textAlign:'center' }}>
          <LogoMark brand={brand} size={36} inverse={false}/>
        </div>
        <div style={{ padding:'16px 14px' }}>
          <div style={{ fontSize:14, fontWeight:brand.fontWeight, color:brand.secondary, letterSpacing:'-.01em' }}>
            ยินดีต้อนรับสู่ {brand.name}!
          </div>
          <div style={{ fontSize:11, color:brand.secondary, opacity:.7, marginTop:6, lineHeight:1.5, fontWeight:500 }}>
            ขอบคุณที่เข้าร่วมกับเรา เริ่มต้นการเดินทางของคุณวันนี้
          </div>
          <div style={{
            display:'inline-block', marginTop:12, padding:'8px 14px', borderRadius:brand.radius*0.6,
            background:brand.primary, color:'#fff', fontSize:11, fontWeight:800,
          }}>เริ่มใช้งาน</div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main page ---------- */
const BrandingPage = () => {
  const [saved, setSaved]   = useStateB(() => {
    try { const s = localStorage.getItem('moom-brand'); return s ? JSON.parse(s) : DEFAULT_BRAND; }
    catch { return DEFAULT_BRAND; }
  });
  const [brand, setBrand]   = useStateB(saved);
  const [device, setDevice] = useStateB('mobile'); // mobile | web | card
  const [expand, setExpand] = useStateB({ identity:true, logo:true, colors:true, type:true, photos:true, social:true, contact:false });
  const [toast, setToast]   = useStateB(null);

  const dirty = useMemoB(() => JSON.stringify(saved) !== JSON.stringify(brand), [saved, brand]);

  const set = (patch) => setBrand(b => ({ ...b, ...patch }));
  const setNested = (key, patch) => setBrand(b => ({ ...b, [key]:{ ...b[key], ...patch } }));
  const toggle = (id) => setExpand(e => ({ ...e, [id]: !e[id] }));

  const toastFn = (m) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  const save = () => {
    setSaved(brand);
    try { localStorage.setItem('moom-brand', JSON.stringify(brand)); } catch {}
    toastFn('บันทึกแบรนด์เรียบร้อย');
  };

  const revert = () => {
    setBrand(saved);
    toastFn('ยกเลิกการเปลี่ยนแปลง');
  };

  const resetDefault = () => {
    if (confirm('รีเซ็ตเป็นค่าเริ่มต้น? การเปลี่ยนแปลงที่ยังไม่บันทึกจะหายไป')) {
      setBrand(DEFAULT_BRAND);
      toastFn('รีเซ็ตเป็นค่าเริ่มต้นแล้ว');
    }
  };

  const exportKit = () => {
    const data = JSON.stringify(brand, null, 2);
    const blob = new Blob([data], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${brand.name.toLowerCase().replace(/\s+/g,'-')}-brand-kit.json`;
    a.click(); URL.revokeObjectURL(url);
    toastFn('ดาวน์โหลด brand kit แล้ว');
  };

  return (
    <div style={{ padding:'20px 24px 100px', display:'flex', flexDirection:'column', gap:14, maxWidth:1500, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:adminTokens.black, letterSpacing:'-.02em',
                        display:'flex', alignItems:'center', gap:10 }}>
            แบรนด์ยิม
            {dirty && (
              <span style={{ padding:'3px 10px', borderRadius:9999, fontSize:11, fontWeight:800,
                              background:adminTokens.warnSoft, color:'hsl(38 92% 40%)' }}>
                • มีการเปลี่ยนแปลงที่ยังไม่บันทึก
              </span>
            )}
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:12, color:adminTokens.muted }}>
            กำหนดอัตลักษณ์แบรนด์ของคุณ — ทุกการเปลี่ยนแปลงแสดงทันทีในตัวอย่าง
          </p>
        </div>
        <BBtn icon={bIcons.dl} onClick={exportKit}>ส่งออก Brand Kit</BBtn>
        <BBtn icon={bIcons.reset} onClick={resetDefault}>รีเซ็ต</BBtn>
      </div>

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) 420px', gap:16, alignItems:'flex-start' }}>
        {/* LEFT · Editor */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* IDENTITY */}
          <BCard title="ตัวตน" subtitle="ชื่อและข้อความของแบรนด์" icon={bIcons.sparkle}>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
                <div>
                  <BLabel required>ชื่อแบรนด์</BLabel>
                  <BInput value={brand.name} onChange={v => set({ name:v.toUpperCase() })}/>
                </div>
                <div>
                  <BLabel hint="ตัวอักษรบนโลโก้">ตัวอักษรโลโก้</BLabel>
                  <BInput value={brand.logoLetter} onChange={v => set({ logoLetter: v.slice(0,2).toUpperCase() })}/>
                </div>
              </div>
              <div>
                <BLabel>สโลแกน</BLabel>
                <BInput value={brand.tagline} onChange={v => set({ tagline:v })}/>
              </div>
              <div>
                <BLabel hint="ข้อความแนะนำสั้นๆ">เกี่ยวกับเรา</BLabel>
                <BInput value={brand.about} onChange={v => set({ about:v })} rows={3}/>
              </div>
            </div>
          </BCard>

          {/* LOGO */}
          <BCard title="โลโก้" subtitle="รูปแบบและการแสดงผล" icon={bIcons.image} accent={adminTokens.info}>
            <div>
              <BLabel>รูปแบบโลโก้</BLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
                {[
                  { id:'square',   label:'เหลี่ยมมน' },
                  { id:'circle',   label:'วงกลม' },
                  { id:'wordmark', label:'Wordmark' },
                ].map(s => {
                  const active = brand.logoStyle === s.id;
                  const previewBrand = { ...brand, logoStyle: s.id };
                  return (
                    <button key={s.id} onClick={() => set({ logoStyle:s.id })} style={{
                      padding:'16px 10px 12px', background: active ? adminTokens.orangeSoft : adminTokens.surface,
                      border:`1px solid ${active ? adminTokens.orange : adminTokens.border}`,
                      borderRadius:adminTokens.r2, cursor:'pointer', fontFamily:'inherit',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                    }}>
                      <LogoMark brand={previewBrand} size={44}/>
                      <div style={{ fontSize:11, fontWeight:700, color: active ? adminTokens.orange : adminTokens.muted }}>{s.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop:14 }}>
              <BLabel hint={`${brand.radius}px`}>ความโค้งของมุม</BLabel>
              <input type="range" min="0" max="30" value={brand.radius}
                     onChange={e => set({ radius:+e.target.value })}
                     style={{ width:'100%' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:adminTokens.muted, fontWeight:600, marginTop:2 }}>
                <span>เหลี่ยม</span><span>มนมาก</span>
              </div>
            </div>
            <div style={{
              marginTop:14, padding:18, borderRadius:adminTokens.r2,
              background:adminTokens.subtle, display:'flex', gap:18, alignItems:'center', justifyContent:'center',
              border:`1px dashed ${adminTokens.border}`,
            }}>
              <LogoMark brand={brand} size={32}/>
              <LogoMark brand={brand} size={56}/>
              <LogoMark brand={brand} size={80}/>
            </div>
            <div style={{ marginTop:10 }}>
              <BBtn icon={bIcons.upload} onClick={() => toastFn('อัปโหลดไฟล์ SVG/PNG')}>อัปโหลดโลโก้ของคุณ</BBtn>
            </div>
          </BCard>

          {/* COLORS */}
          <BCard title="สีของแบรนด์" subtitle="สีหลัก สีรอง สีเน้น และพื้นหลัง" icon={bIcons.palette} accent={adminTokens.pink}>
            <div>
              <BLabel>พรีเซ็ตสี</BLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                {COLOR_PRESETS.map(p => {
                  const active = p.primary === brand.primary && p.secondary === brand.secondary && p.accent === brand.accent;
                  return (
                    <button key={p.name}
                            onClick={() => set({ primary:p.primary, secondary:p.secondary, accent:p.accent })}
                            style={{
                              padding:10, background: active ? adminTokens.orangeSoft : adminTokens.surface,
                              border:`1px solid ${active ? adminTokens.orange : adminTokens.border}`,
                              borderRadius:adminTokens.r2, cursor:'pointer', fontFamily:'inherit',
                              textAlign:'left',
                            }}>
                      <div style={{ display:'flex', gap:3, marginBottom:6 }}>
                        <div style={{ flex:1, height:16, background:p.primary, borderRadius:3 }}/>
                        <div style={{ flex:1, height:16, background:p.secondary, borderRadius:3 }}/>
                        <div style={{ flex:1, height:16, background:p.accent, borderRadius:3 }}/>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color: active ? adminTokens.orange : adminTokens.black }}>{p.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
              <ColorSwatch color={brand.primary}   label="สีหลัก · Primary"   onChange={v => set({ primary:v })}/>
              <ColorSwatch color={brand.secondary} label="สีรอง · Secondary" onChange={v => set({ secondary:v })}/>
              <ColorSwatch color={brand.accent}    label="สีเน้น · Accent"    onChange={v => set({ accent:v })}/>
              <ColorSwatch color={brand.surface}   label="พื้นหลัง · Surface" onChange={v => set({ surface:v })}/>
            </div>
            <div style={{
              marginTop:12, padding:'10px 12px', background:adminTokens.infoSoft,
              borderRadius:adminTokens.r2, color:adminTokens.info,
              display:'flex', gap:8, alignItems:'flex-start',
            }}>
              <BIcon d={bIcons.info} size={14}/>
              <div style={{ fontSize:11, fontWeight:600, lineHeight:1.5 }}>
                <b>เคล็ดลับ:</b> ใช้สีหลัก 60%, สีรอง 30%, สีเน้น 10% เพื่อความสมดุล สีเน้นควรตัดกับสีหลักเพื่อสร้างจุดโฟกัส
              </div>
            </div>
          </BCard>

          {/* TYPOGRAPHY */}
          <BCard title="ตัวอักษร" subtitle="ฟอนต์และน้ำหนัก" icon={bIcons.type} accent={adminTokens.success}>
            <BLabel>ฟอนต์แบรนด์</BLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {FONT_CHOICES.map(f => {
                const active = brand.font === f.id;
                return (
                  <button key={f.id} onClick={() => set({ font:f.id })} style={{
                    padding:'12px 14px', background: active ? adminTokens.orangeSoft : adminTokens.surface,
                    border:`1px solid ${active ? adminTokens.orange : adminTokens.border}`,
                    borderRadius:adminTokens.r2, cursor:'pointer', fontFamily:'inherit',
                    display:'flex', alignItems:'center', gap:12, textAlign:'left',
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:adminTokens.black,
                                     letterSpacing:'-.02em', lineHeight:1, fontFamily:`"${f.id}", sans-serif` }}>
                        {brand.name}
                      </div>
                      <div style={{ fontSize:11, color:adminTokens.muted, fontWeight:600, marginTop:4 }}>
                        {f.label} · {f.mood}
                      </div>
                    </div>
                    {active && (
                      <div style={{ color:adminTokens.orange }}>
                        <BIcon d={bIcons.check} size={16} stroke={2.5}/>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:14 }}>
              <BLabel hint={`${brand.fontWeight}`}>น้ำหนักหัวเรื่อง</BLabel>
              <div style={{ display:'flex', gap:6 }}>
                {[500, 600, 700, 800].map(w => (
                  <button key={w} onClick={() => set({ fontWeight:w })} style={{
                    flex:1, height:36, border:`1px solid ${brand.fontWeight === w ? adminTokens.orange : adminTokens.border}`,
                    background: brand.fontWeight === w ? adminTokens.orangeSoft : adminTokens.surface,
                    color: brand.fontWeight === w ? adminTokens.orange : adminTokens.black,
                    borderRadius:adminTokens.r2, cursor:'pointer', fontFamily:'inherit',
                    fontWeight:w, fontSize:14,
                  }}>{w}</button>
                ))}
              </div>
            </div>
          </BCard>

          {/* PHOTOGRAPHY */}
          <BCard title="รูปภาพ" subtitle="อารมณ์ของภาพถ่ายและฟิลเตอร์" icon={bIcons.image} accent="hsl(270 70% 55%)">
            <BLabel>สไตล์ภาพ</BLabel>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
              {PHOTO_STYLES.map(p => {
                const active = brand.photoStyle === p.id;
                const previewBrand = { ...brand, photoStyle: p.id };
                return (
                  <button key={p.id} onClick={() => set({ photoStyle:p.id })} style={{
                    padding:6, background: active ? adminTokens.orangeSoft : adminTokens.surface,
                    border:`1px solid ${active ? adminTokens.orange : adminTokens.border}`,
                    borderRadius:adminTokens.r2, cursor:'pointer', fontFamily:'inherit',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  }}>
                    <PhotoBlock brand={previewBrand} w={100} h={64}/>
                    <div style={{ fontSize:11, fontWeight:700, color: active ? adminTokens.orange : adminTokens.muted }}>{p.label}</div>
                  </button>
                );
              })}
            </div>
          </BCard>

          {/* SOCIAL */}
          <BCard title="โซเชียล & เว็บไซต์" subtitle="ลิงก์ที่จะปรากฏในแอปและใบเสร็จ" icon={bIcons.web}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
              {[
                { k:'ig',   label:'Instagram', prefix:'@', icon:bIcons.ig,   color:'hsl(330 80% 58%)' },
                { k:'fb',   label:'Facebook',  prefix:'/', icon:bIcons.fb,   color:'hsl(220 85% 55%)' },
                { k:'line', label:'LINE',      prefix:'@', icon:bIcons.line, color:adminTokens.success },
                { k:'tt',   label:'TikTok',    prefix:'@', icon:bIcons.tt,   color:adminTokens.black },
                { k:'yt',   label:'YouTube',   prefix:'@', icon:bIcons.yt,   color:adminTokens.destr },
                { k:'web',  label:'เว็บไซต์',   prefix:'https://', icon:bIcons.web, color:adminTokens.info },
              ].map(s => (
                <div key={s.k}>
                  <BLabel>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:s.color }}>
                      <BIcon d={s.icon} size={12} stroke={2.2}/>
                      <span style={{ color:adminTokens.black }}>{s.label}</span>
                    </span>
                  </BLabel>
                  <BInput value={brand.social[s.k]} onChange={v => setNested('social', { [s.k]:v })}
                          prefix={s.prefix} placeholder={s.k === 'web' ? 'moomclub.co' : ''}/>
                </div>
              ))}
            </div>
          </BCard>

          {/* CONTACT */}
          <BCard title="ติดต่อ" subtitle="ข้อมูลสำหรับลูกค้า" icon={bIcons.biz} accent={adminTokens.warn}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <BLabel><span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><BIcon d={bIcons.phone2} size={11}/>โทรศัพท์</span></BLabel>
                <BInput value={brand.contact.phone} onChange={v => setNested('contact', { phone:v })}/>
              </div>
              <div>
                <BLabel><span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><BIcon d={bIcons.mail} size={11}/>อีเมล</span></BLabel>
                <BInput value={brand.contact.mail} onChange={v => setNested('contact', { mail:v })}/>
              </div>
            </div>
            <div style={{ marginTop:10 }}>
              <BLabel><span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><BIcon d={bIcons.map} size={11}/>ที่อยู่</span></BLabel>
              <BInput value={brand.contact.addr} onChange={v => setNested('contact', { addr:v })} rows={2}/>
            </div>
          </BCard>
        </div>

        {/* RIGHT · Live preview */}
        <div style={{ position:'sticky', top:20, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{
            background:adminTokens.surface, border:`1px solid ${adminTokens.border}`,
            borderRadius:adminTokens.r3, padding:'10px 12px', display:'flex', alignItems:'center', gap:8,
            boxShadow:adminTokens.shadowSm,
          }}>
            <BIcon d={bIcons.eye} size={14}/>
            <span style={{ fontSize:12, fontWeight:800, color:adminTokens.black, letterSpacing:'-.005em' }}>ตัวอย่างสด</span>
            <div style={{ flex:1 }}/>
            <div style={{ display:'flex', gap:2, padding:3, background:adminTokens.subtle, borderRadius:7 }}>
              {[
                { id:'mobile',  icon:bIcons.mobile,  label:'แอป' },
                { id:'web',     icon:bIcons.desktop, label:'เว็บ' },
                { id:'card',    icon:bIcons.card,    label:'การ์ด' },
              ].map(d => (
                <button key={d.id} onClick={() => setDevice(d.id)} title={d.label} style={{
                  width:32, height:26, borderRadius:5, border:0, cursor:'pointer',
                  background: device === d.id ? adminTokens.surface : 'transparent',
                  color: device === d.id ? adminTokens.black : adminTokens.muted,
                  boxShadow: device === d.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                }}>
                  <BIcon d={d.icon} size={13}/>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: device === 'mobile'
              ? `linear-gradient(135deg, ${brand.primary}18 0%, ${brand.secondary}10 100%)`
              : adminTokens.surface,
            border:`1px solid ${adminTokens.border}`,
            borderRadius:adminTokens.r3, padding: device === 'mobile' ? 20 : 16,
            boxShadow:adminTokens.shadowSm,
            minHeight: 660,
            display:'flex', alignItems: device === 'mobile' ? 'center' : 'flex-start',
            justifyContent:'center',
            transition:'background .3s',
          }}>
            {device === 'mobile' && <AppPreview brand={brand}/>}
            {device === 'web'    && <WebPreview brand={brand}/>}
            {device === 'card'   && <CardPreview brand={brand}/>}
          </div>

          {/* Brand summary */}
          <BCard title="สรุปแบรนด์" subtitle="ทุกค่าที่ใช้งาน" icon={bIcons.tag}>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { l:'ชื่อ',     v:brand.name },
                { l:'ฟอนต์',    v:`${brand.font} · ${brand.fontWeight}` },
                { l:'สีหลัก',    v:hslToHex(brand.primary).toUpperCase(), swatch:brand.primary },
                { l:'สีรอง',    v:hslToHex(brand.secondary).toUpperCase(), swatch:brand.secondary },
                { l:'สีเน้น',    v:hslToHex(brand.accent).toUpperCase(),    swatch:brand.accent },
                { l:'ความโค้ง', v:`${brand.radius}px` },
              ].map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                                       paddingBottom:8, borderBottom: i < 5 ? `1px dashed ${adminTokens.divider}` : 'none' }}>
                  <span style={{ fontSize:11, color:adminTokens.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', width:80 }}>{r.l}</span>
                  {r.swatch && <div style={{ width:14, height:14, borderRadius:3, background:r.swatch, boxShadow:'inset 0 0 0 1px rgba(0,0,0,.1)' }}/>}
                  <span style={{ fontSize:12, fontWeight:700, color:adminTokens.black, fontFamily: r.swatch ? 'monospace' : 'inherit' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </BCard>
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div style={{
          position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)',
          background:adminTokens.black, color:'#fff',
          padding:'10px 10px 10px 20px', borderRadius:9999,
          boxShadow:'0 20px 50px rgba(15,23,42,.3)', zIndex:100,
          display:'inline-flex', alignItems:'center', gap:14,
        }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:adminTokens.warn,
                         animation:'admin-pulse 1.6s infinite' }}/>
          <span style={{ fontSize:13, fontWeight:700 }}>คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
          <button onClick={revert} style={{
            height:32, padding:'0 14px', borderRadius:9999, border:0,
            background:'rgba(255,255,255,.14)', color:'#fff', cursor:'pointer',
            fontSize:12, fontWeight:700, fontFamily:'inherit',
          }}>ยกเลิก</button>
          <button onClick={save} style={{
            height:32, padding:'0 16px', borderRadius:9999, border:0,
            background:adminTokens.orange, color:'#fff', cursor:'pointer',
            fontSize:12, fontWeight:800, fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', gap:6,
            boxShadow:adminTokens.shadowOrange,
          }}>
            <BIcon d={bIcons.save} size={13} stroke={2.2}/>
            บันทึกแบรนด์
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom: dirty ? 76 : 20, left:'50%', transform:'translateX(-50%)',
          background:adminTokens.black, color:'#fff', padding:'10px 18px', borderRadius:9999,
          fontSize:13, fontWeight:700, zIndex:99, boxShadow:adminTokens.shadowLg,
          display:'inline-flex', alignItems:'center', gap:8,
        }}>
          <BIcon d={bIcons.check} size={14} stroke={2.5}/>
          {toast}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { BrandingPage });
