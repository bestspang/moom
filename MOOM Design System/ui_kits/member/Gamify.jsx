/* MOOM Member — gamified home additions */
const { useState: useStateF, useEffect: useEffectF, useRef: useRefF } = React;

/* ============================================================================
 *  MASCOT — "Leo" — flat, simple cartoon lion (no outlines, layered shapes)
 *  Inspired by simple sticker-style illustration. Mood: 'chill' | 'cheer' | 'sleep' | 'fire'
 * ========================================================================== */
const Mascot = ({ size = 64, mood = 'cheer' }) => {
  const [bob, setBob] = useStateF(0);
  useEffectF(() => {
    let raf; const t0 = performance.now();
    const tick = (t) => {
      setBob(Math.sin((t - t0) / 700) * 1.2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* --- flat palette (no gradients, no strokes) --- */
  const maneOuter = '#F5A55C';   // lighter orange outer tufts
  const maneInner = '#E8823B';   // deeper orange mane body
  const face      = '#F6C98A';   // warm tan face
  const faceLight = '#FBE4BD';   // cream muzzle stripe
  const belly     = '#F6C98A';
  const nose      = '#1F1A17';   // near-black
  const ink       = '#3B2A1F';   // dark brown for eyes/mouth
  const blush     = '#E88A7A';   // soft coral cheek
  const earInner  = '#E88A7A';

  const sleeping = mood === 'sleep';

  return (
    <svg width={size} height={size} viewBox="0 0 120 140" style={{overflow:'visible'}}>
      {/* soft ground shadow */}
      <ellipse cx="60" cy="132" rx="30" ry="3" fill="#000" opacity=".10"/>

      <g transform={`translate(0 ${bob})`}>

        {/* --- TINY BODY (sitting) --- */}
        <g>
          {/* back legs / haunches */}
          <ellipse cx="60" cy="118" rx="22" ry="12" fill={face}/>
          {/* front paws */}
          <ellipse cx="48" cy="124" rx="7" ry="5" fill={face}/>
          <ellipse cx="72" cy="124" rx="7" ry="5" fill={face}/>
          {/* paw shading lines — 2 each */}
          <path d="M45 124 v3 M48 124 v3 M51 124 v3" stroke="#D9A866" strokeWidth="1" strokeLinecap="round"/>
          <path d="M69 124 v3 M72 124 v3 M75 124 v3" stroke="#D9A866" strokeWidth="1" strokeLinecap="round"/>

          {/* tail */}
          <path d="M82 116 q16 -2 18 8" stroke={face} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          {/* tail tuft */}
          <circle cx="101" cy="126" r="4.5" fill={maneInner}/>
          <circle cx="103" cy="123" r="2.8" fill={maneOuter}/>
        </g>

        {/* --- EARS (behind mane, just peek) --- */}
        <g>
          <ellipse cx="36" cy="40" rx="7" ry="8" fill={face}/>
          <ellipse cx="36" cy="41" rx="3.5" ry="4.5" fill={earInner} opacity=".75"/>
          <ellipse cx="84" cy="40" rx="7" ry="8" fill={face}/>
          <ellipse cx="84" cy="41" rx="3.5" ry="4.5" fill={earInner} opacity=".75"/>
        </g>

        {/* --- MANE (scalloped flower silhouette, two tones) --- */}
        <g>
          {/* outer lighter layer */}
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i / 11) * Math.PI * 2 - Math.PI / 2;
            const r = 34;
            const cx = 60 + Math.cos(a) * r;
            const cy = 60 + Math.sin(a) * r;
            return <circle key={`o${i}`} cx={cx} cy={cy} r="13" fill={maneOuter}/>;
          })}
          {/* inner deeper layer */}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + 0.3;
            const r = 28;
            const cx = 60 + Math.cos(a) * r;
            const cy = 60 + Math.sin(a) * r;
            return <circle key={`i${i}`} cx={cx} cy={cy} r="11" fill={maneInner}/>;
          })}
          {/* central mane mass */}
          <circle cx="60" cy="60" r="30" fill={maneInner}/>
        </g>

        {/* --- FACE --- */}
        <g>
          {/* face base */}
          <circle cx="60" cy="62" r="24" fill={face}/>
          {/* cream forehead/muzzle stripe — triangle from forehead to nose */}
          <path d="M60 38 L52 70 Q60 76 68 70 Z" fill={faceLight}/>

          {/* cheek blush */}
          <ellipse cx="42" cy="70" rx="5.5" ry="3.2" fill={blush} opacity=".7"/>
          <ellipse cx="78" cy="70" rx="5.5" ry="3.2" fill={blush} opacity=".7"/>

          {/* EYES — closed/sleepy curves (matches reference) */}
          {mood === 'fire' ? (
            <g fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round">
              {/* determined ^^ eyes */}
              <path d="M44 60 l5 -4 l5 4"/>
              <path d="M66 60 l5 -4 l5 4"/>
            </g>
          ) : (
            <g fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round">
              <path d="M44 62 q5 -5 10 0"/>
              <path d="M66 62 q5 -5 10 0"/>
              {/* tiny lashes */}
              <path d="M54.2 61.5 l1.6 1.2"/>
              <path d="M76.2 61.5 l1.6 1.2"/>
            </g>
          )}

          {/* NOSE — big rounded black triangle (hallmark of the reference) */}
          <path d="M54 66 Q60 64 66 66 Q66 72 60 75 Q54 72 54 66 Z" fill={nose}/>

          {/* nose → mouth line */}
          <path d="M60 75 v4" stroke={nose} strokeWidth="1.6" strokeLinecap="round" fill="none"/>

          {/* WHISKERS — three thin lines per side, subtle */}
          <g fill="none" stroke={nose} strokeWidth=".8" strokeLinecap="round" opacity=".55">
            {/* left */}
            <path d="M48 74 l-10 -2"/>
            <path d="M48 76 l-11 1"/>
            <path d="M48 78 l-10 3.5"/>
            {/* right */}
            <path d="M72 74 l10 -2"/>
            <path d="M72 76 l11 1"/>
            <path d="M72 78 l10 3.5"/>
          </g>

          {/* MOUTH */}
          {mood === 'fire' ? (
            // big happy open smile
            <g>
              <path d="M52 80 Q60 90 68 80 Q60 86 52 80 Z" fill={nose}/>
              <path d="M55 82 Q60 86 65 82 Q60 85 55 82 Z" fill={blush}/>
            </g>
          ) : mood === 'sleep' ? (
            <path d="M56 81 q4 2 8 0" stroke={nose} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          ) : (
            // classic gentle smile from reference — two soft curves
            <g fill="none" stroke={nose} strokeWidth="1.8" strokeLinecap="round">
              <path d="M60 79 q-3 3 -5 2"/>
              <path d="M60 79 q3 3 5 2"/>
            </g>
          )}
        </g>

        {/* --- FIRE MOOD: little flame above head --- */}
        {mood === 'fire' && (
          <g transform="translate(60 16)">
            <path d="M0 0 c-5 5 -6 9 -2 13 c3 -1 4 -4 4 -7 c1.5 3 3 5 6 6 c3 -3 1 -8 -4 -11 c-1.5 -1 -3 -1 -4 -1 z"
                  fill="#F5A55C"/>
            <path d="M1 3 c-2.5 3 -3 5 -1 7 c1.5 -.7 2 -2 2 -4 z" fill="#FFD36B"/>
          </g>
        )}

        {/* SLEEP: Zzz */}
        {sleeping && (
          <g fill={ink} fontFamily="system-ui" fontWeight="800">
            <text x="92" y="40" fontSize="11" opacity=".5">z</text>
            <text x="99" y="30" fontSize="14">Z</text>
          </g>
        )}

      </g>
    </svg>
  );
};

/* ============================================================================
 *  MOOD CHECK-IN ROW — how are you feeling today
 * ========================================================================== */
const MoodCheckin = ({ onPick }) => {
  const [picked, setPicked] = useStateF(null);
  const moods = [
    { k: 'low',    e: '😴', label: 'เหนื่อย' },
    { k: 'ok',     e: '😐', label: 'เฉยๆ' },
    { k: 'good',   e: '🙂', label: 'ดี' },
    { k: 'strong', e: '💪', label: 'พร้อม' },
    { k: 'fire',   e: '🔥', label: 'ไฟลุก' },
  ];
  return (
    <div style={{
      background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 14, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink }}>วันนี้รู้สึกยังไง?</div>
        {picked && (
          <span style={{ fontSize: 10, fontWeight: 700, color: tokens.success,
                         display: 'inline-flex', alignItems:'center', gap:3 }}>
            <Icon d={icons.check} size={10} stroke={3}/>บันทึกแล้ว
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {moods.map(m => {
          const on = picked === m.k;
          return (
            <button key={m.k} onClick={() => { setPicked(m.k); onPick && onPick(m.k); }}
              style={{
                background: on ? tokens.orangeSoft : tokens.cardSubtle,
                border: `1.5px solid ${on ? tokens.orange : 'transparent'}`,
                borderRadius: 10, padding: '8px 4px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all .2s', transform: on ? 'scale(1.05)' : 'scale(1)',
                fontFamily: 'inherit',
              }}>
              <span style={{ fontSize: 22, filter: on ? 'none' : 'grayscale(.25)' }}>{m.e}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: on ? tokens.orange : tokens.inkMuted }}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 *  DAILY SPIN CARD — one free spin per day
 * ========================================================================== */
const DailySpinCard = ({ onSpin }) => {
  const [state, setState] = useStateF('idle'); /* idle | spinning | done */
  const [reward, setReward] = useStateF(null);
  const rewards = [
    { t: '+10 XP',   xp: 10 },
    { t: '+25 XP',   xp: 25 },
    { t: '+1 Coin',  rp: 1 },
    { t: '+5 Coin',  rp: 5 },
    { t: '+50 XP',   xp: 50 },
    { t: 'Protein',  rp: 0 },
  ];
  const handleSpin = () => {
    if (state !== 'idle') return;
    setState('spinning');
    setTimeout(() => {
      const r = rewards[Math.floor(Math.random() * rewards.length)];
      setReward(r);
      setState('done');
      onSpin && onSpin(r);
    }, 1800);
  };
  return (
    <div style={{
      background: 'linear-gradient(135deg, hsl(45 85% 58%) 0%, hsl(25 95% 58%) 100%)',
      borderRadius: 14, padding: 14, color: '#fff', display: 'flex', gap: 12, alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 6px 18px hsl(38 92% 50% / 0.35)',
    }}>
      {/* sparkle decor */}
      <svg style={{ position: 'absolute', top: 4, right: 6 }} width="22" height="22" viewBox="0 0 24 24" fill="#fff" opacity=".55">
        <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>
      </svg>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          border: '3px dashed rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 1.6s cubic-bezier(.25,.1,.25,1)',
          transform: state === 'spinning' ? 'rotate(1440deg)' : state === 'done' ? 'rotate(720deg)' : 'rotate(0deg)',
        }}>
          <span style={{ fontSize: 26 }}>🎁</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', opacity: .85, textTransform:'uppercase' }}>
          Daily Spin
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, marginTop: 1 }}>
          {state === 'done' ? `ได้ ${reward.t}!` : 'หมุนรับรางวัลฟรี'}
        </div>
        <div style={{ fontSize: 11, opacity: .9, marginTop: 2 }}>
          {state === 'done' ? 'กลับมาพรุ่งนี้!' : state === 'spinning' ? 'กำลังหมุน...' : 'วันละ 1 ครั้ง'}
        </div>
      </div>
      <button onClick={handleSpin} disabled={state !== 'idle'} style={{
        background: state === 'idle' ? '#fff' : 'rgba(255,255,255,0.35)',
        color: state === 'idle' ? tokens.orange : '#fff',
        border: 0, borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 800,
        cursor: state === 'idle' ? 'pointer' : 'default', fontFamily: 'inherit',
      }}>
        {state === 'idle' ? 'หมุน!' : state === 'spinning' ? '...' : '✓'}
      </button>
    </div>
  );
};

/* ============================================================================
 *  STREAK FIRE — animated flame SVG (replaces droplet when streak > 0)
 * ========================================================================== */
const StreakFire = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{
    animation: 'flame-flicker 1.8s ease-in-out infinite',
    transformOrigin: 'center bottom',
  }}>
    <defs>
      <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%"   stopColor="hsl(25 95% 53%)"/>
        <stop offset="55%"  stopColor="hsl(38 95% 58%)"/>
        <stop offset="100%" stopColor="hsl(48 100% 70%)"/>
      </linearGradient>
    </defs>
    <path d="M12 2 C14 6 17 8 17 12 C17 15 15 17 12 17 C9 17 7 15 7 12 C7 9 9 8 10 6 C10 8 11 9 12 8 C13 7 13 5 12 2 Z"
          fill="url(#flameGrad)"/>
    <path d="M12 10 C13 12 14 13 14 14.5 C14 16 13 17 12 17 C11 17 10 16 10 14.5 C10 13 11 12 12 10 Z"
          fill="hsl(48 100% 80%)" opacity=".85"/>
  </svg>
);

/* ============================================================================
 *  WELLNESS TIP CARD — rotating daily tip
 * ========================================================================== */
const WellnessTip = () => {
  const tips = [
    { emoji: '💧', title: 'ดื่มน้ำ 2 แก้วก่อนออกกำลังกาย', cat: 'ไฮเดรชั่น' },
    { emoji: '🧘', title: 'หายใจลึกๆ 5 ครั้งก่อนเริ่มคลาส',   cat: 'หายใจ' },
    { emoji: '🥗', title: 'ทานโปรตีนภายใน 30 นาทีหลังซ้อม',  cat: 'โภชนาการ' },
    { emoji: '😴', title: 'นอน 7-8 ชม. เพื่อฟื้นฟูกล้ามเนื้อ', cat: 'พักผ่อน' },
  ];
  const [i, setI] = useStateF(() => new Date().getDay() % tips.length);
  const tip = tips[i];
  return (
    <div style={{
      background: tokens.successTint, border: `1px solid hsl(152 55% 42% / 0.2)`,
      borderRadius: 14, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'hsl(152 55% 42% / 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{tip.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
                      textTransform: 'uppercase', color: tokens.success }}>
          เคล็ดลับเวลเนส · {tip.cat}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink, marginTop: 2 }}>
          {tip.title}
        </div>
      </div>
      <button onClick={() => setI((i + 1) % tips.length)} style={{
        background: 'transparent', border: 0, cursor: 'pointer',
        color: tokens.success, display: 'flex',
      }}><Icon d={icons.chevR} size={18} stroke={2.5}/></button>
    </div>
  );
};

/* ============================================================================
 *  FRIENDS ACTIVITY — tiny social proof row
 * ========================================================================== */
const FriendsActivity = () => {
  const friends = [
    { n: 'PN', color: 'hsl(200 60% 55%)' },
    { n: 'JJ', color: 'hsl(340 70% 60%)' },
    { n: 'MK', color: 'hsl(150 50% 50%)' },
    { n: 'AT', color: 'hsl(270 60% 60%)' },
  ];
  return (
    <div style={{
      background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 14, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ display: 'flex' }}>
        {friends.map((f, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: f.color, color: '#fff', fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', marginLeft: i ? -8 : 0,
          }}>{f.n}</div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: tokens.ink }}>
          <b>4 คน</b> เช็คอินวันนี้ 💪
        </div>
        <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 1 }}>
          เพื่อนคุณอยู่ในสาขาอโศก
        </div>
      </div>
      <span style={{ color: tokens.inkMuted, display: 'flex' }}>
        <Icon d={icons.chevR} size={16}/>
      </span>
    </div>
  );
};

/* ============================================================================
 *  ACHIEVEMENT TEASER — pulsing "one more to unlock" card
 * ========================================================================== */
const AchievementTeaser = () => (
  <div style={{
    background: 'linear-gradient(135deg, hsl(280 60% 96%) 0%, hsl(45 85% 95%) 100%)',
    border: `1px solid hsl(280 60% 80%)`,
    borderRadius: 14, padding: '12px 14px',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'linear-gradient(135deg, hsl(280 70% 60%), hsl(320 70% 60%))',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, flexShrink: 0, position: 'relative',
      boxShadow: '0 4px 12px hsl(280 60% 50% / 0.35)',
    }}>
      🏆
      <span style={{
        position: 'absolute', top: -4, right: -4,
        width: 14, height: 14, borderRadius: '50%',
        background: tokens.orange, border: '2px solid #fff',
        animation: 'pulse-dot 1.6s ease-in-out infinite',
      }}/>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: 'hsl(280 60% 50%)' }}>
        ใกล้ปลดล็อก
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink, marginTop: 1 }}>
        อีก 1 คลาสได้แบดจ์ "นกเช้า"
      </div>
      <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 1 }}>
        เช็คอินก่อน 8 โมง × 10 ครั้ง · 9/10
      </div>
    </div>
  </div>
);

/* ============================================================================
 *  CONFETTI BURST — triggered on check-in
 * ========================================================================== */
const ConfettiBurst = ({ show }) => {
  if (!show) return null;
  const pieces = Array.from({ length: 18 });
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
      overflow: 'hidden',
    }}>
      {pieces.map((_, i) => {
        const colors = [tokens.orange, tokens.rp, tokens.success, 'hsl(210 70% 55%)', 'hsl(340 70% 60%)'];
        const left = 20 + Math.random() * 60;
        const delay = Math.random() * 0.3;
        const dur = 1.2 + Math.random() * 0.8;
        const rot = Math.random() * 720 - 360;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${left}%`, top: '45%',
            width: 8, height: 12, background: colors[i % colors.length],
            borderRadius: 2,
            animation: `confetti ${dur}s ${delay}s cubic-bezier(.2,.8,.3,1) forwards`,
            '--rot': `${rot}deg`,
          }}/>
        );
      })}
    </div>
  );
};

Object.assign(window, {
  Mascot, MoodCheckin, DailySpinCard, StreakFire,
  WellnessTip, FriendsActivity, AchievementTeaser, ConfettiBurst,
});
