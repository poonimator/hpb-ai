import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function CenteredSpinner({
  className,
  label,
  size = 20,
  ...props
}: React.ComponentProps<"div"> & { label?: string; size?: number }) {
  return (
    <div
      data-slot="centered-spinner"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
      {...props}
    >
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      {label && <p className="text-caption">{label}</p>}
    </div>
  )
}

export { CenteredSpinner }
// Created by Swapnil Bapat © 2026
