import { Pressable, View } from "react-native";
import { Star } from "lucide-react-native";

const STAR_SIZE = 22;
const STAR_COLOR = "#f59e0b";
const STAR_MUTED = "#a1a1aa";

type RatingStarsProps = {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  disabled?: boolean;
};

function StarFill({ fill, size }: { fill: number; size: number }) {
  return (
    <View className="relative">
      <Star size={size} color={STAR_MUTED} />
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${Math.min(Math.max(fill, 0), 1) * 100}%`,
          overflow: "hidden",
        }}
      >
        <Star size={size} color={STAR_COLOR} fill={STAR_COLOR} />
      </View>
    </View>
  );
}

export function RatingStars({
  value,
  onChange,
  size = STAR_SIZE,
  disabled,
}: RatingStarsProps) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = value ? Math.min(Math.max(value - index, 0), 1) : 0;
        const leftValue = index + 0.5;
        const rightValue = index + 1;

        return (
          <View
            key={index}
            style={{ width: size, height: size }}
            className="mx-0.5"
          >
            <StarFill fill={fill} size={size} />
            <Pressable
              disabled={disabled}
              onPress={() => onChange?.(leftValue)}
              style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: size / 2 }}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${leftValue} stars`}
            />
            <Pressable
              disabled={disabled}
              onPress={() => onChange?.(rightValue)}
              style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: size / 2 }}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${rightValue} stars`}
            />
          </View>
        );
      })}
    </View>
  );
}
