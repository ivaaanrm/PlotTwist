import { View, Text, FlatList, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api-client";
import type { FeedPublic, FeedItemPublic } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";
import { Image } from "expo-image";

function FeedCard({ item }: { item: FeedItemPublic }) {
  const media = item.collection_item.media;
  return (
    <View className="flex-row gap-3 px-4 py-3 border-b border-border">
      {media?.poster_path ? (
        <Image
          source={{ uri: posterUrl(media.poster_path, "w185")! }}
          className="w-16 h-24 rounded-md bg-muted"
          contentFit="cover"
        />
      ) : (
        <View className="w-16 h-24 rounded-md bg-muted items-center justify-center">
          <Text className="text-xs text-muted-foreground">No img</Text>
        </View>
      )}
      <View className="flex-1 justify-center gap-1">
        <Text className="text-sm text-muted-foreground">
          {item.user.full_name ?? item.user.username} watched
        </Text>
        <Text className="text-base font-semibold text-foreground">
          {media?.title ?? "Unknown"}
        </Text>
        {item.collection_item.rating ? (
          <Text className="text-sm text-muted-foreground">
            {"★".repeat(Math.round(item.collection_item.rating))}{" "}
            {item.collection_item.rating}/5
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const {
    data: feed,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["feed"],
    queryFn: () => api<FeedPublic>("/feed/", { query: { skip: 0, limit: 50 } }),
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={feed?.data ?? []}
        keyExtractor={(item) => item.collection_item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-muted-foreground">
              {isLoading ? "Loading..." : "No activity yet. Follow some people!"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
