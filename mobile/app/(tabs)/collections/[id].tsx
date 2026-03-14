import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { api } from "@/lib/api-client";
import type { CollectionDetailPublic } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";
import { logImageError } from "@/lib/image-debug";

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => api<CollectionDetailPublic>(`/collections/named/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-xl font-bold text-foreground">
          {collection?.name}
        </Text>
        {collection?.description ? (
          <Text className="text-sm text-muted-foreground mt-1">
            {collection.description}
          </Text>
        ) : null}
        <Text className="text-xs text-muted-foreground mt-1">
          {collection?.items.length ?? 0} items
          {collection?.is_collaborative ? " · Collaborative" : ""}
        </Text>
      </View>
      <FlatList
        data={collection?.items ?? []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View className="flex-1 p-1.5">
            {item.media?.poster_path ? (
              <Image
                source={{ uri: posterUrl(item.media.poster_path, "w185")! }}
                className="aspect-[2/3] w-full rounded-md bg-muted"
                contentFit="cover"
                onError={(error) =>
                  logImageError(
                    "collection item",
                    posterUrl(item.media.poster_path, "w185"),
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
              {item.media?.title ?? "Unknown"}
            </Text>
          </View>
        )}
        contentContainerClassName="px-2 pt-2"
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground">
              This collection is empty
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
