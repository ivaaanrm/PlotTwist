import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api-client";
import type { CollectionDetailPublic } from "@/lib/types";
import { TicketCard } from "@/components/TicketCard";

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
    <SafeAreaView className="flex-1 bg-background">
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
        renderItem={({ item }) => (
          <View className="px-4 pb-2">
            <TicketCard
              title={item.media?.title ?? "Unknown"}
              posterPath={item.media?.poster_path ?? null}
              meta={
                item.media?.release_date ? (
                  <Text className="text-xs text-white/60">
                    {item.media.release_date.slice(0, 4)}
                  </Text>
                ) : null
              }
            />
          </View>
        )}
        contentContainerClassName="pt-2 pb-6"
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
