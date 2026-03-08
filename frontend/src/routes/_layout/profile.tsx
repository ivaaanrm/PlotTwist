import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Film, Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MovieDomainService,
  type MoviePublic,
  type WatchedMoviePublic,
  type WatchlistItemPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

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

const posterBaseUrl = "https://image.tmdb.org/t/p/w500"

function getPosterUrl(posterPath?: string | null) {
  if (!posterPath) {
    return null
  }
  return `${posterBaseUrl}${posterPath}`
}

function formatRating(value?: number | null) {
  if (typeof value !== "number") {
    return null
  }
  return value.toFixed(1)
}

function formatDate(value?: string | null) {
  if (!value) {
    return ""
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  })
}

function MoviePoster({
  movie,
  title,
}: {
  movie?: MoviePublic | null
  title: string
}) {
  const posterUrl = getPosterUrl(movie?.poster_path)

  if (posterUrl) {
    return (
      <img
        src={posterUrl}
        alt={`${title} poster`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/50">
      <Film className="size-6 text-muted-foreground/30" />
    </div>
  )
}

function WatchedMovieItem({ item }: { item: WatchedMoviePublic }) {
  const movie = item.movie
  const rating = formatRating(item.rating)
  const date = formatDate(item.watched_at)

  return (
    <article className="flex rounded-xl border bg-card overflow-hidden h-24 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      {/* Poster */}
      <div className="w-16 shrink-0 bg-muted/30">
        <MoviePoster movie={movie} title={movie?.title ?? "Movie"} />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-1">
              {movie?.title ?? "Untitled"}
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
          {movie?.overview && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">
              {movie.overview}
            </p>
          )}
        </div>
        {date && (
          <span className="text-[10px] text-muted-foreground/70 mt-auto">
            Watched {date}
          </span>
        )}
      </div>
    </article>
  )
}

function WatchlistMovieItem({ item }: { item: WatchlistItemPublic }) {
  const movie = item.movie
  const date = formatDate(item.added_at)

  return (
    <article className="flex rounded-xl border bg-card overflow-hidden h-24 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      {/* Poster */}
      <div className="w-16 shrink-0 bg-muted/30">
        <MoviePoster movie={movie} title={movie?.title ?? "Movie"} />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5">
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">
            {movie?.title ?? "Untitled"}
          </h3>
          {movie?.overview && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">
              {movie.overview}
            </p>
          )}
        </div>
        {date && (
          <span className="text-[10px] text-muted-foreground/70 mt-auto">
            Added {date}
          </span>
        )}
      </div>
    </article>
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
      <div className="grid grid-cols-4 gap-2">
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

  if (!profileQuery.data) {
    return <ProfileSkeleton />
  }

  const profile = profileQuery.data
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
      <div className="grid grid-cols-4 gap-2">
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

        <TabsContent value="watched" className="space-y-2">
          {profile.watched_movies.length === 0 ? (
            <EmptyListState message="No watched movies yet. Start tracking from Discover." />
          ) : (
            profile.watched_movies.map((item) => (
              <WatchedMovieItem key={item.id} item={item} />
            ))
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-2">
          {profile.watchlist.length === 0 ? (
            <EmptyListState message="Your watchlist is empty. Save movies from Discover." />
          ) : (
            profile.watchlist.map((item) => (
              <WatchlistMovieItem key={item.id} item={item} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
