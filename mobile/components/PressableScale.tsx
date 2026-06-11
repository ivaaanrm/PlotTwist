import { Pressable, type PressableProps } from "react-native";
import type { ReactNode } from "react";

type PressableScaleProps = PressableProps & {
  children: ReactNode;
  scale?: number;
  activeOpacity?: number;
  shadow?: boolean;
};

export function PressableScale({
  children,
  scale = 0.98,
  activeOpacity = 0.9,
  shadow = false,
  style,
  ...props
}: PressableScaleProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? scale : 1 }],
          opacity: pressed ? activeOpacity : 1,
          shadowColor: shadow ? "#000" : "transparent",
          shadowOpacity: shadow ? (pressed ? 0.12 : 0.06) : 0,
          shadowRadius: shadow ? (pressed ? 10 : 6) : 0,
          shadowOffset: shadow ? { width: 0, height: 4 } : { width: 0, height: 0 },
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {children}
    </Pressable>
  );
}
