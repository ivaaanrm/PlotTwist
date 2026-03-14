import { Text, View } from "react-native";
import { Star } from "lucide-react-native";

import type { FeedItemPublic } from "@/lib/types";
import { formatRating, formatRelativeTime, formatTmdbRating } from "@/lib/media";
import { TicketCard } from "@/components/TicketCard";

const AMBER = "#f59e0b";

type FeedTicketCardProps = {
  item: FeedItemPublic;
  currentUserId?: string;
  currentUserRating?: number | null;
  onPress: () => void;
};

export function FeedTicketCard({
  item,
  currentUserId,
  currentUserRating,
  onPress,
}: FeedTicketCardProps) {
  const user = item.user;
  const ci = item.collection_item;
  const media = ci.media;
  const displayName = user.full_name || user.username;
  const userRating = formatRating(ci.rating);
  const tmdbRating = formatTmdbRating(media?.tmdb_rating);
  const watchedDate = formatRelativeTime(ci.created_at);

  const isMine = currentUserId === user.id;
  const myRatingFormatted = formatRating(currentUserRating ?? null);

  return (
    <TicketCard
      title={media?.title ?? "Untitled"}
      posterPath={media?.poster_path}
      onPress={onPress}
      meta={
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className="w-4 h-4 rounded-full bg-white/15 items-center justify-center">
            <Text className="text-[7px] font-semibold text-white">
              {displayName?.[0]?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <Text className="text-xs font-medium text-white/70" numberOfLines={1}>
            @{user.username}
          </Text>
          {watchedDate ? (
            <Text className="text-[10px] text-white/60">
              {watchedDate}
            </Text>
          ) : null}
        </View>
      }
      ratingRow={
        <View className="flex-row items-center gap-2 flex-wrap">
          {userRating ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color={AMBER} fill={AMBER} />
              <Text className="text-[11px] font-semibold text-amber-400">
                {userRating}
              </Text>
              <Text className="text-[9px] text-white/60 uppercase">
                {isMine ? "YOU" : user.username.substring(0, 5)}
              </Text>
            </View>
          ) : null}
          {!isMine && myRatingFormatted ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#f9fafb" fill="#f9fafb" />
              <Text className="text-[11px] font-semibold text-white">
                {myRatingFormatted}
              </Text>
              <Text className="text-[9px] text-white/60 uppercase">YOU</Text>
            </View>
          ) : null}
          {tmdbRating ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#9ca3af" />
              <Text className="text-[11px] font-semibold text-white">
                {tmdbRating}
              </Text>
              <Text className="text-[9px] text-white/60 uppercase">TMDB</Text>
            </View>
          ) : null}
        </View>
      }
    />
  );
}
