import { ActivityIndicator, Text, View } from "react-native";
import { Image } from "expo-image";
import { Calendar, FolderPlus, Plus, Star } from "lucide-react-native";

import type { MovieSearchResult } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";
import { formatDate } from "@/lib/media";
import { logImageError } from "@/lib/image-debug";
import { PressableScale } from "@/components/PressableScale";

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
      <PressableScale
        onPress={onPress}
        className="flex-row h-[90px]"
        scale={0.985}
        shadow
      >
        <View className="w-[64px] bg-muted">
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

        <View className="flex-1 px-2.5 py-2 justify-center gap-1">
          <View>
            <View className="flex-row items-start justify-between gap-2">
              <Text className="text-[14px] font-semibold text-foreground" numberOfLines={1}>
                {movie.title}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
              {typeof movie.rating === "number" ? (
                <View className="flex-row items-center gap-0.5">
                  <Star size={12} color={AMBER} fill={AMBER} />
                  <Text className="text-[11px] font-bold text-amber-600">
                    {movie.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
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
      </PressableScale>

      <View className="flex-row gap-2 px-3 pb-2 justify-end">
        <PressableScale
          onPress={onAddToWatchlist}
          disabled={isInWatchlist || isWatched || isAddingToWatchlist}
          className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
            isInWatchlist || isWatched ? "border-border" : "border-input"
          } ${isInWatchlist || isWatched ? "opacity-60" : ""}`}
          scale={0.97}
          activeOpacity={0.85}
        >
          {isAddingToWatchlist ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <Plus size={12} color="#0f172a" />
          )}
          <Text className="text-[11px] font-medium text-foreground">
            {isInWatchlist ? "In Watchlist" : "Watchlist"}
          </Text>
        </PressableScale>

        <PressableScale
          onPress={onMarkAsWatched}
          disabled={isWatched || isMarkingWatched}
          className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
            isWatched ? "bg-secondary" : "bg-primary"
          } ${isWatched ? "opacity-70" : ""}`}
          scale={0.97}
          activeOpacity={0.85}
        >
          {isMarkingWatched ? (
            <ActivityIndicator size="small" color="#fafafa" />
          ) : (
            <Star size={12} color="#fafafa" fill="#fafafa" />
          )}
          <Text className="text-[11px] font-medium text-primary-foreground">
            {isWatched ? "Watched" : "Watched"}
          </Text>
        </PressableScale>

        {hasCollections ? (
          <PressableScale
            onPress={onAddToCollection}
            className="flex-row items-center justify-center px-2.5 py-1.5 rounded-full border border-input"
            scale={0.97}
            activeOpacity={0.85}
          >
            <FolderPlus size={12} color="#0f172a" />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}
