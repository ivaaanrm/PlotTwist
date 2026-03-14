import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

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
import { UserAvatar } from "@/components/UserAvatar";
import { formatDate } from "@/lib/media";

type Tab = "watched" | "watchlist";
type WatchedSort = "date" | "title" | "rating";
type WatchlistSort = "date" | "title";

function SortPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: active ? "#27272a" : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: active ? "600" : "400",
          color: active ? "#fafafa" : "#71717a",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FollowListModal({
  visible,
  title,
  data,
  onClose,
}: {
  visible: boolean;
  title: string;
  data: FollowsWithUsersPublic | undefined;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090b" }} edges={["top"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#27272a",
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#fafafa" }}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <X size={22} color="#71717a" />
          </Pressable>
        </View>

        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#18181b",
                borderWidth: 1,
                borderColor: "#27272a",
              }}
            >
              <UserAvatar
                avatarId={item.user.avatar}
                displayName={item.user.full_name ?? item.user.username}
                size={40}
                iconSize={18}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fafafa" }}>
                  {item.user.full_name ?? item.user.username}
                </Text>
                <Text style={{ fontSize: 12, color: "#71717a" }}>
                  @{item.user.username}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: "#71717a" }}>No users yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("watched");
  const [watchedSort, setWatchedSort] = useState<WatchedSort>("date");
  const [watchlistSort, setWatchlistSort] = useState<WatchlistSort>("date");
  const [selectedItem, setSelectedItem] = useState<
    WatchedMoviePublic | WatchlistItemPublic | null
  >(null);
  const [followersModal, setFollowersModal] = useState(false);
  const [followingModal, setFollowingModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: watched } = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () =>
      api<WatchedMoviesPublic>("/collections/watched", {
        query: { skip: 0, limit: 500 },
      }),
  });

  const { data: watchlist } = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () =>
      api<WatchlistItemsPublic>("/collections/watchlist", {
        query: { skip: 0, limit: 500 },
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

  const sortedWatched = useMemo(() => {
    const items = [...(watched?.data ?? [])];
    if (watchedSort === "date") {
      return items.sort((a, b) =>
        (b.watched_at ?? "").localeCompare(a.watched_at ?? "")
      );
    }
    if (watchedSort === "title") {
      return items.sort((a, b) =>
        (a.media?.title ?? "").localeCompare(b.media?.title ?? "")
      );
    }
    if (watchedSort === "rating") {
      return items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return items;
  }, [watched?.data, watchedSort]);

  const sortedWatchlist = useMemo(() => {
    const items = [...(watchlist?.data ?? [])];
    if (watchlistSort === "date") {
      return items.sort((a, b) =>
        (b.added_at ?? "").localeCompare(a.added_at ?? "")
      );
    }
    if (watchlistSort === "title") {
      return items.sort((a, b) =>
        (a.media?.title ?? "").localeCompare(b.media?.title ?? "")
      );
    }
    return items;
  }, [watchlist?.data, watchlistSort]);

  const items =
    activeTab === "watched"
      ? sortedWatched.map((w) => ({
          id: w.id,
          media: w.media ?? null,
          raw: w,
          dateLabel: w.watched_at ? `Watched ${formatDate(w.watched_at)}` : null,
        }))
      : sortedWatchlist.map((w) => ({
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
    onMutate: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movies", "watched"] });
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const displayName = user?.full_name ?? user?.username ?? "";

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <PressableScale
              onPress={() => router.push("/settings")}
              scale={0.94}
            >
              <UserAvatar
                avatarId={user?.avatar}
                displayName={displayName}
                size={48}
                iconSize={22}
              />
            </PressableScale>
            <View>
              <Text className="text-lg font-bold text-foreground">
                {displayName}
              </Text>
              <Text className="text-sm text-muted-foreground">
                @{user?.username}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Settings size={20} color="#71717a" />
          </Pressable>
        </View>

        {/* Stats */}
        <View className="flex-row gap-5 flex-wrap">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFollowersModal(true);
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-sm text-muted-foreground">
              <Text className="font-semibold text-foreground">
                {followers?.count ?? 0}
              </Text>{" "}
              followers
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFollowingModal(true);
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-sm text-muted-foreground">
              <Text className="font-semibold text-foreground">
                {following?.count ?? 0}
              </Text>{" "}
              following
            </Text>
          </Pressable>

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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 items-center py-3 ${
              activeTab === tab ? "border-b-2 border-foreground" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sort pills */}
      <View className="flex-row px-3 py-2 gap-1">
        {activeTab === "watched" ? (
          <>
            <SortPill label="Date" active={watchedSort === "date"} onPress={() => setWatchedSort("date")} />
            <SortPill label="Title" active={watchedSort === "title"} onPress={() => setWatchedSort("title")} />
            <SortPill label="Rating" active={watchedSort === "rating"} onPress={() => setWatchedSort("rating")} />
          </>
        ) : (
          <>
            <SortPill label="Date" active={watchlistSort === "date"} onPress={() => setWatchlistSort("date")} />
            <SortPill label="Title" active={watchlistSort === "title"} onPress={() => setWatchlistSort("title")} />
          </>
        )}
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
              rightIcon="trash"
              onSwipeLeft={() => removeMutation.mutate(item.id)}
            >
              <PressableScale
                onPress={() => setSelectedItem(item.raw)}
                scale={0.985}
                shadow
              >
                <ProfileListRow
                  media={item.media}
                  rating={activeTab === "watched" ? (item.raw as WatchedMoviePublic).rating ?? null : null}
                  dateLabel={item.dateLabel ?? null}
                  isWatched={activeTab === "watched"}
                />
              </PressableScale>
            </SwipeActionCard>
          </View>
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground text-sm">
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
        mediaType={
          (selectedItem?.media?.media_type ?? "movie") as "movie" | "series"
        }
        fallbackTitle={selectedItem?.media?.title ?? undefined}
        fallbackPoster={selectedItem?.media?.poster_path ?? null}
        fallbackOverview={selectedItem?.media?.overview ?? null}
        fallbackReleaseDate={selectedItem?.media?.release_date ?? null}
        fallbackTmdbRating={selectedItem?.media?.tmdb_rating ?? null}
        isInWatchlist={activeTab === "watchlist"}
        isWatched={activeTab === "watched"}
        watchedRating={
          activeTab === "watched"
            ? (selectedItem as WatchedMoviePublic | null)?.rating ?? null
            : null
        }
        collections={[]}
        onAddToWatchlist={() => {}}
        onMarkWatched={() => {}}
        onAddToCollection={() => {}}
        onClose={() => setSelectedItem(null)}
      />

      <FollowListModal
        visible={followersModal}
        title={`Followers (${followers?.count ?? 0})`}
        data={followers}
        onClose={() => setFollowersModal(false)}
      />

      <FollowListModal
        visible={followingModal}
        title={`Following (${following?.count ?? 0})`}
        data={following}
        onClose={() => setFollowingModal(false)}
      />
    </SafeAreaView>
  );
}
