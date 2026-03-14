import { useRef, type ReactNode } from "react";
import { Animated, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { BookmarkPlus, Star, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

type SwipeActionCardProps = {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disableSwipeRight?: boolean;
  disableSwipeLeft?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  rightIcon?: "star" | "trash";
};

export function SwipeActionCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  disableSwipeRight,
  disableSwipeLeft,
  leftLabel = "Watchlist",
  rightLabel = "Watched",
  rightIcon = "star",
}: SwipeActionCardProps) {
  const swipeRef = useRef<Swipeable>(null);
  const leftThreshold = disableSwipeRight ? 9999 : 56;
  const rightThreshold = disableSwipeLeft ? 9999 : 56;

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    if (disableSwipeRight) return null;

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
      extrapolate: "clamp",
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{ opacity, transform: [{ scale }] }}
        className="justify-center pl-3"
      >
        <View className="w-20 h-16 rounded-2xl bg-[#E11D48] items-center justify-center gap-1.5">
          <BookmarkPlus size={20} color="#fff" />
          <Text className="text-[11px] font-semibold text-white tracking-wide">
            {leftLabel}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    if (disableSwipeLeft) return null;

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
      extrapolate: "clamp",
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: "clamp",
    });

    const isTrash = rightIcon === "trash";

    return (
      <Animated.View
        style={{ opacity, transform: [{ scale }] }}
        className="justify-center items-end pr-3"
      >
        <View
          className="w-20 h-16 rounded-2xl items-center justify-center gap-1.5"
          style={{ backgroundColor: isTrash ? "#450a0a" : "rgba(250,250,250,0.12)" }}
        >
          {isTrash ? (
            <Trash2 size={20} color="#f87171" />
          ) : (
            <Star size={20} color="#fafafa" />
          )}
          <Text
            className="text-[11px] font-semibold tracking-wide"
            style={{ color: isTrash ? "#f87171" : "#fafafa" }}
          >
            {rightLabel}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={leftThreshold}
      rightThreshold={rightThreshold}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableLeftOpen={() => {
        if (!disableSwipeRight) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeRight?.();
        }
        swipeRef.current?.close();
      }}
      onSwipeableRightOpen={() => {
        if (!disableSwipeLeft) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeLeft?.();
        }
        swipeRef.current?.close();
      }}
      friction={2}
      containerStyle={{ paddingVertical: 2 }}
      enabled={!(disableSwipeRight && disableSwipeLeft)}
    >
      {children}
    </Swipeable>
  );
}
