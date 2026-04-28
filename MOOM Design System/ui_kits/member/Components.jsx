/* MOOM Member — feature components (grounded in /bestspang/mmember) */
const { useState: useStateC } = React;

/* ============================================================================
 *  TIER BADGE — compact pill with SVG shield emblem + label + level
 *  Variants:
 *    - momentum (solid color ring, shield emblem)
 *    - status   (emoji medal, rewards program)
 * ========================================================================== */
const TierEmblem = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2L4 8v8c0 7.2 5.1 13.2 12 15 6.9-1.8 12-7.8 12-15V8L16 2z"
          fill={color} stroke={color} strokeOpacity="0.5" strokeWidth="0.5"/>
    <path d="M16 9l2 4 4.5.7-3.2 3.2.8 4.5L16 19.2 11.9 21.4l.8-4.5-3.2-3.2L14 13l2-4z"
          fill="white" fillOpacity="0.92"/>
  </svg>
);

const MomentumTierBadge = ({ tier = 'starter', level, size = 'sm', dark = false }) => {
  const t = MOMENTUM_TIERS[tier];
  const dims = {
    sm: { px: 10, py: 4, fs: 11, emDim: 14, lvlFs: 9, lvlMin: 18 },
    md: { px: 12, py: 6, fs: 12, emDim: 18, lvlFs: 10, lvlMin: 22 },
  }[size];
  /* On dark/orange bg (inside momentum card), invert: white pill, orange text */
  const bg = dark ? 'rgba(255,255,255,0.92)' : `${t.color.replace(')', ' / 0.15)')}`;
  const fg = dark ? tokens.orange : t.color;
  const lvlBg = dark ? 'hsl(25 95% 53% / 0.15)' : `${t.color.replace(')', ' / 0.22)')}`;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: `${dims.py}px ${dims.px}px`, borderRadius: 9999,
      background: bg, color: fg,
      fontWeight: 800, fontSize: dims.fs, letterSpacing: '.01em',
    }}>
      <TierEmblem color={dark ? tokens.orange : t.color} size={dims.emDim}/>
      {t.label}
      {level !== undefined && (
        <span style={{
          minWidth: dims.lvlMin, textAlign: 'center',
          padding: '2px 6px', borderRadius: 9999, background: lvlBg,
          fontSize: dims.lvlFs, fontWeight: 900,
        }}>{level}</span>
      )}
    </span>
  );
};

const StatusTierBadge = ({ tier = 'bronze', size = 'sm' }) => {
  const t = STATUS_TIERS[tier];
  const dims = {
    sm: { px: 10, py: 4, fs: 11 },
    md: { px: 12, py: 6, fs: 12 },
  }[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${dims.py}px ${dims.px}px`, borderRadius: 9999,
      background: t.bg, color: t.color, fontWeight: 800, fontSize: dims.fs,
    }}>
      <span style={{ fontSize: dims.fs + 2, lineHeight: 1 }}>{t.emoji}</span>
      {t.label}
    </span>
  );
};

/* ============================================================================
 *  XP PROGRESS BAR — solid fill, level chips on each end
 * ========================================================================== */
const XPProgressBar = ({ xpInLevel = 0, xpNeeded = 100, level = 1, onDark = false }) => {
  const pct = Math.min(100, (xpInLevel / xpNeeded) * 100);
  const barBg    = onDark ? 'rgba(255,255,255,0.25)' : 'hsl(30 12% 93%)';
  const barFill  = onDark ? '#fff'                   : tokens.xp;
  const chipBg   = onDark ? 'rgba(255,255,255,0.2)'  : 'hsl(25 95% 53% / 0.15)';
  const chipFg   = onDark ? '#fff'                   : tokens.xp;
  const labelFg  = onDark ? 'rgba(255,255,255,0.85)' : tokens.inkMuted;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 10, fontWeight: 600, color: labelFg, marginBottom: 6 }}>
        <span>{xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP to Lv{level + 1}</span>
      </div>
      <div style={{ height: 10, background: barBg, borderRadius: 9999, overflow: 'hidden', position:'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: barFill, borderRadius: 9999, transition: 'width .7s ease-out',
        }}/>
      </div>
    </div>
  );
};

/* ============================================================================
 *  STREAK FLAME — streak count + weekly dot grid (M T W T F S S)
 *  onDark: renders on orange momentum card (white dots)
 * ========================================================================== */
const StreakFlame = ({ weeks = 0, weeklyDays = [], onDark = false, variant = 'flame' }) => {
  const DAYS = ['M','T','W','T','F','S','S'];
  const active = weeks > 0;
  const flameColor = onDark ? '#fff' : (active ? tokens.flame : tokens.inkFaint);
  const dotOn  = onDark ? '#fff' : tokens.flame;
  const dotOff = onDark ? 'rgba(255,255,255,0.3)' : tokens.border;
  const labelFg = onDark ? 'rgba(255,255,255,0.85)' : tokens.inkMuted;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: flameColor, display: 'flex' }}>
          <Icon d={variant === 'droplet' ? icons.droplet : icons.flame} size={18}
                fill={active ? 'currentColor' : 'none'} stroke={2}/>
        </span>
        <span style={{
          fontSize: 14, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          color: onDark ? '#fff' : tokens.ink,
        }}>{weeks} wk</span>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {DAYS.map((d, i) => {
          const on = weeklyDays.includes(i + 1);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 9999,
                background: on ? dotOn : dotOff,
                boxShadow: on && onDark ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
                transition: 'all .3s',
              }}/>
              <span style={{ fontSize: 8, color: labelFg, fontWeight: 600, lineHeight: 1 }}>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 *  MOMENTUM CARD (the big orange hero)
 *  Real pattern from MomentumCard.tsx: solid primary bg, tier pill + RP coin
 *  chip top, XP bar middle, streak + total XP bottom — all on orange.
 * ========================================================================== */
const MomentumCard = ({
  tier = 'starter', statusTier = 'bronze', level = 1,
  xpInLevel = 0, xpNeeded = 100, totalXp = 0, rp = 0,
  streakWeeks = 0, weeklyDays = [],
}) => (
  <div style={{
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 8px 24px -4px hsl(25 95% 53% / 0.25)',
    background: tokens.orange,
  }}>
    {/* Header — tier pills + reward counts */}
    <div style={{ padding: '14px 16px 16px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <MomentumTierBadge tier={tier} level={level} size="sm" dark/>
          <StatusTierBadge tier={statusTier} size="sm"/>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '4px 10px', borderRadius: 9999,
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontWeight: 800, fontSize: 11,
          }}>
            <Icon d={icons.bolt} size={11} fill="currentColor" stroke={0}/> {totalXp.toLocaleString()}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '4px 10px', borderRadius: 9999,
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontWeight: 800, fontSize: 11,
          }}>
            <Icon d={icons.coin} size={11} stroke={2.2}/> {rp.toLocaleString()}
          </span>
        </div>
      </div>

      <XPProgressBar xpInLevel={xpInLevel} xpNeeded={xpNeeded} level={level} onDark/>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <StreakFlame weeks={streakWeeks} weeklyDays={weeklyDays} onDark variant="droplet"/>
        <button style={{
          background: 'none', border: 0, color: '#fff', fontFamily: 'inherit',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 2, opacity: 0.9,
        }}>ดูทั้งหมด<Icon d={icons.chevR} size={12} stroke={2.5}/></button>
      </div>
    </div>
  </div>
);

/* ============================================================================
 *  QUEST ROW — flat list item (not a card). Icon + title + reward chips + thin bar.
 *  Real pattern: left accent bar, icon square, progress chip right, thin full-width bar below.
 * ========================================================================== */
const QuestRow = ({ title, progress = 0, target = 1, xp, rp, weekly = false, done = false }) => {
  const pct = Math.min(100, (progress / target) * 100);
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: tokens.ink,
            textDecoration: done ? 'line-through' : 'none',
            opacity: done ? 0.55 : 1,
          }}>{title}</span>
          {weekly && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 9999,
              background: 'hsl(210 70% 55% / 0.1)', color: tokens.info,
            }}>รายสัปดาห์</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(xp || rp) && (
            <div style={{ display: 'flex', gap: 4 }}>
              {xp && <RewardChip kind="xp" value={xp} size="sm"/>}
              {rp && <RewardChip kind="rp" value={rp} size="sm"/>}
            </div>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: tokens.inkMuted,
                         fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>
            {progress}/{target}
          </span>
        </div>
      </div>
      <div style={{ height: 3, background: 'hsl(30 12% 93%)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: done ? tokens.success : tokens.orange,
          borderRadius: 9999, transition: 'width .5s ease-out',
        }}/>
      </div>
    </div>
  );
};

/* ============================================================================
 *  CLASS CARD — schedule row
 * ========================================================================== */
const ClassCard = ({ time = '07:00', duration = 60, title, coach, filled = 0, total = 20, booked = false, onToggle }) => {
  const pct = (filled / total) * 100;
  const full = filled >= total;
  return (
    <div style={{
      background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 12,
      padding: 12, display: 'flex', gap: 12, alignItems: 'center',
      boxShadow: '0 1px 3px hsl(220 20% 8% / 0.04)',
    }}>
      <div style={{ width: 52, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: tokens.ink }}>{time}</div>
        <div style={{ fontSize: 10, color: tokens.inkMuted, marginTop: 1 }}>{duration} min</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 2 }}>{coach}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <div style={{ flex: 1, height: 3, background: 'hsl(30 12% 93%)', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%',
                          background: full ? tokens.danger : pct > 70 ? tokens.warning : tokens.success }}/>
          </div>
          <span style={{ fontSize: 10, color: tokens.inkMuted, fontVariantNumeric: 'tabular-nums' }}>{filled}/{total}</span>
        </div>
      </div>
      <Button variant={booked ? 'tintedOrange' : full ? 'outline' : 'primary'}
              size="sm" onClick={onToggle} disabled={full && !booked}>
        {booked ? 'จองแล้ว' : full ? 'เต็ม' : 'จอง'}
      </Button>
    </div>
  );
};

/* ============================================================================
 *  TOP BAR — MOOM logo + bell + avatar (matches screenshot)
 * ========================================================================== */
const TopBar = ({ name = 'KS', unread = 0 }) => (
  <div style={{
    height: 52, background: tokens.card,
    borderBottom: `1px solid ${tokens.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', position: 'sticky', top: 0, zIndex: 10,
  }}>
    <div style={{ fontSize: 20, fontWeight: 900, color: tokens.orange, letterSpacing: '.02em' }}>MOOM</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button style={{
        width: 36, height: 36, border: 0, background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.ink,
        position: 'relative',
      }}>
        <Icon d={icons.bell} size={20} stroke={2}/>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8,
                         width: 8, height: 8, borderRadius: 9999, background: tokens.orange }}/>
        )}
      </button>
      <div style={{
        width: 34, height: 34, borderRadius: 9999, background: tokens.cream,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: tokens.ink, letterSpacing: '.02em',
      }}>{name}</div>
    </div>
  </div>
);

/* ============================================================================
 *  BOTTOM NAV — 5 slots w/ central FAB (check-in scanner)
 *  Labels are TH to match the live build the user is on
 * ========================================================================== */
const BottomNav = ({ screen, onChange }) => {
  const items = [
    { id: 'home',     label: 'หน้าหลัก', d: icons.home },
    { id: 'schedule', label: 'ตาราง',   d: icons.cal },
    { id: 'checkin',  label: 'เช็คอิน',  d: icons.scan, fab: true },
    { id: 'rewards',  label: 'รางวัล',   d: icons.gift },
    { id: 'profile',  label: 'โปรไฟล์',  d: icons.user },
  ];
  return (
    <div style={{
      height: 76, background: tokens.card, borderTop: `1px solid ${tokens.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      padding: '0 4px 12px', position: 'sticky', bottom: 0, zIndex: 20,
    }}>
      {items.map(it => {
        const active = screen === it.id;
        if (it.fab) {
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{
              marginTop: -20, width: 56, height: 56, borderRadius: '50%',
              background: tokens.orange, color: '#fff', border: '3px solid #fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 0,
              boxShadow: '0 6px 18px hsl(25 95% 53% / 0.45)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Icon d={it.d} size={22} stroke={2.4}/>
            </button>
          );
        }
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            background: 'transparent', border: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, padding: '6px 8px', cursor: 'pointer',
            color: active ? tokens.orange : tokens.inkMuted, flex: 1, fontFamily: 'inherit',
          }}>
            <Icon d={it.d} size={20} stroke={active ? 2.5 : 2}/>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================================
 *  QR SCANNER — full-screen check-in
 * ========================================================================== */
const QRScanner = () => (
  <div style={{ padding: 16 }}>
    <div style={{ background: tokens.ink, borderRadius: 16, aspectRatio: '1/1',
                  position: 'relative', overflow: 'hidden' }}>
      {[[0,0],[1,0],[0,1],[1,1]].map(([x,y], i) => (
        <div key={i} style={{ position: 'absolute',
          [x ? 'right' : 'left']: 20, [y ? 'bottom' : 'top']: 20,
          width: 32, height: 32,
          borderTop:    !y ? `3px solid ${tokens.orange}` : 'none',
          borderBottom: y  ? `3px solid ${tokens.orange}` : 'none',
          borderLeft:   !x ? `3px solid ${tokens.orange}` : 'none',
          borderRight:  x  ? `3px solid ${tokens.orange}` : 'none',
          borderRadius: 4,
        }}/>
      ))}
      <div style={{ position: 'absolute', left: 40, right: 40, height: 2,
                    background: `linear-gradient(90deg, transparent, ${tokens.orange}, transparent)`,
                    boxShadow: `0 0 12px ${tokens.orange}`,
                    animation: 'scan 2.5s ease-in-out infinite', top: '50%' }}/>
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center',
                    color: '#fff', fontSize: 12, opacity: .8 }}>
        สแกน QR ที่หน้าเคาน์เตอร์เพื่อเช็คอิน
      </div>
    </div>
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: tokens.ink }}>เช็คอินเพื่อรับ XP</div>
      <div style={{ display: 'inline-flex', gap: 6, marginTop: 8 }}>
        <RewardChip kind="xp" value={6} size="md"/>
        <RewardChip kind="rp" value={1} size="md"/>
      </div>
      <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 8 }}>
        +6 XP โบนัสเช็คอิน · +1 Coin · รักษาสตรีคประจำสัปดาห์ 🔥
      </div>
    </div>
  </div>
);

Object.assign(window, {
  MomentumTierBadge, StatusTierBadge, TierEmblem,
  XPProgressBar, StreakFlame, MomentumCard, QuestRow,
  ClassCard, TopBar, BottomNav, QRScanner,
});
