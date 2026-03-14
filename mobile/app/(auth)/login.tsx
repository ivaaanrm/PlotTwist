import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function LoginScreen() {
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    loginMutation.mutate({ username: email, password });
  };

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
                PlotTwist
              </Text>
              <Text className="text-base text-muted-foreground">
                Sign in to your account
              </Text>
            </View>

            <View className="gap-4">
              <FormField
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                error={
                  loginMutation.isError
                    ? loginMutation.error?.message
                    : undefined
                }
              />
              <FormField
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable>
                  <Text className="text-sm text-muted-foreground text-right">
                    Forgot password?
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Button
              onPress={handleLogin}
              loading={loginMutation.isPending}
              disabled={!email || !password}
            >
              Sign In
            </Button>

            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-sm text-muted-foreground">
                Don't have an account?
              </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <Text className="text-sm font-semibold text-foreground">
                    Sign up
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
