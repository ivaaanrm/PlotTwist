import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Star } from "lucide-react-native";

import type { MoviePublic } from "@/lib/types";
import { posterUrl } from "@/lib/image-urls";
import { logImageError } from "@/lib/image-debug";
import { formatDate, formatRating, formatTmdbRating } from "@/lib/media";

type ProfileListRowProps = {
  media: MoviePublic | null | undefined;
  rating?: number | null;
  dateLabel?: string | null;
  isWatched?: boolean;
};

const AMBER = "#f59e0b";

export function ProfileListRow({
  media,
  rating,
  dateLabel,
  isWatched,
}: ProfileListRowProps) {
  const userRating = formatRating(rating ?? null);
  const tmdbRating = formatTmdbRating(media?.tmdb_rating);

  return (
    <View className="flex-row items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card">
      <View className="w-[64px] h-[86px] rounded-xl overflow-hidden bg-muted">
        {media?.poster_path ? (
          <Image
            source={{ uri: posterUrl(media.poster_path, "w185")! }}
            className="w-full h-full"
            contentFit="cover"
            onError={(error) =>
              logImageError(
                "profile row poster",
                posterUrl(media.poster_path, "w185"),
                error,
              )
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xs text-muted-foreground">No img</Text>
          </View>
        )}
      </View>

      <View className="flex-1 gap-1">
        <Text className="text-[14px] font-semibold text-foreground" numberOfLines={1}>
          {media?.title ?? "Unknown"}
        </Text>
        {dateLabel ? (
          <Text className="text-[11px] text-muted-foreground">{dateLabel}</Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          {isWatched && userRating ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color={AMBER} fill={AMBER} />
              <Text className="text-[11px] font-semibold text-amber-600">
                {userRating}
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
        </View>
      </View>
    </View>
  );
}
