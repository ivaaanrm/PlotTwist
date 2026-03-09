import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Compass, Star, Users } from "lucide-react"

import { MoviePoster } from "@/components/Common/MoviePoster"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MovieDomainService,
  type FeedItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import { formatRating, formatRelativeTime } from "@/lib/media"
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

function FeedCard({ item }: { item: FeedItemPublic }) {
  const user = item.user
  const ci = item.collection_item
  const media = ci.media
  const displayName = user.full_name || user.email
  const rating = formatRating(ci.rating)
  const relativeTime = formatRelativeTime(ci.created_at)

  return (
    <article
      id={`feed-item-${ci.id}`}
      className="group flex rounded-xl border bg-card overflow-hidden h-28 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20"
    >
      {/* Poster */}
      <div className="w-20 shrink-0 bg-muted/30">
        <MoviePoster posterPath={media?.poster_path} title={media?.title ?? "Movie"} />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {media?.title ?? "Untitled"}
            </h3>
            {rating && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="size-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {rating}
                </span>
              </div>
            )}
          </div>
          {media?.overview && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
              {media.overview}
            </p>
          )}
        </div>

        {/* Bottom: user + time */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="size-5">
              <AvatarFallback className="text-[8px] font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate">
              {displayName}
            </span>
          </div>
          {relativeTime && (
            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap shrink-0">
              {relativeTime}
            </span>
          )}
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
          className="flex rounded-xl border bg-card overflow-hidden h-28"
        >
          <Skeleton className="w-20 h-full rounded-none" />
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-3 w-20" />
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
            <FeedCard key={item.collection_item.id} item={item} />
          ))}
          {feedQuery.data && feedQuery.data.count > feedItems.length && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing {feedItems.length} of {feedQuery.data.count} items
            </p>
          )}
        </div>
      )}
    </div>
  )
}
