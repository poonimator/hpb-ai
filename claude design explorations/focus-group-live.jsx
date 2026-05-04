// Focus Group — Live (multi-participant)
// A version of the live session screen designed for a 3-person focus group.
// Interviewer turns (Q) anchor on the right; each participant (S, O, R) has their
// own colored avatar + bubble on the left. Opportunities on the right rail now
// indicate WHICH participant the moment came from.

const { useState: useStateFG, useRef: useRefFG, useEffect: useEffectFG } = React;

// ---- Participants ----
const FG_LIVE_PERSONAS = {
  S: { id: 'S', label: 'Participant S', sub: 'Self-Blamer',      color: '#7c3aed', soft: 'rgba(124,58,237,0.10)' },
  O: { id: 'O', label: 'Participant O', sub: 'Switch-Off',       color: '#ca8a04', soft: 'rgba(202,138,4,0.10)' },
  R: { id: 'R', label: 'Participant R', sub: 'Risk-Checker',     color: '#0ea5e9', soft: 'rgba(14,165,233,0.10)' },
};

// ---- Opportunities (multi-participant) ----
const FG_OPPS = [
  { id: 'fg-1', who: 'S', quote: 'at night I replay everything and start thinking I messed up somewhere.', theme: 'Rumination loop', tags: ['Night spiral', 'Self-blame'], reasoning: 'Participant shows a clear "quiet-day, loud-night" pattern. Opportunity for a passive night-time check-in that doesn\'t require naming the feeling up front.', hypothesis: 'Users with delayed emotional processing will engage more with a passive night-time reflection prompt than a real-time mood check.', exploring: 'Worth asking what the night-time replay actually feels like — whether it’s words, images, or a body sensation changes the intervention.', time: '00:04:12' },
  { id: 'fg-2', who: 'O', quote: "I just want to disappear for a bit, like scroll, watch random stuff, or sleep.", theme: 'Avoidant numbing', tags: ['Doom-scroll', 'Self-soothing'], reasoning: 'Disappearance isn\'t apathy — it\'s a regulation strategy. Opportunity for a "low-energy mode" that frames scrolling/rest as valid recovery with gentle re-entry prompts.', hypothesis: 'Reframing “disappearing” as a valid recovery mode (vs. avoidance) will reduce guilt and improve re-engagement.', exploring: 'Worth asking when disappearing helps vs. when it tips into avoidance — they probably know the difference in the moment.', time: '00:05:47' },
  { id: 'fg-3', who: 'R', quote: 'I usually feel a bit first, like make a small comment and see if the person gets it.', theme: 'Risk-check before disclosing', tags: ['Safety probe', 'Soft signalling'], reasoning: 'The participant tests waters with ambiguous cues before real disclosure. Opportunity for "micro-disclosure" templates — preset hints users can send to trusted contacts.', hypothesis: 'Users who risk-check before disclosing will adopt preset “soft-signal” messages more readily than open-ended support prompts.', exploring: 'Worth asking what a “good” response to a soft signal looks like to them — that’s the template for the other side of the feature.', time: '00:07:20' },
  { id: 'fg-4', who: 'S', quote: "I can't be who I used to be… something's wrong.", theme: 'Identity drift', tags: ['Comparison', 'Shame'], reasoning: 'Frames distress as a self-defect rather than a reaction. Opportunity for reflection prompts that externalise the experience ("your week was hard" vs. "you are broken").', hypothesis: 'Externalising prompts (“your week was hard”) will shift self-blame more than validation prompts (“you’re doing your best”).', exploring: 'Worth asking who they compare themselves to — past-self vs. peers changes the intervention entirely.', time: '00:09:02' },
  { id: 'fg-5', who: 'R', quote: 'if they start with the whole lecture mode or ask too many questions, I\'ll just say "mmm" and stop.', theme: 'Lecture-mode aversion', tags: ['Shutdown signal'], reasoning: 'Well-meaning probing causes withdrawal. Opportunity for a "listen mode" toggle in support convos — fewer follow-ups, more mirroring.', hypothesis: 'A “listen-only” coaching mode will keep ambivalent users engaged longer than traditional therapeutic questioning.', exploring: 'Worth asking what a helpful listener actually does in their experience — the answer is probably surprisingly specific.', time: '00:10:41' },
  { id: 'fg-6', who: 'O', quote: 'if you ask me to explain feelings on the spot I\'ll just check out.', theme: 'On-the-spot freeze', tags: ['Delayed processing'], reasoning: 'Real-time emotional articulation is a blocker. Opportunity for asynchronous reflection formats — voice notes, drawings, later recall.', hypothesis: 'Async, non-verbal expression formats will surface more emotional data from shutdown-prone users than chat-style prompts.', exploring: 'Worth asking what format feels safest when words aren’t available yet — voice, drawing, or choosing from a list.', time: '00:12:18' },
];

// ---- Transcript turns ----
const FG_TURNS = [
  { role: 'Q', time: '00:03:45', text: 'When things get stressful, what do you actually end up doing?' },
  { role: 'P', who: 'S', time: '00:04:12',
    parts: [
      { t: 'Usually I will keep going. No nothing happened, then ' },
      { t: 'at night I replay everything and start thinking I messed up somewhere.', oppId: 'fg-1' },
      { t: ' I\'ll scroll and compare with other people and somehow, I reassure myself even worse. Then I get more irritable at home over small things, and my sleep becomes quite bad.' },
    ],
  },
  { role: 'P', who: 'O', time: '00:05:47',
    parts: [
      { t: 'For me ah, I don\'t really talk about it. ' },
      { t: "I just want to disappear for a bit, like scroll, watch random stuff, or sleep.", oppId: 'fg-2' },
      { t: ' Then when I feel less "on edge", I come back and do what I need to do.' },
    ],
  },
  { role: 'P', who: 'R', time: '00:07:20',
    parts: [
      { t: 'I won\'t straight away say what\'s going on. ' },
      { t: 'I usually feel a bit first, like make a small comment and see if the person gets it.', oppId: 'fg-3' },
      { t: ' If it feels like drama, I\'d rather keep it to myself.' },
    ],
  },

  { role: 'Q', time: '00:08:30', text: 'What feels different compared to a year ago?' },
  { role: 'P', who: 'S', time: '00:09:02',
    parts: [
      { t: 'It\'s like… ' },
      { t: "I can't be who I used to be… something's wrong.", oppId: 'fg-4' },
      { t: ' I try to carry on normal outside but inside I feel behind.' },
    ],
  },

  { role: 'Q', time: '00:10:12', text: 'When someone tries to help, what usually happens?' },
  { role: 'P', who: 'R', time: '00:10:41',
    parts: [
      { t: 'It depends on how they come in. ' },
      { t: 'if they start with the whole lecture mode or ask too many questions, I\'ll just say "mmm" and stop.', oppId: 'fg-5' },
      { t: '' },
    ],
  },
  { role: 'P', who: 'O', time: '00:12:18',
    parts: [
      { t: 'Same, and ' },
      { t: 'if you ask me to explain feelings on the spot I\'ll just check out.', oppId: 'fg-6' },
      { t: ' I\'d rather message later when I\'ve had space.' },
    ],
  },
];

const FGLiveSession = () => {
  const [activeOppId, setActiveOppId] = useStateFG('fg-2');
  const [pulseQuoteId, setPulseQuoteId] = useStateFG(null);
  const [filterWho, setFilterWho] = useStateFG('All');
  const scrollRef = useRefFG(null);
  const quoteRefs = useRefFG({});

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
        <FGLeftSidebar/>

        {/* CENTER */}
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            padding: '14px 32px',
            background: tokens.bgAlt,
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: tokens.inkMuted, fontWeight: 500, letterSpacing: '0.01em' }}>Focus group · live</span>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: tokens.green, boxShadow: `0 0 0 3px ${tokens.greenSoft}` }}/>
            </div>
            <PillGhost icon={<IconSearch size={12}/>}>Find in transcript</PillGhost>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', background: tokens.bgAlt, scrollBehavior: 'smooth' }}>
            <div style={{
              maxWidth: 760, margin: '28px auto 180px',
              padding: '0 32px',
              display: 'flex', flexDirection: 'column', gap: 18,
            }}>
              {FG_TURNS.map((turn, i) => (
                <FGChatBubble
                  key={i}
                  turn={turn}
                  activeOppId={activeOppId}
                  pulseQuoteId={pulseQuoteId}
                  onHighlightClick={setActiveOppId}
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
        <FGRightRail
          opportunities={FG_OPPS}
          activeOppId={activeOppId}
          onPick={handlePickOpportunity}
          filterWho={filterWho}
          setFilterWho={setFilterWho}
        />
      </div>
    </div>
  );
};

// ---- Left sidebar (session + participants roster) ----
const FGLeftSidebar = () => (
  <aside style={{
    background: '#fff',
    borderRight: `1px solid ${tokens.borderSubtle}`,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', marginLeft: -8, marginBottom: 12,
        background: 'transparent', border: 'none',
        color: tokens.inkMuted, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', borderRadius: 6,
      }}><IconBack size={12}/>All sessions</button>
      <div style={{ ...display, fontSize: 22, lineHeight: 1.15 }}>
        Youth Coping<br/>Styles
      </div>
      <div style={{ fontSize: 12.5, color: tokens.inkMuted, marginTop: 8, lineHeight: 1.5, letterSpacing: '0.01em' }}>
        Three youths, three different responses to stress.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <Badge color="blue">In Progress</Badge>
        <span style={{ fontSize: 11, color: tokens.inkMuted, letterSpacing: '0.01em' }}>· 14 min</span>
      </div>
    </div>

    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
      <div style={{ fontSize: 10.5, color: tokens.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Participants</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.values(FG_LIVE_PERSONAS).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9999,
              background: p.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              boxShadow: shadows.insetEdge,
            }}>{p.id}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: tokens.ink }}>{p.label}</div>
              <div style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 1 }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ flex: 1 }}/>

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

// ---- Chat bubble — Q right; P left with persona avatar ----
const FGChatBubble = ({ turn, activeOppId, pulseQuoteId, onHighlightClick, registerRef }) => {
  const isQ = turn.role === 'Q';

  const content = turn.text ? turn.text : (
    turn.parts.map((p, i) => p.oppId ? (
      <FGInlineHighlight
        key={i}
        oppId={p.oppId}
        active={activeOppId === p.oppId}
        pulsing={pulseQuoteId === p.oppId}
        onClick={() => onHighlightClick(p.oppId)}
        registerRef={(el) => registerRef(p.oppId, el)}
      >{p.t}</FGInlineHighlight>
    ) : <React.Fragment key={i}>{p.t}</React.Fragment>)
  );

  if (isQ) {
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
          <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', marginRight: 6 }}>{turn.time} · Interviewer</span>
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

  const p = FG_LIVE_PERSONAS[turn.who];
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, alignItems: 'flex-end' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9999,
        background: p.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600,
        flexShrink: 0,
        boxShadow: shadows.insetEdge,
      }}>{p.id}</div>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div style={{
          background: '#fff', color: tokens.ink,
          padding: '13px 18px',
          borderRadius: '18px 18px 18px 4px',
          fontSize: 14, lineHeight: 1.7,
          letterSpacing: '0.01em',
          boxShadow: shadows.outlineRing,
        }}>{content}</div>
        <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', marginLeft: 6 }}>
          {turn.time}
        </span>
      </div>
    </div>
  );
};

const FGInlineHighlight = ({ children, active, pulsing, onClick, registerRef }) => {
  const ref = useRefFG(null);
  useEffectFG(() => { if (ref.current) registerRef(ref.current); });
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

// ---- Right rail with per-participant filter ----
const FGRightRail = ({ opportunities, activeOppId, onPick, filterWho, setFilterWho }) => {
  const filters = ['All', 'S', 'O', 'R'];
  const shown = opportunities.filter(o => filterWho === 'All' || o.who === filterWho);

  return (
    <aside style={{
      background: '#fff',
      borderLeft: `1px solid ${tokens.borderSubtle}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ ...display, fontSize: 18, lineHeight: 1.15 }}>Opportunities</div>
          <Badge color="amber">{opportunities.length} found</Badge>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {filters.map((t) => {
            const p = FG_LIVE_PERSONAS[t];
            const active = filterWho === t;
            return (
              <button key={t} onClick={() => setFilterWho(t)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 11px 5px ' + (p ? '5px' : '11px'),
                borderRadius: 9999,
                background: active ? tokens.ink : '#fff',
                color: active ? '#fff' : (p ? p.color : tokens.inkSecondary),
                border: 'none',
                fontSize: 11.5, fontWeight: 500,
                letterSpacing: '0.01em',
                boxShadow: active ? shadows.card : shadows.insetEdge,
                cursor: 'pointer',
              }}>
                {p && (
                  <span style={{ width: 14, height: 14, borderRadius: 9999, background: active ? '#fff' : p.color, color: active ? p.color : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700 }}>{p.id}</span>
                )}
                {t === 'All' ? 'All' : p.sub}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((o) => (
          <FGRailCard
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

const FGRailCard = ({ opp, expanded, onClick }) => {
  const p = FG_LIVE_PERSONAS[opp.who];
  return (
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
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px 2px 3px',
              background: p.soft, color: p.color,
              borderRadius: 9999,
              fontSize: 10.5, fontWeight: 600,
              boxShadow: shadows.insetEdge,
            }}>
              <span style={{ width: 14, height: 14, borderRadius: 9999, background: p.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700 }}>{p.id}</span>
              {p.sub}
            </span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}>{opp.time}</span>
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
          {/* Meta row — marker + participant + time + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 9999,
              background: tokens.amber,
              flexShrink: 0,
            }}/>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px 2px 3px',
              background: p.soft, color: p.color,
              borderRadius: 9999,
              fontSize: 10.5, fontWeight: 600,
              boxShadow: shadows.insetEdge,
            }}>
              <span style={{ width: 14, height: 14, borderRadius: 9999, background: p.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 700 }}>{p.id}</span>
              {p.sub}
            </span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}>{opp.time}</span>
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

          {/* Reasoning */}
          <div style={{
            fontFamily: body.fontFamily,
            fontSize: 13.5, lineHeight: 1.6,
            color: tokens.ink,
            letterSpacing: '0.005em',
          }}>{opp.reasoning}</div>

          {/* Hypothesis to test */}
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

          {/* Consider exploring */}
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
};

window.FGLiveSession = FGLiveSession;
