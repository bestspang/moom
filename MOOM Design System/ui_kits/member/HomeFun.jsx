/* MOOM Member — gamified home variant */
const { useState: useStateH2, useEffect: useEffectH2 } = React;

const HomeScreenFun = ({ setScreen, tier, statusTier, firstName = 'Kongphop', gamifyFeatures = {} }) => {
  const {
    mascot = true, mood = true, spin = true, friends = true,
    wellness = true, achievement = true, confetti = true,
  } = gamifyFeatures;

  const [showConfetti, setShowConfetti] = useStateH2(false);
  const hasProgressed = tier !== 'starter';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์';
    if (h < 17) return 'บ่ายดีจ้า';
    return 'เย็นนี้พร้อมลุย!';
  })();

  const handleCheckIn = () => {
    if (confetti) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setScreen('checkin');
      }, 800);
    } else {
      setScreen('checkin');
    }
  };

  return (
    <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14, background: tokens.bg }}>
      {showConfetti && <ConfettiBurst show/>}

      {/* ---- Greeting + Mascot hero ---- */}
      {mascot ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: tokens.ink, letterSpacing: '-0.01em' }}>
              {greeting} {firstName.split(' ')[0]}!
            </h1>
            <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
              Moomu พร้อมซ้อมกับคุณแล้ว 💪
            </div>
          </div>
          <Mascot size={64} mood={hasProgressed ? 'fire' : 'cheer'}/>
        </div>
      ) : (
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: tokens.ink, letterSpacing: '-0.01em' }}>
            {greeting}, {firstName}
          </h1>
          <div style={{ fontSize: 13, color: tokens.inkMuted, marginTop: 2 }}>พร้อมซ้อมหรือยัง?</div>
        </div>
      )}

      {/* ---- Mood check-in ---- */}
      {mood && <MoodCheckin/>}

      {/* ---- Dual primary actions ---- */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" size="lg" icon={icons.scan}
                onClick={handleCheckIn}
                style={{ flex: 1, fontWeight: 800 }}>
          เช็คอิน
        </Button>
        <Button variant="outline" size="lg" icon={icons.cal}
                onClick={() => setScreen('schedule')}
                style={{ flex: 1, fontWeight: 800 }}>
          จองคลาส
        </Button>
      </div>

      {/* ---- Daily spin ---- */}
      {spin && <DailySpinCard/>}

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

      {/* ---- Achievement teaser ---- */}
      {achievement && <AchievementTeaser/>}

      {/* ---- Daily quests ---- */}
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: tokens.orange, display: 'flex' }}>
              <Icon d={icons.target} size={14} stroke={2.2}/>
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink, letterSpacing: '.01em' }}>
              เควสวันนี้
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: tokens.orange,
                         padding: '2px 8px', borderRadius: 9999, background: tokens.orangeSoft }}>
            2/4
          </span>
        </div>
        <div>
          <QuestRow title="Floor Time" progress={0} target={45} xp={20}/>
          <QuestRow title="Come In Today" progress={1} target={1} xp={6} rp={1} done/>
          <QuestRow title="Quiet Hour Hero" progress={1} target={1} xp={15} done/>
          <QuestRow title="Two-Day Momentum" progress={0} target={2} xp={30} weekly/>
        </div>
      </Card>

      {/* ---- Friends activity ---- */}
      {friends && <FriendsActivity/>}

      {/* ---- Wellness tip ---- */}
      {wellness && <WellnessTip/>}

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
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreenFun });
