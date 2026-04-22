import { CenteredSpinner } from "@/components/ui/centered-spinner"

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <CenteredSpinner />
    </div>
  )
}
