import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Compass, Star, Users } from "lucide-react"
import { useState } from "react"

import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MovieDomainService,
  type FeedItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import { formatRating, formatRelativeTime, formatTmdbRating } from "@/lib/media"
import { getInitials } from "@/utils"

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
      className="group flex rounded-xl border bg-card overflow-hidden h-[88px] transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20 cursor-pointer select-none"
    >
      {/* Poster */}
      <div className="w-[62px] shrink-0 bg-muted/30">
        <MoviePoster
          posterPath={media?.poster_path}
          title={media?.title ?? "Movie"}
        />
      </div>

      {/* Info — middle section */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
        <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {media?.title ?? "Untitled"}
        </h3>
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="size-4 shrink-0">
            <AvatarFallback className="text-[7px] font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate">
            {displayName}
          </span>
        </div>
        {watchedDate && (
          <span className="text-[10px] text-muted-foreground/60 leading-none">
            {watchedDate}
          </span>
        )}
      </div>

      {/* Ratings — right side */}
      <div className="flex items-center gap-3 pr-4 shrink-0">
        {userRating && (
          <div className="flex flex-col items-center gap-0.5">
            <Star className="size-4 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
            <span className="text-base font-bold text-amber-600 dark:text-amber-400 leading-none">
              {userRating}
            </span>
            <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide">You</span>
          </div>
        )}
        {tmdbRating && (
          <div className="flex flex-col items-center gap-0.5">
            <Star className="size-4 text-muted-foreground/50" />
            <span className="text-base font-semibold text-muted-foreground leading-none">
              {tmdbRating}
            </span>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">TMDB</span>
          </div>
        )}
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
          className="flex rounded-xl border bg-card overflow-hidden h-[88px]"
        >
          <Skeleton className="w-[62px] h-full rounded-none" />
          <div className="flex-1 px-3 py-2.5 flex flex-col justify-center gap-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-3 pr-4">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-5 w-7" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-5 w-7" />
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
  const [selectedItem, setSelectedItem] = useState<FeedItemPublic | null>(null)

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: () => MovieDomainService.getFeed({ skip: 0, limit: 50 }),
    enabled: Boolean(currentUser),
  })

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
          {feedItems.map((item) => (
            <FeedCard
              key={item.collection_item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
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
