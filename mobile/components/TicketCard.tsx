import { Text, View } from "react-native";
import { Image } from "expo-image";
import type { ReactNode } from "react";

import { PressableScale } from "@/components/PressableScale";
import { posterUrl, type PosterSize } from "@/lib/image-urls";
import { logImageError } from "@/lib/image-debug";

type TicketCardProps = {
  title: string;
  posterPath?: string | null;
  posterSize?: PosterSize;
  leftSlot?: ReactNode;
  meta?: ReactNode;
  ratingRow?: ReactNode;
  rightSlot?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function TicketCard({
  title,
  posterPath,
  posterSize = "w185",
  leftSlot,
  meta,
  ratingRow,
  rightSlot,
  onPress,
  disabled,
}: TicketCardProps) {
  const posterUri = posterPath ? posterUrl(posterPath, posterSize) : null;

  const content = (
      <View className="relative">
      <View className="flex-row items-stretch gap-2 pl-0 pr-3 h-[80px]">
        <View className="w-[58px] h-full rounded-l-2xl overflow-hidden bg-black/40">
        {leftSlot ? (
          leftSlot
        ) : posterUri ? (
          <Image
            source={{ uri: posterUri }}
            className="w-full h-full"
            contentFit="cover"
            onError={(error) =>
              logImageError("ticket poster", posterUri, error)
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xs text-white/60">No img</Text>
          </View>
        )}
        </View>

        <View className="w-px self-stretch my-2 border-l border-dashed border-white/10" />

        <View className="flex-1 min-w-0 justify-center gap-1 py-1">
          <Text className="text-[14px] font-semibold text-white" numberOfLines={1}>
            {title}
          </Text>
          {meta ? <View className="gap-1">{meta}</View> : null}
          {ratingRow ? <View className="gap-1">{ratingRow}</View> : null}
        </View>

        {rightSlot ? (
          <>
            <View className="w-px self-stretch my-2 border-l border-dashed border-white/10" />
            <View className="items-end justify-center px-2 py-1 rounded-lg bg-white/5 my-2">
              {rightSlot}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        scale={0.985}
        shadow
        className="rounded-2xl border border-white/10 bg-[#15151B] overflow-hidden"
        style={({ pressed }) => ({
          borderColor: pressed ? "rgba(225, 29, 72, 0.6)" : "rgba(255,255,255,0.1)",
        })}
      >
        {content}
      </PressableScale>
    );
  }

  return (
    <View className="rounded-2xl border border-white/10 bg-[#15151B] overflow-hidden">
      {content}
    </View>
  );
}
