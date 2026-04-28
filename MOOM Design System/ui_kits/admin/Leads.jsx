/* MOOM Admin — Leads (ลีด)
   Pipeline + hot list + analytics + drawer. Fully functional UX. */

const { useState: useStateL, useMemo: useMemoL, useEffect: useEffectL, useRef: useRefL } = React;

/* ---------- Icons ---------- */
const lIcons = {
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  flame:   <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  phone:   <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></>,
  chat:    <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  mail:    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  chev:    <><polyline points="6 9 12 15 18 9"/></>,
  chevR:   <><polyline points="9 18 15 12 9 6"/></>,
  filter:  <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  bolt:    <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  star:    <><polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2"/></>,
  dots:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  trendU:  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  user:    <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  tag:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  note:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  pin:     <><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 002-2V3H6v1a2 2 0 002 2h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></>,
  sparkle: <><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></>,
  alert:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  convert: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
  archive: <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  ig:      <><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></>,
  fb:      <><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></>,
  walkin:  <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  trophy:  <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 4h3v3a3 3 0 01-3 3M7 4H4v3a3 3 0 003 3"/></>,
};

/* ---------- Data ---------- */
const L_STAGES = [
  { id:'new',       label:'ใหม่',       sub:'ยังไม่ติดต่อ', color:adminTokens.info,    bg:adminTokens.infoSoft },
  { id:'contacted', label:'ติดต่อแล้ว',  sub:'รอตอบกลับ',   color:'hsl(260 70% 60%)',  bg:'hsl(260 70% 60% / .12)' },
  { id:'visited',   label:'มาดูยิม',     sub:'มาทัวร์แล้ว',   color:adminTokens.orange,  bg:adminTokens.orangeSoft },
  { id:'trial',     label:'ทดลอง',       sub:'Day pass',     color:adminTokens.warn,    bg:adminTokens.warnSoft },
  { id:'converted', label:'เป็นสมาชิก',   sub:'ปิดดีลสำเร็จ',  color:adminTokens.success, bg:adminTokens.successSoft },
  { id:'lost',      label:'สูญเสีย',      sub:'ปิดดีลไม่สำเร็จ',color:adminTokens.muted,   bg:adminTokens.subtle },
];

const L_SOURCES = {
  walkin:   { label:'Walk-in',   color:adminTokens.orange,    bg:adminTokens.orangeSoft,  icon:lIcons.walkin },
  ig:       { label:'Instagram', color:'hsl(330 80% 58%)',    bg:'hsl(330 80% 58% / .12)',icon:lIcons.ig },
  fb:       { label:'Facebook',  color:'hsl(220 85% 55%)',    bg:'hsl(220 85% 55% / .12)',icon:lIcons.fb },
  line:     { label:'LINE',      color:adminTokens.success,   bg:adminTokens.successSoft, icon:lIcons.chat },
  referral: { label:'แนะนำ',      color:'hsl(270 70% 55%)',   bg:'hsl(270 70% 55% / .12)',icon:lIcons.user },
  google:   { label:'Google',    color:adminTokens.info,      bg:adminTokens.infoSoft,    icon:lIcons.search },
  promo:    { label:'โปรโมชั่น',   color:adminTokens.pink,      bg:'hsl(330 80% 58% / .12)',icon:lIcons.tag },
};

const L_INTEREST = {
  weight:   'ลดน้ำหนัก',
  muscle:   'สร้างกล้ามเนื้อ',
  fitness:  'ฟิตเนสทั่วไป',
  class:    'คลาสกลุ่ม',
  pt:       'PT ส่วนตัว',
  pilates:  'Pilates',
  rehab:    'Rehab',
};

const OWNERS = [
  { id:'arm',  name:'อาร์ม',  ini:'AR', color:adminTokens.orange },
  { id:'nok',  name:'นก',    ini:'NK', color:adminTokens.success },
  { id:'best', name:'เบสท์',  ini:'BS', color:adminTokens.info },
  { id:'p',    name:'ป',     ini:'P',  color:'hsl(270 70% 55%)' },
];

// 28 varied leads
const LEADS = [
  { id:1,  name:'Nattaya Mongkonchai', ini:'NM', age:29, gender:'F', phone:'089-234-5678', stage:'new',       source:'ig',       interest:['weight','class'],    owner:'arm',  score:92, dealValue:8400,  createdH:3,   lastH:3,   budget:'3,000-5,000', notes:'ต้องการลด 10 กก. ก่อนงานแต่ง ส.ค.', priority:'hot' },
  { id:2,  name:'Kongphop Chaiprakan', ini:'KC', age:34, gender:'M', phone:'081-345-6789', stage:'new',       source:'walkin',   interest:['muscle','pt'],       owner:'nok',  score:88, dealValue:15000, createdH:6,   lastH:6,   budget:'8,000+',      notes:'อยากได้ PT แบบเข้มข้น มีประสบการณ์มาก่อน', priority:'hot' },
  { id:3,  name:'Pim Aphichaya',       ini:'PA', age:24, gender:'F', phone:'086-123-4567', stage:'new',       source:'referral', interest:['pilates','class'],  owner:'nok',  score:76, dealValue:6000,  createdH:12,  lastH:12,  budget:'3,000-5,000', notes:'เพื่อนของคุณมายด์ สมาชิกเดิม', priority:'warm' },
  { id:4,  name:'Somchai Ruengrit',    ini:'SR', age:42, gender:'M', phone:'089-876-5432', stage:'contacted', source:'google',   interest:['fitness','rehab'],   owner:'p',    score:71, dealValue:7200,  createdH:26,  lastH:18,  budget:'5,000-8,000', notes:'อาการปวดหลัง ต้องการ rehab พิเศษ', priority:'warm' },
  { id:5,  name:'Urai Thanaporn',      ini:'UT', age:31, gender:'F', phone:'088-234-5432', stage:'contacted', source:'ig',       interest:['weight'],            owner:'arm',  score:65, dealValue:4200,  createdH:48,  lastH:24,  budget:'<3,000',      notes:'งบจำกัด มองหาแพ็คเกจถูกที่สุด', priority:'warm' },
  { id:6,  name:'Vichit Lertpong',     ini:'VL', age:38, gender:'M', phone:'081-555-6666', stage:'contacted', source:'fb',       interest:['muscle','class'],    owner:'best', score:58, dealValue:5400,  createdH:72,  lastH:55,  budget:'3,000-5,000', notes:'ถามไปยังไม่ตอบกลับ',             priority:'cold' },
  { id:7,  name:'Phatcharin Somsak',   ini:'PS', age:27, gender:'F', phone:'087-123-9876', stage:'contacted', source:'line',     interest:['class','fitness'],   owner:'nok',  score:83, dealValue:5400,  createdH:30,  lastH:4,   budget:'3,000-5,000', notes:'แชทไลน์ตอบเร็ว สนใจคลาส Yoga', priority:'hot' },
  { id:8,  name:'Korn Thanakit',       ini:'KT', age:45, gender:'M', phone:'089-999-1234', stage:'visited',   source:'walkin',   interest:['pt','muscle'],       owner:'arm',  score:94, dealValue:18000, createdH:48,  lastH:6,   budget:'8,000+',      notes:'มาทัวร์ยิมเมื่อวาน ประทับใจมาก', priority:'hot' },
  { id:9,  name:'Mild Piyaphorn',      ini:'MP', age:32, gender:'F', phone:'090-234-5678', stage:'visited',   source:'referral', interest:['pilates','rehab'],   owner:'p',    score:86, dealValue:9600,  createdH:96,  lastH:20,  budget:'5,000-8,000', notes:'มาดูและถามละเอียด ขอเวลาคิด 1 สัปดาห์', priority:'hot' },
  { id:10, name:'Ben Witsanu',         ini:'BW', age:28, gender:'M', phone:'088-777-3333', stage:'visited',   source:'ig',       interest:['muscle','class'],    owner:'best', score:72, dealValue:5400,  createdH:120, lastH:72,  budget:'3,000-5,000', notes:'มาดู 2 ครั้งแล้ว ยังไม่ตัดสินใจ', priority:'warm' },
  { id:11, name:'Apinya Vanida',       ini:'AV', age:35, gender:'F', phone:'089-111-2222', stage:'trial',     source:'promo',    interest:['weight','class'],    owner:'arm',  score:90, dealValue:5400,  createdH:72,  lastH:2,   budget:'3,000-5,000', notes:'Trial วันนี้ 18:00 HIIT', priority:'hot' },
  { id:12, name:'Jate Rattanakul',     ini:'JR', age:41, gender:'M', phone:'086-888-9999', stage:'trial',     source:'google',   interest:['fitness','pt'],      owner:'p',    score:81, dealValue:8400,  createdH:168, lastH:12,  budget:'5,000-8,000', notes:'Trial day-pass พรุ่งนี้ 07:00', priority:'hot' },
  { id:13, name:'Natty Srikul',        ini:'NS', age:26, gender:'F', phone:'085-111-4444', stage:'trial',     source:'ig',       interest:['pilates'],           owner:'nok',  score:78, dealValue:6000,  createdH:192, lastH:36,  budget:'3,000-5,000', notes:'ลองคลาสแล้ว ประทับใจโค้ชพิม', priority:'warm' },
  { id:14, name:'Rin Thitaya',         ini:'RT', age:23, gender:'F', phone:'091-333-2222', stage:'converted', source:'referral', interest:['class'],             owner:'nok',  score:95, dealValue:5400,  createdH:240, lastH:1,   budget:'3,000-5,000', notes:'ปิดดีล 6 เดือน ฿5,400', priority:'done' },
  { id:15, name:'Dan Pornchai',        ini:'DP', age:37, gender:'M', phone:'089-555-7777', stage:'converted', source:'walkin',   interest:['muscle','pt'],       owner:'arm',  score:96, dealValue:18000, createdH:288, lastH:24,  budget:'8,000+',      notes:'ปิดดีล PT Package 30 ฿18,000', priority:'done' },
  { id:16, name:'Mew Chanya',          ini:'MC', age:29, gender:'F', phone:'087-666-8888', stage:'converted', source:'promo',    interest:['weight','class'],    owner:'best', score:88, dealValue:3600,  createdH:360, lastH:48,  budget:'<3,000',      notes:'โปรแรงเกิน ตัดสินใจทันที', priority:'done' },
  { id:17, name:'Toey Phasakorn',      ini:'TP', age:33, gender:'M', phone:'084-222-1111', stage:'lost',      source:'fb',       interest:['fitness'],           owner:'best', score:42, dealValue:0,     createdH:480, lastH:240, budget:'<3,000',      notes:'ย้ายไปยิมอื่นที่ราคาถูกกว่า', priority:'lost' },
  { id:18, name:'Nat Suthinee',        ini:'NT', age:30, gender:'F', phone:'086-444-5555', stage:'lost',      source:'google',   interest:['class'],             owner:'nok',  score:38, dealValue:0,     createdH:720, lastH:504, budget:'3,000-5,000', notes:'ไม่ตอบกลับนาน ปิด',             priority:'lost' },
  { id:19, name:'Pond Kittipol',       ini:'PK', age:39, gender:'M', phone:'089-777-1212', stage:'new',       source:'fb',       interest:['fitness','muscle'],  owner:'arm',  score:70, dealValue:4800,  createdH:2,   lastH:2,   budget:'3,000-5,000', notes:'สอบถามทาง FB Ads',            priority:'warm' },
  { id:20, name:'Gib Atchara',         ini:'GA', age:26, gender:'F', phone:'088-888-1010', stage:'new',       source:'line',     interest:['pilates','class'],   owner:'nok',  score:85, dealValue:6000,  createdH:1,   lastH:1,   budget:'3,000-5,000', notes:'แชทมาทาง LINE Official', priority:'hot' },
  { id:21, name:'Bank Kiattisak',      ini:'BK', age:44, gender:'M', phone:'082-999-0000', stage:'contacted', source:'referral', interest:['pt','rehab'],        owner:'p',    score:89, dealValue:12000, createdH:20,  lastH:3,   budget:'8,000+',      notes:'ได้คุยแล้ว นัดเข้ามาดูศุกร์', priority:'hot' },
  { id:22, name:'Fah Kanokwan',        ini:'FK', age:25, gender:'F', phone:'090-111-3030', stage:'contacted', source:'ig',       interest:['class','weight'],    owner:'arm',  score:64, dealValue:4200,  createdH:50,  lastH:40,  budget:'<3,000',      notes:'ขอโปรเพิ่มก่อนตัดสินใจ', priority:'warm' },
  { id:23, name:'Max Worawut',         ini:'MW', age:28, gender:'M', phone:'083-444-9090', stage:'visited',   source:'google',   interest:['muscle','pt'],       owner:'best', score:80, dealValue:10000, createdH:80,  lastH:30,  budget:'5,000-8,000', notes:'ทัวร์เสร็จแล้ว ขอใบเสนอราคา', priority:'hot' },
  { id:24, name:'Oat Thirapat',        ini:'OT', age:40, gender:'M', phone:'085-222-7070', stage:'visited',   source:'walkin',   interest:['fitness'],           owner:'arm',  score:60, dealValue:3600,  createdH:144, lastH:96,  budget:'<3,000',      notes:'เดินเข้ามา ดูเสร็จไป ยังไม่ติดต่อกลับ', priority:'cold' },
  { id:25, name:'Noon Chanchanok',     ini:'NC', age:31, gender:'F', phone:'086-555-0808', stage:'trial',     source:'promo',    interest:['pilates','class'],   owner:'nok',  score:87, dealValue:5400,  createdH:60,  lastH:4,   budget:'3,000-5,000', notes:'Trial Reformer วันศุกร์', priority:'hot' },
  { id:26, name:'Fluke Suphachai',     ini:'FS', age:36, gender:'M', phone:'088-121-3131', stage:'converted', source:'ig',       interest:['muscle','class'],    owner:'best', score:92, dealValue:7200,  createdH:400, lastH:72,  budget:'5,000-8,000', notes:'ปิดดีล 12 เดือน',              priority:'done' },
  { id:27, name:'May Thanawan',        ini:'MT', age:28, gender:'F', phone:'089-656-1414', stage:'converted', source:'referral', interest:['class','weight'],    owner:'nok',  score:90, dealValue:5400,  createdH:456, lastH:120, budget:'3,000-5,000', notes:'ปิดดีล 6 เดือน',              priority:'done' },
  { id:28, name:'Art Siripong',        ini:'AS', age:48, gender:'M', phone:'081-717-1818', stage:'lost',      source:'walkin',   interest:['fitness'],           owner:'arm',  score:30, dealValue:0,     createdH:600, lastH:420, budget:'<3,000',      notes:'ต้องการส่วนลดมากเกินไป',     priority:'lost' },
];

/* ---------- Primitives ---------- */
const LIcon = ({ d, size=14, stroke=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const LPill = ({ children, color=adminTokens.muted, bg, dot }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:9999,
    fontSize:10.5, fontWeight:800, background:bg, color, whiteSpace:'nowrap',
  }}>
    {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:color }}/>}
    {children}
  </span>
);

const LBtn = ({ children, icon, iconRight, primary, ghost, danger, onClick, small, active, title }) => {
  const h = small ? 28 : 34;
  const p = small ? '0 10px' : '0 13px';
  let bg, color, border, sh = 'none';
  if (primary)      { bg=adminTokens.orange; color='#fff'; border=0; sh=adminTokens.shadowOrange; }
  else if (danger)  { bg=adminTokens.surface; color=adminTokens.destr; border=`1px solid ${adminTokens.border}`; }
  else if (ghost)   { bg=active?adminTokens.subtle:'transparent'; color=adminTokens.muted; border=0; }
  else              { bg=adminTokens.surface; color=adminTokens.black; border=`1px solid ${adminTokens.border}`; }
  return (
    <button onClick={onClick} title={title} style={{
      background:bg, color, border, height:h, padding:p, borderRadius:adminTokens.r2,
      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
      display:'inline-flex', alignItems:'center', gap:6, boxShadow:sh,
    }}>
      {icon && <LIcon d={icon} size={13} stroke={2.2}/>}
      {children}
      {iconRight && <LIcon d={iconRight} size={13} stroke={2.2}/>}
    </button>
  );
};

const LCard = ({ title, subtitle, action, children, pad=14, noBody }) => (
  <div style={{
    background:adminTokens.surface, border:`1px solid ${adminTokens.border}`,
    borderRadius:adminTokens.r3, boxShadow:adminTokens.shadowSm,
    display:'flex', flexDirection:'column', overflow:'hidden',
  }}>
    {title && (
      <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:8,
                    borderBottom:`1px solid ${adminTokens.divider}` }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:adminTokens.black, letterSpacing:'-.005em' }}>{title}</div>
          {subtitle && <div style={{ fontSize:11, color:adminTokens.muted, marginTop:2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    {!noBody && <div style={{ padding:pad, flex:1 }}>{children}</div>}
    {noBody && children}
  </div>
);

const LAvatar = ({ lead, size=34 }) => {
  const src = L_SOURCES[lead.source];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:src.bg, color:src.color, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.36, fontWeight:800, letterSpacing:'.02em',
    }}>{lead.ini}</div>
  );
};

const fmtAge = (hours) => {
  if (hours < 1) return 'เพิ่งสักครู่';
  if (hours < 24) return `${Math.round(hours)} ชม.`;
  const d = Math.round(hours/24);
  if (d < 7) return `${d} วัน`;
  return `${Math.round(d/7)} สัปดาห์`;
};

const ageSeverity = (hours, stage) => {
  // urgency by stage
  if (stage === 'converted' || stage === 'lost') return 'none';
  const thresholds = { new: 4, contacted: 24, visited: 48, trial: 24 };
  const t = thresholds[stage] || 48;
  if (hours < t*0.5) return 'fresh';
  if (hours < t)     return 'warn';
  return 'stale';
};

const Temp = ({ t }) => {
  const m = {
    hot:  { color:adminTokens.destr,   bg:adminTokens.destrSoft,   label:'Hot',  icon:lIcons.flame },
    warm: { color:adminTokens.warn,    bg:adminTokens.warnSoft,    label:'Warm', icon:lIcons.flame },
    cold: { color:adminTokens.info,    bg:adminTokens.infoSoft,    label:'Cold', icon:lIcons.flame },
    done: { color:adminTokens.success, bg:adminTokens.successSoft, label:'Done', icon:lIcons.check },
    lost: { color:adminTokens.muted,   bg:adminTokens.subtle,      label:'Lost', icon:lIcons.x },
  }[t];
  if (!m) return null;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5,
      fontSize:10, fontWeight:800, background:m.bg, color:m.color,
    }}>
      <LIcon d={m.icon} size={10} stroke={2.4}/>
      {m.label}
    </span>
  );
};

const Score = ({ v, size=34 }) => {
  const color = v >= 85 ? adminTokens.success : v >= 70 ? adminTokens.orange : v >= 50 ? adminTokens.warn : adminTokens.muted;
  const circ = 2 * Math.PI * 14;
  const off  = circ - (v/100) * circ;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="16" cy="16" r="14" fill="none" stroke={adminTokens.subtle} strokeWidth="3"/>
        <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="3"
                strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"/>
      </svg>
      <div style={{
        position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:10, fontWeight:800, color:adminTokens.black, fontVariantNumeric:'tabular-nums',
      }}>{v}</div>
    </div>
  );
};

/* ---------- Funnel strip ---------- */
const FunnelStrip = ({ leads, onStageClick, activeStage }) => {
  const stageCounts = L_STAGES.map(s => ({
    ...s,
    count: leads.filter(l => l.stage === s.id).length,
    value: leads.filter(l => l.stage === s.id).reduce((a, l) => a + l.dealValue, 0),
  }));
  const total = leads.length;
  const converted = stageCounts.find(s => s.id==='converted').count;
  const convRate = total > 0 ? (converted / total * 100) : 0;

  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${L_STAGES.length+1}, 1fr)`, gap:8 }}>
      <div style={{
        background:`linear-gradient(135deg, ${adminTokens.black} 0%, #171b22 100%)`,
        color:'#fff', padding:14, borderRadius:adminTokens.r3,
      }}>
        <div style={{ fontSize:10, fontWeight:700, opacity:.65, textTransform:'uppercase', letterSpacing:'.04em' }}>
          อัตราปิดดีล
        </div>
        <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-.02em', lineHeight:1, marginTop:8, fontVariantNumeric:'tabular-nums' }}>
          {convRate.toFixed(1)}%
        </div>
        <div style={{ fontSize:10, opacity:.6, marginTop:6, fontWeight:600 }}>
          {converted} / {total} ลีด · เดือนนี้
        </div>
        <div style={{ display:'flex', gap:4, marginTop:10, alignItems:'baseline' }}>
          <LIcon d={lIcons.trendU} size={11}/>
          <span style={{ fontSize:11, fontWeight:800, color:'#22c55e' }}>+2.3pt</span>
          <span style={{ fontSize:10, opacity:.55 }}>vs เดือนก่อน</span>
        </div>
      </div>
      {stageCounts.map((s, i) => {
        const prev = i > 0 ? stageCounts[i-1].count : 0;
        const conv = i > 0 && prev > 0 ? (s.count/prev*100) : null;
        const active = activeStage === s.id;
        return (
          <button key={s.id} onClick={() => onStageClick(s.id)} style={{
            background:active ? s.bg : adminTokens.surface,
            border:`1px solid ${active ? s.color : adminTokens.border}`,
            borderRadius:adminTokens.r3, padding:14, cursor:'pointer',
            textAlign:'left', fontFamily:'inherit',
            transition:'all .15s',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }}/>
              <div style={{ fontSize:10, fontWeight:800, color:adminTokens.muted,
                             textTransform:'uppercase', letterSpacing:'.04em' }}>
                {s.label}
              </div>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:adminTokens.black,
                           letterSpacing:'-.02em', lineHeight:1, marginTop:8, fontVariantNumeric:'tabular-nums' }}>
              {s.count}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:6 }}>
              <div style={{ fontSize:10, color:adminTokens.muted, fontWeight:600 }}>
                ฿{(s.value/1000).toFixed(1)}K
              </div>
              {conv !== null && (
                <div style={{ fontSize:10, fontWeight:800, color:s.color }}>
                  {conv.toFixed(0)}%
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

/* ---------- Hot list panel ---------- */
const HotList = ({ leads, onOpen, onAction }) => {
  // overdue: stale + hot priority, plus trials today
  const overdue = leads.filter(l =>
    l.priority === 'hot' && ageSeverity(l.lastH, l.stage) === 'stale'
    && l.stage !== 'converted' && l.stage !== 'lost'
  );
  const hotNew = leads.filter(l => l.priority === 'hot' && l.stage === 'new').slice(0, 3);
  const trialsToday = leads.filter(l => l.stage === 'trial' && l.priority === 'hot').slice(0, 3);

  const rawItems = [
    ...overdue.slice(0, 3).map(l => ({ lead:l, tag:'ช้าเกิน', tagColor:adminTokens.destr, tagBg:adminTokens.destrSoft, icon:lIcons.alert })),
    ...hotNew.map(l => ({ lead:l, tag:'ลีดร้อน', tagColor:adminTokens.orange, tagBg:adminTokens.orangeSoft, icon:lIcons.flame })),
    ...trialsToday.map(l => ({ lead:l, tag:'Trial วันนี้', tagColor:adminTokens.warn, tagBg:adminTokens.warnSoft, icon:lIcons.clock })),
  ];
  const seen = new Set();
  const items = rawItems.filter(it => {
    if (seen.has(it.lead.id)) return false;
    seen.add(it.lead.id);
    return true;
  }).slice(0, 6);

  if (!items.length) return null;

  return (
    <div style={{
      background:`linear-gradient(135deg, ${adminTokens.destr} 0%, hsl(18 85% 55%) 100%)`,
      borderRadius:adminTokens.r3, padding:'16px 18px', color:'#fff', position:'relative', overflow:'hidden',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{
          width:30, height:30, borderRadius:8, background:'rgba(255,255,255,.22)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <LIcon d={lIcons.flame} size={16} stroke={2.4}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, letterSpacing:'-.01em' }}>
            ต้องติดตามด่วน · {items.length} คน
          </div>
          <div style={{ fontSize:11, opacity:.8, fontWeight:600 }}>
            ลีดที่รอนาน + ลีดร้อนใหม่ + trial วันนี้
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
        {items.slice(0, 6).map(it => (
          <div key={it.lead.id}
               role="button" tabIndex={0}
               onClick={() => onOpen(it.lead)}
               onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(it.lead); } }}
               style={{
            background:'rgba(255,255,255,.14)', border:'1px solid rgba(255,255,255,.18)',
            borderRadius:10, padding:10, color:'#fff', cursor:'pointer', fontFamily:'inherit',
            textAlign:'left', display:'flex', alignItems:'center', gap:10,
          }}>
            <LAvatar lead={it.lead} size={32}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {it.lead.name}
              </div>
              <div style={{ fontSize:10, opacity:.8, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                <LIcon d={it.icon} size={9} stroke={2.4}/>
                {it.tag} · {fmtAge(it.lead.lastH)}
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={(e) => { e.stopPropagation(); onAction('call', it.lead); }}
                style={{ width:28, height:28, borderRadius:7, border:0,
                          background:'rgba(255,255,255,.22)', color:'#fff', cursor:'pointer',
                          display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                title="โทร"><LIcon d={lIcons.phone} size={12}/></button>
              <button onClick={(e) => { e.stopPropagation(); onAction('chat', it.lead); }}
                style={{ width:28, height:28, borderRadius:7, border:0,
                          background:'rgba(255,255,255,.22)', color:'#fff', cursor:'pointer',
                          display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                title="LINE"><LIcon d={lIcons.chat} size={12}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Source breakdown + response time ---------- */
const MiniAnalytics = ({ leads }) => {
  const bySource = {};
  leads.forEach(l => {
    const k = l.source;
    if (!bySource[k]) bySource[k] = { count:0, converted:0 };
    bySource[k].count++;
    if (l.stage === 'converted') bySource[k].converted++;
  });
  const sourceRows = Object.entries(bySource).sort((a,b) => b[1].count - a[1].count);
  const total = leads.length;

  // response time buckets
  const contacted = leads.filter(l => l.stage !== 'new');
  const buckets = { '<1 ชม.':0, '1-4 ชม.':0, '4-24 ชม.':0, '>24 ชม.':0 };
  contacted.forEach(l => {
    const r = l.createdH - l.lastH; // rough
    if (r < 1) buckets['<1 ชม.']++;
    else if (r < 4) buckets['1-4 ชม.']++;
    else if (r < 24) buckets['4-24 ชม.']++;
    else buckets['>24 ชม.']++;
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:12 }}>
      <LCard title="ที่มาลีด" subtitle="เดือนนี้ · จัดอันดับตามจำนวน">
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {sourceRows.map(([k, v]) => {
            const src = L_SOURCES[k];
            const pct = (v.count / total * 100);
            const cr = v.count > 0 ? (v.converted / v.count * 100) : 0;
            return (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:28, height:28, borderRadius:7, background:src.bg, color:src.color,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <LIcon d={src.icon} size={13} stroke={2.2}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:adminTokens.black }}>{src.label}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:adminTokens.black, fontVariantNumeric:'tabular-nums' }}>
                      {v.count} <span style={{ color:adminTokens.muted, fontWeight:600 }}>({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div style={{ height:4, background:adminTokens.subtle, borderRadius:9999, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:src.color, borderRadius:9999 }}/>
                  </div>
                </div>
                <div style={{ fontSize:10, fontWeight:800, color:cr > 30 ? adminTokens.success : adminTokens.muted, width:44, textAlign:'right' }}>
                  {cr.toFixed(0)}% CR
                </div>
              </div>
            );
          })}
        </div>
      </LCard>
      <LCard title="เวลาตอบกลับ" subtitle="ยิ่งเร็วยิ่งแปลงสูง">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {Object.entries(buckets).map(([k, v], i) => {
            const maxV = Math.max(...Object.values(buckets));
            const pct = maxV > 0 ? (v/maxV)*100 : 0;
            const color = i === 0 ? adminTokens.success : i === 1 ? adminTokens.info : i === 2 ? adminTokens.warn : adminTokens.destr;
            return (
              <div key={k}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, marginBottom:3 }}>
                  <span style={{ color:adminTokens.black }}>{k}</span>
                  <span style={{ color:color, fontVariantNumeric:'tabular-nums' }}>{v}</span>
                </div>
                <div style={{ height:8, background:adminTokens.subtle, borderRadius:9999, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:9999 }}/>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:4, padding:'8px 10px', background:adminTokens.subtle, borderRadius:8,
                        fontSize:11, color:adminTokens.muted, fontWeight:600, lineHeight:1.5 }}>
            <b style={{ color:adminTokens.black }}>เคล็ดลับ:</b> ลีดที่ตอบภายใน 5 นาทีมีโอกาสปิดดีลสูงกว่า <b style={{ color:adminTokens.success }}>9 เท่า</b>
          </div>
        </div>
      </LCard>
    </div>
  );
};

/* ---------- Lead card (kanban) ---------- */
const LeadCard = ({ lead, onOpen, onAction, onDragStart, onDragEnd, dragging }) => {
  const sev = ageSeverity(lead.lastH, lead.stage);
  const src = L_SOURCES[lead.source];
  const owner = OWNERS.find(o => o.id === lead.owner);
  return (
    <div draggable
         onDragStart={e => onDragStart(e, lead)}
         onDragEnd={onDragEnd}
         onClick={() => onOpen(lead)}
         style={{
           background:adminTokens.surface, border:`1px solid ${adminTokens.border}`,
           borderRadius:10, padding:10, cursor:'grab',
           boxShadow:adminTokens.shadowSm, opacity: dragging ? 0.35 : 1,
           transition:'box-shadow .15s, border-color .15s',
           borderLeft: `3px solid ${sev === 'stale' ? adminTokens.destr : sev === 'warn' ? adminTokens.warn : src.color}`,
         }}
         onMouseEnter={e => { e.currentTarget.style.boxShadow = adminTokens.shadowLg; }}
         onMouseLeave={e => { e.currentTarget.style.boxShadow = adminTokens.shadowSm; }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <LAvatar lead={lead} size={30}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:800, color:adminTokens.black, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {lead.name}
          </div>
          <div style={{ fontSize:10, color:adminTokens.muted, fontWeight:600 }}>
            {lead.age} · {lead.gender === 'M' ? 'ชาย' : 'หญิง'} · ฿{(lead.dealValue/1000).toFixed(0)}K
          </div>
        </div>
        <Score v={lead.score} size={30}/>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
        <LPill color={src.color} bg={src.bg}>
          <LIcon d={src.icon} size={9} stroke={2.4}/>
          {src.label}
        </LPill>
        {lead.priority !== 'done' && lead.priority !== 'lost' && <Temp t={lead.priority}/>}
      </div>

      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:8 }}>
        {lead.interest.slice(0, 2).map(i => (
          <span key={i} style={{
            fontSize:9.5, padding:'1px 6px', borderRadius:4, fontWeight:700,
            background:adminTokens.subtle, color:adminTokens.muted,
          }}>{L_INTEREST[i]}</span>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6,
                     paddingTop:8, borderTop:`1px dashed ${adminTokens.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div title={owner.name} style={{
            width:18, height:18, borderRadius:'50%', background:owner.color, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:8, fontWeight:800,
          }}>{owner.ini}</div>
          <span style={{ fontSize:10, fontWeight:700,
                          color: sev === 'stale' ? adminTokens.destr : sev === 'warn' ? adminTokens.warn : adminTokens.muted,
                          display:'inline-flex', alignItems:'center', gap:3 }}>
            <LIcon d={lIcons.clock} size={9}/>
            {fmtAge(lead.lastH)}
          </span>
        </div>
        <div style={{ display:'flex', gap:3 }}>
          <button onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}
                  style={miniBtn} title="โทร">
            <LIcon d={lIcons.phone} size={11}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAction('chat', lead); }}
                  style={miniBtn} title="LINE">
            <LIcon d={lIcons.chat} size={11}/>
          </button>
        </div>
      </div>
    </div>
  );
};

const miniBtn = {
  width:22, height:22, borderRadius:5, border:`1px solid ${adminTokens.border}`,
  background:adminTokens.surface, color:adminTokens.muted, cursor:'pointer',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
};

/* ---------- Kanban column ---------- */
const KanbanColumn = ({ stage, leads, onOpen, onAction, onDragStart, onDragEnd, dragging, onDrop, dragOver, onDragOver, onDragLeave }) => {
  const value = leads.reduce((a, l) => a + l.dealValue, 0);
  return (
    <div style={{
      background: dragOver ? stage.bg : adminTokens.subtle,
      borderRadius:adminTokens.r3,
      border: dragOver ? `2px dashed ${stage.color}` : '2px dashed transparent',
      display:'flex', flexDirection:'column', minWidth:0,
      transition:'background .15s',
    }}
    onDragOver={e => onDragOver(e, stage.id)}
    onDragLeave={onDragLeave}
    onDrop={e => onDrop(e, stage.id)}>
      <div style={{ padding:'12px 12px 8px', borderBottom:`1px solid ${adminTokens.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color }}/>
          <div style={{ fontSize:11, fontWeight:800, color:adminTokens.black, letterSpacing:'.01em' }}>
            {stage.label}
          </div>
          <div style={{ flex:1 }}/>
          <span style={{
            fontSize:11, fontWeight:800, padding:'1px 7px', borderRadius:9999,
            background:stage.bg, color:stage.color,
          }}>{leads.length}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:adminTokens.muted, fontWeight:600 }}>
          <span>{stage.sub}</span>
          <span style={{ fontVariantNumeric:'tabular-nums' }}>฿{(value/1000).toFixed(1)}K</span>
        </div>
      </div>
      <div style={{ padding:8, display:'flex', flexDirection:'column', gap:6, flex:1, minHeight:100, maxHeight:'calc(100vh - 400px)', overflowY:'auto' }}>
        {leads.length === 0 ? (
          <div style={{ padding:'20px 8px', textAlign:'center', fontSize:11, color:adminTokens.muted, fontWeight:600 }}>
            ไม่มีลีด · ลากมาวางได้
          </div>
        ) : leads.map(l => (
          <LeadCard key={l.id} lead={l} onOpen={onOpen} onAction={onAction}
                    onDragStart={onDragStart} onDragEnd={onDragEnd}
                    dragging={dragging?.id === l.id}/>
        ))}
      </div>
    </div>
  );
};

/* ---------- List view ---------- */
const LeadsList = ({ leads, onOpen, onAction, selected, onToggleSelect, onToggleAll }) => {
  return (
    <LCard noBody>
      <div style={{
        display:'grid',
        gridTemplateColumns:'24px 2.2fr 1.1fr 0.9fr 1fr 0.8fr 0.9fr 0.8fr 110px',
        alignItems:'center', gap:8, padding:'10px 14px',
        background:adminTokens.subtle, borderBottom:`1px solid ${adminTokens.divider}`,
        fontSize:10, fontWeight:800, color:adminTokens.muted,
        textTransform:'uppercase', letterSpacing:'.04em',
      }}>
        <input type="checkbox"
               checked={selected.size > 0 && selected.size === leads.length}
               onChange={() => onToggleAll(leads)}/>
        <div>ลีด</div>
        <div>ที่มา</div>
        <div>สเตจ</div>
        <div>ความสนใจ</div>
        <div>Score</div>
        <div>มูลค่า</div>
        <div>รอ</div>
        <div style={{ textAlign:'right' }}>การกระทำ</div>
      </div>
      {leads.map(l => {
        const stage = L_STAGES.find(s => s.id === l.stage);
        const src = L_SOURCES[l.source];
        const sev = ageSeverity(l.lastH, l.stage);
        const isSel = selected.has(l.id);
        return (
          <div key={l.id} onClick={() => onOpen(l)} style={{
            display:'grid',
            gridTemplateColumns:'24px 2.2fr 1.1fr 0.9fr 1fr 0.8fr 0.9fr 0.8fr 110px',
            alignItems:'center', gap:8, padding:'10px 14px',
            borderBottom:`1px solid ${adminTokens.divider}`, cursor:'pointer',
            background: isSel ? adminTokens.orangeSoft : 'transparent',
            transition:'background .1s',
          }}
          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = adminTokens.subtle; }}
          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
            <input type="checkbox" checked={isSel}
                   onClick={e => e.stopPropagation()}
                   onChange={() => onToggleSelect(l.id)}/>
            <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
              <LAvatar lead={l} size={32}/>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:800, color:adminTokens.black, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {l.name}
                </div>
                <div style={{ fontSize:10.5, color:adminTokens.muted, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {l.phone}
                </div>
              </div>
            </div>
            <LPill color={src.color} bg={src.bg}>
              <LIcon d={src.icon} size={10} stroke={2.2}/>
              {src.label}
            </LPill>
            <LPill color={stage.color} bg={stage.bg} dot>{stage.label}</LPill>
            <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
              {l.interest.slice(0, 2).map(i => (
                <span key={i} style={{
                  fontSize:9.5, padding:'1px 6px', borderRadius:4, fontWeight:700,
                  background:adminTokens.subtle, color:adminTokens.muted, whiteSpace:'nowrap',
                }}>{L_INTEREST[i]}</span>
              ))}
            </div>
            <Score v={l.score} size={28}/>
            <div style={{ fontSize:12, fontWeight:800, color:adminTokens.black, fontVariantNumeric:'tabular-nums' }}>
              ฿{(l.dealValue/1000).toFixed(0)}K
            </div>
            <div style={{ fontSize:11, fontWeight:700,
                           color: sev === 'stale' ? adminTokens.destr : sev === 'warn' ? adminTokens.warn : adminTokens.muted,
                           display:'inline-flex', alignItems:'center', gap:4 }}>
              <LIcon d={lIcons.clock} size={10}/>
              {fmtAge(l.lastH)}
            </div>
            <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
              <button onClick={(e) => { e.stopPropagation(); onAction('call', l); }} style={rowBtnL} title="โทร"><LIcon d={lIcons.phone} size={12}/></button>
              <button onClick={(e) => { e.stopPropagation(); onAction('chat', l); }} style={rowBtnL} title="LINE"><LIcon d={lIcons.chat} size={12}/></button>
              <button onClick={(e) => { e.stopPropagation(); onAction('tour', l); }} style={rowBtnL} title="จองทัวร์"><LIcon d={lIcons.cal} size={12}/></button>
            </div>
          </div>
        );
      })}
    </LCard>
  );
};

const rowBtnL = {
  width:26, height:26, borderRadius:6, border:`1px solid ${adminTokens.border}`,
  background:adminTokens.surface, color:adminTokens.muted, cursor:'pointer',
  display:'inline-flex', alignItems:'center', justifyContent:'center',
};

/* ---------- Drawer ---------- */
const LeadDrawer = ({ lead, onClose, onAction, onStageChange }) => {
  const [tab, setTab] = useStateL('overview');
  const [note, setNote] = useStateL('');
  if (!lead) return null;
  const stage = L_STAGES.find(s => s.id === lead.stage);
  const src = L_SOURCES[lead.source];
  const owner = OWNERS.find(o => o.id === lead.owner);

  const tabs = [
    { id:'overview', label:'ภาพรวม' },
    { id:'timeline', label:'ไทม์ไลน์' },
    { id:'notes',    label:'บันทึก' },
  ];

  // fake timeline
  const timeline = [
    { t:fmtAge(lead.lastH), icon:lIcons.chat,  text:'ส่งข้อความ LINE: "สวัสดีครับ สนใจ PT Package"', by:owner.name, color:adminTokens.success },
    { t:fmtAge(lead.lastH + 18), icon:lIcons.phone, text:`โทรติดตาม ${lead.name.split(' ')[0]} · ไม่รับสาย`, by:owner.name, color:adminTokens.warn },
    { t:fmtAge(lead.createdH), icon:lIcons.sparkle, text:`ลีดใหม่จาก ${src.label}`, by:'ระบบ', color:src.color },
  ];

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.45)', zIndex:200,
      display:'flex', justifyContent:'flex-end', backdropFilter:'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:640, maxWidth:'95vw', background:adminTokens.surface,
        display:'flex', flexDirection:'column', boxShadow:'-20px 0 48px rgba(15,23,42,.2)',
      }}>
        {/* Header */}
        <div style={{
          background:`linear-gradient(135deg, ${src.color} 0%, ${src.color} 55%, ${src.bg} 100%)`,
          color:'#fff', padding:'20px 22px 18px', position:'relative',
        }}>
          <button onClick={onClose} style={{
            position:'absolute', top:14, right:14, background:'rgba(255,255,255,.18)', border:0,
            width:30, height:30, borderRadius:7, color:'#fff', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><LIcon d={lIcons.x} size={14}/></button>

          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ padding:3, background:'rgba(255,255,255,.25)', borderRadius:'50%' }}>
              <div style={{
                width:60, height:60, borderRadius:'50%',
                background:'#fff', color:src.color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, fontWeight:800,
              }}>{lead.ini}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                <LPill color="#fff" bg="rgba(255,255,255,.25)">
                  <LIcon d={src.icon} size={10} stroke={2.4}/>
                  {src.label}
                </LPill>
                {lead.priority !== 'done' && lead.priority !== 'lost' && (
                  <span style={{
                    padding:'2px 8px', borderRadius:9999, fontSize:10, fontWeight:800,
                    background:'#fff', color:src.color,
                    display:'inline-flex', alignItems:'center', gap:3,
                  }}>
                    <LIcon d={lIcons.flame} size={10} stroke={2.4}/>
                    {lead.priority === 'hot' ? 'ลีดร้อน' : lead.priority === 'warm' ? 'ลีดอุ่น' : 'ลีดเย็น'}
                  </span>
                )}
              </div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', lineHeight:1.2 }}>
                {lead.name}
              </div>
              <div style={{ fontSize:12, opacity:.85, marginTop:4, fontWeight:600, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span>{lead.age} · {lead.gender === 'M' ? 'ชาย' : 'หญิง'}</span>
                <span style={{ opacity:.5 }}>·</span>
                <span>{lead.phone}</span>
                <span style={{ opacity:.5 }}>·</span>
                <span>งบ {lead.budget}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10 }}>
                <div style={{ position:'relative', width:42, height:42 }}>
                  <svg width={42} height={42} viewBox="0 0 32 32" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3"/>
                    <circle cx="16" cy="16" r="14" fill="none" stroke="#fff" strokeWidth="3"
                            strokeDasharray={2*Math.PI*14} strokeDashoffset={2*Math.PI*14 - (lead.score/100)*2*Math.PI*14} strokeLinecap="round"/>
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                                 fontSize:12, fontWeight:800 }}>{lead.score}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, opacity:.7, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Lead Score</div>
                  <div style={{ fontSize:13, fontWeight:800 }}>
                    {lead.score >= 85 ? 'คุณภาพสูงมาก' : lead.score >= 70 ? 'คุณภาพดี' : lead.score >= 50 ? 'ปานกลาง' : 'ต้องดูเพิ่ม'}
                  </div>
                </div>
                <div style={{ width:1, height:24, background:'rgba(255,255,255,.3)' }}/>
                <div>
                  <div style={{ fontSize:10, opacity:.7, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>มูลค่าดีล</div>
                  <div style={{ fontSize:15, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>฿{lead.dealValue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button onClick={() => onAction('call', lead)} style={drActionPri}>
              <LIcon d={lIcons.phone} size={13} stroke={2.4}/> โทร
            </button>
            <button onClick={() => onAction('chat', lead)} style={drAction}>
              <LIcon d={lIcons.chat} size={13}/> LINE
            </button>
            <button onClick={() => onAction('tour', lead)} style={drAction}>
              <LIcon d={lIcons.cal} size={13}/> จองทัวร์
            </button>
            <button onClick={() => onAction('convert', lead)} style={drAction}>
              <LIcon d={lIcons.convert} size={13}/> เปลี่ยนเป็นสมาชิก
            </button>
          </div>
        </div>

        {/* Stage progress */}
        <div style={{ padding:'16px 22px 14px', borderBottom:`1px solid ${adminTokens.divider}` }}>
          <div style={{ fontSize:11, fontWeight:800, color:adminTokens.muted,
                         textTransform:'uppercase', letterSpacing:'.04em', marginBottom:10 }}>
            สเตจในไปป์ไลน์
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {L_STAGES.filter(s => s.id !== 'lost').map((s, i) => {
              const currentIdx = L_STAGES.findIndex(x => x.id === lead.stage);
              const thisIdx = L_STAGES.findIndex(x => x.id === s.id);
              const done = currentIdx >= thisIdx && lead.stage !== 'lost';
              const active = lead.stage === s.id;
              return (
                <button key={s.id} onClick={() => onStageChange(lead, s.id)} style={{
                  flex:1, padding:'8px 6px', borderRadius:7,
                  border: active ? `2px solid ${s.color}` : `1px solid ${adminTokens.border}`,
                  background: active ? s.bg : done ? adminTokens.subtle : adminTokens.surface,
                  cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                }}>
                  <div style={{ fontSize:9, fontWeight:800, color: active ? s.color : done ? adminTokens.black : adminTokens.muted,
                                 textTransform:'uppercase', letterSpacing:'.04em', marginBottom:2 }}>
                    {i+1}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color: active ? s.color : done ? adminTokens.black : adminTokens.muted }}>
                    {s.label}
                  </div>
                </button>
              );
            })}
            <button onClick={() => onStageChange(lead, 'lost')} style={{
              padding:'8px 10px', borderRadius:7,
              border: lead.stage === 'lost' ? `2px solid ${adminTokens.destr}` : `1px solid ${adminTokens.border}`,
              background: lead.stage === 'lost' ? adminTokens.destrSoft : adminTokens.surface,
              cursor:'pointer', fontFamily:'inherit', color: lead.stage === 'lost' ? adminTokens.destr : adminTokens.muted,
              fontSize:11, fontWeight:700,
            }}>
              <LIcon d={lIcons.x} size={11}/>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:2, padding:'0 22px', borderBottom:`1px solid ${adminTokens.divider}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background:'transparent', border:0, padding:'12px 14px', cursor:'pointer',
              fontFamily:'inherit', fontSize:12, fontWeight:700,
              color: tab === t.id ? adminTokens.black : adminTokens.muted,
              borderBottom: tab === t.id ? `2px solid ${adminTokens.orange}` : '2px solid transparent',
              marginBottom:-1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:20, background:adminTokens.bg }}>
          {tab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <LCard title="ข้อมูล" pad={14}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { l:'เจ้าของ',      v:(<span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:18, height:18, borderRadius:'50%', background:owner.color, color:'#fff',
                                        display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800 }}>{owner.ini}</span>
                        {owner.name}
                      </span>) },
                    { l:'อายุลีด',       v:fmtAge(lead.createdH) },
                    { l:'ติดต่อล่าสุด',   v:fmtAge(lead.lastH) },
                    { l:'งบประมาณ',     v:lead.budget },
                  ].map((r, i) => (
                    <div key={i}>
                      <div style={{ fontSize:10, color:adminTokens.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>{r.l}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:adminTokens.black, marginTop:3 }}>{r.v}</div>
                    </div>
                  ))}
                </div>
              </LCard>
              <LCard title="ความสนใจ" pad={14}>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {lead.interest.map(i => (
                    <span key={i} style={{
                      padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:700,
                      background:adminTokens.orangeSoft, color:adminTokens.orange,
                    }}>{L_INTEREST[i]}</span>
                  ))}
                </div>
              </LCard>
              <LCard title="บันทึก" pad={14}>
                <div style={{ fontSize:13, color:adminTokens.black, lineHeight:1.6, fontWeight:500 }}>
                  {lead.notes}
                </div>
              </LCard>
              <LCard title="แนะนำแพ็คเกจ" subtitle="จับคู่จากความสนใจและงบ" pad={14}>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[
                    { name:'PT Package 12', price:'฿12,000', match:94 },
                    { name:'Gold Membership', price:'฿5,400', match:81 },
                    { name:'Class Pass 20', price:'฿4,200', match:72 },
                  ].map((p, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                      border:`1px solid ${adminTokens.border}`, borderRadius:8,
                    }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:800, color:adminTokens.black }}>{p.name}</div>
                        <div style={{ fontSize:11, color:adminTokens.muted, fontWeight:600 }}>{p.price}</div>
                      </div>
                      <div style={{ padding:'3px 8px', borderRadius:5,
                                     background: p.match >= 85 ? adminTokens.successSoft : adminTokens.subtle,
                                     color: p.match >= 85 ? adminTokens.success : adminTokens.muted,
                                     fontSize:10, fontWeight:800 }}>
                        {p.match}% match
                      </div>
                      <LBtn small primary>เสนอ</LBtn>
                    </div>
                  ))}
                </div>
              </LCard>
            </div>
          )}

          {tab === 'timeline' && (
            <LCard pad={0}>
              {timeline.map((e, i) => (
                <div key={i} style={{
                  display:'flex', gap:12, padding:14,
                  borderBottom: i < timeline.length-1 ? `1px solid ${adminTokens.divider}` : 'none',
                }}>
                  <div style={{
                    width:30, height:30, borderRadius:7,
                    background:e.color+'20', color:e.color, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <LIcon d={e.icon} size={13} stroke={2.2}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:adminTokens.black, fontWeight:600, lineHeight:1.5 }}>{e.text}</div>
                    <div style={{ fontSize:10, color:adminTokens.muted, fontWeight:600, marginTop:3 }}>
                      {e.by} · {e.t}ที่แล้ว
                    </div>
                  </div>
                </div>
              ))}
            </LCard>
          )}

          {tab === 'notes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <LCard pad={14}>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                          placeholder="เพิ่มบันทึก..."
                          rows={3}
                          style={{
                            width:'100%', padding:10, fontFamily:'inherit', fontSize:13,
                            border:`1px solid ${adminTokens.border}`, borderRadius:8,
                            resize:'vertical', outline:'none', color:adminTokens.black, background:adminTokens.surface,
                          }}/>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                  <LBtn primary small icon={lIcons.plus} onClick={() => setNote('')}>เพิ่ม</LBtn>
                </div>
              </LCard>
              <LCard title="บันทึกก่อนหน้า" pad={0}>
                {[
                  { by:'อาร์ม', t:'2 วันก่อน', text:lead.notes },
                  { by:'ระบบ', t:fmtAge(lead.createdH)+'ก่อน', text:`ลีดใหม่สมัครผ่าน ${src.label}` },
                ].map((n, i) => (
                  <div key={i} style={{
                    padding:14, borderBottom: i === 0 ? `1px solid ${adminTokens.divider}` : 'none',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:adminTokens.black }}>{n.by}</span>
                      <span style={{ fontSize:11, color:adminTokens.muted, fontWeight:600 }}>{n.t}</span>
                    </div>
                    <div style={{ fontSize:13, color:adminTokens.black, lineHeight:1.6, fontWeight:500 }}>{n.text}</div>
                  </div>
                ))}
              </LCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const drActionPri = {
  padding:'0 14px', height:36, borderRadius:8, border:0,
  background:'#fff', color:adminTokens.black,
  fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
  display:'inline-flex', alignItems:'center', gap:6,
};
const drAction = {
  padding:'0 12px', height:36, borderRadius:8, border:0,
  background:'rgba(255,255,255,.20)', color:'#fff',
  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
  display:'inline-flex', alignItems:'center', gap:5,
};

/* ---------- Main page ---------- */
const LeadsPageV2 = () => {
  const [leads, setLeads]   = useStateL(LEADS);
  const [view, setView]     = useStateL(() => localStorage.getItem('moom-leads-view') || 'kanban');
  const [search, setSearch] = useStateL('');
  const [srcFilter, setSrc] = useStateL('all');
  const [ownFilter, setOwn] = useStateL('all');
  const [tempFilter, setTmp]= useStateL('all');
  const [stageFocus, setSF] = useStateL(null);
  const [selected, setSel]  = useStateL(new Set());
  const [open, setOpen]     = useStateL(null);
  const [toast, setToast]   = useStateL(null);
  const [dragging, setDrag] = useStateL(null);
  const [dragOver, setOver] = useStateL(null);

  useEffectL(() => { localStorage.setItem('moom-leads-view', view); }, [view]);

  const toastFn = (m) => { setToast(m); setTimeout(() => setToast(null), 1600); };

  const handleAction = (kind, lead) => {
    const m = {
      call:   `กำลังโทร ${lead.name}...`,
      chat:   `เปิดแชท LINE กับ ${lead.name}`,
      mail:   `ส่งอีเมลถึง ${lead.name}`,
      tour:   `จองทัวร์ยิมให้ ${lead.name}`,
      convert:`เปลี่ยน ${lead.name} เป็นสมาชิก...`,
    }[kind];
    if (m) toastFn(m);
  };

  const handleStageChange = (lead, newStage) => {
    setLeads(prev => prev.map(l =>
      l.id === lead.id
        ? { ...l, stage:newStage, priority: newStage === 'converted' ? 'done' : newStage === 'lost' ? 'lost' : l.priority, lastH: 0 }
        : l
    ));
    if (open?.id === lead.id) {
      setOpen({ ...lead, stage:newStage });
    }
    const stageName = L_STAGES.find(s => s.id === newStage)?.label;
    toastFn(`ย้าย ${lead.name} → ${stageName}`);
  };

  const filtered = useMemoL(() => {
    let r = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q));
    }
    if (srcFilter !== 'all')  r = r.filter(l => l.source === srcFilter);
    if (ownFilter !== 'all')  r = r.filter(l => l.owner === ownFilter);
    if (tempFilter !== 'all') r = r.filter(l => l.priority === tempFilter);
    if (stageFocus)           r = r.filter(l => l.stage === stageFocus);
    return r;
  }, [leads, search, srcFilter, ownFilter, tempFilter, stageFocus]);

  // drag-and-drop
  const onDragStart = (e, lead) => {
    setDrag(lead);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd = () => { setDrag(null); setOver(null); };
  const onDragOver = (e, stageId) => { e.preventDefault(); setOver(stageId); };
  const onDragLeave = () => { setOver(null); };
  const onDrop = (e, stageId) => {
    e.preventDefault();
    if (dragging && dragging.stage !== stageId) {
      handleStageChange(dragging, stageId);
    }
    setDrag(null); setOver(null);
  };

  // bulk
  const toggleSelect = (id) => {
    setSel(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleAll = (rows) => {
    setSel(prev => {
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map(r => r.id));
    });
  };

  const bulkAction = (kind) => {
    if (selected.size === 0) return;
    if (kind === 'stage-new-contacted') {
      setLeads(prev => prev.map(l => selected.has(l.id) && l.stage === 'new' ? { ...l, stage:'contacted', lastH:0 } : l));
      toastFn(`ย้าย ${selected.size} ลีด → ติดต่อแล้ว`);
    } else if (kind === 'archive') {
      toastFn(`เก็บ ${selected.size} ลีด`);
    }
    setSel(new Set());
  };

  return (
    <div style={{ padding:'20px 24px 40px', display:'flex', flexDirection:'column', gap:14, maxWidth:1500, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:adminTokens.black, letterSpacing:'-.02em',
                        display:'flex', alignItems:'center', gap:10 }}>
            ลีด
            <span style={{ padding:'3px 10px', borderRadius:9999, fontSize:11, fontWeight:800,
                            background:adminTokens.orangeSoft, color:adminTokens.orange }}>
              {leads.filter(l => l.stage !== 'converted' && l.stage !== 'lost').length} ลีดในไปป์ไลน์
            </span>
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:12, color:adminTokens.muted }}>
            ติดตามลีดใหม่ ปิดดีลให้ไว — ลากการ์ดเพื่อย้ายสเตจ
          </p>
        </div>
        <LBtn icon={lIcons.filter}>กรอง</LBtn>
        <LBtn icon={lIcons.trendU}>รายงาน</LBtn>
        <LBtn icon={lIcons.plus} primary>เพิ่มลีด</LBtn>
      </div>

      {/* Funnel */}
      <FunnelStrip leads={leads} onStageClick={(s) => setSF(stageFocus === s ? null : s)} activeStage={stageFocus}/>

      {/* Hot list */}
      <HotList leads={leads} onOpen={setOpen} onAction={handleAction}/>

      {/* Mini analytics */}
      <MiniAnalytics leads={leads}/>

      {/* Filters bar */}
      <div style={{
        background:adminTokens.surface, border:`1px solid ${adminTokens.border}`,
        borderRadius:adminTokens.r3, padding:'10px 12px',
        display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
      }}>
        <div style={{
          flex:1, minWidth:220, maxWidth:320, height:34, padding:'0 12px',
          background:adminTokens.subtle, borderRadius:8, display:'flex', alignItems:'center', gap:8,
        }}>
          <LIcon d={lIcons.search} size={13}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="ค้นหาชื่อ เบอร์โทร..."
                 style={{ flex:1, border:0, background:'transparent', outline:'none',
                          fontFamily:'inherit', fontSize:13, color:adminTokens.black }}/>
        </div>

        {/* Temperature tabs */}
        <div style={{ display:'flex', gap:2, padding:3, background:adminTokens.subtle, borderRadius:8 }}>
          {[
            { id:'all',  label:'ทั้งหมด',  color:adminTokens.muted },
            { id:'hot',  label:'🔥 Hot',  color:adminTokens.destr },
            { id:'warm', label:'Warm',    color:adminTokens.warn },
            { id:'cold', label:'Cold',    color:adminTokens.info },
          ].map(t => (
            <button key={t.id} onClick={() => setTmp(t.id)} style={{
              height:28, padding:'0 12px', borderRadius:6, border:0,
              background: tempFilter === t.id ? adminTokens.surface : 'transparent',
              boxShadow: tempFilter === t.id ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              color: tempFilter === t.id ? adminTokens.black : adminTokens.muted,
              fontSize:12, fontWeight:700, fontFamily:'inherit', cursor:'pointer', whiteSpace:'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        <select value={srcFilter} onChange={e => setSrc(e.target.value)} style={selectL}>
          <option value="all">ทุกที่มา</option>
          {Object.entries(L_SOURCES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <select value={ownFilter} onChange={e => setOwn(e.target.value)} style={selectL}>
          <option value="all">ทุกเจ้าของ</option>
          {OWNERS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        {stageFocus && (
          <button onClick={() => setSF(null)} style={{
            height:34, padding:'0 10px', borderRadius:8, border:`1px solid ${adminTokens.orange}`,
            background:adminTokens.orangeSoft, color:adminTokens.orange, cursor:'pointer',
            fontSize:11, fontWeight:800, display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit',
          }}>
            สเตจ: {L_STAGES.find(s => s.id === stageFocus)?.label}
            <LIcon d={lIcons.x} size={11}/>
          </button>
        )}

        <div style={{ flex:1 }}/>

        {/* View toggle */}
        <div style={{ display:'flex', gap:2, padding:3, background:adminTokens.subtle, borderRadius:8 }}>
          <button onClick={() => setView('kanban')} style={{
            width:32, height:28, borderRadius:6, border:0, cursor:'pointer',
            background:view === 'kanban' ? adminTokens.surface : 'transparent',
            color:view === 'kanban' ? adminTokens.black : adminTokens.muted,
            boxShadow:view === 'kanban' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }} title="Kanban"><LIcon d={lIcons.grid} size={13}/></button>
          <button onClick={() => setView('list')} style={{
            width:32, height:28, borderRadius:6, border:0, cursor:'pointer',
            background:view === 'list' ? adminTokens.surface : 'transparent',
            color:view === 'list' ? adminTokens.black : adminTokens.muted,
            boxShadow:view === 'list' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }} title="List"><LIcon d={lIcons.list} size={13}/></button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && view === 'list' && (
        <div style={{
          background:adminTokens.black, color:'#fff', borderRadius:adminTokens.r3,
          padding:'10px 14px', display:'flex', alignItems:'center', gap:10,
        }}>
          <div style={{ fontSize:13, fontWeight:800 }}>เลือก {selected.size} ลีด</div>
          <div style={{ flex:1 }}/>
          <button onClick={() => bulkAction('stage-new-contacted')} style={{
            height:30, padding:'0 12px', borderRadius:7, border:0,
            background:'rgba(255,255,255,.18)', color:'#fff', cursor:'pointer',
            fontSize:12, fontWeight:700, fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', gap:5,
          }}>
            <LIcon d={lIcons.check} size={12}/> ย้าย → ติดต่อแล้ว
          </button>
          <button onClick={() => bulkAction('archive')} style={{
            height:30, padding:'0 12px', borderRadius:7, border:0,
            background:'rgba(255,255,255,.18)', color:'#fff', cursor:'pointer',
            fontSize:12, fontWeight:700, fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', gap:5,
          }}>
            <LIcon d={lIcons.archive} size={12}/> เก็บ
          </button>
          <button onClick={() => setSel(new Set())} style={{
            height:30, padding:'0 10px', borderRadius:7, border:0,
            background:'transparent', color:'rgba(255,255,255,.7)', cursor:'pointer',
            fontSize:12, fontWeight:700, fontFamily:'inherit',
          }}>ยกเลิก</button>
        </div>
      )}

      {/* Content */}
      {view === 'kanban' ? (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${L_STAGES.length}, minmax(230px, 1fr))`, gap:10 }}>
          {L_STAGES.map(s => (
            <KanbanColumn key={s.id} stage={s}
                          leads={filtered.filter(l => l.stage === s.id)}
                          onOpen={setOpen} onAction={handleAction}
                          onDragStart={onDragStart} onDragEnd={onDragEnd}
                          dragging={dragging}
                          onDragOver={onDragOver} onDragLeave={onDragLeave}
                          onDrop={onDrop} dragOver={dragOver === s.id}/>
          ))}
        </div>
      ) : (
        <LeadsList leads={filtered} onOpen={setOpen} onAction={handleAction}
                   selected={selected}
                   onToggleSelect={toggleSelect}
                   onToggleAll={toggleAll}/>
      )}

      {filtered.length === 0 && (
        <div style={{
          background:adminTokens.surface, border:`1px dashed ${adminTokens.border}`,
          borderRadius:adminTokens.r3, padding:48, textAlign:'center',
        }}>
          <div style={{ fontSize:13, color:adminTokens.muted }}>ไม่พบลีดที่ตรงกับตัวกรอง</div>
        </div>
      )}

      {/* Drawer */}
      {open && <LeadDrawer lead={open} onClose={() => setOpen(null)}
                            onAction={handleAction}
                            onStageChange={handleStageChange}/>}

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:adminTokens.black, color:'#fff', padding:'10px 18px', borderRadius:9999,
          fontSize:13, fontWeight:700, boxShadow:adminTokens.shadowLg, zIndex:300,
          display:'inline-flex', alignItems:'center', gap:8,
        }}>
          <LIcon d={lIcons.check} size={14} stroke={2.5}/>
          {toast}
        </div>
      )}
    </div>
  );
};

const selectL = {
  height:34, padding:'0 10px', borderRadius:8,
  border:`1px solid ${adminTokens.border}`, background:adminTokens.surface,
  color:adminTokens.black, fontFamily:'inherit', fontSize:12, fontWeight:600,
  cursor:'pointer', outline:'none',
};

Object.assign(window, { LeadsPageV2 });
