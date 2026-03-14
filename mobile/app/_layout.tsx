import "../global.css";
import "@/lib/nativewind";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { queryClient } from "@/lib/query-client";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme("dark");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="notifications" 
              options={{ 
                headerShown: true, 
                title: "Notifications",
                headerStyle: { backgroundColor: "#09090b" },
                headerTintColor: "#fafafa",
              }} 
            />
          </Stack>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
