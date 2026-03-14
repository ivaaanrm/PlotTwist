import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import type { MovieSearchResponse, MovieSearchResult } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";

function MovieCard({ movie }: { movie: MovieSearchResult }) {
  return (
    <View className="flex-1 p-2">
      {movie.poster_path ? (
        <Image
          source={{ uri: posterUrl(movie.poster_path, "w342")! }}
          className="aspect-[2/3] w-full rounded-lg bg-muted"
          contentFit="cover"
        />
      ) : (
        <View className="aspect-[2/3] w-full rounded-lg bg-muted items-center justify-center">
          <Text className="text-xs text-muted-foreground">No poster</Text>
        </View>
      )}
      <Text className="mt-1 text-sm font-medium text-foreground" numberOfLines={1}>
        {movie.title}
      </Text>
      {movie.release_date ? (
        <Text className="text-xs text-muted-foreground">
          {movie.release_date.slice(0, 4)}
        </Text>
      ) : null}
    </View>
  );
}

export default function DiscoverScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () =>
      api<MovieSearchResponse>("/movies/trending", {
        query: { media_type: "movie" },
      }),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["movieSearch", debouncedQuery],
    queryFn: () =>
      api<MovieSearchResponse>("/movies/search", {
        query: { query: debouncedQuery, media_type: "movie" },
      }),
    enabled: debouncedQuery.length >= 2,
  });

  const movies = debouncedQuery.length >= 2
    ? searchResults?.results ?? []
    : trending?.results ?? [];

  const isLoading = debouncedQuery.length >= 2 ? searchLoading : trendingLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-3">
        <Input
          placeholder="Search movies..."
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={movies}
        keyExtractor={(item) => `${item.external_id}-${item.media_type}`}
        renderItem={({ item }) => <MovieCard movie={item} />}
        numColumns={3}
        contentContainerClassName="px-2"
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground">
              {isLoading ? "Loading..." : "No results found"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
