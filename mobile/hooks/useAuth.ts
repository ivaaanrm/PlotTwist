import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api, setToken, clearToken, hasToken, APIError } from "@/lib/api-client";
import type { Token, UserMe, UserRegister } from "@/lib/types";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<UserMe | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const authenticated = await hasToken();
      if (!authenticated) return null;
      try {
        return await api<UserMe>("/users/me");
      } catch (e) {
        if (e instanceof APIError && (e.status === 401 || e.status === 403)) {
          await clearToken();
          return null;
        }
        throw e;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await api<Token>("/login/access-token", {
        method: "POST",
        formData: {
          username: data.username,
          password: data.password,
        },
        requiresAuth: false,
      });
      await setToken(response.access_token);
      // Fetch user immediately and populate cache so tabs layout
      // doesn't see stale null and redirect back to login
      const me = await api<UserMe>("/users/me");
      queryClient.setQueryData(["currentUser"], me);
    },
    onSuccess: () => {
      router.replace("/(tabs)");
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: UserRegister) => {
      await api("/users/signup", {
        method: "POST",
        body: data,
        requiresAuth: false,
      });
    },
    onSuccess: () => {
      router.replace("/(auth)/login");
    },
  });

  const logout = async () => {
    await clearToken();
    queryClient.clear();
    router.replace("/(auth)/login");
  };

  return {
    user,
    isLoadingUser,
    userError,
    loginMutation,
    signUpMutation,
    logout,
    isAuthenticated: !!user,
  };
}
