import { Redirect, Tabs, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, View, TouchableOpacity } from "react-native";
import {
  Home,
  Search,
  User,
  Users,
  Library,
  Bell,
  Sparkles,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";

export default function TabsLayout() {
  const { user, isLoadingUser } = useAuth();
  const router = useRouter();

  if (isLoadingUser) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.foreground,
        tabBarInactiveTintColor: Colors.dark.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.dark.tabBar,
          borderTopColor: Colors.dark.border,
        },
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.foreground,
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerRight: () => (
          <View className="flex-row items-center pr-4 gap-4">
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Bell size={24} color={Colors.dark.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/social")}>
              <Users size={24} color={Colors.dark.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <User size={24} color={Colors.dark.foreground} />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="for-you"
        options={{
          title: "For You",
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collections/index"
        options={{
          title: "Collections",
          tabBarIcon: ({ color, size }) => (
            <Library size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collections/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null,
          title: "Social",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
