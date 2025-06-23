// app/_layout.tsx
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import * as Linking from 'expo-linking';
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BadgeNotificationManager } from '../components/BadgeNotification';
import Onboarding from '../components/Onboarding';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ClothingProvider } from '../contexts/ClothingContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { PurchaseProvider } from '../contexts/PurchaseContext';
import { StatisticsProvider, useStatistics } from '../contexts/StatisticsContext';
import { TabResetProvider } from '../contexts/TabResetContext';

// app/_layout.tsx の先頭に追加
console.log('App starting...');

// Main app component with navigation and auth flow
function MainApp() {
  const { isOnboardingComplete } = useOnboarding();
  const { user, loading, isFirstLaunch, setFirstLaunchComplete, handleDeepLink } = useAuth();
  const { badgeNotifications, clearBadgeNotification } = useStatistics();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const theme = useTheme();

  // ディープリンクリスナーを設定
  useEffect(() => {
    // 初期URLを処理
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial URL:', initialUrl);
        handleDeepLink(initialUrl);
      }
    };

    getInitialURL();

    // リスナーを設定
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Received URL:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Show loading state
  if (loading) {
    console.log('App is loading...');
    return null; // または適切なローディングインジケーター
  }

  // If onboarding is not complete, show the onboarding screen
  if (!isOnboardingComplete) {
    console.log('Showing onboarding...');
    return (
      <>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Onboarding />
      </>
    );
  }

  // Check if we're already on an auth screen
  const inAuthGroup = segments[0] === 'auth';

  // 未ログインユーザが /webview にアクセスする場合は許可 (規約・ポリシー閲覧用)
  const isPublicScreen = segments[0] === 'webview';

  // If user is not authenticated and not already on auth screen or public screen, redirect to login
  if (!user && !inAuthGroup && !isPublicScreen) {
    console.log('No user, redirecting to login...');
    return <Redirect href="/auth/login" />;
  }

  // If user is authenticated and on auth screen, redirect to main app
  if (user && inAuthGroup) {
    console.log('User authenticated, redirecting to main app...');
    return <Redirect href="/" />;
  }

  // If this is the first launch and onboarding is complete, mark first launch as complete
  if (isFirstLaunch && isOnboardingComplete) {
    setFirstLaunchComplete();
  }

  // Show the appropriate content based on authentication state
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{
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
          ios: undefined,
        }),
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{
            title: "パスワードリセット",
            headerShown: false,
          }}
        />
        <Stack.Screen name="item/[id]" options={{ title: "アイテム詳細", headerBackTitle: "戻る" }} />
        <Stack.Screen
          name="add"
          options={{
            title: "アイテム追加",
            animation: "slide_from_bottom",
            presentation: "modal",
            gestureEnabled: false,
            headerLeft: () => null,
            headerShown: true,
            ...Platform.select({
              android: {
                headerBackVisible: false,
              },
            }),
          }}
        />
        <Stack.Screen name="ranking" options={{ title: "着用回数ランキング", headerBackTitle: "戻る" }} />
        <Stack.Screen name="efficiency" options={{ title: "洗濯効率分析", headerBackTitle: "戻る" }} />
        <Stack.Screen name="impact" options={{ title: "環境影響・節約効果", headerBackTitle: "戻る" }} />
        <Stack.Screen name="badges" options={{ title: "バッジ・アチーブメント", headerBackTitle: "戻る" }} />
        <Stack.Screen name="badges-overview" options={{ title: "バッジコレクション", headerBackTitle: "戻る" }} />
        <Stack.Screen name="item/stats/[id]" options={{ title: "アイテム詳細分析", headerBackTitle: "戻る" }} />
        <Stack.Screen name="subscription" options={{ title: "プレミアムプラン", headerBackTitle: "戻る" }} />
        <Stack.Screen name="webview" options={{ headerBackTitle: "戻る" }} />
      </Stack>
      <BadgeNotificationManager 
        notifications={badgeNotifications} 
        onDismiss={clearBadgeNotification} 
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <PurchaseProvider>
          <OnboardingProvider>
            <ClothingProvider>
              <ThemeProvider>
                <TabResetProvider>
                  <StatisticsProvider>
                    <MainApp />
                  </StatisticsProvider>
                </TabResetProvider>
              </ThemeProvider>
            </ClothingProvider>
          </OnboardingProvider>
        </PurchaseProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
