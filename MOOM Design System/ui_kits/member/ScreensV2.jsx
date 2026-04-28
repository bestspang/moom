/* MOOM Member — V2 screens with improved UX
 * Focus: clearer IA, fewer competing CTAs, discoverable actions, complete tasks.
 */
const { useState: useStateV2, useEffect: useEffectV2, useMemo: useMemoV2, useRef: useRefV2 } = React;

/* ============================================================================
 *  NEXT UP CARD — the hero card of the home screen
 *  Single primary action surfaces the most relevant next thing.
 *  States: has-booking, no-booking, checked-in-today
 * ========================================================================== */
const NextUpCard = ({ state = 'has-booking', onPrimary, onSecondary }) => {
  const configs = {
    'has-booking': {
      eyebrow: 'วันนี้ · ใน 2 ชั่วโมง',
      title: 'HIIT Express · 30 นาที',
      sub: 'Coach Best · ห้อง A · 12:00',
      primary: 'เช็คอินตอนนี้',
      secondary: 'ดูรายละเอียด',
      icon: icons.bolt,
      gradient: 'linear-gradient(135deg, hsl(25 95% 58%), hsl(14 90% 52%))',
    },
    'no-booking': {
      eyebrow: 'วันนี้ยังว่างอยู่',
      title: 'จองคลาสถัดไปเลย',
      sub: 'มีคลาสว่างอีก 12 คลาสในสัปดาห์นี้',
      primary: 'ดูตารางเรียน',
      secondary: 'เช็คอินเฉยๆ',
      icon: icons.cal,
      gradient: 'linear-gradient(135deg, hsl(25 95% 58%), hsl(38 92% 52%))',
    },
    'checked-in': {
      eyebrow: 'เช็คอินแล้ว · 18:42',
      title: 'เยี่ยมมาก! ได้ +9 XP',
      sub: 'สตรีคต่อเนื่อง 3 วัน 🔥',
      primary: 'ดูความคืบหน้า',
      secondary: 'จองครั้งถัดไป',
      icon: icons.check,
      gradient: 'linear-gradient(135deg, hsl(152 55% 48%), hsl(165 60% 42%))',
    },
  };
  const cfg = configs[state];

  return (
    <div style={{
      borderRadius: 18, padding: 16, color: '#fff',
      background: cfg.gradient,
      boxShadow: '0 10px 28px -8px hsl(25 95% 53% / 0.4)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decor */}
      <div style={{ position: 'absolute', top: -30, right: -20, opacity: .15,
                    transform: 'rotate(-15deg)' }}>
        <Icon d={cfg.icon} size={140} fill="currentColor" stroke={0}/>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
                      textTransform: 'uppercase', opacity: .9 }}>
          {cfg.eyebrow}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6, letterSpacing: '-.01em' }}>
          {cfg.title}
        </div>
        <div style={{ fontSize: 12, opacity: .92, marginTop: 4 }}>
          {cfg.sub}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onPrimary} style={{
            background: '#fff', color: tokens.ink, border: 0, cursor: 'pointer',
            padding: '10px 14px', borderRadius: 10, fontWeight: 800, fontSize: 13,
            fontFamily: 'inherit', flex: 1.2,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon d={state === 'has-booking' ? icons.scan : cfg.icon} size={16} stroke={2.5}/>
            {cfg.primary}
          </button>
          <button onClick={onSecondary} style={{
            background: 'rgba(255,255,255,0.22)', color: '#fff', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.35)', padding: '10px 14px', borderRadius: 10,
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit', flex: 1,
            backdropFilter: 'blur(4px)',
          }}>
            {cfg.secondary}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 *  HOME V2 — simplified, focused, purposeful
 *  Layout:
 *    1. Greeting (compact) + mascot + notif
 *    2. NEXT UP card (hero, single focus)
 *    3. Momentum strip (compact horizontal)
 *    4. Quick actions (4 tiles: book / history / friends / rewards)
 *    5. Quests (collapsed summary, expand to see all)
 *    6. "For you" rail — mix of: featured class, tip, friend activity
 *    7. Referral footer
 * ========================================================================== */
const HomeScreenV2 = ({ setScreen, tier, statusTier, firstName = 'Kongphop', gamifyFeatures = {} }) => {
  const {
    mascot = true, mood = true, friends = true, wellness = true,
    achievement = true,
  } = gamifyFeatures;

  const [nextUpState, setNextUpState] = useStateV2('has-booking'); // demo toggle
  const [questsOpen, setQuestsOpen] = useStateV2(false);
  const [moodPicked, setMoodPicked] = useStateV2(null);
  const hasProgressed = tier !== 'starter';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์';
    if (h < 17) return 'บ่ายดีจ้า';
    return 'เย็นนี้พร้อมลุย';
  })();

  const questsList = [
    { title: 'Floor Time',      progress: 0, target: 45, xp: 20 },
    { title: 'Come In Today',   progress: 1, target: 1,  xp: 6, rp: 1, done: true },
    { title: 'Quiet Hour Hero', progress: 1, target: 1,  xp: 15, done: true },
    { title: 'Two-Day Momentum',progress: 0, target: 2,  xp: 30, weekly: true },
  ];
  const questsDone = questsList.filter(q => q.done).length;

  return (
    <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column',
                  gap: 14, background: tokens.bg }}>

      {/* --- 1. Greeting + mascot (v1-style) --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: tokens.ink, letterSpacing: '-0.01em' }}>
            {greeting} {firstName.split(' ')[0]}!
          </h1>
          <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
            Moomu พร้อมซ้อมกับคุณแล้ว 💪
          </div>
          {moodPicked ? (
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 4,
                          display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              อารมณ์วันนี้ · <b style={{ color: tokens.ink }}>{moodPicked}</b>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 4 }}>
              {hasProgressed ? 'Lv 3 · 840 XP · สตรีค 2 สัปดาห์' : 'เริ่มต้นการเดินทางของคุณ'}
            </div>
          )}
        </div>
        {mascot && <Mascot size={72} mood={hasProgressed ? 'fire' : 'cheer'}/>}
      </div>

      {/* --- 2. Mood check-in (only if not picked) --- */}
      {mood && !moodPicked && (
        <MoodCheckin onPick={(k) => {
          const labels = {low:'เหนื่อย', ok:'เฉยๆ', good:'ดี', strong:'พร้อม', fire:'ไฟลุก'};
          setMoodPicked(labels[k]);
        }}/>
      )}

      {/* --- 3. NEXT UP hero --- */}
      <NextUpCard
        state={nextUpState}
        onPrimary={() => {
          if (nextUpState === 'has-booking') setScreen('checkin');
          else if (nextUpState === 'no-booking') setScreen('schedule');
          else setScreen('rewards');
        }}
        onSecondary={() => {
          if (nextUpState === 'has-booking') setScreen('classDetail');
          else if (nextUpState === 'no-booking') setScreen('checkin');
          else setScreen('schedule');
        }}
      />

      {/* Demo state switcher — inline so user can flip through */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: -4 }}>
        {[
          ['has-booking','มีคลาส'],
          ['no-booking','ไม่มีคลาส'],
          ['checked-in','เช็คอินแล้ว'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setNextUpState(k)} style={{
            background: nextUpState === k ? tokens.orange : 'transparent',
            color: nextUpState === k ? '#fff' : tokens.inkMuted,
            border: `1px solid ${nextUpState === k ? tokens.orange : tokens.border}`,
            padding: '3px 10px', borderRadius: 9999, cursor: 'pointer',
            fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
          }}>{l}</button>
        ))}
      </div>

      {/* --- 4. Momentum strip (compact, tap to expand) --- */}
      <MomentumStrip
        tier={tier} statusTier={statusTier}
        level={hasProgressed ? 3 : 1}
        xpInLevel={hasProgressed ? 180 : 0}
        xpNeeded={hasProgressed ? 400 : 100}
        totalXp={hasProgressed ? 840 : 0}
        rp={hasProgressed ? 128 : 0}
        streakWeeks={hasProgressed ? 2 : 0}
        onClick={() => setScreen('rewards')}
      />

      {/* --- 5. Quick action tiles --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <QuickTile icon={icons.calCheck} label="จองคลาส"   onClick={() => setScreen('schedule')}/>
        <QuickTile icon={icons.clock}    label="ประวัติ"   badge="12"/>
        <QuickTile icon={icons.users}    label="เพื่อน"    badge="4"/>
        <QuickTile icon={icons.gift}     label="รางวัล"    onClick={() => setScreen('rewards')}/>
      </div>

      {/* --- 6. Quests (collapsible) --- */}
      <div style={{
        background: tokens.card, border: `1px solid ${tokens.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        <button onClick={() => setQuestsOpen(!questsOpen)} style={{
          width: '100%', background: 'transparent', border: 0, cursor: 'pointer',
          padding: '14px', display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: tokens.orangeSoft,
            color: tokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon d={icons.target} size={18} stroke={2.2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink }}>
              เควสวันนี้
            </div>
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>
              สำเร็จ {questsDone}/{questsList.length} · รับได้อีก +50 XP
            </div>
          </div>
          {/* progress ring */}
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke={tokens.borderSoft} strokeWidth="3"/>
              <circle cx="16" cy="16" r="13" fill="none" stroke={tokens.orange} strokeWidth="3"
                      strokeDasharray={`${(questsDone/questsList.length) * 81.68} 100`}
                      strokeLinecap="round" transform="rotate(-90 16 16)"/>
            </svg>
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 900, color: tokens.ink,
            }}>{questsDone}</span>
          </div>
          <span style={{
            color: tokens.inkMuted, display: 'flex',
            transform: questsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
          }}>
            <Icon d={icons.chevDown} size={16} stroke={2.2}/>
          </span>
        </button>
        {questsOpen && (
          <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${tokens.borderSoft}` }}>
            {questsList.map(q => (
              <QuestRow key={q.title} {...q}/>
            ))}
          </div>
        )}
      </div>

      {/* --- 7. Achievement + Wellness tip (rail) --- */}
      {achievement && <AchievementTeaser/>}
      {wellness && <WellnessTip/>}
      {friends && <FriendsActivity/>}

      {/* --- 8. Referral --- */}
      <div style={{
        background: tokens.orangeSoft, border: `1px solid ${tokens.orangeBorder}`,
        borderRadius: 14, padding: 12,
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'hsl(25 95% 53% / 0.15)', color: tokens.orange,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon d={icons.gift} size={20} stroke={2.2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink }}>ชวนเพื่อน รับแต้ม!</div>
          <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>
            แชร์โค้ด ทั้งคู่ได้ 200 Coin
          </div>
        </div>
        <Button variant="outline" size="sm" icon={icons.copy}
                style={{ background: '#fff', color: tokens.orange, fontWeight: 800 }}>
          แชร์
        </Button>
      </div>
    </div>
  );
};

/* --- Quick tile --- */
const QuickTile = ({ icon, label, badge, onClick }) => (
  <button onClick={onClick} style={{
    background: tokens.card, border: `1px solid ${tokens.border}`,
    borderRadius: 12, padding: '10px 6px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    position: 'relative', fontFamily: 'inherit',
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10, background: tokens.orangeSoft,
      color: tokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon d={icon} size={18} stroke={2.2}/>
    </div>
    <span style={{ fontSize: 10, fontWeight: 700, color: tokens.ink }}>{label}</span>
    {badge && (
      <span style={{
        position: 'absolute', top: 6, right: 6,
        minWidth: 16, height: 16, padding: '0 4px', borderRadius: 9999,
        background: tokens.orange, color: '#fff',
        fontSize: 9, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{badge}</span>
    )}
  </button>
);

/* --- Momentum strip (compact version of card) --- */
const MomentumStrip = ({ tier, statusTier, level, xpInLevel, xpNeeded, totalXp, rp, streakWeeks, onClick }) => {
  const pct = Math.min(100, (xpInLevel / xpNeeded) * 100);
  const t = MOMENTUM_TIERS[tier];
  return (
    <button onClick={onClick} style={{
      background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 14, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left', width: '100%',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg, ${t.color}, ${t.color.replace('%)', '% / 0.7)')})`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 900, letterSpacing: '.02em',
      }}>
        {level}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink, textTransform: 'capitalize' }}>
            {t.label}
          </span>
          <span style={{ fontSize: 10, color: tokens.inkMuted, fontWeight: 700,
                         fontVariantNumeric: 'tabular-nums' }}>
            Lv {level} · {xpInLevel}/{xpNeeded} XP
          </span>
        </div>
        <div style={{ height: 6, background: tokens.cardSubtle, borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%',
                        background: `linear-gradient(90deg, ${tokens.orange}, ${tokens.rp})` }}/>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: tokens.ink, display: 'inline-flex',
                       alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          <Icon d={icons.coin} size={11} stroke={2.2}/> {rp}
        </span>
        {streakWeeks > 0 && (
          <span style={{ fontSize: 10, color: tokens.flame, display: 'inline-flex',
                         alignItems: 'center', gap: 3, fontWeight: 800 }}>
            🔥 {streakWeeks}w
          </span>
        )}
      </div>
    </button>
  );
};

/* ============================================================================
 *  SCHEDULE V2 — with search, filter, my-bookings toggle, date strip
 * ========================================================================== */
const ScheduleScreenV2 = ({ onOpenClass }) => {
  const [dayIdx, setDayIdx] = useStateV2(1);
  const [booked, setBooked] = useStateV2({ '07:00': true });
  const [filter, setFilter] = useStateV2('all');
  const [mineOnly, setMineOnly] = useStateV2(false);
  const [search, setSearch] = useStateV2('');

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i - 1);
    return d;
  });
  const thaiDays = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  const allClasses = [
    { time: '07:00', dur: 45, title: 'Spin · High Intensity', coach: 'Coach Arm',  filled: 17, total: 20, type: 'cardio', room: 'Cycle' },
    { time: '08:30', dur: 60, title: 'Mobility + Stretch',    coach: 'Coach Mild', filled:  6, total: 12, type: 'mobility', room: 'Studio B' },
    { time: '12:00', dur: 30, title: 'HIIT Express · 30 min', coach: 'Coach Best', filled: 20, total: 20, type: 'cardio', room: 'A' },
    { time: '17:30', dur: 45, title: 'Boxing · Beginner',     coach: 'Coach Mek',  filled:  8, total: 16, type: 'combat', room: 'Ring' },
    { time: '18:00', dur: 75, title: 'Yoga · Vinyasa Flow',   coach: 'Coach Nok',  filled:  9, total: 20, type: 'mobility', room: 'Studio B' },
    { time: '19:30', dur: 60, title: 'Strength · Full Body',  coach: 'Coach P',    filled:  4, total: 20, type: 'strength', room: 'A' },
    { time: '20:30', dur: 45, title: 'Core Power',            coach: 'Coach Nim',  filled: 12, total: 16, type: 'strength', room: 'B' },
  ];

  const filters = [
    { k: 'all',      label: 'ทั้งหมด' },
    { k: 'cardio',   label: 'คาร์ดิโอ' },
    { k: 'strength', label: 'เวท' },
    { k: 'mobility', label: 'โยคะ/ยืด' },
    { k: 'combat',   label: 'ต่อสู้' },
  ];

  const classes = allClasses
    .filter(c => filter === 'all' || c.type === filter)
    .filter(c => !mineOnly || booked[c.time])
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
                           c.coach.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: tokens.bg, minHeight: '100%' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, background: tokens.bg, zIndex: 5,
                    padding: '16px 16px 8px', borderBottom: `1px solid ${tokens.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: tokens.ink,
                       letterSpacing: '-.02em' }}>ตารางเรียน</h1>
          <button style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: tokens.orange,
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: 'inherit',
          }}>
            สาขาอโศก <Icon d={icons.chevDown} size={12} stroke={2.5}/>
          </button>
        </div>

        {/* Search */}
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
          background: tokens.cardSubtle, borderRadius: 10, padding: '8px 12px',
          border: `1px solid ${tokens.borderSoft}`,
        }}>
          <Icon d={icons.target} size={14} stroke={2.2}/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาคลาส หรือโค้ช..."
            style={{
              flex: 1, border: 0, background: 'transparent', outline: 0,
              fontFamily: 'inherit', fontSize: 12, color: tokens.ink,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'transparent', border: 0, cursor: 'pointer',
              color: tokens.inkMuted, display: 'flex',
            }}><Icon d={icons.x} size={14}/></button>
          )}
        </div>

        {/* Date strip with dates */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto',
                      paddingBottom: 4, scrollbarWidth: 'none' }}>
          {dates.map((d, i) => {
            const active = i === dayIdx;
            const isToday = d.toDateString() === today.toDateString();
            return (
              <button key={i} onClick={() => setDayIdx(i)} style={{
                flexShrink: 0, width: 46, height: 58, border: 0, cursor: 'pointer',
                borderRadius: 12, fontFamily: 'inherit',
                background: active ? tokens.orange : tokens.card,
                color: active ? '#fff' : tokens.ink,
                boxShadow: active ? '0 3px 8px hsl(25 95% 53% / 0.3)' : `inset 0 0 0 1px ${tokens.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2, position: 'relative',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700,
                               opacity: active ? .85 : .6 }}>
                  {thaiDays[d.getDay()]}
                </span>
                <span style={{ fontSize: 16, fontWeight: 900,
                               fontVariantNumeric: 'tabular-nums' }}>
                  {d.getDate()}
                </span>
                {isToday && !active && (
                  <span style={{ position: 'absolute', bottom: 4,
                                 width: 4, height: 4, borderRadius: 9999,
                                 background: tokens.orange }}/>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6,
                      marginTop: 8, scrollbarWidth: 'none' }}>
          <button onClick={() => setMineOnly(!mineOnly)} style={{
            flexShrink: 0, padding: '6px 11px', borderRadius: 9999,
            border: `1px solid ${mineOnly ? tokens.orange : tokens.border}`,
            background: mineOnly ? tokens.orangeSoft : tokens.card,
            color: mineOnly ? tokens.orange : tokens.ink,
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon d={icons.check} size={11} stroke={2.5}/>
            ของฉัน
          </button>
          <div style={{ width: 1, background: tokens.border, margin: '4px 2px' }}/>
          {filters.map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              flexShrink: 0, padding: '6px 11px', borderRadius: 9999,
              border: `1px solid ${filter === f.k ? tokens.ink : tokens.border}`,
              background: filter === f.k ? tokens.ink : tokens.card,
              color: filter === f.k ? '#fff' : tokens.inkSecondary,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: '12px 16px 24px' }}>
        <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{classes.length} คลาส</span>
          {Object.keys(booked).length > 0 && !mineOnly && (
            <span style={{ color: tokens.orange, fontWeight: 700 }}>
              {Object.keys(booked).length} จองแล้ว
            </span>
          )}
        </div>

        {classes.length === 0 ? (
          <div style={{
            padding: '40px 20px', textAlign: 'center', background: tokens.card,
            border: `1px solid ${tokens.border}`, borderRadius: 12,
          }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, marginTop: 8 }}>
              ไม่พบคลาสที่ค้นหา
            </div>
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 4 }}>
              ลองเปลี่ยนตัวกรองหรือวัน
            </div>
            <Button variant="outline" size="sm" onClick={() => { setFilter('all'); setSearch(''); setMineOnly(false); }}
                    style={{ marginTop: 12 }}>
              ล้างตัวกรอง
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {classes.map(c => (
              <ClassCardV2 key={c.time} {...c}
                booked={!!booked[c.time]}
                onOpen={onOpenClass}
                onToggle={() => setBooked(b => {
                  const next = { ...b };
                  if (next[c.time]) delete next[c.time]; else next[c.time] = true;
                  return next;
                })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- ClassCardV2: richer, clearer --- */
const ClassCardV2 = ({ time, dur, title, coach, room, filled, total, type, booked, onOpen, onToggle }) => {
  const pct = (filled / total) * 100;
  const full = filled >= total;
  const typeColors = {
    cardio:   { bg: 'hsl(0 75% 95%)',   fg: 'hsl(0 65% 50%)',   emoji: '🏃' },
    strength: { bg: 'hsl(220 50% 95%)', fg: 'hsl(220 60% 45%)', emoji: '💪' },
    mobility: { bg: 'hsl(160 50% 94%)', fg: 'hsl(160 50% 35%)', emoji: '🧘' },
    combat:   { bg: 'hsl(280 40% 95%)', fg: 'hsl(280 55% 50%)', emoji: '🥊' },
  };
  const tc = typeColors[type] || typeColors.cardio;

  return (
    <div style={{
      background: tokens.card, border: `1px solid ${booked ? tokens.orange : tokens.border}`,
      borderRadius: 14, padding: 12, display: 'flex', gap: 12,
      boxShadow: booked ? '0 2px 6px hsl(25 95% 53% / 0.18)' : '0 1px 3px hsl(220 20% 8% / 0.04)',
      position: 'relative',
    }}>
      {booked && (
        <div style={{ position: 'absolute', top: -7, left: 12,
                      padding: '2px 8px', borderRadius: 9999,
                      background: tokens.orange, color: '#fff',
                      fontSize: 9, fontWeight: 800, letterSpacing: '.04em' }}>
          จองแล้ว
        </div>
      )}
      <div onClick={onOpen} style={{ cursor: 'pointer', flex: 1, display: 'flex', gap: 12, minWidth: 0 }}>
        {/* Time */}
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: tokens.ink,
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
            {time}
          </div>
          <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>
            {dur} นาที
          </div>
        </div>
        {/* Type pill */}
        <div style={{
          width: 4, borderRadius: 9999, background: tc.fg, flexShrink: 0,
        }}/>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{tc.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: tokens.ink,
                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
          </div>
          <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 6 }}>
            {coach} · {room}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: 'hsl(30 12% 93%)',
                          borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%',
                            background: full ? tokens.danger : pct > 70 ? tokens.warning : tokens.success }}/>
            </div>
            <span style={{ fontSize: 10, color: tokens.inkMuted, fontVariantNumeric: 'tabular-nums',
                           fontWeight: 600 }}>
              {filled}/{total}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant={booked ? 'outline' : full ? 'outline' : 'primary'}
        size="sm"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        disabled={full && !booked}
        style={{ alignSelf: 'center', flexShrink: 0, minWidth: 62,
                 color: booked ? tokens.danger : undefined,
                 borderColor: booked ? 'hsl(0 65% 52% / 0.3)' : undefined }}
      >
        {booked ? 'ยกเลิก' : full ? 'เต็ม' : 'จอง'}
      </Button>
    </div>
  );
};

/* ============================================================================
 *  REWARDS V2 — with category tabs, featured, and history
 * ========================================================================== */
const RewardsScreenV2 = ({ statusTier = 'bronze', onRedeem }) => {
  const [tab, setTab] = useStateV2('catalog');
  const [category, setCategory] = useStateV2('all');

  const categories = [
    { k: 'all',       label: 'ทั้งหมด',   emoji: '✨' },
    { k: 'food',      label: 'อาหาร',     emoji: '🥤' },
    { k: 'session',   label: 'เซสชัน',    emoji: '💪' },
    { k: 'gear',      label: 'ของใช้',    emoji: '👕' },
    { k: 'experience',label: 'กิจกรรม',   emoji: '🎟️' },
  ];

  const rewards = [
    { name: 'โปรตีนเชคฟรี',      cost: 500,  cat: 'food',      emoji: '🥤', popular: true,  stock: 12 },
    { name: 'Guest pass ×1',      cost: 1200, cat: 'session',   emoji: '👥', stock: 5 },
    { name: 'PT 30 นาที',        cost: 3500, cat: 'session',   emoji: '💪', stock: 3 },
    { name: 'MOOM Towel',         cost: 800,  cat: 'gear',      emoji: '🧴', popular: true,  stock: 20 },
    { name: 'MOOM Shaker',        cost: 400,  cat: 'gear',      emoji: '🍶', stock: 15 },
    { name: 'Smoothie Bowl',      cost: 350,  cat: 'food',      emoji: '🍓', stock: 8 },
    { name: 'Retreat Weekend',    cost: 8000, cat: 'experience',emoji: '🏔️', stock: 2, featured: true },
    { name: 'Group Class Host',   cost: 2000, cat: 'experience',emoji: '🎉', stock: 4 },
  ];

  const ledger = [
    { d: '21 เม.ย.',  t: 'Protein Shake',  cost: 500, icon: '🥤' },
    { d: '14 เม.ย.',  t: 'Guest Pass',     cost: 1200, icon: '👥' },
    { d: '02 เม.ย.',  t: 'MOOM Towel',     cost: 800, icon: '🧴' },
  ];

  const filtered = rewards.filter(r => category === 'all' || r.cat === category);
  const featured = rewards.find(r => r.featured);
  const affordable = rewards.filter(r => r.cost <= 628); // 628 = current coins

  const nextTier = Object.keys(STATUS_TIERS)[Object.keys(STATUS_TIERS).indexOf(statusTier) + 1];

  return (
    <div style={{ background: tokens.bg, minHeight: '100%' }}>
      {/* Wallet header */}
      <div style={{
        background: `linear-gradient(135deg, hsl(38 92% 52%), hsl(25 95% 53%))`,
        padding: '18px 16px 24px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, opacity: .1 }}>
          <Icon d={icons.coin} size={180} stroke={2}/>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
                        opacity: .9, textTransform: 'uppercase' }}>
            เหรียญของคุณ
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-.03em',
                           fontVariantNumeric: 'tabular-nums' }}>628</span>
            <span style={{ fontSize: 14, fontWeight: 700, opacity: .85 }}>Coins</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <StatusTierBadge tier={statusTier} size="sm"/>
            {nextTier && (
              <span style={{ fontSize: 11, opacity: .9 }}>
                อีก 72 Coin → {STATUS_TIERS[nextTier].label}
              </span>
            )}
          </div>
          {nextTier && (
            <div style={{ marginTop: 10, height: 6,
                          background: 'rgba(255,255,255,0.25)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ width: '65%', height: '100%',
                            background: '#fff', borderRadius: 9999 }}/>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', marginTop: -14, position: 'relative', zIndex: 2 }}>
        <div style={{
          flex: 1, display: 'flex',
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 10, padding: 3,
          boxShadow: '0 2px 6px hsl(220 20% 8% / 0.05)',
        }}>
          {[
            { k: 'catalog', label: 'แลกของรางวัล', icon: icons.gift },
            { k: 'history', label: 'ประวัติ',     icon: icons.clock },
            { k: 'badges',  label: 'แบดจ์',       icon: icons.trophy },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, padding: '8px 4px', border: 0, cursor: 'pointer',
              background: tab === t.k ? tokens.orange : 'transparent',
              color: tab === t.k ? '#fff' : tokens.inkMuted,
              borderRadius: 8, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <Icon d={t.icon} size={12} stroke={2.2}/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 24px' }}>
        {tab === 'catalog' && (
          <>
            {/* Featured */}
            {featured && category === 'all' && (
              <div style={{
                background: 'linear-gradient(135deg, hsl(280 60% 50%), hsl(220 60% 50%))',
                borderRadius: 14, padding: 14, color: '#fff', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 10px 24px -8px hsl(260 60% 50% / 0.4)',
              }}>
                <div style={{ fontSize: 42, lineHeight: 1 }}>{featured.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em',
                                opacity: .85, textTransform: 'uppercase' }}>แนะนำ</div>
                  <div style={{ fontSize: 15, fontWeight: 900, marginTop: 2 }}>
                    {featured.name}
                  </div>
                  <div style={{ fontSize: 11, opacity: .9, marginTop: 2 }}>
                    ⏳ เหลือ {featured.stock} สิทธิ์
                  </div>
                </div>
                <div style={{
                  padding: '6px 10px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)',
                  fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap',
                }}>
                  {featured.cost}
                </div>
              </div>
            )}

            {/* Category chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
                          scrollbarWidth: 'none', marginBottom: 4 }}>
              {categories.map(c => (
                <button key={c.k} onClick={() => setCategory(c.k)} style={{
                  flexShrink: 0, padding: '7px 12px', borderRadius: 9999,
                  border: `1px solid ${category === c.k ? tokens.ink : tokens.border}`,
                  background: category === c.k ? tokens.ink : tokens.card,
                  color: category === c.k ? '#fff' : tokens.inkSecondary,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Affordable indicator */}
            {category === 'all' && (
              <div style={{
                background: tokens.successTint, border: `1px solid hsl(152 55% 42% / 0.2)`,
                borderRadius: 10, padding: '8px 12px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 11,
                color: tokens.inkSecondary,
              }}>
                <Icon d={icons.check} size={14} stroke={2.5}/>
                แลกได้ตอนนี้ <b>{affordable.length}</b> รายการ
              </div>
            )}

            {/* Rewards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {filtered.filter(r => !r.featured || category !== 'all').map(r => (
                <RewardCard key={r.name} reward={r} canAfford={r.cost <= 628} onRedeem={onRedeem}/>
              ))}
            </div>
          </>
        )}

        {tab === 'history' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink, marginBottom: 10 }}>
              ใช้ไปแล้ว 2,500 Coin · 3 รายการ
            </div>
            <div style={{
              background: tokens.card, border: `1px solid ${tokens.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {ledger.map((l, i) => (
                <div key={i} style={{
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < ledger.length - 1 ? `1px solid ${tokens.borderSoft}` : 0,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: tokens.orangeSoft, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{l.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{l.t}</div>
                    <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>{l.d}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: tokens.danger,
                                fontVariantNumeric: 'tabular-nums' }}>
                    -{l.cost}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'badges' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink, marginBottom: 2 }}>
              แบดจ์ของคุณ
            </div>
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 12 }}>
              3 จาก 6 แบดจ์ · คอลเลคทั้งหมดเพื่อรับรางวัลพิเศษ
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { emoji: '🔥', label: 'สตรีค 7 วัน',  earned: true,  progress: 7, target: 7 },
                { emoji: '💪', label: '50 ครั้ง',     earned: true,  progress: 50, target: 50 },
                { emoji: '🌅', label: 'นกเช้า × 10',  earned: true,  progress: 10, target: 10 },
                { emoji: '⚡', label: 'สปีดดีมอน',    earned: false, progress: 3, target: 10 },
                { emoji: '🏆', label: 'Top 10',        earned: false, progress: 0, target: 1 },
                { emoji: '💎', label: '100 คลาส',     earned: false, progress: 48, target: 100 },
              ].map(b => (
                <div key={b.label} style={{
                  background: tokens.card, border: `1px solid ${tokens.border}`,
                  borderRadius: 12, padding: 12, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 30, lineHeight: 1,
                                filter: b.earned ? 'none' : 'grayscale(.8)',
                                opacity: b.earned ? 1 : 0.55 }}>{b.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: tokens.ink,
                                minHeight: 24, display: 'flex', alignItems: 'center',
                                justifyContent: 'center' }}>
                    {b.label}
                  </div>
                  {b.earned ? (
                    <div style={{ fontSize: 8, color: tokens.success, fontWeight: 800,
                                  marginTop: 4, letterSpacing: '.08em' }}>
                      ✓ ปลดล็อกแล้ว
                    </div>
                  ) : (
                    <>
                      <div style={{ height: 3, background: tokens.borderSoft, borderRadius: 9999,
                                    marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${(b.progress/b.target)*100}%`, height: '100%',
                                      background: tokens.orange }}/>
                      </div>
                      <div style={{ fontSize: 9, color: tokens.inkMuted, marginTop: 3,
                                    fontVariantNumeric: 'tabular-nums' }}>
                        {b.progress}/{b.target}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RewardCard = ({ reward, canAfford, onRedeem }) => (
  <div style={{
    background: tokens.card, border: `1px solid ${tokens.border}`,
    borderRadius: 14, padding: 12, opacity: canAfford ? 1 : 0.7,
    display: 'flex', flexDirection: 'column', gap: 8,
  }}>
    <div style={{
      aspectRatio: '1.3/1', borderRadius: 10,
      background: canAfford
        ? 'linear-gradient(135deg, hsl(38 92% 95%), hsl(25 95% 93%))'
        : tokens.cardSubtle,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 48, position: 'relative',
    }}>
      {reward.emoji}
      {reward.popular && (
        <span style={{
          position: 'absolute', top: 6, left: 6,
          padding: '2px 6px', borderRadius: 9999,
          background: tokens.orange, color: '#fff',
          fontSize: 8, fontWeight: 800, letterSpacing: '.06em',
        }}>🔥 ฮิต</span>
      )}
      {reward.stock <= 5 && (
        <span style={{
          position: 'absolute', bottom: 6, right: 6,
          padding: '2px 6px', borderRadius: 9999,
          background: tokens.ink, color: '#fff',
          fontSize: 8, fontWeight: 800,
        }}>เหลือ {reward.stock}</span>
      )}
    </div>
    <div style={{ fontSize: 12, fontWeight: 800, color: tokens.ink,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {reward.name}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        color: tokens.rp, fontWeight: 900, fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <Icon d={icons.coin} size={12} stroke={2.5}/>
        {reward.cost}
      </span>
      <button onClick={onRedeem} disabled={!canAfford}
        style={{
          background: canAfford ? tokens.orange : tokens.cardSubtle,
          color: canAfford ? '#fff' : tokens.inkMuted,
          border: 0, padding: '5px 10px', borderRadius: 8,
          fontSize: 11, fontWeight: 800, cursor: canAfford ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
        }}>
        {canAfford ? 'แลก' : 'ไม่พอ'}
      </button>
    </div>
  </div>
);

/* ============================================================================
 *  PROFILE V2 — with membership card, goals, organized settings
 * ========================================================================== */
const ProfileScreenV2 = ({ tier, setTier, statusTier, setStatusTier }) => {
  const [goalOpen, setGoalOpen] = useStateV2(false);
  const [goal, setGoal] = useStateV2({ target: 4, current: 3 });

  const menuGroups = [
    {
      title: 'บัญชี',
      items: [
        { label: 'สมาชิกภาพ',     detail: 'ไม่จำกัด · ต่ออายุ 12 พ.ค.', icon: icons.shield },
        { label: 'วิธีชำระเงิน',   detail: 'Visa •• 4231',              icon: icons.coin },
        { label: 'ข้อมูลส่วนตัว',  detail: 'แก้ไขชื่อ, อีเมล, เบอร์',    icon: icons.user },
      ],
    },
    {
      title: 'ความชอบ',
      items: [
        { label: 'การแจ้งเตือน',   detail: 'เปิด 5 ประเภท',  icon: icons.bell },
        { label: 'ภาษา',          detail: 'ไทย',            icon: icons.sparkles },
        { label: 'สาขาหลัก',      detail: 'อโศก',            icon: icons.target },
      ],
    },
    {
      title: 'ช่วยเหลือ',
      items: [
        { label: 'ศูนย์ช่วยเหลือ', icon: icons.sparkles },
        { label: 'ติดต่อเรา',      icon: icons.share },
        { label: 'เงื่อนไขการใช้งาน', icon: icons.shield },
        { label: 'ออกจากระบบ',    icon: icons.x, danger: true },
      ],
    },
  ];

  return (
    <div style={{ background: tokens.bg, minHeight: '100%', paddingBottom: 16 }}>
      {/* Avatar + name */}
      <div style={{
        padding: '18px 16px 20px',
        background: `linear-gradient(180deg, ${tokens.orangeSoft}, ${tokens.bg})`,
        textAlign: 'center',
      }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: `linear-gradient(135deg, hsl(25 95% 60%), hsl(28 95% 45%))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: '.02em',
            boxShadow: '0 6px 18px hsl(25 95% 53% / 0.3)',
          }}>KS</div>
          <button style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: '50%', border: `2px solid ${tokens.bg}`,
            background: tokens.card, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tokens.ink, boxShadow: '0 2px 6px hsl(220 20% 8% / 0.15)',
          }}>
            <Icon d={icons.sparkles} size={12} stroke={2.5}/>
          </button>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 10, color: tokens.ink,
                      letterSpacing: '-.01em' }}>Kongphop S.</div>
        <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 2 }}>
          สมาชิกตั้งแต่ มี.ค. 2024 · สาขาอโศก
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
          <MomentumTierBadge tier={tier} level={3} size="sm"/>
          <StatusTierBadge tier={statusTier} size="sm"/>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Membership card / QR */}
        <div style={{
          background: `linear-gradient(135deg, hsl(220 30% 18%), hsl(220 25% 28%))`,
          borderRadius: 16, padding: 16, color: '#fff',
          boxShadow: '0 10px 24px -8px hsl(220 30% 18% / 0.35)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -10, opacity: 0.08 }}>
            <div style={{ fontSize: 140, fontWeight: 900, letterSpacing: '-.04em' }}>M</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        position: 'relative' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
                            opacity: .8, textTransform: 'uppercase' }}>
                MOOM MEMBER CARD
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4, fontFamily: 'ui-monospace, monospace',
                            letterSpacing: '.12em' }}>
                5832 9104 2376
              </div>
              <div style={{ fontSize: 11, opacity: .8, marginTop: 10 }}>
                ไม่จำกัด · หมดอายุ 05/26
              </div>
            </div>
            <div style={{
              width: 58, height: 58, borderRadius: 10, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: tokens.ink, flexShrink: 0,
            }}>
              <Icon d={icons.qr} size={42} stroke={2}/>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { v: '48',    l: 'คลาส', sub: '+6 เดือนนี้' },
            { v: '2wk',   l: 'สตรีค', sub: 'ดีที่สุด 4wk' },
            { v: '840',   l: 'XP',   sub: 'Lv 3' },
          ].map(s => (
            <div key={s.l} style={{
              background: tokens.card, border: `1px solid ${tokens.border}`,
              borderRadius: 12, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                            color: tokens.ink, letterSpacing: '-.02em' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: tokens.ink, marginTop: 2, fontWeight: 600 }}>
                {s.l}
              </div>
              <div style={{ fontSize: 9, color: tokens.inkMuted, marginTop: 1 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly goal */}
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 14, padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: tokens.successSoft,
              color: tokens.success, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon d={icons.target} size={20} stroke={2.2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink }}>
                เป้าหมายสัปดาห์นี้
              </div>
              <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>
                เข้าคลาส {goal.current}/{goal.target} ครั้ง
              </div>
            </div>
            <button onClick={() => setGoalOpen(!goalOpen)} style={{
              background: 'transparent', border: 0, cursor: 'pointer',
              color: tokens.orange, fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
            }}>แก้ไข</button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
            {Array.from({ length: goal.target }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 8, borderRadius: 9999,
                background: i < goal.current ? tokens.success : tokens.borderSoft,
              }}/>
            ))}
          </div>
          {goalOpen && (
            <div style={{ marginTop: 12, padding: 10, background: tokens.cardSubtle,
                          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: tokens.inkMuted, fontWeight: 700 }}>เป้า/สัปดาห์</span>
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                {[2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setGoal({ ...goal, target: n })} style={{
                    flex: 1, padding: '6px 0', border: 0,
                    background: goal.target === n ? tokens.orange : '#fff',
                    color: goal.target === n ? '#fff' : tokens.ink,
                    borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
                    boxShadow: goal.target !== n ? `inset 0 0 0 1px ${tokens.border}` : 'none',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Menu groups */}
        {menuGroups.map(g => (
          <div key={g.title}>
            <div style={{ fontSize: 10, fontWeight: 800, color: tokens.inkMuted,
                          letterSpacing: '.08em', textTransform: 'uppercase',
                          padding: '0 4px 8px' }}>
              {g.title}
            </div>
            <div style={{
              background: tokens.card, border: `1px solid ${tokens.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {g.items.map((it, i) => (
                <button key={it.label} style={{
                  width: '100%', padding: '12px 14px', cursor: 'pointer',
                  background: 'transparent', border: 0,
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: i < g.items.length - 1 ? `1px solid ${tokens.borderSoft}` : 0,
                  fontFamily: 'inherit', textAlign: 'left',
                  color: it.danger ? tokens.danger : tokens.ink,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: it.danger ? 'hsl(0 65% 52% / 0.1)' : tokens.cardSubtle,
                    color: it.danger ? tokens.danger : tokens.inkMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon d={it.icon} size={15} stroke={2.2}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{it.label}</div>
                    {it.detail && (
                      <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 1 }}>
                        {it.detail}
                      </div>
                    )}
                  </div>
                  {!it.danger && (
                    <span style={{ color: tokens.inkMuted, display: 'flex' }}>
                      <Icon d={icons.chevR} size={14} stroke={2.2}/>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Tweaks (dev only) */}
        <details style={{
          padding: 10, background: tokens.card, border: `1px dashed ${tokens.border}`,
          borderRadius: 12, fontSize: 11,
        }}>
          <summary style={{ cursor: 'pointer', color: tokens.inkMuted, fontWeight: 700 }}>
            Dev Tweaks (สำหรับทดสอบ)
          </summary>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: tokens.inkMuted, marginBottom: 4 }}>MOMENTUM TIER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.keys(MOMENTUM_TIERS).map(t => (
                <button key={t} onClick={() => setTier(t)} style={{
                  background: tier===t ? tokens.orange : 'transparent', color: tier===t ? '#fff' : tokens.inkMuted,
                  border: `1px solid ${tier===t ? tokens.orange : tokens.border}`,
                  padding: '3px 8px', borderRadius: 9999, cursor: 'pointer', fontSize: 10,
                  fontFamily: 'inherit', fontWeight: 700, textTransform: 'capitalize',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: tokens.inkMuted, marginBottom: 4 }}>STATUS TIER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.keys(STATUS_TIERS).map(t => (
                <button key={t} onClick={() => setStatusTier(t)} style={{
                  background: statusTier===t ? tokens.orange : 'transparent',
                  color: statusTier===t ? '#fff' : tokens.inkMuted,
                  border: `1px solid ${statusTier===t ? tokens.orange : tokens.border}`,
                  padding: '3px 8px', borderRadius: 9999, cursor: 'pointer', fontSize: 10,
                  fontFamily: 'inherit', fontWeight: 700,
                }}>{STATUS_TIERS[t].en}</button>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

Object.assign(window, {
  HomeScreenV2, ScheduleScreenV2, RewardsScreenV2, ProfileScreenV2,
  NextUpCard, MomentumStrip, QuickTile, ClassCardV2, RewardCard,
});
