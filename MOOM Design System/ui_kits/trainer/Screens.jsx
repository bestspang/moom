/* MOOM Trainer — screens */
const { useState: useStateTS } = React;

/* ============================================================================
 *  TODAY — coach's home. Stats strip + upcoming classes list
 * ========================================================================== */
const TrainerToday = ({ onOpenClass }) => {
  const classes = [
    { time:'07:00', duration:60, title:'Spin · High Intensity',   filled:17, total:20, status:'done' },
    { time:'08:30', duration:60, title:'Mobility + Stretch',      filled:6,  total:12, status:'done' },
    { time:'12:00', duration:30, title:'HIIT Express',            filled:14, total:20, status:'live' },
    { time:'18:00', duration:60, title:'Yoga · Vinyasa Flow',     filled:9,  total:20, status:'upcoming' },
    { time:'19:30', duration:60, title:'Strength · Full Body',    filled:4,  total:20, status:'upcoming' },
  ];
  return (
    <div style={{ padding:'16px 16px 24px', background: tokens.bg, display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color: tokens.ink }}>สวัสดีครับ Coach Arm</h1>
        <div style={{ fontSize:12, color: tokens.inkMuted, marginTop:2 }}>วันอาทิตย์, 19 เม.ย. · วันนี้มี 5 คลาส</div>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          { v:'50', l:'ลูกศิษย์', c: tokens.orange, bg: tokens.orangeSoft, icon: icons.users },
          { v:'42', l:'เช็คอินวันนี้', c: tokens.success, bg: tokens.successSoft, icon: icons.checkCirc },
          { v:'4.9', l:'คะแนน', c: tokens.rp, bg: tokens.rpSoft, icon: icons.trophy },
        ].map(s => (
          <div key={s.l} style={{
            background: tokens.card, border: `1px solid ${tokens.border}`,
            borderRadius: 12, padding: 12,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: s.bg, color: s.c, display:'flex', alignItems:'center', justifyContent:'center',
              marginBottom: 6,
            }}><Icon d={s.icon} size={14} stroke={2.2}/></div>
            <div style={{ fontSize: 20, fontWeight: 900, color: tokens.ink, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Next up highlight */}
      <Card padding={14} style={{
        background: `linear-gradient(135deg, ${tokens.orange} 0%, hsl(20 90% 46%) 100%)`,
        border: 0, color: '#fff',
      }}>
        <Eyebrow color="rgba(255,255,255,0.8)">คลาสถัดไป · ใน 12 นาที</Eyebrow>
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>HIIT Express · 30 min</div>
        <div style={{ fontSize: 12, opacity:.9, marginTop: 2 }}>14/20 คน · ห้อง A</div>
        <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
          <button style={{ background:'#fff', color: tokens.orange, border:0, borderRadius: 10,
                           padding:'10px 14px', fontSize: 12, fontWeight: 800, cursor:'pointer', flex:1, fontFamily:'inherit' }}>
            เปิดรายชื่อ
          </button>
          <button style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:0, borderRadius: 10,
                           padding:'10px 14px', fontSize: 12, fontWeight: 800, cursor:'pointer', flex:1, fontFamily:'inherit' }}>
            เริ่มคลาส
          </button>
        </div>
      </Card>

      {/* Class list */}
      <SectionHeader title="ตารางวันนี้" subtitle="ทั้งหมด 5 คลาส"/>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {classes.map(c => <TrainerClassCard key={c.time} {...c} onClick={() => onOpenClass && onOpenClass(c)}/>)}
      </div>
    </div>
  );
};

/* ============================================================================
 *  ROSTER — class member list, check-in one-by-one
 * ========================================================================== */
const TrainerRoster = () => {
  const [list, setList] = useStateTS([
    { id:1, name:'Paweena N.',   initials:'PN', tier:'regular',   color:'hsl(200 60% 55%)', checkedIn:true,  xp:420 },
    { id:2, name:'Jirapat J.',   initials:'JJ', tier:'dedicated', color:'hsl(340 70% 60%)', checkedIn:true,  xp:1240 },
    { id:3, name:'Monchai K.',   initials:'MK', tier:'starter',   color:'hsl(150 50% 50%)', checkedIn:false, xp:60 },
    { id:4, name:'Atthaporn T.', initials:'AT', tier:'elite',     color:'hsl(270 60% 60%)', checkedIn:true,  xp:2800 },
    { id:5, name:'Siriporn P.',  initials:'SP', tier:'regular',   color:'hsl(25 70% 55%)',  checkedIn:false, xp:580 },
    { id:6, name:'Kittipong W.', initials:'KW', tier:'starter',   color:'hsl(180 40% 45%)', checkedIn:false, xp:20 },
    { id:7, name:'Niran B.',     initials:'NB', tier:'dedicated', color:'hsl(45 70% 50%)',  checkedIn:true,  xp:1520 },
  ]);
  const done = list.filter(m => m.checkedIn).length;
  const pct  = (done / list.length) * 100;
  return (
    <div style={{ background: tokens.bg, minHeight:'100%' }}>
      <div style={{ padding: '14px 16px', background: tokens.card, borderBottom:`1px solid ${tokens.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: tokens.ink }}>HIIT Express</div>
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>12:00 · 30 min · ห้อง A</div>
          </div>
          <span style={{
            padding:'4px 10px', borderRadius:9999, background: tokens.successSoft,
            color: tokens.success, fontSize: 11, fontWeight: 800,
          }}>LIVE</span>
        </div>
        <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap: 8 }}>
          <div style={{ flex:1, height: 6, background: tokens.subtle, borderRadius: 9999, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background: tokens.success, transition:'width .5s' }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: tokens.inkMuted,
                         fontVariantNumeric:'tabular-nums' }}>{done}/{list.length}</span>
        </div>
      </div>
      <div>
        {list.map(m => (
          <div key={m.id} onClick={() => setList(ls => ls.map(x => x.id === m.id ? { ...x, checkedIn: !x.checkedIn } : x))}>
            <RosterRow {...m}/>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 *  MEMBERS — directory with search
 * ========================================================================== */
const TrainerMembers = () => {
  const members = [
    { name:'Paweena N.',   initials:'PN', tier:'regular',   color:'hsl(200 60% 55%)', checkedIn:false, xp:420,  last:'เมื่อวาน' },
    { name:'Jirapat J.',   initials:'JJ', tier:'dedicated', color:'hsl(340 70% 60%)', checkedIn:false, xp:1240, last:'วันนี้' },
    { name:'Atthaporn T.', initials:'AT', tier:'elite',     color:'hsl(270 60% 60%)', checkedIn:false, xp:2800, last:'วันนี้' },
    { name:'Kongphop S.',  initials:'KS', tier:'starter',   color:'hsl(25 95% 55%)',  checkedIn:false, xp:60,   last:'3 วันก่อน' },
    { name:'Siriporn P.',  initials:'SP', tier:'regular',   color:'hsl(25 70% 55%)',  checkedIn:false, xp:580,  last:'เมื่อวาน' },
    { name:'Niran B.',     initials:'NB', tier:'dedicated', color:'hsl(45 70% 50%)',  checkedIn:false, xp:1520, last:'วันนี้' },
  ];
  return (
    <div style={{ background: tokens.bg, minHeight:'100%' }}>
      <div style={{ padding:'14px 16px', background: tokens.card, borderBottom:`1px solid ${tokens.border}` }}>
        <h1 style={{ margin:0, fontSize: 20, fontWeight: 800, color: tokens.ink }}>ลูกศิษย์</h1>
        <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 2 }}>50 คน · 12 active วันนี้</div>
        <div style={{ marginTop: 12, height: 38, background: tokens.subtle, border:`1px solid ${tokens.border}`,
                      borderRadius: 10, padding:'0 12px', display:'flex', alignItems:'center', gap: 8,
                      color: tokens.inkMuted }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
          </svg>
          <span style={{ fontSize: 12 }}>ค้นหาชื่อ, เบอร์, tier...</span>
        </div>
      </div>
      <div>
        {members.map(m => (
          <div key={m.name} style={{
            display:'flex', alignItems:'center', gap: 12, padding:'12px 14px',
            borderBottom: `1px solid ${tokens.borderSoft}`, background: tokens.card,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 9999, background: m.color,
                          color:'#fff', fontSize: 13, fontWeight: 800,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>{m.initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{m.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 3 }}>
                <MomentumTierBadge tier={m.tier} size="sm"/>
                <span style={{ fontSize: 10, color: tokens.inkMuted, fontWeight: 600 }}>· {m.xp} XP</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize: 10, color: tokens.inkMuted }}>เช็คอินล่าสุด</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.ink, marginTop: 1 }}>{m.last}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 *  ME — coach profile
 * ========================================================================== */
const TrainerMe = () => (
  <div style={{ padding: 16, background: tokens.bg, minHeight:'100%' }}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginTop: 10 }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(25 95% 60%), hsl(28 90% 46%))`,
        color:'#fff', fontSize: 32, fontWeight: 900, letterSpacing: '.02em',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 6px 18px hsl(25 95% 53% / 0.3)',
      }}>AR</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10, color: tokens.ink }}>Coach Arm</div>
      <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>HIIT · Strength · Spin · สาขาอโศก</div>
      <div style={{ display:'flex', gap: 4, marginTop: 8 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: i <= 5 ? tokens.rp : tokens.border, fontSize: 14 }}>★</span>
        ))}
        <span style={{ fontSize: 11, color: tokens.inkMuted, marginLeft: 4 }}>4.9 · 128 รีวิว</span>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8, marginTop: 20 }}>
      {[
        { v: '1,420', l:'คลาสสอน' },
        { v: '50',    l:'ลูกศิษย์' },
        { v: '2.3k',  l:'ชั่วโมง' },
      ].map(s => (
        <div key={s.l} style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 12, padding: 12, textAlign:'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: tokens.ink, fontVariantNumeric:'tabular-nums' }}>{s.v}</div>
          <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>{s.l}</div>
        </div>
      ))}
    </div>

    <Card padding={14} style={{ marginTop: 16 }}>
      <Eyebrow>รายได้เดือนนี้</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 900, color: tokens.ink, marginTop: 4,
                    fontVariantNumeric:'tabular-nums' }}>฿48,200</div>
      <div style={{ fontSize: 11, color: tokens.success, fontWeight: 700, marginTop: 2 }}>↑ +12% จากเดือนที่แล้ว</div>
      <div style={{ display:'flex', gap: 4, marginTop: 10, height: 40, alignItems:'flex-end' }}>
        {[40, 55, 35, 70, 50, 65, 80, 60, 75, 85, 70, 90].map((v, i) => (
          <div key={i} style={{ flex:1, height:`${v}%`, background: tokens.orangeSoft,
                                borderRadius: 3, position:'relative' }}>
            {i === 11 && <div style={{ position:'absolute', inset:0, background: tokens.orange, borderRadius: 3 }}/>}
          </div>
        ))}
      </div>
    </Card>

    <div style={{ marginTop: 16, background: tokens.card, border: `1px solid ${tokens.border}`,
                  borderRadius: 12, overflow:'hidden' }}>
      {[
        'ตารางการสอน', 'การชำระเงิน', 'รีวิวของฉัน', 'การตั้งค่า', 'ช่วยเหลือ',
      ].map((lbl, i, arr) => (
        <div key={lbl} style={{
          padding:'12px 14px', display:'flex', alignItems:'center', gap:8,
          borderBottom: i < arr.length - 1 ? `1px solid ${tokens.borderSoft}` : 'none',
        }}>
          <div style={{ flex:1, fontSize: 13, fontWeight: 600, color: tokens.ink }}>{lbl}</div>
          <span style={{ color: tokens.inkMuted, display:'flex' }}><Icon d={icons.chevR} size={16}/></span>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, { TrainerToday, TrainerRoster, TrainerMembers, TrainerMe });
