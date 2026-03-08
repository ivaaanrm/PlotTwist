import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Calendar,
  Check,
  Clock,
  Film,
  Monitor,
  Plus,
  Search,
  Star,
  Tv,
} from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MovieDomainService,
  type MediaType,
  type MovieSearchResult,
} from "@/features/movie-domain/api"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/discover")({
  component: Discover,
  head: () => ({
    meta: [
      {
        title: "Discover - PlotTwist",
      },
    ],
  }),
})

const ratingOptions = Array.from({ length: 10 }, (_, index) => (index + 1) / 2)
const posterBaseUrl = "https://image.tmdb.org/t/p/w500"

function getPosterUrl(posterPath?: string | null) {
  if (!posterPath) {
    return null
  }
  return `${posterBaseUrl}${posterPath}`
}

function formatReleaseDate(value?: string | null) {
  if (!value) {
    return "Unknown"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  })
}

type DiscoverCardProps = {
  movie: MovieSearchResult
  isInWatchlist: boolean
  isWatched: boolean
  isAddingToWatchlist: boolean
  isMarkingWatched: boolean
  onAddToWatchlist: (tmdbId: number) => void
  onMarkAsWatched: (tmdbId: number, rating: number | null) => void
}

function DiscoverCard({
  movie,
  isInWatchlist,
  isWatched,
  isAddingToWatchlist,
  isMarkingWatched,
  onAddToWatchlist,
  onMarkAsWatched,
}: DiscoverCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState("none")
  const posterUrl = getPosterUrl(movie.poster_path)

  const handleMarkAsWatched = () => {
    const rating = selectedRating === "none" ? null : Number(selectedRating)
    onMarkAsWatched(movie.external_id, rating)
    setIsDialogOpen(false)
  }

  return (
    <>
      <article className="group flex rounded-xl border bg-card overflow-hidden h-32 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
        {/* Poster — left side, full height */}
        <div className="w-[86px] shrink-0 bg-muted/30">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${movie.title} poster`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="size-6 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info — right side */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
          {/* Top: title + rating */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {movie.title}
              </h3>
              {typeof movie.rating === "number" && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star className="size-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {movie.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            {/* Meta row */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-0.5">
                <Calendar className="size-2.5" />
                {formatReleaseDate(movie.release_date)}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 rounded-full h-4"
              >
                {movie.media_type === "series" ? "Series" : "Movie"}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 mt-auto">
            <LoadingButton
              variant="outline"
              size="sm"
              loading={isAddingToWatchlist}
              disabled={isInWatchlist || isWatched || isMarkingWatched}
              onClick={() => onAddToWatchlist(movie.external_id)}
              className="rounded-full text-[11px] h-7 px-2.5"
            >
              {isInWatchlist ? (
                <>
                  <Clock className="size-3" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Plus className="size-3" />
                  Watchlist
                </>
              )}
            </LoadingButton>

            <Button
              variant={isWatched ? "secondary" : "default"}
              size="sm"
              disabled={isWatched || isMarkingWatched}
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full text-[11px] h-7 px-2.5"
            >
              {isWatched ? (
                <>
                  <Check className="size-3" />
                  Watched
                </>
              ) : (
                <>
                  <Star className="size-3" />
                  Watched
                </>
              )}
            </Button>
          </div>
        </div>
      </article>

      {/* Rating dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as watched</DialogTitle>
            <DialogDescription>
              Optionally rate{" "}
              <span className="font-medium">{movie.title}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rating (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No rating</SelectItem>
                {ratingOptions.map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating.toFixed(1)} / 5
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <LoadingButton
              className="w-full"
              loading={isMarkingWatched}
              onClick={handleMarkAsWatched}
            >
              Confirm watched
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DiscoverSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex rounded-xl border bg-card overflow-hidden h-32"
        >
          <Skeleton className="w-[86px] h-full rounded-none" />
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm">
        <Search className="size-7 text-primary/70" />
      </div>
      <h3 className="text-lg font-bold mb-1.5">Search for a title</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Find movies or series and add them to your watchlist or mark as watched.
      </p>
    </div>
  )
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-sm">
        <Film className="size-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-bold mb-1.5">No results for "{query}"</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Try another title or a broader keyword.
      </p>
    </div>
  )
}

function Discover() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [mediaType, setMediaType] = useState<MediaType>("movie")
  const [watchlistActionTmdbId, setWatchlistActionTmdbId] = useState<
    number | null
  >(null)
  const [watchedActionTmdbId, setWatchedActionTmdbId] = useState<number | null>(
    null,
  )

  const normalizedQuery = query.trim()
  const hasSearchQuery = normalizedQuery.length > 0

  const searchQuery = useQuery({
    queryKey: ["movies", "search", normalizedQuery, mediaType],
    queryFn: () =>
      MovieDomainService.searchMovies({
        query: normalizedQuery,
        media_type: mediaType,
      }),
    enabled: hasSearchQuery,
  })

  const watchlistQuery = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => MovieDomainService.listWatchlist({ skip: 0, limit: 200 }),
  })

  const watchedQuery = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => MovieDomainService.listWatched({ skip: 0, limit: 200 }),
  })

  const watchlistByTmdbId = useMemo(() => {
    const result = new Map<number, string>()
    for (const item of watchlistQuery.data?.data ?? []) {
      const tmdbId = item.movie?.tmdb_id
      if (typeof tmdbId === "number") {
        result.set(tmdbId, item.id)
      }
    }
    return result
  }, [watchlistQuery.data])

  const watchedByTmdbId = useMemo(() => {
    const result = new Map<number, string>()
    for (const item of watchedQuery.data?.data ?? []) {
      const tmdbId = item.movie?.tmdb_id
      if (typeof tmdbId === "number") {
        result.set(tmdbId, item.id)
      }
    }
    return result
  }, [watchedQuery.data])

  const addToWatchlistMutation = useMutation({
    mutationFn: (tmdbId: number) =>
      MovieDomainService.addToWatchlist({
        tmdb_id: tmdbId,
        media_type: mediaType,
      }),
    onSuccess: () => {
      showSuccessToast("Added to watchlist")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setWatchlistActionTmdbId(null)
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] })
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const markAsWatchedMutation = useMutation({
    mutationFn: (payload: { tmdbId: number; rating: number | null }) =>
      MovieDomainService.markAsWatched({
        tmdb_id: payload.tmdbId,
        media_type: mediaType,
        rating: payload.rating,
      }),
    onSuccess: () => {
      showSuccessToast("Marked as watched")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setWatchedActionTmdbId(null)
      await queryClient.invalidateQueries({ queryKey: ["movies", "watched"] })
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] })
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
      await queryClient.invalidateQueries({ queryKey: ["feed"] })
    },
  })

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  const handleAddToWatchlist = (tmdbId: number) => {
    setWatchlistActionTmdbId(tmdbId)
    addToWatchlistMutation.mutate(tmdbId)
  }

  const handleMarkAsWatched = (tmdbId: number, rating: number | null) => {
    setWatchedActionTmdbId(tmdbId)
    markAsWatchedMutation.mutate({ tmdbId, rating })
  }

  const isLoadingResults = searchQuery.isLoading || searchQuery.isFetching
  const searchErrorMessage =
    searchQuery.error?.message ?? "Could not load results."

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Discover
        </h1>
        <p className="text-muted-foreground text-sm">
          Search movies and series to track what you watch.
        </p>
      </div>

      {/* Search + Type toggle */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Search ${mediaType === "series" ? "series" : "movies"} by title...`}
            aria-label="Search by title"
            className="rounded-xl"
          />
          <Button
            type="submit"
            disabled={!searchInput.trim()}
            className="rounded-xl"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </form>

        {/* Movie / Series toggle */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-muted/50 w-fit">
          <button
            type="button"
            onClick={() => {
              setMediaType("movie")
              if (hasSearchQuery) setQuery(query)
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${mediaType === "movie"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Monitor className="size-3.5" />
            Movies
          </button>
          <button
            type="button"
            onClick={() => {
              setMediaType("series")
              if (hasSearchQuery) setQuery(query)
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${mediaType === "series"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Tv className="size-3.5" />
            Series
          </button>
        </div>
      </div>

      {/* Results */}
      {!hasSearchQuery && <SearchEmptyState />}

      {hasSearchQuery && searchQuery.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {searchErrorMessage}
        </div>
      )}

      {hasSearchQuery && isLoadingResults && <DiscoverSkeleton />}

      {hasSearchQuery &&
        !isLoadingResults &&
        searchQuery.data &&
        searchQuery.data.results.length === 0 && (
          <NoResultsState query={normalizedQuery} />
        )}

      {hasSearchQuery &&
        !isLoadingResults &&
        searchQuery.data &&
        searchQuery.data.results.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              {searchQuery.data.total_results} result
              {searchQuery.data.total_results !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {searchQuery.data.results.map((movie) => {
                const tmdbId = movie.external_id
                const isInWatchlist = watchlistByTmdbId.has(tmdbId)
                const isWatched = watchedByTmdbId.has(tmdbId)

                return (
                  <DiscoverCard
                    key={movie.external_id}
                    movie={movie}
                    isInWatchlist={isInWatchlist}
                    isWatched={isWatched}
                    isAddingToWatchlist={
                      watchlistActionTmdbId === tmdbId &&
                      addToWatchlistMutation.isPending
                    }
                    isMarkingWatched={
                      watchedActionTmdbId === tmdbId &&
                      markAsWatchedMutation.isPending
                    }
                    onAddToWatchlist={handleAddToWatchlist}
                    onMarkAsWatched={handleMarkAsWatched}
                  />
                )
              })}
            </div>
          </>
        )}
    </div>
  )
}

export default Discover
