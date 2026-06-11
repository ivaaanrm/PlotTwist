import { View, Text, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { api } from "@/lib/api-client";
import type { CollectionListPublic, CollectionPublic } from "@/lib/types";
import { TicketCard } from "@/components/TicketCard";

function CollectionCard({ collection }: { collection: CollectionPublic }) {
  const router = useRouter();
  const firstPoster = collection.cover_posters?.find(Boolean);

  return (
    <TicketCard
      title={collection.name}
      posterPath={firstPoster ?? null}
      onPress={() => router.push(`/(tabs)/collections/${collection.id}`)}
      meta={
        <View className="gap-1">
          {collection.description ? (
            <Text className="text-xs text-white/60" numberOfLines={1}>
              {collection.description}
            </Text>
          ) : null}
          <Text className="text-[11px] text-white/60">
            {collection.item_count} item{collection.item_count !== 1 ? "s" : ""}
            {collection.is_collaborative ? " · Collaborative" : ""}
          </Text>
        </View>
      }
    />
  );
}

export default function CollectionsScreen() {
  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      api<CollectionListPublic>("/collections/named", {
        query: { skip: 0, limit: 50 },
      }),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={collections?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pb-2">
            <CollectionCard collection={item} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground">
              {isLoading ? "Loading..." : "No collections yet"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
