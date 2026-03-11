import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  onStart: () => void
  isLoading: boolean
}

export function WelcomeScreen({ onStart, isLoading }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center size-20 rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">For You</h1>
          <p className="text-muted-foreground text-lg max-w-sm">
            Answer a few quick questions and get 3 hand-picked recommendations
            from your personal AI curator.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-bold shrink-0">
            1
          </span>
          <span>Answer 4–6 quick questions</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-bold shrink-0">
            2
          </span>
          <span>AI picks 3 titles just for you</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-bold shrink-0">
            3
          </span>
          <span>Get your tickets and start watching</span>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onStart}
        disabled={isLoading}
        className="gap-2 px-8"
      >
        {isLoading ? (
          <>Loading…</>
        ) : (
          <>
            <Sparkles className="size-4" />
            Get My Picks
          </>
        )}
      </Button>
    </div>
  )
}
