"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<AlertTriangle />}
        title="Failed to load projects"
        description="Unable to fetch your projects. Check your connection and try again."
        action={<Button onClick={reset}>Retry</Button>}
      />
    </div>
  )
}
