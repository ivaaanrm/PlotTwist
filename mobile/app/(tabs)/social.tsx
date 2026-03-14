import { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
    <View className="flex-row items-center px-4 py-3 border-b border-border">
      <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-3">
        <Text className="text-base font-semibold text-secondary-foreground">
          {(user.full_name ?? user.username)?.[0]?.toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground">
          {user.full_name ?? user.username}
        </Text>
        <Text className="text-sm text-muted-foreground">@{user.username}</Text>
      </View>
      <Pressable
        onPress={() => followMutation.mutate()}
        disabled={followMutation.isPending}
        className="bg-primary px-4 py-1.5 rounded-lg"
      >
        <Text className="text-sm font-medium text-primary-foreground">
          {followMutation.isPending ? "..." : "Follow"}
        </Text>
      </Pressable>
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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
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
        renderItem={({ item }) => <UserRow user={item} />}
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
