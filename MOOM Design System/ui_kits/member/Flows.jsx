/* MOOM Member — detailed flows (check-in, class detail, reward redemption) */
const { useState: useStateF, useEffect: useEffectF } = React;

/* ============================================================================
 *  CHECK-IN FLOW — scan → success → reward reveal
 * ========================================================================== */
const CheckinFlow = ({ onDone }) => {
  const [step, setStep] = useStateF('scan'); // scan | success | reward
  const [bolts, setBolts] = useStateF([]);

  useEffectF(() => {
    if (step !== 'scan') return;
    const t = setTimeout(() => setStep('success'), 1800);
    return () => clearTimeout(t);
  }, [step]);

  useEffectF(() => {
    if (step !== 'success') return;
    const t = setTimeout(() => setStep('reward'), 1400);
    /* spawn confetti bolts */
    const arr = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.4,
      rot: (Math.random() * 720 - 360) + 'deg',
      color: ['hsl(25 95% 53%)','hsl(38 92% 50%)','hsl(210 70% 55%)','hsl(152 55% 42%)'][i % 4],
    }));
    setBolts(arr);
    return () => clearTimeout(t);
  }, [step]);

  /* ---- SCAN ---- */
  if (step === 'scan') {
    return (
      <div style={{ padding: 16, minHeight: '100%', background: tokens.bg }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: tokens.ink, marginBottom: 4 }}>เช็คอิน</div>
        <div style={{ fontSize: 12, color: tokens.inkMuted, marginBottom: 14 }}>
          สแกน QR ที่หน้าเคาน์เตอร์ หรือรอให้ระบบตรวจจับอัตโนมัติ
        </div>

        <div style={{
          background: tokens.ink, borderRadius: 18, aspectRatio: '1/1',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 40px -12px hsl(220 20% 8% / 0.35)',
        }}>
          {/* grid pattern bg */}
          <div style={{ position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(hsl(220 30% 18%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 30% 18%) 1px, transparent 1px)`,
            backgroundSize: '24px 24px', opacity: .4 }}/>

          {/* corners */}
          {[[0,0],[1,0],[0,1],[1,1]].map(([x,y], i) => (
            <div key={i} style={{ position: 'absolute',
              [x ? 'right' : 'left']: 24, [y ? 'bottom' : 'top']: 24,
              width: 40, height: 40,
              borderTop:    !y ? `3px solid ${tokens.orange}` : 'none',
              borderBottom: y  ? `3px solid ${tokens.orange}` : 'none',
              borderLeft:   !x ? `3px solid ${tokens.orange}` : 'none',
              borderRight:  x  ? `3px solid ${tokens.orange}` : 'none',
              borderRadius: 6,
            }}/>
          ))}

          {/* scan line */}
          <div style={{ position: 'absolute', left: 60, right: 60, height: 2,
            background: `linear-gradient(90deg, transparent, ${tokens.orange}, transparent)`,
            boxShadow: `0 0 20px ${tokens.orange}`,
            animation: 'scan 2.2s ease-in-out infinite', top: '50%' }}/>

          {/* dim center QR placeholder */}
          <div style={{ position: 'absolute', inset: '25%',
            border: `2px dashed rgba(255,255,255,0.1)`, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.25)' }}>
            <Icon d={icons.qr} size={56} stroke={1.5}/>
          </div>

          {/* status */}
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 9999,
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999,
                             background: tokens.success,
                             boxShadow: `0 0 0 3px hsl(152 55% 42% / 0.35)`,
                             animation: 'pulse-dot 1.4s infinite' }}/>
              กำลังสแกน...
            </span>
          </div>
        </div>

        {/* venue pill */}
        <div style={{ marginTop: 14, padding: '12px 14px',
                      background: tokens.card, border: `1px solid ${tokens.border}`,
                      borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10,
                        background: tokens.orangeSoft, color: tokens.orange,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={icons.target} size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>สาขาอโศก</div>
            <div style={{ fontSize: 11, color: tokens.inkMuted }}>ใกล้คุณ · เปิดอยู่ 06:00–23:00</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: tokens.success,
                         background: tokens.successSoft, padding: '3px 8px', borderRadius: 9999 }}>
            OPEN
          </span>
        </div>

        {/* helper grid */}
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Button variant="outline" size="md" icon={icons.sparkles}>รหัสด้วยมือ</Button>
          <Button variant="outline" size="md" icon={icons.clock}>ดูประวัติ</Button>
        </div>

        <div style={{ marginTop: 14, padding: 12, textAlign: 'center',
                      background: tokens.orangeSoft, border: `1px solid ${tokens.orangeBorder}`,
                      borderRadius: 12, fontSize: 11, color: tokens.inkSecondary }}>
          <strong style={{ color: tokens.orange }}>เคล็ดลับ:</strong> เช็คอินก่อน 10:00 รับ XP โบนัส <strong>+3</strong> 🌅
        </div>
      </div>
    );
  }

  /* ---- SUCCESS ---- */
  if (step === 'success') {
    return (
      <div style={{ padding: 16, minHeight: '100%', background: tokens.bg,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* confetti */}
        {bolts.map(b => (
          <span key={b.id} style={{
            position: 'absolute', top: 60, left: `${b.left}%`,
            color: b.color, fontSize: 20,
            animation: `confetti 1.4s ${b.delay}s ease-out forwards`,
            '--rot': b.rot,
          }}>
            <Icon d={icons.bolt} size={18} fill="currentColor" stroke={0}/>
          </span>
        ))}

        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, hsl(152 55% 50%), hsl(152 55% 38%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', boxShadow: '0 20px 50px -10px hsl(152 55% 42% / 0.6)',
          animation: 'pulse-dot 1s ease-out',
        }}>
          <Icon d={icons.check} size={64} stroke={3.5}/>
        </div>

        <div style={{ fontSize: 26, fontWeight: 900, color: tokens.ink, marginTop: 20,
                      letterSpacing: '-.02em' }}>
          เช็คอินสำเร็จ!
        </div>
        <div style={{ fontSize: 13, color: tokens.inkMuted, marginTop: 4 }}>
          สาขาอโศก · 18:42 น.
        </div>
      </div>
    );
  }

  /* ---- REWARD REVEAL ---- */
  return (
    <div style={{ padding: 16, minHeight: '100%', background: tokens.bg,
                  display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: tokens.ink, letterSpacing: '-.02em' }}>
          เยี่ยมมาก Kongphop!
        </div>
        <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
          นี่คือรางวัลที่คุณได้วันนี้
        </div>
      </div>

      {/* big reward tile — XP */}
      <div style={{
        background: `linear-gradient(135deg, hsl(25 95% 58%), hsl(25 95% 48%))`,
        borderRadius: 18, padding: 20, color: '#fff',
        boxShadow: '0 14px 32px -6px hsl(25 95% 53% / 0.45)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -30, fontSize: 180,
                      opacity: .1, color: '#fff', lineHeight: 1,
                      transform: 'rotate(15deg)' }}>
          <Icon d={icons.bolt} size={220} fill="currentColor" stroke={0}/>
        </div>
        <div style={{ position: 'relative' }}>
          <Eyebrow color="rgba(255,255,255,.85)">XP EARNED</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-.03em',
                           fontVariantNumeric: 'tabular-nums' }}>+9</span>
            <span style={{ fontSize: 18, fontWeight: 700, opacity: .85 }}>XP</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, display: 'flex',
                        flexDirection: 'column', gap: 4, opacity: .95 }}>
            <Row label="เช็คอินรายวัน"    v="+6 XP"/>
            <Row label="โบนัสนกเช้า 🌅"    v="+3 XP"/>
          </div>
        </div>
      </div>

      {/* side-by-side coin + streak */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 14, padding: 14, textAlign: 'center',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                        background: tokens.rpSoft, color: tokens.rp,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={icons.coin} size={22}/>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: tokens.ink,
                        fontVariantNumeric: 'tabular-nums' }}>+1</div>
          <div style={{ fontSize: 11, color: tokens.inkMuted, fontWeight: 600, marginTop: 2 }}>Coin</div>
        </div>
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 14, padding: 14, textAlign: 'center',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                        background: 'hsl(25 95% 53% / 0.12)', color: tokens.flame,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'flame-flicker 1.8s ease-in-out infinite' }}>
            <Icon d={icons.flame} size={22} fill="currentColor" stroke={0}/>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: tokens.ink,
                        fontVariantNumeric: 'tabular-nums' }}>3 วัน</div>
          <div style={{ fontSize: 11, color: tokens.inkMuted, fontWeight: 600, marginTop: 2 }}>สตรีคต่อเนื่อง</div>
        </div>
      </div>

      {/* quests advanced */}
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ color: tokens.orange, display: 'flex' }}>
            <Icon d={icons.target} size={14}/>
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink }}>เควสอัพเดท</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
          <span style={{ width: 24, height: 24, borderRadius: 9999,
                         background: tokens.success, color: '#fff',
                         display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={icons.check} size={14} stroke={3.5}/>
          </span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: tokens.ink }}>
            Come In Today
          </span>
          <RewardChip kind="xp" value={3}/>
        </div>
        <div style={{ height: 1, background: tokens.borderSoft, margin: '4px 0' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
          <span style={{ width: 24, height: 24, borderRadius: 9999,
                         background: tokens.cardSubtle, color: tokens.orange,
                         border: `2px solid ${tokens.orange}`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontSize: 10, fontWeight: 800 }}>
            1/2
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>Two-Day Momentum</div>
            <div style={{ marginTop: 4, height: 3, background: tokens.cardSubtle,
                          borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ width: '50%', height: '100%', background: tokens.orange }}/>
            </div>
          </div>
        </div>
      </Card>

      <Button variant="primary" size="lg" onClick={onDone} style={{ fontWeight: 800, marginTop: 2 }}>
        กลับหน้าหลัก
      </Button>
      <button onClick={onDone} style={{
        background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit',
        color: tokens.inkMuted, fontSize: 12, fontWeight: 600, marginTop: -4,
      }}>
        แชร์ความสำเร็จ →
      </button>
    </div>
  );
};

const Row = ({ label, v }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0 }}>{v}</span>
  </div>
);

/* ============================================================================
 *  CLASS DETAIL — book / cancel, coach, capacity, what to bring
 * ========================================================================== */
const ClassDetailScreen = ({ onBack }) => {
  const [booked, setBooked] = useStateF(false);
  const filled = 17, total = 20;
  const pct = (filled / total) * 100;

  return (
    <div style={{ background: tokens.bg, minHeight: '100%', paddingBottom: 100 }}>
      {/* Hero image */}
      <div style={{
        height: 220, position: 'relative',
        background: `linear-gradient(135deg, hsl(25 95% 55%), hsl(340 70% 55%))`,
        overflow: 'hidden',
      }}>
        {/* abstract overlay */}
        <svg width="100%" height="100%" viewBox="0 0 390 220" preserveAspectRatio="xMidYMid slice"
             style={{ position: 'absolute', inset: 0, opacity: .35 }}>
          <circle cx="80" cy="40" r="120" fill="#fff" opacity=".15"/>
          <circle cx="330" cy="200" r="160" fill="hsl(38 92% 50%)" opacity=".4"/>
          <circle cx="200" cy="110" r="60" fill="#fff" opacity=".1"/>
        </svg>

        {/* back */}
        <button onClick={onBack} style={{
          position: 'absolute', top: 14, left: 14, width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,.35)', color: '#fff', border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}>
          <Icon d={icons.x} size={18} stroke={2.5}/>
        </button>
        <button style={{
          position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,.35)', color: '#fff', border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}>
          <Icon d={icons.share} size={16} stroke={2.2}/>
        </button>

        {/* category pill */}
        <div style={{ position: 'absolute', left: 16, bottom: 16 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 9999,
            background: 'rgba(255,255,255,0.25)', color: '#fff',
            fontSize: 11, fontWeight: 800, backdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
          }}>
            <Icon d={icons.flame} size={11} fill="currentColor" stroke={0}/>
            HIIT · High Intensity
          </span>
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 9999,
            background: 'rgba(0,0,0,0.35)', color: '#fff',
            fontSize: 11, fontWeight: 700, backdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
          }}>
            <Icon d={icons.bolt} size={11} fill="currentColor" stroke={0}/>
            +8 XP
          </span>
        </div>
      </div>

      {/* Body — pulled up card */}
      <div style={{ padding: '16px', marginTop: -14, position: 'relative' }}>
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 16, padding: 16,
          boxShadow: '0 2px 8px hsl(220 20% 8% / 0.05)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.inkMuted,
                        letterSpacing: '.06em', textTransform: 'uppercase' }}>
            อังคาร · 22 เม.ย.
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900,
                       color: tokens.ink, letterSpacing: '-.02em' }}>
            HIIT Express · 30 นาที
          </h2>

          {/* info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
            <InfoStat icon={icons.clock}  label="เวลา"  value="12:00"/>
            <InfoStat icon={icons.target} label="ห้อง"  value="ห้อง A"/>
            <InfoStat icon={icons.users}  label="ระดับ" value="กลาง"/>
          </div>
        </div>

        {/* Coach */}
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 14, padding: 14, marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `linear-gradient(135deg, hsl(200 60% 55%), hsl(200 60% 40%))`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, letterSpacing: '.02em',
          }}>BT</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: tokens.ink }}>Coach Best</div>
            <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 2 }}>
              HIIT Specialist · 6 ปี ประสบการณ์
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ color: n <= 4 ? tokens.rp : tokens.borderSoft,
                                       display: 'flex' }}>
                  <Icon d={icons.trophy} size={10} fill="currentColor" stroke={0}/>
                </span>
              ))}
              <span style={{ fontSize: 10, color: tokens.inkMuted, marginLeft: 4,
                             fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                             whiteSpace: 'nowrap' }}>
                4.9 · 218 รีวิว
              </span>
            </div>
          </div>
          <button style={{
            background: tokens.orangeSoft, color: tokens.orange, border: 0,
            padding: '6px 10px', borderRadius: 9999, cursor: 'pointer',
            fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>ดูโปรไฟล์</button>
        </div>

        {/* Capacity */}
        <div style={{
          background: tokens.card, border: `1px solid ${tokens.border}`,
          borderRadius: 14, padding: 14, marginTop: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink }}>ความจุคลาส</div>
            <span style={{ fontSize: 12, fontWeight: 800, color: tokens.ink,
                           fontVariantNumeric: 'tabular-nums' }}>
              {filled}<span style={{ color: tokens.inkMuted, fontWeight: 500 }}>/{total}</span>
            </span>
          </div>
          <div style={{ height: 6, background: tokens.cardSubtle, borderRadius: 9999,
                        overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%',
                          background: pct > 80 ? tokens.warning : tokens.success }}/>
          </div>
          <div style={{ display: 'flex', marginTop: 10 }}>
            {['BT','PC','AS','MK','EV'].map((initials, i) => {
              const colors = ['hsl(200 60% 55%)','hsl(340 70% 60%)','hsl(150 50% 50%)','hsl(270 60% 60%)','hsl(25 95% 55%)'];
              return (
                <div key={i} style={{
                  width: 26, height: 26, borderRadius: '50%', background: colors[i],
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, marginLeft: i ? -8 : 0,
                  border: `2px solid ${tokens.card}`,
                }}>{initials}</div>
              );
            })}
            <span style={{ marginLeft: 8, fontSize: 11, color: tokens.inkMuted,
                           display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              + เพื่อน 3 คนในคลาสนี้
            </span>
          </div>
        </div>

        {/* What to bring / description */}
        <Card padding={14} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink, marginBottom: 8 }}>
            เกี่ยวกับคลาส
          </div>
          <div style={{ fontSize: 12, color: tokens.inkSecondary, lineHeight: 1.55 }}>
            คลาส HIIT ความเข้มสูง 30 นาที เน้น full-body cardio + core ผสมผสาน bodyweight
            และ dumbbell เหมาะสำหรับทุกระดับ ใช้กำลัง 80% ของความสามารถสูงสุด
          </div>
          <div style={{ marginTop: 12, padding: 10,
                        background: tokens.orangeSoft, border: `1px solid ${tokens.orangeBorder}`,
                        borderRadius: 10, fontSize: 11, color: tokens.inkSecondary,
                        display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon d={icons.droplet} size={14}/>
            <span>เตรียม: ขวดน้ำ, ผ้าเช็ดหน้า, รองเท้าผ้าใบ</span>
          </div>
        </Card>

        {/* Policy */}
        <div style={{ marginTop: 12, fontSize: 11, color: tokens.inkMuted, lineHeight: 1.55,
                      padding: '0 4px' }}>
          <strong style={{ color: tokens.inkSecondary }}>นโยบายการยกเลิก:</strong>
          {' '}ยกเลิกได้ก่อนเริ่มคลาส 4 ชั่วโมงโดยไม่เสียค่าธรรมเนียม
        </div>
      </div>

      {/* Sticky footer CTA */}
      <div style={{
        position: 'absolute', bottom: 76, left: 0, right: 0,
        padding: '12px 16px',
        background: `linear-gradient(180deg, transparent, ${tokens.bg} 25%, ${tokens.bg})`,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: tokens.inkMuted, fontWeight: 600 }}>
            {booked ? 'คุณได้จองแล้ว' : 'ต้นทุน'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: tokens.ink,
                        fontVariantNumeric: 'tabular-nums' }}>
            {booked ? '22 เม.ย. · 12:00' : '1 เซสชั่น'}
          </div>
        </div>
        <Button
          variant={booked ? 'outline' : 'primary'} size="lg"
          onClick={() => setBooked(b => !b)}
          style={{ flex: 1.2, fontWeight: 800,
                   background: booked ? tokens.card : tokens.orange,
                   color: booked ? tokens.danger : '#fff' }}
        >
          {booked ? 'ยกเลิกการจอง' : 'จองคลาสนี้'}
        </Button>
      </div>
    </div>
  );
};

const InfoStat = ({ icon, label, value }) => (
  <div style={{
    background: tokens.cardSubtle, borderRadius: 10, padding: '10px 8px', textAlign: 'center',
  }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                  background: tokens.orangeSoft, color: tokens.orange,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon d={icon} size={14}/>
    </div>
    <div style={{ fontSize: 12, fontWeight: 800, color: tokens.ink }}>{value}</div>
    <div style={{ fontSize: 9, color: tokens.inkMuted, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 1 }}>{label}</div>
  </div>
);

/* ============================================================================
 *  REWARD REDEMPTION FLOW — confirm → voucher
 * ========================================================================== */
const RewardRedeemScreen = ({ onBack }) => {
  const [step, setStep] = useStateF('confirm'); // confirm | voucher
  const reward = {
    name: 'โปรตีนเชคฟรี',
    cost: 500,
    emoji: '🥤',
    description: 'แลกฟรีที่เคาน์เตอร์ ได้ทุกรสชาติ (whey, vegan, หรือ recovery)',
    terms: ['ใช้ได้ภายใน 30 วัน','1 สิทธิ์ต่อการแลก','แสดงโค้ดก่อนชำระ','ไม่สามารถแลกเป็นเงินสด'],
  };

  if (step === 'voucher') {
    return <VoucherView reward={reward} onDone={onBack}/>;
  }

  return (
    <div style={{ padding: 16, background: tokens.bg, minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, background: tokens.card,
          border: `1px solid ${tokens.border}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: tokens.ink,
        }}>
          <Icon d={icons.x} size={16} stroke={2.5}/>
        </button>
        <div style={{ fontSize: 18, fontWeight: 800, color: tokens.ink }}>ยืนยันการแลก</div>
      </div>

      {/* Big reward card */}
      <div style={{
        background: `linear-gradient(160deg, hsl(38 92% 55%), hsl(25 95% 50%))`,
        borderRadius: 20, padding: 24, color: '#fff',
        boxShadow: '0 16px 36px -8px hsl(25 95% 53% / 0.4)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative coins */}
        {[20,140,280,320,60].map((l,i) => (
          <span key={i} style={{
            position: 'absolute', top: 20 + (i*20) % 150, left: `${l % 350}px`,
            color: 'rgba(255,255,255,.2)', fontSize: 14, pointerEvents: 'none',
          }}>
            <Icon d={icons.coin} size={16 + (i%3)*4}/>
          </span>
        ))}
        <div style={{ fontSize: 64, lineHeight: 1, position: 'relative' }}>{reward.emoji}</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 10, letterSpacing: '-.01em',
                      position: 'relative' }}>{reward.name}</div>
        <div style={{ fontSize: 12, opacity: .9, marginTop: 6, lineHeight: 1.5,
                      position: 'relative', maxWidth: 260, margin: '6px auto 0' }}>
          {reward.description}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
          padding: '8px 14px', borderRadius: 9999,
          background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)',
          position: 'relative', whiteSpace: 'nowrap',
        }}>
          <Icon d={icons.coin} size={14}/>
          <span style={{ fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {reward.cost} Coins
          </span>
        </div>
      </div>

      {/* Wallet before/after */}
      <div style={{
        background: tokens.card, border: `1px solid ${tokens.border}`,
        borderRadius: 14, padding: 14, marginTop: 16,
      }}>
        <Eyebrow>กระเป๋าของคุณ</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: tokens.ink,
                          fontVariantNumeric: 'tabular-nums' }}>628</div>
            <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>ตอนนี้</div>
          </div>
          <span style={{ color: tokens.inkFaint, display: 'flex' }}>
            <Icon d={icons.arrow} size={16}/>
          </span>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: tokens.orange,
                          fontVariantNumeric: 'tabular-nums' }}>128</div>
            <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 2 }}>หลังแลก</div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div style={{
        background: tokens.card, border: `1px solid ${tokens.border}`,
        borderRadius: 14, padding: 14, marginTop: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink, marginBottom: 8 }}>
          เงื่อนไขการใช้
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none',
                     display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reward.terms.map((t, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8,
                                 fontSize: 12, color: tokens.inkSecondary, lineHeight: 1.4 }}>
              <span style={{ color: tokens.success, flexShrink: 0, marginTop: 2 }}>
                <Icon d={icons.check} size={12} stroke={3}/>
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 76, left: 0, right: 0,
        padding: '12px 16px',
        background: `linear-gradient(180deg, transparent, ${tokens.bg} 25%, ${tokens.bg})`,
        display: 'flex', gap: 10,
      }}>
        <Button variant="outline" size="lg" onClick={onBack} style={{ flex: 1 }}>
          ยกเลิก
        </Button>
        <Button variant="primary" size="lg" onClick={() => setStep('voucher')}
                style={{ flex: 1.6, fontWeight: 800 }}>
          ยืนยัน · ใช้ {reward.cost} Coin
        </Button>
      </div>
    </div>
  );
};

const VoucherView = ({ reward, onDone }) => {
  /* QR pattern — deterministic random dots */
  const cells = React.useMemo(() => {
    const arr = [];
    const n = 21;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        /* finder squares in corners */
        const isFinder = (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
        if (isFinder) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6 ||
                          (r < 7 && (r === 0 || r === 6) ) ;
          const fr = r < 7 ? r : (r - (n - 7));
          const fc = c < 7 && r < 7 ? c : c < 7 ? c : (c - (n - 7));
          const onOuter = (fr === 0 || fr === 6 || fc === 0 || fc === 6);
          const onInner = (fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4);
          arr.push(onOuter || onInner ? 1 : 0);
        } else {
          const seed = (r * 73 + c * 31 + r * c) % 7;
          arr.push(seed < 3 ? 1 : 0);
        }
      }
    }
    return arr;
  }, []);

  return (
    <div style={{ padding: 16, background: tokens.bg, minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ textAlign: 'center', padding: '8px 0 14px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 10px',
          background: `radial-gradient(circle at 30% 30%, hsl(152 55% 52%), hsl(152 55% 38%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          boxShadow: '0 10px 24px -6px hsl(152 55% 42% / 0.5)',
        }}>
          <Icon d={icons.check} size={30} stroke={3.5}/>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: tokens.ink, letterSpacing: '-.01em' }}>
          แลกสำเร็จ!
        </div>
        <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 2 }}>
          แสดงบัตรนี้ที่เคาน์เตอร์เพื่อรับของรางวัล
        </div>
      </div>

      {/* Ticket — QR on top, perforated divider, details below */}
      <div style={{
        background: tokens.card, border: `1px solid ${tokens.border}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 12px 32px -8px hsl(220 20% 8% / 0.15)',
        position: 'relative',
      }}>
        {/* header stripe */}
        <div style={{
          background: tokens.orange, padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '.04em' }}>MOOM</span>
            <span style={{ fontSize: 9, opacity: .9, fontWeight: 700, letterSpacing: '.05em' }}>VOUCHER</span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 9999,
            background: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>ใช้งานได้</span>
        </div>

        {/* QR */}
        <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: 12, background: '#fff',
            borderRadius: 12, border: `1px solid ${tokens.border}`,
          }}>
            <div style={{ width: 168, height: 168, display: 'grid',
                          gridTemplateColumns: 'repeat(21, 1fr)', gap: 1 }}>
              {cells.map((v, i) => (
                <div key={i} style={{ background: v ? tokens.ink : '#fff', borderRadius: 0.5 }}/>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, fontFamily: 'ui-monospace, monospace',
                        fontSize: 14, fontWeight: 700, color: tokens.ink,
                        letterSpacing: '.15em' }}>
            MOOM-5832-9104
          </div>
          <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 4 }}>
            รหัสบัตร
          </div>
        </div>

        {/* Perforation */}
        <div style={{ position: 'relative', height: 12 }}>
          <div style={{ position: 'absolute', left: -6, top: 0, width: 12, height: 12,
                        borderRadius: '50%', background: tokens.bg }}/>
          <div style={{ position: 'absolute', right: -6, top: 0, width: 12, height: 12,
                        borderRadius: '50%', background: tokens.bg }}/>
          <div style={{ position: 'absolute', left: 16, right: 16, top: '50%',
                        borderTop: `2px dashed ${tokens.border}` }}/>
        </div>

        {/* Details */}
        <div style={{ padding: '14px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 42, lineHeight: 1 }}>{reward.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: tokens.ink }}>
                {reward.name}
              </div>
              <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 2 }}>
                ใช้ได้ทุกสาขา · หมดอายุ 19 พ.ค. 2026
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: tokens.borderSoft, margin: '14px 0' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <VoucherStat label="ใช้แล้ว"   value="-500 Coin"/>
            <VoucherStat label="คงเหลือ"   value="128 Coin"/>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="outline" size="md" icon={icons.share} style={{ flex: 1 }}>
          บันทึก
        </Button>
        <Button variant="outline" size="md" icon={icons.copy} style={{ flex: 1 }}>
          คัดลอกรหัส
        </Button>
      </div>

      <Button variant="primary" size="lg" onClick={onDone}
              style={{ width: '100%', marginTop: 10, fontWeight: 800 }}>
        เสร็จสิ้น
      </Button>
    </div>
  );
};

const VoucherStat = ({ label, value }) => (
  <div style={{
    background: tokens.cardSubtle, borderRadius: 10, padding: '8px 10px',
  }}>
    <div style={{ fontSize: 10, color: tokens.inkMuted, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 800, color: tokens.ink, marginTop: 2,
                  fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

Object.assign(window, { CheckinFlow, ClassDetailScreen, RewardRedeemScreen });
