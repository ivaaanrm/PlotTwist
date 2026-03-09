import { Clapperboard } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-4 px-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clapperboard className="size-4" />
          <span>PlotTwist &copy; {currentYear}</span>
        </div>
      </div>
    </footer>
  )
}
