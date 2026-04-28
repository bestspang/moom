/* MOOM Admin — Gamification page, part B
   Quests / Badges / Rewards / Leaderboard tabs + page shell
   Depends on window.* exports from Gamification.jsx */

const { useState: useStateGB, useMemo: useMemoGB, useEffect: useEffectGB } = React;

/* =============================================================
 *  QUESTS TAB
 * =========================================================== */

const QUEST_MOCK = [
  { id: 1, title: 'สตรีค 3 วัน', desc: 'ไปยิม 3 วันติดต่อกัน', status: 'active',
    xp: 75, rp: 20, target: 3, unit: 'วัน', joined: 128, completed: 94, period: '7 วัน',
    icon: '🔥', tone: 'orange' },
  { id: 2, title: 'Yoga Master', desc: 'เข้าคลาส Yoga 5 ครั้งในเดือนนี้', status: 'active',
    xp: 150, rp: 40, target: 5, unit: 'คลาส', joined: 68, completed: 32, period: '30 วัน',
    icon: '🧘', tone: 'info' },
  { id: 3, title: 'Morning Warrior', desc: 'เช็คอินก่อน 8:00 น. 10 ครั้ง', status: 'active',
    xp: 120, rp: 30, target: 10, unit: 'ครั้ง', joined: 42, completed: 18, period: '30 วัน',
    icon: '🌅', tone: 'warn' },
  { id: 4, title: 'New Year, New You', desc: 'เข้ายิม 20 ครั้งในเดือนแรก', status: 'active',
    xp: 500, rp: 150, target: 20, unit: 'ครั้ง', joined: 87, completed: 14, period: '30 วัน',
    icon: '💪', tone: 'pink' },
  { id: 5, title: 'Try Something New', desc: 'ลองคลาสใหม่ 3 ประเภท', status: 'active',
    xp: 100, rp: 25, target: 3, unit: 'ประเภท', joined: 54, completed: 41, period: 'ตลอดไป',
    icon: '🎯', tone: 'teal' },
  { id: 6, title: 'Weekend Warrior', desc: 'เข้ายิมเสาร์-อาทิตย์ 4 สัปดาห์ติด', status: 'scheduled',
    xp: 200, rp: 50, target: 4, unit: 'สัปดาห์', joined: 0, completed: 0, period: 'เริ่ม 1 พ.ค.',
    icon: '🏆', tone: 'info' },
  { id: 7, title: 'Summer Shred', desc: 'เข้า HIIT 15 ครั้งในเดือน', status: 'draft',
    xp: 300, rp: 80, target: 15, unit: 'ครั้ง', joined: 0, completed: 0, period: 'ยังไม่ตั้ง',
    icon: '☀️', tone: 'warn' },
];

const QuestCard = ({ q, onEdit }) => {
  const toneMap = {
    orange: adminTokens.orange, info: adminTokens.info, warn: adminTokens.warn,
    pink: adminTokens.pink, teal: adminTokens.teal,
  };
  const c = toneMap[q.tone] || adminTokens.orange;
  const pct = q.joined ? Math.round((q.completed / q.joined) * 100) : 0;
  const statusMap = {
    active:    { label: 'กำลังทำงาน', fg: adminTokens.success, bg: adminTokens.successSoft },
    scheduled: { label: 'กำหนดการ',    fg: adminTokens.info,    bg: adminTokens.infoSoft },
    draft:     { label: 'ร่าง',        fg: adminTokens.muted,   bg: adminTokens.subtle },
  };
  const s = statusMap[q.status];

  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      borderLeft: `4px solid ${c}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${c.replace(')', ' / 0.14)')}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>{q.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                          flex: 1, minWidth: 0, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
            <div style={{ flexShrink: 0 }}>
              <GPill color={s.fg} bg={s.bg}>{s.label}</GPill>
            </div>
          </div>
          <div style={{ fontSize: 12, color: adminTokens.muted, lineHeight: 1.5 }}>{q.desc}</div>
        </div>
        <button onClick={onEdit} style={{
          background: 'transparent', border: 0, color: adminTokens.mutedLight, cursor: 'pointer',
          width: 28, height: 28, borderRadius: 6, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}><GIcon d={gIcons.dots} size={14}/></button>
      </div>

      {/* Reward row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, padding: '8px 12px', borderRadius: 10,
          background: adminTokens.orangeSoft,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: adminTokens.orange, display: 'flex' }}><GIcon d={gIcons.zap} size={14} stroke={2.5}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.orange,
                          fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{q.xp}</div>
            <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700,
                          letterSpacing: '.06em', marginTop: 2 }}>XP</div>
          </div>
        </div>
        <div style={{
          flex: 1, padding: '8px 12px', borderRadius: 10,
          background: adminTokens.warnSoft,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: adminTokens.warn, display: 'flex' }}><GIcon d={gIcons.coin} size={14} stroke={2.5}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.warn,
                          fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{q.rp}</div>
            <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700,
                          letterSpacing: '.06em', marginTop: 2 }}>RP</div>
          </div>
        </div>
        <div style={{
          flex: 1, padding: '8px 12px', borderRadius: 10,
          background: adminTokens.subtle,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: adminTokens.muted, display: 'flex' }}><GIcon d={gIcons.target} size={14} stroke={2.5}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: adminTokens.black,
                          fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{q.target}</div>
            <div style={{ fontSize: 9, color: adminTokens.muted, fontWeight: 700,
                          letterSpacing: '.06em', marginTop: 2 }}>{q.unit.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Completion */}
      {q.status === 'active' ? (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: 11, marginBottom: 8 }}>
            <span style={{ color: adminTokens.muted, fontWeight: 600 }}>
              สำเร็จ <span style={{ color: adminTokens.black, fontWeight: 800 }}>
              {q.completed} / {q.joined}</span> ({pct}%)
            </span>
            <span style={{ color: adminTokens.mutedLight, fontWeight: 600 }}>{q.period}</span>
          </div>
          <div style={{
            height: 6, borderRadius: 9999, background: adminTokens.subtle, overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: `linear-gradient(90deg, ${c}, ${c})`,
              borderRadius: 9999,
            }}/>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: adminTokens.mutedLight, fontStyle: 'italic' }}>{q.period}</div>
      )}
    </div>
  );
};

const QuestEditorDrawer = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 50,
      }}/>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 51,
        background: adminTokens.surface, boxShadow: '-4px 0 24px rgba(15,23,42,.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '18px 20px', display: 'flex', alignItems: 'center',
          borderBottom: `1px solid ${adminTokens.divider}`,
        }}>
          <div>
            <div style={{ fontSize: 10, color: adminTokens.muted, fontWeight: 700,
                          letterSpacing: '.1em', textTransform: 'uppercase' }}>Quest ใหม่</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: adminTokens.black,
                          letterSpacing: '-.02em', marginTop: 2 }}>สร้าง Quest</div>
          </div>
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 0, cursor: 'pointer',
            background: adminTokens.subtle, color: adminTokens.black,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><GIcon d={gIcons.x} size={16}/></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px',
                      display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                            letterSpacing: '.04em', textTransform: 'uppercase' }}>ชื่อ Quest</label>
            <input placeholder="เช่น Morning Warrior" style={{
              width: '100%', marginTop: 6, height: 40, padding: '0 12px',
              border: `1px solid ${adminTokens.border}`, borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                            letterSpacing: '.04em', textTransform: 'uppercase' }}>คำอธิบาย</label>
            <textarea placeholder="บอกสมาชิกว่าต้องทำอะไร..." rows={3} style={{
              width: '100%', marginTop: 6, padding: 12,
              border: `1px solid ${adminTokens.border}`, borderRadius: 10,
              fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none',
            }}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                            letterSpacing: '.04em', textTransform: 'uppercase' }}>เงื่อนไข</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, marginTop: 6 }}>
              <select style={{
                height: 40, padding: '0 12px', border: `1px solid ${adminTokens.border}`,
                borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
                background: adminTokens.surface,
              }}>
                <option>เช็คอินคลาส (ใด ๆ)</option>
                <option>เช็คอินคลาสประเภท Yoga</option>
                <option>เช็คอินก่อน 8:00</option>
                <option>Streak ต่อเนื่อง</option>
              </select>
              <input type="number" defaultValue="5" style={{
                height: 40, padding: '0 12px', border: `1px solid ${adminTokens.border}`,
                borderRadius: 10, fontSize: 14, fontFamily: 'inherit', textAlign: 'center',
                fontWeight: 800,
              }}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                              letterSpacing: '.04em', textTransform: 'uppercase' }}>รางวัล XP</label>
              <input type="number" defaultValue="100" style={{
                width: '100%', marginTop: 6, height: 40, padding: '0 12px',
                border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                fontSize: 14, fontFamily: 'inherit', fontWeight: 800,
                color: adminTokens.orange,
              }}/>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                              letterSpacing: '.04em', textTransform: 'uppercase' }}>รางวัล RP</label>
              <input type="number" defaultValue="25" style={{
                width: '100%', marginTop: 6, height: 40, padding: '0 12px',
                border: `1px solid ${adminTokens.border}`, borderRadius: 10,
                fontSize: 14, fontFamily: 'inherit', fontWeight: 800,
                color: adminTokens.warn,
              }}/>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: adminTokens.muted,
                            letterSpacing: '.04em', textTransform: 'uppercase' }}>ระยะเวลา</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {['7 วัน', '14 วัน', '30 วัน', 'ตลอดไป'].map((o, i) => (
                <button key={i} style={{
                  flex: 1, height: 36, borderRadius: 8, cursor: 'pointer',
                  border: i === 2 ? 0 : `1px solid ${adminTokens.border}`,
                  background: i === 2 ? adminTokens.orange : adminTokens.surface,
                  color: i === 2 ? '#fff' : adminTokens.black,
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                }}>{o}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${adminTokens.divider}`,
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <GButton onClick={onClose}>ยกเลิก</GButton>
          <GButton>บันทึกเป็นร่าง</GButton>
          <GButton primary icon={gIcons.play}>เผยแพร่</GButton>
        </div>
      </div>
    </>
  );
};

const GamiQuestsTab = () => {
  const [filter, setFilter] = useStateGB('all');
  const [drawerOpen, setDrawerOpen] = useStateGB(false);
  const filtered = QUEST_MOCK.filter(q => filter === 'all' || q.status === filter);
  const counts = {
    all: QUEST_MOCK.length,
    active: QUEST_MOCK.filter(q => q.status === 'active').length,
    scheduled: QUEST_MOCK.filter(q => q.status === 'scheduled').length,
    draft: QUEST_MOCK.filter(q => q.status === 'draft').length,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
        padding: 10, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle, borderRadius: 10 }}>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'active', label: 'กำลังทำงาน' },
            { id: 'scheduled', label: 'กำหนดการ' },
            { id: 'draft', label: 'ร่าง' },
          ].map(t => (
            <GChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)}>
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 9999,
                background: filter === t.id ? adminTokens.orangeSoft : adminTokens.border,
                color: filter === t.id ? adminTokens.orange : adminTokens.muted,
              }}>{counts[t.id]}</span>
            </GChip>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <GButton small icon={gIcons.filter}>ตัวกรอง</GButton>
        <GButton small primary icon={gIcons.plus} onClick={() => setDrawerOpen(true)}>Quest ใหม่</GButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {filtered.map(q => <QuestCard key={q.id} q={q} onEdit={() => setDrawerOpen(true)}/>)}
      </div>

      <QuestEditorDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

/* =============================================================
 *  BADGES TAB
 * =========================================================== */

const RARITY = {
  common:    { label: 'Common',    color: 'hsl(220 10% 60%)' },
  rare:      { label: 'Rare',      color: 'hsl(210 70% 55%)' },
  epic:      { label: 'Epic',      color: 'hsl(280 65% 55%)' },
  legendary: { label: 'Legendary', color: 'hsl(45 93% 47%)' },
};

const BADGES_MOCK = [
  { id: 1, name: 'First Step',     glyph: '👣', rarity: 'common', earned: 247, desc: 'เช็คอินครั้งแรก' },
  { id: 2, name: 'Early Bird',     glyph: '🌅', rarity: 'common', earned: 128, desc: 'เช็คอินก่อน 7:00 น.' },
  { id: 3, name: 'Weekly Regular', glyph: '📅', rarity: 'rare',   earned: 84,  desc: 'เข้ายิม 4 วันใน 1 สัปดาห์' },
  { id: 4, name: 'Streak Master',  glyph: '🔥', rarity: 'rare',   earned: 42,  desc: 'Streak 14 วันติด' },
  { id: 5, name: 'Yoga Devotee',   glyph: '🧘', rarity: 'rare',   earned: 36,  desc: 'เข้า Yoga 20 ครั้ง' },
  { id: 6, name: 'Heavy Lifter',   glyph: '🏋️', rarity: 'rare',   earned: 24,  desc: 'เข้า Strength 25 ครั้ง' },
  { id: 7, name: 'Century Club',   glyph: '💯', rarity: 'epic',   earned: 18,  desc: 'เช็คอินครบ 100 ครั้ง' },
  { id: 8, name: 'Trailblazer',    glyph: '⚡', rarity: 'epic',   earned: 12,  desc: 'ลองคลาสครบทุกประเภท' },
  { id: 9, name: 'Community Hero', glyph: '🤝', rarity: 'epic',   earned: 8,   desc: 'แนะนำเพื่อน 5 คน' },
  { id: 10, name: 'Iron Will',     glyph: '⚔️', rarity: 'legendary', earned: 4, desc: 'Streak 100 วันติด' },
  { id: 11, name: 'MOOM Legend',   glyph: '👑', rarity: 'legendary', earned: 2, desc: 'สมาชิก 2 ปีขึ้นไป + ทุก Epic' },
  { id: 12, name: 'Founder Member',glyph: '🌟', rarity: 'legendary', earned: 6, desc: 'สมัครก่อน 1 ม.ค. 2024' },
];

const BadgeTile = ({ b }) => {
  const r = RARITY[b.rarity];
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, position: 'relative',
      overflow: 'hidden',
    }}>
      {/* rarity corner */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: r.color,
      }}/>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: `radial-gradient(circle at 30% 25%, ${r.color.replace(')', ' / 0.22)')}, ${r.color.replace(')', ' / 0.06)')})`,
        border: `2px solid ${r.color.replace(')', ' / 0.4)')}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, marginTop: 6,
      }}>{b.glyph}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, textAlign: 'center' }}>{b.name}</div>
      <div style={{ fontSize: 10, color: adminTokens.muted, textAlign: 'center', lineHeight: 1.4,
                    minHeight: 28 }}>{b.desc}</div>
      <div style={{
        width: '100%', paddingTop: 10, borderTop: `1px solid ${adminTokens.divider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <GPill color={r.color} bg={r.color.replace(')', ' / 0.12)')}>
          {r.label}
        </GPill>
        <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.black,
                      fontVariantNumeric: 'tabular-nums' }}>
          {b.earned} <span style={{ color: adminTokens.mutedLight, fontSize: 10, fontWeight: 600 }}>ได้รับ</span>
        </div>
      </div>
    </div>
  );
};

const GamiBadgesTab = () => {
  const [rarity, setRarity] = useStateGB('all');
  const filtered = BADGES_MOCK.filter(b => rarity === 'all' || b.rarity === rarity);
  const counts = {
    all: BADGES_MOCK.length,
    common: BADGES_MOCK.filter(b => b.rarity === 'common').length,
    rare: BADGES_MOCK.filter(b => b.rarity === 'rare').length,
    epic: BADGES_MOCK.filter(b => b.rarity === 'epic').length,
    legendary: BADGES_MOCK.filter(b => b.rarity === 'legendary').length,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
        padding: 10, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle, borderRadius: 10 }}>
          {[
            { id: 'all', label: 'ทั้งหมด', color: null },
            { id: 'common', label: 'Common', color: RARITY.common.color },
            { id: 'rare', label: 'Rare', color: RARITY.rare.color },
            { id: 'epic', label: 'Epic', color: RARITY.epic.color },
            { id: 'legendary', label: 'Legendary', color: RARITY.legendary.color },
          ].map(t => (
            <GChip key={t.id} active={rarity === t.id} onClick={() => setRarity(t.id)}>
              {t.color && <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }}/>}
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 9999,
                background: rarity === t.id ? adminTokens.orangeSoft : adminTokens.border,
                color: rarity === t.id ? adminTokens.orange : adminTokens.muted,
              }}>{counts[t.id]}</span>
            </GChip>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <GButton small primary icon={gIcons.plus}>Badge ใหม่</GButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {filtered.map(b => <BadgeTile key={b.id} b={b}/>)}
      </div>
    </div>
  );
};

/* =============================================================
 *  REWARDS TAB
 * =========================================================== */

const REWARDS_MOCK = [
  { id: 1, name: 'น้ำ Detox ฟรี',        cost: 50,   stock: 8,   claimed: 42, category: 'เครื่องดื่ม', glyph: '🥤' },
  { id: 2, name: 'Shake Protein ฟรี',    cost: 120,  stock: 15,  claimed: 28, category: 'เครื่องดื่ม', glyph: '🥛' },
  { id: 3, name: 'Towel MOOM',           cost: 200,  stock: 24,  claimed: 18, category: 'สินค้า', glyph: '🏅' },
  { id: 4, name: 'ส่วนลด 20% แพ็คเกจ',    cost: 500,  stock: 999, claimed: 34, category: 'ส่วนลด', glyph: '🎟️' },
  { id: 5, name: 'คลาส PT ฟรี 1 ชม.',     cost: 800,  stock: 6,   claimed: 12, category: 'คลาส', glyph: '💪' },
  { id: 6, name: 'เสื้อ MOOM',            cost: 1000, stock: 3,   claimed: 8,  category: 'สินค้า', glyph: '👕' },
  { id: 7, name: 'คูปอง Smoothie',        cost: 80,   stock: 0,   claimed: 54, category: 'เครื่องดื่ม', glyph: '🥤' },
  { id: 8, name: '1 เดือน Unlimited',    cost: 3000, stock: 2,   claimed: 2,  category: 'แพ็คเกจ', glyph: '🎁' },
];

const GamiRewardsTab = () => {
  const redemptions = [
    { name: 'Napat K.',   item: 'น้ำ Detox ฟรี',     cost: 50,  when: '2 นาที' },
    { name: 'Suda W.',    item: 'Shake Protein',    cost: 120, when: '15 นาที' },
    { name: 'Korn T.',    item: 'Towel MOOM',       cost: 200, when: '1 ชม.' },
    { name: 'Preecha M.', item: 'คลาส PT 1 ชม.',    cost: 800, when: '2 ชม.' },
    { name: 'Anong P.',   item: 'ส่วนลด 20%',        cost: 500, when: '3 ชม.' },
    { name: 'Thanin S.',  item: 'เสื้อ MOOM',        cost: 1000,when: '5 ชม.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'RP ที่หมุนเวียน', value: '847K',  sub: 'ในบัญชีสมาชิก', c: adminTokens.warn,    icon: gIcons.coin },
          { label: 'แลกวันนี้',        value: '23',    sub: 'มูลค่า 4,280 RP', c: adminTokens.orange, icon: gIcons.gift },
          { label: 'อัตราแลก',         value: '68%',   sub: 'ของที่ได้รับ',    c: adminTokens.teal,   icon: gIcons.chart },
          { label: 'ใกล้หมดสต็อก',     value: '3',     sub: 'ต้องเติม',        c: adminTokens.destr,  icon: gIcons.flame },
        ].map((s, i) => (
          <div key={i} style={{
            background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
            borderRadius: adminTokens.r3, padding: 16, boxShadow: adminTokens.shadowSm,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: s.c.replace(')', ' / 0.12)'), color: s.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><GIcon d={s.icon} size={18} stroke={2.2}/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: adminTokens.black,
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        {/* Catalog */}
        <GCard title="แค็ตตาล็อก Rewards" subtitle={`${REWARDS_MOCK.length} รายการ`}
               action={<GButton small primary icon={gIcons.plus}>Reward ใหม่</GButton>} pad={0}>
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 90px 100px 80px 36px',
              padding: '10px 16px', fontSize: 10, fontWeight: 700, color: adminTokens.muted,
              letterSpacing: '.06em', textTransform: 'uppercase',
              borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
            }}>
              <div/><div>รายการ</div>
              <div style={{textAlign:'right'}}>ราคา RP</div>
              <div style={{textAlign:'right'}}>สต็อก</div>
              <div style={{textAlign:'right'}}>แลก</div><div/>
            </div>
            {REWARDS_MOCK.map((r, i) => {
              const lowStock = r.stock > 0 && r.stock <= 5;
              const outOfStock = r.stock === 0;
              return (
                <div key={r.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 90px 100px 80px 36px',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: i === REWARDS_MOCK.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
                  opacity: outOfStock ? 0.55 : 1,
                }}>
                  <div style={{ fontSize: 22 }}>{r.glyph}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: adminTokens.muted, marginTop: 2 }}>{r.category}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800,
                                color: adminTokens.warn, fontVariantNumeric: 'tabular-nums' }}>
                    {r.cost.toLocaleString()}
                    <div style={{ fontSize: 9, color: adminTokens.mutedLight, fontWeight: 600, marginTop: 1 }}>RP</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {outOfStock ? (
                      <GPill color={adminTokens.destr} bg={adminTokens.destrSoft}>หมด</GPill>
                    ) : lowStock ? (
                      <GPill color={adminTokens.warn} bg={adminTokens.warnSoft}>{r.stock} ชิ้น</GPill>
                    ) : r.stock === 999 ? (
                      <GPill color={adminTokens.success} bg={adminTokens.successSoft}>ไม่จำกัด</GPill>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                                     fontVariantNumeric: 'tabular-nums' }}>{r.stock}</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: adminTokens.muted,
                                fontVariantNumeric: 'tabular-nums' }}>{r.claimed}</div>
                  <button style={{
                    background: 'transparent', border: 0, color: adminTokens.mutedLight, cursor: 'pointer',
                    width: 28, height: 28, borderRadius: 6, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}><GIcon d={gIcons.dots} size={14}/></button>
                </div>
              );
            })}
          </div>
        </GCard>

        {/* Recent redemptions */}
        <GCard title="การแลกล่าสุด" subtitle="24 ชม. ที่ผ่านมา" pad={0}>
          <div>
            {redemptions.map((r, i) => (
              <div key={i} style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i === redemptions.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: adminTokens.orangeSoft,
                  color: adminTokens.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                }}>{r.name.split(' ').map(w => w[0]).join('')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 2,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.item}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: adminTokens.warn,
                                fontVariantNumeric: 'tabular-nums' }}>-{r.cost}</div>
                  <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 1 }}>{r.when}</div>
                </div>
              </div>
            ))}
          </div>
        </GCard>
      </div>
    </div>
  );
};

/* =============================================================
 *  LEADERBOARD TAB
 * =========================================================== */

const LEADERS = [
  { rank: 1, name: 'Thanin Sriprasert',  tier: 'legend',    xp: 8420, classes: 142, streak: 45, badges: 18, avatar: 'TS' },
  { rank: 2, name: 'Napat Kongphop',     tier: 'champion',  xp: 6140, classes: 98,  streak: 28, badges: 14, avatar: 'NK' },
  { rank: 3, name: 'Preecha Manop',      tier: 'champion',  xp: 5890, classes: 92,  streak: 21, badges: 13, avatar: 'PM' },
  { rank: 4, name: 'Suda Wongsawat',     tier: 'elite',     xp: 3220, classes: 67,  streak: 14, badges: 11, avatar: 'SW' },
  { rank: 5, name: 'Korn Thanakit',      tier: 'elite',     xp: 2980, classes: 62,  streak: 12, badges: 10, avatar: 'KT' },
  { rank: 6, name: 'Anong Prasertsak',   tier: 'dedicated', xp: 1340, classes: 38,  streak: 8,  badges: 7,  avatar: 'AP' },
  { rank: 7, name: 'Vichai Charoen',     tier: 'dedicated', xp: 1180, classes: 32,  streak: 6,  badges: 6,  avatar: 'VC' },
  { rank: 8, name: 'Malee Suksan',       tier: 'dedicated', xp: 920,  classes: 28,  streak: 4,  badges: 5,  avatar: 'MS' },
  { rank: 9, name: 'Somchai Jitra',      tier: 'regular',   xp: 480,  classes: 18,  streak: 3,  badges: 3,  avatar: 'SJ' },
  { rank: 10, name: 'Pranee Kitti',      tier: 'regular',   xp: 420,  classes: 16,  streak: 2,  badges: 3,  avatar: 'PK' },
];

const GamiLeaderboardTab = () => {
  const [period, setPeriod] = useStateGB('30d');
  const [tierFilter, setTierFilter] = useStateGB('all');
  const filtered = LEADERS.filter(l => tierFilter === 'all' || l.tier === tierFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Podium for top 3 */}
      <div style={{
        background: `linear-gradient(135deg, ${adminTokens.orangeTint}, ${adminTokens.surface})`,
        border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
        padding: '20px 20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 16, gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: adminTokens.orange, fontWeight: 800,
                          letterSpacing: '.1em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap' }}>🏆 Top Performers</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: adminTokens.black,
                          letterSpacing: '-.02em', marginTop: 4, whiteSpace: 'nowrap' }}>
              ผู้นำ {period === '7d' ? 'สัปดาห์นี้' : period === '30d' ? 'เดือนนี้' : 'ปีนี้'}
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', padding: 2, background: adminTokens.surface,
                        borderRadius: 10, border: `1px solid ${adminTokens.border}` }}>
            {[{ id: '7d', label: '7 วัน' }, { id: '30d', label: '30 วัน' }, { id: 'ytd', label: 'YTD' }].map(p => (
              <GChip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>{p.label}</GChip>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr',
                      gap: 12, alignItems: 'flex-end' }}>
          {[LEADERS[1], LEADERS[0], LEADERS[2]].map((l, col) => {
            const t = TIERS.find(t => t.id === l.tier);
            const rank = l.rank;
            const podHeight = rank === 1 ? 124 : rank === 2 ? 100 : 84;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
            return (
              <div key={l.rank} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{medal}</div>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.color}, ${t.color})`,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, margin: '0 auto 8px',
                  boxShadow: `0 6px 16px ${t.color.replace(')', ' / 0.35)')}`,
                  border: '3px solid #fff',
                }}>{l.avatar}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black }}>{l.name}</div>
                <div style={{ fontSize: 10, color: t.color, fontWeight: 800,
                              letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 2 }}>
                  {t.icon} {t.label}
                </div>
                <div style={{
                  marginTop: 10, height: podHeight,
                  background: `linear-gradient(180deg, ${t.color.replace(')', ' / 0.16)')}, ${t.color.replace(')', ' / 0.02)')})`,
                  borderTop: `3px solid ${t.color}`,
                  borderRadius: '8px 8px 0 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: adminTokens.black,
                                fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
                    {l.xp.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: adminTokens.orange, fontWeight: 800,
                                letterSpacing: '.08em' }}>XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar + full table */}
      <div style={{
        background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
        borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm, overflow: 'hidden',
      }}>
        <div style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8,
                      borderBottom: `1px solid ${adminTokens.divider}` }}>
          <div style={{ display: 'flex', padding: 2, background: adminTokens.subtle, borderRadius: 10 }}>
            <GChip active={tierFilter === 'all'} onClick={() => setTierFilter('all')}>ทุก Tier</GChip>
            {TIERS.map(t => (
              <GChip key={t.id} active={tierFilter === t.id} onClick={() => setTierFilter(t.id)}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }}/>
                {t.label}
              </GChip>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{
            height: 32, padding: '0 10px', border: `1px solid ${adminTokens.border}`,
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
            background: adminTokens.surface,
          }}>
            <GIcon d={gIcons.search} size={13} stroke={2.2}/>
            <input placeholder="ค้นหาสมาชิก..." style={{
              border: 0, outline: 'none', fontSize: 12, fontFamily: 'inherit',
              width: 140, background: 'transparent',
            }}/>
          </div>
        </div>
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 110px 90px 80px 80px 80px',
            padding: '12px 18px', fontSize: 10, fontWeight: 700, color: adminTokens.muted,
            letterSpacing: '.06em', textTransform: 'uppercase',
            borderBottom: `1px solid ${adminTokens.divider}`, background: adminTokens.subtle,
          }}>
            <div>อันดับ</div>
            <div>สมาชิก</div>
            <div>Tier</div>
            <div style={{ textAlign: 'right' }}>XP</div>
            <div style={{ textAlign: 'right' }}>คลาส</div>
            <div style={{ textAlign: 'right' }}>Streak</div>
            <div style={{ textAlign: 'right' }}>Badges</div>
          </div>
          {filtered.map((l, i) => {
            const t = TIERS.find(t => t.id === l.tier);
            const max = filtered[0]?.xp || 1;
            return (
              <div key={l.rank} style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 110px 90px 80px 80px 80px',
                padding: '14px 18px', alignItems: 'center',
                borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${adminTokens.divider}`,
                position: 'relative',
              }}>
                {/* XP fill bar in background */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${(l.xp / max) * 100}%`,
                  background: `linear-gradient(90deg, ${t.color.replace(')', ' / 0.06)')}, transparent)`,
                  pointerEvents: 'none',
                }}/>
                <div style={{ fontSize: 15, fontWeight: 800,
                              color: l.rank <= 3 ? adminTokens.orange : adminTokens.mutedLight,
                              fontVariantNumeric: 'tabular-nums', position: 'relative' }}>
                  #{l.rank}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${t.color}, ${t.color})`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>{l.avatar}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{l.name}</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <GPill color={t.color} bg={t.color.replace(')', ' / 0.12)')}>
                    {t.icon} {t.label}
                  </GPill>
                </div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800,
                              color: adminTokens.black, fontVariantNumeric: 'tabular-nums', position: 'relative' }}>
                  {l.xp.toLocaleString()}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: adminTokens.muted,
                              fontVariantNumeric: 'tabular-nums', position: 'relative' }}>{l.classes}</div>
                <div style={{ textAlign: 'right', position: 'relative' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: l.streak >= 14 ? adminTokens.orange : adminTokens.muted,
                                 fontVariantNumeric: 'tabular-nums' }}>
                    {l.streak >= 14 && '🔥 '}{l.streak}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: adminTokens.muted,
                              fontVariantNumeric: 'tabular-nums', position: 'relative' }}>{l.badges}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =============================================================
 *  PAGE SHELL
 * =========================================================== */
const GamificationPageV2 = () => {
  const [enabled, setEnabled] = useStateGB(true);
  const [tab, setTab] = useStateGB(() =>
    localStorage.getItem('moom-admin-gami-tab') || 'overview'
  );
  useEffectGB(() => { localStorage.setItem('moom-admin-gami-tab', tab); }, [tab]);

  return (
    <div style={{
      padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18,
      maxWidth: 1400, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800, color: adminTokens.black,
            letterSpacing: '-.02em',
          }}>Gamification</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: adminTokens.muted }}>
            ระบบสะสม XP · Tiers · Quests · Badges · Rewards ของสมาชิก
          </p>
        </div>
        <GButton icon={gIcons.eye}>Preview ในแอพ</GButton>
        <GButton primary icon={gIcons.plus}>สร้างใหม่</GButton>
      </div>

      <GamiHero/>
      <GamiSystemStrip enabled={enabled} setEnabled={setEnabled}/>
      <GamiTabs tab={tab} setTab={setTab}/>

      {tab === 'overview'    && <GamiOverviewTab/>}
      {tab === 'tiers'       && <GamiTiersTab/>}
      {tab === 'quests'      && <GamiQuestsTab/>}
      {tab === 'badges'      && <GamiBadgesTab/>}
      {tab === 'rewards'     && <GamiRewardsTab/>}
      {tab === 'leaderboard' && <GamiLeaderboardTab/>}
    </div>
  );
};

Object.assign(window, {
  GamiQuestsTab, GamiBadgesTab, GamiRewardsTab, GamiLeaderboardTab,
  GamificationPageV2,
});
