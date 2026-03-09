import { Film } from "lucide-react"
import { getPosterUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

type MoviePosterProps = {
  posterPath?: string | null
  title: string
  className?: string
}

export function MoviePoster({
  posterPath,
  title,
  className,
}: MoviePosterProps) {
  const posterUrl = getPosterUrl(posterPath)

  if (posterUrl) {
    return (
      <img
        src={posterUrl}
        alt={`${title} poster`}
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted/50",
        className,
      )}
    >
      <Film className="size-6 text-muted-foreground/30" />
    </div>
  )
}
