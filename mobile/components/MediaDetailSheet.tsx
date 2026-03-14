import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Calendar, FolderPlus, Star } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import type { CollectionPublic, MediaDetails, MediaType } from "@/lib/types";
import { api } from "@/lib/api-client";
import { backdropUrl, posterUrl, profileUrl } from "@/lib/image-urls";
import { formatDate, formatTmdbRating } from "@/lib/media";
import { RatingStars } from "@/components/RatingStars";
import { Button } from "@/components/ui/Button";
import { showCollectionPicker } from "@/lib/collection-picker";
import { logImageError } from "@/lib/image-debug";

const AMBER = "#f59e0b";

type MediaDetailSheetProps = {
  isOpen: boolean;
  initialShowRating?: boolean;
  mediaId: number | null;
  mediaType: MediaType;
  fallbackTitle?: string;
  fallbackPoster?: string | null;
  fallbackOverview?: string | null;
  fallbackReleaseDate?: string | null;
  fallbackTmdbRating?: number | null;
  isInWatchlist: boolean;
  isWatched: boolean;
  watchedRating?: number | null;
  collections: CollectionPublic[];
  onAddToWatchlist: () => void;
  onMarkWatched: (rating: number | null) => void;
  onAddToCollection: (collectionId: string) => void;
  onClose: () => void;
};

export function MediaDetailSheet({
  isOpen,
  initialShowRating = false,
  mediaId,
  mediaType,
  fallbackTitle,
  fallbackPoster,
  fallbackOverview,
  fallbackReleaseDate,
  fallbackTmdbRating,
  isInWatchlist,
  isWatched,
  watchedRating,
  collections,
  onAddToWatchlist,
  onMarkWatched,
  onAddToCollection,
  onClose,
}: MediaDetailSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["85%"], []);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState<number | null>(watchedRating ?? null);

  const { data, isLoading } = useQuery<MediaDetails>({
    queryKey: ["mediaDetails", mediaId, mediaType],
    queryFn: () =>
      api<MediaDetails>(`/movies/${mediaId}/details`, {
        query: { media_type: mediaType },
      }),
    enabled: isOpen && typeof mediaId === "number",
  });

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isOpen]);

  useEffect(() => {
    setRating(watchedRating ?? null);
    setShowRating(initialShowRating);
  }, [watchedRating, mediaId, initialShowRating]);

  const title = data?.title ?? fallbackTitle ?? "Untitled";
  const overview = data?.overview ?? fallbackOverview ?? "";
  const posterPath = data?.poster_path ?? fallbackPoster ?? null;
  const backdropPath = data?.backdrop_path ?? null;
  const posterUri = posterPath ? posterUrl(posterPath, "w342") : null;
  const backdropUri = backdropPath ? backdropUrl(backdropPath) : null;
  const releaseDate = data?.release_date ?? fallbackReleaseDate ?? "";
  const tmdbRating = formatTmdbRating(data?.rating ?? fallbackTmdbRating ?? null);

  const handleConfirmWatched = () => {
    if (typeof mediaId !== "number") return;
    onMarkWatched(rating);
    setShowRating(false);
    sheetRef.current?.dismiss();
  };

  const handleAddToCollection = () => {
    showCollectionPicker({
      collections,
      onSelect: onAddToCollection,
    });
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      enablePanDownToClose
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-4">
          {backdropUri ? (
            <Image
              source={{ uri: backdropUri }}
              className="w-full h-40"
              contentFit="cover"
              onError={(error) =>
                logImageError("detail backdrop", backdropUri, error)
              }
            />
          ) : null}

          <View className="px-4 gap-3">
            <View className="flex-row gap-4">
              <View className="w-28 h-40 rounded-xl overflow-hidden bg-muted">
                {posterUri ? (
                  <Image
                    source={{ uri: posterUri }}
                    className="w-full h-full"
                    contentFit="cover"
                    onError={(error) =>
                      logImageError("detail poster", posterUri, error)
                    }
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-xs text-muted-foreground">No poster</Text>
                  </View>
                )}
              </View>

              <View className="flex-1 gap-2">
                <Text className="text-xl font-bold text-foreground" numberOfLines={2}>
                  {title}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Calendar size={12} color="#71717a" />
                  <Text className="text-xs text-muted-foreground">
                    {formatDate(releaseDate) || "Unknown"}
                  </Text>
                </View>
                {tmdbRating ? (
                  <View className="flex-row items-center gap-1">
                    <Star size={12} color="#71717a" />
                    <Text className="text-xs text-muted-foreground">TMDB {tmdbRating}</Text>
                  </View>
                ) : null}
                {data?.genres?.length ? (
                  <View className="flex-row flex-wrap gap-1">
                    {data.genres.slice(0, 4).map((genre) => (
                      <View key={genre} className="border border-border rounded-full px-2 py-0.5">
                        <Text className="text-[10px] text-muted-foreground">{genre}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            {overview ? (
              <Text className="text-sm text-muted-foreground leading-5">
                {overview}
              </Text>
            ) : null}

            <View className="flex-row gap-2">
              <Pressable
                onPress={onAddToWatchlist}
                disabled={isInWatchlist || isWatched}
                className={`flex-1 items-center justify-center rounded-xl border px-3 py-2 ${
                  isInWatchlist || isWatched ? "border-border opacity-60" : "border-input"
                }`}
              >
                <Text className="text-sm font-medium text-foreground">
                  {isInWatchlist ? "In Watchlist" : "Watchlist"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowRating(true)}
                disabled={isWatched}
                className={`flex-1 items-center justify-center rounded-xl px-3 py-2 ${
                  isWatched ? "bg-secondary opacity-70" : "bg-primary"
                }`}
              >
                <Text className="text-sm font-medium text-primary-foreground">
                  {isWatched ? "Watched" : "Mark Watched"}
                </Text>
              </Pressable>
              {collections.length > 0 ? (
                <Pressable
                  onPress={handleAddToCollection}
                  className="items-center justify-center rounded-xl border border-input px-3"
                >
                  <FolderPlus size={16} color="#0f172a" />
                </Pressable>
              ) : null}
            </View>

            {showRating ? (
              <View className="gap-3 rounded-xl border border-border p-4">
                <Text className="text-sm font-semibold text-foreground">
                  Rate this
                </Text>
                <View className="items-center">
                  <RatingStars value={rating} onChange={setRating} size={24} />
                  <Text className="text-xs text-muted-foreground mt-2">
                    {rating === null ? "No rating" : `${rating.toFixed(1)} / 5`}
                  </Text>
                </View>
                <Button onPress={handleConfirmWatched}>
                  Confirm watched
                </Button>
              </View>
            ) : null}

            {isLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator size="small" color="#71717a" />
              </View>
            ) : null}

            {data?.cast?.length ? (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Cast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3 pr-4">
                    {data.cast.slice(0, 10).map((member) => (
                      <View key={member.id} className="w-16 items-center">
                        <View className="w-14 h-14 rounded-full overflow-hidden bg-muted">
                        {member.profile_path ? (
                          <Image
                            source={{ uri: profileUrl(member.profile_path)! }}
                            className="w-full h-full"
                            contentFit="cover"
                            onError={(error) =>
                              logImageError(
                                "detail cast",
                                profileUrl(member.profile_path),
                                error,
                              )
                            }
                          />
                          ) : (
                            <View className="flex-1 items-center justify-center">
                              <Text className="text-[10px] text-muted-foreground">No img</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[10px] text-foreground mt-1" numberOfLines={1}>
                          {member.name}
                        </Text>
                        {member.character ? (
                          <Text className="text-[9px] text-muted-foreground" numberOfLines={1}>
                            {member.character}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
