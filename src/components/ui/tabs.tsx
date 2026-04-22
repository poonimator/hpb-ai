"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-end gap-1 w-full",
        "border-b border-[color:var(--border-subtle)]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "text-ui text-muted-foreground",
        "px-3 py-2.5",
        "transition-colors outline-none",
        "hover:text-foreground hover:bg-[color:var(--surface-muted)]/40 rounded-t-[6px]",
        "focus-visible:shadow-focus",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-foreground",
        "data-[state=active]:after:content-['']",
        "data-[state=active]:after:absolute data-[state=active]:after:left-3 data-[state=active]:after:right-3 data-[state=active]:after:-bottom-px",
        "data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[color:var(--primary)] data-[state=active]:after:rounded-full",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
// Created by Swapnil Bapat © 2026
