"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function SubProjectError({
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
        title="Couldn't load this workspace"
        description="We hit an error while fetching the workspace contents. Try again, or head back to the project view."
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </>
        }
      />
    </div>
  )
}
