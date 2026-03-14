import { useRef, type ReactNode } from "react";
import { Animated, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { BookmarkPlus, Star } from "lucide-react-native";

type SwipeActionCardProps = {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disableSwipeRight?: boolean;
  disableSwipeLeft?: boolean;
  leftLabel?: string;
  rightLabel?: string;
};

export function SwipeActionCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  disableSwipeRight,
  disableSwipeLeft,
  leftLabel = "Watchlist",
  rightLabel = "Watched",
}: SwipeActionCardProps) {
  const swipeRef = useRef<Swipeable>(null);
  const leftThreshold = disableSwipeRight ? 9999 : 40;
  const rightThreshold = disableSwipeLeft ? 9999 : 40;

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    if (disableSwipeRight) return null;
    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={{ opacity }} className="justify-center pl-4">
        <View className="w-24 h-14 rounded-xl bg-primary items-center justify-center gap-1">
          <BookmarkPlus size={18} color="#fafafa" />
          <Text className="text-[11px] font-semibold text-primary-foreground">
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
    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={{ opacity }} className="justify-center items-end pr-4">
        <View className="w-24 h-14 rounded-xl bg-secondary items-center justify-center gap-1">
          <Star size={18} color="#0f172a" />
          <Text className="text-[11px] font-semibold text-foreground">
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
          onSwipeRight?.();
        }
        swipeRef.current?.close();
      }}
      onSwipeableRightOpen={() => {
        if (!disableSwipeLeft) {
          onSwipeLeft?.();
        }
        swipeRef.current?.close();
      }}
      friction={2}
      containerStyle={{ paddingVertical: 4 }}
      enabled={!(disableSwipeRight && disableSwipeLeft)}
    >
      {children}
    </Swipeable>
  );
}
