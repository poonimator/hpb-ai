# HMW Tab Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the HMW feature into the workspace tab system and migrate critique storage from localStorage to the database.

**Architecture:** Add a `HmwCritique` Prisma model linked to `SubProject`. Create two new API routes (GET list, DELETE single) under the existing `sub-projects` API namespace. Modify the existing HMW critique POST endpoint to persist results. Add a 5th tab to the workspace page and replace all localStorage usage in the HMW page with API calls.

**Tech Stack:** Next.js 15 (App Router), Prisma (PostgreSQL), TypeScript, Tailwind CSS, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-03-27-hmw-tab-migration-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `prisma/schema.prisma` | Add HmwCritique model + SubProject relation |
| Create | `src/app/api/sub-projects/[subProjectId]/hmw-critiques/route.ts` | GET all critiques for a sub-project |
| Create | `src/app/api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]/route.ts` | DELETE a single critique |
| Modify | `src/app/api/sub-projects/[subProjectId]/route.ts:96-103` | Add hmwCritiques to include + _count |
| Modify | `src/app/api/gemini/hmw-critique/route.ts:196-228` | Persist critique to DB, return savedId |
| Modify | `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` | Add HMW tab, remove standalone button, render cards |
| Modify | `src/app/projects/[projectId]/sub/[subProjectId]/hmw/page.tsx` | Replace localStorage with API, add scroll-to |

---

### Task 1: Add HmwCritique Prisma Model

**Files:**
- Modify: `prisma/schema.prisma:65-66` (SubProject relation) and append after line 472 (new model)

- [ ] **Step 1: Add hmwCritiques relation to SubProject model**

In `prisma/schema.prisma`, add `hmwCritiques` to the SubProject model at line 65 (after `archetypeSessions`):

```prisma
  archetypeSessions ArchetypeSession[]
  hmwCritiques      HmwCritique[]
```

- [ ] **Step 2: Add HmwCritique model**

After the Archetype model block (after line 472), add:

```prisma
// ============================================
// HMW Critiques (How Might We Statement Analysis)
// ============================================

model HmwCritique {
  id              String     @id @default(cuid())
  subProjectId    String
  subProject      SubProject @relation(fields: [subProjectId], references: [id], onDelete: Cascade)
  hmwStatement    String
  overallVerdict  String     // "PASS" | "NEEDS_WORK" | "FAIL"
  critiqueJson    String     // Full HMWCritiqueResult JSON (lenses, research alignment, highlights)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([subProjectId, createdAt])
}
```

- [ ] **Step 3: Run Prisma migration**

Run: `npx prisma migrate dev --name add-hmw-critique`
Expected: Migration created and applied successfully, Prisma Client regenerated.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add HmwCritique model to database schema"
```

---

### Task 2: Create GET API Route for HMW Critiques

**Files:**
- Create: `src/app/api/sub-projects/[subProjectId]/hmw-critiques/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/sub-projects/[subProjectId]/hmw-critiques/route.ts`:

```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// GET /api/sub-projects/[subProjectId]/hmw-critiques
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        const critiques = await prisma.hmwCritique.findMany({
            where: { subProjectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                hmwStatement: true,
                overallVerdict: true,
                critiqueJson: true,
                createdAt: true,
            },
        });

        return successResponse(critiques);
    } catch (error) {
        console.error("[API] GET hmw-critiques error:", error);
        return errorResponse("Failed to fetch HMW critiques", 500);
    }
}
```

- [ ] **Step 2: Verify the server compiles**

Run: `npx next build --no-lint 2>&1 | tail -5` or start the dev server and hit `GET /api/sub-projects/<any-subproject-id>/hmw-critiques` — should return `{ success: true, data: [] }`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/sub-projects/\[subProjectId\]/hmw-critiques/route.ts
git commit -m "feat: add GET endpoint for HMW critiques"
```

---

### Task 3: Create DELETE API Route for HMW Critiques

**Files:**
- Create: `src/app/api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string; critiqueId: string }>;
}

// DELETE /api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId, critiqueId } = await params;

        const existing = await prisma.hmwCritique.findFirst({
            where: { id: critiqueId, subProjectId },
        });

        if (!existing) {
            return errorResponse("HMW critique not found", 404);
        }

        await prisma.hmwCritique.delete({
            where: { id: critiqueId },
        });

        await logAudit({
            action: "DELETE",
            entityType: "HmwCritique",
            entityId: critiqueId,
            meta: { subProjectId },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE hmw-critique error:", error);
        return errorResponse("Failed to delete HMW critique", 500);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/sub-projects/\[subProjectId\]/hmw-critiques/\[critiqueId\]/route.ts
git commit -m "feat: add DELETE endpoint for individual HMW critique"
```

---

### Task 4: Add HMW Critiques to the Workspace Data Endpoint

**Files:**
- Modify: `src/app/api/sub-projects/[subProjectId]/route.ts:96-103` and `119-148`

- [ ] **Step 1: Add hmwCritiques to _count select**

In `src/app/api/sub-projects/[subProjectId]/route.ts`, find the `_count` block (lines 96-103):

```typescript
                _count: {
                    select: {
                        guideVersions: true,
                        simulations: true,
                        mappingSessions: true,
                        archetypeSessions: true,
                    },
                },
```

Add `hmwCritiques: true`:

```typescript
                _count: {
                    select: {
                        guideVersions: true,
                        simulations: true,
                        mappingSessions: true,
                        archetypeSessions: true,
                        hmwCritiques: true,
                    },
                },
```

- [ ] **Step 2: Add hmwCritiques include**

After the `archetypeSessions` include block (after line 147, before the closing `},` of the main `include`), add:

```typescript
                hmwCritiques: {
                    orderBy: { createdAt: "desc" as const },
                    select: {
                        id: true,
                        hmwStatement: true,
                        overallVerdict: true,
                        createdAt: true,
                    },
                },
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/sub-projects/\[subProjectId\]/route.ts
git commit -m "feat: include HMW critiques in workspace data endpoint"
```

---

### Task 5: Persist HMW Critiques in the Critique API

**Files:**
- Modify: `src/app/api/gemini/hmw-critique/route.ts:12-84` (validation + mock path) and `196-228` (persistence + response)

- [ ] **Step 1: Add subProjectId validation**

In `src/app/api/gemini/hmw-critique/route.ts`, after the `projectId` validation (lines 20-22), add:

```typescript
        if (!subProjectId) {
            return NextResponse.json({ success: false, error: "Sub-project ID is required" }, { status: 400 });
        }
```

- [ ] **Step 2: Add DB persistence to the mock response path**

The mock response path (lines 77-84) returns early before the main persistence code. It must also persist to DB. Replace the mock block:

```typescript
        if (!isOpenAIConfigured()) {
            // Return mock response if not configured
            return NextResponse.json({
                success: true,
                data: getMockHMWCritique(hmwStatement),
                disclaimer: DISCLAIMER,
                modelName: "mock",
            });
        }
```

With:

```typescript
        if (!isOpenAIConfigured()) {
            const mockData = getMockHMWCritique(hmwStatement);
            let savedId: string | null = null;
            try {
                const saved = await prisma.hmwCritique.create({
                    data: {
                        subProjectId,
                        hmwStatement: hmwStatement.trim(),
                        overallVerdict: mockData.overallVerdict,
                        critiqueJson: JSON.stringify(mockData),
                    },
                });
                savedId = saved.id;
            } catch (dbErr) {
                console.error("[HMW Critique] Mock DB save error:", dbErr);
            }
            return NextResponse.json({
                success: true,
                data: mockData,
                savedId,
                disclaimer: DISCLAIMER,
                modelName: "mock",
            });
        }
```

- [ ] **Step 3: Add DB persistence after AI response parsing**

After the `parsed` variable is set (line 202) and before the audit log block (line 204), add:

```typescript
        // Persist to database
        let savedId: string | null = null;
        try {
            const saved = await prisma.hmwCritique.create({
                data: {
                    subProjectId,
                    hmwStatement: hmwStatement.trim(),
                    overallVerdict: parsed.overallVerdict,
                    critiqueJson: JSON.stringify(parsed),
                },
            });
            savedId = saved.id;
        } catch (dbErr) {
            console.error("[HMW Critique] DB save error:", dbErr);
        }
```

Note: `subProjectId` is now guaranteed to exist due to the validation in Step 1, so no `if` guard needed.

- [ ] **Step 4: Add savedId to the response**

Change the success response (lines 222-228) from:

```typescript
        return NextResponse.json({
            success: true,
            data: parsed,
            disclaimer: DISCLAIMER,
            modelName: DEFAULT_MODEL,
            latencyMs,
        });
```

To:

```typescript
        return NextResponse.json({
            success: true,
            data: parsed,
            savedId,
            disclaimer: DISCLAIMER,
            modelName: DEFAULT_MODEL,
            latencyMs,
        });
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/gemini/hmw-critique/route.ts
git commit -m "feat: persist HMW critiques to database after AI analysis"
```

---

### Task 6: Add HMW Tab to Workspace Page

**Files:**
- Modify: `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

This is the largest task. It touches the TypeScript interface, tab type union, the HMW button removal, a new tab button, and new tab content.

- [ ] **Step 1: Add HmwCritique interface and extend SubProject interface**

After the `ArchetypeSessionData` interface (line 104), add:

```typescript
interface HmwCritiqueInfo {
    id: string;
    hmwStatement: string;
    overallVerdict: string;
    createdAt: string;
}
```

Then in the `SubProject` interface (lines 106-127), add `hmwCritiques` to the data and `_count`:

After line 120 (`archetypeSessions: ArchetypeSessionData[];`), add:
```typescript
    hmwCritiques: HmwCritiqueInfo[];
```

After line 125 (`archetypeSessions: number;`), add:
```typescript
        hmwCritiques: number;
```

- [ ] **Step 2: Update tab type union**

Change line 162-163 from:

```typescript
    const initialTab = (searchParams.get("tab") as "guides" | "simulations" | "mapping" | "archetypes") || "guides";
    const [activeContentTab, setActiveContentTab] = useState<"guides" | "simulations" | "mapping" | "archetypes">(initialTab);
```

To:

```typescript
    const initialTab = (searchParams.get("tab") as "guides" | "simulations" | "mapping" | "archetypes" | "hmw") || "guides";
    const [activeContentTab, setActiveContentTab] = useState<"guides" | "simulations" | "mapping" | "archetypes" | "hmw">(initialTab);
```

And update `switchTab` (line 165) similarly:

```typescript
    const switchTab = useCallback((tab: "guides" | "simulations" | "mapping" | "archetypes" | "hmw") => {
```

- [ ] **Step 3: Remove the standalone HMW button**

Delete lines 487-497 (the `<div className="flex-shrink-0">` block containing the HMW Link/Button). This is the block:

```typescript
                        <div className="flex-shrink-0">
                            <Link href={`/projects/${projectId}/sub/${subProjectId}/hmw`}>
                                <Button
                                    variant="outline"
                                    className="rounded-full bg-white border-border text-primary shadow-sm hover:bg-white hover:border-primary/40 hover:shadow transition-all duration-200 gap-2 font-bold text-xs uppercase tracking-wide"
                                >
                                    <Lightbulb className="h-4 w-4" />
                                    How Might We
                                </Button>
                            </Link>
                        </div>
```

- [ ] **Step 4: Add HMW tab button**

After the Profiles/archetypes tab button (after line 583, before the closing `</div>` of the tab bar), add:

```typescript
                        <button
                            onClick={() => switchTab("hmw")}
                            className={`
                                relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-2 ml-1
                                ${activeContentTab === "hmw"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "hmw" ? { color: 'var(--color-knowledge)' } : undefined}
                        >
                            <Lightbulb className={`h-3.5 w-3.5 ${activeContentTab === "hmw" ? "" : "text-muted-foreground"}`} style={activeContentTab === "hmw" ? { color: 'var(--color-knowledge)' } : undefined} />
                            How Might We
                            {(subProject.hmwCritiques?.length || 0) > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "hmw" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "hmw" ? { backgroundColor: 'var(--color-knowledge-subtle)', color: 'var(--color-knowledge)' } : undefined}>
                                    {subProject.hmwCritiques.length}
                                </span>
                            )}
                        </button>
```

- [ ] **Step 5: Add HMW tab content**

After the archetypes tab content block (after line 926, before the closing `</div>` of the content area at line 927), add:

```typescript
                    {/* How Might We */}
                    {activeContentTab === "hmw" && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New HMW Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/hmw`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Lightbulb className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">Analyse HMW</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Critique statements with the 5-lens framework
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* HMW Critique Cards */}
                            {subProject.hmwCritiques?.map((critique) => {
                                const verdictStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
                                    PASS: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "Pass" },
                                    NEEDS_WORK: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", label: "Needs Work" },
                                    FAIL: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Fail" },
                                };
                                const v = verdictStyles[critique.overallVerdict] || verdictStyles.NEEDS_WORK;

                                return (
                                    <div
                                        key={critique.id}
                                        onClick={() => window.location.href = `/projects/${projectId}/sub/${subProjectId}/hmw?scrollTo=${critique.id}`}
                                        className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                    >
                                        {/* Delete button on hover */}
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!confirm("Delete this HMW critique?")) return;
                                                try {
                                                    const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques/${critique.id}`, { method: "DELETE" });
                                                    if (res.ok) await fetchSubProject();
                                                    else alert("Failed to delete");
                                                } catch { alert("Failed to delete"); }
                                            }}
                                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Verdict badge */}
                                        <div className="mb-auto">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${v.bg} ${v.text} ${v.border} border`}>
                                                {v.label}
                                            </span>
                                        </div>

                                        {/* Content at bottom */}
                                        <div className="mt-3">
                                            <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                                <span className="text-primary">HMW </span>
                                                {critique.hmwStatement}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground leading-snug">
                                                {new Date(critique.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
```

- [ ] **Step 6: Verify the workspace page renders correctly**

Run the dev server (`npm run dev`), navigate to a sub-project workspace, and verify:
- The standalone HMW button in the top-right is gone
- The HOW MIGHT WE tab appears after PROFILES
- Clicking the tab shows the "Analyse HMW" create card
- The count badge shows 0 or the correct count

- [ ] **Step 7: Commit**

```bash
git add src/app/projects/\[projectId\]/sub/\[subProjectId\]/page.tsx
git commit -m "feat: add HMW tab to workspace, remove standalone button"
```

---

### Task 7: Migrate HMW Page from localStorage to API

**Files:**
- Modify: `src/app/projects/[projectId]/sub/[subProjectId]/hmw/page.tsx`

- [ ] **Step 1: Remove localStorage helpers and constants**

Delete the `STORAGE_KEY_PREFIX` constant (line 75), the `loadHistory` function (lines 94-103), and the `saveHistory` function (lines 105-111).

- [ ] **Step 2: Update the HistoryEntry interface**

The `HistoryEntry` interface (lines 52-57) stays the same structurally but `id` will now come from the database (cuid) instead of `hmw_${Date.now()}`.

- [ ] **Step 3: Add useSearchParams import**

Add a new import line (this file does not currently import from `next/navigation`):

```typescript
import { useSearchParams } from "next/navigation";
```

Place this after the existing `import Link from "next/link";` line.

- [ ] **Step 4: Replace localStorage state management with API fetching**

Replace the state management section. Remove the two `useEffect` blocks for localStorage (lines 361-372). Replace with API-based fetching:

```typescript
    const searchParams = useSearchParams();
    const scrollToId = searchParams.get("scrollTo");

    // Fetch history from API
    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques`);
            const data = await res.json();
            if (data.success && data.data) {
                setHistory(data.data.map((c: any) => ({
                    id: c.id,
                    hmwStatement: c.hmwStatement,
                    critique: JSON.parse(c.critiqueJson),
                    timestamp: new Date(c.createdAt),
                })));
            }
        } catch (err) {
            console.error("[HMW] Failed to fetch history:", err);
        } finally {
            setIsHistoryLoaded(true);
        }
    }, [subProjectId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // One-time localStorage cleanup
    useEffect(() => {
        try {
            localStorage.removeItem("hmw_critique_history_" + subProjectId);
        } catch {}
    }, [subProjectId]);

    // Scroll to specific critique if scrollTo param is present
    useEffect(() => {
        if (scrollToId && isHistoryLoaded && history.length > 0) {
            const el = document.getElementById(`hmw-critique-${scrollToId}`);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 300);
            }
        }
    }, [scrollToId, isHistoryLoaded, history]);
```

- [ ] **Step 5: Update handleCheck to use API response**

In `handleCheck` (lines 396-440), update the success handler to use the `savedId` from the API response and refresh from DB:

Replace the block inside `if (data.success && data.data)` (lines 416-430). Keep the existing `else` error-handling branch (lines 431-433) unchanged:

```typescript
            if (data.success && data.data) {
                setHmwInput("");
                await fetchHistory();

                // Scroll to results
                setTimeout(() => {
                    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 300);
            } else {
                alert(data.error || "Failed to critique HMW statement");
            }
```

- [ ] **Step 6: Update handleDelete to call API**

Replace `handleDelete` (lines 392-394):

```typescript
    const handleDelete = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques/${id}`, { method: "DELETE" });
            if (res.ok) {
                setHistory(prev => prev.filter(e => e.id !== id));
            } else {
                alert("Failed to delete");
            }
        } catch {
            alert("Failed to delete");
        }
    }, [subProjectId]);
```

- [ ] **Step 7: Add id attributes to CritiqueDisplay for scroll targeting**

In the `CritiqueDisplay` component (line 270), update the outer div to include an id:

Change:
```typescript
function CritiqueDisplay({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
    const { critique, hmwStatement } = entry;
    const allHighlights = critique.lenses.flatMap(l => l.highlightedParts);

    return (
        <div className="animate-in slide-in-from-bottom-3 fade-in duration-500">
```

To:
```typescript
function CritiqueDisplay({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
    const { critique, hmwStatement } = entry;
    const allHighlights = critique.lenses.flatMap(l => l.highlightedParts);

    return (
        <div id={`hmw-critique-${entry.id}`} className="animate-in slide-in-from-bottom-3 fade-in duration-500">
```

- [ ] **Step 8: Verify the HMW page works end-to-end**

Run the dev server, navigate to the HMW page:
- Submit a new HMW statement — verify it persists (refresh page, still there)
- Delete a critique — verify it's removed from DB
- Navigate from workspace tab card — verify it scrolls to the correct critique
- Verify no localStorage keys remain for HMW

- [ ] **Step 9: Commit**

```bash
git add src/app/projects/\[projectId\]/sub/\[subProjectId\]/hmw/page.tsx
git commit -m "feat: migrate HMW page from localStorage to database API"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full flow test**

1. Navigate to workspace → HMW tab should be visible with count badge
2. Click "Analyse HMW" card → goes to HMW page
3. Submit an HMW statement → critique saved, appears in history
4. Go back to workspace → HMW tab count updated, card appears with verdict badge
5. Click the card → navigates to HMW page and scrolls to that critique
6. Delete from workspace tab → card removed, count updated
7. Delete from HMW page → removed from history

- [ ] **Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during final verification"
```
