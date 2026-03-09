import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { LogOut, Settings, Star } from "lucide-react"
import { useMemo, useState } from "react"
import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { SwipeableDeleteCard } from "@/components/Common/SwipeableDeleteCard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  MovieDomainService,
  type WatchedMoviePublic,
  type WatchlistItemPublic,
  type FeedItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate, formatRating, formatTmdbRating } from "@/lib/media"
import { getInitials, handleError } from "@/utils"

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
      {/* Main card */}
      <article
        className="ticket-card relative z-10 flex bg-card dark:bg-[#25252d] text-card-foreground overflow-hidden h-[100px] transition-shadow duration-200 ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:ring-primary/40 dark:group-hover:ring-primary/40"
      >
        {/* Poster - Full height, no margins, justified left */}
        <div className="w-[68px] shrink-0 relative z-10">
          <div className="h-full bg-muted">
            <MoviePoster
              posterPath={movie?.poster_path}
              title={movie?.title ?? "Movie"}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Main ticket body */}
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

        {/* Dashed divider */}
        <div className="w-px self-stretch my-2 border-l border-dashed border-border/60 relative z-10" />

        {/* Ticket stub — ratings */}
        <div className="flex items-center gap-2.5 px-3 shrink-0 relative z-10">
          {userRating && (
            <div className="flex flex-col items-center gap-0.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-[15px] font-bold text-amber-400 leading-none">
                {userRating}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">YOU</span>
            </div>
          )}
          {tmdbRating && (
            <div className="flex flex-col items-center gap-0.5">
              <Star className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold text-card-foreground leading-none">
                {tmdbRating}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">TMDB</span>
            </div>
          )}

          {/* Decorative barcode */}
          <div className="flex gap-[1.5px] items-center rotate-90 opacity-20 ml-0.5" aria-hidden="true">
            {[3, 1.5, 3, 1, 2, 1.5, 3, 1, 2, 3, 1.5, 1].map((w, i) => (
              <div
                key={i}
                className="bg-current rounded-full"
                style={{ width: `${w}px`, height: "18px" }}
              />
            ))}
          </div>

          {/* Kebab menu removed */}
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
      {/* Main card */}
      <article
        className="ticket-card relative z-10 flex bg-card dark:bg-[#25252d] text-card-foreground overflow-hidden h-[100px] transition-shadow duration-200 ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:ring-primary/40 dark:group-hover:ring-primary/40"
      >
        {/* Poster - Full height, no margins, justified left */}
        <div className="w-[68px] shrink-0 relative z-10">
          <div className="h-full bg-muted">
            <MoviePoster
              posterPath={movie?.poster_path}
              title={movie?.title ?? "Movie"}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Main ticket body */}
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

        {/* Dashed divider */}
        <div className="w-px self-stretch my-2 border-l border-dashed border-border/60 relative z-10" />

        {/* Ticket stub — ratings */}
        <div className="flex items-center gap-2.5 px-3 shrink-0 relative z-10">
          {tmdbRating && (
            <div className="flex flex-col items-center gap-0.5">
              <Star className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold text-card-foreground leading-none">
                {tmdbRating}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">TMDB</span>
            </div>
          )}

          {/* Decorative barcode */}
          <div className="flex gap-[1.5px] items-center rotate-90 opacity-20 ml-0.5" aria-hidden="true">
            {[3, 1.5, 3, 1, 2, 1.5, 3, 1, 2, 3, 1.5, 1].map((w, i) => (
              <div
                key={i}
                className="bg-current rounded-full"
                style={{ width: `${w}px`, height: "18px" }}
              />
            ))}
          </div>

          {/* Kebab menu removed */}
        </div>
      </article>
    </div>
  )
}

function EmptyListState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
        <Star className="size-6 text-muted-foreground/60" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-5">
        <Skeleton className="size-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-around">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-10 w-56" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
    </div>
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
      case "date":
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
      case "date":
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

  const profileName = profile.user.full_name || profile.user.email

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Profile header — Instagram style */}
      <div className="flex items-center gap-5">
        <Avatar className="size-16 shrink-0">
          <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
            {getInitials(profileName)}
          </AvatarFallback>
        </Avatar>

        {/* Stats inline */}
        <div className="flex flex-1 justify-around">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold leading-tight">{profile.watched_count}</span>
            <span className="text-[11px] text-muted-foreground">Movies</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold leading-tight">{followersQuery.data?.count ?? 0}</span>
            <span className="text-[11px] text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold leading-tight">{followingQuery.data?.count ?? 0}</span>
            <span className="text-[11px] text-muted-foreground">Following</span>
          </div>
        </div>
      </div>

      {/* Name + manage button */}
      <div className="flex items-center gap-3 -mt-1">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold leading-snug truncate">{profileName}</h2>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5 shrink-0">
              <Settings className="size-3.5" />
              Manage Profile
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Account</SheetTitle>
              <SheetDescription>Your account details and settings.</SheetDescription>
            </SheetHeader>
            <div className="px-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 shrink-0">
                  <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                    {getInitials(profileName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{profileName}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Name</p>
                  <p className="text-sm mt-0.5">{profileName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Email</p>
                  <p className="text-sm mt-0.5">{profile.user.email}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Movies Watched</p>
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="watched" className="gap-3">
        <TabsList>
          <TabsTrigger value="watched">
            Watched ({profile.watched_movies.length})
          </TabsTrigger>
          <TabsTrigger value="watchlist">
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
                  isDeleting={removingId === item.id && removeItemMutation.isPending}
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
                  isDeleting={removingId === item.id && removeItemMutation.isPending}
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
