# HPB AI Tool - Pages, Flows, and Pop-ups Documentation

This document serves as a comprehensive index of every single page, sub-page, transitionary flow, pop-up, and modal within the entire HPB AI Tool system. It maps out the purpose of each view and any interactive overlays they contain to ensure a holistic understanding of the application's user journey.

---

## 1. Global Layout & Navigation
These components are persistent and serve as the structural framework encapsulating most pages.

* **Root Layout** (`src/app/layout.tsx`)
    * The base application shell wrapping all pages. Includes global styles, metadata, and core layout logic.
* **Top Navigation Bar** (`src/components/layout/top-navbar.tsx`)
    * Provides breadcrumbs, user profile access, and high-level navigation across the application. Contains the enlarged logo image.
* **Sidebar** (`src/components/layout/sidebar.tsx`)
    * Handles the primary vertical navigation menu allowing users to switch between main application sections (Dashboard, Global Knowledge Base, Setup, etc.).

---

## 2. Core Application Pages (Root Level)

* **Landing / Home Page** (`src/app/page.tsx`)
    * **Path:** `/`
    * **Purpose:** The introductory frontend page or landing entry point for the HPB Dojo Prism application.

* **Main Dashboard** (`src/app/dashboard/page.tsx`)
    * **Path:** `/dashboard`
    * **Purpose:** The primary user hub displaying all created projects.
    * **Pop-ups & Overlays:**
        * **Delete Project Alert** (`AlertDialog`): A confirmation dialog to safely delete a selected project.

* **Global Knowledge Base** (`src/app/kb/page.tsx`)
    * **Path:** `/kb`
    * **Purpose:** The centralized repository for all platform-wide reference materials, documents, and transcripts.
    * **Pop-ups & Overlays:**
        * **Document Upload Dialog:** Allows users to upload new files, featuring data classification and compliance confirmations.
        * **Document Details / Preview Viewer:** A pop-up for inspecting document contents and metadata.

* **Settings** (`src/app/settings/page.tsx`)
    * **Path:** `/settings`
    * **Purpose:** Global application configuration and user preferences control center.

* **Privacy Statement** (`src/app/privacy/page.tsx`)
    * **Path:** `/privacy`
    * **Purpose:** Displays the platform's compliance and data privacy guidelines ("HPB AI Research Tool").

* **Terms of Use** (`src/app/terms/page.tsx`)
    * **Path:** `/terms`
    * **Purpose:** Details legal agreements and conditions of system usage.

---

## 3. Project Management Flows

This flow governs creating and configuring overarching Projects.

* **Create New Project Flow - Initial Details** (`src/app/projects/new/page.tsx`)
    * **Path:** `/projects/new`
    * **Purpose:** First step in creating a new project. Form capture for project name, description, and base configurations.

* **Create New Project Flow - Moderator Guide** (`src/app/projects/new/guide/page.tsx`)
    * **Path:** `/projects/new/guide`
    * **Purpose:** Second step in project creation. It allows researchers to script the initial interview intents and questions.
    * **Pop-ups & Overlays:**
        * **Import Existing Guide Dialog:** Captures pasted text to automatically generate sections.
        * **Feedback & Research Cards:** Inline, absolutely-positioned floating cards exposing AI suggestions and "Needs Work" assessments for individual questions.

* **Project Detail Dashboard** (`src/app/projects/[projectId]/page.tsx`)
    * **Path:** `/projects/[projectId]`
    * **Purpose:** The nexus page for a single project, rendering all available sub-projects/workspaces under it.
    * **Pop-ups & Overlays:**
        * **Edit Project Dialog:** Allows users to rename or alter project settings via a pop-up.
        * **[Project Name] Viewing Dialog:** A structured modal rendering overarching project information contextually.

* **Project-Specific Knowledge Base** (`src/app/projects/[projectId]/kb/page.tsx`)
    * **Path:** `/projects/[projectId]/kb`
    * **Purpose:** Contains reference documentation strictly tied to this specific project.
    * **Pop-ups & Overlays:**
        * **Upload Document Dialog:** File upload modal scoped to the project.
        * **Preview Document Dialog:** Inline inspector for uploaded content.

* **Project Guide Editor** (`src/app/projects/[projectId]/guide/page.tsx`)
    * **Path:** `/projects/[projectId]/guide`
    * **Purpose:** Allows subsequent review and modifications to the project’s overarching Moderator Guide.

* **Project Dojo / Practice Setup** (`src/app/projects/[projectId]/dojo/page.tsx`)
    * **Path:** `/projects/[projectId]/dojo`
    * **Purpose:** Settings and configuration area for standard simulation practices inside the 'Dojo' context.

---

## 4. Workspace / Persona Configuration Flows (Sub-Projects)

Once inside a Project, users dive into granular Sub-Projects representing distinct personas, interview sessions, or specific workspaces.

* **Create New Workspace (Sub-project)** (`src/app/projects/[projectId]/sub/new/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/new`
    * **Purpose:** The wizard step defining a new persona, participant profile, or specific research target scenario.

* **Workspace / Persona Overview** (`src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]`
    * **Purpose:** The launchpad for connecting with this specific workspace. Offers portals into Simulation, Synthesis Mapping, or Archetyping.
    * **Pop-ups & Overlays:**
        * **Edit Workspace Dialog:** Options to adjust the persona’s profile details on the fly.
        * **[Workspace Name] Viewer Dialog:** Contextual review modal.

* **Edit Workspace Detail** (`src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]/edit`
    * **Purpose:** An expanded full-page form to drastically alter a complex persona configuration, rather than using the quick pop-up.

---

## 5. Live Simulation & Review Flow

The core interactive interview process involving the AI.

* **Live Simulation Session** (`src/app/projects/[projectId]/sub/[subProjectId]/simulate/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]/simulate`
    * **Purpose:** The live chat interface where the researcher interviews the AI Persona.
    * **Transitional / Interactive UI Elements:**
        * AI Coach Loader & Persona Typewriter interactions inside the chat.
        * Floating live Coach Opportunity highlights triggering tooltips.

* **Simulation Session Review** (`src/app/simulations/[id]/page.tsx`)
    * **Path:** `/simulations/[id]`
    * **Purpose:** The post-interview analytics page. Here, researchers review their performance and examine "Missed Opportunities" diagnosed by the live Coach.
    * **Pop-ups & Overlays:**
        * **"Ask Your Coach" Dialog:** A modal opened when clicking a missed opportunity, allowing users to converse directly with the AI Coach to dive deeper into *why* an opportunity was missed.
        * **AI Feedback Component Modal:** An overlay utilized to provide explicit system feedback (e.g. thumbs up/down, reporting an issue).

---

## 6. Synthesis / AI Tools Workflows

Advanced analytical tools built around the persona transcripts.

### Tool A: Behavioral Archetypes Generator
* **Archetypes Setup (Loading Sequence)** (`src/app/projects/[projectId]/sub/[subProjectId]/archetypes/new/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]/archetypes/new`
    * **Purpose:** Interstitial setup/loading page. This defines the generation prompt configuration and renders a post-generation animation before dissolving into the final tab view.
    
* **Archetypes Results Tab** (`src/app/projects/[projectId]/sub/[subProjectId]/archetypes/[sessionId]/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]/archetypes/[sessionId]`
    * **Purpose:** Detailed page displaying Apple "Shortcuts"-like interactive layout cards. Each generated Archetype sits distinctly within this view, offering detail expansions.

### Tool B: Mapping Insights Generator
* **Mapping Tool Setup (Loading Sequence)** (`src/app/projects/[projectId]/sub/[subProjectId]/map/new/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]/map/new`
    * **Purpose:** Transitional loading/setup screen to select map axis values and formulate plotting data. Shows "Generating Map" visual state.
    
* **Mapping Results View** (`src/app/projects/[projectId]/sub/[subProjectId]/map/[sessionId]/page.tsx`)
    * **Path:** `/projects/[projectId]/sub/[subProjectId]/map/[sessionId]`
    * **Purpose:** A complex interactive graph UI containing a dynamic design layout. Plotted criteria map cleanly onto quadrants where researchers analyze distributions. Features customized legends and column titles without numerical prefixes.

---

## Summary of Specialized Components & General Inter-Flow Pop-ups

* **Feedback / Issue Reporter (`src/components/ai/feedback.tsx`):**
    * Operates as a consistent modal accessible across different simulation/results environments to log compliance or accuracy issues.
* **Component-Level Modals (`src/components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `hover-card.tsx`):**
    * While abstracted, these are dynamically invoked across the platform to act as interceptors (e.g., verifying you really want to discard a mapping setup, or finalizing a save state midway through configuring the Dojo).
