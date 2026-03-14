import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Star } from "lucide-react-native";

import type { FeedItemPublic } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";
import { formatRating, formatRelativeTime, formatTmdbRating } from "@/lib/media";
import { logImageError } from "@/lib/image-debug";
import { PressableScale } from "@/components/PressableScale";

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

  const posterUri = media?.poster_path
    ? posterUrl(media.poster_path, "w185")
    : null;

  return (
    <PressableScale
      onPress={onPress}
      className="rounded-2xl border border-border bg-card overflow-hidden"
      scale={0.985}
      shadow
    >
      <View className="flex-row">
        <View className="w-[64px] h-[86px] bg-muted">
          {posterUri ? (
            <Image
              source={{ uri: posterUri }}
              className="w-full h-full"
              contentFit="cover"
              onError={(error) => logImageError("feed poster", posterUri, error)}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-xs text-muted-foreground">No img</Text>
            </View>
          )}
        </View>

        <View className="flex-1 px-2.5 py-2 justify-center gap-1">
          <Text className="text-[14px] font-bold text-foreground" numberOfLines={1}>
            {media?.title ?? "Untitled"}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-4 h-4 rounded-full bg-primary items-center justify-center">
              <Text className="text-[7px] font-semibold text-primary-foreground">
                {displayName?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
            <Text className="text-xs font-medium text-muted-foreground" numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {userRating ? (
              <View className="flex-row items-center gap-1">
                <Star size={12} color={AMBER} fill={AMBER} />
                <Text className="text-[11px] font-semibold text-amber-500">
                  {userRating}
                </Text>
                <Text className="text-[9px] text-muted-foreground uppercase">
                  {isMine ? "YOU" : user.username.substring(0, 5)}
                </Text>
              </View>
            ) : null}
            {!isMine && myRatingFormatted ? (
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#0f172a" fill="#0f172a" />
                <Text className="text-[11px] font-semibold text-foreground">
                  {myRatingFormatted}
                </Text>
                <Text className="text-[9px] text-muted-foreground uppercase">YOU</Text>
              </View>
            ) : null}
            {tmdbRating ? (
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#71717a" />
                <Text className="text-[11px] font-semibold text-foreground">
                  {tmdbRating}
                </Text>
                <Text className="text-[9px] text-muted-foreground uppercase">TMDB</Text>
              </View>
            ) : null}
            {watchedDate ? (
              <Text className="text-[10px] text-muted-foreground opacity-70">
                {watchedDate}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </PressableScale>
  );
}
