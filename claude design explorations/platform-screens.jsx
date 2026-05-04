// Platform screens — upgraded layouts w/ Variant B vocabulary
// Shared: stone bg, left meta rail, right context rail, inset ring shadows.
const { useState: useStatePB } = React;

// ===============================================================
// Shared workspace frame (sub-header + optional rails + content)
// ===============================================================
const WorkspaceFrame = ({ crumbs, rightHeader, leftRail, rightRail, children, bg = tokens.bgAlt }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: bg }}>
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
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: tokens.inkMuted, opacity: 0.5 }}>/</span>}
              <span style={{ color: i === crumbs.length - 1 ? tokens.ink : tokens.inkMuted, fontWeight: i === crumbs.length - 1 ? 600 : 500 }}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{rightHeader}</div>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${leftRail ? '280px' : ''} 1fr ${rightRail ? '320px' : ''}`.trim(),
      flex: 1, minHeight: 0,
    }}>
      {leftRail && <aside style={{ background: '#fff', borderRight: `1px solid ${tokens.borderSubtle}`, display: 'flex', flexDirection: 'column' }}>{leftRail}</aside>}
      <main style={{ padding: '32px 40px 64px', overflow: 'hidden' }}>{children}</main>
      {rightRail && <aside style={{ background: '#fff', borderLeft: `1px solid ${tokens.borderSubtle}`, display: 'flex', flexDirection: 'column' }}>{rightRail}</aside>}
    </div>
  </div>
);

const RailHeader = ({ children }) => (
  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.inkMuted, marginBottom: 10 }}>{children}</div>
);
const RailSection = ({ title, children, style }) => (
  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${tokens.borderSubtle}`, ...style }}>
    {title && <RailHeader>{title}</RailHeader>}
    {children}
  </div>
);
const MetaRow = ({ k, v }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, letterSpacing: '0.01em' }}>
    <span style={{ color: tokens.inkMuted }}>{k}</span>
    <span style={{ color: tokens.ink, fontWeight: 500 }}>{v}</span>
  </div>
);

// ===============================================================
// Parents Batch 1 — toggle mapping / insights
// ===============================================================
const PB_MAP_COLS = [
  { key: 'Pressures/Stressors', items: [
    { t: '"lately she getting more yeah more motivated or know whether should I say stress or motivated uh about her school work. Now she\'s more hardworking."', who: 'P01' },
    { t: '"could be her school work or could be has may have some disagreement with her friends. Yeah, these are usually the two likely scenario."', who: 'P01' },
    { t: '"the elder one uh came out from NS… and then he started um his uni days. So like very need hsay you know."', who: 'P02' },
    { t: '"typical day he would like of course wake up very early go to school then he depends on whether he got CCA… CCA can be six plus yeah very long hours"', who: 'P02' },
    { t: '"I would say maybe I always ask her to study. So I sort of accidentally force her to be study because first first thing in life"', who: 'P03' },
  ]},
  { key: 'Motivations to Take Action', items: [
    { t: '"She want to uh is planning to go to medicine in E. So she\'s working towards this goal."', who: 'P01' },
    { t: '"So I don\'t give up. I don\'t give up."', who: 'P05' },
    { t: '"he usually open up like um what he can cope in school, what he cannot cope."', who: 'P04' },
  ]},
  { key: 'Barriers to Action', items: [
    { t: '"she appeared moody so when we speak to her spoke to her she hardly respond at that point of time"', who: 'P01' },
    { t: '"with boys you need to uh probe sometimes it\'s like it could be like you ask one question they answer one question like that and it\'s less forthcoming."', who: 'P02' },
    { t: '"he\'s more of a introvert… when new environment you don\'t know anyone"', who: 'P02' },
    { t: '"She she always tell me that she has tried her best"', who: 'P03' },
    { t: '"my parent also… using their own traditional way keep saying something"', who: 'P05' },
  ]},
  { key: 'Mental Model', items: [
    { t: '"Depends. Yeah. You can kind of tell her mood. Sometime when she\'s not feeling moody, she\'ll be quiet. So when you talk to her, she will barely respond."', who: 'P01' },
    { t: '"they would like have their own close friends and their own social circle."', who: 'P02' },
    { t: '"Yeah I quite concerned with their studies."', who: 'P03' },
    { t: '"for me is try to maintain positive as possible."', who: 'P05' },
    { t: '"I treat them like friend okay treat them like friend they treat them like u vice versa"', who: 'P05' },
  ]},
  { key: 'Life Priorities', items: [
    { t: '"I think school is priority."', who: 'P01' },
    { t: '"I think I think because she is… that quite the"', who: 'P03' },
    { t: '"every child"', who: 'P05' },
    { t: '"spending time together is important especially when I\'m a single parent."', who: 'P04' },
  ]},
];

const PB_INSIGHTS = {
  found: [
    { t: 'Weekday connection happens in short windows: mornings and dinner are the main touchpoints.', who: ['P01','P02','P03'] },
    { t: 'Exam periods reduce openness; youths become less chatty and share less at home.', who: ['P02'], research: { status: 'RELATED', title: 'HCD For Youths MHE Literature Review', note: 'Competing academic priorities can crowd out wellbeing conversations and actions.' } },
    { t: 'Schoolwork dominates daily life; CCAs and long school hours intensify time pressure.', who: ['P01','P02'], research: { status: 'VALIDATION', title: 'HCD For Youths MHE Literature Review', note: 'Literature highlights academic goals as a major competing priority.' } },
    { t: 'High personal goals (e.g., medicine) drive late nights and sustained study intensity.', who: ['P01'] },
  ],
  further: [
    { t: 'Say-do tension: parents value communication, but weekday time scarcity limits real conversation depth.', who: ['P01','P02','P04'] },
    { t: 'Study-first parenting may reduce wellbeing bandwidth; pressure framed as "motivation" blurs harm.', who: ['P01','P03'], research: { status: 'RELATED', title: 'HCD For Youths MHE Literature Review', note: 'Academic pressure is a known risk factor for poorer mental wellbeing.' } },
    { t: 'Conflicting models of autonomy: "I won\'t decide for him" versus heavy monitoring and frequent checking.', who: ['P04'] },
    { t: 'Mood-based waiting ("cool down, wake naturally") leaves support timing to chance.', who: ['P05'] },
  ],
  explore: [
    { t: '"Conversation windows" are structurally tied to commuting and dinner, not intentional mental health check-ins.', who: ['P01','P02','P03'] },
    { t: 'Digital peer maintenance feels like an obligation: youths "must scroll" to stay updated before work.', who: ['P02'] },
    { t: 'Designated-phone-spot strategy externalises self-control: environment design replaces willpower.', who: ['P02'] },
    { t: 'Portfolio-building for competitive pathways adds a new layer of youth stress.', who: ['P01'] },
  ],
};

const PERSON_PALETTE = { P01: '#059669', P02: '#0ea5e9', P03: '#7c3aed', P04: '#ca8a04', P05: '#be185d' };

const PersonBadge = ({ id }) => {
  const c = PERSON_PALETTE[id] || tokens.inkMuted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 9999,
      background: '#fff', color: c,
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em',
      boxShadow: shadows.insetEdge,
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="8" r="3.5"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>
      {id}
    </span>
  );
};

const QuoteCard = ({ t, who }) => (
  <div style={{
    background: '#fff', borderRadius: 12,
    padding: '12px 14px',
    boxShadow: shadows.outlineRing,
    display: 'flex', flexDirection: 'column', gap: 8,
  }}>
    <div style={{ fontSize: 12.5, lineHeight: 1.55, color: tokens.inkSecondary, letterSpacing: '0.01em' }}>{t}</div>
    <div><PersonBadge id={who}/></div>
  </div>
);

const InsightCard = ({ t, who, research }) => (
  <div style={{
    background: '#fff', borderRadius: 14,
    padding: '14px 16px',
    boxShadow: shadows.outlineRing,
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ fontSize: 13, lineHeight: 1.55, color: tokens.ink, letterSpacing: '0.01em' }}>{t}</div>
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{who.map(w => <PersonBadge key={w} id={w}/>)}</div>
    {research && (
      <div style={{ borderTop: `1px solid ${tokens.borderSubtle}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: tokens.inkMuted }}>RESEARCH CONTEXT</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 4, color: research.status === 'VALIDATION' ? '#059669' : tokens.amber, background: research.status === 'VALIDATION' ? 'rgba(5,150,105,0.08)' : tokens.amberSoft, boxShadow: shadows.insetEdge }}>{research.status}</span>
        </div>
        <div style={{ fontSize: 11.5, fontStyle: 'italic', color: tokens.inkSecondary }}>{research.title}</div>
        <div style={{ fontSize: 11.5, color: tokens.inkMuted, lineHeight: 1.5 }}>{research.note}</div>
      </div>
    )}
  </div>
);

const ParentsBatch1 = () => {
  const [view, setView] = useStatePB('mapping');
  return (
    <div style={{ width: 1440, minHeight: 1100, background: tokens.bgAlt, fontFamily: body.fontFamily, color: tokens.ink, display: 'flex', flexDirection: 'column' }}>
      <TopNav active="projects"/>
      <WorkspaceFrame
        crumbs={['Youth Wellbeing SG', 'Research Synthesis', 'Parents Batch 1']}
        rightHeader={
          <div style={{ display: 'inline-flex', padding: 3, borderRadius: 9999, background: tokens.bgAlt, boxShadow: shadows.insetEdge, gap: 2 }}>
            {[{id:'mapping',label:'View Mapping',icon:<IconTag size={12}/>},{id:'insights',label:'Insights View',icon:<IconSparkle size={12}/>}].map(t => (
              <button key={t.id} onClick={() => setView(t.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 28, padding: '0 14px',
                background: view === t.id ? '#fff' : 'transparent',
                color: view === t.id ? tokens.ink : tokens.inkSecondary,
                border: 'none', borderRadius: 9999,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                boxShadow: view === t.id ? shadows.card : 'none',
              }}>{t.icon}{t.label}</button>
            ))}
          </div>
        }
        leftRail={
          <>
            <div style={{ padding: '22px 22px 18px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadows.insetEdge }}>
                  <IconFolder size={15}/>
                </div>
                <Badge color="blue">Synthesis</Badge>
              </div>
              <div style={{ ...display, fontSize: 22, lineHeight: 1.15 }}>Parents<br/>Batch 1</div>
              <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 10, lineHeight: 1.55, letterSpacing: '0.01em' }}>
                5 parent interviews, mapped to themes and enriched with knowledge-base literature.
              </div>
            </div>
            <RailSection title="Batch">
              <MetaRow k="Insights" v="59"/>
              <MetaRow k="Themes" v="12"/>
              <MetaRow k="Sources" v="5 interviews"/>
              <MetaRow k="Last sync" v="4:20 PM"/>
            </RailSection>
            <RailSection title="Participants">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['P01','P02','P03','P04','P05'].map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PersonBadge id={p}/>
                    <span style={{ fontSize: 12, color: tokens.inkSecondary, letterSpacing: '0.01em' }}>{ {P01:'Parent of 15yo daughter', P02:'Parent of 17yo son', P03:'Parent of 14yo daughter', P04:'Single parent · 16yo', P05:'Parent of two teens'}[p] }</span>
                  </div>
                ))}
              </div>
            </RailSection>
            <div style={{ flex: 1 }}/>
            <RailSection style={{ borderBottom: 'none' }} title="Related batches">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Youths Batch 1', 'Youths Batch 2', 'Educators Batch 1'].map(b => (
                  <button key={b} style={{ textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 8px', marginLeft: -8, borderRadius: 8, fontSize: 12.5, color: tokens.inkSecondary, cursor: 'pointer', letterSpacing: '0.01em' }}>
                    {b} →
                  </button>
                ))}
              </div>
            </RailSection>
          </>
        }
      >
        {view === 'mapping' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {PB_MAP_COLS.map(col => (
              <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.inkSecondary }}>{col.key}</div>
                  <button title="Add quote" style={{ width: 22, height: 22, borderRadius: 9999, background: '#fff', border: 'none', boxShadow: shadows.insetEdge, color: tokens.inkMuted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <IconPlus size={11}/>
                  </button>
                </div>
                {col.items.map((it, i) => <QuoteCard key={i} {...it}/>)}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...display, fontSize: 24 }}>Research Insights</div>
              <div style={{ fontSize: 12.5, color: tokens.inkMuted, marginTop: 4 }}>Patterns cross-referenced with your Knowledge Base</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { color: '#059669', bg: 'rgba(5,150,105,0.08)', title: 'What have we found out?', sub: 'Validated by existing research', items: PB_INSIGHTS.found, icon: '✓' },
                { color: tokens.amber, bg: tokens.amberSoft, title: 'What to look further into?', sub: 'Ambiguities & contradictions', items: PB_INSIGHTS.further, icon: '?' },
                { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', title: 'New areas to explore?', sub: 'Novel findings & opportunities', items: PB_INSIGHTS.explore, icon: '✦' },
              ].map((col, ci) => (
                <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: col.bg, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, boxShadow: shadows.insetEdge }}>{col.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.ink }}>{col.title}</div>
                      <div style={{ fontSize: 11.5, color: tokens.inkMuted, marginTop: 1 }}>{col.sub}</div>
                    </div>
                  </div>
                  {col.items.map((it, i) => <InsightCard key={i} {...it}/>)}
                </div>
              ))}
            </div>
          </>
        )}
      </WorkspaceFrame>
    </div>
  );
};

// ===============================================================
// Archetype Profile — left identity rail + right block grid + right rail for "avoiding the spiral"
// ===============================================================
const ARCH_BLOCKS = [
  { title: 'Influences', items: ['Singapore education stakes and "future outcome" framing (study seen as non-negotiable)', 'Competitive pathways and portfolio-building (medicine goal, internships/shadowing)', 'Late-night homework/studying becoming normalised', 'Parent comparisons to other families where teens withdraw'] },
  { title: 'Behaviours', items: ['Frequently reminds or tells the child to study; positions study as "number one"', 'Interprets increased studying/late nights as motivation (even when unsure if it\'s stress)', 'Keeps weekend routines that still revolve around study', 'Steps in when school issues feel unfair (calls teacher after an incident)'] },
  { title: 'Barriers', items: ['Belief that academic pressure is necessary makes wellbeing support feel like "softening"', 'Ambiguity between motivation vs stress leads to inaction until visible breakdown', 'They may not have tools to discuss mental strain without it sounding like "excuses"', 'High-goal trajectories make it hard to reduce load without trade-offs'] },
  { title: 'Motivations', items: ['Prevent a "bad future" and keep options open', 'Feel like a responsible parent who doesn\'t "let the child waste time"', 'Keep a sense of control in a high-stakes system'] },
  { title: 'Goals', items: ['Ensure the child keeps up with school demands and exams', 'Reduce uncertainty about the child\'s trajectory', 'Avoid last-minute crises (poor results, missed opportunities)'] },
  { title: 'Habits', items: ['Defaults to "study first" advice before asking how the child is coping', 'Equates visible effort (late nights, extra work) with doing the right thing', 'Uses warnings about consequences to motivate when anxious'] },
];

const ArchetypeProfile = () => (
  <div style={{ width: 1440, minHeight: 1200, background: tokens.bgAlt, fontFamily: body.fontFamily, color: tokens.ink, display: 'flex', flexDirection: 'column' }}>
    <TopNav active="projects"/>
    <WorkspaceFrame
      crumbs={['Youth Wellbeing SG', 'Archetypes', 'The Study-First Pusher']}
      leftRail={
        <>
          <div style={{ padding: '24px 22px 20px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Badge color="amber">Archetype</Badge>
              <span style={{ fontSize: 11, color: tokens.inkMuted }}>· Parents</span>
            </div>
            <div style={{ ...display, fontSize: 22, lineHeight: 1.15, marginTop: 4 }}>The Study-First<br/>Pusher</div>
            <div style={{ fontSize: 12.5, color: tokens.inkSecondary, marginTop: 10, lineHeight: 1.55, letterSpacing: '0.01em', fontStyle: 'italic' }}>
              "Stress is acceptable if it looks like progress."
            </div>
          </div>
          <RailSection title="Profile">
            <MetaRow k="Age" v="40s–50s"/>
            <MetaRow k="Role" v="Working parent"/>
            <MetaRow k="Household" v="Teen at home"/>
            <MetaRow k="Frequency" v="~1 in 3 parents"/>
          </RailSection>
          <div style={{ flex: 1 }}/>
          <RailSection style={{ borderBottom: 'none' }} title="Other archetypes">
            {['The Soft Monitor', 'The Reformed Pressurer', 'The Burnt-Out Advocate'].map(a => (
              <button key={a} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '7px 8px', marginLeft: -8, borderRadius: 8, fontSize: 12.5, color: tokens.inkSecondary, cursor: 'pointer', letterSpacing: '0.01em' }}>
                {a} →
              </button>
            ))}
          </RailSection>
        </>
      }
      rightRail={null}
    >
      <div style={{ maxWidth: 820 }}>
        <h1 style={{ ...display, fontSize: 34, margin: 0, letterSpacing: '-0.02em' }}>The Study-First Pusher</h1>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: tokens.inkSecondary, marginTop: 16, letterSpacing: '0.01em' }}>
          They put academics at the centre and believe studying is the safest path in Singapore, sometimes explicitly warning about a "bad future" if the child doesn't study. They frame pressure as motivation and only later recognise they may be the source of stress. They accept effort as a boundary ("she tried her best") but still keep study as the default priority, even on weekends. Change is hard because backing off feels like risking the child's future—and they don't have an alternative success model they trust.
        </p>
      </div>

      <div style={{ marginTop: 32, background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: shadows.outlineRing }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: tokens.amber, marginBottom: 8, textTransform: 'uppercase' }}>Their Lived Experience</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: tokens.inkSecondary, letterSpacing: '0.01em' }}>
          They are not trying to be harsh—they're trying to protect their child from regret and limited options. When they see the child studying late, it reads as responsibility, even if it also looks like stress. They carry a quiet fear that if they loosen up, the child will "slip" and never catch up, so pressure becomes their way of staying in control of an uncertain future.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
        {ARCH_BLOCKS.map((b, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: shadows.outlineRing }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10, color: tokens.ink }}>{b.title}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: tokens.inkSecondary, lineHeight: 1.55, letterSpacing: '0.01em' }}>
                  <IconDot size={5} color={tokens.amber}/>
                  <span style={{ flex: 1 }}>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: shadows.outlineRing }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8, color: tokens.ink }}>The Spiral</div>
          <div style={{ fontSize: 12.5, color: tokens.inkSecondary, lineHeight: 1.7, letterSpacing: '0.01em' }}>
            High stakes → parent pushes harder → child studies later or gets quieter → parent reads it as <em>"must tahan"</em> → less wellbeing bandwidth → more tension → parent pushes again.
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: shadows.outlineRing }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8, color: tokens.ink }}>How to break it</div>
          <div style={{ fontSize: 12.5, color: tokens.inkSecondary, lineHeight: 1.7, letterSpacing: '0.01em' }}>
            Separate <b>supporting achievement</b> from <b>adding pressure</b> with concrete alternative behaviours. Ask about workload blockers, not just hours studied. Provide language that validates effort while making space for strain.
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: shadows.outlineRing, marginTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12, color: tokens.ink }}>Signal quotes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { t: '"She tried her best"', who: 'P03' },
            { t: '"First thing in life — study."', who: 'P01' },
            { t: '"I always ask her to study."', who: 'P03' },
          ].map((q, i) => (
            <div key={i} style={{ padding: '10px 12px', background: tokens.bgAlt, borderRadius: 10, boxShadow: shadows.insetEdge }}>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: tokens.inkSecondary, lineHeight: 1.55, letterSpacing: '0.01em' }}>{q.t}</div>
              <div style={{ marginTop: 6 }}><PersonBadge id={q.who}/></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 11.5, color: tokens.inkMuted, fontStyle: 'italic' }}>
        Archetype mode — a person may shift between different modes depending on situation and support.
      </div>
    </WorkspaceFrame>
  </div>
);

// ===============================================================
// Ideation — left batch rail + grid + right rail "concept lineage"
// ===============================================================
const IDEAS = [
  { t: 'One Ping Pact', d: 'A fixed check-in plan that replaces endless texting during school travel.', theme: 'Technology' },
  { t: 'Middle Gear Script', d: 'A short card that helps parents set limits without blowing up.', theme: 'Services' },
  { t: '10-Min Catch-Up', d: 'A time-box that respects group chats without losing homework time.', theme: 'Technology' },
  { t: 'Dinner Two-Question', d: 'A tiny dinner habit that makes talking easier during busy weeks.', theme: 'Events' },
  { t: 'Project Fair Play', d: 'A school tool that stops group work stress from exploding at home.', theme: 'Education' },
  { t: 'Recovery Block Calendar', d: 'A family plan that protects rest after exams without guilt.', theme: 'Services' },
  { t: 'Single-Parent Buddy Bench', d: 'A weekend meet-up where caregivers swap support while youths do an activity.', theme: 'Events' },
  { t: 'Portfolio Pressure Reset', d: 'A school-to-home guide that keeps big goals from becoming nightly panic.', theme: 'Education' },
  { t: 'Wind-Down Playlist', d: 'Curated audio that replaces late-night doom-scrolling with intentional rest.', theme: 'Entertainment' },
];

const THEME_COLORS = { Technology: '#0ea5e9', Services: '#059669', Education: '#7c3aed', Events: tokens.amber, Entertainment: '#be185d' };

const Ideation = () => (
  <div style={{ width: 1440, minHeight: 1000, background: tokens.bgAlt, fontFamily: body.fontFamily, color: tokens.ink, display: 'flex', flexDirection: 'column' }}>
    <TopNav active="projects"/>
    <WorkspaceFrame
      crumbs={['Youth Wellbeing SG', 'Ideation', 'Parents Batch 1']}
      rightHeader={
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: '#fff', color: tokens.ink, border: 'none', borderRadius: 9999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', boxShadow: shadows.outlineRing }}>
          <IconSparkle size={12}/>Regenerate
        </button>
      }
      leftRail={
        <>
          <div style={{ padding: '22px 22px 18px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge color="green">Generated</Badge>
              <span style={{ fontSize: 11, color: tokens.inkMuted }}>· 4/22/2026</span>
            </div>
            <div style={{ ...display, fontSize: 22, lineHeight: 1.15 }}>Ideation<br/>Parents Batch 1</div>
            <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 10, lineHeight: 1.55, letterSpacing: '0.01em' }}>
              8 concepts generated from the current synthesis. Regeneration creates a separate batch.
            </div>
          </div>
          <RailSection title="Themes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(THEME_COLORS).map(([k, c]) => {
                const count = IDEAS.filter(i => i.theme === k).length;
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', marginLeft: -10, borderRadius: 8, fontSize: 12.5, cursor: 'pointer' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: tokens.inkSecondary }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: c }}/>
                      {k}
                    </span>
                    <span style={{ fontSize: 11, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </RailSection>
          <RailSection title="Source">
            <MetaRow k="HMW" v="Early action"/>
            <MetaRow k="Insights" v="59"/>
            <MetaRow k="Personas" v="3"/>
          </RailSection>
          <div style={{ flex: 1 }}/>
          <RailSection style={{ borderBottom: 'none' }} title="Batches">
            {['Parents Batch 1 · current', 'Youths Batch 1', 'Educators Batch 1'].map((b, i) => (
              <button key={b} style={{ display: 'block', width: '100%', textAlign: 'left', background: i === 0 ? tokens.bgAlt : 'transparent', boxShadow: i === 0 ? shadows.insetEdge : 'none', border: 'none', padding: '7px 10px', marginLeft: -10, borderRadius: 8, fontSize: 12.5, color: i === 0 ? tokens.ink : tokens.inkSecondary, cursor: 'pointer', fontWeight: i === 0 ? 500 : 400, letterSpacing: '0.01em' }}>
                {b}
              </button>
            ))}
          </RailSection>
        </>
      }
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...display, fontSize: 24 }}>Concepts</div>
        <div style={{ fontSize: 12.5, color: tokens.inkMuted, marginTop: 4 }}>{IDEAS.length} concepts across 5 themes</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {IDEAS.map((it, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: shadows.outlineRing, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEME_COLORS[it.theme] }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: THEME_COLORS[it.theme] }}/>{it.theme}
              </span>
              <span style={{ fontSize: 10.5, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace' }}>C0{i+1}</span>
            </div>
            <div style={{ aspectRatio: '4/3', borderRadius: 10, background: tokens.bgStoneSolid, boxShadow: shadows.insetEdge, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${tokens.border} 1px, transparent 1px)`, backgroundSize: '14px 14px', opacity: 0.5 }}/>
              <span style={{ position: 'relative', fontFamily: 'ui-monospace, monospace', fontSize: 10.5, color: tokens.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>concept illustration</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: tokens.ink }}>{it.t}</div>
            <div style={{ fontSize: 12, color: tokens.inkSecondary, lineHeight: 1.55, letterSpacing: '0.01em' }}>{it.d}</div>
          </div>
        ))}
      </div>
    </WorkspaceFrame>
  </div>
);

// ===============================================================
// HMW Analyser — left history timeline + center composer/critique + right framework legend
// ===============================================================
const HMW_HISTORY = [
  { time: '4:20 PM', label: 'Current', text: 'HMW create ways and opportunities for youths aged 15–25…', active: true, score: 4 },
  { time: '3:12 PM', label: '2 checks', text: 'HMW help youths stay connected during school transitions…', score: 3 },
  { time: 'Yesterday', label: '1 check', text: 'HMW prevent teen mental wellbeing decline during exam periods…', score: 2 },
  { time: '4/19/2026', label: '3 checks', text: 'HMW encourage early help-seeking for stressed teens…', score: 3 },
];

const LENS_META = [
  { color: '#0ea5e9', label: 'Intended Action', pass: 'Solution-Agnostic' },
  { color: tokens.amber, label: 'Potential User', pass: 'Appropriately Broad' },
  { color: '#059669', label: 'Timing / Moment', pass: 'Grounded in Real Problem', warn: true },
  { color: '#be185d', label: 'Desired Outcome', pass: 'Outcome-Focused' },
  { color: '#7c3aed', label: 'Research Grounding', pass: 'Research-Aligned' },
];

const HMWAnalyser = () => (
  <div style={{ width: 1440, minHeight: 1200, background: tokens.bgAlt, fontFamily: body.fontFamily, color: tokens.ink, display: 'flex', flexDirection: 'column' }}>
    <TopNav active="projects"/>
    <WorkspaceFrame
      crumbs={['Youth Wellbeing SG', 'Tools', 'How Might We Analyser']}
      leftRail={
        <>
          <div style={{ padding: '22px 22px 18px', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: tokens.amberSoft, color: tokens.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadows.insetEdge }}><IconBulb size={13}/></div>
              <Badge color="amber">Tool</Badge>
            </div>
            <div style={{ ...display, fontSize: 20, lineHeight: 1.15 }}>How Might We<br/>Analyser</div>
            <div style={{ fontSize: 12, color: tokens.inkMuted, marginTop: 10, lineHeight: 1.55, letterSpacing: '0.01em' }}>
              Critique HMW statements against the NN/g 5-lens framework, enriched with LUMA principles and project research.
            </div>
          </div>
          <RailSection title="History">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {HMW_HISTORY.map((h, i) => (
                <div key={i} style={{ position: 'relative', paddingLeft: 18, paddingTop: 4, paddingBottom: 12 }}>
                  <span style={{ position: 'absolute', left: 4, top: 9, width: 9, height: 9, borderRadius: 999, background: h.active ? tokens.amber : '#fff', boxShadow: h.active ? `0 0 0 3px ${tokens.amberSoft}` : shadows.insetEdge }}/>
                  {i < HMW_HISTORY.length - 1 && <span style={{ position: 'absolute', left: 8, top: 18, bottom: 0, width: 1, background: tokens.border }}/>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace' }}>{h.time}</span>
                    {h.active && <span style={{ fontSize: 9.5, color: tokens.amber, fontWeight: 700, letterSpacing: '0.1em' }}>ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: h.active ? tokens.ink : tokens.inkSecondary, lineHeight: 1.45, letterSpacing: '0.01em', fontWeight: h.active ? 500 : 400, cursor: 'pointer' }}>{h.text}</div>
                  <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ width: 14, height: 3, borderRadius: 999, background: n <= h.score ? tokens.amber : tokens.border }}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RailSection>
          <div style={{ flex: 1 }}/>
          <RailSection style={{ borderBottom: 'none' }}>
            <button style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 32, background: '#fff', color: tokens.inkSecondary, border: 'none', borderRadius: 9999, boxShadow: shadows.insetEdge, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <IconPlus size={12}/>New HMW
            </button>
          </RailSection>
        </>
      }
      rightRail={
        <>
          <RailSection title="The 5 lenses">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LENS_META.map(l => (
                <div key={l.label} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: l.color, marginTop: 6, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: tokens.ink, fontWeight: 500 }}>{l.label}</div>
                    <div style={{ fontSize: 11.5, color: l.warn ? tokens.amber : tokens.inkMuted, marginTop: 1, letterSpacing: '0.01em' }}>
                      {l.warn ? '⚠ ' : '✓ '}{l.pass}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RailSection>
          <RailSection title="Formula">
            <div style={{ fontSize: 12, color: tokens.inkSecondary, lineHeight: 1.7, letterSpacing: '0.01em' }}>
              <b>HMW</b> + <span style={{ color: '#059669' }}>action</span> + <b>for</b> + <span style={{ color: tokens.amber }}>user</span> + <b>so that</b> + <span style={{ color: '#be185d' }}>outcome</span>
            </div>
          </RailSection>
          <RailSection title="Sources">
            <div style={{ fontSize: 12, color: tokens.inkSecondary, letterSpacing: '0.01em', lineHeight: 1.6 }}>
              Nielsen Norman Group · 5-lens framework<br/>
              LUMA Institute · human-centred design principles
            </div>
          </RailSection>
        </>
      }
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: shadows.outlineRing }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: tokens.inkSecondary }}>
            <span style={{ fontWeight: 600 }}>How Might We</span>
            <span style={{ color: tokens.inkMuted }}>+</span>
            <FormulaPill label="Intended Action" sub="(an action verb)" color="#059669"/>
            <span style={{ color: tokens.inkMuted }}>+ For +</span>
            <FormulaPill label="Potential User" sub="(the subject)" color={tokens.amber}/>
            <span style={{ color: tokens.inkMuted }}>+ So That +</span>
            <FormulaPill label="Desired Outcome" color="#be185d"/>
          </div>

          <div style={{ marginTop: 20, background: tokens.bgAlt, borderRadius: 12, padding: '14px 16px', boxShadow: shadows.insetEdge, minHeight: 86 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#059669' }}>HMW </span>
            <span style={{ fontSize: 13, color: tokens.inkMuted, letterSpacing: '0.01em' }}>Type or paste a statement…</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 20px', background: 'rgba(5,150,105,0.12)', color: '#059669', border: 'none', borderRadius: 9999, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer', boxShadow: shadows.insetEdge }}>
              <IconSparkle size={12}/>CHECK AGAIN
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 18px' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: tokens.inkMuted }}>LATEST CRITIQUE</span>
          <div style={{ flex: 1, height: 1, background: tokens.border }}/>
          <span style={{ fontSize: 11, color: tokens.inkMuted, fontFamily: 'ui-monospace, monospace' }}>4:20:48 PM</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: shadows.outlineRing }}>
          <div style={{ ...display, fontSize: 20, lineHeight: 1.4, marginBottom: 22, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>HMW </span>
            <span style={{ background: 'rgba(14,165,233,0.14)', padding: '1px 4px', borderRadius: 3 }}>create ways and opportunities</span>{' '}
            <span style={{ background: tokens.amberSoft, padding: '1px 4px', borderRadius: 3 }}>for youths aged 15–25 during key life transitions</span>{' '}
            <span style={{ background: 'rgba(5,150,105,0.14)', padding: '1px 4px', borderRadius: 3 }}>to take early actions</span>{' '}
            <span style={{ background: 'rgba(190,24,93,0.1)', padding: '1px 4px', borderRadius: 3 }}>to cope with pressure</span>{' '}
            <span style={{ background: 'rgba(124,58,237,0.1)', padding: '1px 4px', borderRadius: 3 }}>and stay connected to safe, trusted support.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <LensCard bg="rgba(14,165,233,0.06)" accent="#0ea5e9" fragment='"create ways and opportunities"' body="Keeps the solution space open, inviting multiple formats (services, environments, routines, social supports) rather than a single product." tags={['Solution-Agnostic', 'Research Alignment']}/>
            <LensCard bg={tokens.amberSoft} accent={tokens.amber} fragment='"for youths aged 15–25 during key life transitions"' body="Defines who the HMW is for and when it matters most, preventing the prompt from becoming a generic mental health question." tags={['Appropriately Broad']} research="Desktop synthesis describes transition inflection points (IHL entry, career planning, financial independence) as where distress often emerges." researchTitle="Discover: Research Plan and Strategy"/>
            <LensCard bg="rgba(5,150,105,0.06)" accent="#059669" fragment='"to take early actions"' body="Pushes the team toward prevention and behaviour change, not just awareness or crisis response." needsWork={`Research states "I don't act on it unless things get bad." "Early actions" matches the desired shift, but doesn't yet include what blocks early action (de-prioritisation, stigma, self-reliance). Try: "take early action even when mental well-being feels less urgent than school, work, or social expectations".`}/>
            <LensCard bg="rgba(190,24,93,0.06)" accent="#be185d" fragment='"to cope with pressure"' body="Ties action to a real felt need, more motivating than abstract 'mental wellness' language for many youths." tags={['Outcome-Focused', 'Research Alignment']}/>
          </div>

          <div style={{ marginTop: 18, padding: '14px 16px', background: tokens.bgAlt, borderRadius: 12, boxShadow: shadows.insetEdge }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: tokens.inkMuted, marginBottom: 6 }}>SUMMARY</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.65, color: tokens.inkSecondary, letterSpacing: '0.01em' }}>
              A strong, usable HMW: solution-agnostic, positively framed, and well-anchored to the right audience and context (15–25, key transitions). The meaningful gap is that it doesn't explicitly name the core research tension (mental wellbeing gets deprioritised and action is delayed until things feel bad), so ideation may drift toward generic "support" ideas.
            </div>
          </div>
        </div>
      </div>
    </WorkspaceFrame>
  </div>
);

const FormulaPill = ({ label, sub, color }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '4px 10px', background: tokens.bgAlt, borderRadius: 8, boxShadow: shadows.insetEdge, lineHeight: 1.1 }}>
    <span style={{ fontSize: 11.5, fontWeight: 600, color }}>{label}</span>
    {sub && <span style={{ fontSize: 9.5, color: tokens.inkMuted, marginTop: 1 }}>{sub}</span>}
  </span>
);

const LensCard = ({ bg, accent, fragment, body, tags = [], research, researchTitle, needsWork }) => (
  <div style={{ background: bg, borderRadius: 12, padding: 14, boxShadow: shadows.insetEdge, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <IconBulb size={12} stroke={accent}/>
      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: tokens.inkSecondary, letterSpacing: '0.01em' }}>{body}</div>
    </div>
    <div style={{ fontSize: 11.5, fontStyle: 'italic', color: accent, fontWeight: 500 }}>{fragment}</div>
    {tags.map(t => (
      <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fff', borderRadius: 8, boxShadow: shadows.insetEdge }}>
        <span style={{ fontSize: 11.5, color: tokens.inkSecondary, fontWeight: 500 }}>✓ {t}</span>
      </div>
    ))}
    {research && (
      <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', boxShadow: shadows.insetEdge, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 11, color: tokens.inkSecondary, lineHeight: 1.5 }}>{research}</div>
        <div style={{ fontSize: 10.5, fontStyle: 'italic', color: tokens.inkMuted }}>Discover: {researchTitle}</div>
      </div>
    )}
    {needsWork && (
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', boxShadow: shadows.insetEdge, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: tokens.amber, padding: '2px 6px', borderRadius: 4, background: tokens.amberSoft }}>⚠ NEEDS WORK</span>
        </div>
        <div style={{ fontSize: 11, color: tokens.inkSecondary, lineHeight: 1.55 }}>{needsWork}</div>
      </div>
    )}
  </div>
);

Object.assign(window, { ParentsBatch1, ArchetypeProfile, Ideation, HMWAnalyser });
