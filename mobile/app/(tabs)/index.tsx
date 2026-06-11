import { useMemo, useRef, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api-client";
import type {
  CollectionListPublic,
  FeedItemPublic,
  FeedPublic,
  MediaType,
  WatchedMoviesPublic,
  WatchlistItemsPublic,
} from "@/lib/types";
import { FeedTicketCard } from "@/components/FeedTicketCard";
import { MediaDetailSheet } from "@/components/MediaDetailSheet";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { SwipeActionCard } from "@/components/SwipeActionCard";

function SkeletonCard() {
  return (
    <View
      style={{
        height: 84,
        borderRadius: 16,
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: "#27272a",
      }}
    />
  );
}

function FeedSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12, paddingTop: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<FeedItemPublic | null>(null);
  const [openRatingOnSelect, setOpenRatingOnSelect] = useState(false);

  const {
    data: feed,
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["feed"],
    queryFn: () => api<FeedPublic>("/feed/", { query: { skip: 0, limit: 50 } }),
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
        query: { skip: 0, limit: 1000 },
      }),
  });

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      api<CollectionListPublic>("/collections/named", {
        query: { skip: 0, limit: 50 },
      }),
  });

  const watchlistTmdbIds = useMemo(() => {
    const ids = new Set<number>();
    for (const item of watchlist?.data ?? []) {
      const tmdbId = item.media?.tmdb_id;
      if (typeof tmdbId === "number") ids.add(tmdbId);
    }
    return ids;
  }, [watchlist?.data]);

  const watchedRatings = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of watched?.data ?? []) {
      const tmdbId = item.media?.tmdb_id;
      if (typeof tmdbId === "number" && item.rating != null) {
        map.set(tmdbId, item.rating);
      }
    }
    return map;
  }, [watched?.data]);

  const addToWatchlistMutation = useMutation({
    mutationFn: (payload: { tmdbId: number; mediaType: MediaType }) =>
      api("/collections/watchlist", {
        method: "POST",
        body: { tmdb_id: payload.tmdbId, media_type: payload.mediaType },
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const markAsWatchedMutation = useMutation({
    mutationFn: (payload: {
      tmdbId: number;
      mediaType: MediaType;
      rating: number | null;
    }) =>
      api("/collections/watched", {
        method: "POST",
        body: {
          tmdb_id: payload.tmdbId,
          media_type: payload.mediaType,
          rating: payload.rating,
        },
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movies", "watched"] });
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const addToCollectionMutation = useMutation({
    mutationFn: (payload: {
      collectionId: string;
      tmdbId: number;
      mediaType: MediaType;
    }) =>
      api(`/collections/named/${payload.collectionId}/items`, {
        method: "POST",
        body: {
          tmdb_id: payload.tmdbId,
          media_type: payload.mediaType,
          rating: null,
        },
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const feedItems = feed?.data ?? [];

  const selectedMedia = selectedItem?.collection_item.media;
  const selectedTmdbId = selectedMedia?.tmdb_id ?? null;
  const selectedMediaType = (selectedMedia?.media_type ?? "movie") as MediaType;

  const firstName = user?.full_name?.split(" ")[0] ?? user?.username ?? "";

  return (
    <SafeAreaView className="flex-1 bg-background">
      {isLoading ? (
        <>
          <View className="px-4 pt-5 pb-3">
            <Text className="text-xl font-bold text-foreground">
              Hey, {firstName}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Recent activity from you and your friends
            </Text>
          </View>
          <FeedSkeleton />
        </>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.collection_item.id}
          renderItem={({ item }) => (
            <View className="px-4 pt-1 pb-1">
              <SwipeActionCard
                disableSwipeRight={
                  typeof item.collection_item.media?.tmdb_id === "number" &&
                  (watchlistTmdbIds.has(item.collection_item.media.tmdb_id) ||
                    watchedRatings.has(item.collection_item.media.tmdb_id))
                }
                disableSwipeLeft={
                  typeof item.collection_item.media?.tmdb_id === "number" &&
                  watchedRatings.has(item.collection_item.media.tmdb_id)
                }
                onSwipeRight={() => {
                  const tmdbId = item.collection_item.media?.tmdb_id;
                  const mediaType = (
                    item.collection_item.media?.media_type ?? "movie"
                  ) as MediaType;
                  if (typeof tmdbId !== "number") return;
                  addToWatchlistMutation.mutate({ tmdbId, mediaType });
                }}
                onSwipeLeft={() => {
                  setOpenRatingOnSelect(true);
                  setSelectedItem(item);
                }}
              >
                <FeedTicketCard
                  item={item}
                  currentUserId={user?.id}
                  currentUserRating={
                    item.collection_item.media?.tmdb_id
                      ? watchedRatings.get(item.collection_item.media.tmdb_id)
                      : undefined
                  }
                  onPress={() => {
                    setOpenRatingOnSelect(false);
                    setSelectedItem(item);
                  }}
                />
              </SwipeActionCard>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListHeaderComponent={
            <View className="px-4 pt-5 pb-3">
              <Text className="text-xl font-bold text-foreground">
                Hey, {firstName}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Recent activity from you and your friends
              </Text>
              {isError ? (
                <View className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                  <Text className="text-sm text-destructive">
                    Could not load your feed.
                  </Text>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 pt-16">
              <Text className="text-lg font-semibold text-foreground mb-2">
                Your feed is empty
              </Text>
              <Text className="text-sm text-muted-foreground text-center mb-8">
                Watch some movies or follow friends to see activity here.
              </Text>
              <View className="w-full gap-3">
                <Button onPress={() => router.push("/(tabs)/discover")}>
                  Discover Movies
                </Button>
                <Button
                  variant="outline"
                  onPress={() => router.push("/(tabs)/social")}
                >
                  Find Friends
                </Button>
              </View>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <MediaDetailSheet
        isOpen={selectedItem !== null}
        initialShowRating={openRatingOnSelect}
        mediaId={selectedTmdbId}
        mediaType={selectedMediaType}
        fallbackTitle={selectedMedia?.title ?? undefined}
        fallbackPoster={selectedMedia?.poster_path ?? null}
        fallbackOverview={selectedMedia?.overview ?? null}
        fallbackReleaseDate={selectedMedia?.release_date ?? null}
        fallbackTmdbRating={selectedMedia?.tmdb_rating ?? null}
        isInWatchlist={
          typeof selectedTmdbId === "number" &&
          watchlistTmdbIds.has(selectedTmdbId)
        }
        isWatched={
          typeof selectedTmdbId === "number" &&
          watchedRatings.has(selectedTmdbId)
        }
        watchedRating={
          typeof selectedTmdbId === "number"
            ? watchedRatings.get(selectedTmdbId) ?? null
            : null
        }
        collections={collections?.data ?? []}
        onAddToWatchlist={() => {
          if (typeof selectedTmdbId !== "number") return;
          addToWatchlistMutation.mutate({
            tmdbId: selectedTmdbId,
            mediaType: selectedMediaType,
          });
        }}
        onMarkWatched={(rating) => {
          if (typeof selectedTmdbId !== "number") return;
          markAsWatchedMutation.mutate({
            tmdbId: selectedTmdbId,
            mediaType: selectedMediaType,
            rating,
          });
        }}
        onAddToCollection={(collectionId) => {
          if (typeof selectedTmdbId !== "number") return;
          addToCollectionMutation.mutate({
            collectionId,
            tmdbId: selectedTmdbId,
            mediaType: selectedMediaType,
          });
        }}
        onClose={() => {
          setSelectedItem(null);
          setOpenRatingOnSelect(false);
        }}
      />
    </SafeAreaView>
  );
}
