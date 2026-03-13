# HPB Dojo & Prism

Internal HPB tools for interview rehearsal and question quality analysis.

> ⚠️ **Training Tool Reminder:** Rehearsal output is training only and cannot inform synthesis.

## Overview

This application contains two core tools:

### Interview Simulation
Practice interview moderation with AI personas that respond like actual research participants. Features include:
- **Live Coach** - Real-time AI coaching with nudges and suggestions during interviews
- **Moderator Guide** - Interactive question guide with auto-detection of covered topics
- **Persona Mixer** - Adjust persona behavior with controls for emotional tone, response length, Singlish level, and more
- **Session Persistence** - Resume interrupted sessions with full state recovery
- **Coach Review** - Post-session AI-generated feedback and analysis

### Affinity Mapping
Multi-perspective analysis tool for running questions across multiple personas simultaneously. *(Coming soon)*

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** Shadcn/UI + Tailwind CSS
- **Database:** SQLite via Prisma 7
- **AI:** Open AI GPT 5.x Enterprise

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database and apply schema
npx prisma db push

# Start development server
npm run dev
```

### Environment Setup

Create a `.env.local` file with:
```env
# Database
DATABASE_URL="file:./data/app.db"

# OpenAI API Key
OPENAI_API_KEY="your-openai-api-key-here"
```

## Project Structure

```
hpb-dojo-prism/
├── prisma/
│   ├── data/               # SQLite database (gitignored)
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # Route handlers (backend)
│   │   │   ├── projects/
│   │   │   ├── sub-projects/
│   │   │   ├── guides/
│   │   │   ├── questions/
│   │   │   ├── simulations/
│   │   │   ├── personas/
│   │   │   ├── kb/
│   │   │   └── gemini/
│   │   ├── dashboard/     # Dashboard page
│   │   ├── projects/      # Project pages
│   │   │   ├── new/       # Create project & guide
│   │   │   └── [projectId]/
│   │   │       └── sub/[subProjectId]/
│   │   │           ├── edit/     # Edit workspace
│   │   │           └── simulate/ # Rehearsal page
│   │   ├── simulations/   # Past simulations & review
│   │   ├── kb/            # Knowledge base
│   │   └── settings/      # Settings page
│   ├── components/
│   │   ├── layout/        # Sidebar, layout components
│   │   └── ui/            # Shadcn components
│   ├── generated/
│   │   └── prisma/        # Generated Prisma client
│   └── lib/
│       ├── db/            # Prisma client & audit logging
│       └── utils.ts       # Utility functions
└── .env.local             # Environment variables
```

## Features

### Current
- ✅ **Projects & Workspaces** - Organize research by project with multiple workspaces (sub-projects)
- ✅ **Moderator Guide Editor** - Create and edit guides with multiple question sets
- ✅ **Question Quality Checker** - AI-powered detection of leading, double-barrel, closed questions
- ✅ **Per-question Recheck** - Re-validate individual questions after editing
- ✅ **Dojo Rehearsal** - Practice interviews with AI personas
- ✅ **Persona Mixer** - Customize persona behavior with intuitive slider controls
- ✅ **Live Coach** - Real-time interview guidance with contextual nudges
- ✅ **Auto Covered Topics** - Automatic detection of moderator guide questions covered in conversation
- ✅ **Session Persistence** - Save and resume simulations with full state (messages, coach nudges, covered questions)
- ✅ **Coach Review** - AI-generated post-session feedback and analysis
- ✅ **Knowledge Base** - Project-level document storage for personas and research materials
- ✅ **Voice Dictation** - Speech-to-text input for simulation messages
- ✅ **Responsive UI** - Glass-morphism design with smooth animations

### Planned
- 🔜 Prism multi-perspective analysis
- 🔜 User authentication
- 🔜 Team collaboration features
- 🔜 Export/import functionality

## API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/[id]` | Get project details |
| PUT | `/api/projects/[id]` | Update a project |
| DELETE | `/api/projects/[id]` | Delete a project |

### Workspaces (Sub-Projects)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sub-projects` | Create a workspace |
| GET | `/api/sub-projects/[id]` | Get workspace details |
| PUT | `/api/sub-projects/[id]` | Update a workspace |
| DELETE | `/api/sub-projects/[id]` | Delete a workspace |

### Guides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/guides/create` | Create a new guide |
| GET | `/api/guides/[id]` | Get guide details |
| PUT | `/api/guides/[id]` | Update guide name |
| DELETE | `/api/guides/[id]` | Delete a guide |
| POST | `/api/guides/[id]/sets` | Add/update question sets |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questions/check` | Check question quality |
| POST | `/api/questions/recheck` | Recheck specific questions |

### Simulations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/simulations` | List all simulations |
| POST | `/api/simulations/start` | Start a new simulation |
| POST | `/api/simulations/message` | Send message in simulation |
| POST | `/api/simulations/end` | End a simulation |
| GET | `/api/simulations/[id]` | Get simulation details |
| PATCH | `/api/simulations/[id]` | Update simulation (coach state) |
| DELETE | `/api/simulations/[id]` | Delete a simulation |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gemini/persona` | Generate persona response |
| POST | `/api/gemini/live-coach` | Get live coaching feedback |
| POST | `/api/gemini/review` | Generate coach review |
| POST | `/api/gemini/validate-questions` | Validate question quality |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/kb` | Get KB documents for project |
| POST | `/api/projects/[id]/kb` | Add document to KB |
| DELETE | `/api/kb/[id]` | Delete KB document |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personas` | List all personas |
| GET | `/api/seed` | Seed sample personas |

## Database Schema

See `prisma/schema.prisma` for the complete schema including:
- **Project** - Top-level research projects
- **SubProject** - Workspaces within projects
- **GuideVersion** - Moderator guides with versioning
- **GuideSet** - Question sets within guides
- **Question** - Individual questions with quality metadata
- **ProjectKBDoc** - Knowledge base documents (personas, research materials)
- **Simulation** - Interview sessions with coach state persistence
- **SimulationMessage** - Chat messages within simulations
- **CoachReview** - AI-generated session reviews
- **AuditLog** - Comprehensive action logging

## Key Concepts

### Persona Mixer
The mixer provides intuitive controls to customize AI persona behavior:
- **Emotional Openness** - How freely the persona shares feelings
- **Response Length** - Brief vs. detailed responses
- **Singlish Level** - Local language flavor
- **Directness** - How straightforward responses are
- **Engagement Level** - Enthusiasm and interest shown

### Live Coach
Real-time coaching during simulations:
- **Coaching Nudges** - Contextual suggestions based on conversation
- **Question Suggestions** - Relevant follow-up questions from the moderator guide
- **Highlight Quotes** - Key participant quotes to explore further
- **Auto Topic Detection** - Tracks which guide questions have been covered

### Session Persistence
Simulations can be paused and resumed with full state recovery:
- Conversation history
- Coach nudges and feedback
- Covered question tracking
- Mixer settings

## License

Internal HPB use only. Not for distribution.
<!-- Created by Swapnil Bapat © 2026 -->
