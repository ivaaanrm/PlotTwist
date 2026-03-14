import { View, Text, FlatList, Pressable } from "react-native";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import type {
  FollowsWithUsersPublic,
  WatchedMoviePublic,
  WatchedMoviesPublic,
  WatchlistItemPublic,
  WatchlistItemsPublic,
} from "@/lib/types";
import { MediaDetailSheet } from "@/components/MediaDetailSheet";
import { PressableScale } from "@/components/PressableScale";
import { SwipeActionCard } from "@/components/SwipeActionCard";
import { ProfileListRow } from "@/components/ProfileListRow";
import { formatDate } from "@/lib/media";

type Tab = "watched" | "watchlist";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("watched");
  const [selectedItem, setSelectedItem] = useState<
    WatchedMoviePublic | WatchlistItemPublic | null
  >(null);
  const queryClient = useQueryClient();

  const { data: watched } = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () =>
      api<WatchedMoviesPublic>("/collections/watched", {
        query: { skip: 0, limit: 100 },
      }),
  });

  const { data: watchlist } = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () =>
      api<WatchlistItemsPublic>("/collections/watchlist", {
        query: { skip: 0, limit: 100 },
      }),
  });

  const { data: followers } = useQuery({
    queryKey: ["profile", "followers"],
    queryFn: () =>
      api<FollowsWithUsersPublic>("/follows/followers", {
        query: { skip: 0, limit: 100 },
      }),
  });

  const { data: following } = useQuery({
    queryKey: ["profile", "following"],
    queryFn: () =>
      api<FollowsWithUsersPublic>("/follows/following", {
        query: { skip: 0, limit: 100 },
      }),
  });

  const items =
    activeTab === "watched"
      ? (watched?.data ?? []).map((w) => ({
          id: w.id,
          media: w.media ?? null,
          raw: w,
          dateLabel: w.watched_at ? `Watched ${formatDate(w.watched_at)}` : null,
        }))
      : (watchlist?.data ?? []).map((w) => ({
          id: w.id,
          media: w.media ?? null,
          raw: w,
          dateLabel: w.media?.release_date
            ? `Released ${w.media.release_date.slice(0, 4)}`
            : null,
        }));

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) =>
      api(`/collections/items/${itemId}`, { method: "DELETE" }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movies", "watched"] });
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
              <Text className="text-lg font-semibold text-secondary-foreground">
                {(user?.full_name ?? user?.username)?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">
                {user?.full_name ?? user?.username}
              </Text>
              <Text className="text-sm text-muted-foreground">
                @{user?.username}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/settings")}>
            <Settings size={20} color="#fafafa" />
          </Pressable>
        </View>

        <View className="flex-row gap-6 flex-wrap">
          <Text className="text-sm text-muted-foreground">
            <Text className="font-semibold text-foreground">
              {followers?.count ?? 0}
            </Text>{" "}
            followers
          </Text>
          <Text className="text-sm text-muted-foreground">
            <Text className="font-semibold text-foreground">
              {following?.count ?? 0}
            </Text>{" "}
            following
          </Text>
          <Text className="text-sm text-muted-foreground">
            <Text className="font-semibold text-foreground">
              {watched?.count ?? 0}
            </Text>{" "}
            watched
          </Text>
          <Text className="text-sm text-muted-foreground">
            <Text className="font-semibold text-foreground">
              {watchlist?.count ?? 0}
            </Text>{" "}
            watchlist
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View className="flex-row border-b border-border">
        {(["watched", "watchlist"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 items-center py-3 ${activeTab === tab ? "border-b-2 border-foreground" : ""}`}
          >
            <Text
              className={`text-sm font-medium capitalize ${activeTab === tab ? "text-foreground" : "text-muted-foreground"}`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pb-2">
            <SwipeActionCard
              disableSwipeRight={true}
              disableSwipeLeft={false}
              rightLabel="Remove"
              onSwipeLeft={() => removeMutation.mutate(item.id)}
            >
              <PressableScale
                onPress={() => setSelectedItem(item.raw)}
                scale={0.985}
                shadow
              >
                <ProfileListRow
                  media={item.media}
                  rating={activeTab === "watched" ? item.raw.rating ?? null : null}
                  dateLabel={item.dateLabel ?? null}
                  isWatched={activeTab === "watched"}
                />
              </PressableScale>
            </SwipeActionCard>
          </View>
        )}
        contentContainerClassName="pt-2 pb-6"
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground">
              {activeTab === "watched"
                ? "No watched movies yet"
                : "Your watchlist is empty"}
            </Text>
          </View>
        }
      />

      <MediaDetailSheet
        isOpen={selectedItem !== null}
        mediaId={selectedItem?.media?.tmdb_id ?? null}
        mediaType={(selectedItem?.media?.media_type ?? "movie") as "movie" | "series"}
        fallbackTitle={selectedItem?.media?.title ?? undefined}
        fallbackPoster={selectedItem?.media?.poster_path ?? null}
        fallbackOverview={selectedItem?.media?.overview ?? null}
        fallbackReleaseDate={selectedItem?.media?.release_date ?? null}
        fallbackTmdbRating={selectedItem?.media?.tmdb_rating ?? null}
        isInWatchlist={activeTab === "watchlist"}
        isWatched={activeTab === "watched"}
        watchedRating={
          activeTab === "watched" ? (selectedItem as WatchedMoviePublic | null)?.rating ?? null : null
        }
        collections={[]}
        onAddToWatchlist={() => {}}
        onMarkWatched={() => {}}
        onAddToCollection={() => {}}
        onClose={() => setSelectedItem(null)}
      />
    </SafeAreaView>
  );
}
