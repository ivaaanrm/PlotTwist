import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { EllipsisVertical, Star } from "lucide-react"
import { useMemo, useState } from "react"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MovieDomainService,
  type WatchedMoviePublic,
  type WatchlistItemPublic,
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
  onRemove,
  isRemoving,
}: {
  item: WatchedMoviePublic
  onRemove: (id: string) => void
  isRemoving: boolean
}) {
  const movie = item.movie
  const userRating = formatRating(item.rating)
  const tmdbRating = formatTmdbRating(movie?.tmdb_rating)
  const date = formatDate(item.watched_at)

  return (
    <article className="group flex rounded-xl border bg-card overflow-hidden h-[88px] transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      {/* Poster */}
      <div className="w-[62px] shrink-0 bg-muted/30">
        <MoviePoster posterPath={movie?.poster_path} title={movie?.title ?? "Movie"} />
      </div>

      {/* Info — middle section */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
        <h3 className="font-semibold text-sm leading-snug line-clamp-1">
          {movie?.title ?? "Untitled"}
        </h3>
        {date && (
          <span className="text-[10px] text-muted-foreground/60 leading-none">
            Watched {date}
          </span>
        )}
      </div>

      {/* Ratings — right side */}
      <div className="flex items-center gap-3 pr-1.5 shrink-0">
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

        {/* Kebab menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <EllipsisVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isRemoving}
              onClick={() => onRemove(item.id)}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

function WatchlistMovieItem({
  item,
  onRemove,
  isRemoving,
}: {
  item: WatchlistItemPublic
  onRemove: (id: string) => void
  isRemoving: boolean
}) {
  const movie = item.movie
  const tmdbRating = formatTmdbRating(movie?.tmdb_rating)
  const date = formatDate(item.added_at)

  return (
    <article className="group flex rounded-xl border bg-card overflow-hidden h-[88px] transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      {/* Poster */}
      <div className="w-[62px] shrink-0 bg-muted/30">
        <MoviePoster posterPath={movie?.poster_path} title={movie?.title ?? "Movie"} />
      </div>

      {/* Info — middle section */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
        <h3 className="font-semibold text-sm leading-snug line-clamp-1">
          {movie?.title ?? "Untitled"}
        </h3>
        {date && (
          <span className="text-[10px] text-muted-foreground/60 leading-none">
            Added {date}
          </span>
        )}
      </div>

      {/* Ratings — right side */}
      <div className="flex items-center gap-3 pr-1.5 shrink-0">
        {tmdbRating && (
          <div className="flex flex-col items-center gap-0.5">
            <Star className="size-4 text-muted-foreground/50" />
            <span className="text-base font-semibold text-muted-foreground leading-none">
              {tmdbRating}
            </span>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">TMDB</span>
          </div>
        )}

        {/* Kebab menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <EllipsisVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isRemoving}
              onClick={() => onRemove(item.id)}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
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

function StatCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-56" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function Profile() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [watchedSort, setWatchedSort] = useState<WatchedSort>("date")
  const [watchlistSort, setWatchlistSort] = useState<WatchlistSort>("date")
  const [removingId, setRemovingId] = useState<string | null>(null)

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
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Your movie activity and social stats.
        </p>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
            {getInitials(profileName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate">{profileName}</h2>
          <p className="text-sm text-muted-foreground truncate">
            {profile.user.email}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Watched" value={profile.watched_count} />
        <StatCard
          label="Avg Rating"
          value={
            typeof profile.average_rating === "number"
              ? profile.average_rating.toFixed(1)
              : "-"
          }
        />
        <StatCard label="Watchlist" value={profile.watchlist.length} />
        <StatCard
          label="Social"
          value={`${followersQuery.data?.count ?? "-"}/${followingQuery.data?.count ?? "-"}`}
        />
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
                <WatchedMovieItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  isRemoving={removingId === item.id && removeItemMutation.isPending}
                />
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
                <WatchlistMovieItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  isRemoving={removingId === item.id && removeItemMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
