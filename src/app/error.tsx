"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function AppError({
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
        title="Something went wrong"
        description={
          error.message
            ? `We hit an error: ${error.message}`
            : "An unexpected error occurred. Please try again."
        }
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">Back to dashboard</a>
            </Button>
          </>
        }
      />
    </div>
  )
}
