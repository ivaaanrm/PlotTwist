import { useQuery } from "@tanstack/react-query"
import { Calendar, Clapperboard, Star, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
    MovieDomainService,
    type FeedItemPublic,
    type MediaType,
} from "@/features/movie-domain/api"
import { formatTmdbRating, getProfileUrl } from "@/lib/media"
import { MoviePoster } from "./MoviePoster"

interface MediaDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: FeedItemPublic | null
}

export function MediaDetailDialog({
    open,
    onOpenChange,
    item,
}: MediaDetailDialogProps) {
    const ci = item?.collection_item
    const media = ci?.media

    const tmdbId = media?.tmdb_id
    const mediaType = (media?.media_type ?? "movie") as MediaType

    const detailsQuery = useQuery({
        queryKey: ["movieDetails", tmdbId, mediaType],
        queryFn: () =>
            MovieDomainService.getMovieDetails({
                tmdbId: tmdbId!,
                media_type: mediaType,
            }),
        enabled: open && tmdbId != null,
        staleTime: 1000 * 60 * 10, // 10 minutes
    })

    const details = detailsQuery.data

    // Parse genres from the stored JSON string (media.genres) or use details.genres
    const genres = details?.genres ?? parseGenres(media?.genres)

    // Year from release_date
    const releaseDate = details?.release_date ?? media?.release_date
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null

    const tmdbRating = formatTmdbRating(details?.rating ?? media?.tmdb_rating)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-0 gap-0">
                {/* Header section with poster + title */}
                <div className="flex gap-4 p-5 pb-0">
                    <div className="w-28 shrink-0 rounded-lg overflow-hidden shadow-md">
                        <MoviePoster
                            posterPath={media?.poster_path}
                            title={media?.title ?? "Movie"}
                        />
                    </div>
                    <DialogHeader className="flex-1 text-left gap-1">
                        <DialogTitle className="text-lg leading-tight pr-6">
                            {media?.title ?? "Untitled"}
                        </DialogTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {year && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {year}
                                </span>
                            )}
                            {tmdbRating && (
                                <span className="flex items-center gap-1">
                                    <Star className="size-3 fill-amber-500 text-amber-500" />
                                    {tmdbRating}
                                </span>
                            )}
                        </div>
                        {/* Genre tags */}
                        {genres.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {genres.map((genre) => (
                                    <Badge
                                        key={genre}
                                        variant="secondary"
                                        className="text-[10px] px-2 py-0"
                                    >
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <DialogDescription className="sr-only">
                            Details for {media?.title ?? "media"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Overview */}
                <div className="px-5 pt-4">
                    {media?.overview ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {media.overview}
                        </p>
                    ) : details?.overview ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {details.overview}
                        </p>
                    ) : null}
                </div>

                {/* Credits: Director + Cast */}
                <div className="px-5 pt-4 pb-5 space-y-4">
                    {/* Director */}
                    {detailsQuery.isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ) : (
                        details?.director && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Clapperboard className="size-3" />
                                    Director
                                </h4>
                                <p className="text-sm font-medium">{details.director}</p>
                            </div>
                        )
                    )}

                    {/* Cast */}
                    {detailsQuery.isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <div className="grid grid-cols-5 gap-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                        <Skeleton className="size-12 rounded-full" />
                                        <Skeleton className="h-3 w-14" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        details?.cast &&
                        details.cast.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <User className="size-3" />
                                    Cast
                                </h4>
                                <div className="grid grid-cols-5 gap-x-2 gap-y-3">
                                    {details.cast.map((member) => {
                                        const profileUrl = getProfileUrl(member.profile_path)
                                        return (
                                            <div
                                                key={member.id}
                                                className="flex flex-col items-center gap-1.5"
                                            >
                                                <div className="size-12 rounded-full overflow-hidden bg-muted/50 ring-1 ring-border shrink-0">
                                                    {profileUrl ? (
                                                        <img
                                                            src={profileUrl}
                                                            alt={member.name}
                                                            className="size-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="size-full flex items-center justify-center text-muted-foreground">
                                                            <User className="size-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center min-w-0 w-full">
                                                    <p className="text-[10px] font-medium leading-tight line-clamp-2">
                                                        {member.name}
                                                    </p>
                                                    {member.character && (
                                                        <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                                                            {member.character}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function parseGenres(genresStr?: string | null): string[] {
    if (!genresStr) return []
    try {
        const parsed = JSON.parse(genresStr)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}
