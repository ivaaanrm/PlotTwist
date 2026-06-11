import { Star } from "lucide-react-native";

import type { MoviePublic } from "@/lib/types";
import { formatRating, formatTmdbRating } from "@/lib/media";
import { TicketCard } from "@/components/TicketCard";
import { Text, View } from "react-native";

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
    <TicketCard
      title={media?.title ?? "Unknown"}
      posterPath={media?.poster_path}
      meta={
        dateLabel ? (
          <Text className="text-[11px] text-white/60">{dateLabel}</Text>
        ) : null
      }
      ratingRow={
        <View className="flex-row items-center gap-2">
          {isWatched && userRating ? (
            <View className="flex-row items-center gap-1">
              <Star size={12} color={AMBER} fill={AMBER} />
              <Text className="text-[11px] font-semibold text-amber-400">
                {userRating}
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
