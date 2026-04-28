/* MOOM Member — design tokens (grounded in github.com/bestspang/mmember) */
const { useState } = React;

const tokens = {
  /* Brand */
  orange:        'hsl(25 95% 53%)',
  orangeHover:   'hsl(25 95% 48%)',
  orangeSoft:    'hsl(25 95% 53% / 0.08)',
  orangeTint:    'hsl(25 40% 95%)',
  orangeBorder:  'hsl(25 95% 53% / 0.2)',

  /* Surfaces */
  bg:            'hsl(30 10% 98%)',     /* warm off-white page bg */
  card:          'hsl(0 0% 100%)',
  cardSubtle:    'hsl(30 12% 96%)',     /* sunken */
  cream:         'hsl(30 12% 93%)',     /* secondary / muted surface */
  muted:         'hsl(30 8% 95%)',
  border:        'hsl(30 10% 89%)',
  borderSoft:    'hsl(30 10% 93%)',

  /* Text */
  ink:           'hsl(220 20% 8%)',     /* deep blue-black — primary text */
  inkSecondary:  'hsl(220 15% 25%)',
  inkMuted:      'hsl(220 10% 46%)',
  inkFaint:      'hsl(220 10% 62%)',

  /* Status */
  success:       'hsl(152 55% 42%)',
  successSoft:   'hsl(152 55% 42% / 0.12)',
  successTint:   'hsl(152 55% 96%)',
  warning:       'hsl(38 92% 50%)',
  warningSoft:   'hsl(38 92% 50% / 0.12)',
  danger:        'hsl(0 65% 52%)',
  info:          'hsl(210 70% 55%)',

  /* Gamification */
  xp:            'hsl(25 95% 53%)',
  xpGlow:        'hsl(32 95% 58%)',
  rp:            'hsl(38 92% 50%)',     /* coin gold */
  rpSoft:        'hsl(38 92% 50% / 0.12)',
  flame:         'hsl(25 95% 53%)',
  flameGlow:     'hsl(38 92% 50%)',
};

/* Momentum tier ladder (matches repo TIER_CONFIG) */
const MOMENTUM_TIERS = {
  starter:   { label: 'Starter',   color: 'hsl(220 10% 60%)', minLevel: 1  },
  regular:   { label: 'Regular',   color: 'hsl(25 80% 50%)',  minLevel: 10 },
  dedicated: { label: 'Dedicated', color: 'hsl(210 70% 55%)', minLevel: 20 },
  elite:     { label: 'Elite',     color: 'hsl(280 65% 55%)', minLevel: 30 },
  champion:  { label: 'Champion',  color: 'hsl(38 92% 50%)',  minLevel: 40 },
  legend:    { label: 'Legend',    color: 'hsl(45 93% 47%)',  minLevel: 50 },
};

/* Status (rewards) tier ladder — separate from Momentum */
const STATUS_TIERS = {
  bronze:   { label: 'บรอนซ์',   en: 'Bronze',   emoji: '🥉', color: 'hsl(30 50% 45%)',  bg: 'hsl(30 50% 45% / 0.15)' },
  silver:   { label: 'ซิลเวอร์', en: 'Silver',   emoji: '🥈', color: 'hsl(210 10% 55%)', bg: 'hsl(210 10% 65% / 0.18)' },
  gold:     { label: 'โกลด์',    en: 'Gold',     emoji: '🥇', color: 'hsl(45 85% 42%)',  bg: 'hsl(45 85% 50% / 0.18)' },
  platinum: { label: 'แพลทินัม', en: 'Platinum', emoji: '💠', color: 'hsl(200 30% 45%)', bg: 'hsl(200 15% 75% / 0.22)' },
  diamond:  { label: 'ไดมอนด์',  en: 'Diamond',  emoji: '💎', color: 'hsl(195 80% 40%)', bg: 'hsl(195 80% 65% / 0.2)' },
  black:    { label: 'แบล็ก',   en: 'Black',    emoji: '🖤', color: 'hsl(220 20% 15%)', bg: 'hsl(220 20% 15% / 0.12)' },
};

/* ============================================================================
 *  ICONS — Lucide-style inline SVG
 * ========================================================================== */
const Icon = ({ d, size = 20, stroke = 2, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>{d}</svg>
);
const icons = {
  home:       <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  cal:        <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  calCheck:   <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></>,
  scan:       <><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
  qr:         <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M20 14v7M14 20h3"/></>,
  gift:       <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,
  user:       <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  users:      <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  bolt:       <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  check:      <><polyline points="20 6 9 17 4 12"/></>,
  checkCirc:  <><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></>,
  chevR:      <><polyline points="9 18 15 12 9 6"/></>,
  bell:       <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  trophy:     <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 4h3v3a3 3 0 01-3 3M7 4H4v3a3 3 0 003 3"/></>,
  target:     <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  clock:      <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  sparkles:   <><path d="M12 2v4M12 14v8M3 13h4M17 13h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></>,
  flame:      <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
  droplet:    <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></>,
  lock:       <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  shield:     <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  medal:      <><path d="M7 10.5l-3-7h4l3 7M17 10.5l3-7h-4l-3 7"/><circle cx="12" cy="17" r="5"/></>,
  share:      <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>,
  copy:       <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  coin:       <><circle cx="12" cy="12" r="10"/><path d="M12 7v10M9 9.5C9 8.1 10.3 7 12 7s3 1.1 3 2.5S13.7 12 12 12s-3 1.1-3 2.5S10.3 17 12 17s3-1.1 3-2.5"/></>,
  x:          <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  arrow:      <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  chevDown:   <><polyline points="6 9 12 15 18 9"/></>,
};

/* ============================================================================
 *  PRIMITIVES
 * ========================================================================== */

/* Eyebrow micro-label (10px, 700, caps, 0.08em) */
const Eyebrow = ({ children, color, style }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
    textTransform: 'uppercase', color: color || tokens.inkMuted, ...style
  }}>{children}</div>
);

/* Reward chip — XP ⚡ or RP 🪙 — used inside quest cards, momentum cards, toasts */
const RewardChip = ({ kind = 'xp', value, size = 'sm' }) => {
  const cfg = kind === 'xp'
    ? { fg: tokens.xp, bg: 'hsl(25 95% 53% / 0.12)', icon: icons.bolt }
    : { fg: tokens.rp, bg: tokens.rpSoft,            icon: icons.coin };
  const dim = size === 'md' ? { py: 4,  fs: 12, is: 12 } : { py: 2, fs: 10, is: 11 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: `${dim.py}px 8px`, borderRadius: 9999,
      background: cfg.bg, color: cfg.fg,
      fontWeight: 700, fontSize: dim.fs, fontFamily: 'inherit',
    }}>
      <span style={{color: cfg.fg, display:'flex'}}><Icon d={cfg.icon} size={dim.is} stroke={2.5} fill={kind==='xp'?'currentColor':'none'}/></span>
      {typeof value === 'number' ? (value >= 0 ? `+${value}` : value) : value}
    </span>
  );
};

/* Button — primary / outline / ghost */
const Button = ({ children, variant = 'primary', size = 'md', icon, onClick, style, disabled }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    border: 0, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    fontWeight: 600, borderRadius: 10, transition: 'all .15s',
  };
  const sizes = {
    sm: { height: 32, padding: '0 12px', fontSize: 12 },
    md: { height: 40, padding: '0 14px', fontSize: 13 },
    lg: { height: 48, padding: '0 18px', fontSize: 14 },
  };
  const variants = {
    primary: { background: tokens.orange, color: '#fff', boxShadow: '0 1px 2px hsl(25 95% 53% / 0.25)' },
    outline: { background: '#fff',        color: tokens.ink, boxShadow: `inset 0 0 0 1px ${tokens.border}` },
    ghost:   { background: 'transparent', color: tokens.ink },
    tintedOrange: { background: 'hsl(25 95% 53% / 0.1)', color: tokens.orange },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], opacity: disabled ? .5 : 1, ...style }}>
      {icon && <Icon d={icon} size={size==='lg'?18:16} stroke={2.2}/>}
      {children}
    </button>
  );
};

/* Card — base surface */
const Card = ({ children, padding = 16, style, as = 'div', onClick }) => {
  const Tag = as;
  return (
    <Tag onClick={onClick} style={{
      background: tokens.card, border: `1px solid ${tokens.border}`,
      borderRadius: 12, padding, boxShadow: '0 1px 3px 0 hsl(220 20% 8% / 0.04)',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</Tag>
  );
};

/* Section header */
const SectionHeader = ({ title, subtitle, action, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                margin: '0 0 10px', ...style }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: tokens.ink }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

/* Linked "See all" */
const SeeAll = ({ children = 'ดูทั้งหมด', onClick }) => (
  <button onClick={onClick} style={{
    background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit',
    color: tokens.orange, fontSize: 12, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: 2,
  }}>
    {children}<Icon d={icons.chevR} size={13} stroke={2.5}/>
  </button>
);

Object.assign(window, {
  tokens, MOMENTUM_TIERS, STATUS_TIERS,
  Icon, icons,
  Eyebrow, RewardChip, Button, Card, SectionHeader, SeeAll,
});
