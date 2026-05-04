"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function KBError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => console.error(error), [error])

  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<AlertTriangle />}
        title="Failed to load knowledge base"
        description="Unable to fetch documents. Please refresh and try again."
        action={<Button onClick={reset}>Retry</Button>}
      />
    </div>
  )
}
