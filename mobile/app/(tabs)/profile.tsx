import { View, Text, FlatList, Pressable } from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import { posterUrl } from "@/lib/image-urls";
import type { WatchedMoviesPublic, WatchlistItemsPublic } from "@/lib/types";
import { logImageError } from "@/lib/image-debug";

type Tab = "watched" | "watchlist";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("watched");

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

  const items =
    activeTab === "watched"
      ? (watched?.data ?? []).map((w) => ({
          id: w.id,
          title: w.media?.title ?? "Unknown",
          poster: w.media?.poster_path,
          subtitle: w.rating ? `${"★".repeat(Math.round(w.rating))} ${w.rating}` : undefined,
        }))
      : (watchlist?.data ?? []).map((w) => ({
          id: w.id,
          title: w.media?.title ?? "Unknown",
          poster: w.media?.poster_path,
          subtitle: w.media?.release_date?.slice(0, 4),
        }));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">
            {user?.full_name ?? user?.username}
          </Text>
          <Text className="text-sm text-muted-foreground">
            @{user?.username}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/settings")}>
          <Settings size={22} color="#fafafa" />
        </Pressable>
      </View>

      {/* Stats */}
      <View className="flex-row px-4 pb-3 gap-6">
        <Text className="text-sm text-muted-foreground">
          <Text className="font-semibold text-foreground">{watched?.count ?? 0}</Text> watched
        </Text>
        <Text className="text-sm text-muted-foreground">
          <Text className="font-semibold text-foreground">{watchlist?.count ?? 0}</Text> watchlist
        </Text>
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

      {/* Grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View className="flex-1 p-1.5">
            {item.poster ? (
              <Image
                source={{ uri: posterUrl(item.poster, "w185")! }}
                className="aspect-[2/3] w-full rounded-md bg-muted"
                contentFit="cover"
                onError={(error) =>
                  logImageError(
                    "profile poster",
                    posterUrl(item.poster, "w185"),
                    error,
                  )
                }
              />
            ) : (
              <View className="aspect-[2/3] w-full rounded-md bg-muted items-center justify-center">
                <Text className="text-xs text-muted-foreground">No img</Text>
              </View>
            )}
            <Text className="mt-0.5 text-xs text-foreground" numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text className="text-xs text-muted-foreground">{item.subtitle}</Text>
            ) : null}
          </View>
        )}
        contentContainerClassName="px-2 pt-2"
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
    </SafeAreaView>
  );
}
