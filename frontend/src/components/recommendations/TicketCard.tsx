import { Clock, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { RecommendationTicket } from "@/features/recommendations/api"
import { getPosterUrl } from "@/features/recommendations/api"

// Deterministic barcode-like pattern from tmdb_id
function Barcode({ seed }: { seed: number }) {
  const bars: number[] = []
  let s = seed
  for (let i = 0; i < 30; i++) {
    s = ((s * 1103515245 + 12345) & 0x7fffffff) % 1000
    bars.push(s)
  }
  return (
    <svg
      width="120"
      height="32"
      viewBox="0 0 120 32"
      className="opacity-40"
      aria-hidden
    >
      {bars.map((v, i) => (
        <rect
          key={i}
          x={i * 4}
          y={0}
          width={v < 500 ? 2 : 1}
          height={v < 250 ? 32 : 20}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

type Props = {
  ticket: RecommendationTicket
  style?: React.CSSProperties
}

export function TicketCard({ ticket, style }: Props) {
  const posterUrl = getPosterUrl(ticket.poster_path)
  const ratingDisplay = ticket.tmdb_rating
    ? ticket.tmdb_rating.toFixed(1)
    : null
  const runtime = ticket.runtime_minutes
    ? `${Math.floor(ticket.runtime_minutes / 60)}h ${ticket.runtime_minutes % 60}m`
    : null

  return (
    <div
      style={style}
      className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border bg-card shadow-md animate-in fade-in slide-in-from-bottom-6 duration-500"
    >
      {/* Top half: poster + metadata */}
      <div className="flex gap-0">
        {/* Poster */}
        <div className="w-28 shrink-0 bg-muted">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={ticket.title}
              className="w-full h-full object-cover"
              style={{ minHeight: 168 }}
            />
          ) : (
            <div className="w-full h-42 bg-muted flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-2 p-4">
          <div>
            <h3 className="font-bold text-base leading-tight line-clamp-2">
              {ticket.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {ticket.year && <span>{ticket.year}</span>}
              {runtime && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {runtime}
                  </span>
                </>
              )}
            </div>
          </div>

          {ratingDisplay && (
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="size-3.5 fill-amber-500" />
              {ratingDisplay}
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-auto">
            {ticket.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-xs px-1.5 py-0">
                {g}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 capitalize"
            >
              {ticket.media_type === "series" ? "Series" : "Movie"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="relative flex items-center px-3 h-0">
        <div className="absolute -left-3 size-6 rounded-full bg-background border border-border z-10" />
        <div className="absolute -right-3 size-6 rounded-full bg-background border border-border z-10" />
        <div className="w-full border-t-2 border-dashed border-border" />
      </div>

      {/* Bottom half: barcode + reason */}
      <div className="flex flex-col gap-2 px-4 pt-5 pb-4">
        <Barcode seed={ticket.tmdb_id} />
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          {ticket.reason}
        </p>
      </div>
    </div>
  )
}
