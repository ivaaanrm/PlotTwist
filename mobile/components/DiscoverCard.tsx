import { ActivityIndicator, Text, View } from "react-native";
import { Calendar, FolderPlus, Plus, Star } from "lucide-react-native";

import type { MovieSearchResult } from "@/lib/types";
import { formatDate } from "@/lib/media";
import { PressableScale } from "@/components/PressableScale";
import { TicketCard } from "@/components/TicketCard";

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
  return (
    <TicketCard
      title={movie.title}
      posterPath={movie.poster_path}
      posterSize="w342"
      onPress={onPress}
      meta={
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className="flex-row items-center gap-1">
            <Calendar size={10} color="#9ca3af" />
            <Text className="text-[11px] text-white/60">
              {formatDate(movie.release_date) || "Unknown"}
            </Text>
          </View>
          <View className="border border-white/15 rounded-full px-2 py-0.5">
            <Text className="text-[9px] text-white/60">
              {movie.media_type === "series" ? "Series" : "Movie"}
            </Text>
          </View>
        </View>
      }
      ratingRow={
        typeof movie.rating === "number" ? (
          <View className="flex-row items-center gap-0.5">
            <Star size={12} color={AMBER} fill={AMBER} />
            <Text className="text-[11px] font-bold text-amber-400">
              {movie.rating.toFixed(1)}
            </Text>
          </View>
        ) : null
      }
      rightSlot={
        <View className="items-end gap-1">
          <PressableScale
            onPress={onAddToWatchlist}
            disabled={isInWatchlist || isWatched || isAddingToWatchlist}
            className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${
              isInWatchlist || isWatched ? "border-white/10" : "border-white/20"
            } ${isInWatchlist || isWatched ? "opacity-60" : ""}`}
            scale={0.97}
            activeOpacity={0.85}
          >
            {isAddingToWatchlist ? (
              <ActivityIndicator size="small" color="#fafafa" />
            ) : (
              <Plus size={12} color="#fafafa" />
            )}
            <Text className="text-[10px] font-medium text-white">
              {isInWatchlist ? "In Watchlist" : "Watchlist"}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={onMarkAsWatched}
            disabled={isWatched || isMarkingWatched}
            className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
              isWatched ? "bg-white/10" : "bg-[#E11D48]"
            } ${isWatched ? "opacity-70" : ""}`}
            scale={0.97}
            activeOpacity={0.85}
          >
            {isMarkingWatched ? (
              <ActivityIndicator size="small" color="#fafafa" />
            ) : (
              <Star size={12} color="#fafafa" fill="#fafafa" />
            )}
            <Text className="text-[10px] font-medium text-white">
              {isWatched ? "Watched" : "Watched"}
            </Text>
          </PressableScale>

          {hasCollections ? (
            <PressableScale
              onPress={onAddToCollection}
              className="flex-row items-center justify-center px-2.5 py-1 rounded-full border border-white/20"
              scale={0.97}
              activeOpacity={0.85}
            >
              <FolderPlus size={12} color="#fafafa" />
            </PressableScale>
          ) : null}
        </View>
      }
    />
  );
}
