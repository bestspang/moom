/* MOOM Member — screens (grounded in mmember repo + live screenshots) */
const { useState: useStateS } = React;

/* ============================================================================
 *  HOMESCREEN — matches the two live screenshots
 * ========================================================================== */
const HomeScreen = ({ setScreen, tier, statusTier, firstName = 'Kongphop', showWelcome: showWelcomeProp = true }) => {
  const [welcome, setWelcome] = useStateS(showWelcomeProp);
  /* When a tier is passed that isn't 'starter' we assume user has progressed; hide welcome */
  const hasProgressed = tier !== 'starter';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'สวัสดีตอนเช้า';
    if (h < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  })();

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, background: tokens.bg }}>

      {/* ---- Greeting ---- */}
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: tokens.ink, letterSpacing: '-0.01em' }}>
          {greeting}, {firstName}
        </h1>
        <div style={{ fontSize: 13, color: tokens.inkMuted, marginTop: 2 }}>พร้อมซ้อมหรือยัง?</div>
      </div>

      {/* ---- Onboarding checklist (first-time only) ---- */}
      {welcome && !hasProgressed && (
        <div style={{
          border: `1px solid ${tokens.orangeBorder}`, background: tokens.orangeSoft,
          borderRadius: 12, padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: tokens.orange, display: 'flex' }}><Icon d={icons.sparkles} size={16}/></span>
              <span style={{ fontSize: 14, fontWeight: 800, color: tokens.ink }}>ยินดีต้อนรับสู่ MOOM!</span>
            </div>
            <button onClick={() => setWelcome(false)} style={{
              background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit',
              color: tokens.inkMuted, fontSize: 12, fontWeight: 600,
            }}>ปิด</button>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { n: 1, text: 'ดูคลาสในตารางเรียน',    done: true },
              { n: 2, text: 'จองเซสชั่นแรกของคุณ',    done: false },
              { n: 3, text: 'เช็คอินเพื่อรับ XP',       done: false },
            ].map(item => (
              <li key={item.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.done ? (
                  <span style={{
                    width: 22, height: 22, borderRadius: 9999, background: tokens.success,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon d={icons.check} size={12} stroke={3}/></span>
                ) : (
                  <span style={{
                    width: 22, height: 22, borderRadius: 9999, background: tokens.orange,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                  }}>{item.n}</span>
                )}
                <span style={{
                  fontSize: 13, color: item.done ? tokens.inkFaint : tokens.ink,
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ---- Dual primary actions (Check in / Book class) ---- */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" size="lg" icon={icons.scan}
                onClick={() => setScreen('checkin')}
                style={{ flex: 1, fontWeight: 800 }}>
          เช็คอิน
        </Button>
        <Button variant="outline" size="lg" icon={icons.cal}
                onClick={() => setScreen('schedule')}
                style={{ flex: 1, fontWeight: 800 }}>
          จองคลาส
        </Button>
      </div>

      {/* ---- Check-in promo card ---- */}
      <div style={{
        background: tokens.orangeSoft, border: `1px solid ${tokens.orangeBorder}`,
        borderRadius: 14, padding: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'hsl(25 95% 53% / 0.15)', color: tokens.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon d={icons.scan} size={22} stroke={2.2}/>
          </div>
          <span style={{ position: 'absolute', top: 0, right: 0,
                         width: 9, height: 9, borderRadius: 9999, background: tokens.orange,
                         boxShadow: '0 0 0 2px ' + tokens.card }}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: tokens.ink }}>เช็คอินวันนี้</div>
          <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>
            รับ XP โบนัสและรักษาสตรีค 🔥
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <RewardChip kind="xp" value={6}/>
          <RewardChip kind="rp" value={1}/>
        </div>
      </div>

      {/* ---- Momentum hero ---- */}
      <MomentumCard
        tier={tier} statusTier={statusTier}
        level={hasProgressed ? 3 : 1}
        xpInLevel={hasProgressed ? 180 : 0}
        xpNeeded={hasProgressed ? 400 : 100}
        totalXp={hasProgressed ? 840 : 0}
        rp={hasProgressed ? 24 : 0}
        streakWeeks={hasProgressed ? 2 : 0}
        weeklyDays={hasProgressed ? [1,2,4,5] : []}
      />

      {/* ---- Daily quests (flat list inside card) ---- */}
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: tokens.orange, display: 'flex' }}>
            <Icon d={icons.target} size={14} stroke={2.2}/>
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink, letterSpacing: '.01em' }}>
            เควสวันนี้
          </span>
        </div>
        <div>
          <QuestRow title="Floor Time" progress={0} target={45}/>
          <QuestRow title="Come In Today" progress={1} target={1}/>
          <QuestRow title="Quiet Hour Hero" progress={1} target={1}/>
          <QuestRow title="Two-Day Momentum" progress={0} target={2} weekly/>
        </div>
      </Card>

      {/* ---- Badges mini-card ---- */}
      <Card padding={14}>
        <SectionHeader title="แบดจ์" action={<SeeAll/>} style={{ marginBottom: 6 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 12px' }}>
          <span style={{ color: tokens.inkFaint, display: 'flex' }}>
            <Icon d={icons.lock} size={14} stroke={2.2}/>
          </span>
          <span style={{ fontSize: 12, color: tokens.inkMuted }}>รับแบดจ์แรกของคุณ!</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="outline" size="md" icon={icons.trophy}>กระดานผู้นำ</Button>
          <Button variant="outline" size="md" icon={icons.users}>ทีมของฉัน</Button>
        </div>
      </Card>

      {/* ---- Upcoming (empty state) ---- */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: tokens.ink, marginBottom: 10 }}>กำลังจะถึง</div>
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 12, padding: '24px 16px', textAlign: 'center',
          boxShadow: '0 1px 3px hsl(220 20% 8% / 0.04)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: tokens.ink, marginBottom: 4 }}>
            ไม่มีการจองที่จะถึง
          </div>
          <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 14 }}>
            ดูตารางเรียนเพื่อจองคลาสถัดไป
          </div>
          <Button variant="primary" size="md" onClick={() => setScreen('schedule')}>
            ดูตารางเรียน
          </Button>
        </div>
      </div>

      {/* ---- Referral ---- */}
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
            แชร์โค้ดของคุณ ทั้งคู่ได้ 200 Coin
          </div>
        </div>
        <Button variant="outline" size="sm" icon={icons.copy}
                style={{ background: '#fff', color: tokens.orange, fontWeight: 800 }}>
          แชร์
        </Button>
        <span style={{ color: tokens.inkMuted, display: 'flex' }}>
          <Icon d={icons.chevR} size={16} stroke={2.2}/>
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
 *  SCHEDULE SCREEN
 * ========================================================================== */
const ScheduleScreen = ({ onOpenClass }) => {
  const [day, setDay] = useStateS('Mon');
  const [booked, setBooked] = useStateS({ '07:00': true });
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const classes = [
    { time: '07:00', title: 'Spin · High Intensity',   coach: 'Coach Arm',  filled: 17, total: 20 },
    { time: '08:30', title: 'Mobility + Stretch',      coach: 'Coach Mild', filled:  6, total: 12 },
    { time: '12:00', title: 'HIIT Express · 30 min',   coach: 'Coach Best', filled: 20, total: 20 },
    { time: '18:00', title: 'Yoga · Vinyasa Flow',     coach: 'Coach Nok',  filled:  9, total: 20 },
    { time: '19:30', title: 'Strength · Full Body',    coach: 'Coach P',    filled:  4, total: 20 },
  ];
  return (
    <div style={{ padding: 16, background: tokens.bg, minHeight: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: tokens.ink }}>ตารางเรียน</h1>
      <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>สาขาอโศก · สัปดาห์ 19 เม.ย.</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {days.map(d => (
          <button key={d} onClick={() => setDay(d)} style={{
            border: 0, padding: '8px 14px', borderRadius: 9999,
            background: day === d ? tokens.orange : tokens.card,
            color: day === d ? '#fff' : tokens.ink,
            fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: day === d ? '0 2px 6px hsl(25 95% 53% / 0.3)' : `inset 0 0 0 1px ${tokens.border}`,
            flexShrink: 0,
          }}>{d}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {classes.map(c => (
          <div key={c.time} onClick={onOpenClass} style={{ cursor: 'pointer' }}>
            <ClassCard {...c} booked={!!booked[c.time]}
              onToggle={(e) => { if (e) e.stopPropagation?.(); setBooked(b => ({ ...b, [c.time]: !b[c.time] })); }}/>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 *  REWARDS SCREEN
 * ========================================================================== */
const RewardsScreen = ({ statusTier = 'bronze', onRedeem }) => {
  const badges = [
    { emoji: '🔥', label: 'สตรีค 7 วัน',  earned: true },
    { emoji: '💪', label: '50 ครั้ง',     earned: true },
    { emoji: '🌅', label: 'นกเช้า × 10',  earned: true },
    { emoji: '⚡', label: 'สปีดดีมอน',    earned: false },
    { emoji: '🏆', label: 'Top 10',        earned: false },
    { emoji: '💎', label: '100 คลาส',     earned: false },
  ];
  return (
    <div style={{ padding: 16, background: tokens.bg, minHeight: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: tokens.ink }}>รางวัล</h1>

      {/* Wallet summary */}
      <Card padding={14} style={{ marginTop: 14 }}>
        <Eyebrow>กระเป๋าของคุณ</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: tokens.inkMuted, display:'flex', alignItems:'center', gap: 4 }}>
              <Icon d={icons.bolt} size={11} fill="currentColor" stroke={0}/> Total XP
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: tokens.ink, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              2,840
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: tokens.border }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: tokens.inkMuted, display:'flex', alignItems:'center', gap: 4 }}>
              <Icon d={icons.coin} size={11} stroke={2.2}/> Coins
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: tokens.ink, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              128
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '8px 10px', background: tokens.cardSubtle, borderRadius: 8,
                      display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusTierBadge tier={statusTier} size="sm"/>
          <span style={{ fontSize: 11, color: tokens.inkMuted, flex: 1 }}>
            อีก 72 Coin เพื่อเลื่อนขั้น {STATUS_TIERS[statusTier === 'black' ? 'black' : Object.keys(STATUS_TIERS)[Object.keys(STATUS_TIERS).indexOf(statusTier)+1] || 'silver'].label}
          </span>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, color: tokens.ink, marginTop: 20 }}>แบดจ์ของฉัน</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
        {badges.map(b => (
          <div key={b.label} style={{
            background: tokens.card, border: `1px solid ${tokens.border}`,
            borderRadius: 12, padding: 12, textAlign: 'center',
            opacity: b.earned ? 1 : 0.45,
          }}>
            <div style={{ fontSize: 28, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: tokens.ink }}>{b.label}</div>
            {!b.earned && <div style={{ fontSize: 9, color: tokens.inkMuted, marginTop: 2 }}>ล็อก</div>}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, color: tokens.ink, marginTop: 20 }}>แลกของรางวัล</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {[
          { name: 'โปรตีนเชคฟรี',    cost: 500,  kind: 'rp' },
          { name: 'Guest pass ×1',    cost: 1200, kind: 'rp' },
          { name: 'PT 30 นาที',      cost: 3500, kind: 'rp' },
        ].map(r => (
          <div key={r.name} style={{
            background: tokens.card, border: `1px solid ${tokens.border}`,
            borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: tokens.rpSoft,
              color: tokens.rp, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon d={icons.gift} size={18} stroke={2.2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{r.name}</div>
              <div style={{ marginTop: 2 }}>
                <RewardChip kind="rp" value={r.cost.toLocaleString()}/>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={onRedeem}>แลก</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 *  PROFILE SCREEN
 * ========================================================================== */
const ProfileScreen = ({ tier, setTier, statusTier, setStatusTier }) => (
  <div style={{ padding: 16, background: tokens.bg, minHeight: '100%' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: `linear-gradient(135deg, hsl(25 95% 60%), hsl(28 95% 45%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: '.02em',
          boxShadow: '0 6px 18px hsl(25 95% 53% / 0.3)',
        }}>KS</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10, color: tokens.ink }}>Kongphop S.</div>
      <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>เป็นสมาชิกตั้งแต่ มี.ค. 2024 · สาขาอโศก</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <MomentumTierBadge tier={tier} level={3} size="sm"/>
        <StatusTierBadge tier={statusTier} size="sm"/>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 20 }}>
      {[
        { v: '48',    l: 'คลาส' },
        { v: '2wk',   l: 'สตรีค' },
        { v: '840',   l: 'XP' },
      ].map(s => (
        <div key={s.l} style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 12, padding: 12, textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: tokens.ink }}>{s.v}</div>
          <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{
      marginTop: 20, background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {[
        { label: 'สมาชิก',          detail: 'ไม่จำกัด · ต่ออายุ 12 พ.ค.' },
        { label: 'วิธีชำระเงิน',    detail: 'Visa •• 4231' },
        { label: 'การตั้งค่า',       detail: 'ภาษา · TH' },
        { label: 'ช่วยเหลือ' },
      ].map((r, i, arr) => (
        <div key={r.label} style={{
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: i < arr.length - 1 ? `1px solid ${tokens.borderSoft}` : 'none',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: tokens.ink }}>{r.label}</div>
            {r.detail && <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>{r.detail}</div>}
          </div>
          <span style={{ color: tokens.inkMuted, display: 'flex' }}><Icon d={icons.chevR} size={16}/></span>
        </div>
      ))}
    </div>

    {/* ---- Tweaks ---- */}
    <div style={{ marginTop: 20, padding: 12, background: tokens.card, border: `1px dashed ${tokens.border}`,
                  borderRadius: 12, fontSize: 11 }}>
      <Eyebrow color={tokens.orange}>Tweaks</Eyebrow>
      <div style={{ marginTop: 8 }}>
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
        <div style={{ fontSize: 10, color: tokens.inkMuted, marginBottom: 4 }}>STATUS TIER (REWARDS)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Object.keys(STATUS_TIERS).map(t => (
            <button key={t} onClick={() => setStatusTier(t)} style={{
              background: statusTier===t ? tokens.orange : 'transparent', color: statusTier===t ? '#fff' : tokens.inkMuted,
              border: `1px solid ${statusTier===t ? tokens.orange : tokens.border}`,
              padding: '3px 8px', borderRadius: 9999, cursor: 'pointer', fontSize: 10,
              fontFamily: 'inherit', fontWeight: 700, textTransform: 'capitalize',
            }}>{STATUS_TIERS[t].en}</button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { HomeScreen, ScheduleScreen, RewardsScreen, ProfileScreen });
