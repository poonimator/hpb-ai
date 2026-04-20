# HPB AI Research Support Platform

**Comprehensive Platform Documentation**

*Health Promotion Board Singapore | Prepared by Aleph Labs*

---

## Table of Contents

1. [Introduction](#introduction)
   - [What the Platform Is](#what-the-platform-is)
   - [What the Platform Is Not](#what-the-platform-is-not)
   - [The HPB Sandbox Approach](#the-hpb-sandbox-approach)
   - [Platform Capabilities Overview](#platform-capabilities-overview)
2. [Architecture & Technology](#architecture--technology)
   - [Technical Architecture](#technical-architecture)
   - [System Guardrails](#system-guardrails)
   - [Data & Knowledge Base Structure](#data--knowledge-base-structure)
   - [Operational Requirements](#operational-requirements)
3. [How to Use the Platform](#how-to-use-the-platform)
   - [Getting Started: Dashboard and Project Setup](#1-getting-started-dashboard-and-project-setup)
   - [Moderator Guide](#2-moderator-guide)
   - [Interview Practice (Interview Simulation)](#3-interview-practice-interview-simulation)
   - [Affinity Mapping](#4-affinity-mapping)
   - [Profile Builder](#5-profile-builder)
   - [How Might We (HMW) Analyser](#6-hmw-how-might-we-analyser)
   - [Insight Statement Analyser](#7-insight-statement-analyser)
   - [Ideation (Crazy 8s Concept Generator)](#8-ideation-crazy-8s-concept-generator)
   - [Focus Group Simulation](#9-focus-group-simulation)
   - [End-to-End Research Journey](#10-putting-it-all-together-the-end-to-end-research-journey)
4. [AI Agent Prompt Parameters](#ai-agent-prompt-parameters)
   - [Global System Guardrails](#global-system-guardrails)
   - [Agent 1A: Question Validation Agent](#agent-1a-question-validation-agent)
   - [Agent 1B: Research Consistency Checker](#agent-1b-research-consistency-checker)
   - [Agent 2A: Synthetic Persona Simulation Agent](#agent-2a-synthetic-persona-simulation-agent)
   - [Agent 2B: Live Coach Agent](#agent-2b-live-coach-agent)
   - [Agent 2C: Post-Simulation Review Agent](#agent-2c-post-simulation-review-agent)
   - [Agent 3A: Affinity Mapping Agent](#agent-3a-affinity-mapping-agent)
   - [Agent 3B: Affinity Insights Agent](#agent-3b-affinity-insights-agent)
   - [Agent 4: Profile Builder Agent](#agent-4-profile-builder-agent)
   - [Agent 5: HMW Analysis Agent](#agent-5-hmw-analysis-agent)
   - [Agent 6: Insight Statement Analysis Agent](#agent-6-insight-statement-analysis-agent)
   - [Agent 7: Ideation Concept Generator](#agent-7-ideation-concept-generator)
   - [Agent Architecture Summary](#agent-architecture-summary)
5. [Governance & Security](#governance--security)
6. [Measures of Success](#measures-of-success)
7. [Future Roadmap](#future-roadmap)

---

## Introduction

### What the Platform Is

The HPB AI Research Support Platform is a purpose-built coaching and practice environment designed to strengthen the quality of human-centred research within Health Promotion Board (HPB) Singapore. Built on GPT-5.2 to ensure seamless migration to HPB's own infrastructure, the platform improves how research teams prepare for, practise, and reflect on interviews across the entire research lifecycle.

The platform does not replace real users or fieldwork. It operates as a structured support layer that reduces repetitive, low-value research tasks and builds stronger research judgment among practitioners. While it requires quality input to produce quality output, all outputs still require human and expert judgment before they are acted upon.

The platform is intended to:

- **Guide research methodology design** -- helping teams select and structure appropriate approaches before entering the field.
- **Improve moderator guide quality** -- coaching researchers to refine interview questions before they are used with real participants.
- **Provide safe, low-risk interview practice** -- allowing teams to rehearse in-depth interviews without the stakes of live fieldwork.
- **Reinforce clarity on what is known, assumed, and undiscovered** -- surfacing gaps and assumptions before they calcify into conclusions.
- **Support life-stage-aware research** -- grounding practice in HPB's specific population segments and behavioural frameworks.
- **Accelerate processing and simulation** -- quickly running through activities and stimulating new thinking where manual effort would be slow.
- **Generate interim thought-starters** -- producing early-stage, divergent prompts to enrich team discourse rather than narrow it.

### What the Platform Is Not

Equally important is what this platform will not do:

- It **does not generate research findings** and is not a substitute for fieldwork with real participants.
- It **will not produce evidence** suitable for direct decision-making.
- It **will not automate research synthesis** or insight generation -- those remain fundamentally human activities.
- It is **not a shortcut** around proper discovery work; it strengthens that work.
- It **will not produce ready-to-use final answers** -- all outputs are starting points for further refinement.
- It is **not enterprise-ready** for blanket use across all HPB projects; it is scoped to specific use cases within a controlled environment.

### The HPB Sandbox Approach

The platform operates exclusively within HPB's context. Every AI interaction is grounded in:

- **Singapore's social, cultural, and behavioural research landscape** -- ensuring relevance to HPB's population.
- **HPB's HIIP principles and mental well-being frameworks** -- embedding institutional knowledge into every interaction.
- **HPB's CX and HCD methodologies** -- aligning with established design research practice.
- **Evidence from project phases** -- drawing on project-specific documents, personas, and transcripts uploaded by research teams.

This is the **"Player and Coach" model**: the AI coaches the researcher, challenges their thinking, and provides structured practice -- but it never replaces the researcher. The human remains the decision-maker, the interpreter, and the one who walks into the room with real participants.

**<span style="color:red">[IMAGE: Diagram showing the "Player and Coach" model -- the researcher (Player) in the centre making decisions, with the AI (Coach) providing guidance, feedback, and structured practice around them]</span>**

### Platform Capabilities Overview

The platform is organised around seven core use cases that mirror the research workflow:

1. **Moderator Guide Coach** -- Reviews and strengthens interview guides before fieldwork, identifying leading questions, assumptions, and gaps.
2. **Interview Simulation** -- Combines a Synthetic Persona for realistic interview practice, a Live Coach that provides real-time guidance during the session, and a Post-Simulation Review that evaluates performance.
3. **Affinity Mapping and Pattern Spotting** -- Assists with organising qualitative data into thematic clusters for analysis.
4. **Profile Builder** -- Generates research-grounded behavioural archetypes from uploaded evidence and knowledge base documents.
5. **How Might We (HMW) Analyser** -- Critically evaluates HMW statements for clarity, scope, and actionability.
6. **Insight Statement Analyser** -- Assesses insight statements for grounding, specificity, and research rigour.
7. **Ideation (Crazy 8s Concept Generator)** -- Generates eight diverse, evidence-grounded design concepts from mapping data and profiles, each with an AI-generated concept illustration.

**<span style="color:red">[IMAGE: Overview diagram of the seven core use cases showing the research workflow from Moderator Guide through Interview Simulation, Affinity Mapping, Profile Builder, HMW Analyser, Insight Statement Analyser, and Ideation]</span>**

---

## Architecture & Technology

### Technical Architecture

The platform is built on a modern, full-stack TypeScript architecture designed for maintainability, security, and straightforward handover to HPB's technical teams.

**Frontend**

| Layer | Technology |
|-------|-----------|
| Framework | Next.js + React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component Library | Shadcn/UI (Radix UI primitives) |

**Backend**

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (Next.js API Routes) |
| Database (Production) | PostgreSQL |
| Database (Development) | SQLite |
| ORM | Prisma |
| Validation | Zod (TypeScript-first schema validation) |

**AI and Document Processing**

| Layer | Technology |
|-------|-----------|
| AI Model | OpenAI GPT-5.2 Enterprise |
| Retrieval | RAG (Retrieval-Augmented Generation) with Knowledge Base |
| Document Processing | pdf-parse for PDF text extraction |
| File Storage | Vercel Blob for document uploads |
| Speech-to-Text | Web Speech API (browser native) |

**<span style="color:red">[IMAGE: Architecture diagram showing the flow from frontend (Next.js + React) through API routes to AI services (OpenAI GPT-5.2), database (PostgreSQL), and knowledge base with RAG pipeline]</span>**

### System Guardrails

The platform enforces a strict set of guardrails to ensure AI behaviour remains bounded, safe, and useful within HPB's research context.

| Guardrail | Description |
|-----------|-------------|
| **Role Lock** | Personas are JTBD- and evidence-aligned. The AI stays strictly within the character and context defined by uploaded documents. It will not invent history, facts, or experiences outside the source material. |
| **Scope Lock** | The AI does not provide advice, diagnosis, coaching, or strategic recommendations. It simulates, coaches interview technique, and analyses -- nothing more. |
| **Context Lock** | All interactions are bounded to Singapore's social, cultural, and behavioural context. Any reference to external landscapes must be transparently sourced. |
| **Safety Lock** | The AI maintains a neutral, non-authoritative tone at all times. It questions rather than answers, reflecting how real participants respond -- with uncertainty and nuance. |
| **Behaviour Lock** | There is no "expert mode." The AI does not escalate into authority, advocate positions, or moralise. |
| **Technical Guardrails** | No exposed API endpoints beyond authenticated routes. All AI responses are grounded in knowledge base content. Comprehensive audit logging captures every interaction. Clear guardrails are enforced at the prompt level. |

### Data & Knowledge Base Structure

The knowledge base operates on a two-tier architecture that separates organisational knowledge from project-specific evidence.

**Global Knowledge Base**
- Contains organisation-wide frameworks, policies, and research methodologies.
- Includes HPB's HIIP principles, CX/HCD methodology documentation, and mental well-being frameworks.
- Shared across all projects within the platform.
- Managed centrally with approval workflows.

**Project Knowledge Base**
- Contains project-specific personas, research documents, interview transcripts, and fieldwork evidence.
- Scoped to individual projects, preventing cross-project data leakage.
- Each document uploaded goes through a **Draft to Approved** workflow before it feeds into the AI's retrieval context.

Both tiers feed into the RAG pipeline, ensuring that every AI response is grounded in vetted, approved documentation rather than general-purpose language model knowledge.

**<span style="color:red">[IMAGE: Diagram showing the two-tier knowledge base structure with Global KB (frameworks, policies) and Project KB (personas, transcripts) feeding into the RAG pipeline that grounds all AI responses]</span>**

### Operational Requirements

- **Knowledge base updates** must go through the Aleph HCD Principal for review and approval on a fortnightly cadence.
- **AI tools must supply a simple guide** showing safe, effective prompts for each use case -- ensuring consistent usage patterns across the team.
- **AI outputs must be reviewable in workshops** -- all generated content is designed to be printed, projected, and discussed collaboratively rather than silently consumed.

---

## How to Use the Platform

This section walks you through every major workflow in the HPB AI Research Support Platform, from initial setup through advanced synthesis and analysis. Follow the flows in order if you are a first-time user, or jump to the specific section you need.

---

### 1. Getting Started: Dashboard and Project Setup

#### 1.1 The Dashboard

When you first log in, you land on the **Dashboard** -- the central hub for all your research projects. Here you can see a list of every project you have access to, along with summary information such as project name, description, creation date, and the number of workspaces within each project.

**<span style="color:red">[IMAGE: Screenshot of the Dashboard showing the project list, with at least two example projects visible, the "Create New Project" button clearly highlighted, and the Global Knowledge Base link in the navigation]</span>**

From the Dashboard you can:

- **Open an existing project** by clicking on its card or row.
- **Create a new project** using the prominent creation button.
- **Access the Global Knowledge Base** from the navigation bar.

---

#### 1.2 Setting Up the Global Knowledge Base

Before creating your first project, it is recommended to populate the **Global Knowledge Base** with organisation-wide documents that will be shared across all projects. These typically include HPB policy frameworks, national health guidelines, established research methodologies, and any standardised templates your team uses.

1. Navigate to the **Global Knowledge Base** from the top navigation or sidebar.
2. Click **Upload Document** or **Add Document**.
3. Select the file from your computer (supported formats include PDF, DOCX, and TXT).
4. Add a descriptive title and any relevant tags to make the document easy to find later.
5. The document will appear with a **Draft** status. Review it, and when you are satisfied, change its status to **Approved**. Only approved documents are used by the AI during simulations and analysis.

**<span style="color:red">[IMAGE: Screenshot of the Global Knowledge Base page showing a list of uploaded documents with their titles, tags, status badges (Draft / Approved), and the Upload Document button]</span>**

> **Tip:** Think of the Global Knowledge Base as your team's shared library. Anything placed here -- such as the National Physical Activity Guidelines or the HPB Healthy Eating framework -- becomes available as grounding context for AI features across every project.

---

#### 1.3 Creating a New Project

1. From the Dashboard, click **Create New Project**.
2. Enter a **Project Name** -- choose something descriptive that your team will recognise (e.g., "Youth Mental Well-being Study 2026").
3. Enter a **Project Description** -- a brief summary of the research objectives and scope.
4. Click **Create** to confirm.

**<span style="color:red">[IMAGE: Screenshot of the Create New Project form showing the name field, description field, and the Create button]</span>**

You will be taken to the **Project Overview** page for your newly created project.

---

#### 1.4 The Project Overview

The Project Overview is your command centre for a specific project. It displays:

- The project name and description.
- A list of all **Workspaces** within the project (initially empty).
- Access to the **Project Knowledge Base**.
- Quick-action buttons for creating new workspaces.

**<span style="color:red">[IMAGE: Screenshot of the Project Overview page showing the project title, description, the empty workspaces area with a "Create Workspace" button, and the Project Knowledge Base link in the sidebar or navigation]</span>**

---

#### 1.5 Setting Up the Project Knowledge Base

Each project has its own **Project Knowledge Base**, separate from the Global one. This is where you upload documents specific to this research effort -- personas from prior studies, literature reviews, preliminary interview transcripts, screener data, or any project-specific reference material.

1. From the Project Overview, navigate to the **Project Knowledge Base**.
2. Click **Upload Document**.
3. Select your file, add a title and tags.
4. The document enters **Draft** status. Review it and move it to **Approved** when ready.

**<span style="color:red">[IMAGE: Screenshot of the Project Knowledge Base showing a mix of Draft and Approved documents, with clear visual distinction between the two statuses, and the upload controls visible]</span>**

> **Important:** The AI draws on both the Global and Project Knowledge Bases during simulations and analysis. Documents left in Draft status will not be referenced by the AI. Always approve documents you want the AI to use.

---

#### 1.6 Creating a Workspace

A **Workspace** represents a specific research track or study within your project. You might have one workspace for "Exploratory Interviews with Teens" and another for "Parent Perception Study" -- both under the same project.

1. From the Project Overview, click **Create New Workspace**.
2. Enter a **Workspace Name** (e.g., "Phase 1 -- Youth Exploratory").
3. Enter a **Research Statement** -- a clear articulation of what this line of inquiry aims to discover (e.g., "To understand the social and emotional triggers that lead young adults aged 18--25 to initiate vaping behaviour").
4. Define the **Age Range** of your target participants (e.g., 18--25).
5. Select the relevant **Life Stage** (e.g., Young Adult, Working Adult, Senior).
6. **Upload Personas** -- if you have pre-existing persona documents, upload them here. These personas will be available as synthetic participants during interview simulations.
7. Click **Create** to finalise the workspace.

**<span style="color:red">[IMAGE: Screenshot of the Create New Workspace form showing all fields filled in -- name, research statement, age range selector, life stage dropdown, persona upload area with a file attached, and the Create button]</span>**

---

### 2. Moderator Guide

The Moderator Guide Coach helps researchers refine their approach to designing and structuring interview questions. Every workspace needs a **Moderator Guide** -- the structured set of questions and probes that guide your interview simulation. The platform lets you either paste an existing guide or build one from scratch, and the AI will validate it for you.

1. From your workspace, navigate to **Moderator Guide Setup**.
2. Choose one of the following:
   - **Paste an existing guide** -- copy your moderator guide text and paste it into the editor. The AI will automatically parse it into structured sections, questions, and follow-ups while preserving the original text verbatim.
   - **Create from scratch** -- use the structured editor to add sections, questions, and probes manually.
3. Once your guide is entered, click **Validate with AI**.
4. The AI will review your guide and provide feedback on:
   - **Question quality** -- flags leading, double-barrelled, closed-ended, judgmental, unclear, or overly long questions.
   - **Research consistency** -- cross-references your questions against existing Knowledge Base documents to identify redundant questions that re-test established knowledge.
   - **Coverage gaps** -- identifies areas where new insight opportunities are not being explored relative to your research objectives.
5. Review the AI's feedback, make any adjustments, and save.

**<span style="color:red">[IMAGE: Screenshot of the Moderator Guide Setup page showing a pasted moderator guide in the editor on the left, with the AI validation panel on the right displaying feedback items -- some marked as passing, some flagged with quality issues (e.g., "Leading: HIGH severity") and coaching suggestions]</span>**

**<span style="color:red">[IMAGE: Screenshot of the Research Consistency Check panel showing a flagged question alongside the existing research excerpt from the Knowledge Base, the document source title, and the coaching suggestion]</span>**

> **Note on the Player & Coach Model:** The AI does not rewrite your guide for you. It highlights areas for improvement and explains *why*, empowering you to make the final editorial decisions. The researcher always retains ownership and judgment over their questions.

---

### 3. Interview Practice (Interview Simulation)

The Interview Simulation environment lets you practise your qualitative interviewing skills by conducting realistic conversations with AI-generated synthetic personas, while an AI coach observes and provides real-time guidance.

#### 3.1 Configuring the Simulation

1. From your workspace, navigate to the **Interview Simulation** or click **Start Simulation**.
2. You will land on the **Simulation Settings** page. Here you can configure:
   - **Session name** -- a label for this practice session.
   - **Simulation mode preferences** -- any specific scenario or context you want the synthetic persona to embody.
   - Review your selected **Moderator Guide** (the one you set up earlier will be pre-loaded).

**<span style="color:red">[IMAGE: Screenshot of the Simulation Settings page showing the session configuration options, with the moderator guide preview panel and the "Start Session" or "Next" button]</span>**

3. Click **Next** or **Start Session** to proceed to persona selection.

---

#### 3.2 Selecting a Synthetic Persona and Adjusting Persona Parameters

Before the interview begins, you select who you will be talking to and fine-tune their personality characteristics.

1. **Select a Synthetic Persona** from the list of available personas (these come from the personas you uploaded during workspace creation, plus any in the Knowledge Bases).
2. Once a persona is selected, the **Persona Parameters** panel appears. This gives you granular control over the persona's simulated behaviour:

| Parameter | What It Controls |
|---|---|
| **Emotional Tone** (0--100) | How emotionally expressive or reserved the persona is during the conversation. Low values produce quiet, guarded responses; high values produce animated, passionate responses. |
| **Response Length** (Short / Medium / Long) | Whether the persona gives short, clipped answers or longer, detailed responses. |
| **Thinking Style** (Concrete / Abstract) | Whether the persona uses specific real-life examples and stories (concrete) or shares reflective thoughts and feelings (abstract). |
| **Mood Swings** (0--100) | How stable or volatile the persona's emotional state is throughout the session. Low values keep mood consistent; high values introduce noticeable emotional shifts between topics. |
| **Singlish Level** (0--100) | The degree to which the persona uses Singlish expressions, grammar, and colloquialisms -- reflecting real-world Singaporean speech patterns. |

3. Adjust each slider to create the conversational dynamic you want to practise with. For example, set **Emotional Tone** to high, **Response Length** to short, and **Mood Swings** to high to practise interviewing a guarded, emotionally reactive participant.

**<span style="color:red">[IMAGE: Screenshot of the persona selection screen showing a selected persona card with their name and brief description, alongside the Persona Parameters panel with all five sliders (Emotional Tone, Response Length, Thinking Style, Mood Swings, Singlish Level) adjusted to various positions]</span>**

4. Click **Start Interview** to begin the live simulation.

---

#### 3.3 The Live Interview Simulation

This is the core experience. Your screen is divided into several key areas:

- **Chat Window** (centre) -- where the conversation between you and the synthetic persona takes place.
- **Moderator Guide Panel** (side) -- your guide is visible for reference at all times, so you can track which questions you have covered and which remain.
- **Live Coach Nudges** (overlay or side panel) -- real-time suggestions from the AI coach that appear as you conduct the interview.

**<span style="color:red">[IMAGE: Screenshot of the Live Interview Simulation screen showing the chat window with several exchanges between the researcher and synthetic persona, the moderator guide panel on the side with progress indicators showing covered/uncovered questions, and a Live Coach nudge notification visible]</span>**

**Conducting the interview:**

1. Type your question or prompt in the message input at the bottom of the chat window. Alternatively, click the **microphone icon** to use **voice input** via your browser's speech-to-text capability.
2. The synthetic persona will respond in character, drawing on their persona profile, the Knowledge Base context, and your Persona Parameter settings. The persona behaves like a real person -- using filler words, sometimes going on tangents, asking for clarification, and matching response length to question weight.
3. Continue the conversation naturally, following your moderator guide while remaining flexible to explore unexpected threads.

**Reading and acting on Live Coach nudges:**

As you interview, the AI coach monitors the conversation and surfaces **live nudges** -- gentle, real-time suggestions that appear without interrupting the flow. Examples include:

- "The participant just hinted at a deeper emotional trigger. Consider probing with 'Can you tell me more about how that made you feel?'"
- "You have been on this topic for a while. Your guide has three more sections to cover."
- "The participant gave a one-word answer. Try using silence or a softer probe like 'What do you mean by that?'"

The coach also identifies:
- **Emotional signals and hedging language** -- words like "hate", "stressed", "sometimes", "I guess" that indicate deeper feelings worth exploring.
- **Behavioural patterns and contradictions** -- say-do gaps or conflicting priorities.
- **Specific examples worth unpacking** -- personal anecdotes or named experiences.

> **Tip:** You do not have to follow every nudge. They are coaching suggestions, not commands. The goal is to build your awareness and interviewing instincts over time.

**<span style="color:red">[IMAGE: Close-up screenshot of a Live Coach nudge appearing during the interview, showing the nudge text with a highlighted verbatim quote from the persona's response, the surfaced context, and a suggested follow-up direction]</span>**

**Pausing and resuming:**

- You can **pause** the session at any time if you need to step away. The conversation state is fully preserved.
- When you return, click **Resume** to pick up exactly where you left off.

4. When you have covered your guide or want to end the session, click **End Interview**.

---

#### 3.4 Post-Simulation Review

After ending the interview, you are taken to the **Post-Simulation Review** screen. This is where the AI coach provides a comprehensive analysis of your performance.

**<span style="color:red">[IMAGE: Screenshot of the Post-Simulation Review page showing the overall score (1--10 scale), the full transcript on one side, and the structured evaluation panel with highlights and flagged moments on the other]</span>**

The review includes:

1. **Full Transcript** -- a complete, scrollable record of the entire interview conversation. Each message is timestamped and attributed.

2. **Coach Review Analysis** -- a structured evaluation of your interviewing technique. The AI evaluates **only your questions and conversational management** (not the persona's responses). It assesses each question against clear criteria:

| Criterion | Description |
|---|---|
| **Good Technique** | Open-ended, neutral, invites elaboration |
| **Leading** | Puts words in participant's mouth |
| **Closed** | Yes/No that kills conversation |
| **Stacked/Complex** | Multiple questions at once |
| **Off-Topic** | Not aligned with research goals or guide |
| **Assumptions** | Contains interviewer's assumptions or biases |

3. **Missed Opportunity Cards** -- specific moments in the interview where the coach identified a missed opportunity to probe deeper, redirect, or explore an important thread. Each card shows:
   - The moment in the conversation where the opportunity arose.
   - What the participant said that warranted follow-up.
   - A suggested alternative approach you could have taken.

**<span style="color:red">[IMAGE: Close-up screenshot of two or three Missed Opportunity Cards, each showing the conversation excerpt, the missed signal, and the coach's suggested alternative approach]</span>**

4. **"Ask Your Coach" Dialog** -- an interactive chat interface where you can ask the AI coach follow-up questions about your performance. The coach uses a discovery-based approach -- guiding you with reflective questions rather than giving you the exact words to say. For example:
   - "Why did you suggest I probe more at that point?"
   - "How could I have better handled the participant's resistance?"
   - "What techniques can I use to get longer responses from quiet participants?"

**<span style="color:red">[IMAGE: Screenshot of the "Ask Your Coach" dialog open, showing a researcher's question and the coach's brief, focused response with specific references to moments in the transcript]</span>**

> **Remember:** All coach feedback is traceable to specific moments in your transcript and grounded in the documents in your Knowledge Base. This is not generic advice -- it is contextual coaching tied to your actual performance.

---

### 4. Affinity Mapping

Affinity Mapping helps you synthesise qualitative data from real interviews (not simulations) into thematic clusters. The AI assists with initial clustering, but you retain full control to reorganise and refine.

#### 4.1 Setting Up an Affinity Mapping Session

1. From your workspace, navigate to the **Affinity Mapping** section.
2. Click **Create New Mapping Session**.
3. Give the session a name (e.g., "Round 1 Interview Synthesis").
4. **Upload interview transcripts** -- drag and drop or browse to select one or more transcript files. These should be transcripts from real interviews you have conducted.
5. Click **Start Mapping** to let the AI process the transcripts.

**<span style="color:red">[IMAGE: Screenshot of the Affinity Mapping setup page showing the session name field, the transcript upload area with files being uploaded, and the Start Mapping button]</span>**

> **Note:** The AI will parse all uploaded transcripts, extract meaningful verbatim quotes and observations, and propose an initial set of thematic clusters. This process may take a moment depending on the volume of data.

---

#### 4.2 The Affinity Mapping Board

Once processing is complete, you are taken to the **Affinity Mapping Board** -- a visual, interactive workspace for organising your qualitative data.

**<span style="color:red">[IMAGE: Screenshot of the Affinity Mapping Board showing multiple theme columns (e.g., "Pressures/Stressors", "Barriers to Action", "Support Ecosystem"), each containing several quote cards. The cards should show colour-coded tags, participant names, and short quote excerpts. Some cards should appear in the process of being dragged between columns]</span>**

The board displays:

- **Theme Columns** -- each column represents a thematic cluster identified by the AI. Column headers show the theme name. Standard reference themes include Pressures/Stressors, Motivations to Take Action, Barriers to Action, Mental Model, Life Prioritisation, Support Ecosystem, Digital Ecosystem, Routines and Behaviours, and Protective Factors.
- **Quote Cards** -- individual cards within each column, each containing:
  - A verbatim quote from the transcript.
  - The **participant name** (attributed to the interviewee).
  - **Colour-coded tags** indicating the theme category.

**Working with the board:**

1. **Review the AI-generated clusters** -- read through each theme and the quotes assigned to it. Assess whether the groupings make sense.
2. **Drag and drop cards** between columns to reorganise them. If a quote fits better under a different theme, simply drag it there.
3. **Create new theme columns** if you identify a cluster the AI missed.
4. **Rename themes** by clicking on the column header and typing a new name.
5. **Add new observations** and link them to specific participants if they were not automatically captured.
6. **Remove quote cards** that you deem irrelevant or inaccurate.
7. **View stacked quotes** that are linked and talk about the same thing, allowing you to read all underlying data points without them overwhelming the board.

**<span style="color:red">[IMAGE: Screenshot showing a close-up of the drag-and-drop interaction -- a quote card being moved from one theme column to another, with visual feedback indicating the drop target]</span>**

> **Tip:** The AI provides a strong starting point, but the most valuable insights often come from the researcher's own reorganisation process. Spend time with the board, move things around, and let patterns emerge.

---

#### 4.3 Affinity Insights View

Once you are satisfied with your thematic clustering, toggle from the **Mapping** view to the **Insights View** for a structured synthesis of what the data is telling you.

**<span style="color:red">[IMAGE: Screenshot of the Affinity Insights View showing the three-column framework: "Found Out" on the left, "Look Further" in the centre, and "New Areas" on the right, each populated with insight cards derived from the affinity map]</span>**

The Insights View presents a **three-column decision framework**:

| Column | Purpose | In Simple Terms |
|---|---|---|
| **Found Out** | Strong patterns and solidified insights -- findings that are clear, repetitive across multiple participants, and/or strongly supported by HPB frameworks. This is what has been confirmed and validated. | "Things we are now confident about" |
| **Look Further** | Tensions, gaps, and ambiguities -- contradictions between participants, say-do gaps (people say one thing but do another), areas that match existing research but need more validation or add complexity. | "Things that are unclear or conflicting -- we need to dig deeper" |
| **New Areas** | White space and novel opportunities -- completely novel findings present in the new interview data but absent from any existing research. Unexpected behaviours or motivations that suggest a totally new angle. | "Things nobody has looked at before -- fresh opportunities" |

**Using the Insights View:**

1. Review each column carefully. The AI populates these based on the strength and distribution of evidence in your affinity map, cross-referenced against the project Knowledge Base.
2. Each insight card can be **expanded** to read the specific research citations and the AI's justification -- so you can inspect the exact evidence used and not blindly accept the categorisations.
3. If a particular insight does not resonate or seems off-base, you can click the **Regenerate** button. The AI will re-analyse the current state of your affinity board and produce a fresh set of insights.
4. Use the insights to inform your next steps -- whether that means conducting more interviews (Look Further), designing new studies (New Areas), or moving to synthesis and reporting (Found Out).

**<span style="color:red">[IMAGE: Screenshot showing an expanded insight card with the specific research citations, evidence quotes, document sources, and the AI's justification for categorising it under its column]</span>**

**<span style="color:red">[IMAGE: Screenshot showing the Regenerate button being highlighted, with a confirmation that regeneration will re-analyse the current affinity map data]</span>**

---

### 5. Profile Builder

The Profile Builder transforms unstructured qualitative data (from completed affinity mapping sessions and interview transcripts) into sharp, actionable, and honest behavioural profiles. Rather than producing aspirational or generic marketing personas, the AI generates realistic archetypes grounded strictly in verbatim evidence.

#### 5.1 Creating a Profile Building Session

1. From your workspace, navigate to the **Profile Builder**.
2. Click **Create New Session**.
3. **Select mapping sessions** -- choose one or more completed Affinity Mapping sessions to use as the ground-truth data for profile generation. The AI will draw on the clustered themes and quotes from these sessions. Nothing is auto-included; the researcher decides what feeds the profile.

**<span style="color:red">[IMAGE: Screenshot of the Profile Builder session creation page showing a list of available mapping sessions with checkboxes, allowing the user to select which ones to include as source data for profile generation]</span>**

4. Click **Generate Profiles** and wait for the AI to process the data.

---

#### 5.2 Reviewing Generated Profiles

The AI produces a set of **behavioural archetypes** -- typically 3 to 5 distinct profiles, depending on the diversity and volume of your source data.

**<span style="color:red">[IMAGE: Screenshot of the Profile Builder overview page showing multiple archetype cards in a grid layout. Each card displays the archetype name (e.g., "The Guilt Tripper", "The Last-Minute Rusher"), a brief kicker summary, and key attributes at a glance]</span>**

Click on any archetype card to view its **Profile Details** page, which contains a rich, multi-dimensional profile:

- **Name and Kicker** -- a sharp behavioural title (3--4 words) and one punchy sentence capturing the core operating principle.
- **Description** -- a brutally honest but empathetic 3--4 sentence summary of who this person is.
- **Demographics** -- age range, occupation, and living setup derived from the data.
- **Influences** -- 3--4 external forces that shape their mindset and behaviour, with mechanisms explained.
- **Lived Experience** -- a narrative describing their internal experience and inner monologue. Reframes their behaviour, explains why it makes sense to them, then names the real problem underneath.
- **Behaviours** -- 3--4 observable action patterns they actually do (not what they wish they did).
- **Barriers** -- specific blockers with explanations of *why* they block action.
- **Motivations** -- honest, human drivers (often social, emotional, or ego-driven).
- **Goals** -- immediate, practical objectives (what they want right now).
- **Habits** -- automatic, unconscious default behaviours.
- **The Spiral** -- a step-by-step downward cascade pattern showing how stress, uncertainty, or avoidance cascades into worse outcomes, along with guidance on how supporters or systems can break the pattern.

**<span style="color:red">[IMAGE: Screenshot of a detailed Profile page showing the archetype name, kicker, description, and clearly labelled sections for Influences, Lived Experience, Behaviours, Barriers, Motivations, Goals, Habits, and The Spiral, each populated with specific content derived from the source data]</span>**

> **Key benefit:** These generated profiles can be used directly as synthetic personas in your interview simulations. This creates a powerful feedback loop: real interview data feeds into archetypes, which then power more realistic simulations for training.

---

### 6. HMW (How Might We) Analyser

The HMW Analyser helps researchers sharpen their "How Might We" statements -- a critical design thinking tool for framing actionable research and design challenges -- before moving into ideation.

#### 6.1 Entering and Analysing an HMW Statement

1. From your workspace, navigate to the **HMW Analyser**.
2. Type or paste your HMW statement into the input field (e.g., "How might we help young Singaporeans find enjoyable ways to be physically active despite their busy schedules?").
3. Click **Analyse**.

**<span style="color:red">[IMAGE: Screenshot of the HMW Analyser input page showing the text input field with an example HMW statement entered, and the Analyse button below it]</span>**

4. The AI evaluates your statement against the **Nielsen Norman Group (NN/g) 5-lens framework**:

| Lens | What It Checks |
|---|---|
| **Grounded in a Real Problem** | Does it stem from actual research findings, not assumptions? |
| **Solution-Agnostic** | Does it leave the solution space wide open rather than embedding a specific solution? |
| **Appropriately Broad** | Is it wide enough for creative ideas but still tethered to a specific problem? |
| **Focused on Desired Outcome** | Does it target the root problem rather than a symptom? |
| **Positively Framed** | Does it use positive action verbs ("create", "enhance") rather than deficit framing ("reduce", "prevent")? |

5. The AI also **breaks the statement into its component phrases**, annotating which parts are strengths, which are issues, and which are neutral -- with a brief insight explaining why each works or does not.

6. The AI **cross-references the statement** against the project's approved research and Knowledge Base documents -- citing specific document titles, near-verbatim quotes, and explaining how the evidence supports or contradicts the HMW's grounding.

**<span style="color:red">[IMAGE: Screenshot of the HMW analysis results showing the 5-lens critique with visual indicators (Pass / Needs Work / Fail badges) for each lens, the statement breakdown with colour-coded phrases (green for strength, red for issue, grey for neutral), and research evidence cards with document sources and quotes]</span>**

#### 6.2 Iterating on Your Statement

The analyser is designed for **iterative refinement**:

1. Read the critique for each lens carefully.
2. Revise your HMW statement based on the feedback.
3. Paste the revised version back into the input field and click **Analyse** again.
4. Repeat this cycle until your statement passes all five lenses.
5. All critiques are **persisted and visible** in the workspace for the team to review.

> **Tip:** Do not try to fix everything at once. Focus on the most critical lens first, revise, and re-analyse. Each iteration should bring you closer to a well-framed HMW statement.

**<span style="color:red">[IMAGE: Screenshot showing an improved HMW statement after iteration, with more lenses now passing compared to the first attempt, demonstrating the iterative improvement process]</span>**

---

### 7. Insight Statement Analyser

The Insight Statement Analyser evaluates whether insight statements meet the bar required for actionable, design-directive insights -- rather than surface-level observations or motivational slogans.

#### 7.1 Entering and Analysing an Insight Statement

1. From your workspace, navigate to the **Insight Statement Analyser**.
2. Type or paste your insight statement into the input field (e.g., "Young working adults in Singapore skip meals not because they lack nutrition knowledge, but because eating healthily feels incompatible with their identity as busy, high-performing professionals.").
3. Click **Analyse**.

**<span style="color:red">[IMAGE: Screenshot of the Insight Statement Analyser input page showing the text input field with an example insight statement entered, and the Analyse button]</span>**

4. The AI assesses your insight against **5 quality criteria**:

| Criterion | What It Checks |
|---|---|
| **Well-Informed** | Is it grounded in multiple data sources -- triangulated across secondary research, lived experience, and SME input? |
| **More Than an Observation** | Does it explain the *how* or *why* behind the phenomenon, revealing a non-obvious mechanism or reframe? |
| **So What?** | Does it name the tension and stakes -- why this matters and what needs to change? |
| **Sticky** | Is it memorable and repeatable? Could it become team shorthand? |
| **Actionable** | Does it inspire novel solutions? Can you immediately imagine 3+ different interventions? |

5. Each criterion receives a clear verdict (**Pass / Needs Work / Fail**) with a concise explanation and an improvement tip where needed.

**<span style="color:red">[IMAGE: Screenshot of the Insight Statement analysis results showing the 5-criteria assessment with visual scoring (Pass / Needs Work / Fail) for each criterion, grouped by verdict status for quick scanning, along with detailed feedback text]</span>**

#### 7.2 Iterating on Your Insight Statement

1. Review the assessment for each criterion.
2. Revise your insight statement to address the weaknesses identified.
3. Re-submit the revised statement and analyse again.
4. Continue iterating until the statement meets all five criteria.
5. All critiques are **persisted and accessible** from the workspace, allowing the team to track quality over time.

**<span style="color:red">[IMAGE: Screenshot showing a refined insight statement with improved verdicts across the criteria, demonstrating successful iteration]</span>**

> **Remember:** A strong insight statement should reveal something non-obvious about human behaviour and point toward an actionable direction. The analyser helps you pressure-test your thinking, but the final judgment is always yours.

---

### 8. Ideation (Crazy 8s Concept Generator)

The Ideation feature uses the **Crazy 8s** design thinking framework to rapidly generate eight diverse, evidence-grounded concepts from your research data. Each concept is accompanied by an AI-generated illustration, allowing the team to see the idea at a glance rather than relying on abstract descriptions. This bridges the gap between research synthesis and design response -- turning clusters, insights, and profiles into concrete directions that can be discussed, prototyped, and tested.

#### 8.1 Creating a New Ideation Session

1. From your workspace, navigate to the **Ideation** tab (located between Profiles and How Might We).
2. Click **New Ideation** to open the setup page.
3. **Select a completed Mapping session** -- the cluster data and any generated insights will be used as the evidence base for ideation. Only mappings with status `Complete` are available for selection.
4. **Select one or more Profiles (optional)** -- choose from your workspace's generated archetypes and any persona documents from the global or project Knowledge Base. Selected profiles anchor the concepts to specific user groups. If none are selected, the AI relies solely on mapping data and project context.
5. **Select Creative Focus Areas (optional)** -- tick any of the 16 creative matrix enablers to nudge the AI toward specific lenses. Examples include *Technology & Digital Media*, *Events & Programmes*, *Public Policies & Laws*, *Games & Competitions*, *Hotspots & Hangouts*, *Surprise & Provocation*, and others. If no focus areas are chosen, the AI considers all 16 and picks only those genuinely relevant to the project.
6. Click **Ideate -- Generate 8 Concepts** to trigger the generation pipeline.

**<span style="color:red">[IMAGE: Screenshot of the Ideation setup page showing the mapping selection (with one mapping picked), the profile multi-select (with several archetypes and KB personas visible), the 16-cell creative focus area grid (with a few cells ticked), and the Ideate button at the bottom]</span>**

#### 8.2 The Generation Pipeline

Generation runs in two phases behind a unified loading screen:

1. **Text Generation** -- GPT-5.2 produces eight distinct concepts as structured JSON. The prompt carries the full project context (name, description, research statement, age range, life stage), the mapping clusters grouped by theme, any generated insights, all selected profiles (with demographics, goals, motivations, ground truth, and spiral patterns), and the selected creative focus areas.
2. **Image Generation** -- Once the eight concepts are produced, the platform calls `gpt-image-1.5` eight times in parallel, one for each concept. Each illustration is generated from the concept's "how does it work" description and rendered as a clean, professional design-thinking sketch.

The total round trip typically takes 60--120 seconds. The screen cycles through status messages such as *"Reading mapping data & profiles..."*, *"Applying creative matrix lenses..."*, *"Generating 8 concepts..."*, and *"Generating concept images..."*

**<span style="color:red">[IMAGE: Screenshot of the Ideation generation loading screen showing the pulsing Zap icon, the phase status text, and the note about the 2-minute generation time]</span>**

#### 8.3 Reviewing the 8 Concepts

Once generation completes, you are taken to the Ideation results page. Eight concept cards are arranged in a 4-column by 2-row grid, each showing:

- The **concept name** (2--5 word, memorable title)
- The **generated illustration** (square visual preview)
- A **one-sentence tagline** describing what it does

**<span style="color:red">[IMAGE: Screenshot of the Ideation results page showing the full 4x2 grid of 8 concept cards, each with a name, illustration, and tagline. Above the grid, a full-width header shows the session name, date, concept count, and a Regenerate button]</span>**

#### 8.4 Opening a Concept in Detail

Click any concept card to open it in a full-screen detail overlay. Each concept is structured across four rows:

**Row 1 -- Concept Name:** The concept title as a large heading.

**Row 2 -- Who / What / Big Idea (three columns):**

| Field | Description |
|---|---|
| **Who is it for?** | The specific target user segment, named in plain language (e.g., "teenagers in secondary school who juggle CCAs and family pressure"). |
| **What problem does it solve?** | The specific problem or tension the concept addresses, tied to a source in the mapping data, insights, or profiles. |
| **What is the big idea?** | The core concept and what makes it distinctive -- the creative leap from data to idea. |

**Row 3 -- How does it work?:** The AI-generated illustration alongside a vivid 50--100 word description of the concept in action (what the user sees, touches, or experiences).

**Row 4 -- Fail / Prototype / Measure (three columns):**

| Field | Description |
|---|---|
| **Why might it fail?** | The biggest risk or assumption underlying the concept. |
| **What should we prototype and test?** | The minimum viable prototype that would validate the core assumption. |
| **How might we measure success?** | One or two concrete success metrics appropriate for the audience and concept. |

Every field (except the concept name and the "how does it work" image) is accompanied by a **Source** (the specific mapping theme, profile, or insight it draws from) and a **Why** (a one-sentence explanation of how the source justifies the decision). This traceability ensures each concept is grounded in the evidence rather than invented.

**<span style="color:red">[IMAGE: Screenshot of the concept detail overlay showing the 4-row structure: the concept name at the top, three cards for Who/What/Big Idea with Source and Why citations in dark green, the How Does It Work image and description, and three cards for Fail/Prototype/Measure with their citations]</span>**

#### 8.5 Diversity of Concept Types

A deliberate constraint of the Ideation agent is that the eight concepts must span a **genuine mix of categories** -- not eight variations of the same app. Depending on the research data, an ideation session might produce a digital tool, a physical product, an event or programme, a policy intervention, a gamified mechanic, a partnership approach, an environmental design, or a hybrid concept that blends multiple categories. The AI is explicitly instructed to only propose digital solutions where the evidence supports them and to resist defaulting to a single solution type.

#### 8.6 Regenerating for a Separate Batch

If you want to explore additional directions with the same or modified inputs, click the **Regenerate** button in the results header. A short note clarifies that *"Regeneration creates a separate batch. Your current batch will remain accessible."*

Regenerating takes you back to the setup page with your original mapping, profiles, and focus areas pre-filled. You can adjust any selection before re-running. Each regeneration is saved as a **separate ideation card** in the workspace's Ideation tab, so the original batch and every subsequent batch remain available for comparison.

**<span style="color:red">[IMAGE: Screenshot of the Ideation tab showing the "New Ideation" card on the left and multiple saved ideation batch cards (each with a lightning-bolt icon, session name, date, and "8 concepts" metadata) stacked alongside it]</span>**

> **Remember:** The eight concepts are a starting point for team conversation, not a final answer. Use them to open up the solution space, spark debate, select the most promising directions, and decide what to take forward into more rigorous prototyping.

---

### 9. Focus Group Simulation

The Focus Group Simulation extends the one-on-one interview format into a **multi-persona group setting**, allowing you to practise moderating a discussion with 2 to 4 AI-generated archetypes simultaneously.

#### 9.1 Setting Up a Focus Group

1. From your workspace, navigate to the **Focus Group Simulation**.
2. **Select 2 to 4 archetypes** from your generated profiles to participate in the group. Choose archetypes with contrasting perspectives to create realistic group dynamics.
3. Review the session configuration and moderator guide.
4. Click **Start Focus Group**.

**<span style="color:red">[IMAGE: Screenshot of the Focus Group setup page showing the archetype selection panel with 3 archetypes selected (each shown with their name, kicker, and brief descriptor), the session configuration summary, and the Start button]</span>**

---

#### 9.2 Conducting the Focus Group

The focus group interface is similar to the interview simulation but adapted for multiple participants:

- **Multiple personas** appear in the chat, each with a distinct name and conversational style.
- Personas **see each other's responses and react** -- they may agree, disagree, build on each other's points, or introduce new perspectives organically.
- You can **@mention** a specific persona to direct a question to them (e.g., "@Mei Ling, what do you think about what Daniel just said?").
- Personas respond **sequentially** with natural staggering, and will stay silent when a topic does not relate to their experience.
- The AI coach continues to provide **live nudges**, now adapted for group dynamics (e.g., "Sarah has been quiet -- consider drawing her into the conversation").

**<span style="color:red">[IMAGE: Screenshot of the live Focus Group Simulation showing a multi-participant chat with at least three different personas responding, an @mention being used to direct a question, the moderator guide panel on the side, and a Live Coach nudge suggesting the researcher engage a quieter participant]</span>**

**Tips for effective focus group moderation practice:**

- Use **@mentions** strategically to ensure all participants contribute.
- Watch for moments of natural disagreement between archetypes -- these are rich territories for probing.
- Practise managing dominant voices without shutting them down.
- Use your moderator guide as a roadmap, but be flexible enough to follow the group's energy.

---

#### 9.3 Focus Group Summary and Cross-Profile Comparison

After the focus group ends, the system generates two types of analysis:

**Individual Profile Summaries** -- for each participating archetype:
- How that profile responded to the discussion overall.
- Specific points of acceptance, resistance, confusion, or enthusiasm.
- Any say-do gaps that surfaced (e.g., a profile verbally approved a concept but behaviourally signalled avoidance).

**Cross-Profile Comparison** -- across all participants:
- Where different profiles agreed vs. diverged.
- Themes that came up across multiple archetypes (potential strengths).
- Consistent friction points or concerns (potential risks).
- Areas where profiles contradicted each other (tensions worth investigating with real users).
- Suggested probes or discussion angles for upcoming real fieldwork.

Every finding links back to the **specific moment in the transcript** and the evidence base of the archetype that raised it -- maintaining full traceability.

**<span style="color:red">[IMAGE: Screenshot of the post-Focus Group review showing the individual profile summaries for each archetype, and the cross-profile comparison highlighting areas of agreement, divergence, and tension, with transcript references]</span>**

---

### 10. Putting It All Together: The End-to-End Research Journey

The platform is designed so that each feature feeds into the next, creating a continuous research and learning loop:

1. **Set up** your project, knowledge bases, and workspace (Section 1).
2. **Prepare your moderator guide** with AI-powered validation and research consistency checks (Section 2).
3. **Practise** your interviewing skills in the Interview Simulation until you feel confident with your guide and technique (Section 3).
4. **Conduct real interviews** in the field (outside the platform).
5. **Upload transcripts** and run Affinity Mapping to synthesise your findings (Section 4).
6. **Generate profiles** from your affinity data to create evidence-based behavioural archetypes (Section 5).
7. **Refine your HMW statements** and insight statements using the analysers (Sections 6 and 7).
8. **Generate eight concept directions** using the Ideation (Crazy 8s) feature, grounded in your mapping data and profiles, to translate synthesis into concrete design opportunities (Section 8).
9. **Run focus group simulations** using your generated archetypes to explore group dynamics and test concepts (Section 9).
10. **Iterate** -- use insights from each phase to improve your knowledge bases, refine personas, and sharpen your research approach for subsequent rounds.

**<span style="color:red">[IMAGE: Diagram or flowchart showing the end-to-end journey across the platform -- from project setup through interview practice, real-world interviews, affinity mapping, profile building, HMW and insight analysis, ideation, and focus group simulation, with arrows showing how outputs from one phase feed into the next]</span>**

> **The Player & Coach philosophy** runs through every feature: the AI accelerates your work and sharpens your skills, but you -- the researcher -- are always the one making the decisions, interpreting the data, and owning the insights. The platform is your training ground and synthesis partner, never a replacement for human judgment.

---

## AI Agent Prompt Parameters

This section defines the complete inventory of AI agents that power the HPB AI Research Support Platform. Each agent operates under a shared set of system guardrails and has a distinct role, input schema, output schema, and behavioural specification. Together, these agents cover the full design research lifecycle -- from moderator guide quality checks through to insight statement analysis.

All agents are served through the OpenAI API (model: GPT-5.2) and inherit the global system guardrails as a system-level message prepended to every request.

---

### Global System Guardrails

Every AI call in the platform includes a shared guardrails configuration loaded at runtime. This is injected as the system message in all API calls, ensuring that no agent can operate outside the platform's safety envelope.

| Guardrail | Description |
|---|---|
| **Role Lock** | Personas are JTBD- and evidence-aligned. The AI stays strictly within its assigned role and never assumes authority beyond the prompt specification. |
| **Scope Lock** | The AI never provides advice, diagnosis, coaching, or strategy. All output is synthetic rehearsal for training purposes only and cannot inform real synthesis or conclusions. |
| **Context Lock** | Singapore-only context. All personas, cultural references, education system norms, and social dynamics must reflect Singapore. External landscape references must be transparently sourced. |
| **Safety Lock** | Neutral, non-authoritative tone throughout. The AI questions rather than answers. No medical diagnoses, health advice, or treatment recommendations. |
| **Behaviour Lock** | No "expert mode" and no escalation into authority. The AI never claims expertise or certainty. When appropriate, it responds with questions or uncertainty rather than definitive answers. |
| **Content Lock** | No harmful, discriminatory, illegal, or inappropriate content. If a conversation veers into sensitive territory, the AI responds as a cautious participant would. |
| **Grounding Lock** | Responses are based only on provided persona documents and verified knowledge base content. The AI does not invent personal history, facts, or experiences absent from source documents. |

**Technical guardrails** enforced at the infrastructure level:

- No exposed API endpoints -- all AI calls route through server-side API routes
- All data must come from the knowledge base (real research documents stored in the database)
- Complete logging and transparency: every AI call produces a prompt hash, response hash, model name, and latency measurement for audit trails
- All outputs carry a standard disclaimer: *"Synthetic rehearsal output is training only and cannot inform synthesis."*
- Structured output enforcement via OpenAI's JSON schema response format with strict mode where deterministic parsing is required
- Temperature controls tuned per agent (ranging from 0.2 for analytical tasks to default for creative simulation)

---

### Agent 1A: Question Validation Agent

**Use Case:** Moderator Guide -- Question Quality Check

#### Role

Expert qualitative research methodologist and interview coach -- helping researchers refine their interview questions.

This agent evaluates moderator guide questions for common qualitative research pitfalls. It follows the **"Player and Coach" model** -- it explains *why* a question is weak and provides coaching reflections that guide the researcher's thinking, but it never auto-rewrites questions.

#### Issue Detection Categories

| Issue Type | Description | Example |
|---|---|---|
| `LEADING` | Suggests or guides toward a particular answer | "Don't you think exercise is important?" |
| `DOUBLE_BARRELLED` | Asks about two things at once | "Do you eat healthy and exercise regularly?" |
| `UNCLEAR` | Vague, ambiguous, or confusing phrasing | "What about your situation?" |
| `JUDGEMENTAL` | Contains implicit judgment or bias | "Why haven't you tried therapy?" |
| `CLOSED_ENDED` | Can only be answered with yes/no | "Do you like your job?" |
| `TOO_LONG` | Overly complex; may confuse participants | (Multi-clause questions with embedded context) |

#### Severity Levels

| Severity | Meaning |
|---|---|
| `HIGH` | Blocks good data collection |
| `MEDIUM` | May bias responses |
| `LOW` | Minor improvement opportunity |

#### Overall Quality Ratings

| Rating | Behaviour |
|---|---|
| `GOOD` | No significant issues. No feedback provided. |
| `NEEDS_IMPROVEMENT` | Has minor issues that could be refined. |
| `PROBLEMATIC` | Has major issues that may compromise data quality. |

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `projectName` | string | No | Name of the research project |
| `researchStatement` | string | No | The overarching research question |
| `ageRange` | string | No | Target audience age range |
| `lifeStage` | string | No | Target audience life stage |
| `setTitle` | string | No | Name of the question set being reviewed |
| `setIntent` | string | No | What the question set aims to uncover |
| `questions` | Array | Yes | Array of questions with label, text, and optional intent |

#### Output

For each question, the agent returns:
- The original question text and label
- Any detected issues with type, severity, and coaching explanation
- An overall quality rating
- A summary with total counts of good, needs-improvement, and problematic questions

#### Coaching Approach

The coaching feedback does not contain rewritten questions. Instead, it contains coaching reflections:

- *"Consider: What assumptions might be embedded in this phrasing?"*
- *"Reflection: How might you phrase this to allow for both positive and negative experiences?"*
- *"Think about: What if the participant has never considered this before?"*

**<span style="color:red">[IMAGE: Screenshot of the Question Validation panel showing flagged questions with severity indicators (HIGH/MEDIUM/LOW), issue types, and coaching guidance text]</span>**

---

### Agent 1B: Research Consistency Checker

**Use Case:** Moderator Guide -- Redundancy Prevention

#### Role

Research Consistency Analyser -- cross-references proposed interview questions against the project's existing research knowledge base.

This agent's purpose is to prevent redundant data collection by flagging questions whose answers are already available in prior research.

#### How It Works

1. Fetches all research-type documents from both the Global KB and the Project-specific KB.
2. Builds a combined text corpus from extracted document content.
3. For each proposed question, determines whether the topic or intent is already addressed in existing research.
4. Returns evidence excerpts, document sources, and coaching-style action suggestions.

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `questions` | Array | Yes | Questions to check (with label and text) |
| `projectId` | string | No | Project ID for fetching project-specific research docs |
| `projectName` | string | No | Project name for prompt context |
| `setIntent` | string | No | Intent of the question set |

#### Output

For each question, the agent returns:
- Whether existing research addresses the topic (`hasResearch`: true/false)
- The **document name** of the matching source
- A short **excerpt** from the matching document (max 20 words)
- A **summary** explaining the relevance
- An **introductory text** that naturally explains the connection between existing research and the proposed question
- An **action suggestion** using coaching-style prompts ("What aspect of this hasn't been explored yet?")

#### Behavioural Rules

- **Conservative flagging:** Only flags when there is clear information that renders the question redundant.
- **Coaching, not rewriting:** Never provides sample questions or direct rewrites.
- **Contextual introductions:** Each result includes text that naturally explains the connection between existing research and the proposed question.

**<span style="color:red">[IMAGE: Screenshot of the Research Consistency Check panel showing a flagged question with the existing research excerpt, document source title, and coaching action suggestion]</span>**

---

### Agent 2A: Synthetic Persona Simulation Agent

**Use Case:** Interview Simulation -- Synthetic Participant

#### Role

A real person in Singapore being interviewed. The agent's job is to respond like a real human would -- not like an AI or a character in a play.

This is the core simulation agent. It inhabits a persona document from the knowledge base and responds to interviewer questions as that persona would in a real research interview.

#### Anti-Patterns (Explicitly Forbidden Behaviours)

These patterns are flagged because they make responses sound artificial:

| Anti-Pattern | Why It Fails |
|---|---|
| Starting with "That's a great question!" | No real participant says this |
| Formal transitions ("Furthermore", "Additionally") | Sounds academic, not conversational |
| Perfectly structured answers with clear points | Real people ramble, digress, and circle back |
| Always directly answering the question | Real people sometimes deflect, ask for clarification, or misunderstand |
| Sounding scripted or rehearsed | Breaks immersion and reduces training value |
| Being too enthusiastic or dramatic | Real interviewees are often subdued or neutral |
| Forced slang | Worse than no slang at all |
| Rambling for too long | Real people pause and check if the interviewer wants more |

#### Natural Behaviour Instructions

The agent emulates how real Singaporeans behave in interviews:

- Uses filler words ("like", "you know", "basically")
- Sometimes says "hmm" or "let me think" before answering
- May go off on tangents
- May ask for clarification if the question is unclear
- Gives short answers to big questions and long answers to simple ones sometimes
- Does not speak in perfect grammar all the time
- Matches response length to question weight (yes/no question gets "yes" or "no lah"; emotional question gets a longer, more thoughtful response)

#### Adjustable Persona Parameters

The persona parameters provide five adjustable dimensions that shape the simulation's personality and communication style.

**Emotional Tone (0--100)**

| Value | Behaviour |
|---|---|
| 0 | Very reserved -- quiet, gives minimal responses, rarely shows emotion |
| 1--25 | Reserved -- polite but brief, doesn't volunteer extra information |
| 26--50 | Neutral -- balanced emotional expression, shares feelings when relevant |
| 51--75 | Expressive -- openly shares feelings and opinions, animated |
| 76--100 | Very expressive -- emotionally open, enthusiastic or passionate, dramatic at times |

**Response Length (Short / Medium / Long)**

| Setting | Simple Questions | Regular Questions | Emotional/Complex Topics |
|---|---|---|---|
| Short | 1--2 words or short phrase | 1--2 sentences | Occasionally 3 sentences |
| Medium | 1--2 sentences | 2--4 sentences | Up to 5--6 sentences |
| Long | 2--3 sentences | 3--5 sentences | 5--8 sentences with examples |

**Thinking Style (Concrete / Abstract)**

| Setting | Description |
|---|---|
| Concrete | Uses specific examples and real stories from the persona's life |
| Abstract | Shares thoughts and feelings about things, more reflective |

**Mood Swings (0--100)**

| Value | Behaviour |
|---|---|
| 0 | Very consistent -- mood stays the same throughout |
| 1--25 | Stable -- slight shifts may happen but mostly consistent |
| 26--50 | Moderate variability -- mood can shift depending on topics |
| 51--75 | Variable -- reacts emotionally to different topics |
| 76--100 | Highly variable -- mood changes frequently and noticeably |

**Singlish Level (0--100)**

| Value | Speech Style |
|---|---|
| 0 | Formal Standard English, like in a professional setting |
| 1--25 | Standard English -- clear and proper, minimal colloquialisms |
| 26--50 | Light Singlish -- mostly standard but occasional "lah", "lor" |
| 51--75 | Casual Singlish -- "lah", "sia", "lor", "eh", casual grammar |
| 76--100 | Full Singlish -- "wah", "sia", "confirm plus chop", "sian", non-standard grammar |

#### Full Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `projectName` | string | Yes | Research project name |
| `researchStatement` | string | Yes | What the research aims to understand |
| `ageRange` | string | Yes | Target audience age range |
| `lifeStage` | string | Yes | Target audience life stage |
| `guideIntent` | string | Yes | What the interview guide aims to uncover |
| `personaTitle` | string | Yes | Display name of the persona being simulated |
| `personaContent` | string | Yes | Full persona document content from KB |
| `persona parameters` | object | Yes | All 5 persona parameter settings |
| `conversationHistory` | Array | Yes | Recent messages for conversational context |
| `userMessage` | string | Yes | The interviewer's latest question |
| `groundingContext` | Array | Yes | Additional KB context documents |

#### Output

The agent returns natural-language dialogue text only. No JSON structure, no metadata, no disclaimers (the disclaimer is added automatically by the UI). The output is the persona's spoken response.

**<span style="color:red">[IMAGE: Screenshot of the Interview Simulation interface showing the chat conversation between the researcher and the synthetic persona, with the Persona Parameter sliders visible on the side panel]</span>**

---

### Agent 2B: Live Coach Agent

**Use Case:** Interview Simulation -- Real-Time Coaching

#### Role

A Senior Design Researcher watching a live interview.

This agent runs silently alongside every interview simulation exchange. After each participant response, it analyses the response for research opportunities and provides real-time coaching nudges to the interviewer.

#### What It Looks For

| Signal Type | Description | Example Triggers |
|---|---|---|
| **Emotion signals** | Words expressing feeling | "hate", "love", "stressed", "frustrating" |
| **Hedging language** | Soft qualifiers hiding deeper truths | "sometimes", "I guess", "maybe", "depends" |
| **Specific behaviours** | Routines, habits, workarounds | Descriptions of daily patterns or coping mechanisms |
| **Tensions/contradictions** | Say-do gaps or conflicting priorities | Statements that contradict earlier responses |
| **Specific examples/stories** | Concrete instances worth unpacking | Personal anecdotes or named experiences |

#### Opportunity Structure

For each opportunity identified (maximum 2 per response), the agent provides:

| Field | Description |
|---|---|
| **Quote** | Exact verbatim phrase from participant (under 15 words) |
| **Surfaced Context** | What background or context this reveals (1--2 sentences) |
| **Testable Assumption** | Hypothesis worth validating, prefixed with `[NEW HYPOTHESIS]`, `[ALREADY VALIDATED]`, or `[PARTIALLY VALIDATED]` based on existing research |
| **Exploration Direction** | What new territory this opens up for follow-up (1 sentence) |

#### Guide Question Tracking

The agent also tracks interview progress by:

- Maintaining a list of remaining (uncovered) guide questions.
- Suggesting the **next guide question** based on thematic relevance to the current conversation.
- Reporting which guide questions the participant has substantially answered in each exchange.

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `researchStatement` | string | Yes | Research goal |
| `ageRange` | string | Yes | Participant age range |
| `lifeStage` | string | Yes | Participant life stage |
| `guideQuestions` | Array | Yes | All questions from the moderator guide |
| `conversationHistory` | Array | Yes | Recent conversation turns for context |
| `latestPersonaResponse` | string | Yes | The participant's most recent response |
| `latestInterviewerQuestion` | string | Yes | The interviewer's most recent question |
| `coveredQuestionIds` | Array | Yes | IDs of questions already marked as covered |
| `frameworkDocuments` | Array | No | Global KB frameworks |
| `researchDocuments` | Array | No | Project research documents for hypothesis validation |

#### Critical Rules

- **Quality over quantity:** Only identifies genuinely meaningful opportunities. Empty results are acceptable.
- **Maximum 2 opportunities per response:** Focuses on the most promising threads.
- **Skip obvious responses:** If the participant just answered directly with no interesting subtext, returns no opportunities.
- **Exact quotes only:** Quotes must be copy-pasted verbatim from the participant's response.
- **Research cross-referencing:** When existing research documents are provided, assumptions are prefixed with validation status to prevent redundant hypothesis exploration.

**<span style="color:red">[IMAGE: Screenshot of the Live Coach panel during an active simulation, showing identified opportunities with highlighted quotes, surfaced context, testable assumptions with validation status tags, and a suggested next guide question]</span>**

---

### Agent 2C: Post-Simulation Review Agent

**Use Case:** Interview Simulation -- Session Debrief

#### Role

A Senior Interview Coach reviewing a transcript from a completed interview simulation.

After an interview simulation is completed, this agent reviews the entire transcript and provides a structured evaluation of the interviewer's technique. It evaluates **only the interviewer's questions and conversational management** -- it explicitly ignores participant responses.

#### Evaluation Criteria

| Criterion | Type | Description |
|---|---|---|
| **Good Technique** | Positive | Open-ended, neutral, invites elaboration |
| **Leading** | Negative | Puts words in participant's mouth |
| **Closed** | Negative | Yes/No that kills conversation |
| **Stacked/Complex** | Negative | Multiple questions at once |
| **Off-Topic** | Negative | Not aligned with research goals or guide |
| **Assumptions** | Negative | Contains interviewer's assumptions or biases |

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `projectName` | string | Yes | Research project name |
| `researchStatement` | string | Yes | Research goal |
| `guideIntent` | string | Yes | What the guide aims to uncover |
| `transcript` | Array | Yes | Full conversation transcript with turn markers |
| `guideQuestions` | Array | No | Expected questions from the moderator guide |
| `coachingFramework` | string | No | Additional coaching framework from KB |

#### Output

The review produces:
- **Overall Score (1--10):** Holistic assessment of interviewer performance.
- **Summary:** 2--3 sentence overall assessment.
- **Highlights:** Specific moments of good technique, with exact quotes and explanations.
- **Flagged Moments:** Questions that were leading, closed, off-topic, or contained assumptions -- with quotes, explanations, and suggestions for better approaches.

#### Scoring Guidelines

- Turn numbers must match the transcript for full traceability.
- Quotes must be exact substrings from the transcript -- no paraphrasing.
- Feedback must be balanced: both positive highlights and areas for improvement.
- Flow awareness: the coach considers whether later questions addressed earlier clues.

#### Interactive Coaching Chat

After the review is generated, the interviewer can initiate a **1:1 coaching conversation** about any specific feedback item. The coaching chat operates under strict guardrails:

| Guardrail | Rule |
|---|---|
| **No direct answers** | Never gives the interviewer the exact words to say |
| **Discovery-based** | Guides with questions like "What do you think would happen if...?" |
| **Focused scope** | Stays on the specific feedback item being discussed |
| **Extreme brevity** | Responds in one short sentence or question, maximum 30 words |

**<span style="color:red">[IMAGE: Screenshot of the Post-Simulation Review screen showing the overall score, highlighted good technique moments with green indicators, flagged leading/closed questions with red indicators and suggestions, and the interactive coaching chat drawer open]</span>**

---

### Agent 3A: Affinity Mapping Agent

**Use Case:** Affinity Mapping -- Transcript Processing and Clustering

#### Role

Expert qualitative researcher coding interview transcripts.

This agent performs two sequential tasks: (1) theme suggestion from raw transcripts, and (2) verbatim quote extraction and clustering against those themes.

#### Phase 1: Theme Suggestion

Analyses interview transcripts and identifies 8--12 emerging qualitative themes suitable for an affinity map.

**Standard Reference Themes** (adopted when content fits; new themes named in the same concise 2--5 word style):

1. Pressures/Stressors
2. Motivations to Take Action
3. Barriers to Action
4. Mental Model
5. Life Prioritisation
6. Support Ecosystem
7. Digital Ecosystem
8. Routines and Behaviours
9. Protective Factors

#### Phase 2: Quote Extraction and Clustering

Processes each transcript individually against the established themes.

**Critical Rules:**
- Context detection is key -- related points made in sequence are grouped into a single insight (not split into separate cards).
- Each insight must have at least one verbatim quote.
- Only meaningful, implementation-relevant insights are extracted.

#### Output per Transcript

For each transcript, the agent produces a set of insights, each containing:
- One or more **verbatim quotes** (grouped if related)
- The assigned **theme name**
- Brief **contextual explanation**

Each resulting quote card on the affinity board carries a colour-coded theme tag, participant/transcript name for traceability, and the contextual explanation.

**<span style="color:red">[IMAGE: Screenshot of the Affinity Mapping board showing colour-coded quote cards grouped under theme columns, with participant name tags visible on each card]</span>**

---

### Agent 3B: Affinity Insights Agent

**Use Case:** Affinity Mapping -- Insight Synthesis

#### Role

Expert HPB researcher who translates raw mapped data into strategic behavioural insights.

This agent takes the clustered affinity map data and synthesises it into the **3-Column Decision Framework**, cross-referencing against both global behavioural frameworks and existing project research.

#### The 3-Column Decision Framework

| Column | Name | What Goes Here | In Simple Terms |
|---|---|---|---|
| 1 | **Found Out** | Clear, repetitive findings across multiple participants and/or strongly supported by global frameworks. High confidence. | "Things we are now confident about" |
| 2 | **Look Further** | Contradictions between participants, say-do gaps, areas where data matches existing research but needs more validation or adds complexity. | "Things that are unclear or conflicting" |
| 3 | **New Areas** | Completely novel findings present in the data but absent from existing research. Unexpected behaviours or motivations. | "Things nobody has looked at before" |

#### Input Parameters

| Parameter | Type | Description |
|---|---|---|
| Project context | (from database) | Project name, description, workspace name, research statement |
| `clustersByTheme` | Object | Quote cards grouped by theme with transcript tags |
| Framework context | (from database) | Global framework-type KB documents |
| Research context | (from database) | Project research-type KB documents |

#### Output

For each insight across all three columns:
- **Insight text** (concise, max 20 words)
- **Citation** from existing research document (or null if novel)
- **Citation match type:** Validation, Contradiction, Related, or None
- **Citation reasoning** (max 15 words explaining the connection)
- **Transcript tags** linking back to specific participants

#### Processing Rules

1. **Comprehensive scan:** Every single quote and cluster must be reviewed -- no data is skipped.
2. **Maximise output:** At least 5--8 insights per column when supported by the data.
3. **Granularity over summary:** Distinct concepts are never merged; specific insights are preferred over broad summaries.
4. **Cross-referencing:** Each insight is checked against global frameworks and existing research.
5. **Traceability:** Every insight carries transcript tags linking back to specific participants.

**<span style="color:red">[IMAGE: Screenshot of the 3-Column Insights view showing Found Out, Look Further, and New Areas columns with insight cards, citation badges showing validation/contradiction/new status, and participant source tags]</span>**

---

### Agent 4: Profile Builder Agent

**Use Case:** Profile Builder -- Behavioural Archetype Generation

#### Role

A Senior Design Researcher at HPB. Generates distinct behavioural archetypes from real interview data. These are NOT marketing personas -- they are raw, honest portraits of how real people actually behave, including their failures, excuses, and constraints.

#### Critical Rules

| Rule | Description |
|---|---|
| **No aspirational language** | Describes what people actually do, not what they wish they did |
| **Evidence-anchored** | Every trait must trace back to quotes from the data |
| **Uncomfortable truths** | Say-do gaps, rationalisations, and dealbreakers matter more than demographics |
| **Plain-language names** | Archetypes named by defining behaviour pattern using everyday words (e.g., "The Guilt Tripper", "The Last-Minute Rusher") -- never by demographics or academic terms |
| **Distinct archetypes** | Each must represent a genuinely different behavioural pattern |
| **Singapore context** | All archetypes reflect Singapore cultural norms and social dynamics |
| **Mode note** | Every archetype includes: "Archetype mode -- a person may shift between different modes depending on situation and support." |

#### Input Parameters

| Parameter | Type | Description |
|---|---|---|
| `projectName` | string | Overall project name |
| `projectDescription` | string | Project description |
| `workspaceName` | string | Workspace name |
| `researchStatement` | string | Overall research goal |
| `ageRange` | string | Target age range |
| `lifeStage` | string | Target life stage |
| `profileTarget` | string | Specific group (e.g., "parents", "students") |
| `clustersByTheme` | Object | Mapping data with transcript tags |
| `insights` | Object | Synthesised insights from Agent 3B (found_out, look_further, new_areas) |
| `frameworkContext` | string | Global HPB behavioural frameworks |

#### Archetype Output Structure (Per Profile)

Each generated archetype contains the following sections:

**Identity**
- **Name:** Sharp behavioural title, 3--4 words max
- **Kicker:** One punchy sentence capturing the core operating principle
- **Description:** 3--4 sentences, brutally honest but empathetic
- **Demographics:** Age range, occupation, living setup (derived from data)

**Influences** -- 3--4 external forces that shape mindset and behaviour, with mechanisms in parentheses

**Lived Experience** -- 4--5 sentences describing internal experience, inner monologue, and feelings. Reframes behaviour, explains why it makes sense to them, then names the real problem underneath.

**Behaviours** -- 3--4 observable action patterns written as "does X" patterns

**Barriers** -- 3--4 specific blockers with explanations of *why* they block

**Motivations** -- 3 honest, human drivers (often social, emotional, or ego-driven)

**Goals** -- 3 immediate, practical objectives

**Habits** -- 3 automatic, unconscious default behaviours

**The Spiral** -- A downward cascade pattern with 3--5 steps showing how stress or avoidance escalates, plus guidance on how to break the pattern

#### Focus Group Extension

Generated profiles can be used directly in Focus Group Simulations (see Section 8 of How to Use). In focus groups:
- Each archetype follows rules for short responses (1--3 sentences, not speeches)
- Archetypes stay silent when a topic does not relate to their experience
- Cross-talk is minimal and only when directly related to their lived experience
- Post-discussion, individual profile summaries and cross-profile comparisons are generated

**<span style="color:red">[IMAGE: Screenshot of a generated behavioural profile card showing the name, kicker, description, influences, behaviours, barriers, motivations, goals, habits, and The Spiral pattern with cascade steps]</span>**

---

### Agent 5: HMW Analysis Agent

**Use Case:** How Might We -- Statement Critique

#### Role

Expert design thinking facilitator and constructive coach -- assesses "How Might We" statements with precision using the Nielsen Norman Group (NN/g) 5-lens framework.

#### The 5-Lens Framework

| Lens | Question | PASS | PARTIAL | FAIL |
|---|---|---|---|---|
| **Grounded in a Real Problem** | Does it stem from actual research findings? | Clearly rooted in specific research discoveries | References real area but lacks specificity | Generic improvement question with no research grounding |
| **Solution-Agnostic** | Does it leave the solution space wide open? | No embedded solutions | Hints at a direction but doesn't prescribe | Embeds a specific solution |
| **Appropriately Broad** | Is it wide enough for creative ideas but still tethered? | Balanced scope | Slightly too narrow or too wide | Impossibly broad or so narrow it dictates solutions |
| **Focused on Desired Outcome** | Does it target the root problem? | Targets the root cause and user's desired state | Implied outcome but not stated clearly | Targets a symptom or business metric |
| **Positively Framed** | Does it use positive action verbs? | Uses "increase", "create", "enhance", "promote" | Mixed framing | Uses "reduce", "remove", "prevent", "stop" |

#### Overall Verdicts

| Verdict | Criteria |
|---|---|
| `PASS` | 4 or more lenses pass |
| `NEEDS_WORK` | 2--3 lenses have issues |
| `FAIL` | HMW fundamentally misses the mark |

#### Statement Breakdown

The agent breaks the HMW into 3--5 meaningful phrases, and for each provides:
- **Text:** Exact substring from the HMW statement
- **Rationale:** What this phrase does and why it matters
- **Lens Critique:** The single most relevant lens assessment with verdict, explanation citing specific research findings, and suggested replacement phrase (if not PASS)
- **Research Pointer:** Connection to a specific research finding with document source
- **Sentiment:** Strength (works well), Issue (problematic), or Neutral (acceptable)

#### Research Alignment Assessment

The agent cross-references the HMW against all documents in the project Knowledge Base:
- Whether the HMW is grounded in actual findings
- A plain-language assessment of alignment
- A "so what" sentence telling the user exactly what to do next or what risk they face
- 2--3 key relevant findings as bullet points
- 2--3 specific evidence pieces with source document title, near-verbatim quote, and actionable explanation

#### Iterative Improvement Tracking

The agent fetches recent critiques for the same workspace and applies consistency rules:
- If the user adopted a previously suggested improvement, that part must receive PASS
- New objections are not raised on parts that were fine before
- The agent does not contradict its own previous advice

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `hmwStatement` | string | Yes | The HMW statement to critique |
| `projectId` | string | Yes | Project ID for fetching KB documents |
| `subProjectId` | string | Yes | Workspace ID for fetching past critiques |
| `researchStatement` | string | No | Project research statement |

**<span style="color:red">[IMAGE: Screenshot of the HMW Critique interface showing the overall verdict, per-lens assessments with Pass/Needs Work/Fail badges, the statement breakdown with colour-coded phrases, and research evidence cards]</span>**

---

### Agent 6: Insight Statement Analysis Agent

**Use Case:** Insight Statement -- Quality Critique

#### Role

Expert design researcher and insight analyst -- assesses insight statement quality with surgical precision.

#### The 5 Evaluation Criteria

| Criterion | Question | PASS | PARTIAL | FAIL |
|---|---|---|---|---|
| **Well-Informed** | Is it grounded in multiple data sources? | Clearly synthesises multiple evidence streams | References some data but not triangulated | Based on assumption or single anecdote |
| **More Than an Observation** | Does it explain how or why? | Reveals a non-obvious mechanism, tension, or reframe | Hints at a mechanism but doesn't fully articulate it | Just states a fact |
| **So What?** | Does it name the tension and stakes? | Makes stakes clear and names what needs to change | States importance but doesn't name the tension or shift | No clear implication or connection to action |
| **Sticky** | Is it memorable and repeatable? | You'd remember it after hearing it once; could become team shorthand | Clear but not distinctive enough to stick | Forgettable, jargon-heavy, or too abstract |
| **Actionable** | Does it inspire novel solutions? | You can immediately imagine 3+ different interventions | Points toward a space but too vague for specific ideas | Doesn't suggest any direction for intervention |

#### Statement Breakdown

The agent breaks the insight into its component phrases (same structure as Agent 5) with:
- Exact substring text
- Rationale for what the phrase does
- Criteria-level critique with verdict, explanation, and suggested replacement
- Sentiment marking (strength, issue, or neutral)

**Coverage rule:** Across all phrases, different criteria are covered rather than repeating the same one.

#### Research Alignment Assessment

Same structure as Agent 5: alignment check, "so what" sentence, relevant findings, and specific evidence pieces with document sources and near-verbatim quotes.

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `insightStatement` | string | Yes | The insight statement to critique |
| `projectId` | string | Yes | Project ID for fetching KB documents |
| `subProjectId` | string | Yes | Workspace ID for persistence |
| `researchStatement` | string | No | Project research statement |

#### Brevity Constraints

This agent enforces strict word limits:
- Criterion explanations: maximum 20 words
- Suggested improvements: maximum 15 words
- No sugarcoating -- direct and honest throughout

**<span style="color:red">[IMAGE: Screenshot of the Insight Statement Critique interface showing the 5-criteria scorecard with Pass/Needs Work/Fail verdicts, the statement breakdown with annotated phrases, and research alignment evidence]</span>**

---

### Agent 7: Ideation Concept Generator

**Use Case:** Ideation -- Crazy 8s Concept Generation

#### Role

Senior Design Strategist running a Crazy 8s ideation session. Generates exactly eight distinct, creative, evidence-grounded design concepts from research data, each with an AI-generated illustration.

#### Two-Phase Pipeline

The Ideation agent runs as a two-phase pipeline within a single API call:

| Phase | Model | Purpose |
|---|---|---|
| **Phase 1 -- Text Generation** | GPT-5.2 | Produces all eight concepts as a single structured JSON response |
| **Phase 2 -- Image Generation** | gpt-image-1.5 | Generates eight concept illustrations in parallel, one per concept |

The eight image calls run concurrently via `Promise.all` to keep total latency to 60--120 seconds.

#### Context Assembly

Before the text call, the route assembles a rich context block:

- **Project context:** project name, description, research statement, target age range, life stage, workspace name
- **Mapping data:** all clusters from the selected mapping session, grouped by theme, with the source transcript name alongside each quote
- **Insights (if generated):** the *Found Out*, *Look Further*, and *New Areas* insight columns, with their citations and transcript tags
- **Profiles (optional, multi-select):** selected archetypes and Knowledge Base persona documents, each with name, description, demographics, goals, motivations, ground truth, and spiral patterns
- **Creative Matrix Enablers:** the 16 creative lenses are always included. If the user ticked specific lenses, the prompt instructs the agent to prioritise them. If none are ticked, the agent is told to consider all and pick only those genuinely relevant.

#### The 16 Creative Matrix Enablers

Each enabler ships with a label and a set of sub-categories the agent is encouraged to think about:

| Enabler | Sub-categories |
|---|---|
| Technology & Digital Media | Mobile Devices & Wearable Tech, Social Media, Gaming & Simulations, IoT |
| Events & Programmes | Meet-ups, Conferences, Workshops, Peer-to-Peer Forums |
| Internal Policies & Procedures | Diagnostics, Incentives, Training, Company Guidelines |
| Public Policies & Laws | Policy Positions, Prospective Legislation, Customs, Institutional Roles |
| Games & Competitions | Motivations, Rewards, Teamwork, Scoring & Leaderboards |
| Mobile & Wearable Tech | Phones, Tablets, Watches, Embedded Sensors |
| Social Media | Video & Pictures, Posts & Messages, Likes & Swipes, Friends & Networks |
| Surprise & Provocation | Transforming Spaces, Unexpected Experiences, Pop-up Entertainment, Guest Appearances |
| Health & Wellness | Nutrition, Physical Activity, Sleep Quality, Quantified Self |
| Accessories | Thematic Accessories, Cases, Connectors, Fashion |
| Physical Variation | Sizes, Forms & Shapes, Unusual Materials, Textures |
| People & Partnerships | Company Leaders, Strategic Partnerships, Spokespeople, Evangelists |
| Hotspots & Hangouts | Daily Activity Locations, High-Traffic Areas, Gathering Places, Online Sites |
| Engage Senses | Sight, Sound, Touch, Smell, Taste |
| Shows & Videos | Live Performances, TV & Radio, Public Service Ads, Viral Videos |
| Celebrities & Superstars | Entertainers, Athletes, Historical Figures, Hometown Heroes |

#### Output Structure (Per Concept)

Every concept returned by the agent contains exactly these fields:

| Field | Type | Description |
|---|---|---|
| `name` | string | Memorable 2--5 word concept title |
| `tagline` | string | Single sentence (max 15 words) summarising what the concept does |
| `whoIsItFor` | object | `{ text, source, reason }` -- plain-language target user segment plus its evidence source |
| `whatProblem` | object | `{ text, source, reason }` -- specific problem solved, tied to evidence |
| `bigIdea` | object | `{ text, source, reason }` -- core concept (2--3 sentences) and the creative leap from data to idea |
| `howItWorks` | object | `{ description, imageBase64, imageTextLabels }` -- vivid 50--100 word visual scene, the generated base64 PNG, and optional exact text labels to render in the image |
| `whyMightItFail` | object | `{ text, source, reason }` -- biggest risk or assumption |
| `whatToPrototype` | object | `{ text, source, reason }` -- minimum viable prototype to validate the concept |
| `howToMeasure` | object | `{ text, source, reason }` -- one or two concrete success metrics |

Every `source` references a specific mapping theme, profile, or insight. Every `reason` is a one-sentence explanation of how that source justifies the field.

#### Critical Rules

The agent is bound by strict rules at the prompt level:

1. **Exactly 8 concepts** -- no more, no less. The route validates the count before persisting.
2. **Diversity of concept types** -- the eight concepts must span a genuine mix of categories (digital, physical, event, policy, gamified, partnership, environmental, hybrid). Defaulting to "8 apps" is forbidden.
3. **Evidence grounding** -- every field except `name` and `howItWorks` must cite its source and reason.
4. **Singapore context** -- all concepts must be culturally appropriate and locally feasible.
5. **Visual descriptions matter** -- the `howItWorks.description` is written as a concrete, visual scene because it doubles as the image generation prompt.
6. **Plain, simple language** -- every field is written so that a reader with no design, research, or academic background understands it on first read. Jargon, buzzwords ("operationalise", "empowers", "seamlessly", "leap", "friction"), and profile labels in user-facing body text are explicitly forbidden.
7. **Text in images** -- the agent only requests text inside an illustration when essential (e.g., app screen mockups). Otherwise it returns an empty `imageTextLabels` array and the image is rendered without any text, letters, or numbers.

#### Image Generation Prompt Template

Each of the eight parallel image calls uses the following template:

```
Create a clean, professional concept illustration for: {conceptName}.

{howItWorks.description}

Style: Modern design thinking concept sketch, clean lines, muted professional
colour palette, slightly abstract and conceptual. The illustration should clearly
communicate the concept at a glance.
{textInstruction}
```

Where `{textInstruction}` is either *"Do not include any text, words, letters, or numbers in the image."* or *"Include only these exact words in the image: {labels}"* depending on whether `imageTextLabels` is empty.

#### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `subProjectId` | string | Yes | Workspace ID (used for persistence and audit) |
| `ideationId` | string | Yes | The `IdeationSession` record to populate |
| `mappingId` | string | Yes | The completed `MappingSession` to draw clusters and insights from |
| `profileIds` | string[] | No | Mixed list of archetype IDs and Knowledge Base persona document IDs |
| `focusAreas` | string[] | No | Keys of selected creative matrix enablers |

#### Output

| Field | Type | Description |
|---|---|---|
| `concepts` | array | The eight concept objects, saved to `IdeationSession.resultJson` as a JSON string |
| `modelName` | string | Text generation model used (gpt-5.2) |
| `imageModelName` | string | Image generation model used (gpt-image-1.5) |
| `latencyMs` | integer | Combined text + image generation latency |

Status transitions: `SETUP` → `PROCESSING` → `COMPLETE` (or `ERROR` on failure). The route guards against duplicate generation by rejecting calls when the status is already `PROCESSING` or `COMPLETE`.

#### Behavioural Rules

- Every generation is persisted as a new `IdeationSession` row, so previous batches remain available even after regeneration.
- If any of the eight image calls fail, the route stores `null` for that concept's `imageBase64` and continues; the UI falls back to a placeholder icon for failed images.
- The generation route exports `maxDuration = 180` to accommodate the longer round-trip on serverless runtimes.
- An audit entry is written with `action = GENERATE_IDEATION`, including the source mapping ID, profile count, focus area count, models used, and total latency.

**<span style="color:red">[IMAGE: Screenshot of the Ideation results page showing the 4x2 grid of 8 concepts, and adjacent to it a zoomed-in view of the concept detail overlay with the four-row structure including the generated illustration and the Source/Why citations in dark green]</span>**

---

### Agent Architecture Summary

| Agent | Use Case | Role Summary | Temperature | Output Format |
|---|---|---|---|---|
| **1A** Question Validation | Moderator Guide | Expert qualitative research methodologist | 0.2 | Structured JSON |
| **1B** Research Consistency | Moderator Guide | Research consistency analyser | Default | JSON |
| **2A** Persona Simulation | Interview Simulation | Real person in Singapore being interviewed | Default | Natural language |
| **2B** Live Coach | Interview Simulation | Senior Design Researcher watching live | Default | JSON |
| **2C** Post-Simulation Review | Interview Simulation | Senior Interview Coach reviewing transcript | Default | JSON |
| **2C+** Coaching Chat | Interview Simulation | Experienced interview coach (1:1 reflection) | 0.3 | Natural language (max 30 words) |
| **3A** Affinity Mapping | Affinity Mapping | Expert qualitative researcher coding transcripts | 0.2--0.3 | JSON |
| **3B** Affinity Insights | Affinity Mapping | Expert HPB researcher synthesising insights | 0.4 | JSON |
| **4** Profile Builder | Profile Builder | Senior Design Researcher creating profiles | Default | JSON |
| **4+** Focus Group | Focus Group Simulation | Real person in a research focus group | Default | Natural language |
| **5** HMW Analysis | HMW Analyser | Expert design thinking facilitator (NN/g framework) | 0.3 | Structured JSON |
| **6** Insight Statement | Insight Statement Analyser | Expert design researcher and insight analyst | 0.3 | Structured JSON |
| **7** Ideation (Text) | Ideation | Senior Design Strategist running Crazy 8s | 0.7 | Structured JSON (8 concepts) |
| **7+** Ideation (Image) | Ideation | Concept illustration generator (gpt-image-1.5) | -- | Base64 PNG (1024x1024) |

### Data Flow and Audit Trail

Every AI interaction follows a consistent data flow pattern:

1. **Request:** Client sends parameters to a server-side API route.
2. **Context Assembly:** The route fetches relevant KB documents, frameworks, and research from the database.
3. **Guardrail Injection:** System guardrails are prepended as the system message.
4. **Prompt Construction:** Agent-specific prompt builder generates the full prompt.
5. **AI Call:** OpenAI API call with agent-specific model, temperature, and response format settings.
6. **Response Parsing:** Structured JSON is validated; natural language is returned directly.
7. **Persistence:** Results are saved to the database (critiques, reviews, insights, clusters).
8. **Audit Logging:** Action type, entity, model name, latency, and metadata are recorded.
9. **Response:** Client receives structured data with disclaimer, model name, and latency.

All prompts produce a prompt hash and response hash for reproducibility tracking and audit compliance.

**<span style="color:red">[IMAGE: Architecture diagram showing the complete data flow from client request through API route, KB document retrieval, guardrail injection, prompt construction, OpenAI API call, response parsing, database persistence, and audit logging]</span>**

---

## Governance & Security

The platform is designed with governance and data protection as foundational requirements. Given HPB's position as a public-sector health agency handling sensitive research data, the security posture prioritises containment, transparency, and compliance readiness.

### Deployment & Environment

- The platform is designed to **run in a secure, local or on-premises environment**, ensuring that HPB retains full control over where data resides and how it is accessed.
- It is packaged as a **standalone executable** -- `.exe` for Windows or `.dmg` for Mac -- enabling deployment without complex infrastructure dependencies.
- **Proposed hosting options** are provided for HPB to evaluate in collaboration with their technical team, ranging from local deployment to centralised on-premises hosting.

### Data Isolation & Separation

- The platform **prevents cross-project and cross-organisation data leakage** through strict scoping at the database and application level.
- There is a clear architectural separation between:
  - **Global organisational knowledge** (frameworks, policies, methodologies shared across all projects)
  - **Project-specific knowledge** (personas, transcripts, research documents scoped to individual projects)
- HPB frameworks including **HIIP and PME** are embedded by default within the global knowledge base.
- The platform **does not accumulate insights across interview simulations**. Each simulation session is bounded -- it does not learn from or reference previous sessions.

### Audit & Compliance

- **Comprehensive audit logging** is built into the platform. Every significant action is recorded with:
  - User identity
  - Action performed (e.g., create, update, delete, KB upload, KB approve, simulate, review)
  - Entity type and identifier
  - Timestamp
  - Additional metadata as structured JSON (model name, latency, prompt hash, response hash, referenced KB document IDs)
- The platform is built to **support PDPA (Personal Data Protection Act) and IM8 compliance requirements**. While full compliance depends on HPB's broader infrastructure and policy decisions, the application layer provides the necessary controls and logging.

### API & Key Management

- The platform uses **zero-retention API usage with OpenAI** -- no prompts, responses, or user data are retained by OpenAI for training or any other purpose.
- The **API key is currently managed by Aleph** during the development and handover period. Upon transition, it will be replaced with an **HPB-owned enterprise-grade key**, giving HPB full control over usage, billing, and access policies.
- Upon successful handover, all Aleph-managed keys will be revoked, and access will be restricted solely to HPB-authorised environments.

---

## Measures of Success

The platform's value is measured not by volume of AI output, but by the capability uplift it produces in HPB's research practitioners. Success is defined across five dimensions.

### 1. Accelerates Learning & Skill Development

The platform supports rapid HCD competency building through guided, iterative practice in a safe, low-stakes environment. Researchers can rehearse interviews, receive structured feedback, and refine their approach without the consequences of underperforming in live fieldwork. New practitioners reach proficiency faster, and experienced practitioners sharpen their skills more consistently.

### 2. Establishes Scalable Standards

The platform creates a shared language and consistent standard for human-centred design work across the organisation. By embedding HPB's frameworks, methodologies, and quality criteria directly into AI coaching and analysis tools, the platform ensures that research quality does not depend solely on which individual is leading the work. HCD practice becomes more uniform and transferable across teams.

### 3. Enhances Research Quality

The platform improves moderator guide quality over time, shifting teams from surface-level questioning to rich behavioural and emotional data collection. Through iterative coaching on question framing, probe depth, and interview structure, the platform raises the baseline quality of every interview guide before it reaches a real participant. Fieldwork yields richer, more actionable data from the outset.

### 4. Reduces Research Bias

The platform instils self-correction habits, enabling researchers to identify and revise leading questions, assumptions, and abstract framing before fieldwork begins. By surfacing bias in moderator guides and simulation practice, it shifts bias detection from a retrospective exercise to a proactive discipline. Fewer leading questions, fewer untested assumptions carried into the field, and more rigorous research design.

### 5. Transforms Practitioner Capability

The platform enables researchers to transition from theoretical HCD knowledge to executing effective in-depth interviews with confidence, precision, and empathy. This is the ultimate measure: practitioners who can not only describe good research practice but consistently perform it. HPB's research capability grows structurally, not just individually.

---

## Future Roadmap

### Current Backlog

The following items remain in the active backlog, requested by the HPB team and pending prioritisation and development.

| Item | Description | Date Requested |
|------|-------------|----------------|
| Preview PDF Separately for KB | Provide a dedicated PDF previewer separate from the main AI Knowledge Base interface. Ensures the AI learns from clean, extracted text only, while users can still reference the original formatted document. | 27 Feb 2026 |

### Completed Backlog

The following items have been delivered and are live in the current platform build.

| Item | Date Completed | Status |
|------|----------------|--------|
| HMW Agent | 4 Mar 2026 | Completed |
| Assessment Criteria Agent | 4 Mar 2026 | Completed |
| Profile Builder AI | 4 Mar 2026 | Completed |
| Parent Profile Generation | 4 Mar 2026 | Completed |
| Simulation Summary from Concept Validation | 4 Mar 2026 | Completed |
| Ideation AI (Crazy 8s Concept Generator) | 14 Apr 2026 | Completed |

### Deployment Evolution

The platform's deployment model is designed to evolve through three stages.

**Current State: Local Deployment**

The platform runs locally on individual machines with an Aleph-managed API key. This supports the current development and pilot phase while keeping data contained on the user's device.

**Next State: Centralised, Collaborative Hosting**

The target deployment model moves the platform into HPB's secure infrastructure, enabling multi-user collaboration, centralised knowledge base management, and organisational oversight. This requires alignment with HPB's IT and infrastructure teams to determine the appropriate hosting environment, network configuration, and access controls.

**Transition Requirements**

- Alignment with HPB IT/Infrastructure on hosting approach (on-premises server, private cloud, or approved managed environment)
- Migration of the API key from Aleph-managed to HPB-owned enterprise-grade key
- Establishment of user authentication and access management through HPB's identity systems
- Configuration of backup, monitoring, and incident response procedures per HPB's operational standards

**<span style="color:red">[IMAGE: Timeline or roadmap diagram showing the deployment evolution from local deployment (current) to centralised collaborative hosting (next), with key transition milestones]</span>**

---

*Document prepared by Aleph Labs for Health Promotion Board Singapore.*
