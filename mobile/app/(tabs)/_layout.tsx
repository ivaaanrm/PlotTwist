import { Redirect, Tabs, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import {
  Home,
  Search,
  User,
  Users,
  Library,
  Bell,
  Sparkles,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import { Colors } from "@/constants/Colors";
import { api } from "@/lib/api-client";
import type { FollowRequestsPublic } from "@/lib/types";

function BellWithBadge({ color }: { color: string }) {
  const { data } = useQuery({
    queryKey: ["followRequests"],
    queryFn: () => api<FollowRequestsPublic>("/follows/requests"),
    refetchInterval: 60_000,
  });

  const count = data?.count ?? 0;

  return (
    <View style={{ position: "relative" }}>
      <Bell size={24} color={color} />
      {count > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#e11d48",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text
            style={{ fontSize: 9, fontWeight: "700", color: "#ffffff" }}
          >
            {count > 9 ? "9+" : String(count)}
          </Text>
        </View>
      )}
    </View>
  );
}

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
              <BellWithBadge color={Colors.dark.foreground} />
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
