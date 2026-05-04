import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function SubProjectNotFound() {
  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<FileQuestion />}
        title="Workspace not found"
        description="This workspace doesn't exist or you no longer have access. It may have been deleted from its parent project."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
