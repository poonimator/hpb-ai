"use client"

import * as React from "react"
import { CheckCircle2, Lightbulb, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ModeratorGuidePanel — the left-rail guide checklist in the simulate session.
 *
 * Renders numbered sections, each holding a list of questions with their
 * sub-questions. Questions can be:
 *   - covered  → strike-through + "Covered" badge
 *   - highlighted → the current coach suggestion (violet highlight + reason)
 *   - idle     → clickable, inserts the question into the composer via onPick
 *
 * Refs: the parent owns a `Map<string, HTMLDivElement>` so it can scroll a
 * question into view. Pass `registerRef(id, el | null)` and the panel will
 * register/unregister each question row.
 */

interface GuideSubQuestion {
  id: string
  text: string
}

interface GuideQuestion {
  id: string
  text: string
  subQuestions?: GuideSubQuestion[]
}

interface GuideSection {
  id: string
  title: string
  questions: GuideQuestion[]
}

interface ModeratorGuidePanelProps {
  sections: GuideSection[]
  /** Set of question IDs the AI coach has marked as covered. */
  coveredQuestionIds: Set<string>
  /** Currently-suggested question ID (null when nothing is suggested). */
  highlightedQuestionId?: string | null
  /** Optional reason copy shown under the highlighted question. */
  highlightedQuestionReason?: string | null
  /** Called with (id, el). Pass el=null when unmounting. */
  registerRef?: (id: string, el: HTMLDivElement | null) => void
  /** Tapping an uncovered question calls this with the question's text. */
  onPickQuestion?: (text: string) => void
  /** Tapping a sub-question calls this with the sub-question's text. */
  onPickSubQuestion?: (text: string) => void
  className?: string
}

function ModeratorGuidePanel({
  sections,
  coveredQuestionIds,
  highlightedQuestionId,
  highlightedQuestionReason,
  registerRef,
  onPickQuestion,
  onPickSubQuestion,
  className,
}: ModeratorGuidePanelProps) {
  const coveredCount = coveredQuestionIds.size

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {coveredCount > 0 ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-md2)] px-3 py-2",
            "bg-[color:var(--primary-soft)] shadow-inset-edge",
          )}
        >
          <CheckCircle2 className="size-4 text-[color:var(--primary)]" />
          <span className="text-caption font-medium text-[color:var(--primary)]">
            {coveredCount} question{coveredCount !== 1 ? "s" : ""} covered
          </span>
        </div>
      ) : null}

      {sections.map((set, i) => (
        <div key={set.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-chip)]",
                "bg-[color:var(--surface-muted)] text-[color:var(--primary)]",
                "text-[11px] font-bold shadow-inset-edge",
              )}
            >
              {i + 1}
            </div>
            <h4 className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
              {set.title}
            </h4>
          </div>

          <div className="ml-2.5 flex flex-col gap-3 border-l-2 border-[color:var(--border)] pl-3">
            {set.questions.map((q) => {
              const isCovered = coveredQuestionIds.has(q.id)
              const isHighlighted = highlightedQuestionId === q.id
              return (
                <div
                  key={q.id}
                  ref={(el) => registerRef?.(q.id, el)}
                  onClick={() => {
                    if (!isCovered) onPickQuestion?.(q.text)
                  }}
                  className={cn(
                    "transition-all duration-300",
                    isHighlighted
                      ? cn(
                          "ml-2 rounded-[var(--radius-panel)] border px-4 py-4",
                          "border-[color:var(--knowledge-soft)] bg-[color:var(--knowledge-soft)]",
                        )
                      : isCovered
                        ? "pl-4 opacity-50"
                        : cn(
                            "-ml-2 cursor-pointer rounded-[var(--radius-sm2)] py-1.5 pl-6",
                            "hover:bg-[color:var(--surface-muted)]",
                          ),
                  )}
                >
                  {isHighlighted ? (
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-[var(--radius-sm2)]",
                          "bg-[color:var(--knowledge-soft)]",
                        )}
                      >
                        <Sparkles className="size-3 text-[color:var(--knowledge)]" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[color:var(--knowledge)]">
                        Coach Suggests
                      </span>
                    </div>
                  ) : null}

                  <p
                    className={cn(
                      "text-body-sm font-medium leading-relaxed transition-all",
                      isHighlighted
                        ? "text-foreground"
                        : isCovered
                          ? "text-muted-foreground line-through decoration-[color:var(--primary)] decoration-2"
                          : "text-foreground hover:text-[color:var(--primary)]",
                    )}
                  >
                    {q.text}
                    {isCovered && !isHighlighted ? (
                      <span
                        className={cn(
                          "ml-2 inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0",
                          "border-[color:var(--border)] bg-[color:var(--surface-muted)]",
                          "text-[10px] font-medium text-[color:var(--primary)]",
                        )}
                      >
                        <CheckCircle2 className="mr-0.5 size-2.5" />
                        Covered
                      </span>
                    ) : null}
                  </p>

                  {isHighlighted && highlightedQuestionReason ? (
                    <div className="mt-3 flex items-start gap-2 border-t border-[color:var(--border-subtle)] pt-3">
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[color:var(--knowledge)]" />
                      <p className="text-caption italic leading-relaxed text-[color:var(--knowledge)]">
                        {highlightedQuestionReason}
                      </p>
                    </div>
                  ) : null}

                  {q.subQuestions && q.subQuestions.length > 0 && !isCovered && !isHighlighted ? (
                    <ul className="mt-2 space-y-1.5">
                      {q.subQuestions.map((sq) => (
                        <li
                          key={sq.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onPickSubQuestion?.(sq.text)
                          }}
                          className={cn(
                            "grid grid-cols-[auto_1fr] gap-2 text-[11px] text-muted-foreground",
                            "cursor-pointer hover:text-[color:var(--primary)]",
                          )}
                        >
                          <span className="mt-1.5 size-1 rounded-full bg-[color:var(--border)]" />
                          <span>{sq.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {sections.length === 0 ? (
        <div className="py-8 text-center text-body-sm italic text-muted-foreground">
          No questions in this guide
        </div>
      ) : null}
    </div>
  )
}

export { ModeratorGuidePanel }
export type {
  ModeratorGuidePanelProps,
  GuideSection,
  GuideQuestion,
  GuideSubQuestion,
}
// Created by Swapnil Bapat © 2026
