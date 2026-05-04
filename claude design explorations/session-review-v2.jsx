// Session Review V2 — improved post-session analysis screen.
// Adopts the platform-screens vocabulary: top sub-header with crumbs,
// left identity rail (session meta + participants + jump-to), main column.
// Compared to v1: tighter hero, persona cards combine quote+bullets+tag in a
// single clean block, comparison rendered as a compact matrix, transcript is
// collapsed by default with a clean "expand" affordance.

const { useState: useStateR2 } = React;

// ---- Data ----
const PERSONAS = [
  {
    id: 'self-blamer',
    initial: 'S',
    label: 'The Self-Blamer',
    accent: '#7c3aed',
    accentSoft: 'rgba(124, 58, 237, 0.08)',
    tags: ['RUMINATES', 'ISOLATES', 'HIGH-ACHIEVER'],
    bullets: [
      'Interprets stress as personal inadequacy; assumes others are coping better.',
      'Withdraws first, then rehearses what she "should have" said or done.',
      'Protects parents by presenting an "okay" version of herself at home.',
    ],
    footer: '"I don\'t want my mum to worry, and honestly I\'m not sure she\'d get it."',
  },
  {
    id: 'switch-off',
    initial: 'O',
    label: 'The Switch-Off',
    accent: '#0891b2',
    accentSoft: 'rgba(8, 145, 178, 0.08)',
    tags: ['AVOIDS', 'NUMBS', 'SCROLLS'],
    bullets: [
      'Goes straight to phone, games, or short-form video to reset after a bad day.',
      'Struggles to name feelings; prefers physical relief (food, sleep, screens).',
      'Returns to schoolwork late at night, which feeds a next-day fatigue loop.',
    ],
    footer: '"If I scroll for an hour I stop thinking about it. Then it\'s like 11 and I panic."',
  },
  {
    id: 'risk-checker',
    initial: 'R',
    label: 'The Risk-Checker',
    accent: '#b45309',
    accentSoft: 'rgba(180, 83, 9, 0.08)',
    tags: ['PROBES', 'TESTS', 'CAUTIOUS'],
    bullets: [
      'Tests trust with small disclosures before revealing anything meaningful.',
      'Watches how adults respond to "lighter" topics to predict how they\'ll react.',
      'Will open up fully only to one or two vetted people — often a peer, rarely family.',
    ],
    footer: '"I\'ll mention something small first. If they brush it off, that\'s my answer."',
  },
];

const COMPARISONS = [
  {
    id: 'agreements',
    label: 'Agreements',
    color: '#0f766e',
    colorSoft: 'rgba(15, 118, 110, 0.08)',
    items: [
      { text: 'School-related stress is the dominant trigger, but all three hide the intensity from family.', personas: ['self-blamer', 'switch-off', 'risk-checker'] },
      { text: 'Peers (not parents or teachers) are the first line of support when stress peaks.', personas: ['self-blamer', 'switch-off', 'risk-checker'] },
      { text: '"How are you?" is read as a formality, not a real invitation to talk.', personas: ['self-blamer', 'risk-checker'] },
    ],
  },
  {
    id: 'tensions',
    label: 'Tensions',
    color: '#b91c1c',
    colorSoft: 'rgba(185, 28, 28, 0.08)',
    items: [
      { text: 'Self-Blamer wants to be asked directly; Switch-Off experiences direct questions as pressure.', personas: ['self-blamer', 'switch-off'] },
      { text: 'Risk-Checker needs to test trust slowly; Self-Blamer waits for someone to "notice first".', personas: ['self-blamer', 'risk-checker'] },
      { text: 'Switch-Off relies on screens to decompress, then blames the screens when sleep slips.', personas: ['switch-off'] },
    ],
  },
  {
    id: 'gaps',
    label: 'Gaps',
    color: 'rgb(105, 105, 105)',
    colorSoft: 'rgb(237, 237, 237)',
    items: [
      { text: 'Peers (not parents or teachers) are the first line of support when stress peaks.', personas: ['self-blamer', 'switch-off', 'risk-checker'] },
      { text: 'No mention of a trusted adult outside the family — teachers are seen as authority, not support.', personas: ['self-blamer', 'switch-off'] },
    ],
  },
];

const RECOMMENDED_STEPS = [
  { n: 1, title: 'Prototype a "soft signal" — non-verbal way for youth to flag stress without a full conversation.', sub: 'Test with all three personas; watch for who uses it first and what the follow-up looks like.' },
  { n: 2, title: 'Interview 2–3 trusted non-family adults (coaches, older cousins, alumni mentors) to understand their access patterns.', sub: 'Target the gap surfaced in Switch-Off and Risk-Checker transcripts.' },
  { n: 3, title: 'Run a co-design session on "what a good check-in looks like" — split by persona, then merge.', sub: 'Surface and resolve the direct-question tension between Self-Blamer and Switch-Off.' },
];

const FG_QUESTIONS = [
  {
    q: 'When you\'re having a really bad day, what\'s the first thing you do?',
    answers: [
      { personaId: 'self-blamer', text: 'I go really quiet. I\'ll go to my room and just ', highlights: [{ key: 'sb-1', t: 'replay whatever happened in my head' }], tail: ' — like what I could have said differently. It takes me a while to actually do anything else.' },
      { personaId: 'switch-off', text: 'Honestly, phone. I\'ll put on a show or scroll until my brain stops. If I try to study right away I just stare at the page.', highlights: [{ key: 'so-1', t: '' }], tail: '' },
      { personaId: 'risk-checker', text: 'Depends who\'s around. If my mum asks, I\'ll say "tired". If my best friend texts, I\'ll ', highlights: [{ key: 'rc-1', t: 'send something small first to see how she responds' }], tail: '.' },
    ],
  },
  {
    q: 'Who do you actually tell when something\'s wrong?',
    answers: [
      { personaId: 'self-blamer', text: 'Usually nobody until it\'s been a few days. Then maybe one friend, and only the ', highlights: [{ key: 'sb-2', t: 'edited version' }], tail: '.' },
      { personaId: 'switch-off', text: 'My group chat, but we joke about it more than talk about it. I don\'t think I\'ve ever said "I\'m struggling" out loud.', highlights: [{ key: 'so-2', t: '' }], tail: '' },
      { personaId: 'risk-checker', text: 'One friend. She\'s been through similar things and she doesn\'t ', highlights: [{ key: 'rc-2', t: 'try to fix it straight away' }], tail: '. That\'s the test for me.' },
    ],
  },
  {
    q: 'What would it take for you to talk to an adult about this?',
    answers: [
      { personaId: 'self-blamer', text: 'If they noticed first, maybe. I wouldn\'t bring it up — I\'d feel like I was ', highlights: [{ key: 'sb-3', t: 'making a big deal out of nothing' }], tail: '.' },
      { personaId: 'switch-off', text: 'I don\'t know. I feel like adults want a clear thing to fix, and I just have a vague "meh".', highlights: [{ key: 'so-3', t: '' }], tail: '' },
      { personaId: 'risk-checker', text: 'Time. I\'d need to watch how they react to smaller stuff first. ', highlights: [{ key: 'rc-3', t: 'Not a teacher — too risky.' }], tail: ' Maybe my aunt.' },
    ],
  },
  {
    q: 'What\'s one thing that actually helps when you\'re overwhelmed?',
    answers: [
      { personaId: 'self-blamer', text: 'Writing it down. Not to send — just for me. It slows the loop a bit.', highlights: [{ key: 'sb-4', t: '' }], tail: '' },
      { personaId: 'switch-off', text: 'Sleep. A nap fixes more than anything. But then I\'m up at midnight doing work.', highlights: [{ key: 'so-4', t: '' }], tail: '' },
      { personaId: 'risk-checker', text: 'Being with someone who doesn\'t expect me to explain. Quiet company, basically.', highlights: [{ key: 'rc-4', t: '' }], tail: '' },
    ],
  },
];

const SR2_JumpItem = ({ active, onClick, label, count }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', textAlign: 'left',
    padding: '8px 10px', marginLeft: -10,
    background: active ? tokens.bgAlt : 'transparent',
    border: 'none', borderRadius: 8,
    fontSize: 12.5, color: active ? tokens.ink : tokens.inkSecondary,
    fontWeight: active ? 500 : 400,
    cursor: 'pointer', letterSpacing: '0.01em',
    boxShadow: active ? shadows.insetEdge : 'none',
  }}>
    <span>{label}</span>
    {count != null && <span style={{ fontSize: 11, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace' }}>{count}</span>}
  </button>
);

const SR2_PersonaPanel = ({ p }) => (
  <div style={{
    background: '#fff', borderRadius: 16,
    boxShadow: shadows.outlineRing,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '14px 18px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: `1px solid ${tokens.borderSubtle}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9999,
        background: p.accent, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600, letterSpacing: '0.01em',
        boxShadow: shadows.insetEdge,
        flexShrink: 0,
      }}>{p.initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...display, fontSize: 16, color: tokens.ink, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{p.label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
          {p.tags.map(t => (
            <span key={t} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              padding: '2px 6px', borderRadius: 3,
              color: p.accent, background: p.accentSoft,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
      {p.bullets.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.55, color: tokens.inkSecondary, letterSpacing: '0.01em' }}>
          <IconDot size={5} color={p.accent}/>
          <span style={{ flex: 1 }}>{b}</span>
        </div>
      ))}
    </div>
    <div style={{
      margin: '0 18px 16px',
      padding: '10px 12px',
      background: p.accentSoft,
      borderRadius: 10,
      fontSize: 11.5, fontStyle: 'italic', color: tokens.inkSecondary,
      lineHeight: 1.55, letterSpacing: '0.01em',
      boxShadow: shadows.insetEdge,
    }}>
      {p.footer}
    </div>
  </div>
);

// Compact signal/tension/gap row — icon + text + chips
const SR2_CompareRow = ({ item, color }) => (
  <div style={{
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: '12px 14px',
    background: '#fff', borderRadius: 12,
    boxShadow: shadows.outlineRing,
  }}>
    <span style={{
      width: 22, height: 22, borderRadius: 6,
      background: 'rgba(0,0,0,0.02)', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: shadows.insetEdge,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }}/>
    </span>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: tokens.ink, letterSpacing: '0.01em' }}>{item.text}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {item.personas.map(pid => {
          const pp = PERSONAS.find(x => x.id === pid);
          return (
            <span key={pid} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 9px 2px 3px',
              background: '#fff', borderRadius: 9999,
              fontSize: 10.5, fontWeight: 600, color: pp.accent,
              boxShadow: shadows.insetEdge, letterSpacing: '0.01em',
            }}>
              <span style={{ width: 14, height: 14, borderRadius: 9999, background: pp.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700 }}>{pp.initial}</span>
              {pp.label.replace('The ', '')}
            </span>
          );
        })}
      </div>
    </div>
  </div>
);

// Mini transcript card (collapsed)
const SR2_TranscriptBlock = ({ block, open, onToggle }) => (
  <div style={{
    background: '#fff', borderRadius: 14,
    boxShadow: shadows.outlineRing,
    overflow: 'hidden',
  }}>
    <button onClick={onToggle} style={{
      width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      background: 'transparent', border: 'none', cursor: 'pointer',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: tokens.bgStoneSolid, color: tokens.inkSecondary,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: shadows.insetEdge,
      }}>
        <IconQuote size={11}/>
      </span>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: tokens.ink, letterSpacing: '0.01em' }}>"{block.q}"</span>
      <span style={{ fontSize: 11, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace' }}>{block.answers.length} answers</span>
      <IconChevronDown size={13} stroke={tokens.inkMuted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}/>
    </button>
    {open && (
      <div style={{ padding: '4px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {block.answers.map((ans, j) => {
          const pp = PERSONAS.find(x => x.id === ans.personaId);
          return (
            <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 9999,
                background: pp.accent, color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                flexShrink: 0, boxShadow: shadows.insetEdge,
              }}>{pp.initial}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: pp.accent, letterSpacing: '0.01em', marginBottom: 4 }}>{pp.label}</div>
                <div style={{
                  fontSize: 12.5, lineHeight: 1.7, color: tokens.inkSecondary,
                  letterSpacing: '0.01em',
                }}>
                  {ans.text}
                  {ans.highlights.map(h => (
                    <span key={h.key} style={{
                      backgroundImage: `linear-gradient(${tokens.amberUnderline}, ${tokens.amberUnderline})`,
                      backgroundPosition: '0 100%', backgroundRepeat: 'no-repeat', backgroundSize: '100% 2px',
                      paddingBottom: 2, color: tokens.ink,
                    }}>{h.t}</span>
                  ))}
                  {ans.tail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const SessionReviewV2 = () => {
  const [openIdx, setOpenIdx] = useStateR2(0);
  const totalOpps = 6;

  return (
    <div style={{
      width: 1440, minHeight: 1600,
      background: tokens.bgAlt,
      fontFamily: body.fontFamily, color: tokens.ink,
      display: 'flex', flexDirection: 'column',
    }}>
      <TopNav active="projects"/>

      {/* Sub-header */}
      <div style={{
        padding: '14px 32px', background: '#fff',
        borderBottom: `1px solid ${tokens.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 28, padding: '0 10px', marginLeft: -10,
            background: 'transparent', border: 'none',
            color: tokens.inkMuted, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', borderRadius: 8,
          }}><IconBack size={12}/>Back</button>
          <div style={{ width: 1, height: 22, background: tokens.border }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: tokens.inkMuted, fontWeight: 500, letterSpacing: '0.01em' }}>
            <span>Youth Wellbeing SG</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span>Sessions</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ color: tokens.ink, fontWeight: 600 }}>Focus Group · Review</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PillGhost icon={<IconBook size={12}/>}>View summary</PillGhost>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 14px',
            background: tokens.ink, color: '#fff',
            border: 'none', borderRadius: 9999,
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer', boxShadow: shadows.card,
          }}><IconSparkle size={12}/>Analyse technique</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', flex: 1, minHeight: 0 }}>
        {/* LEFT rail */}
        <aside style={{ background: '#fff', borderRight: `1px solid ${tokens.borderSubtle}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '22px 22px 18px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge color="green">Complete</Badge>
              <span style={{ fontSize: 11, color: tokens.inkMuted }}>· 38 min</span>
            </div>
            <div style={{ ...display, fontSize: 22, lineHeight: 1.15 }}>Youth Coping<br/>Styles</div>
            <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 10, lineHeight: 1.55, letterSpacing: '0.01em' }}>
              Three youths walked through stress, support, and self-talk.
            </div>
          </div>

          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.inkMuted, marginBottom: 10 }}>Session</div>
            <MetaRow k="Questions" v="4"/>
            <MetaRow k="Participants" v="3"/>
            <MetaRow k="Opportunities" v={String(totalOpps)}/>
            <MetaRow k="Recorded" v="22 Apr, 16:20"/>
          </div>

          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.inkMuted, marginBottom: 10 }}>Participants</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PERSONAS.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 9999,
                    background: p.accent, color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, boxShadow: shadows.insetEdge,
                  }}>{p.initial}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: tokens.ink, letterSpacing: '0.01em' }}>{p.label}</div>
                    <div style={{ fontSize: 10.5, color: tokens.inkMuted, letterSpacing: '0.05em' }}>{p.tags[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.inkMuted, marginBottom: 6 }}>Jump to</div>
            <SR2_JumpItem label="Participant summaries" count={3}/>
            <SR2_JumpItem label="Cross-profile compare" count={8}/>
            <SR2_JumpItem label="Recommended steps" count={3}/>
            <SR2_JumpItem label="Transcript" count={4}/>
          </div>

          <div style={{ flex: 1 }}/>
        </aside>

        {/* MAIN */}
        <main style={{ padding: '32px 40px 72px', overflow: 'hidden' }}>

          {/* Hero headline */}
          <div style={{ maxWidth: 820, marginBottom: 28 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.inkMuted, marginBottom: 8 }}>Session review</div>
            <h1 style={{ ...display, fontSize: 34, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Three youths, three very different ways of hiding stress.
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: tokens.inkSecondary, marginTop: 14, letterSpacing: '0.01em' }}>
              Each participant cycles away from direct disclosure — one ruminates, one numbs out, one probes for safety. Support patterns that assume "open conversation" will miss all three.
            </p>
          </div>

          {/* Participant summaries */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <IconTag size={13} stroke={tokens.inkMuted}/>
              <div style={{ ...display, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>Participant summaries</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {PERSONAS.map(p => <SR2_PersonaPanel key={p.id} p={p}/>)}
            </div>
          </section>

          {/* Cross-profile */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <IconQuote size={13} stroke={tokens.inkMuted}/>
              <div style={{ ...display, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>Cross-profile compare</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {COMPARISONS.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: c.colorSoft, borderRadius: 10,
                    boxShadow: shadows.insetEdge,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }}/>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.color }}>{c.label}</span>
                    <span style={{ flex: 1 }}/>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.color, fontFamily: 'ui-monospace, monospace' }}>{c.items.length}</span>
                  </div>
                  {c.items.map((it, i) => <SR2_CompareRow key={i} item={it} color={c.color}/>)}
                </div>
              ))}
            </div>
          </section>

          {/* Recommended steps */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <IconBulb size={13} stroke={tokens.inkMuted}/>
              <div style={{ ...display, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>Recommended next steps</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {RECOMMENDED_STEPS.map(s => (
                <div key={s.n} style={{
                  background: '#fff', borderRadius: 14,
                  padding: '16px 18px',
                  boxShadow: shadows.outlineRing,
                  display: 'flex', flexDirection: 'column', gap: 10,
                  position: 'relative',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    alignSelf: 'flex-start',
                    background: 'rgb(237, 237, 237)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600,
                    color: 'rgb(105, 105, 105)', letterSpacing: '0.1em',
                  }}>STEP {s.n.toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: tokens.ink, lineHeight: 1.45, letterSpacing: '0.01em' }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: tokens.inkMuted, lineHeight: 1.6, letterSpacing: '0.01em' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Transcript — collapsed blocks */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <IconQuote size={13} stroke={tokens.inkMuted}/>
              <div style={{ ...display, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>Transcript</div>
              <span style={{ flex: 1 }}/>
              <span style={{ fontSize: 11.5, color: tokens.inkMuted, letterSpacing: '0.01em' }}>Tap a question to expand</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FG_QUESTIONS.map((block, i) => (
                <SR2_TranscriptBlock
                  key={i}
                  block={block}
                  open={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                />
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 32px',
        background: '#fff',
        borderTop: `1px solid ${tokens.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11.5, color: tokens.inkMuted, letterSpacing: '0.01em',
      }}>
        <span>HPB · 2026 · Aleph Pte Ltd.</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <a style={{ color: tokens.inkMuted, textDecoration: 'none' }}>Terms of Use</a>
          <a style={{ color: tokens.inkMuted, textDecoration: 'none' }}>Privacy Statement</a>
        </span>
      </div>
    </div>
  );
};

window.SessionReviewV2 = SessionReviewV2;
