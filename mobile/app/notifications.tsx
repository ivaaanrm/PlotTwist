import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api-client";
import type { FollowRequestsPublic, FollowPublic } from "@/lib/types";
import { UserAvatar } from "@/components/UserAvatar";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["followRequests"],
    queryFn: () => api<FollowRequestsPublic>("/follows/requests"),
  });

  const respondMutation = useMutation({
    mutationFn: ({
      followId,
      status,
    }: {
      followId: string;
      status: "accepted" | "declined";
    }) =>
      api<FollowPublic>(`/follows/${followId}`, {
        method: "PATCH",
        body: { status },
      }),
    onMutate: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["followRequests"] });
      await queryClient.invalidateQueries({ queryKey: ["profile", "followers"] });
    },
  });

  const pendingRequests = requests?.data ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: "#09090b" },
          headerTintColor: "#fafafa",
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground text-sm">Loading…</Text>
          </View>
        ) : pendingRequests.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6 gap-3">
            <Text className="text-2xl font-bold text-foreground">All caught up</Text>
            <Text className="text-muted-foreground text-center">
              No pending follow requests
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.follow.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListHeaderComponent={
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fafafa" }}>
                  Follow Requests
                </Text>
                <Text style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>
                  {pendingRequests.length} pending request
                  {pendingRequests.length > 1 ? "s" : ""}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: "#18181b",
                  borderWidth: 1,
                  borderColor: "#27272a",
                }}
              >
                <UserAvatar
                  avatarId={item.requester.avatar}
                  displayName={item.requester.full_name ?? item.requester.username}
                  size={44}
                  iconSize={20}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: "#fafafa" }}
                    numberOfLines={1}
                  >
                    {item.requester.full_name ?? item.requester.username}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#71717a" }}>
                    @{item.requester.username} wants to follow you
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() =>
                      respondMutation.mutate({
                        followId: item.follow.id,
                        status: "accepted",
                      })
                    }
                    disabled={respondMutation.isPending}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#e11d48",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: respondMutation.isPending ? 0.5 : pressed ? 0.8 : 1,
                    })}
                  >
                    <Check size={18} color="#ffffff" />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      respondMutation.mutate({
                        followId: item.follow.id,
                        status: "declined",
                      })
                    }
                    disabled={respondMutation.isPending}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#18181b",
                      borderWidth: 1,
                      borderColor: "#27272a",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: respondMutation.isPending ? 0.5 : pressed ? 0.8 : 1,
                    })}
                  >
                    <X size={18} color="#71717a" />
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}
