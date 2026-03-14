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

export default function SignupScreen() {
  const { signUpMutation } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = password === confirmPassword;

  const handleSignup = () => {
    if (!passwordsMatch) return;
    signUpMutation.mutate({
      email,
      username,
      full_name: fullName || undefined,
      password,
    });
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
                Create Account
              </Text>
              <Text className="text-base text-muted-foreground">
                Join PlotTwist to track your movies
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
              />
              <FormField
                label="Username"
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
              />
              <FormField
                label="Full Name"
                placeholder="Your name (optional)"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
              />
              <FormField
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <FormField
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={
                  confirmPassword && !passwordsMatch
                    ? "Passwords don't match"
                    : signUpMutation.isError
                      ? signUpMutation.error?.message
                      : undefined
                }
              />
            </View>

            <Button
              onPress={handleSignup}
              loading={signUpMutation.isPending}
              disabled={
                !email || !username || !password || !confirmPassword || !passwordsMatch
              }
            >
              Create Account
            </Button>

            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-sm text-muted-foreground">
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-sm font-semibold text-foreground">
                    Sign in
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
