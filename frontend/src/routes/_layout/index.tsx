import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Compass, Star, Users } from "lucide-react"
import { useMemo, useState } from "react"

import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { SwipeableFeedCard } from "@/components/Common/SwipeableFeedCard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MovieDomainService,
  type FeedItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { formatRating, formatRelativeTime, formatTmdbRating } from "@/lib/media"
import { getInitials, handleError } from "@/utils"

export const Route = createFileRoute("/_layout/")({
  component: Home,
  head: () => ({
    meta: [
      {
        title: "Home - PlotTwist",
      },
    ],
  }),
})

function FeedCard({
  item,
  onClick,
}: {
  item: FeedItemPublic
  onClick: () => void
}) {
  const user = item.user
  const ci = item.collection_item
  const media = ci.media
  const displayName = user.full_name || user.email
  const userRating = formatRating(ci.rating)
  const tmdbRating = formatTmdbRating(media?.tmdb_rating)
  const watchedDate = formatRelativeTime(ci.created_at)

  return (
    <article
      id={`feed-item-${ci.id}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="ticket-card group flex bg-[#1e1e24] dark:bg-[#1e1e24] text-white overflow-hidden h-[100px] transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:brightness-110 active:scale-[0.98] active:brightness-95 cursor-pointer select-none relative"
    >
      {/* Poster */}
      <div className="w-[68px] shrink-0 p-1.5 pl-3">
        <div className="h-full rounded-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
          <MoviePoster
            posterPath={media?.poster_path}
            title={media?.title ?? "Movie"}
          />
        </div>
      </div>

      {/* Main ticket body — middle */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
        <h3 className="font-semibold text-[13px] leading-snug line-clamp-1 text-white group-hover:text-amber-400 transition-colors">
          {media?.title ?? "Untitled"}
        </h3>
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="size-4 shrink-0">
            <AvatarFallback className="text-[7px] font-semibold bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-gray-400 truncate">
            {displayName}
          </span>
        </div>
        {watchedDate && (
          <span className="text-[10px] text-gray-500 pl-[22px]">
            {watchedDate}
          </span>
        )}
      </div>

      {/* Dashed divider — tear-off line */}
      <div className="w-px self-stretch my-2 border-l border-dashed border-gray-600/50" />

      {/* Ticket stub — ratings */}
      <div className="flex items-center gap-2.5 px-3 shrink-0">
        {userRating && (
          <div className="flex flex-col items-center gap-0.5">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="text-[15px] font-bold text-amber-400 leading-none">
              {userRating}
            </span>
            <span className="text-[8px] text-gray-600 uppercase tracking-widest font-medium">YOU</span>
          </div>
        )}
        {tmdbRating && (
          <div className="flex flex-col items-center gap-0.5">
            <Star className="size-4 text-gray-500" strokeWidth={1.5} />
            <span className="text-[15px] font-semibold text-gray-300 leading-none">
              {tmdbRating}
            </span>
            <span className="text-[8px] text-gray-600 uppercase tracking-widest font-medium">TMDB</span>
          </div>
        )}

        {/* Decorative barcode */}
        <div className="flex gap-[1.5px] items-center rotate-90 opacity-20 ml-0.5" aria-hidden="true">
          {[3, 1.5, 3, 1, 2, 1.5, 3, 1, 2, 3, 1.5, 1].map((w, i) => (
            <div
              key={i}
              className="bg-gray-400 rounded-full"
              style={{ width: `${w}px`, height: "18px" }}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="ticket-card flex bg-[#1e1e24] overflow-hidden h-[100px]"
        >
          <div className="w-[68px] shrink-0 p-1.5 pl-3">
            <Skeleton className="h-full rounded-md bg-gray-700/50" />
          </div>
          <div className="flex-1 px-3 py-2.5 flex flex-col justify-center gap-1.5">
            <Skeleton className="h-4 w-3/5 bg-gray-700/50" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-4 rounded-full bg-gray-700/50" />
              <Skeleton className="h-3 w-20 bg-gray-700/50" />
            </div>
          </div>
          <div className="w-px self-stretch my-2 border-l border-dashed border-gray-600/30" />
          <div className="flex items-center gap-3 px-3">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="size-4 rounded-full bg-gray-700/50" />
              <Skeleton className="h-4 w-7 bg-gray-700/50" />
              <Skeleton className="h-2 w-8 bg-gray-700/50" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="size-4 rounded-full bg-gray-700/50" />
              <Skeleton className="h-4 w-7 bg-gray-700/50" />
              <Skeleton className="h-2 w-8 bg-gray-700/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyFeedState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm">
        <Star className="size-7 text-primary/70" />
      </div>
      <h3 className="text-lg font-bold mb-1.5">Your feed is empty</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-7 leading-relaxed">
        Watch some movies or follow friends to see activity here.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button asChild size="lg" className="rounded-xl">
          <Link to="/discover">
            <Compass className="size-4" />
            Discover Movies
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="rounded-xl">
          <Link to="/social">
            <Users className="size-4" />
            Find Friends
          </Link>
        </Button>
      </div>
    </div>
  )
}

function Home() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [selectedItem, setSelectedItem] = useState<FeedItemPublic | null>(null)

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: () => MovieDomainService.getFeed({ skip: 0, limit: 50 }),
    enabled: Boolean(currentUser),
  })

  const watchlistQuery = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => MovieDomainService.listWatchlist({ skip: 0, limit: 200 }),
    enabled: Boolean(currentUser),
  })

  const watchlistTmdbIds = useMemo(() => {
    const ids = new Set<number>()
    for (const item of watchlistQuery.data?.data ?? []) {
      const tmdbId = item.movie?.tmdb_id ?? item.media?.tmdb_id
      if (typeof tmdbId === "number") ids.add(tmdbId)
    }
    return ids
  }, [watchlistQuery.data])

  const addToWatchlistMutation = useMutation({
    mutationFn: (payload: { tmdbId: number; mediaType: string }) =>
      MovieDomainService.addToWatchlist({
        tmdb_id: payload.tmdbId,
        media_type: payload.mediaType as "movie" | "series",
      }),
    onSuccess: () => showSuccessToast("Added to watchlist"),
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] })
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const handleAddToWatchlist = (tmdbId: number, mediaType: string) => {
    addToWatchlistMutation.mutate({ tmdbId, mediaType })
  }

  const feedItems = feedQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Welcome back
          {currentUser?.full_name ? `, ${currentUser.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          Recent activity from you and your friends
        </p>
      </div>

      {/* Feed */}
      {feedQuery.isLoading && <FeedSkeleton />}

      {feedQuery.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {feedQuery.error?.message || "Could not load your feed."}
        </div>
      )}

      {!feedQuery.isLoading && !feedQuery.isError && feedItems.length === 0 && (
        <EmptyFeedState />
      )}

      {!feedQuery.isLoading && !feedQuery.isError && feedItems.length > 0 && (
        <div className="space-y-3">
          {feedItems.map((item) => {
            const tmdbId = item.collection_item.media?.tmdb_id
            const mediaType = item.collection_item.media?.media_type ?? "movie"
            return (
              <SwipeableFeedCard
                key={item.collection_item.id}
                isInWatchlist={watchlistTmdbIds.has(tmdbId ?? -1)}
                onAddToWatchlist={() => {
                  if (tmdbId) handleAddToWatchlist(tmdbId, mediaType)
                }}
              >
                <FeedCard
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              </SwipeableFeedCard>
            )
          })}
          {feedQuery.data && feedQuery.data.count > feedItems.length && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing {feedItems.length} of {feedQuery.data.count} items
            </p>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <MediaDetailDialog
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        item={selectedItem}
      />
    </div>
  )
}
