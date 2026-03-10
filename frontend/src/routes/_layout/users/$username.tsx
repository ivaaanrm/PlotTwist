import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Film, Lock, Star } from "lucide-react"
import { useState } from "react"
import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type FeedItemPublic,
  MovieDomainService,
  type WatchedMoviePublic,
  type WatchlistItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate, formatRating, formatTmdbRating } from "@/lib/media"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/users/$username")({
  component: UserProfilePage,
})

function UserProfileSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="relative">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="flex items-end gap-3 -mt-10 px-1">
          <Skeleton className="size-20 rounded-full shrink-0 ring-4 ring-background" />
          <div className="mb-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 rounded-2xl bg-muted/40 p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
    </div>
  )
}

function ReadonlyWatchedItem({
  item,
  onClick,
}: {
  item: WatchedMoviePublic
  onClick: () => void
}) {
  const movie = item.movie
  const userRating = formatRating(item.rating)
  const tmdbRating = formatTmdbRating(movie?.tmdb_rating)
  const date = formatDate(item.watched_at)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative cursor-pointer select-none outline-none touch-manipulation transition-transform duration-200 active:scale-[0.98]"
    >
      <article className="ticket-card relative z-10 flex bg-card dark:bg-[#25252d] text-card-foreground overflow-hidden h-[100px] transition-shadow duration-200 ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:ring-primary/40 dark:group-hover:ring-primary/40">
        <div className="w-[68px] shrink-0 relative z-10">
          <div className="h-full bg-muted">
            <MoviePoster
              posterPath={movie?.poster_path}
              title={movie?.title ?? "Movie"}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5 relative z-10">
          <h3 className="font-semibold text-[13px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {movie?.title ?? "Untitled"}
          </h3>
          {date && (
            <span className="text-[10px] text-muted-foreground leading-none">
              Watched {date}
            </span>
          )}
        </div>
        <div className="w-px self-stretch my-2 border-l border-dashed border-border/60 relative z-10" />
        <div className="flex items-center gap-2.5 px-3 shrink-0 relative z-10">
          {userRating && (
            <div className="flex flex-col items-center gap-0.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-[15px] font-bold text-amber-400 leading-none">
                {userRating}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">
                YOU
              </span>
            </div>
          )}
          {tmdbRating && (
            <div className="flex flex-col items-center gap-0.5">
              <Star className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold text-card-foreground leading-none">
                {tmdbRating}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">
                TMDB
              </span>
            </div>
          )}
          <div
            className="flex gap-[1.5px] items-center rotate-90 opacity-20 ml-0.5"
            aria-hidden="true"
          >
            {[3, 1.5, 3, 1, 2, 1.5, 3, 1, 2, 3, 1.5, 1].map((w, i) => (
              <div
                key={i}
                className="bg-current rounded-full"
                style={{ width: `${w}px`, height: "18px" }}
              />
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}

function ReadonlyWatchlistItem({
  item,
  onClick,
}: {
  item: WatchlistItemPublic
  onClick: () => void
}) {
  const movie = item.movie
  const tmdbRating = formatTmdbRating(movie?.tmdb_rating)
  const date = formatDate(item.added_at)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative cursor-pointer select-none outline-none touch-manipulation transition-transform duration-200 active:scale-[0.98]"
    >
      <article className="ticket-card relative z-10 flex bg-card dark:bg-[#25252d] text-card-foreground overflow-hidden h-[100px] transition-shadow duration-200 ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:ring-primary/40 dark:group-hover:ring-primary/40">
        <div className="w-[68px] shrink-0 relative z-10">
          <div className="h-full bg-muted">
            <MoviePoster
              posterPath={movie?.poster_path}
              title={movie?.title ?? "Movie"}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5 relative z-10">
          <h3 className="font-semibold text-[13px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {movie?.title ?? "Untitled"}
          </h3>
          {date && (
            <span className="text-[10px] text-muted-foreground leading-none">
              Added {date}
            </span>
          )}
        </div>
        <div className="w-px self-stretch my-2 border-l border-dashed border-border/60 relative z-10" />
        <div className="flex items-center gap-2.5 px-3 shrink-0 relative z-10">
          {tmdbRating && (
            <div className="flex flex-col items-center gap-0.5">
              <Star className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold text-card-foreground leading-none">
                {tmdbRating}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">
                TMDB
              </span>
            </div>
          )}
          <div
            className="flex gap-[1.5px] items-center rotate-90 opacity-20 ml-0.5"
            aria-hidden="true"
          >
            {[3, 1.5, 3, 1, 2, 1.5, 3, 1, 2, 3, 1.5, 1].map((w, i) => (
              <div
                key={i}
                className="bg-current rounded-full"
                style={{ width: `${w}px`, height: "18px" }}
              />
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}

function FollowButton({
  userId,
  followStatus,
  onStatusChange,
}: {
  userId: string
  followStatus: "none" | "pending" | "accepted"
  onStatusChange: () => void
}) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const followMutation = useMutation({
    mutationFn: () => MovieDomainService.sendFollowRequest({ userId }),
    onSuccess: () => {
      showSuccessToast("Follow request sent")
      onStatusChange()
      queryClient.invalidateQueries({ queryKey: ["followStatus", userId] })
    },
    onError: handleError.bind(showErrorToast),
  })

  const unfollowMutation = useMutation({
    mutationFn: () => MovieDomainService.unfollowUser({ userId }),
    onSuccess: () => {
      showSuccessToast("Unfollowed")
      onStatusChange()
      queryClient.invalidateQueries({ queryKey: ["followStatus", userId] })
    },
    onError: handleError.bind(showErrorToast),
  })

  if (followStatus === "accepted") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => unfollowMutation.mutate()}
        disabled={unfollowMutation.isPending}
      >
        Following
      </Button>
    )
  }

  if (followStatus === "pending") {
    return (
      <Button variant="secondary" size="sm" disabled>
        Requested
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={() => followMutation.mutate()}
      disabled={followMutation.isPending}
    >
      Follow
    </Button>
  )
}

function UserProfilePage() {
  const { username } = Route.useParams()
  const { user: currentUser } = useAuth()
  const [selectedItem, setSelectedItem] = useState<FeedItemPublic | null>(null)

  // Redirect to own profile
  if (currentUser && username === currentUser.username) {
    throw redirect({ to: "/profile" })
  }

  const userQuery = useQuery({
    queryKey: ["user", username],
    queryFn: () => MovieDomainService.readUserByUsername({ username }),
  })

  const profileQuery = useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => MovieDomainService.getUserProfileByUsername({ username }),
    retry: false,
  })

  const userId = userQuery.data?.id ?? ""

  const followStatusQuery = useQuery({
    queryKey: ["followStatus", username],
    queryFn: () => MovieDomainService.getFollowStatus({ userId }),
    enabled: Boolean(currentUser) && Boolean(userId),
  })

  if (userQuery.isLoading) {
    return <UserProfileSkeleton />
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        User not found.
      </div>
    )
  }

  const user = userQuery.data
  const displayName = user.full_name || user.username
  const followStatus: "none" | "pending" | "accepted" =
    followStatusQuery.data?.status === "accepted"
      ? "accepted"
      : followStatusQuery.data?.status === "pending"
        ? "pending"
        : "none"

  const isProfileVisible = profileQuery.data !== undefined && !profileQuery.isError
  const profile = profileQuery.data

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="relative">
        <div className="h-20 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-muted/30 dark:from-primary/20 dark:via-primary/8 dark:to-muted/20" />
        <div className="flex items-end gap-3 -mt-10 px-1">
          <UserAvatar
            avatarId={user.avatar}
            displayName={displayName}
            className="size-20 shrink-0 ring-4 ring-background shadow-sm"
            iconSizeClass="size-8"
          />
          <div className="mb-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
              {!followStatusQuery.isLoading && userId && (
                <FollowButton
                  userId={userId}
                  followStatus={followStatus}
                  onStatusChange={() =>
                    followStatusQuery.refetch()
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {profile && (
        <div className="grid grid-cols-2 rounded-2xl bg-muted/40 py-3">
          <div className="flex flex-col items-center gap-0.5 border-r border-border/40">
            <span className="text-lg font-bold leading-none">
              {profile.watched_count}
            </span>
            <span className="text-[11px] text-muted-foreground">Movies</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold leading-none">
              {profile.average_rating != null
                ? profile.average_rating.toFixed(1)
                : "—"}
            </span>
            <span className="text-[11px] text-muted-foreground">Avg Rating</span>
          </div>
        </div>
      )}

      {/* Locked state */}
      {!isProfileVisible && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
            <Lock className="size-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium">This account is private</p>
          <p className="text-xs text-muted-foreground">
            Follow this account to see their movies and watchlist.
          </p>
        </div>
      )}

      {/* Full profile */}
      {isProfileVisible && profile && (
        <Tabs defaultValue="watched" className="gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="watched" className="flex-1">
              Watched ({profile.watched_movies.length})
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex-1">
              Watchlist ({profile.watchlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watched" className="space-y-2">
            {profile.watched_movies.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
                  <Film className="size-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground">No watched movies yet.</p>
              </div>
            ) : (
              profile.watched_movies.map((item) => (
                <ReadonlyWatchedItem
                  key={item.id}
                  item={item}
                  onClick={() =>
                    setSelectedItem({
                      id: item.id,
                      user,
                      collection_item: {
                        id: item.id,
                        media_id: item.movie_id,
                        user_id: item.user_id,
                        rating: item.rating,
                        created_at: item.watched_at,
                        updated_at: item.watched_at,
                        media: item.movie,
                      },
                    } as unknown as FeedItemPublic)
                  }
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-2">
            {profile.watchlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
                  <Film className="size-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground">Watchlist is empty.</p>
              </div>
            ) : (
              profile.watchlist.map((item) => (
                <ReadonlyWatchlistItem
                  key={item.id}
                  item={item}
                  onClick={() =>
                    setSelectedItem({
                      id: item.id,
                      user,
                      collection_item: {
                        id: item.id,
                        media_id: item.movie_id,
                        user_id: item.user_id,
                        rating: null,
                        created_at: item.added_at,
                        updated_at: item.added_at,
                        media: item.movie,
                      },
                    } as unknown as FeedItemPublic)
                  }
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

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
