import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api-client";
import type { Message } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);

  const passwordsMatch = password === confirmPassword;

  const resetMutation = useMutation({
    mutationFn: () =>
      api<Message>("/reset-password/", {
        method: "POST",
        body: { token, new_password: password },
        requiresAuth: false,
      }),
    onSuccess: () => setDone(true),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-8">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-foreground">
                Set New Password
              </Text>
              <Text className="text-base text-muted-foreground">
                {done
                  ? "Your password has been updated."
                  : "Enter your new password below."}
              </Text>
            </View>

            {!done ? (
              <>
                <View className="gap-4">
                  <FormField
                    label="New Password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <FormField
                    label="Confirm Password"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    error={
                      confirmPassword && !passwordsMatch
                        ? "Passwords don't match"
                        : resetMutation.isError
                          ? resetMutation.error?.message
                          : undefined
                    }
                  />
                </View>
                <Button
                  onPress={() => resetMutation.mutate()}
                  loading={resetMutation.isPending}
                  disabled={!password || !confirmPassword || !passwordsMatch}
                >
                  Reset Password
                </Button>
              </>
            ) : (
              <Button onPress={() => router.replace("/(auth)/login")}>
                Back to Sign In
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
