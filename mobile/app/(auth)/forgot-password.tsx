import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api-client";
import type { Message } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const recoverMutation = useMutation({
    mutationFn: (email: string) =>
      api<Message>(`/password-recovery/${email}`, {
        method: "POST",
        requiresAuth: false,
      }),
    onSuccess: () => setSent(true),
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
                Reset Password
              </Text>
              <Text className="text-base text-muted-foreground">
                {sent
                  ? "Check your email for a reset link."
                  : "Enter your email and we'll send you a reset link."}
              </Text>
            </View>

            {!sent ? (
              <>
                <FormField
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  error={
                    recoverMutation.isError
                      ? recoverMutation.error?.message
                      : undefined
                  }
                />
                <Button
                  onPress={() => recoverMutation.mutate(email)}
                  loading={recoverMutation.isPending}
                  disabled={!email}
                >
                  Send Reset Link
                </Button>
              </>
            ) : (
              <Button onPress={() => router.back()}>
                Back to Sign In
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
