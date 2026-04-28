/* MOOM Admin — 2026 Modern Shell & Widgets
   Layered on top of Components.jsx + Theme.jsx. Adds:
   - ModernSidebar       : icon rail + labeled secondary column, collapsible groups
   - ModernTopBar        : command bar (⌘K), date pill, quick-actions, avatar menu
   - LivePulseCard       : check-ins + occupancy ticker, tiny sparkline
   - RevenueChart        : 12-week area chart (pure SVG, tokens-based)
   - ActivityFeed        : timeline of recent events
   - ClassScheduleV2     : richer row with coach avatar + capacity chips + actions
   - MembersTableV2      : avatar + status + hover actions row
   - QuickActionTile     : square tile for dashboard shortcuts
   - InsightCard         : colored callout with metric + trend
*/

const { useState: useStateM } = React;

/* =============================================================
 *  MODERN SIDEBAR v2 — one column, pinned + grouped + collapsible
 * =========================================================== */
const NAV_GROUPS = [
  { id: 'home', label: 'หน้าหลัก', items: [
    { id: 'dashboard', label: 'แดชบอร์ด',  d: aIcons.grid },
    { id: 'lobby',     label: 'ล็อบบี้',    d: aIcons.door, badge: 3, urgent: true, hint: 'อยู่ในยิมตอนนี้' },
    { id: 'schedule',  label: 'ตารางเรียน', d: aIcons.cal,  badge: '5', hint: 'คลาสวันนี้' },
  ]},
  { id: 'people', label: 'บุคคล', items: [
    { id: 'members',  label: 'สมาชิก',    d: aIcons.users },
    { id: 'leads',    label: 'ลีด',       d: aIcons.star,  badge: 12, urgent: true, hint: 'รอติดตาม' },
    { id: 'trainers', label: 'เทรนเนอร์', d: aIcons.userOne },
  ]},
  { id: 'business', label: 'ธุรกิจ', items: [
    { id: 'packages',  label: 'แพ็คเกจ',       d: aIcons.tag },
    { id: 'promos',    label: 'โปรโมชั่น',     d: aIcons.gift },
    { id: 'finance',   label: 'การเงิน',       d: aIcons.cash,  badge: 8, urgent: true, hint: 'ค้างชำระ' },
    { id: 'analytics', label: 'วิเคราะห์ธุรกิจ', d: aIcons.bar },
    { id: 'gami',      label: 'Gamification',   d: aIcons.trophy },
  ]},
  { id: 'gym', label: 'ยิม', items: [
    { id: 'classes',    label: 'รายการคลาส',   d: aIcons.list },
    { id: 'categories', label: 'หมวดหมู่คลาส', d: aIcons.groups },
    { id: 'rooms',      label: 'ผังห้อง',       d: aIcons.layout },
    { id: 'programs',   label: 'โปรแกรมฝึก',   d: aIcons.dumbbell },
  ]},
  { id: 'comms', label: 'สื่อสาร', items: [
    { id: 'announcements', label: 'ประกาศ', d: aIcons.alert, badge: 2, hint: 'กำลังส่ง · ตั้งเวลา' },
  ]},
  { id: 'org', label: 'องค์กร', items: [
    { id: 'branches', label: 'สาขา',         d: aIcons.layout },
    { id: 'roles',    label: 'บทบาท',        d: aIcons.shield || aIcons.star },
    { id: 'activity', label: 'บันทึกกิจกรรม', d: aIcons.list },
  ]},
  { id: 'settings', label: 'ตั้งค่า', items: [
    { id: 'branding', label: 'แบรนด์ยิม',    d: aIcons.star },
    { id: 'settings', label: 'ตั้งค่าระบบ',  d: aIcons.gear || aIcons.alert },
  ]},
];

const DEFAULT_PINS = ['dashboard','lobby','schedule','members'];

const BRANCHES = [
  { id: 'asok',    name: 'สาขาอโศก',      sub: 'ผู้จัดการ · เปิด 06:00–23:00' },
  { id: 'thonglor',name: 'สาขาทองหล่อ',  sub: 'เปิด 06:00–23:00' },
  { id: 'silom',   name: 'สาขาสีลม',      sub: 'เปิด 06:00–22:00' },
];

const ATTENTION = [
  { icon: aIcons.cash,  color: 'hsl(0 72% 55%)', text: '8 สมาชิกค้างชำระ', sub: 'รวม ฿14,200', go: 'finance' },
  { icon: aIcons.star,  color: 'hsl(22 95% 55%)', text: '3 ลีดยังไม่ตอบ',  sub: '>24 ชม.',    go: 'leads' },
  { icon: aIcons.alert, color: 'hsl(210 70% 55%)', text: 'คลาส 19:00 เต็ม',  sub: '2 ในลิสต์รอ', go: 'schedule' },
];

/* —— tiny helpers —— */
const SBIcon = ({ d, size = 16, stroke = 2, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'}
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', flexShrink: 0 }}>{d}</svg>
);

const NavItem = ({ it, active, collapsed, onClick }) => {
  const [hover, setHover] = useStateM(false);
  const bg = active ? adminTokens.orangeSoft : (hover ? adminTokens.subtle : 'transparent');
  const fg = active ? adminTokens.orange : adminTokens.black;

  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={collapsed ? it.label : undefined}
      style={{
        width: '100%', height: 34, padding: collapsed ? 0 : '0 10px 0 12px', marginTop: 1,
        borderRadius: 9, border: 0, cursor: 'pointer', fontFamily: 'inherit',
        background: bg, color: fg,
        display: 'flex', alignItems: 'center', gap: 11,
        justifyContent: collapsed ? 'center' : 'flex-start',
        fontSize: 13, fontWeight: active ? 700 : 500, textAlign: 'left',
        transition: 'background .12s', position: 'relative',
      }}>
      {active && !collapsed && (
        <span style={{
          position: 'absolute', left: -10, top: 8, bottom: 8, width: 3,
          background: adminTokens.orange, borderRadius: 3,
        }}/>
      )}
      <span style={{ color: active ? adminTokens.orange : adminTokens.muted, display: 'flex' }}>
        <SBIcon d={it.d} size={17} stroke={active ? 2.3 : 1.9}/>
      </span>
      {!collapsed && <>
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
        {it.badge != null && (
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.01em',
            background: it.urgent
              ? 'hsl(0 72% 55%)'
              : (active ? adminTokens.orange : 'hsl(220 14% 90%)'),
            color: it.urgent || active ? '#fff' : adminTokens.muted,
            padding: '2px 7px', minWidth: 20, textAlign: 'center',
            borderRadius: 9999, fontVariantNumeric: 'tabular-nums',
            boxShadow: it.urgent ? '0 0 0 3px hsl(0 72% 55% / .12)' : 'none',
          }}>{it.badge}</span>
        )}
      </>}
      {collapsed && it.badge != null && (
        <span style={{
          position: 'absolute', top: 4, right: 8,
          width: 8, height: 8, borderRadius: 9999,
          background: it.urgent ? 'hsl(0 72% 55%)' : adminTokens.orange,
          boxShadow: `0 0 0 2px ${adminTokens.surface}`,
        }}/>
      )}
    </button>
  );
};

const ModernSidebar = ({ page, setPage }) => {
  const [collapsed, setCollapsed] = useStateM(() => localStorage.getItem('moom-sb-collapsed') === '1');
  const [branchOpen, setBranchOpen] = useStateM(false);
  const [branch, setBranch] = useStateM(BRANCHES[0]);
  const [openGroups, setOpenGroups] = useStateM(() => {
    try { return JSON.parse(localStorage.getItem('moom-sb-groups') || 'null') ||
      { home: true, people: true, business: true, gym: false, settings: false }; }
    catch { return { home: true, people: true, business: true, gym: false, settings: false }; }
  });
  const [pins] = useStateM(DEFAULT_PINS);
  const [search, setSearch] = useStateM('');

  React.useEffect(() => { localStorage.setItem('moom-sb-collapsed', collapsed ? '1' : '0'); }, [collapsed]);
  React.useEffect(() => { localStorage.setItem('moom-sb-groups', JSON.stringify(openGroups)); }, [openGroups]);

  // Make sure the group containing the active page is open
  React.useEffect(() => {
    const host = NAV_GROUPS.find(g => g.items.some(i => i.id === page));
    if (host && !openGroups[host.id]) setOpenGroups(g => ({ ...g, [host.id]: true }));
  }, [page]); // eslint-disable-line

  // ⌘K / Ctrl-K focuses search
  const searchRef = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCollapsed(false);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Build lookup of all items for pins + search
  const allItems = React.useMemo(() => {
    const m = {};
    NAV_GROUPS.forEach(g => g.items.forEach(i => { m[i.id] = { ...i, group: g.label, groupId: g.id }; }));
    return m;
  }, []);
  const pinItems = pins.map(p => allItems[p]).filter(Boolean);

  const searchQuery = search.trim().toLowerCase();
  const searchResults = searchQuery
    ? Object.values(allItems).filter(i => i.label.toLowerCase().includes(searchQuery) || i.group.toLowerCase().includes(searchQuery))
    : null;

  const W = collapsed ? 68 : 252;

  return (
    <div style={{
      width: W, minWidth: W, height: '100%', background: adminTokens.surface,
      borderRight: `1px solid ${adminTokens.border}`,
      display: 'flex', flexDirection: 'column',
      transition: 'width .18s ease', position: 'relative', fontFamily: 'inherit',
    }}>
      {/* Brand + collapse */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '14px 14px 10px' : '14px 14px 10px',
        gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${adminTokens.orange}, ${adminTokens.orangeDeep || 'hsl(14 90% 48%)'})`,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, letterSpacing: '-.02em',
          boxShadow: adminTokens.shadowOrange || '0 6px 18px -6px hsl(22 95% 55% / .6)',
        }}>M</div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: adminTokens.black, letterSpacing: '-.01em' }}>MOOM Gym</div>
            <div style={{ fontSize: 10, color: adminTokens.mutedLight, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase' }}>Admin</div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'ขยาย' : 'ย่อ'}
          style={{
            width: 26, height: 26, borderRadius: 7, border: 0, cursor: 'pointer',
            background: 'transparent', color: adminTokens.muted, display: collapsed ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = adminTokens.subtle; e.currentTarget.style.color = adminTokens.black; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = adminTokens.muted; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/>
          </svg>
        </button>
      </div>

      {/* Branch switcher */}
      <div style={{ padding: collapsed ? '0 10px 10px' : '0 12px 10px', position: 'relative' }}>
        <button onClick={() => setBranchOpen(o => !o)}
          style={{
            width: '100%', height: collapsed ? 44 : 48,
            padding: collapsed ? 0 : '0 10px', borderRadius: 10, border: `1px solid ${adminTokens.border}`,
            background: branchOpen ? adminTokens.subtle : adminTokens.surface,
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background .12s',
          }}>
          <span style={{
            width: collapsed ? 26 : 28, height: collapsed ? 26 : 28, borderRadius: 7,
            background: 'hsl(168 75% 43% / .14)', color: adminTokens.teal,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <SBIcon d={aIcons.building} size={14} stroke={2.2}/>
          </span>
          {!collapsed && <>
            <span style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch.name}</div>
              <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 1 }}>สลับสาขา</div>
            </span>
            <span style={{ color: adminTokens.mutedLight, display: 'flex', transform: branchOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <SBIcon d={aIcons.chev} size={14}/>
            </span>
          </>}
        </button>
        {branchOpen && !collapsed && (
          <div style={{
            position: 'absolute', top: '100%', left: 12, right: 12, zIndex: 20,
            background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
            borderRadius: 10, padding: 6, marginTop: 4,
            boxShadow: '0 12px 32px -8px hsl(220 30% 15% / .18)',
          }}>
            {BRANCHES.map(b => {
              const active = b.id === branch.id;
              return (
                <button key={b.id} onClick={() => { setBranch(b); setBranchOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 7, border: 0, cursor: 'pointer',
                    background: active ? adminTokens.orangeSoft : 'transparent',
                    fontFamily: 'inherit', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = adminTokens.subtle)}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? adminTokens.orange : adminTokens.black }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 1 }}>{b.sub}</div>
                  </span>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={adminTokens.orange} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Search (⌘K) */}
      {!collapsed ? (
        <div style={{ padding: '0 12px 10px' }}>
          <div style={{
            height: 34, borderRadius: 9,
            background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
            padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={adminTokens.muted} strokeWidth="2.2">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
            </svg>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา หรือกด ⌘K…"
              style={{
                flex: 1, border: 0, outline: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: 12, color: adminTokens.black,
              }}/>
            {!search && (
              <kbd style={{
                fontSize: 9, fontWeight: 700, color: adminTokens.muted,
                background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                padding: '1px 5px', borderRadius: 4, fontFamily: 'inherit', letterSpacing: '.03em',
              }}>⌘K</kbd>
            )}
            {search && (
              <button onClick={() => setSearch('')} style={{
                border: 0, background: 'transparent', color: adminTokens.muted, cursor: 'pointer',
                fontSize: 14, lineHeight: 1, padding: 0,
              }}>×</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 10px 10px' }}>
          <button onClick={() => setCollapsed(false)} title="ค้นหา (⌘K)"
            style={{
              width: 48, height: 34, border: 0, borderRadius: 9, cursor: 'pointer',
              background: adminTokens.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: adminTokens.muted,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
            </svg>
          </button>
        </div>
      )}

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 10px 10px' : '0 12px 10px' }}>
        {searchResults ? (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
              color: adminTokens.mutedLight, padding: '6px 4px 6px',
            }}>{searchResults.length} รายการ</div>
            {searchResults.length === 0 && (
              <div style={{ fontSize: 12, color: adminTokens.muted, padding: '12px 4px' }}>ไม่พบผลลัพธ์</div>
            )}
            {searchResults.map(it => (
              <NavItem key={it.id} it={it} active={page === it.id} collapsed={false}
                onClick={() => { setPage(it.id); setSearch(''); }}/>
            ))}
          </div>
        ) : (
          <>
            {/* Pins */}
            {!collapsed && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 4px 4px',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: adminTokens.mutedLight,
                }}>ปักหมุด</span>
                <span style={{ fontSize: 9, color: adminTokens.mutedLight, fontWeight: 600 }}>ลากจัด</span>
              </div>
            )}
            {pinItems.map(it => (
              <NavItem key={it.id} it={it} active={page === it.id} collapsed={collapsed}
                onClick={() => setPage(it.id)}/>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: adminTokens.border, margin: '12px 4px' }}/>

            {/* Groups */}
            {NAV_GROUPS.map(g => {
              const isOpen = !!openGroups[g.id];
              const groupHasUrgent = g.items.some(i => i.urgent);
              return (
                <div key={g.id} style={{ marginBottom: 2 }}>
                  {!collapsed ? (
                    <button onClick={() => setOpenGroups(o => ({ ...o, [g.id]: !o[g.id] }))}
                      style={{
                        width: '100%', padding: '6px 4px', border: 0, background: 'transparent',
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: adminTokens.mutedLight,
                      }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                        flex: 1, textAlign: 'left',
                      }}>{g.label}</span>
                      {groupHasUrgent && !isOpen && (
                        <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'hsl(0 72% 55%)' }}/>
                      )}
                    </button>
                  ) : (
                    <div style={{ height: 1, background: adminTokens.border, margin: '8px 6px' }}/>
                  )}
                  {(isOpen || collapsed) && g.items.map(it => (
                    <NavItem key={it.id} it={it} active={page === it.id} collapsed={collapsed}
                      onClick={() => setPage(it.id)}/>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Attention card */}
      {!collapsed && !searchResults && (
        <div style={{ padding: '8px 12px 10px' }}>
          <div style={{
            background: adminTokens.subtle, borderRadius: 11,
            border: `1px solid ${adminTokens.border}`,
            padding: 10,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
              color: adminTokens.black, marginBottom: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'hsl(0 72% 55%)', animation: 'admin-pulse 1.6s ease-in-out infinite' }}/>
              ต้องดูวันนี้
            </div>
            {ATTENTION.map((a, i) => (
              <button key={i} onClick={() => setPage(a.go)}
                style={{
                  width: '100%', padding: '6px 4px', border: 0, background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.background = adminTokens.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: a.color.replace(')', ' / .14)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color,
                }}>
                  <SBIcon d={a.icon} size={11} stroke={2.2}/>
                </span>
                <span style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: adminTokens.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: adminTokens.mutedLight }}>{a.sub}</div>
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={adminTokens.mutedLight} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User footer */}
      <div style={{
        borderTop: `1px solid ${adminTokens.border}`, padding: collapsed ? '10px' : '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: collapsed ? 32 : 30, height: collapsed ? 32 : 30, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, hsl(222 30% 20%), hsl(222 30% 35%))',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, margin: collapsed ? '0 auto' : 0,
        }}>KP</div>
        {!collapsed && <>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kongphop S.</div>
            <div style={{ fontSize: 10, color: adminTokens.mutedLight }}>ผู้จัดการสาขา</div>
          </div>
          <button title="การแจ้งเตือน" style={{
            width: 28, height: 28, border: 0, borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: adminTokens.muted, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = adminTokens.subtle; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <SBIcon d={aIcons.bell} size={14}/>
            <span style={{
              position: 'absolute', top: 4, right: 5, width: 6, height: 6, borderRadius: 9999,
              background: adminTokens.orange, boxShadow: `0 0 0 2px ${adminTokens.surface}`,
            }}/>
          </button>
        </>}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} title="ขยาย"
          style={{
            position: 'absolute', top: 20, right: -11, zIndex: 5,
            width: 22, height: 22, borderRadius: 9999, border: `1px solid ${adminTokens.border}`,
            background: adminTokens.surface, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: adminTokens.muted, boxShadow: '0 4px 10px -2px hsl(220 30% 15% / .1)',
          }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
    </div>
  );
};

/* =============================================================
 *  MODERN TOP BAR — command bar + date + quick actions + avatar
 * =========================================================== */
const ModernTopBar = ({ breadcrumb = 'แดชบอร์ด' }) => (
  <div style={{
    height: 60, background: adminTokens.surface,
    borderBottom: `1px solid ${adminTokens.border}`,
    display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: adminTokens.black, whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '-.01em' }}>
      <span>{breadcrumb}</span>
    </div>

    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        height: 38, width: '100%', maxWidth: 420,
        background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
        borderRadius: 10, padding: '0 12px',
        display: 'flex', alignItems: 'center', gap: 8, color: adminTokens.muted,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
        </svg>
        <input placeholder="ค้นหาสมาชิก, คลาส, แพ็คเกจ…" style={{
          border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit',
          fontSize: 13, color: adminTokens.black, flex: 1,
        }}/>
        <kbd style={{
          fontSize: 10, fontWeight: 700, color: adminTokens.muted,
          background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
          padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
        }}>⌘K</kbd>
      </div>
    </div>

    <button style={{
      height: 38, padding: '0 12px', borderRadius: 10, cursor: 'pointer',
      background: adminTokens.subtle, border: `1px solid ${adminTokens.border}`,
      color: adminTokens.black, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <A_Icon d={aIcons.cal} size={14}/>
      วันนี้, 19 เม.ย.
    </button>

    <button style={{
      height: 38, padding: '0 14px', borderRadius: 10, cursor: 'pointer',
      background: adminTokens.orange, color: '#fff', border: 0,
      fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
      boxShadow: adminTokens.shadowOrange,
    }}>
      <A_Icon d={aIcons.qr} size={14} stroke={2.4}/>
      เช็คอิน
    </button>

    <div style={{ width: 1, height: 24, background: adminTokens.border }}/>

    <button style={{ background: 'transparent', border: 0, width: 36, height: 36, borderRadius: 10,
                     color: adminTokens.muted, cursor: 'pointer', display: 'flex',
                     alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <A_Icon d={aIcons.bell} size={18}/>
      <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
                     background: adminTokens.destr, border: `2px solid ${adminTokens.surface}` }}/>
    </button>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '4px 8px 4px 4px', borderRadius: 10, flexShrink: 0,
                  border: `1px solid ${adminTokens.border}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 8,
                    background: `linear-gradient(135deg, ${adminTokens.orange}, ${adminTokens.orangeDeep})`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 11 }}>KS</div>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: adminTokens.black, whiteSpace: 'nowrap' }}>Kongphop S.</div>
        <div style={{ fontSize: 10, color: adminTokens.muted, whiteSpace: 'nowrap' }}>Owner</div>
      </div>
      <A_Icon d={aIcons.chev} size={12}/>
    </div>
  </div>
);

/* =============================================================
 *  LIVE PULSE CARD — hero stat with sparkline
 * =========================================================== */
const Sparkline = ({ data, color, height = 38, fill = true }) => {
  const w = 160, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const area = `M0 ${h} L${pts.map(p => p.join(' ')).join(' L')} L${w} ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi,'')})`}/>
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const LivePulseCard = () => (
  <div style={{
    background: `linear-gradient(135deg, hsl(222 30% 10%) 0%, hsl(222 30% 14%) 100%)`,
    borderRadius: adminTokens.r3, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden',
    boxShadow: adminTokens.shadowLg,
  }}>
    <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180,
                  borderRadius: '50%', background: `radial-gradient(circle, ${adminTokens.orange} 0%, transparent 70%)`,
                  opacity: 0.2, pointerEvents: 'none' }}/>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: adminTokens.teal,
                     boxShadow: `0 0 0 4px hsl(168 75% 42% / 0.25)`, animation: 'admin-pulse 1.6s infinite' }}/>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                     color: 'hsl(168 75% 62%)' }}>LIVE · สาขาอโศก</span>
    </div>
    <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 160 }}>
        <div style={{ fontSize: 11, color: 'hsl(220 14% 65%)', marginBottom: 4, whiteSpace: 'nowrap' }}>เช็คอินวันนี้</div>
        <div style={{ fontSize: 42, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-.02em' }}>42</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(168 75% 62%)', marginTop: 6, whiteSpace: 'nowrap' }}>↑ +12% จากสัปดาห์ก่อน</div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 11, color: 'hsl(220 14% 65%)', marginBottom: 4, whiteSpace: 'nowrap' }}>เทรนด์ 12 ชั่วโมง</div>
        <Sparkline data={[2,4,3,6,8,12,18,22,28,31,35,42]} color={adminTokens.orange} height={54}/>
      </div>
      <div style={{ textAlign: 'right', minWidth: 120 }}>
        <div style={{ fontSize: 11, color: 'hsl(220 14% 65%)', marginBottom: 4, whiteSpace: 'nowrap' }}>กำลังอยู่ในยิม</div>
        <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>18<span style={{ fontSize: 14, color: 'hsl(220 14% 65%)', fontWeight: 600 }}> / 60</span></div>
        <div style={{ fontSize: 10, color: 'hsl(220 14% 65%)', marginTop: 4, whiteSpace: 'nowrap' }}>ความจุสูงสุด</div>
      </div>
    </div>
  </div>
);

/* =============================================================
 *  REVENUE CHART — 12-week area
 * =========================================================== */
const RevenueChart = () => {
  const data = [82, 78, 88, 95, 90, 105, 118, 112, 125, 138, 128, 142]; // ฿k
  const labels = ['ม.ค.','','ก.พ.','','มี.ค.','','เม.ย.','','พ.ค.','','มิ.ย.',''];
  const w = 560, h = 180, pad = { t: 20, r: 14, b: 24, l: 32 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const max = 150, min = 60;
  const range = max - min;
  const pts = data.map((v, i) => [
    pad.l + (i / (data.length - 1)) * cw,
    pad.t + ch - ((v - min) / range) * ch,
  ]);
  const path = pts.map((p,i) => (i?'L':'M') + p[0] + ' ' + p[1]).join(' ');
  const area = path + ` L${pts[pts.length-1][0]} ${pad.t+ch} L${pts[0][0]} ${pad.t+ch} Z`;

  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, padding: 20, boxShadow: adminTokens.shadowSm,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: adminTokens.muted, fontWeight: 600, marginBottom: 4 }}>รายได้ 6 เดือน</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: adminTokens.black, letterSpacing: '-.02em' }}>
            ฿1,241,300
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ background: adminTokens.successSoft, color: adminTokens.success,
                           padding: '2px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>↑ +18.4%</span>
            <span style={{ fontSize: 11, color: adminTokens.muted }}>เทียบช่วงก่อนหน้า</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7วัน','30วัน','90วัน','6ด.'].map((t,i) => (
            <button key={t} style={{
              height: 28, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${i === 3 ? adminTokens.orange : adminTokens.border}`,
              background: i === 3 ? adminTokens.orangeSoft : adminTokens.surface,
              color: i === 3 ? adminTokens.orange : adminTokens.muted,
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            }}>{t}</button>
          ))}
        </div>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="rev-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={adminTokens.orange} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={adminTokens.orange} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* grid */}
        {[0,1,2,3].map(i => {
          const y = pad.t + (i / 3) * ch;
          const val = max - (i / 3) * range;
          return (
            <g key={i}>
              <line x1={pad.l} x2={w-pad.r} y1={y} y2={y} stroke={adminTokens.divider} strokeDasharray="2 4"/>
              <text x={pad.l - 8} y={y + 3} fontSize="10" fill={adminTokens.mutedLight} textAnchor="end">฿{val}k</text>
            </g>
          );
        })}
        {/* area + line */}
        <path d={area} fill="url(#rev-area)"/>
        <path d={path} fill="none" stroke={adminTokens.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length-1 ? 5 : 0} fill={adminTokens.orange} stroke="#fff" strokeWidth="2"/>
        ))}
        {/* x labels */}
        {labels.map((lbl, i) => lbl ? (
          <text key={i} x={pad.l + (i / (data.length - 1)) * cw} y={h - 6} fontSize="10"
                fill={adminTokens.muted} textAnchor="middle">{lbl}</text>
        ) : null)}
      </svg>
    </div>
  );
};

/* =============================================================
 *  ACTIVITY FEED
 * =========================================================== */
const ActivityFeed = () => {
  const events = [
    { t: '2 นาที', kind: 'checkin', who: 'Ploy Chanakarn', what: 'เช็คอินเข้าคลาส HIIT Express', color: adminTokens.teal, icon: aIcons.door },
    { t: '8 นาที', kind: 'sale',    who: 'Arm Siriwat',    what: 'ต่ออายุแพ็คเกจ Unlimited · ฿3,500', color: adminTokens.orange, icon: aIcons.cash },
    { t: '15 นาที',kind: 'signup',  who: 'Mook Thana',     what: 'สมาชิกใหม่ · มาจากโปร Instagram', color: adminTokens.info, icon: aIcons.userOne },
    { t: '28 นาที',kind: 'alert',   who: 'ระบบ',           what: 'คลาส "Yoga Flow 18:30" เต็มแล้ว', color: adminTokens.warn, icon: aIcons.alert },
    { t: '42 นาที',kind: 'review',  who: 'Joe L.',         what: 'ให้คะแนน Coach Best ★★★★★', color: adminTokens.pink, icon: aIcons.star },
    { t: '1 ชม.', kind: 'checkin', who: 'Natty Prach',    what: 'เช็คอินเข้ายิม', color: adminTokens.teal, icon: aIcons.door },
  ];
  return (
    <div style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, boxShadow: adminTokens.shadowSm,
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: `1px solid ${adminTokens.border}` }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.activity} size={16}/></span>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1, color: adminTokens.black }}>กิจกรรมล่าสุด</div>
        <button style={{ background: 'transparent', border: 0, color: adminTokens.orange,
                         fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                         display: 'flex', alignItems: 'center', gap: 2 }}>
          ดูทั้งหมด <A_Icon d={aIcons.chevR} size={12}/>
        </button>
      </div>
      <div style={{ padding: '6px 0' }}>
        {events.map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 18px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `${e.color}22`, color: e.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <A_Icon d={e.icon} size={15} stroke={2.2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: adminTokens.black, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>{e.who}</span>
                <span style={{ color: adminTokens.ink2 }}> — {e.what}</span>
              </div>
              <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 2 }}>{e.t}ที่แล้ว</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =============================================================
 *  CLASS SCHEDULE V2
 * =========================================================== */
const ClassScheduleV2 = () => {
  const rows = [
    { time: '07:00', dur: '60m', title: 'Spin · High Intensity', coach: 'Arm', coachColor: 'hsl(200 60% 55%)', room: 'ห้อง A', filled: 17, total: 20, status: 'done' },
    { time: '08:30', dur: '60m', title: 'Mobility + Stretch',    coach: 'Mild', coachColor: 'hsl(340 70% 60%)', room: 'ห้อง B', filled: 6, total: 12, status: 'done' },
    { time: '12:00', dur: '30m', title: 'HIIT Express',          coach: 'Best', coachColor: 'hsl(25 95% 55%)',  room: 'ห้อง A', filled: 14, total: 20, status: 'live' },
    { time: '17:00', dur: '60m', title: 'Strength · Lower body', coach: 'P',    coachColor: 'hsl(150 50% 50%)', room: 'ห้อง C', filled: 12, total: 20, status: 'upcoming' },
    { time: '18:30', dur: '60m', title: 'Yoga · Vinyasa Flow',   coach: 'Nok',  coachColor: 'hsl(270 60% 60%)', room: 'ห้อง B', filled: 18, total: 20, status: 'upcoming' },
  ];
  const statusPill = s => ({
    done:     { bg: adminTokens.subtle, fg: adminTokens.muted, t: 'เสร็จแล้ว' },
    live:     { bg: 'hsl(0 78% 60% / 0.12)', fg: adminTokens.destr, t: '● LIVE' },
    upcoming: { bg: adminTokens.infoSoft, fg: adminTokens.info, t: 'กำลังจะถึง' },
  }[s]);
  return (
    <div style={{ background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                  borderRadius: adminTokens.r3, overflow: 'hidden', boxShadow: adminTokens.shadowSm,
                  display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${adminTokens.border}`,
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.cal} size={16}/></span>
        <div style={{ fontSize: 14, fontWeight: 700, flex: 1, color: adminTokens.black }}>ตารางเรียนวันนี้</div>
        <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>{rows.length} คลาส · 67 จอง</span>
      </div>
      {rows.map((r, i) => {
        const sp = statusPill(r.status);
        const pct = (r.filled / r.total) * 100;
        const barColor = pct >= 100 ? adminTokens.destr : pct >= 80 ? adminTokens.warn : adminTokens.teal;
        return (
          <div key={i} style={{
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16,
            borderBottom: i < rows.length - 1 ? `1px solid ${adminTokens.divider}` : 'none',
            background: r.status === 'live' ? 'hsl(0 78% 60% / 0.03)' : 'transparent',
            transition: 'background .15s', cursor: 'pointer',
          }}>
            <div style={{ width: 64 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: adminTokens.black, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.01em' }}>{r.time}</div>
              <div style={{ fontSize: 10, color: adminTokens.mutedLight, marginTop: 1 }}>{r.dur}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black,
                               whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{r.title}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                               background: sp.bg, color: sp.fg, whiteSpace: 'nowrap', flexShrink: 0 }}>{sp.t}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: r.coachColor,
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 800 }}>{r.coach[0]}</div>
                <span style={{ fontSize: 11, color: adminTokens.muted }}>Coach {r.coach}</span>
                <span style={{ fontSize: 11, color: adminTokens.mutedLight }}>·</span>
                <span style={{ fontSize: 11, color: adminTokens.muted }}>{r.room}</span>
              </div>
            </div>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: adminTokens.muted, fontWeight: 600 }}>ความจุ</span>
                <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: adminTokens.black }}>
                  {r.filled}<span style={{ color: adminTokens.mutedLight, fontWeight: 500 }}>/{r.total}</span>
                </span>
              </div>
              <div style={{ height: 5, background: adminTokens.subtle, borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width .4s' }}/>
              </div>
            </div>
            <button style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${adminTokens.border}`,
              background: adminTokens.surface, cursor: 'pointer', color: adminTokens.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <A_Icon d={aIcons.chevR} size={14}/>
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* =============================================================
 *  MEMBERS TABLE V2
 * =========================================================== */
const MembersTableV2 = () => {
  const rows = [
    { name: 'Ploy Chanakarn', email: 'ploy@mail.com',   tier: 'gold',     pkg: 'Unlimited',  expires: '12 พ.ค.', risk: 'low',  last: '2 ชม.',  xp: 2840, color: 'hsl(330 80% 58%)' },
    { name: 'Arm Siriwat',    email: 'arm@mail.com',    tier: 'platinum', pkg: '20 คลาส',    expires: '28 เม.ย.',risk: 'low',  last: 'เมื่อวาน',xp: 4120, color: 'hsl(200 60% 55%)' },
    { name: 'Natty Prach',    email: 'natty@mail.com',  tier: 'silver',   pkg: 'รายเดือน',   expires: '21 เม.ย.',risk: 'high', last: '3 วัน',   xp: 1260, color: 'hsl(25 95% 55%)' },
    { name: 'Eve Kwan',       email: 'eve@mail.com',    tier: 'gold',     pkg: 'Unlimited',  expires: '03 มิ.ย.',risk: 'med',  last: '5 วัน',   xp: 1890, color: 'hsl(150 50% 50%)' },
    { name: 'Mook Thana',     email: 'mook@mail.com',   tier: 'gold',     pkg: '10 คลาส',    expires: '02 พ.ค.', risk: 'high', last: '14 วัน',  xp: 620,  color: 'hsl(270 60% 60%)' },
    { name: 'Joe L.',         email: 'joe@mail.com',    tier: 'bronze',   pkg: 'รายเดือน',   expires: '18 พ.ค.', risk: 'med',  last: '9 วัน',   xp: 340,  color: 'hsl(45 70% 50%)' },
  ];
  const tierStyle = {
    bronze:   { fg: 'hsl(30 50% 45%)',  bg: 'hsl(30 50% 45% / 0.15)',  emoji: '🥉', label: 'Bronze' },
    silver:   { fg: 'hsl(210 10% 55%)', bg: 'hsl(210 10% 65% / 0.18)', emoji: '🥈', label: 'Silver' },
    gold:     { fg: 'hsl(45 85% 42%)',  bg: 'hsl(45 85% 50% / 0.18)',  emoji: '🥇', label: 'Gold' },
    platinum: { fg: 'hsl(200 30% 45%)', bg: 'hsl(200 15% 75% / 0.22)', emoji: '💠', label: 'Platinum' },
  };
  const riskStyle = {
    low:  { fg: adminTokens.success, bg: adminTokens.successSoft, t: 'Low',  dot: adminTokens.success },
    med:  { fg: adminTokens.warn,    bg: adminTokens.warnSoft,    t: 'Med',  dot: adminTokens.warn },
    high: { fg: adminTokens.destr,   bg: adminTokens.destrSoft,   t: 'High', dot: adminTokens.destr },
  };
  return (
    <div style={{ background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
                  borderRadius: adminTokens.r3, overflow: 'hidden', boxShadow: adminTokens.shadowSm }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${adminTokens.border}`,
                    display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: adminTokens.orange, display: 'flex' }}><A_Icon d={aIcons.users} size={16}/></span>
        <div style={{ fontSize: 14, fontWeight: 700, color: adminTokens.black, flex: 1 }}>สมาชิกทั้งหมด</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ทั้งหมด','Active','Trial','หมดอายุ','เสี่ยง churn'].map((t, i) => (
            <button key={t} style={{
              height: 28, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${i === 0 ? adminTokens.orange : adminTokens.border}`,
              background: i === 0 ? adminTokens.orangeSoft : adminTokens.surface,
              color: i === 0 ? adminTokens.orange : adminTokens.muted,
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            }}>{t}</button>
          ))}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: adminTokens.subtle, color: adminTokens.muted,
                       fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <th style={{ textAlign: 'left', padding: '10px 18px', fontWeight: 700 }}>Member</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Tier</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Package</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Expires</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>XP</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Risk</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Last seen</th>
            <th style={{ width: 40 }}/>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ts = tierStyle[r.tier];
            const rs = riskStyle[r.risk];
            return (
              <tr key={i} style={{ borderTop: `1px solid ${adminTokens.divider}`, cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = adminTokens.subtle}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 18px', minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.color,
                                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 800 }}>
                      {r.name.split(' ').map(p=>p[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: adminTokens.black, whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: adminTokens.muted, whiteSpace: 'nowrap' }}>{r.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                                 padding: '3px 8px', borderRadius: 9999,
                                 background: ts.bg, color: ts.fg, fontWeight: 700, fontSize: 11 }}>
                    <span style={{ fontSize: 12 }}>{ts.emoji}</span>{ts.label}
                  </span>
                </td>
                <td style={{ padding: '12px', color: adminTokens.ink2, fontWeight: 500 }}>{r.pkg}</td>
                <td style={{ padding: '12px', color: adminTokens.ink2, fontVariantNumeric: 'tabular-nums' }}>{r.expires}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3,
                                 color: adminTokens.orange, fontWeight: 700,
                                 fontVariantNumeric: 'tabular-nums' }}>
                    <A_Icon d={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>} size={11} stroke={2.4}/>
                    {r.xp.toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                                 padding: '2px 8px', borderRadius: 9999,
                                 background: rs.bg, color: rs.fg, fontWeight: 700, fontSize: 11 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: rs.dot }}/>
                    {rs.t}
                  </span>
                </td>
                <td style={{ padding: '12px', color: adminTokens.muted }}>{r.last}</td>
                <td style={{ padding: '12px', color: adminTokens.mutedLight }}>
                  <A_Icon d={aIcons.chevR} size={14}/>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* =============================================================
 *  QUICK ACTION TILE
 * =========================================================== */
const QuickActionTile = ({ icon, label, sublabel, accent = 'orange' }) => {
  const accentMap = {
    orange: { fg: adminTokens.orange, bg: adminTokens.orangeSoft },
    teal:   { fg: adminTokens.teal,   bg: adminTokens.tealSoft },
    info:   { fg: adminTokens.info,   bg: adminTokens.infoSoft },
    pink:   { fg: adminTokens.pink,   bg: 'hsl(330 80% 58% / 0.12)' },
  };
  const a = accentMap[accent];
  return (
    <button style={{
      background: adminTokens.surface, border: `1px solid ${adminTokens.border}`,
      borderRadius: adminTokens.r3, padding: 14, cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
      transition: 'all .15s', boxShadow: adminTokens.shadowSm,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = a.fg; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = adminTokens.border; e.currentTarget.style.transform = 'none'; }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: a.bg, color: a.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <A_Icon d={icon} size={18} stroke={2.2}/>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: adminTokens.black }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: adminTokens.muted, marginTop: 1 }}>{sublabel}</div>}
      </div>
    </button>
  );
};

/* =============================================================
 *  SECTION HEADER (for page sub-sections)
 * =========================================================== */
const SectionHeaderA = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', margin: '0 0 2px' }}>
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: adminTokens.black, letterSpacing: '-.01em' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: adminTokens.muted, marginTop: 2 }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

Object.assign(window, {
  ModernSidebar, ModernTopBar, Sparkline, LivePulseCard, RevenueChart,
  ActivityFeed, ClassScheduleV2, MembersTableV2, QuickActionTile, SectionHeaderA,
});
