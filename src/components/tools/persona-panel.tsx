import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PersonaPanel — archetype/persona profile display.
 *
 * Renders:
 *   • header with name, kicker ("quote-y subtitle"), and up to 3 demographic
 *     tags (age range, occupation, living setup, etc.)
 *   • description paragraph (muted-foreground)
 *   • a tinted "Their Lived Experience" block when present
 *   • a 2-column grid of bullet lists — Influences, Behaviours, Barriers,
 *     Motivations, Goals, Habits
 *   • a tinted "The Spiral" block (pattern + avoidance)
 *
 * Every list / block is optional — if the data is missing or empty the section
 * is suppressed. No state, no fetch: purely presentational.
 */

interface PersonaSpiral {
  pattern?: string | null
  avoidance?: string | null
}

interface PersonaDemographics {
  ageRange?: string | null
  occupation?: string | null
  livingSetup?: string | null
  /** Any extra tags — rendered after the named three. */
  extras?: string[]
}

interface PersonaLike {
  name: string
  kicker?: string | null
  description?: string | null
  demographics?: PersonaDemographics | null
  livedExperience?: string | null
  influences?: string[]
  behaviours?: string[]
  barriers?: string[]
  motivations?: string[]
  goals?: string[]
  habits?: string[]
  spiral?: PersonaSpiral | null
}

interface PersonaPanelProps {
  persona: PersonaLike
  /** Tailwind class for section heading colour (e.g. "text-violet-700"). */
  accentClassName?: string
  /** Tailwind class for tinted block background (e.g. "bg-violet-50"). */
  tintClassName?: string
  /** Tailwind class for tinted block border (e.g. "border-violet-100"). */
  tintBorderClassName?: string
  className?: string
}

function BulletList({
  items,
  accentClassName,
}: {
  items: string[]
  accentClassName?: string
}) {
  if (!items || items.length === 0) return null
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-[13px] leading-relaxed text-muted-foreground"
        >
          <span
            className={cn(
              "mt-[7px] size-1.5 shrink-0 rounded-full",
              accentClassName ?? "bg-[color:var(--primary)]",
            )}
          />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function SectionCard({
  title,
  accentClassName,
  children,
}: {
  title: string
  accentClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-[color:var(--border-subtle)]",
        "bg-[color:var(--surface)] p-5 shadow-outline-ring",
      )}
    >
      <h3
        className={cn(
          "mb-4 text-sm font-bold",
          accentClassName ?? "text-foreground",
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function PersonaPanel({
  persona,
  accentClassName,
  tintClassName,
  tintBorderClassName,
  className,
}: PersonaPanelProps) {
  const {
    name,
    kicker,
    description,
    demographics,
    livedExperience,
    influences = [],
    behaviours = [],
    barriers = [],
    motivations = [],
    goals = [],
    habits = [],
    spiral,
  } = persona

  const tagList = [
    demographics?.ageRange,
    demographics?.occupation,
    demographics?.livingSetup,
    ...(demographics?.extras ?? []),
  ].filter((t): t is string => typeof t === "string" && t.length > 0)

  const accent = accentClassName ?? "text-foreground"
  const tintBg = tintClassName ?? "bg-[color:var(--primary-soft)]"
  const tintBorder =
    tintBorderClassName ?? "border-[color:var(--primary-soft)]"

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div>
        <h1
          className={cn(
            "text-display-1 tracking-tight",
            accent,
          )}
        >
          {name}
        </h1>
        {kicker ? (
          <p className="mt-2 text-body-sm italic leading-relaxed text-[color:var(--ink-secondary)]">
            &ldquo;{kicker}&rdquo;
          </p>
        ) : null}

        {description ? (
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        {tagList.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tagList.map((t) => (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1",
                  "border-[color:var(--border)] bg-[color:var(--surface-muted)]",
                  "text-caption font-medium text-muted-foreground",
                )}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[color:var(--border-subtle)]" />

      <div className="grid gap-4 md:grid-cols-2">
        {influences.length > 0 ? (
          <SectionCard title="Influences" accentClassName={accent}>
            <BulletList items={influences} accentClassName={tintBg} />
          </SectionCard>
        ) : null}

        {behaviours.length > 0 ? (
          <SectionCard title="Behaviours" accentClassName={accent}>
            <BulletList items={behaviours} accentClassName={tintBg} />
          </SectionCard>
        ) : null}

        {barriers.length > 0 ? (
          <SectionCard title="Barriers" accentClassName={accent}>
            <BulletList items={barriers} accentClassName={tintBg} />
          </SectionCard>
        ) : null}

        {motivations.length > 0 ? (
          <SectionCard title="Motivations" accentClassName={accent}>
            <BulletList items={motivations} accentClassName={tintBg} />
          </SectionCard>
        ) : null}

        {livedExperience ? (
          <div
            className={cn(
              "rounded-[14px] border p-5",
              tintBg,
              tintBorder,
            )}
          >
            <h3 className={cn("mb-3 text-sm font-bold", accent)}>
              Their Lived Experience
            </h3>
            <p className="text-[13px] leading-relaxed text-foreground">
              {livedExperience}
            </p>
          </div>
        ) : null}

        {goals.length > 0 ? (
          <SectionCard title="Goals" accentClassName={accent}>
            <BulletList items={goals} accentClassName={tintBg} />
          </SectionCard>
        ) : null}

        {habits.length > 0 ? (
          <SectionCard title="Habits" accentClassName={accent}>
            <BulletList items={habits} accentClassName={tintBg} />
          </SectionCard>
        ) : null}

        {spiral && (spiral.pattern || spiral.avoidance) ? (
          <div
            className={cn(
              "rounded-[14px] border p-5",
              tintBg,
              tintBorder,
            )}
          >
            <h3 className={cn("mb-3 text-sm font-bold", accent)}>
              The Spiral
            </h3>
            {spiral.pattern ? (
              <p className="mb-4 text-[13px] font-medium leading-relaxed text-foreground">
                {spiral.pattern}
              </p>
            ) : null}
            {spiral.avoidance ? (
              <div>
                <p className="mb-2 text-caption font-bold uppercase tracking-wider text-muted-foreground">
                  How They Avoid It:
                </p>
                <p className="text-[13px] leading-relaxed text-foreground">
                  {spiral.avoidance}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { PersonaPanel }
export type {
  PersonaPanelProps,
  PersonaLike,
  PersonaDemographics,
  PersonaSpiral,
}
// Created by Swapnil Bapat © 2026
