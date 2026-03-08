import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Calendar, Check, Clock, Film, Plus, Search, Star } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  type MovieSearchResult,
} from "@/features/movie-domain/api"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/discover")({
  component: Items,
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
    return "Unknown release date"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown release date"
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type DiscoverMovieCardProps = {
  movie: MovieSearchResult
  isInWatchlist: boolean
  isWatched: boolean
  isAddingToWatchlist: boolean
  isMarkingWatched: boolean
  onAddToWatchlist: (tmdbId: number) => void
  onMarkAsWatched: (tmdbId: number, rating: number | null) => void
}

function DiscoverMovieCard({
  movie,
  isInWatchlist,
  isWatched,
  isAddingToWatchlist,
  isMarkingWatched,
  onAddToWatchlist,
  onMarkAsWatched,
}: DiscoverMovieCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState("none")
  const posterUrl = getPosterUrl(movie.poster_path)

  const handleMarkAsWatched = () => {
    const rating = selectedRating === "none" ? null : Number(selectedRating)
    onMarkAsWatched(movie.external_id, rating)
    setIsDialogOpen(false)
  }

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className="aspect-[2/3] w-full bg-muted/50 relative">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="size-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="line-clamp-2 text-base">{movie.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="size-4" />
          {formatReleaseDate(movie.release_date)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {typeof movie.rating === "number" && (
          <Badge variant="secondary" className="gap-1">
            <Star className="size-3.5 fill-current" />
            TMDB {movie.rating.toFixed(1)}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground line-clamp-4">
          {movie.overview || "No synopsis available yet."}
        </p>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-2 pt-4">
        <LoadingButton
          variant="outline"
          loading={isAddingToWatchlist}
          disabled={isInWatchlist || isWatched || isMarkingWatched}
          onClick={() => onAddToWatchlist(movie.external_id)}
          className="w-full"
        >
          {isInWatchlist ? (
            <>
              <Clock className="size-4" />
              In Watchlist
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Add to Watchlist
            </>
          )}
        </LoadingButton>

        <Button
          variant={isWatched ? "secondary" : "default"}
          disabled={isWatched || isMarkingWatched}
          onClick={() => setIsDialogOpen(true)}
          className="w-full"
        >
          {isWatched ? (
            <>
              <Check className="size-4" />
              Watched
            </>
          ) : (
            <>
              <Star className="size-4" />
              Mark as Watched
            </>
          )}
        </Button>

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
      </CardFooter>
    </Card>
  )
}

function DiscoverGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="overflow-hidden py-0 gap-0">
          <Skeleton className="aspect-[2/3] w-full rounded-none" />
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-14 w-full" />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function SearchEmptyState() {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Search className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">Search for a movie</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Find a title and add it to your watchlist or mark it as watched.
      </p>
    </div>
  )
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Film className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No results for "{query}"</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Try another title or a broader keyword.
      </p>
    </div>
  )
}

function Items() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [watchlistActionTmdbId, setWatchlistActionTmdbId] = useState<
    number | null
  >(null)
  const [watchedActionTmdbId, setWatchedActionTmdbId] = useState<number | null>(
    null,
  )

  const normalizedQuery = query.trim()
  const hasSearchQuery = normalizedQuery.length > 0

  const searchQuery = useQuery({
    queryKey: ["movies", "search", normalizedQuery, page],
    queryFn: () =>
      MovieDomainService.searchMovies({
        query: normalizedQuery,
        page,
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
      MovieDomainService.addToWatchlist({ tmdb_id: tmdbId }),
    onSuccess: () => {
      showSuccessToast("Movie added to watchlist")
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
        rating: payload.rating,
      }),
    onSuccess: () => {
      showSuccessToast("Movie marked as watched")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setWatchedActionTmdbId(null)
      await queryClient.invalidateQueries({ queryKey: ["movies", "watched"] })
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] })
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
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
  const totalPages = searchQuery.data?.total_pages ?? 1
  const canGoToPrevious = page > 1
  const canGoToNext = page < totalPages
  const searchErrorMessage =
    searchQuery.error?.message ?? "Could not load movies."

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground">
          Search movies and track what you want to watch next.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by title..."
          aria-label="Search movies by title"
        />
        <Button type="submit" disabled={!searchInput.trim()}>
          <Search className="size-4" />
          Search
        </Button>
      </form>

      {!hasSearchQuery && <SearchEmptyState />}

      {hasSearchQuery && searchQuery.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {searchErrorMessage}
        </div>
      )}

      {hasSearchQuery && isLoadingResults && <DiscoverGridSkeleton />}

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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {searchQuery.data.total_results.toLocaleString()} results
              </p>
              <p className="text-sm text-muted-foreground">
                Page {searchQuery.data.page} of {searchQuery.data.total_pages}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchQuery.data.results.map((movie) => {
                const tmdbId = movie.external_id
                const isInWatchlist = watchlistByTmdbId.has(tmdbId)
                const isWatched = watchedByTmdbId.has(tmdbId)

                return (
                  <DiscoverMovieCard
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
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={!canGoToPrevious || searchQuery.isFetching}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, searchQuery.data.total_pages),
                  )
                }
                disabled={!canGoToNext || searchQuery.isFetching}
              >
                Next
              </Button>
            </div>
          </>
        )}
    </div>
  )
}

export default Items
