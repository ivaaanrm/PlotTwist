import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Camera, Film, LogOut, Settings, Star } from "lucide-react"
import { useMemo, useState } from "react"
import { AvatarPickerDialog } from "@/components/Common/AvatarPickerDialog"
import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { SwipeableDeleteCard } from "@/components/Common/SwipeableDeleteCard"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type FeedItemPublic,
  type FollowWithUserPublic,
  MovieDomainService,
  type WatchedMoviePublic,
  type WatchlistItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate, formatRating, formatTmdbRating } from "@/lib/media"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/profile")({
  component: Profile,
  head: () => ({
    meta: [
      {
        title: "Profile - PlotTwist",
      },
    ],
  }),
})

type WatchedSort = "date" | "title" | "rating"
type WatchlistSort = "date" | "title"

function SortPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "secondary" : "ghost"}
          size="sm"
          className="h-7 rounded-full text-xs px-3"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

function WatchedMovieItem({
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
              <Star
                className="size-4 text-muted-foreground"
                strokeWidth={1.5}
              />
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

function WatchlistMovieItem({
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
              <Star
                className="size-4 text-muted-foreground"
                strokeWidth={1.5}
              />
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

function EmptyListState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
        <Film className="size-6 text-muted-foreground/60" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Banner + avatar skeleton */}
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
      {/* Stats skeleton */}
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

function FollowUserRow({
  item,
  onNavigate,
}: {
  item: FollowWithUserPublic
  onNavigate: () => void
}) {
  const displayName = item.user.full_name || item.user.username
  return (
    <Link
      to="/users/$username"
      params={{ username: item.user.username }}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60 transition-colors"
    >
      <UserAvatar
        avatarId={item.user.avatar}
        displayName={displayName}
        className="size-10 shrink-0"
        iconSizeClass="size-4"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">@{item.user.username}</p>
      </div>
    </Link>
  )
}

function Profile() {
  const { user: currentUser, logout } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [watchedSort, setWatchedSort] = useState<WatchedSort>("date")
  const [watchlistSort, setWatchlistSort] = useState<WatchlistSort>("date")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<FeedItemPublic | null>(null)
  const [followersOpen, setFollowersOpen] = useState(false)
  const [followingOpen, setFollowingOpen] = useState(false)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  const profileQuery = useQuery({
    queryKey: ["profile", currentUser?.id],
    queryFn: () =>
      MovieDomainService.getUserProfile({ userId: currentUser!.id }),
    enabled: Boolean(currentUser?.id),
  })

  const followersQuery = useQuery({
    queryKey: ["profile", "followers"],
    queryFn: () => MovieDomainService.listFollowers({ skip: 0, limit: 100 }),
    enabled: Boolean(currentUser?.id),
  })

  const followingQuery = useQuery({
    queryKey: ["profile", "following"],
    queryFn: () => MovieDomainService.listFollowing({ skip: 0, limit: 100 }),
    enabled: Boolean(currentUser?.id),
  })

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => MovieDomainService.removeWatched({ id }),
    onSuccess: () => {
      showSuccessToast("Item removed")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setRemovingId(null)
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
      await queryClient.invalidateQueries({ queryKey: ["movies"] })
      await queryClient.invalidateQueries({ queryKey: ["feed"] })
    },
  })

  const handleRemove = (id: string) => {
    setRemovingId(id)
    removeItemMutation.mutate(id)
  }

  const profile = profileQuery.data

  const sortedWatched = useMemo(() => {
    if (!profile) return []
    const items = [...profile.watched_movies]
    switch (watchedSort) {
      case "title":
        return items.sort((a, b) =>
          (a.movie?.title ?? "").localeCompare(b.movie?.title ?? ""),
        )
      case "rating":
        return items.sort((a, b) => {
          const ra = a.rating ?? -1
          const rb = b.rating ?? -1
          return rb - ra
        })
      default:
        return items.sort((a, b) => {
          const da = a.watched_at ?? ""
          const db = b.watched_at ?? ""
          return db.localeCompare(da)
        })
    }
  }, [profile, watchedSort])

  const sortedWatchlist = useMemo(() => {
    if (!profile) return []
    const items = [...profile.watchlist]
    switch (watchlistSort) {
      case "title":
        return items.sort((a, b) =>
          (a.movie?.title ?? "").localeCompare(b.movie?.title ?? ""),
        )
      default:
        return items.sort((a, b) => {
          const da = a.added_at ?? ""
          const db = b.added_at ?? ""
          return db.localeCompare(da)
        })
    }
  }, [profile, watchlistSort])

  if (!currentUser) {
    return null
  }

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {profileQuery.error.message || "Could not load profile."}
      </div>
    )
  }

  if (!profile) {
    return <ProfileSkeleton />
  }

  const profileName = profile.user.full_name || profile.user.username

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="relative">
        {/* Gradient banner */}
        <div className="h-20 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-muted/30 dark:from-primary/20 dark:via-primary/8 dark:to-muted/20" />

        {/* Settings button in banner */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Manage profile"
              className="absolute top-2.5 right-2.5 size-8 rounded-xl bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors"
            >
              <Settings className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Account</SheetTitle>
              <SheetDescription>
                Your account details and settings.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarId={currentUser?.avatar}
                  displayName={profileName}
                  className="size-12 shrink-0"
                  iconSizeClass="size-5"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {profileName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    Name
                  </p>
                  <p className="text-sm mt-0.5">{profileName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    Email
                  </p>
                  <p className="text-sm mt-0.5">{currentUser?.email}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    Movies Watched
                  </p>
                  <p className="text-sm mt-0.5">{profile.watched_count}</p>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Log Out
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Avatar + name row — avatar overlaps banner */}
        <div className="flex items-end gap-3 -mt-10 px-1">
          <button
            type="button"
            onClick={() => setAvatarPickerOpen(true)}
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Change avatar"
          >
            <UserAvatar
              avatarId={currentUser?.avatar}
              displayName={profileName}
              className="size-20 ring-4 ring-background shadow-sm"
              iconSizeClass="size-8"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="size-5 text-white" />
            </span>
          </button>
          <div className="mb-1 min-w-0">
            <h2 className="text-base font-bold leading-tight truncate">
              {profileName}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              @{profile.user.username}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 rounded-2xl bg-muted/40 py-3">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-bold leading-none">
            {profile.watched_count}
          </span>
          <span className="text-[11px] text-muted-foreground">Movies</span>
        </div>
        <button
          type="button"
          onClick={() => setFollowersOpen(true)}
          className="flex flex-col items-center gap-0.5 border-x border-border/40 hover:bg-muted/60 rounded-none transition-colors cursor-pointer"
        >
          <span className="text-lg font-bold leading-none">
            {followersQuery.data?.count ?? 0}
          </span>
          <span className="text-[11px] text-muted-foreground">Followers</span>
        </button>
        <button
          type="button"
          onClick={() => setFollowingOpen(true)}
          className="flex flex-col items-center gap-0.5 hover:bg-muted/60 rounded-none transition-colors cursor-pointer"
        >
          <span className="text-lg font-bold leading-none">
            {followingQuery.data?.count ?? 0}
          </span>
          <span className="text-[11px] text-muted-foreground">Following</span>
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="watched" className="gap-3">
        <TabsList className="w-full">
          <TabsTrigger value="watched" className="flex-1">
            Watched ({profile.watched_movies.length})
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex-1">
            Watchlist ({profile.watchlist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watched" className="space-y-3">
          <SortPills
            options={[
              { value: "date" as const, label: "Date" },
              { value: "title" as const, label: "Title" },
              { value: "rating" as const, label: "Rating" },
            ]}
            value={watchedSort}
            onChange={setWatchedSort}
          />
          {sortedWatched.length === 0 ? (
            <EmptyListState message="No watched movies yet. Start tracking from Discover." />
          ) : (
            <div className="space-y-2">
              {sortedWatched.map((item) => (
                <SwipeableDeleteCard
                  key={item.id}
                  onDelete={() => handleRemove(item.id)}
                  isDeleting={
                    removingId === item.id && removeItemMutation.isPending
                  }
                >
                  <WatchedMovieItem
                    item={item}
                    onClick={() =>
                      setSelectedItem({
                        id: item.id,
                        user: profile.user,
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
                </SwipeableDeleteCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-3">
          <SortPills
            options={[
              { value: "date" as const, label: "Date" },
              { value: "title" as const, label: "Title" },
            ]}
            value={watchlistSort}
            onChange={setWatchlistSort}
          />
          {sortedWatchlist.length === 0 ? (
            <EmptyListState message="Your watchlist is empty. Save movies from Discover." />
          ) : (
            <div className="space-y-2">
              {sortedWatchlist.map((item) => (
                <SwipeableDeleteCard
                  key={item.id}
                  onDelete={() => handleRemove(item.id)}
                  isDeleting={
                    removingId === item.id && removeItemMutation.isPending
                  }
                >
                  <WatchlistMovieItem
                    item={item}
                    onClick={() =>
                      setSelectedItem({
                        id: item.id,
                        user: profile.user,
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
                </SwipeableDeleteCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Avatar Picker */}
      <AvatarPickerDialog
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        currentAvatarId={currentUser?.avatar}
      />

      {/* Detail Dialog */}
      <MediaDetailDialog
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        item={selectedItem}
      />

      {/* Followers Modal */}
      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto -mx-2">
            {followersQuery.data?.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No followers yet.
              </p>
            ) : (
              followersQuery.data?.data.map((item) => (
                <FollowUserRow
                  key={item.id}
                  item={item}
                  onNavigate={() => setFollowersOpen(false)}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto -mx-2">
            {followingQuery.data?.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Not following anyone yet.
              </p>
            ) : (
              followingQuery.data?.data.map((item) => (
                <FollowUserRow
                  key={item.id}
                  item={item}
                  onNavigate={() => setFollowingOpen(false)}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
