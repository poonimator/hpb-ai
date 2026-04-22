import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<FileQuestion />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
