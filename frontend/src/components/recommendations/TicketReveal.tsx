import type { CollectionPublic } from "@/features/movie-domain/api"
import type { RecommendationTicket } from "@/features/recommendations/api"
import { TicketCard } from "./TicketCard"

type Props = {
  tickets: RecommendationTicket[]
  onRestart: () => void
  watchlistByTmdbId: Map<number, string>
  watchedByTmdbId: Map<number, string>
  collections: CollectionPublic[]
  onAddToWatchlist: (tmdbId: number, mediaType: "movie" | "series") => void
  onAddToCollection: (
    collectionId: string,
    tmdbId: number,
    mediaType: "movie" | "series",
  ) => void
  isActionLoading: boolean
  actionTmdbId: number | null
  onSelectTicket: (ticket: RecommendationTicket) => void
}

export function TicketReveal({
  tickets,
  onRestart,
  watchlistByTmdbId,
  watchedByTmdbId,
  collections,
  onAddToWatchlist,
  onAddToCollection,
  isActionLoading,
  actionTmdbId,
  onSelectTicket,
}: Props) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto px-4 pb-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Your picks are ready 🎬</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Curated just for you based on your answers
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {tickets.map((ticket, i) => (
          <TicketCard
            key={ticket.tmdb_id}
            ticket={ticket}
            style={{
              animationDelay: `${i * 150}ms`,
              animationFillMode: "both",
            }}
            isInWatchlist={watchlistByTmdbId.has(ticket.tmdb_id)}
            isWatched={watchedByTmdbId.has(ticket.tmdb_id)}
            collections={collections}
            onAddToWatchlist={() =>
              onAddToWatchlist(ticket.tmdb_id, ticket.media_type)
            }
            onAddToCollection={(colId) =>
              onAddToCollection(colId, ticket.tmdb_id, ticket.media_type)
            }
            isActionLoading={isActionLoading && actionTmdbId === ticket.tmdb_id}
            onSelectTicket={() => onSelectTicket(ticket)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors mx-auto"
      >
        Start over
      </button>
    </div>
  )
}
