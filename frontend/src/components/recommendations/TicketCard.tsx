import { Check, Clock, FolderPlus, Plus, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingButton } from "@/components/ui/loading-button"
import type { CollectionPublic } from "@/features/movie-domain/api"
import type { RecommendationTicket } from "@/features/recommendations/api"
import { getPosterUrl } from "@/features/recommendations/api"

type Props = {
  ticket: RecommendationTicket
  style?: React.CSSProperties
  isInWatchlist?: boolean
  isWatched?: boolean
  collections?: CollectionPublic[]
  onAddToWatchlist?: () => void
  onAddToCollection?: (collectionId: string) => void
  isActionLoading?: boolean
  onSelectTicket?: () => void
}

export function TicketCard({
  ticket,
  style,
  isInWatchlist,
  isWatched,
  collections = [],
  onAddToWatchlist,
  onAddToCollection,
  isActionLoading,
  onSelectTicket,
}: Props) {
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
      <div
        role="button"
        tabIndex={0}
        onClick={onSelectTicket}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelectTicket?.()
          }
        }}
        className="flex gap-0 group cursor-pointer hover:bg-muted/30 transition-colors"
      >
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
            <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
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
              <Badge
                key={g}
                variant="secondary"
                className="text-xs px-1.5 py-0"
              >
                {g}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
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

      {/* Bottom half: reason + actions */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-5">
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          "{ticket.reason}"
        </p>

        <div className="flex items-center gap-2 mt-1">
          <LoadingButton
            variant="outline"
            size="sm"
            loading={isActionLoading && !collections.length} // crude approximation
            disabled={isInWatchlist || isWatched || isActionLoading}
            onClick={onAddToWatchlist}
            className="flex-1 rounded-full text-[11px] h-8"
          >
            {isInWatchlist ? (
              <>
                <Clock className="size-3.5 mr-1" />
                In Watchlist
              </>
            ) : isWatched ? (
              <>
                <Check className="size-3.5 mr-1" />
                Watched
              </>
            ) : (
              <>
                <Plus className="size-3.5 mr-1" />
                Watchlist
              </>
            )}
          </LoadingButton>

          {collections.length > 0 && onAddToCollection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full h-8 w-10 p-0 shrink-0"
                  title="Add to collection"
                  disabled={isActionLoading}
                >
                  <FolderPlus className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {collections.map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => onAddToCollection(col.id)}
                  >
                    {col.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
