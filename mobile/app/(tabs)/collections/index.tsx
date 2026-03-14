import { View, Text, FlatList, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Image } from "expo-image";

import { api } from "@/lib/api-client";
import type { CollectionListPublic, CollectionPublic } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";

function CollectionCard({ collection }: { collection: CollectionPublic }) {
  const router = useRouter();
  const firstPoster = collection.cover_posters?.find(Boolean);

  return (
    <Pressable
      className="flex-row gap-3 px-4 py-3 border-b border-border"
      onPress={() => router.push(`/(tabs)/collections/${collection.id}`)}
    >
      {firstPoster ? (
        <Image
          source={{ uri: posterUrl(firstPoster, "w185")! }}
          className="w-14 h-20 rounded-md bg-muted"
          contentFit="cover"
        />
      ) : (
        <View className="w-14 h-20 rounded-md bg-muted items-center justify-center">
          <Text className="text-xs text-muted-foreground">No img</Text>
        </View>
      )}
      <View className="flex-1 justify-center gap-0.5">
        <Text className="text-base font-semibold text-foreground">
          {collection.name}
        </Text>
        {collection.description ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {collection.description}
          </Text>
        ) : null}
        <Text className="text-xs text-muted-foreground">
          {collection.item_count} item{collection.item_count !== 1 ? "s" : ""}
          {collection.is_collaborative ? " · Collaborative" : ""}
        </Text>
      </View>
    </Pressable>
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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={collections?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CollectionCard collection={item} />}
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
