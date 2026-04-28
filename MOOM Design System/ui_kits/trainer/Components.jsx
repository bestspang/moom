/* MOOM Trainer — components */
const { useState: useStateTC } = React;

/* Top app bar */
const TrainerTopBar = ({ title = 'วันนี้', back }) => (
  <div style={{
    height: 56, background: tokens.card, borderBottom: `1px solid ${tokens.border}`,
    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
    position: 'sticky', top: 0, zIndex: 10,
  }}>
    {back ? (
      <button onClick={back} style={{ border:0, background:'transparent', cursor:'pointer',
                color: tokens.ink, display:'flex', padding:4 }}>
        <Icon d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} size={20}/>
      </button>
    ) : (
      <div style={{ fontSize: 18, fontWeight: 900, color: tokens.orange, letterSpacing: '.02em' }}>MOOM<span style={{fontSize:10, marginLeft:6, color:tokens.inkMuted, fontWeight:700}}>TRAINER</span></div>
    )}
    <div style={{ flex:1 }}/>
    {back && <div style={{ fontSize: 15, fontWeight: 800, color: tokens.ink }}>{title}</div>}
    <div style={{ flex:1 }}/>
    <div style={{ width: 34, height: 34, borderRadius: 9999,
                  background: tokens.cream, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: 11, fontWeight: 800 }}>AR</div>
  </div>
);

/* Bottom nav */
const TrainerNav = ({ screen, onChange }) => {
  const items = [
    { id: 'today',   label: 'วันนี้',    d: icons.cal },
    { id: 'roster',  label: 'รายชื่อ',   d: icons.users },
    { id: 'scan',    label: 'เช็คอิน',    d: icons.scan, fab: true },
    { id: 'members', label: 'สมาชิก',    d: icons.user },
    { id: 'me',      label: 'ฉัน',       d: icons.target },
  ];
  return (
    <div style={{ height: 72, background: tokens.card, borderTop: `1px solid ${tokens.border}`,
                  display:'flex', justifyContent:'space-around', alignItems:'flex-end',
                  padding:'0 4px 10px', position:'sticky', bottom:0, zIndex:20 }}>
      {items.map(it => {
        const active = screen === it.id;
        if (it.fab) return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            marginTop:-18, width:52, height:52, borderRadius:'50%',
            background: tokens.orange, color:'#fff', border:'3px solid #fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 6px 16px hsl(25 95% 53% / 0.45)', cursor:'pointer',
          }}><Icon d={it.d} size={22} stroke={2.4}/></button>
        );
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            background:'transparent', border:0, cursor:'pointer', flex:1,
            display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 4px',
            color: active ? tokens.orange : tokens.inkMuted, fontFamily:'inherit',
          }}>
            <Icon d={it.d} size={19} stroke={active ? 2.5 : 2}/>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* Class slot — trainer's view */
const TrainerClassCard = ({ time, duration, title, filled, total, status = 'upcoming', onClick }) => {
  const isLive = status === 'live';
  const isDone = status === 'done';
  const pct = (filled / total) * 100;
  return (
    <div onClick={onClick} style={{
      background: tokens.card, border: `1px solid ${isLive ? tokens.orange : tokens.border}`,
      borderRadius: 14, padding: 14, cursor:'pointer',
      boxShadow: isLive ? '0 4px 14px hsl(25 95% 53% / 0.25)' : '0 1px 3px hsl(220 20% 8% / 0.04)',
      position:'relative', overflow:'hidden',
    }}>
      {isLive && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:tokens.orange,
                               animation: 'flame-flicker 1.5s infinite' }}/>}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ width: 56, flexShrink:0 }}>
          <div style={{ fontSize: 18, fontWeight:900, fontVariantNumeric:'tabular-nums', color: tokens.ink }}>{time}</div>
          <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 1 }}>{duration} min</div>
          {isLive && <span style={{ display:'inline-flex', alignItems:'center', gap:3, marginTop:6,
                                    fontSize:9, fontWeight:800, color:tokens.orange,
                                    textTransform:'uppercase', letterSpacing:'.08em' }}>
            <span style={{ width:6, height:6, borderRadius:9999, background:tokens.orange,
                           animation:'pulse-dot 1.4s infinite' }}/> Live
          </span>}
          {isDone && <span style={{ fontSize:9, fontWeight:800, color:tokens.success, marginTop:6, display:'inline-block' }}>
            ✓ เสร็จแล้ว
          </span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: tokens.ink }}>{title}</div>
          <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 2 }}>ห้อง A · สาขาอโศก</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
            <div style={{ display:'flex' }}>
              {[0,1,2,3].slice(0, Math.min(4, filled)).map(i => (
                <div key={i} style={{
                  width:22, height:22, borderRadius:9999, border:'2px solid #fff',
                  background:`hsl(${i*60} 60% 60%)`, marginLeft: i ? -7 : 0,
                  fontSize:8, fontWeight:800, color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{['P','J','M','A'][i]}</div>
              ))}
              {filled > 4 && (
                <div style={{ width:22, height:22, borderRadius:9999, border:'2px solid #fff',
                              background: tokens.cream, color: tokens.inkMuted,
                              fontSize:8, fontWeight:800, marginLeft:-7,
                              display:'flex', alignItems:'center', justifyContent:'center' }}>+{filled-4}</div>
              )}
            </div>
            <div style={{ flex:1, height:4, background:'hsl(30 12% 93%)', borderRadius:9999, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background: pct >= 100 ? tokens.danger : tokens.orange }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color: tokens.inkMuted,
                           fontVariantNumeric:'tabular-nums', minWidth:36, textAlign:'right' }}>{filled}/{total}</span>
          </div>
        </div>
        <span style={{ color: tokens.inkMuted, display:'flex', alignSelf:'center' }}>
          <Icon d={icons.chevR} size={18}/>
        </span>
      </div>
    </div>
  );
};

/* Member roster row */
const RosterRow = ({ name, initials, tier, color, checkedIn, xp }) => (
  <div style={{
    display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
    background: checkedIn ? tokens.successTint : tokens.card,
    borderBottom: `1px solid ${tokens.borderSoft}`,
  }}>
    <div style={{ position:'relative' }}>
      <div style={{
        width: 40, height: 40, borderRadius:9999, background: color,
        color:'#fff', fontSize:13, fontWeight:800,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>{initials}</div>
      {checkedIn && (
        <span style={{ position:'absolute', bottom:-2, right:-2, width:16, height:16, borderRadius:9999,
                       background: tokens.success, color:'#fff', border:'2px solid #fff',
                       display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon d={icons.check} size={8} stroke={3.5}/>
        </span>
      )}
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{name}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
        <MomentumTierBadge tier={tier} size="sm"/>
        {xp !== undefined && <span style={{ fontSize:10, color:tokens.inkMuted, fontWeight:600 }}>· {xp} XP</span>}
      </div>
    </div>
    {!checkedIn && (
      <Button variant="outline" size="sm">เช็คอิน</Button>
    )}
  </div>
);

Object.assign(window, { TrainerTopBar, TrainerNav, TrainerClassCard, RosterRow });
