// Shared tokens, icons, and atoms for all three variations
// ElevenLabs-inspired: warm-white canvas, whisper-thin display, multi-layer shadows

const tokens = {
  bg: '#ffffff',
  bgAlt: '#f5f5f5',
  bgStone: 'rgba(245, 242, 239, 0.8)',
  bgStoneSolid: '#f5f2ef',
  ink: '#000000',
  inkSecondary: '#4e4e4e',
  inkMuted: '#777169',
  border: '#e5e5e5',
  borderSubtle: 'rgba(0,0,0,0.05)',
  // single accent: warm amber for opportunity + highlights
  amber: '#b45309',
  amberSoft: 'rgba(180, 83, 9, 0.08)',
  amberUnderline: 'rgba(180, 83, 9, 0.45)',
  // supporting accents for insight callouts
  purple: '#7c3aed',
  purpleSoft: 'rgba(124, 58, 237, 0.08)',
  // statuses kept small & desaturated
  green: '#16a34a',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  red: '#dc2626',
  redSoft: 'rgba(220, 38, 38, 0.06)',
  blue: '#2563eb',
  blueSoft: 'rgba(37, 99, 235, 0.08)',
};

const shadows = {
  insetEdge: 'rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset',
  outlineRing: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px',
  card: 'rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px',
  warmLift: 'rgba(78,50,23,0.04) 0px 6px 16px',
  composer: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(78,50,23,0.04) 0px 10px 24px',
};

// Display-weight approximation (since Waldenburg isn't web-available)
// Inter @ weight 200-300 with tight tracking = whisper-thin feel
const display = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  fontWeight: 300,
  letterSpacing: '-0.02em',
};
const body = {
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: '0.01em',
};

// ---------- Icons (stroke-based, 1.5px) ----------
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', sw = 1.5, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children || <path d={d} />}
  </svg>
);

const IconBack = (p) => <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IconMic = (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>;
const IconImage = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/></Icon>;
const IconSend = (p) => <Icon {...p}><path d="M4 12l16-8-6 18-3-7-7-3z"/></Icon>;
const IconBulb = (p) => <Icon {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.5 1 2.5h6c0-1 .3-1.9 1-2.5A6 6 0 0 0 12 3z"/></Icon>;
const IconChevron = (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>;
const IconChevronDown = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
const IconFolder = (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></Icon>;
const IconBook = (p) => <Icon {...p}><path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M4 16h14"/></Icon>;
const IconDot = ({ size = 8, color = '#000' }) => (
  <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 999, background: color }} />
);
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></Icon>;
const IconFilter = (p) => <Icon {...p}><path d="M4 5h16M7 12h10M10 19h4"/></Icon>;
const IconTag = (p) => <Icon {...p}><path d="M20 12l-8 8-8-8V4h8z"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></Icon>;
const IconClose = (p) => <Icon {...p}><path d="M6 6l12 12M18 6l-12 12"/></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IconQuote = (p) => <Icon {...p}><path d="M7 7h4v4H7zM7 11c0 3 2 4 4 4M13 7h4v4h-4zM13 11c0 3 2 4 4 4"/></Icon>;

// ---------- HPB-style logo (generic mark, not branded) ----------
const HPBLogo = ({ size = 28 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 4 C10 8, 6 16, 10 26 C14 34, 20 36, 20 36 C20 36, 26 34, 30 26 C34 16, 30 8, 20 4 Z" fill="none" stroke="#0f766e" strokeWidth="1.5"/>
      <path d="M15 16 C17 14, 20 14, 22 16 C24 18, 24 22, 22 24 C20 26, 17 26, 15 24" fill="none" stroke="#be123c" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="2" fill="#0f766e"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', color: '#0f766e' }}>HEALTH</span>
      <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', color: '#0f766e', marginTop: 2 }}>PROMOTION</span>
      <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', color: '#0f766e', marginTop: 2 }}>BOARD</span>
    </div>
  </div>
);

// ---------- Buttons ----------
const PillPrimary = ({ children, icon, style, ...p }) => (
  <button {...p} style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    height: 36, padding: '0 16px',
    background: tokens.ink, color: '#fff',
    border: 'none', borderRadius: 9999,
    fontFamily: body.fontFamily, fontSize: 14, fontWeight: 500,
    letterSpacing: '0.005em',
    cursor: 'pointer',
    boxShadow: shadows.card,
    ...style,
  }}>{icon}{children}</button>
);

const PillGhost = ({ children, icon, style, ...p }) => (
  <button {...p} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 32, padding: '0 12px',
    background: '#fff', color: tokens.ink,
    borderRadius: 9999,
    fontFamily: body.fontFamily, fontSize: 13, fontWeight: 500,
    border: 'none',
    boxShadow: shadows.outlineRing,
    cursor: 'pointer',
    ...style,
  }}>{icon}{children}</button>
);

const PillStone = ({ children, icon, style, ...p }) => (
  <button {...p} style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px 10px 14px',
    background: tokens.bgStone,
    color: tokens.ink,
    borderRadius: 30,
    fontFamily: body.fontFamily, fontSize: 13, fontWeight: 500,
    border: 'none',
    boxShadow: `${shadows.insetEdge}, ${shadows.warmLift}`,
    cursor: 'pointer',
    ...style,
  }}>{icon}{children}</button>
);

const Badge = ({ children, color = 'stone', style }) => {
  const palette = {
    stone: { bg: tokens.bgStone, fg: tokens.inkSecondary, dot: tokens.inkMuted },
    green: { bg: tokens.greenSoft, fg: '#166534', dot: tokens.green },
    red:   { bg: tokens.redSoft, fg: '#991b1b', dot: tokens.red },
    blue:  { bg: tokens.blueSoft, fg: '#1e40af', dot: tokens.blue },
    amber: { bg: tokens.amberSoft, fg: tokens.amber, dot: tokens.amber },
  }[color];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: palette.bg,
      color: palette.fg,
      borderRadius: 9999,
      fontSize: 12, fontWeight: 500, letterSpacing: '0.01em',
      boxShadow: shadows.insetEdge,
      ...style,
    }}>
      <IconDot size={6} color={palette.dot}/>
      {children}
    </span>
  );
};

// ---------- Top nav (shared across variations) ----------
const TopNav = ({ active = 'projects' }) => (
  <header style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px',
    background: '#fff',
    borderBottom: `1px solid ${tokens.borderSubtle}`,
    height: 64, boxSizing: 'border-box',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <HPBLogo/>
      <div style={{ width: 1, height: 28, background: tokens.border }}/>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { id: 'projects', label: 'Projects', icon: <IconFolder size={15}/> },
          { id: 'knowledge', label: 'Knowledge Base', icon: <IconBook size={15}/> },
        ].map(t => (
          <a key={t.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            color: active === t.id ? tokens.ink : tokens.inkSecondary,
            background: active === t.id ? tokens.bgAlt : 'transparent',
            fontFamily: body.fontFamily, fontSize: 14, fontWeight: 500,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>{t.icon}{t.label}</a>
        ))}
      </nav>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <PillGhost icon={<IconSearch size={14}/>}>Search</PillGhost>
      <PillPrimary icon={<IconPlus size={14}/>}>New Project</PillPrimary>
    </div>
  </header>
);

// ---------- Highlighted span (decorative underline) ----------
const Highlight = ({ children, onClick }) => (
  <span onClick={onClick} style={{
    cursor: 'pointer',
    backgroundImage: `linear-gradient(${tokens.amberUnderline}, ${tokens.amberUnderline})`,
    backgroundPosition: '0 100%',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 2px',
    paddingBottom: 2,
    color: tokens.ink,
    textDecoration: 'none',
  }}>{children}</span>
);

// ---------- Message bubbles ----------
const MsgInterviewer = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, maxWidth: '100%' }}>
    <div style={{
      maxWidth: '72%',
      background: tokens.bgAlt,
      color: tokens.ink,
      padding: '10px 16px',
      borderRadius: 18,
      fontFamily: body.fontFamily, fontSize: 14, lineHeight: 1.5,
      letterSpacing: '0.01em',
      boxShadow: shadows.insetEdge,
    }}>{children}</div>
    <div style={{
      width: 28, height: 28, borderRadius: 9999,
      background: '#fff', boxShadow: shadows.outlineRing,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.inkSecondary} strokeWidth="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>
    </div>
  </div>
);

const MsgRespondent = ({ children, initial = 'T' }) => (
  <div style={{ display: 'flex', gap: 10, maxWidth: '100%' }}>
    <div style={{
      width: 28, height: 28, borderRadius: 9999,
      background: tokens.bgStone,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontFamily: body.fontFamily, fontSize: 12, fontWeight: 600,
      color: tokens.inkSecondary,
      boxShadow: shadows.insetEdge,
    }}>{initial}</div>
    <div style={{
      maxWidth: '78%',
      background: '#fff',
      color: tokens.ink,
      padding: '14px 18px',
      borderRadius: 18,
      fontFamily: body.fontFamily, fontSize: 14, lineHeight: 1.65,
      letterSpacing: '0.01em',
      boxShadow: shadows.outlineRing,
    }}>{children}</div>
  </div>
);

// ---------- Composer ----------
const Composer = ({ style }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 8px 8px 16px',
    background: '#fff',
    borderRadius: 9999,
    boxShadow: shadows.composer,
    ...style,
  }}>
    <button style={{ width: 36, height: 36, borderRadius: 9999, background: tokens.bgAlt, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tokens.inkSecondary }}>
      <IconMic size={16}/>
    </button>
    <button style={{ width: 36, height: 36, borderRadius: 9999, background: tokens.bgAlt, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tokens.inkSecondary }}>
      <IconImage size={16}/>
    </button>
    <input
      placeholder="Type your message…"
      style={{
        flex: 1, border: 'none', outline: 'none',
        fontFamily: body.fontFamily, fontSize: 14,
        letterSpacing: '0.01em',
        background: 'transparent', color: tokens.ink,
        height: 36,
      }}/>
    <button style={{
      width: 36, height: 36, borderRadius: 9999,
      background: tokens.ink, color: '#fff', border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: shadows.card,
    }}><IconSend size={15}/></button>
  </div>
);

// ---------- Opportunity card (compact) ----------
const OpportunityCard = ({ quote, expanded = false, tags = [], reasoning, theme, style }) => (
  <div style={{
    background: '#fff',
    borderRadius: 14,
    padding: expanded ? '14px 16px' : '12px 14px',
    boxShadow: shadows.outlineRing,
    display: 'flex', flexDirection: 'column', gap: 10,
    cursor: 'pointer',
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: tokens.amberSoft,
        color: tokens.amber,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconBulb size={12}/>
      </div>
      <span style={{ fontFamily: body.fontFamily, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens.amber }}>Opportunity</span>
      <div style={{ flex: 1 }}/>
      <IconChevron size={13} stroke={tokens.inkMuted}/>
    </div>
    <div style={{ fontFamily: body.fontFamily, fontSize: 13, lineHeight: 1.5, color: tokens.ink, letterSpacing: '0.01em' }}>
      "{quote}"
    </div>
    {expanded && (
      <>
        {theme && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Badge color="amber" style={{ fontSize: 11 }}>{theme}</Badge>
            {tags.map(t => (
              <span key={t} style={{
                padding: '3px 9px',
                background: tokens.bgAlt,
                color: tokens.inkSecondary,
                borderRadius: 9999,
                fontSize: 11, fontWeight: 500,
                boxShadow: shadows.insetEdge,
              }}>{t}</span>
            ))}
          </div>
        )}
        {reasoning && (
          <div style={{
            padding: '10px 12px',
            background: tokens.bgAlt,
            borderRadius: 10,
            fontFamily: body.fontFamily, fontSize: 12, lineHeight: 1.55,
            color: tokens.inkSecondary, letterSpacing: '0.01em',
            boxShadow: shadows.insetEdge,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: tokens.inkMuted, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <IconSparkle size={10}/> AI reasoning
            </div>
            {reasoning}
          </div>
        )}
      </>
    )}
  </div>
);

// ---------- Session header ----------
const SessionHeader = ({ title, subtitle, status = 'in-progress', compact = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: compact ? '16px 28px' : '22px 28px',
    background: '#fff',
    borderBottom: `1px solid ${tokens.borderSubtle}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 12px',
        background: 'transparent',
        border: 'none',
        color: tokens.inkSecondary,
        fontFamily: body.fontFamily, fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
        borderRadius: 8,
      }}><IconBack size={14}/>Back</button>
      <div style={{ width: 1, height: 28, background: tokens.border }}/>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: '#0f766e', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: body.fontFamily, fontSize: 14, fontWeight: 600,
        boxShadow: shadows.insetEdge,
      }}>T</div>
      <div>
        <div style={{ ...display, fontSize: 20, lineHeight: 1.15, color: tokens.ink }}>{title}</div>
        {subtitle && <div style={{ ...body, fontSize: 12.5, color: tokens.inkMuted, marginTop: 3, letterSpacing: '0.01em' }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {status === 'in-progress' && <Badge color="blue">In Progress</Badge>}
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 14px',
        background: '#fff',
        color: tokens.red,
        border: 'none',
        borderRadius: 9999,
        fontFamily: body.fontFamily, fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
        boxShadow: `${shadows.insetEdge}, 0 0 0 1px ${tokens.redSoft}`,
      }}>End Session</button>
    </div>
  </div>
);

Object.assign(window, {
  tokens, shadows, display, body,
  IconBack, IconPlus, IconMic, IconImage, IconSend, IconBulb, IconChevron, IconChevronDown,
  IconFolder, IconBook, IconDot, IconSearch, IconFilter, IconTag, IconSparkle, IconClose, IconClock, IconQuote,
  HPBLogo, PillPrimary, PillGhost, PillStone, Badge,
  TopNav, Highlight, MsgInterviewer, MsgRespondent, Composer, OpportunityCard, SessionHeader,
});
