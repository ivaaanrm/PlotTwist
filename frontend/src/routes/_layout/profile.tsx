import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Calendar, Film, ListChecks, Star, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

function formatDate(value?: string | null, fallback = "Unknown date") {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatRating(value?: number | null) {
  if (typeof value !== "number") {
    return "Not rated"
  }
  return `${value.toFixed(1)} / 5`
}

function parseGenres(genres?: string | null) {
  if (!genres) {
    return []
  }

  try {
    const parsed = JSON.parse(genres)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (genre): genre is string => typeof genre === "string",
      )
    }
  } catch {
    return []
  }

  return []
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
        className="h-full w-full rounded-md object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
      <Film className="size-6 text-muted-foreground" />
    </div>
  )
}

function WatchedMovieItem({ item }: { item: WatchedMoviePublic }) {
  const movie = item.movie
  const genres = parseGenres(movie?.genres).slice(0, 3)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <MoviePoster movie={movie} title={movie?.title ?? "Movie"} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold leading-tight truncate">
                {movie?.title ?? "Untitled movie"}
              </h3>
              <Badge variant="secondary" className="gap-1">
                <Star className="size-3.5" />
                {formatRating(item.rating)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {movie?.overview || "No synopsis available yet."}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                Watched {formatDate(item.watched_at)}
              </span>
              {genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WatchlistMovieItem({ item }: { item: WatchlistItemPublic }) {
  const movie = item.movie
  const genres = parseGenres(movie?.genres).slice(0, 3)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <MoviePoster movie={movie} title={movie?.title ?? "Movie"} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold leading-tight truncate">
                {movie?.title ?? "Untitled movie"}
              </h3>
              <Badge variant="outline" className="gap-1">
                <ListChecks className="size-3.5" />
                Watchlist
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {movie?.overview || "No synopsis available yet."}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                Added {formatDate(item.added_at)}
              </span>
              {genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyListState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Film className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your public movie activity and social stats.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl bg-zinc-600 text-white">
                {getInitials(profileName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate">{profileName}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {profile.user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Watched</CardDescription>
            <CardTitle>{profile.watched_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg rating</CardDescription>
            <CardTitle>
              {typeof profile.average_rating === "number"
                ? profile.average_rating.toFixed(2)
                : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Watchlist</CardDescription>
            <CardTitle>{profile.watchlist.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="inline-flex items-center gap-1">
              <Users className="size-4" />
              Followers / Following
            </CardDescription>
            <CardTitle>
              {followersQuery.data?.count ?? "-"} /{" "}
              {followingQuery.data?.count ?? "-"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="watched" className="gap-4">
        <TabsList>
          <TabsTrigger value="watched">
            Watched ({profile.watched_movies.length})
          </TabsTrigger>
          <TabsTrigger value="watchlist">
            Watchlist ({profile.watchlist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watched" className="space-y-3">
          {profile.watched_movies.length === 0 ? (
            <EmptyListState message="No watched movies yet. Start tracking what you watch from Discover." />
          ) : (
            profile.watched_movies.map((item) => (
              <WatchedMovieItem key={item.id} item={item} />
            ))
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-3">
          {profile.watchlist.length === 0 ? (
            <EmptyListState message="Your watchlist is empty. Save movies from Discover to see them here." />
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
