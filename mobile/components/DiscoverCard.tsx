import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Calendar, FolderPlus, Plus, Star } from "lucide-react-native";

import type { MovieSearchResult } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";
import { formatDate } from "@/lib/media";
import { logImageError } from "@/lib/image-debug";

const AMBER = "#f59e0b";

type DiscoverCardProps = {
  movie: MovieSearchResult;
  isInWatchlist: boolean;
  isWatched: boolean;
  isAddingToWatchlist: boolean;
  isMarkingWatched: boolean;
  onPress: () => void;
  onAddToWatchlist: () => void;
  onMarkAsWatched: () => void;
  onAddToCollection: () => void;
  hasCollections: boolean;
};

export function DiscoverCard({
  movie,
  isInWatchlist,
  isWatched,
  isAddingToWatchlist,
  isMarkingWatched,
  onPress,
  onAddToWatchlist,
  onMarkAsWatched,
  onAddToCollection,
  hasCollections,
}: DiscoverCardProps) {
  const posterUri = movie.poster_path ? posterUrl(movie.poster_path, "w342") : null;

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <Pressable onPress={onPress} className="flex-row h-32">
        <View className="w-[86px] bg-muted">
          {posterUri ? (
            <Image
              source={{ uri: posterUri }}
              className="w-full h-full"
              contentFit="cover"
              onError={(error) => logImageError("discover poster", posterUri, error)}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-xs text-muted-foreground">No poster</Text>
            </View>
          )}
        </View>

        <View className="flex-1 p-3 justify-between">
          <View>
            <View className="flex-row items-start justify-between gap-2">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {movie.title}
              </Text>
              {typeof movie.rating === "number" ? (
                <View className="flex-row items-center gap-0.5">
                  <Star size={12} color={AMBER} fill={AMBER} />
                  <Text className="text-[11px] font-bold text-amber-600">
                    {movie.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="flex-row items-center gap-1">
                <Calendar size={10} color="#71717a" />
                <Text className="text-[11px] text-muted-foreground">
                  {formatDate(movie.release_date) || "Unknown"}
                </Text>
              </View>
              <View className="border border-border rounded-full px-2 py-0.5">
                <Text className="text-[9px] text-muted-foreground">
                  {movie.media_type === "series" ? "Series" : "Movie"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      <View className="flex-row gap-2 px-3 pb-3">
        <Pressable
          onPress={onAddToWatchlist}
          disabled={isInWatchlist || isWatched || isAddingToWatchlist}
          className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
            isInWatchlist || isWatched ? "border-border" : "border-input"
          } ${isInWatchlist || isWatched ? "opacity-60" : ""}`}
        >
          {isAddingToWatchlist ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <Plus size={12} color="#0f172a" />
          )}
          <Text className="text-[11px] font-medium text-foreground">
            {isInWatchlist ? "In Watchlist" : "Watchlist"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onMarkAsWatched}
          disabled={isWatched || isMarkingWatched}
          className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
            isWatched ? "bg-secondary" : "bg-primary"
          } ${isWatched ? "opacity-70" : ""}`}
        >
          {isMarkingWatched ? (
            <ActivityIndicator size="small" color="#fafafa" />
          ) : (
            <Star size={12} color="#fafafa" fill="#fafafa" />
          )}
          <Text className="text-[11px] font-medium text-primary-foreground">
            {isWatched ? "Watched" : "Watched"}
          </Text>
        </Pressable>

        {hasCollections ? (
          <Pressable
            onPress={onAddToCollection}
            className="flex-row items-center justify-center px-2.5 py-1.5 rounded-full border border-input"
          >
            <FolderPlus size={12} color="#0f172a" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
