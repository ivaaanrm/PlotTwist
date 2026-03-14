import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Monitor, Tv } from "lucide-react-native";

import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import type {
  CollectionListPublic,
  MediaType,
  MovieSearchResponse,
  MovieSearchResult,
  WatchedMoviesPublic,
  WatchlistItemsPublic,
} from "@/lib/types";
import { DiscoverCard } from "@/components/DiscoverCard";
import { MediaDetailSheet } from "@/components/MediaDetailSheet";
import { showCollectionPicker } from "@/lib/collection-picker";

export default function DiscoverScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [openRatingOnSelect, setOpenRatingOnSelect] = useState(false);
  const [watchlistActionTmdbId, setWatchlistActionTmdbId] = useState<number | null>(null);
  const [watchedActionTmdbId, setWatchedActionTmdbId] = useState<number | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 350);
  const hasSearchQuery = debouncedQuery.length > 0;

  const searchQuery = useQuery({
    queryKey: ["movies", "search", debouncedQuery, mediaType],
    queryFn: () =>
      api<MovieSearchResponse>("/movies/search", {
        query: { query: debouncedQuery, media_type: mediaType },
      }),
    enabled: hasSearchQuery,
  });

  const trendingQuery = useQuery({
    queryKey: ["movies", "trending", mediaType],
    queryFn: () =>
      api<MovieSearchResponse>("/movies/trending", {
        query: { media_type: mediaType },
      }),
    enabled: !hasSearchQuery,
  });

  const { data: watchlist } = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () =>
      api<WatchlistItemsPublic>("/collections/watchlist", {
        query: { skip: 0, limit: 200 },
      }),
  });

  const { data: watched } = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () =>
      api<WatchedMoviesPublic>("/collections/watched", {
        query: { skip: 0, limit: 200 },
      }),
  });

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      api<CollectionListPublic>("/collections/named", {
        query: { skip: 0, limit: 50 },
      }),
  });

  const watchlistByTmdbId = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of watchlist?.data ?? []) {
      const tmdbId = item.media?.tmdb_id;
      if (typeof tmdbId === "number") map.set(tmdbId, item.id);
    }
    return map;
  }, [watchlist?.data]);

  const watchedByTmdbId = useMemo(() => {
    const map = new Map<number, number | null>();
    for (const item of watched?.data ?? []) {
      const tmdbId = item.media?.tmdb_id;
      if (typeof tmdbId === "number") map.set(tmdbId, item.rating ?? null);
    }
    return map;
  }, [watched?.data]);

  const addToWatchlistMutation = useMutation({
    mutationFn: (tmdbId: number) =>
      api("/collections/watchlist", {
        method: "POST",
        body: { tmdb_id: tmdbId, media_type: mediaType },
      }),
    onSettled: async () => {
      setWatchlistActionTmdbId(null);
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const markAsWatchedMutation = useMutation({
    mutationFn: (payload: { tmdbId: number; rating: number | null }) =>
      api("/collections/watched", {
        method: "POST",
        body: {
          tmdb_id: payload.tmdbId,
          media_type: mediaType,
          rating: payload.rating,
        },
      }),
    onSettled: async () => {
      setWatchedActionTmdbId(null);
      await queryClient.invalidateQueries({ queryKey: ["movies", "watched"] });
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const addToCollectionMutation = useMutation({
    mutationFn: (payload: { collectionId: string; tmdbId: number }) =>
      api(`/collections/named/${payload.collectionId}/items`, {
        method: "POST",
        body: {
          tmdb_id: payload.tmdbId,
          media_type: mediaType,
          rating: null,
        },
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const displayResults = hasSearchQuery
    ? searchQuery.data?.results
    : trendingQuery.data?.results;
  const isLoadingResults = hasSearchQuery
    ? searchQuery.isLoading || searchQuery.isFetching
    : trendingQuery.isLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={displayResults ?? []}
        keyExtractor={(item) => `${item.external_id}-${item.media_type}`}
        renderItem={({ item }) => {
          const tmdbId = item.external_id;
          const isInWatchlist = watchlistByTmdbId.has(tmdbId);
          const isWatched = watchedByTmdbId.has(tmdbId);

          return (
            <View className="px-4 pb-3">
              <DiscoverCard
                movie={item}
                isInWatchlist={isInWatchlist}
                isWatched={isWatched}
                isAddingToWatchlist={
                  watchlistActionTmdbId === tmdbId && addToWatchlistMutation.isPending
                }
                isMarkingWatched={
                  watchedActionTmdbId === tmdbId && markAsWatchedMutation.isPending
                }
                onPress={() => {
                  setOpenRatingOnSelect(false);
                  setSelectedMovie(item);
                }}
                onAddToWatchlist={() => {
                  setWatchlistActionTmdbId(tmdbId);
                  addToWatchlistMutation.mutate(tmdbId);
                }}
                onMarkAsWatched={() => {
                  setWatchedActionTmdbId(tmdbId);
                  setOpenRatingOnSelect(true);
                  setSelectedMovie(item);
                }}
                onAddToCollection={() => {
                  showCollectionPicker({
                    collections: collections?.data ?? [],
                    onSelect: (collectionId) => {
                      addToCollectionMutation.mutate({
                        collectionId,
                        tmdbId,
                      });
                    },
                  });
                }}
                hasCollections={(collections?.data?.length ?? 0) > 0}
              />
            </View>
          );
        }}
        ListHeaderComponent={
          <View className="px-4 pt-4 pb-2 gap-3">
            <View className="gap-1">
              <Text className="text-xl font-bold text-foreground">Discover</Text>
              <Text className="text-sm text-muted-foreground">
                Search movies and series to track what you watch.
              </Text>
            </View>

            <View className="relative">
              <Search
                size={16}
                color="#71717a"
                style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}
              />
              <Input
                placeholder={`Search ${mediaType === "series" ? "series" : "movies"} by title...`}
                value={query}
                onChangeText={setQuery}
                className="pl-10 pr-10"
              />
              {searchQuery.isFetching ? (
                <ActivityIndicator
                  size="small"
                  color="#71717a"
                  style={{ position: "absolute", right: 12, top: 14 }}
                />
              ) : null}
            </View>

            <View className="flex-row gap-2 p-1 rounded-xl bg-muted/50 w-fit">
              <Pressable
                onPress={() => setMediaType("movie")}
                className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${
                  mediaType === "movie"
                    ? "bg-card text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Monitor size={14} color={mediaType === "movie" ? "#0f172a" : "#71717a"} />
                <Text className="text-sm font-medium">Movies</Text>
              </Pressable>
              <Pressable
                onPress={() => setMediaType("series")}
                className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${
                  mediaType === "series"
                    ? "bg-card text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Tv size={14} color={mediaType === "series" ? "#0f172a" : "#71717a"} />
                <Text className="text-sm font-medium">Series</Text>
              </Pressable>
            </View>

            {hasSearchQuery && searchQuery.isError ? (
              <View className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                <Text className="text-sm text-destructive">
                  Could not load results.
                </Text>
              </View>
            ) : null}

            {!isLoadingResults && hasSearchQuery && (searchQuery.data?.results.length ?? 0) === 0 ? (
              <View className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
                <Text className="text-lg font-bold text-foreground mb-2">
                  No results for "{debouncedQuery}"
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Try another title or a broader keyword.
                </Text>
              </View>
            ) : null}

            {!isLoadingResults && !hasSearchQuery ? (
              <Text className="text-sm font-semibold text-muted-foreground">
                Trending this week
              </Text>
            ) : null}

            {isLoadingResults ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color="#71717a" />
              </View>
            ) : null}
          </View>
        }
        contentContainerClassName="pb-6"
        ListEmptyComponent={
          !isLoadingResults ? (
            <View className="items-center pt-10">
              <Text className="text-muted-foreground">
                {hasSearchQuery ? "No results found" : "No trending items"}
              </Text>
            </View>
          ) : null
        }
      />

      <MediaDetailSheet
        isOpen={selectedMovie !== null}
        initialShowRating={openRatingOnSelect}
        mediaId={selectedMovie?.external_id ?? null}
        mediaType={selectedMovie?.media_type ?? "movie"}
        fallbackTitle={selectedMovie?.title}
        fallbackPoster={selectedMovie?.poster_path ?? null}
        fallbackOverview={selectedMovie?.overview ?? null}
        fallbackReleaseDate={selectedMovie?.release_date ?? null}
        fallbackTmdbRating={selectedMovie?.rating ?? null}
        isInWatchlist={
          typeof selectedMovie?.external_id === "number" &&
          watchlistByTmdbId.has(selectedMovie.external_id)
        }
        isWatched={
          typeof selectedMovie?.external_id === "number" &&
          watchedByTmdbId.has(selectedMovie.external_id)
        }
        watchedRating={
          typeof selectedMovie?.external_id === "number"
            ? watchedByTmdbId.get(selectedMovie.external_id) ?? null
            : null
        }
        collections={collections?.data ?? []}
        onAddToWatchlist={() => {
          if (!selectedMovie) return;
          addToWatchlistMutation.mutate(selectedMovie.external_id);
        }}
        onMarkWatched={(rating) => {
          if (!selectedMovie) return;
          markAsWatchedMutation.mutate({ tmdbId: selectedMovie.external_id, rating });
        }}
        onAddToCollection={(collectionId) => {
          if (!selectedMovie) return;
          addToCollectionMutation.mutate({
            collectionId,
            tmdbId: selectedMovie.external_id,
          });
        }}
        onClose={() => {
          setSelectedMovie(null);
          setOpenRatingOnSelect(false);
        }}
      />
    </SafeAreaView>
  );
}
