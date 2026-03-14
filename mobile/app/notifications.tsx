import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground mb-2">Notifications</Text>
        <Text className="text-muted-foreground text-center">
          You're all caught up!
        </Text>
      </View>
    </SafeAreaView>
  );
}
