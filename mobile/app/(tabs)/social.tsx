import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { PressableScale } from "@/components/PressableScale";
import { UserAvatar } from "@/components/UserAvatar";
import type {
  UsersPublic,
  UserPublic,
  FollowPublic,
  FollowRequestsPublic,
} from "@/lib/types";

function UserRow({ user }: { user: UserPublic }) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () =>
      api<FollowPublic>(`/follows/${user.id}`, { method: "POST" }),
    onMutate: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    },
  });

  return (
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
        avatarId={user.avatar}
        displayName={user.full_name ?? user.username}
        size={44}
        iconSize={20}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 14, fontWeight: "600", color: "#fafafa" }}
          numberOfLines={1}
        >
          {user.full_name ?? user.username}
        </Text>
        <Text style={{ fontSize: 12, color: "#71717a" }}>@{user.username}</Text>
      </View>
      <PressableScale
        onPress={() => followMutation.mutate()}
        disabled={followMutation.isPending || followMutation.isSuccess}
        className="bg-[#E11D48] px-4 py-2 rounded-full"
        scale={0.96}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#ffffff" }}>
          {followMutation.isSuccess
            ? "Requested"
            : followMutation.isPending
            ? "…"
            : "Follow"}
        </Text>
      </PressableScale>
    </View>
  );
}

export default function SocialScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  const { data: searchResults } = useQuery({
    queryKey: ["userSearch", debouncedQuery],
    queryFn: () =>
      api<UsersPublic>("/users/search", {
        query: { query: debouncedQuery, skip: 0, limit: 20 },
      }),
    enabled: debouncedQuery.length >= 1,
  });

  const { data: followRequests } = useQuery({
    queryKey: ["followRequests"],
    queryFn: () => api<FollowRequestsPublic>("/follows/requests"),
  });

  const requestCount = followRequests?.count ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
        <Input
          placeholder="Search users..."
          value={query}
          onChangeText={setQuery}
        />
        {requestCount > 0 ? (
          <View
            style={{
              backgroundColor: "#1c1917",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#e11d48",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: "#e11d48", fontWeight: "500" }}>
              {requestCount} pending follow request{requestCount > 1 ? "s" : ""} · check Notifications
            </Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={searchResults?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => <UserRow user={item} />}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground text-sm">
              {debouncedQuery
                ? "No users found"
                : "Search for people to follow"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
