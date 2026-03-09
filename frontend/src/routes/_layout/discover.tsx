import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Calendar,
  Check,
  Clock,
  Film,
  FolderPlus,
  Loader2,
  Monitor,
  Plus,
  Search,
  Star,
  Tv,
} from "lucide-react"
import { useMemo, useState } from "react"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { StarRating } from "@/components/Common/StarRating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  type CollectionPublic,
  type MediaType,
  MovieDomainService,
  type MovieSearchResult,
} from "@/features/movie-domain/api"
import useCustomToast from "@/hooks/useCustomToast"
import { useDebounce } from "@/hooks/useDebounce"
import { formatDate } from "@/lib/media"
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

type DiscoverCardProps = {
  movie: MovieSearchResult
  isInWatchlist: boolean
  isWatched: boolean
  isAddingToWatchlist: boolean
  isMarkingWatched: boolean
  onAddToWatchlist: (tmdbId: number) => void
  onMarkAsWatched: (tmdbId: number, rating: number | null) => void
  collections: CollectionPublic[]
  onAddToCollection: (collectionId: string, tmdbId: number) => void
}

function DiscoverCard({
  movie,
  isInWatchlist,
  isWatched,
  isAddingToWatchlist,
  isMarkingWatched,
  onAddToWatchlist,
  onMarkAsWatched,
  collections,
  onAddToCollection,
}: DiscoverCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  const handleMarkAsWatched = () => {
    onMarkAsWatched(movie.external_id, selectedRating)
    setIsDialogOpen(false)
  }

  return (
    <>
      <article className="group flex rounded-xl border bg-card overflow-hidden h-32 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
        {/* Poster */}
        <div className="w-[86px] shrink-0 bg-muted/30">
          <MoviePoster posterPath={movie.poster_path} title={movie.title} />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-0.5">
                <Calendar className="size-2.5" />
                {formatDate(movie.release_date) || "Unknown"}
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

            {collections.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-[11px] h-7 px-2"
                    title="Add to collection"
                  >
                    <FolderPlus className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {collections.map((col) => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() =>
                        onAddToCollection(col.id, movie.external_id)
                      }
                    >
                      {col.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </article>

      {/* Rating dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as watched</DialogTitle>
            <DialogDescription>
              Optionally rate <span className="font-medium">{movie.title}</span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <StarRating value={selectedRating} onChange={setSelectedRating} />
              <p className="text-sm text-muted-foreground">
                {selectedRating === null
                  ? "No rating"
                  : `${selectedRating.toFixed(1)} / 5`}
              </p>
            </div>

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
  const [mediaType, setMediaType] = useState<MediaType>("movie")
  const [watchlistActionTmdbId, setWatchlistActionTmdbId] = useState<
    number | null
  >(null)
  const [watchedActionTmdbId, setWatchedActionTmdbId] = useState<number | null>(
    null,
  )

  const debouncedQuery = useDebounce(searchInput.trim(), 350)
  const hasSearchQuery = debouncedQuery.length > 0

  const searchQuery = useQuery({
    queryKey: ["movies", "search", debouncedQuery, mediaType],
    queryFn: () =>
      MovieDomainService.searchMovies({
        query: debouncedQuery,
        media_type: mediaType,
      }),
    enabled: hasSearchQuery,
  })

  const trendingQuery = useQuery({
    queryKey: ["movies", "trending", mediaType],
    queryFn: () => MovieDomainService.getTrending({ media_type: mediaType }),
    enabled: !hasSearchQuery,
  })

  const watchlistQuery = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => MovieDomainService.listWatchlist({ skip: 0, limit: 200 }),
  })

  const watchedQuery = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => MovieDomainService.listWatched({ skip: 0, limit: 200 }),
  })

  const collectionsQuery = useQuery({
    queryKey: ["collections"],
    queryFn: () => MovieDomainService.listNamedCollections(),
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

  const handleAddToWatchlist = (tmdbId: number) => {
    setWatchlistActionTmdbId(tmdbId)
    addToWatchlistMutation.mutate(tmdbId)
  }

  const handleMarkAsWatched = (tmdbId: number, rating: number | null) => {
    setWatchedActionTmdbId(tmdbId)
    markAsWatchedMutation.mutate({ tmdbId, rating })
  }

  const addToCollectionMutation = useMutation({
    mutationFn: (payload: { collectionId: string; tmdbId: number }) =>
      MovieDomainService.addToNamedCollection({
        collectionId: payload.collectionId,
        tmdb_id: payload.tmdbId,
        media_type: mediaType,
      }),
    onSuccess: () => showSuccessToast("Added to collection"),
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

  const handleAddToCollection = (collectionId: string, tmdbId: number) => {
    addToCollectionMutation.mutate({ collectionId, tmdbId })
  }

  const userCollections = collectionsQuery.data?.data ?? []

  const isSearchLoading = searchQuery.isLoading || searchQuery.isFetching
  const isFetching = hasSearchQuery ? searchQuery.isFetching : false

  // Determine which results to show
  const displayResults = hasSearchQuery
    ? searchQuery.data?.results
    : trendingQuery.data?.results
  const isLoadingResults = hasSearchQuery
    ? isSearchLoading
    : trendingQuery.isLoading

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Search ${mediaType === "series" ? "series" : "movies"} by title...`}
            aria-label="Search by title"
            className="rounded-xl pl-9 pr-9"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Movie / Series toggle */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-muted/50 w-fit">
          <button
            type="button"
            onClick={() => setMediaType("movie")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mediaType === "movie"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="size-3.5" />
            Movies
          </button>
          <button
            type="button"
            onClick={() => setMediaType("series")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mediaType === "series"
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
      {hasSearchQuery && searchQuery.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {searchQuery.error?.message ?? "Could not load results."}
        </div>
      )}

      {isLoadingResults && <DiscoverSkeleton />}

      {!isLoadingResults &&
        hasSearchQuery &&
        searchQuery.data &&
        searchQuery.data.results.length === 0 && (
          <NoResultsState query={debouncedQuery} />
        )}

      {!isLoadingResults && displayResults && displayResults.length > 0 && (
        <>
          {hasSearchQuery ? (
            <p className="text-xs text-muted-foreground">
              {searchQuery.data!.total_results} result
              {searchQuery.data!.total_results !== 1 ? "s" : ""}
            </p>
          ) : (
            <h2 className="text-sm font-semibold text-muted-foreground">
              Trending this week
            </h2>
          )}
          <div className="space-y-3">
            {displayResults.map((movie) => {
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
                  collections={userCollections}
                  onAddToCollection={handleAddToCollection}
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
