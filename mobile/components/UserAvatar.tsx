import { Text, View } from "react-native";
import { getAvatar } from "@/lib/avatars";

type UserAvatarProps = {
  avatarId?: string | null;
  displayName?: string | null;
  size?: number;
  iconSize?: number;
};

export function UserAvatar({
  avatarId,
  displayName,
  size = 48,
  iconSize = 22,
}: UserAvatarProps) {
  const def = getAvatar(avatarId);
  const initials = (displayName?.[0] ?? "?").toUpperCase();
  const bgColor = def?.color ?? "#27272a";

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {def ? (
        <def.icon size={iconSize} color="#ffffff" />
      ) : (
        <Text
          style={{
            fontSize: size * 0.38,
            fontWeight: "600",
            color: "#ffffff",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
