"use client"

import * as React from "react"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RailHeader } from "@/components/layout/rail-header"
import { RailSection } from "@/components/layout/rail-section"
import { MetaRow } from "@/components/layout/meta-row"

export type WorkspaceRailSubProject = {
  id: string
  name: string
  researchStatement?: string | null
  ageRange?: string | null
  lifeStage?: string | null
  createdAt?: string | Date | null
  project?: { id: string; name: string } | null
}

type Props = {
  subProject: WorkspaceRailSubProject
  projectId: string
  subProjectId: string
  /** Tool-specific rail sections rendered between the Research block and the footer. */
  children?: React.ReactNode
  /** Hide the Edit workspace footer button (e.g. on wizard flows where the action would confuse the user). */
  hideEdit?: boolean
}

function WorkspaceRail({ subProject, projectId, subProjectId, children, hideEdit }: Props) {
  const [researchOpen, setResearchOpen] = React.useState(false)

  const createdLabel = subProject.createdAt
    ? new Date(subProject.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <>
      <RailHeader>
        <h2 className="text-display-4 text-foreground leading-tight">{subProject.name}</h2>
        {subProject.researchStatement && (
          <div className="flex flex-col gap-1.5">
            <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
              {subProject.researchStatement}
            </p>
            <button
              type="button"
              onClick={() => setResearchOpen(true)}
              className="self-start text-ui-sm text-[color:var(--primary)] hover:underline outline-none focus-visible:shadow-focus rounded-[2px]"
            >
              Read more
            </button>
          </div>
        )}
      </RailHeader>

      <RailSection title="Research">
        <MetaRow k="Age range" v={subProject.ageRange || "—"} />
        <MetaRow k="Life stage" v={subProject.lifeStage || "—"} />
        {createdLabel && <MetaRow k="Created" v={createdLabel} />}
      </RailSection>

      {children}

      {!hideEdit && (
        <div className="px-6 py-4">
          <Button asChild variant="outline" size="sm" className="w-full justify-center">
            <Link href={`/projects/${projectId}/sub/${subProjectId}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit workspace
            </Link>
          </Button>
        </div>
      )}

      <div className="flex-1" />

      <Dialog open={researchOpen} onOpenChange={setResearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{subProject.name}</DialogTitle>
            <DialogDescription>Research statement</DialogDescription>
          </DialogHeader>
          <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {subProject.researchStatement || "No research statement provided."}
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { WorkspaceRail }
// Created by Swapnil Bapat © 2026
