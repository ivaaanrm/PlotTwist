import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronLeft } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-client";
import type { UpdatePassword, UserUpdateMe } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { UserAvatar } from "@/components/UserAvatar";
import { AVATARS } from "@/lib/avatars";

function AvatarPickerModal({
  visible,
  currentAvatarId,
  onClose,
  onSave,
  isSaving,
}: {
  visible: boolean;
  currentAvatarId?: string | null;
  onClose: () => void;
  onSave: (avatarId: string | null) => void;
  isSaving: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(currentAvatarId ?? null);
  const cols = 5;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090b" }} edges={["top"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#27272a",
          }}
        >
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontSize: 16, color: "#71717a" }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#fafafa" }}>
            Choose Avatar
          </Text>
          <Button
            onPress={() => onSave(selected)}
            loading={isSaving}
            disabled={isSaving || selected === currentAvatarId}
          >
            Save
          </Button>
        </View>

        <View style={{ flex: 1, padding: 24 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "center",
            }}
          >
            {AVATARS.map((def) => {
              const isSelected = selected === def.id;
              return (
                <Pressable
                  key={def.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelected(def.id);
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    position: "relative",
                  })}
                >
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: "#e11d48",
                      padding: isSelected ? 2 : 0,
                    }}
                  >
                    <UserAvatar
                      avatarId={def.id}
                      displayName={def.label}
                      size={56}
                      iconSize={24}
                    />
                  </View>
                  {isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#e11d48",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={12} color="#ffffff" />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#71717a",
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    {def.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const updateAvatarMutation = useMutation({
    mutationFn: (avatarId: string | null) =>
      api<UserUpdateMe>("/users/me", {
        method: "PATCH",
        body: { avatar: avatarId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setAvatarPickerVisible(false);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      api("/users/me/password", {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      Alert.alert("Success", "Password changed successfully.");
    },
    onError: () => {
      setPasswordError("Current password is incorrect.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api("/users/me", { method: "DELETE" }),
    onSuccess: () => logout(),
  });

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const handleChangePassword = () => {
    setPasswordError("");
    if (!currentPassword || !newPassword) {
      setPasswordError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  const displayName = user?.full_name ?? user?.username ?? "";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: "#09090b" },
          headerTintColor: "#fafafa",
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <ChevronLeft size={24} color="#fafafa" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <FlatList
          data={[]}
          renderItem={null}
          contentContainerStyle={{ padding: 16, gap: 24 }}
          ListHeaderComponent={
            <>
              {/* Avatar */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Avatar
                </Text>
                <View
                  style={{
                    backgroundColor: "#18181b",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#27272a",
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <UserAvatar
                    avatarId={user?.avatar}
                    displayName={displayName}
                    size={56}
                    iconSize={24}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#fafafa" }}>
                      {displayName}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#71717a" }}>
                      @{user?.username}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setAvatarPickerVisible(true)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: "#27272a",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#fafafa" }}>
                      Change
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Account Info */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Account
                </Text>
                <View
                  style={{
                    backgroundColor: "#18181b",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#27272a",
                    padding: 16,
                    gap: 14,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#71717a" }}>Name</Text>
                    <Text style={{ fontSize: 14, color: "#fafafa" }}>
                      {user?.full_name ?? "—"}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: "#27272a" }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#71717a" }}>Username</Text>
                    <Text style={{ fontSize: 14, color: "#fafafa" }}>
                      @{user?.username}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: "#27272a" }} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#71717a" }}>Email</Text>
                    <Text style={{ fontSize: 14, color: "#fafafa" }} numberOfLines={1}>
                      {user?.email}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Change Password */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Change Password
                </Text>
                <View
                  style={{
                    backgroundColor: "#18181b",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#27272a",
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <FormField
                    label="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    placeholder="Enter current password"
                  />
                  <FormField
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    placeholder="Enter new password"
                  />
                  <FormField
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    placeholder="Confirm new password"
                    error={passwordError}
                  />
                  <Button
                    onPress={handleChangePassword}
                    loading={changePasswordMutation.isPending}
                    variant="outline"
                  >
                    Update Password
                  </Button>
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 10 }}>
                <Button variant="outline" onPress={handleLogout}>
                  Sign Out
                </Button>
              </View>

              {/* Danger Zone */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Danger Zone
                </Text>
                <Button
                  variant="destructive"
                  onPress={handleDeleteAccount}
                  loading={deleteAccountMutation.isPending}
                >
                  Delete Account
                </Button>
              </View>
            </>
          }
        />
      </SafeAreaView>

      <AvatarPickerModal
        visible={avatarPickerVisible}
        currentAvatarId={user?.avatar}
        onClose={() => setAvatarPickerVisible(false)}
        onSave={(avatarId) => updateAvatarMutation.mutate(avatarId)}
        isSaving={updateAvatarMutation.isPending}
      />
    </>
  );
}
