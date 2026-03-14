import { View, Text, Alert, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: "#09090b" },
          headerTintColor: "#fafafa",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fafafa" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <View className="px-4 pt-6 gap-6">
          {/* Account Info */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Account</Text>
            <View className="bg-card rounded-lg border border-border p-4 gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Name</Text>
                <Text className="text-sm text-foreground">
                  {user?.full_name ?? "—"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Username</Text>
                <Text className="text-sm text-foreground">
                  @{user?.username}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Email</Text>
                <Text className="text-sm text-foreground">{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3">
            <Button variant="outline" onPress={handleLogout}>
              Sign Out
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
