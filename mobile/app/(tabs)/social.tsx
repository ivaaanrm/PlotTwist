import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { PressableScale } from "@/components/PressableScale";
import { TicketCard } from "@/components/TicketCard";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    },
  });

  return (
    <TicketCard
      title={user.full_name ?? user.username}
      leftSlot={
        <View className="flex-1 items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
            <Text className="text-base font-semibold text-white">
              {(user.full_name ?? user.username)?.[0]?.toUpperCase()}
            </Text>
          </View>
        </View>
      }
      meta={<Text className="text-xs text-white/60">@{user.username}</Text>}
      rightSlot={
        <PressableScale
          onPress={() => followMutation.mutate()}
          disabled={followMutation.isPending}
          className="bg-[#E11D48] px-4 py-1.5 rounded-full"
          scale={0.97}
          activeOpacity={0.85}
        >
          <Text className="text-xs font-medium text-white">
            {followMutation.isPending ? "..." : "Follow"}
          </Text>
        </PressableScale>
      }
    />
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
      <View className="px-4 py-3 gap-2">
        <Input
          placeholder="Search users..."
          value={query}
          onChangeText={setQuery}
        />
        {requestCount > 0 ? (
          <Text className="text-sm text-muted-foreground">
            {requestCount} pending follow request{requestCount > 1 ? "s" : ""}
          </Text>
        ) : null}
      </View>
      <FlatList
        data={searchResults?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pb-2">
            <UserRow user={item} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-muted-foreground">
              {debouncedQuery ? "No users found" : "Search for people to follow"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
