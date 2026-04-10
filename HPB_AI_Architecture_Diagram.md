# HPB AI Research Support Platform — Architecture Diagrams

> All diagrams use [Mermaid](https://mermaid.js.org/) syntax. Render in any Mermaid-compatible viewer (GitHub, VS Code with Mermaid extension, mermaid.live, etc.)

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer"]
        BROWSER["Web Browser"]
        STT["Speech-to-Text<br/>(Web Speech API)"]
    end

    subgraph FRONTEND["⚛️ Frontend (Next.js + React)"]
        direction TB
        UI["Shadcn/UI Components<br/>Tailwind CSS"]
        PAGES["Page Router<br/>(App Router)"]
        FORMS["React Hook Form<br/>+ Zod Validation"]
        DND["Drag & Drop<br/>(Affinity Board)"]
    end

    subgraph API_LAYER["🔌 API Layer (Next.js Server-Side Routes)"]
        direction TB
        AUTH_MW["Authentication<br/>Middleware"]
        PROJ_API["Project &<br/>Workspace APIs"]
        SIM_API["Simulation<br/>APIs"]
        KB_API["Knowledge Base<br/>APIs"]
        MAP_API["Affinity Mapping<br/>APIs"]
        ARCH_API["Profile Builder<br/>APIs"]
        CRITIQUE_API["HMW & Insight<br/>Analyser APIs"]
        GUIDE_API["Moderator Guide<br/>APIs"]
    end

    subgraph AI_LAYER["🤖 AI Engine"]
        direction TB
        GUARDRAILS["System Guardrails<br/>(Role, Scope, Context,<br/>Safety, Behaviour Locks)"]
        PROMPTS["Agent Prompt<br/>Templates"]
        RAG["RAG Pipeline<br/>(KB Retrieval)"]
        OPENAI["OpenAI GPT-5.2<br/>Enterprise API<br/>(Zero-Retention)"]
    end

    subgraph DATA_LAYER["🗄️ Data Layer"]
        direction TB
        DB_PROD["PostgreSQL<br/>(Production)"]
        DB_DEV["SQLite<br/>(Development)"]
        PRISMA["Prisma ORM<br/>(Database Adapter)"]
        BLOB["File Storage<br/>(Vercel Blob / Local)"]
    end

    subgraph COMPLIANCE["📋 Compliance & Audit"]
        AUDIT["Audit Logger<br/>(Action, Entity, User,<br/>Timestamp, Metadata)"]
        HASH["Prompt & Response<br/>Hashing (SHA-256)"]
    end

    BROWSER --> FRONTEND
    STT --> BROWSER
    FRONTEND --> AUTH_MW
    AUTH_MW --> API_LAYER
    API_LAYER --> AI_LAYER
    API_LAYER --> DATA_LAYER
    RAG --> DATA_LAYER
    GUARDRAILS --> OPENAI
    PROMPTS --> OPENAI
    RAG --> PROMPTS
    API_LAYER --> COMPLIANCE
    OPENAI --> COMPLIANCE

    style CLIENT fill:#e8f4fd,stroke:#2196F3
    style FRONTEND fill:#e8f5e9,stroke:#4CAF50
    style API_LAYER fill:#fff3e0,stroke:#FF9800
    style AI_LAYER fill:#fce4ec,stroke:#E91E63
    style DATA_LAYER fill:#f3e5f5,stroke:#9C27B0
    style COMPLIANCE fill:#efebe9,stroke:#795548
```

---

## 2. Data Model & Entity Relationships

```mermaid
erDiagram
    Project ||--o{ Workspace : contains
    Project ||--o{ ProjectKbDocument : has
    Project ||--o{ GuideVersion : has

    Workspace ||--o{ Simulation : runs
    Workspace ||--o{ MappingSession : creates
    Workspace ||--o{ ArchetypeSession : generates
    Workspace ||--o{ HmwCritique : analyses
    Workspace ||--o{ InsightCritique : analyses
    Workspace ||--o{ GuideVersion : versions

    GuideVersion ||--o{ GuideSet : contains
    GuideSet ||--o{ Question : has
    Question ||--o{ Question : "sub-questions"

    Simulation ||--o{ SimulationMessage : records
    Simulation ||--o{ SimulationQuestionCoverage : tracks
    Simulation ||--o{ SimulationArchetype : "focus group links"
    Simulation ||--o| CoachReview : generates
    CoachReview ||--o{ CoachConversation : discusses
    CoachConversation ||--o{ CoachConversationMessage : contains

    MappingSession ||--o{ MappingTranscript : uploads
    MappingSession ||--o{ MappingCluster : clusters

    ArchetypeSession ||--o{ Archetype : produces
    SimulationArchetype ||--|| Archetype : references

    KbDocument ||--o{ KbChunk : "chunked into"
    ProjectKbDocument ||--o{ ProjectKbChunk : "chunked into"

    Project {
        string id PK
        string name
        string description
    }

    Workspace {
        string id PK
        string name
        string researchStatement
        string ageRange
        string lifeStage
    }

    GuideVersion {
        string id PK
        int versionNumber
        string status
    }

    Simulation {
        string id PK
        string mode
        boolean isFocusGroup
        string status
    }

    MappingSession {
        string id PK
        string status
        json themesJson
        json insightsJson
    }

    ArchetypeSession {
        string id PK
        string status
        json sourceMappingIds
    }

    Archetype {
        string id PK
        string name
        string kicker
        json fullContentJson
    }

    KbDocument {
        string id PK
        string title
        string docType
        string status
        text extractedText
    }

    HmwCritique {
        string id PK
        string hmwStatement
        string overallVerdict
        json critiqueJson
    }

    InsightCritique {
        string id PK
        string insightStatement
        string overallVerdict
        json critiqueJson
    }
```

---

## 3. AI Agent Architecture & Data Flow

```mermaid
flowchart LR
    subgraph INPUT["Input & Validation"]
        direction TB
        USER_Q["Researcher's<br/>Question / Action"]
        VALIDATE["Zod Schema<br/>Validation"]
        CONTEXT["Context Assembly<br/>(KB Docs, Frameworks)"]
        USER_Q --> VALIDATE --> CONTEXT
    end

    subgraph GUARDRAILS_BLOCK["Guardrails"]
        direction TB
        G1["Role Lock"]
        G2["Scope Lock"]
        G3["Context Lock"]
        G4["Safety Lock"]
        G5["Behaviour Lock"]
        G6["Content Lock"]
        G7["Grounding Lock"]
    end

    subgraph AGENTS["12 AI Agents (by Use Case)"]
        direction TB

        subgraph ROW1[" "]
            direction LR
            subgraph UC1["UC 1: Moderator Guide"]
                A1A["1A Question<br/>Validation"]
                A1B["1B Research<br/>Consistency"]
            end
            subgraph UC2["UC 2: Interview Simulation"]
                A2A["2A Persona<br/>Simulation"]
                A2B["2B Live Coach"]
                A2C["2C Post-Sim<br/>Review"]
                A2D["2C+ Coach Chat"]
            end
        end

        subgraph ROW2[" "]
            direction LR
            subgraph UC3["UC 3: Affinity Mapping"]
                A3A["3A Theme &<br/>Clustering"]
                A3B["3B Insights<br/>(3-Column)"]
            end
            subgraph UC4["UC 4: Profile Builder"]
                A4["4 Archetype<br/>Generation"]
                A4F["4+ Focus Group"]
            end
            subgraph UC5_6["UC 5–6: Analysers"]
                A5["5 HMW<br/>(NN/g 5-Lens)"]
                A6["6 Insight<br/>(5 Criteria)"]
            end
        end
    end

    subgraph LLM["LLM"]
        OPENAI_API["OpenAI GPT-5.2<br/>Enterprise<br/>(Zero-Retention)"]
    end

    subgraph OUTPUT["Output"]
        direction TB
        PARSE["Response Parsing<br/>(JSON / Natural Lang)"]
        PERSIST["DB Persistence"]
        AUDIT_LOG["Audit Log<br/>(hashes, latency)"]
        PARSE --> PERSIST
        PARSE --> AUDIT_LOG
    end

    CONTEXT --> GUARDRAILS_BLOCK
    GUARDRAILS_BLOCK --> AGENTS
    AGENTS --> OPENAI_API
    OPENAI_API --> PARSE

    style INPUT fill:#e3f2fd,stroke:#1976D2
    style GUARDRAILS_BLOCK fill:#ffebee,stroke:#c62828
    style AGENTS fill:#f5f5f5,stroke:#9E9E9E
    style ROW1 fill:transparent,stroke:transparent
    style ROW2 fill:transparent,stroke:transparent
    style UC1 fill:#e8f5e9,stroke:#388E3C
    style UC2 fill:#fff8e1,stroke:#F9A825
    style UC3 fill:#f3e5f5,stroke:#7B1FA2
    style UC4 fill:#e0f2f1,stroke:#00897B
    style UC5_6 fill:#fbe9e7,stroke:#D84315
    style LLM fill:#fce4ec,stroke:#C2185B
    style OUTPUT fill:#efebe9,stroke:#5D4037
```

---

## 4. Knowledge Base & RAG Pipeline

```mermaid
flowchart LR
    subgraph UPLOAD["Upload"]
        direction TB
        PDF["PDF"]
        TXT["TXT / DOCX"]
    end

    subgraph PROCESSING["Processing"]
        direction TB
        EXTRACT["Text Extraction<br/>(pdf-parse)"]
        CHUNK["Chunking<br/>(1000 chars,<br/>100 overlap)"]
        META["Metadata<br/>Extraction<br/>(AI-powered)"]
    end

    subgraph STORE_APPROVE["Storage & Approval"]
        direction TB
        FILE_STORE["File Storage<br/>(Vercel Blob / Local)"]
        DB_DOCS["Document Records"]
        DB_CHUNKS["Text Chunks"]
        DRAFT["Draft"] -->|"Admin Review"| APPROVED["Approved ✓"]
        DRAFT -->|"Admin Review"| REJECTED["Rejected ✗"]
    end

    subgraph KB_TIERS["Two-Tier Knowledge Base"]
        direction TB
        GLOBAL_KB["Global KB<br/>━━━━━━━━━━━━<br/>• HIIP Principles<br/>• CX/HCD Methods<br/>• Well-being Frameworks<br/>• National Guidelines"]
        PROJECT_KB["Project KB<br/>━━━━━━━━━━━━<br/>• Persona Documents<br/>• Research Reports<br/>• Transcripts<br/>• Fieldwork Evidence"]
    end

    subgraph RETRIEVAL["RAG Retrieval"]
        direction TB
        QUERY["Agent Query"]
        KEYWORD["Keyword Match<br/>& Scoring"]
        FILTER["Type Filter<br/>(Persona / Framework /<br/>Research / Policy)"]
        RANK["Top N Chunks"]
    end

    AGENT_CONTEXT["Assembled Context<br/>→ Injected into<br/>Agent Prompt"]

    PDF --> EXTRACT
    TXT --> EXTRACT
    EXTRACT --> CHUNK --> DB_CHUNKS
    EXTRACT --> META --> DB_DOCS
    EXTRACT --> FILE_STORE

    APPROVED --> GLOBAL_KB
    APPROVED --> PROJECT_KB

    GLOBAL_KB --> QUERY
    PROJECT_KB --> QUERY
    QUERY --> KEYWORD --> FILTER --> RANK
    RANK --> AGENT_CONTEXT

    style UPLOAD fill:#e3f2fd,stroke:#1565C0
    style PROCESSING fill:#e8f5e9,stroke:#2E7D32
    style STORE_APPROVE fill:#f3e5f5,stroke:#6A1B9A
    style KB_TIERS fill:#e0f7fa,stroke:#00838F
    style RETRIEVAL fill:#fce4ec,stroke:#AD1457
    style AGENT_CONTEXT fill:#efebe9,stroke:#4E342E
```

---

## 5. User Workflow & Feature Flow

```mermaid
flowchart LR
    START(("Researcher<br/>Logs In")) --> DASH["Dashboard"]

    DASH --> SETUP["Setup"]
    DASH --> GLOBAL_KB["Global KB"]

    subgraph SETUP["Project & Workspace Setup"]
        direction TB
        NEW_PROJ["Create / Select<br/>Project"] --> PROJ_KB["Upload to<br/>Project KB"]
        NEW_PROJ --> NEW_WS["Create Workspace<br/>(Research Statement,<br/>Age Range, Life Stage)"]
    end

    NEW_WS --> WS{{"Workspace<br/>Hub"}}

    subgraph UC1["Moderator Guide"]
        direction TB
        GUIDE["Set Up Guide"] --> VALIDATE{"AI Validates"}
        VALIDATE -->|"Issues"| FIX["Refine<br/>(Player & Coach)"]
        FIX --> VALIDATE
        VALIDATE -->|"Ready"| GUIDE_DONE["Guide ✓"]
    end

    subgraph UC2["Interview Simulation"]
        direction TB
        PERSONA["Select Persona &<br/>Adjust Parameters"] --> LIVE["Live Interview<br/>+ Coach Nudges"]
        LIVE --> POST_REV["Post-Simulation<br/>Review & Score"]
        POST_REV --> COACH_CHAT["Ask Your Coach"]
    end

    subgraph UC2B["Focus Group Simulation"]
        direction TB
        SEL_ARCH["Select 2–4<br/>Archetypes"] --> GROUP["Group Discussion<br/>(@mentions)"]
        GROUP --> CROSS["Profile Summaries &<br/>Cross-Profile Analysis"]
    end

    subgraph UC3["Affinity Mapping"]
        direction TB
        UPLOAD_TX["Upload<br/>Transcripts"] --> CLUSTER["AI Theme<br/>Clustering"]
        CLUSTER --> BOARD["Edit Board<br/>(Drag & Drop)"]
        BOARD --> INSIGHTS["Insights View<br/>(Found Out / Look<br/>Further / New Areas)"]
    end

    subgraph UC4["Profile Builder"]
        direction TB
        SEL_MAP["Select Mapping<br/>Sessions"] --> GEN["AI Generates<br/>Archetypes"]
        GEN --> PROFILES["Review Profiles<br/>(Behaviours, Barriers,<br/>Motivations, Spiral)"]
    end

    subgraph UC5_6["HMW & Insight Analysers"]
        direction TB
        HMW_IN["Enter HMW"] --> HMW_C["AI 5-Lens Critique"]
        HMW_C -->|"Iterate"| HMW_IN
        INS_IN["Enter Insight"] --> INS_C["AI 5-Criteria Critique"]
        INS_C -->|"Iterate"| INS_IN
    end

    WS --> UC1
    WS --> UC2
    WS --> UC2B
    WS --> UC3
    WS --> UC4
    WS --> UC5_6

    PROFILES -.->|"Use as Personas"| UC2
    PROFILES -.->|"Use in Focus Groups"| UC2B

    REAL(("Real<br/>Fieldwork"))

    GUIDE_DONE -.->|"Prepared Guide"| REAL
    COACH_CHAT -.->|"Improved Skills"| REAL
    REAL -.->|"Transcripts"| UC3

    style START fill:#1565C0,color:#fff,stroke:#0D47A1
    style DASH fill:#e3f2fd,stroke:#1565C0
    style REAL fill:#2E7D32,color:#fff,stroke:#1B5E20
    style WS fill:#FF9800,color:#fff,stroke:#E65100
    style GUIDE_DONE fill:#C8E6C9,stroke:#2E7D32
    style UC1 fill:#e8f5e9,stroke:#388E3C
    style UC2 fill:#fff8e1,stroke:#F9A825
    style UC2B fill:#fff8e1,stroke:#F9A825
    style UC3 fill:#f3e5f5,stroke:#7B1FA2
    style UC4 fill:#e0f7fa,stroke:#00838F
    style UC5_6 fill:#fbe9e7,stroke:#D84315
    style SETUP fill:#e3f2fd,stroke:#1565C0
```

---

## 6. Interview Simulation Data Flow (Detailed)

```mermaid
sequenceDiagram
    participant R as Researcher
    participant UI as Frontend UI
    participant API as API Route
    participant KB as Knowledge Base<br/>(RAG Retrieval)
    participant GR as System<br/>Guardrails
    participant PA as Persona Agent<br/>(Agent 2A)
    participant LC as Live Coach<br/>(Agent 2B)
    participant AI as OpenAI<br/>GPT-5.2
    participant DB as Database
    participant AL as Audit Log

    R->>UI: Types question (or uses voice input)
    UI->>API: POST /api/simulations/message
    API->>DB: Save researcher message

    par Persona Response
        API->>KB: Retrieve persona docs + project context
        KB-->>API: Grounding context (approved docs only)
        API->>GR: Inject system guardrails
        GR->>PA: Build persona prompt<br/>(+ persona parameters)
        PA->>AI: Generate response
        AI-->>PA: Persona reply (natural language)
        PA-->>API: Response text
        API->>DB: Save persona message<br/>(+ latency, model)
        API->>AL: Log audit entry<br/>(promptHash, responseHash)
    and Live Coach Analysis
        API->>KB: Retrieve frameworks + research docs
        KB-->>API: Framework context
        API->>GR: Inject system guardrails
        GR->>LC: Build coach prompt<br/>(+ guide questions, coverage)
        LC->>AI: Analyse exchange
        AI-->>LC: Coaching nudges (JSON)
        LC-->>API: Opportunities + suggested<br/>next guide question
        API->>DB: Update question coverage
    end

    API-->>UI: Persona response + coach nudges
    UI-->>R: Display conversation + nudge panel

    Note over R,AL: Session End
    R->>UI: Clicks "End Interview"
    UI->>API: POST /api/simulations/end
    API->>DB: Update simulation status
    API->>GR: Inject system guardrails
    API->>AI: Generate Post-Simulation Review<br/>(Agent 2C: full transcript analysis)
    AI-->>API: Review JSON<br/>(score, highlights, flagged moments)
    API->>DB: Save CoachReview
    API->>AL: Log audit entry
    API-->>UI: Review results
    UI-->>R: Display review + missed opportunities
```

---

## 7. Affinity Mapping & Profile Builder Pipeline

```mermaid
flowchart LR
    subgraph PHASE1["Phase 1: Data Collection"]
        TX1["Interview<br/>Transcript 1"]
        TX2["Interview<br/>Transcript 2"]
        TX3["Interview<br/>Transcript N"]
    end

    subgraph PHASE2["Phase 2: Affinity Mapping"]
        direction TB
        UPLOAD["Upload &<br/>Extract Text"]
        THEMES["Agent 3A:<br/>Suggest 8–12<br/>Themes"]
        CLUSTER["Agent 3A:<br/>Extract Quotes<br/>& Cluster"]
        BOARD["Interactive<br/>Mapping Board<br/>(Drag & Drop)"]
        INSIGHTS_GEN["Agent 3B:<br/>Generate Insights"]
        COL1["Found Out<br/>(Validated)"]
        COL2["Look Further<br/>(Ambiguous)"]
        COL3["New Areas<br/>(Novel)"]
    end

    subgraph PHASE3["Phase 3: Profile Builder"]
        direction TB
        SELECT["Researcher Selects<br/>Mapping Sessions"]
        GEN["Agent 4:<br/>Generate Archetypes"]
        PROF1["Profile 1:<br/>Name, Kicker,<br/>Behaviours,<br/>Barriers,<br/>Motivations,<br/>Spiral"]
        PROF2["Profile 2"]
        PROF3["Profile N"]
    end

    subgraph PHASE4["Phase 4: Simulation & Analysis"]
        direction TB
        SIM_1ON1["1:1 Interview<br/>Simulation"]
        SIM_FG["Focus Group<br/>Simulation"]
        HMW["HMW<br/>Analyser"]
        INSIGHT_A["Insight<br/>Analyser"]
    end

    TX1 --> UPLOAD
    TX2 --> UPLOAD
    TX3 --> UPLOAD
    UPLOAD --> THEMES --> CLUSTER --> BOARD
    BOARD --> INSIGHTS_GEN
    INSIGHTS_GEN --> COL1
    INSIGHTS_GEN --> COL2
    INSIGHTS_GEN --> COL3

    BOARD --> SELECT
    COL1 --> SELECT
    COL2 --> SELECT
    COL3 --> SELECT
    SELECT --> GEN
    GEN --> PROF1
    GEN --> PROF2
    GEN --> PROF3

    PROF1 --> SIM_1ON1
    PROF1 --> SIM_FG
    PROF2 --> SIM_FG
    PROF3 --> SIM_FG

    COL1 --> HMW
    COL1 --> INSIGHT_A

    style PHASE1 fill:#e3f2fd,stroke:#1565C0
    style PHASE2 fill:#f3e5f5,stroke:#6A1B9A
    style PHASE3 fill:#e0f7fa,stroke:#00838F
    style PHASE4 fill:#fff8e1,stroke:#F57F17
```

---

## 8. Security, Governance & Deployment Architecture

```mermaid
flowchart TB
    subgraph DEPLOYMENT["Deployment Model"]
        direction TB
        LOCAL["Current: Local Deployment<br/>(.exe / .dmg)<br/>Aleph-managed API Key"]
        HOSTED["Future: Centralised Hosting<br/>HPB Secure Infrastructure<br/>HPB-owned API Key"]
        LOCAL -->|"Transition"| HOSTED
    end

    subgraph SECURITY["Security Layers"]
        direction TB
        AUTH["Cookie-based<br/>Authentication"]
        ROUTE_PROTECT["Route Protection<br/>(Middleware)"]
        INPUT_VAL["Input Validation<br/>(Zod Schemas)"]
        API_SERVER["Server-side Only<br/>API Routes<br/>(No exposed endpoints)"]
    end

    subgraph DATA_GOV["Data Governance"]
        direction TB
        ISOLATION["Project-level<br/>Data Isolation"]
        KB_APPROVAL["KB Document<br/>Approval Workflow<br/>(Draft → Approved)"]
        NO_ACCUM["No Cross-session<br/>Learning or<br/>Insight Accumulation"]
        ZERO_RET["OpenAI Zero-Retention<br/>(No training on<br/>HPB data)"]
    end

    subgraph COMPLIANCE_LAYER["Compliance & Audit"]
        direction TB
        AUDIT_SYS["Comprehensive<br/>Audit Logging"]
        HASH_SYS["Prompt & Response<br/>Hashing<br/>(SHA-256)"]
        PDPA["PDPA<br/>Compliance"]
        IM8["IM8<br/>Compliance"]
    end

    subgraph GUARDRAILS_GOV["AI Guardrails"]
        direction TB
        ROLE["Role Lock"]
        SCOPE["Scope Lock"]
        CTX["Context Lock<br/>(Singapore Only)"]
        SAFE["Safety Lock"]
        BEH["Behaviour Lock"]
    end

    DEPLOYMENT --> SECURITY
    SECURITY --> DATA_GOV
    DATA_GOV --> COMPLIANCE_LAYER
    GUARDRAILS_GOV --> COMPLIANCE_LAYER

    style DEPLOYMENT fill:#e8eaf6,stroke:#283593
    style SECURITY fill:#ffebee,stroke:#b71c1c
    style DATA_GOV fill:#e0f2f1,stroke:#004D40
    style COMPLIANCE_LAYER fill:#fff3e0,stroke:#E65100
    style GUARDRAILS_GOV fill:#fce4ec,stroke:#880E4F
```

---

## 9. Technology Stack Overview

```mermaid
mindmap
    root((HPB AI Research<br/>Support Platform))
        Frontend
            Next.js + React
            TypeScript
            Tailwind CSS
            Shadcn/UI
            React Hook Form
            Drag & Drop Library
            Web Speech API
        Backend
            Node.js
            Next.js API Routes
            Prisma ORM
            Zod Validation
        Database
            PostgreSQL (Production)
            SQLite (Development)
        AI Engine
            OpenAI GPT-5.2 Enterprise
            RAG Pipeline
            12 Specialised Agents
            System Guardrails
            Structured JSON Output
        Storage
            Vercel Blob (Cloud)
            Local Filesystem (Dev)
            pdf-parse (PDF Extraction)
        Security
            Cookie-based Auth
            Route Middleware
            Server-side Only APIs
            Zero-Retention API
        Compliance
            Audit Logging
            SHA-256 Hashing
            PDPA Support
            IM8 Support
```

---

*Diagrams prepared by Aleph Labs for HPB AI Research Support Platform documentation.*
