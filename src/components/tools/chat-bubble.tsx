"use client"

import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ChatBubble — presentational message bubble used on the simulate page.
 *
 * Supports:
 *   - interviewer ("user") turns, anchored right, solid ink bubble
 *   - participant ("persona") turns, anchored left, white bubble with avatar
 *   - focus-group persona labels via `archetypeName` + `archetypeColor`
 *   - a shared user image (imageBase64)
 *   - typing flag (caller swaps `children` to a typewriter while true)
 *   - optional feedback slot rendered below the content
 */
type ChatBubbleRole = "user" | "persona"

interface ChatBubbleProps {
  role: ChatBubbleRole
  /** Message content — usually a string but can be a ReactNode (highlighted spans) */
  content: React.ReactNode
  /** Optional image the user attached to their message */
  imageBase64?: string | null
  /** Focus-group persona label (e.g. "The Self-Blamer") */
  archetypeName?: string | null
  /** Tailwind class expression for the persona's accent (text-*) */
  archetypeColor?: string | null
  /** Background class for the persona avatar (e.g. "bg-violet-500") */
  avatarClassName?: string | null
  /** Text color class for the persona avatar initial */
  avatarTextClassName?: string | null
  /** Initial drawn inside the persona avatar. Defaults to "P". */
  initial?: string
  /** Time label underneath the bubble (HH:MM:SS). Optional. */
  timestamp?: string | null
  /** When true, the caller is animating the content — hide hover feedback slot. */
  typing?: boolean
  /** Optional node (usually <AIFeedback />) rendered in a hover-revealed footer. */
  feedbackSlot?: React.ReactNode
  /** Stable DOM id — e.g. `chat-bubble-${messageId}` */
  id?: string
  className?: string
}

function ChatBubble({
  role,
  content,
  imageBase64,
  archetypeName,
  archetypeColor,
  avatarClassName,
  avatarTextClassName,
  initial = "P",
  timestamp,
  typing = false,
  feedbackSlot,
  id,
  className,
}: ChatBubbleProps) {
  if (role === "user") {
    return (
      <div className={cn("flex items-end justify-end gap-2.5", className)}>
        <div className="flex max-w-[78%] flex-col items-end gap-1">
          <div
            id={id}
            className={cn(
              "px-4 py-2.5 text-body-sm leading-relaxed text-white",
              "rounded-[var(--radius-chat)] rounded-br-[4px]",
              "bg-[color:var(--ink)] shadow-card",
            )}
          >
            {imageBase64 ? (
              <img
                src={imageBase64}
                alt="Shared image"
                className="mb-2 max-h-[240px] max-w-full rounded-[var(--radius-md2)] object-contain"
              />
            ) : null}
            {content}
          </div>
          {timestamp ? (
            <span className="mr-1.5 font-mono text-[10.5px] text-muted-foreground">
              {timestamp}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-[30px] shrink-0 items-center justify-center rounded-full",
            "bg-[color:var(--surface)] text-[color:var(--ink-secondary)] shadow-outline-ring",
          )}
        >
          <User className="size-3.5" strokeWidth={1.5} />
        </div>
      </div>
    )
  }

  // persona bubble
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <div
        className={cn(
          "flex size-[30px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
          "shadow-inset-edge",
          avatarClassName ?? "bg-[color:var(--surface-muted)]",
          avatarTextClassName ?? "text-[color:var(--ink-secondary)]",
        )}
      >
        {initial || "P"}
      </div>
      <div className="flex max-w-[78%] flex-1 flex-col items-start gap-1">
        <div
          id={id}
          className={cn(
            "group/message relative px-4 py-3 text-body-sm leading-relaxed",
            "rounded-[var(--radius-chat)] rounded-tl-[4px]",
            "bg-[color:var(--surface)] text-foreground shadow-outline-ring",
          )}
        >
          {archetypeName ? (
            <p
              className={cn(
                "mb-1 text-[10px] font-bold uppercase tracking-wider",
                archetypeColor ?? "text-muted-foreground",
              )}
            >
              {archetypeName}
            </p>
          ) : null}
          <div>{content}</div>
          {feedbackSlot && !typing ? (
            <div
              className={cn(
                "mt-2 border-t border-[color:var(--border-subtle)] pt-2",
                "opacity-0 transition-opacity group-hover/message:opacity-100",
              )}
            >
              {feedbackSlot}
            </div>
          ) : null}
        </div>
        {timestamp ? (
          <span className="ml-1.5 font-mono text-[10.5px] text-muted-foreground">
            {timestamp}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export { ChatBubble }
export type { ChatBubbleProps, ChatBubbleRole }
// Created by Swapnil Bapat © 2026
