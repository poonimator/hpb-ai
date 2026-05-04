// Variation B — Interactive workspace
// Transcript document with Q (interviewer) + T (participant) turns.
// Clicking a transcript highlight expands that opportunity on the right.
// Clicking an opportunity scrolls to + pulses the matching highlight in the transcript.

const { useState: useStateB, useRef: useRefB, useEffect: useEffectB } = React;

// ---- Data: opportunities + transcript share `oppId` refs ----
const OPPORTUNITIES = [
  {
    id: 'opp-1',
    quote: 'depends what you mean lah.',
    theme: 'Nutrition visibility',
    tags: ['Framing', 'Parent hedging'],
    reasoning: 'Parent immediately reframes the question — signals that "eating well" is context-dependent in their mind, not a binary. Opportunity to present nutrition as a per-context score (home vs school vs outside).',
    hypothesis: 'Parents will engage with a nutrition tool more when it scores eating by context (home / school / outside) instead of a single overall rating.',
    exploring: 'Worth asking which contexts feel most under their control and which feel like blind spots — the split there is where the product should focus.',
    time: '00:12:58',
  },
  {
    id: 'opp-2',
    quote: "school lunchtime I honestly don't know.",
    theme: 'Nutrition visibility',
    tags: ['School', 'Parent blind spot'],
    reasoning: "Parent admits a visibility gap at school lunchtime — a concrete unmet need. Opportunity for a lightweight school-hours check-in surfaced to guardians, or a canteen-purchase nudge.",
    hypothesis: 'Parents will opt into a passive school-hours food signal (e.g. canteen receipts) if it requires zero action from their child.',
    exploring: 'Worth probing how much visibility feels reassuring vs. surveilling — where is the line between “I just want to know” and “I’m watching them”.',
    time: '00:13:24',
  },
  {
    id: 'opp-3',
    quote: "homework first—this is our rule, not negotiable.",
    theme: 'Parent control',
    tags: ['Explicit rule', 'Routine'],
    reasoning: 'Parent articulates a fixed, non-negotiable rule as the backbone of the daily routine. Opportunity to codify family rules into the app itself — so the rule, not the parent, is the enforcer.',
    hypothesis: 'Families with explicit, named rules will adopt a rules engine faster than families who negotiate case-by-case.',
    exploring: 'Worth asking which rules are stable vs. constantly re-negotiated — only the stable ones are safe to automate.',
    time: '00:15:18',
  },
  {
    id: 'opp-4',
    quote: 'the app will lock, so no need argue so much.',
    theme: 'Screen time rules',
    tags: ['Automation', 'Conflict avoidance'],
    reasoning: 'The value of the lock is not the lock itself — it is the removal of parent–child friction. Opportunity to position automation explicitly as "takes the parent out of the argument."',
    hypothesis: 'Parents will adopt lockdown features more readily when framed as conflict-reduction tools, not control tools.',
    exploring: 'Worth asking what the argument usually looks like — the shape of the fight tells you what the lock is really replacing.',
    time: '00:16:02',
  },
  {
    id: 'opp-5',
    quote: 'you show me what you\'re doing lor, if not later become YouTube already.',
    theme: 'Parent control',
    tags: ['Verification', 'Trust gap'],
    reasoning: 'Parent wants proof-of-task rather than blind trust during screen time allowances. Opportunity for a quick screen-share or activity receipt when device is unlocked "for schoolwork."',
    hypothesis: 'Parents will grant longer device access in exchange for a lightweight activity receipt that shows what was actually done.',
    exploring: 'Worth asking how much proof is enough — a glance at an app name, or an actual summary of the work session.',
    time: '00:17:10',
  },
  {
    id: 'opp-6',
    quote: 'at the hawker centre, whatever they want also cannot fully control',
    theme: 'Nutrition visibility',
    tags: ['Out-of-home eating'],
    reasoning: 'Recognition that control breaks down outside the home. Opportunity for gentle post-meal logging or suggestion cards ("pick one green thing next time") rather than real-time policing.',
    hypothesis: 'Retrospective, non-judgmental food logging will feel more acceptable than real-time interventions in out-of-home settings.',
    exploring: 'Worth asking what a “good enough” hawker meal looks like to them — their bar, not ours.',
    time: '00:18:44',
  },
];

// ---- Transcript: array of turns. Highlight tokens are {text, oppId} wrapped at render. ----
const TURNS = [
  { role: 'Q', time: '00:12:40', text: 'Are 12–14 year olds eating well?' },
  { role: 'T', time: '00:12:58',
    parts: [
      { t: 'Eat well or not… ' },
      { t: 'depends what you mean lah.', oppId: 'opp-1' },
      { t: ' Like, at home dinner I can more or less control—got veg, got soup, they must sit down and eat properly, no phone at table. But ' },
      { t: "school lunchtime I honestly don't know.", oppId: 'opp-2' },
      { t: ' They tell me "ate already", sometimes it\'s like nuggets or fried thing, or just buy drink and snack. So if you ask overall, I wouldn\'t say "eating well" across the board lor—more like, sometimes okay, sometimes anyhow.' },
    ],
  },
  { role: 'Q', time: '00:14:01', text: 'What do you normally do after school?' },
  { role: 'T', time: '00:15:18',
    parts: [
      { t: 'After school ah… depends on the day. Usually they come home, shower, eat something small, then it\'s ' },
      { t: 'homework first—this is our rule, not negotiable.', oppId: 'opp-3' },
      { t: ' If got CCA then straight go CCA, come back later then do homework, then only can use phone or game a bit. Weekdays got cap one, and like during dinner time and before bed, ' },
      { t: 'the app will lock, so no need argue so much.', oppId: 'opp-4' },
      { t: ' Sometimes they say "need phone for school" then I\'m like… okay but ' },
      { t: "you show me what you're doing lor, if not later become YouTube already.", oppId: 'opp-5' },
    ],
  },
  { role: 'Q', time: '00:17:40', text: "Let's talk about weekends — does the routine change?" },
  { role: 'T', time: '00:18:00',
    parts: [
      { t: 'Weekend a bit more relax. Morning got tuition or sports, afternoon can be outside or friends\' house. If we go out makan, ' },
      { t: 'at the hawker centre, whatever they want also cannot fully control', oppId: 'opp-6' },
      { t: '—I just try to make sure got one vegetable plate on the table. Screen time also got but less strict, as long as no drama lor.' },
    ],
  },
  { role: 'Q', time: '00:19:15', text: 'And you — what was the hardest rule to put in place?' },
  { role: 'T', time: '00:19:40', text: 'Definitely the phone one. First two weeks, waah, every night got complain. But once the lock is automatic, they stop asking me. They argue with the phone, not with me. That\'s when I know it\'s working.' },
];

const VariantB = () => {
  const [activeOppId, setActiveOppId] = useStateB('opp-2');
  const [pulseQuoteId, setPulseQuoteId] = useStateB(null);
  const scrollRef = useRefB(null);
  const quoteRefs = useRefB({});

  // Scroll the transcript pane so the quote with oppId is visible.
  const scrollToQuote = (oppId) => {
    const el = quoteRefs.current[oppId];
    const scroller = scrollRef.current;
    if (!el || !scroller) return;
    const elTop = el.getBoundingClientRect().top;
    const scTop = scroller.getBoundingClientRect().top;
    scroller.scrollBy({ top: elTop - scTop - 140, behavior: 'smooth' });
  };

  const handlePickOpportunity = (oppId) => {
    setActiveOppId(oppId);
    setPulseQuoteId(oppId);
    scrollToQuote(oppId);
    setTimeout(() => setPulseQuoteId(null), 1600);
  };

  const handleHighlightClick = (oppId) => {
    setActiveOppId(oppId);
  };

  return (
    <div style={{
      width: 1440, height: 960,
      background: tokens.bgAlt,
      fontFamily: body.fontFamily,
      display: 'flex', flexDirection: 'column',
      color: tokens.ink,
    }}>
      <TopNav active="projects"/>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 400px', overflow: 'hidden' }}>
        <LeftSidebar/>

        {/* CENTER */}
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            padding: '16px 40px',
            background: tokens.bgAlt,
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: tokens.inkMuted, fontWeight: 500, letterSpacing: '0.01em' }}>Transcript · live</span>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: tokens.green, boxShadow: `0 0 0 3px ${tokens.greenSoft}` }}/>
            </div>
            <PillGhost icon={<IconSearch size={12}/>}>Find in transcript</PillGhost>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', background: tokens.bgAlt, scrollBehavior: 'smooth' }}>
            <div style={{
              maxWidth: 760, margin: '28px auto 160px',
              padding: '0 32px',
              display: 'flex', flexDirection: 'column', gap: 18,
            }}>
              {TURNS.map((turn, i) => (
                <ChatBubble
                  key={i}
                  turn={turn}
                  activeOppId={activeOppId}
                  pulseQuoteId={pulseQuoteId}
                  onHighlightClick={handleHighlightClick}
                  registerRef={(oppId, el) => { if (oppId) quoteRefs.current[oppId] = el; }}
                />
              ))}
            </div>
          </div>

          {/* Composer */}
          <div style={{
            position: 'absolute', bottom: 24, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            padding: '0 40px', pointerEvents: 'none',
          }}>
            <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 640 }}>
              <Composer/>
            </div>
          </div>
        </main>

        {/* RIGHT rail */}
        <RightRail
          opportunities={OPPORTUNITIES}
          activeOppId={activeOppId}
          onPick={handlePickOpportunity}
        />
      </div>
    </div>
  );
};

// ---- Moderator Guide sections (numbered, timed, with checklist of questions) ----
const MOD_GUIDE_SECTIONS = [
  {
    label: 'Opening questions',
    duration: '5 mins',
    questions: [
      { t: 'Tell me about yourself — your name, age, what you are studying/your job.', done: true },
      { t: 'Could you walk me through what a typical day in your life looks like, from morning to night?' },
      { t: 'What are some things you do in your free time?' },
    ],
  },
  {
    label: 'Lived experiences, motivations, barriers, and ecosystem influencers',
    duration: '20 mins',
    questions: [
      { t: '[If they did something] What made you do that?' },
      { t: 'How could you tell that you were feeling overwhelmed or stressed?' },
      { t: 'Who, if anyone, do you turn to when you feel that way — and what do they usually do?' },
    ],
  },
  {
    label: 'Reactions to concept directions',
    duration: '15 mins',
    questions: [
      { t: 'What\'s your first reaction to this?' },
      { t: 'What would you want this to do for you — or not do?' },
    ],
  },
];

const ModeratorGuide = () => {
  const totalCount = MOD_GUIDE_SECTIONS.reduce((acc, s) => acc + s.questions.length, 0);
  const coveredCount = MOD_GUIDE_SECTIONS.reduce((acc, s) => acc + s.questions.filter(q => q.done).length, 0);
  const pct = Math.round((coveredCount / totalCount) * 100);
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
      {/* Section label — matches 'Participant' style above */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10.5, color: tokens.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Moderator Guide</div>
        <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}>
          {coveredCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, width: '100%',
        background: tokens.bgAlt,
        borderRadius: 9999,
        overflow: 'hidden',
        marginBottom: 18,
        boxShadow: shadows.insetEdge,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: tokens.ink,
          borderRadius: 9999,
          transition: 'width 200ms ease',
        }}/>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {MOD_GUIDE_SECTIONS.map((sec, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10, fontWeight: 600,
                color: tokens.inkMuted,
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{
                flex: 1,
                fontFamily: body.fontFamily,
                fontSize: 11, fontWeight: 600,
                color: tokens.ink,
                letterSpacing: '0.02em',
                lineHeight: 1.45,
              }}>
                {sec.label}
                <span style={{ color: tokens.inkMuted, fontWeight: 400, marginLeft: 6, letterSpacing: '0.01em' }}>· {sec.duration}</span>
              </div>
            </div>
            <div style={{
              paddingLeft: 18,
              borderLeft: `1px solid ${tokens.border}`,
              marginLeft: 5,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {sec.questions.map((q, qi) => (
                <div key={qi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 9999,
                    background: q.done ? tokens.ink : 'transparent',
                    boxShadow: q.done ? 'none' : `inset 0 0 0 1px ${tokens.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 4,
                  }}>
                    {q.done && (
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10"/>
                      </svg>
                    )}
                  </div>
                  <div style={{
                    flex: 1,
                    fontFamily: body.fontFamily,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: q.done ? tokens.inkMuted : tokens.ink,
                    letterSpacing: '0.005em',
                    textDecoration: q.done ? 'line-through' : 'none',
                    textDecorationColor: q.done ? tokens.border : undefined,
                  }}>{q.t}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Left sidebar (unchanged shape, kept self-contained) ----
const LeftSidebar = () => (
  <aside style={{
    background: '#fff',
    borderRight: `1px solid ${tokens.borderSubtle}`,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', marginLeft: -8, marginBottom: 12,
        background: 'transparent', border: 'none',
        color: tokens.inkMuted, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', borderRadius: 6,
      }}><IconBack size={12}/>All sessions</button>
      <div style={{ ...display, fontSize: 22, lineHeight: 1.15 }}>
        The Rule-and-App<br/>Enforcer
      </div>
      <div style={{ fontSize: 12.5, color: tokens.inkMuted, marginTop: 8, lineHeight: 1.5, letterSpacing: '0.01em' }}>
        If it's not written down and controlled, it will slip.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <Badge color="blue">In Progress</Badge>
        <span style={{ fontSize: 11, color: tokens.inkMuted, letterSpacing: '0.01em' }}>· 21 min</span>
      </div>
    </div>

    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
      <div style={{ fontSize: 10.5, color: tokens.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Participant</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9999,
          background: '#0f766e', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600,
          boxShadow: shadows.insetEdge,
        }}>T</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Participant T · Parent</div>
          <div style={{ fontSize: 11.5, color: tokens.inkMuted, marginTop: 1 }}>Segment: Parent · SG</div>
        </div>
      </div>
    </div>

    <ModeratorGuide/>
    </div>

    <div style={{ padding: '12px 20px', borderTop: `1px solid ${tokens.borderSubtle}` }}>
      <button style={{
        width: '100%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: 34, padding: '0 12px',
        background: '#fff',
        color: tokens.red,
        border: 'none',
        borderRadius: 9999,
        fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
        boxShadow: `${shadows.insetEdge}, 0 0 0 1px ${tokens.redSoft}`,
      }}>End Session</button>
    </div>
  </aside>
);

// ---- Chat bubble (Q right / T left) ----
const ChatBubble = ({ turn, activeOppId, pulseQuoteId, onHighlightClick, registerRef }) => {
  const isQ = turn.role === 'Q';

  const content = turn.text ? turn.text : (
    turn.parts.map((p, i) => p.oppId ? (
      <InlineHighlight
        key={i}
        oppId={p.oppId}
        active={activeOppId === p.oppId}
        pulsing={pulseQuoteId === p.oppId}
        onClick={() => onHighlightClick(p.oppId)}
        registerRef={(el) => registerRef(p.oppId, el)}
      >{p.t}</InlineHighlight>
    ) : <React.Fragment key={i}>{p.t}</React.Fragment>)
  );

  if (isQ) {
    // Interviewer on the right
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            background: tokens.ink, color: '#fff',
            padding: '11px 16px',
            borderRadius: '18px 18px 4px 18px',
            fontSize: 14, lineHeight: 1.55,
            letterSpacing: '0.01em',
            boxShadow: shadows.card,
          }}>{content}</div>
          <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', marginRight: 6 }}>{turn.time}</span>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: 9999,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: shadows.outlineRing,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.inkSecondary} strokeWidth="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>
        </div>
      </div>
    );
  }

  // Participant on the left
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, alignItems: 'flex-end' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9999,
        background: '#0f766e', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600,
        flexShrink: 0,
        boxShadow: shadows.insetEdge,
      }}>T</div>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div style={{
          background: '#fff', color: tokens.ink,
          padding: '13px 18px',
          borderRadius: '18px 18px 18px 4px',
          fontSize: 14, lineHeight: 1.7,
          letterSpacing: '0.01em',
          boxShadow: shadows.outlineRing,
        }}>{content}</div>
        <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', marginLeft: 6 }}>{turn.time}</span>
      </div>
    </div>
  );
};

const InlineHighlight = ({ children, active, pulsing, onClick, registerRef }) => {
  const ref = useRefB(null);
  useEffectB(() => { if (ref.current) registerRef(ref.current); });
  return (
    <span
      ref={ref}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundImage: `linear-gradient(${tokens.amberUnderline}, ${tokens.amberUnderline})`,
        backgroundPosition: '0 100%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 2px',
        paddingBottom: 2,
        borderRadius: 3,
        transition: 'background-color 160ms ease, box-shadow 160ms ease',
        backgroundColor: pulsing ? 'rgba(180, 83, 9, 0.22)' : (active ? 'rgba(180, 83, 9, 0.10)' : 'transparent'),
        boxShadow: active && !pulsing ? `0 0 0 2px rgba(180,83,9,0.18)` : 'none',
        padding: (active || pulsing) ? '1px 4px 3px' : '0 0 2px',
        color: tokens.ink,
      }}>
      {children}
    </span>
  );
};

// ---- Right rail ----
const RightRail = ({ opportunities, activeOppId, onPick }) => {
  const [filter, setFilter] = useStateB('All');
  const filters = ['All', 'Nutrition', 'Parent control', 'Screen time'];
  const matchesFilter = (o) => {
    if (filter === 'All') return true;
    return o.theme.toLowerCase().includes(filter.toLowerCase());
  };
  const shown = opportunities.filter(matchesFilter);

  return (
    <aside style={{
      background: '#fff',
      borderLeft: `1px solid ${tokens.borderSubtle}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 20px 14px',
        borderBottom: `1px solid ${tokens.borderSubtle}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ ...display, fontSize: 18, lineHeight: 1.15 }}>Opportunities</div>
          <Badge color="amber">{opportunities.length} found</Badge>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {filters.map((t) => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '5px 11px',
              borderRadius: 9999,
              background: filter === t ? tokens.ink : '#fff',
              color: filter === t ? '#fff' : tokens.inkSecondary,
              border: 'none',
              fontSize: 11.5, fontWeight: 500,
              letterSpacing: '0.01em',
              boxShadow: filter === t ? shadows.card : shadows.insetEdge,
              cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((o) => (
          <RailCard
            key={o.id}
            opp={o}
            expanded={activeOppId === o.id}
            onClick={() => onPick(o.id)}
          />
        ))}
      </div>
    </aside>
  );
};

const RailCard = ({ opp, expanded, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff',
      borderRadius: 14,
      padding: expanded ? '14px 16px 16px' : '12px 14px',
      boxShadow: expanded
        ? `${shadows.outlineRing}, 0 0 0 1.5px ${tokens.amberUnderline}`
        : shadows.outlineRing,
      display: 'flex', flexDirection: 'column', gap: expanded ? 14 : 8,
      cursor: 'pointer',
      transition: 'box-shadow 160ms ease, padding 160ms ease',
    }}>
    {!expanded && (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 9999,
            background: tokens.amber,
            flexShrink: 0,
          }}/>
          <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}>{opp.time}</span>
          <div style={{ flex: 1 }}/>
          <IconChevronDown size={13} stroke={tokens.inkMuted}/>
        </div>
        <div style={{
          fontFamily: body.fontFamily, fontSize: 13.5, lineHeight: 1.5,
          color: tokens.ink, letterSpacing: '0.01em',
        }}>"{opp.quote}"</div>
      </>
    )}

    {expanded && (
      <>
        {/* Meta row — small marker + time + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 9999,
            background: tokens.amber,
            flexShrink: 0,
          }}/>
          <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}>{opp.time}</span>
          <div style={{ flex: 1 }}/>
          <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{
            width: 22, height: 22, border: 'none', background: 'transparent',
            color: tokens.inkMuted, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Amber-ruled quote */}
        <div style={{
          borderLeft: `2px solid ${tokens.amberUnderline}`,
          paddingLeft: 12,
          marginLeft: 2,
        }}>
          <div style={{
            fontFamily: body.fontFamily,
            fontSize: 14, lineHeight: 1.5,
            color: tokens.ink,
            fontStyle: 'italic',
            letterSpacing: '0.01em',
          }}>"{opp.quote}"</div>
        </div>

        {/* Reasoning prose */}
        <div style={{
          fontFamily: body.fontFamily,
          fontSize: 13.5, lineHeight: 1.6,
          color: tokens.ink,
          letterSpacing: '0.005em',
        }}>{opp.reasoning}</div>

        {/* Labeled section — Hypothesis to test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontFamily: body.fontFamily,
            fontSize: 10.5, fontWeight: 600,
            color: tokens.inkMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>Hypothesis to test</div>
          <div style={{
            fontFamily: body.fontFamily,
            fontSize: 13, lineHeight: 1.55,
            color: tokens.inkSecondary,
            letterSpacing: '0.005em',
          }}>{opp.hypothesis}</div>
        </div>

        {/* Labeled section — Consider exploring */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontFamily: body.fontFamily,
            fontSize: 10.5, fontWeight: 600,
            color: tokens.inkMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>Consider exploring</div>
          <div style={{
            fontFamily: body.fontFamily,
            fontSize: 13, lineHeight: 1.55,
            color: tokens.inkSecondary,
            letterSpacing: '0.005em',
          }}>{opp.exploring}</div>
        </div>
      </>
    )}
  </div>
);

window.VariantB = VariantB;
