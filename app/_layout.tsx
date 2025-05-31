// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar'; // StatusBarをインポート
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClothingProvider } from '../contexts/ClothingContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TabResetProvider } from '../contexts/TabResetContext';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import Onboarding from '../components/Onboarding';
import { useTheme } from "@/contexts/ThemeContext";

// Main app component with navigation
function MainApp() {
  const { isOnboardingComplete } = useOnboarding();
  const colorScheme = useColorScheme(); // 現在のカラースキーム（ライト/ダーク）を取得
  const theme = useTheme(); // テーマの取得

  // If onboarding is not complete, show the onboarding screen
  if (!isOnboardingComplete) {
    return (
      <>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Onboarding />
      </>
    );
  }

  // Otherwise, show the main app
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{
        // ヘッダーの共通スタイル
        headerTitleStyle: {
          fontWeight: "600",
          color: theme.text,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerBackTitleStyle: {
          color: theme.text,
        },
        headerTintColor: Platform.select({
          android: colorScheme === 'dark' ? 'white' : theme.text,
          ios: undefined, // iOSはデフォルトの青色を使用
        }),
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="item/[id]"
          options={{
            title: "アイテム詳細",
            headerBackTitle: "戻る"
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: "アイテム追加",
            animation: "slide_from_bottom",
            presentation: "modal", // モーダル表示にする
            // iOSでのスワイプジェスチャーを無効化
            gestureEnabled: false,
            // Androidで戻るボタンを非表示に
            headerLeft: () => null,
            headerShown: true,
            // Android固有の設定
            ...Platform.select({
              android: {
                headerBackVisible: false,  // Androidで戻るボタンを非表示
              },
            }),
          }}
        />
        <Stack.Screen
          name="ranking"
          options={{
            title: "着用回数ランキング",
            headerBackTitle: "戻る"
          }}
        />
        <Stack.Screen
          name="efficiency"
          options={{
            title: "洗濯効率分析",
            headerBackTitle: "戻る"
          }}
        />
        <Stack.Screen
          name="impact"
          options={{
            title: "環境影響・節約効果",
            headerBackTitle: "戻る"
          }}
        />
        <Stack.Screen
          name="badges"
          options={{
            title: "バッジ・アチーブメント",
            headerBackTitle: "戻る"
          }}
        />
        <Stack.Screen
            name="badges-overview"
            options={{
                title: "バッジコレクション",
                headerBackTitle: "戻る"
            }}
        />
        <Stack.Screen
          name="item/stats/[id]"
          options={{
            title: "アイテム詳細分析",
            headerBackTitle: "戻る"
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <OnboardingProvider>
        <ClothingProvider>
          <ThemeProvider>
            <TabResetProvider>
              <MainApp />
            </TabResetProvider>
          </ThemeProvider>
        </ClothingProvider>
      </OnboardingProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
