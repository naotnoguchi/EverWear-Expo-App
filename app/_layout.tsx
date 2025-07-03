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

// Main app component with navigation and auth flow
function MainApp() {
  const { isOnboardingComplete } = useOnboarding();
  const { user, loading, isFirstLaunch, setFirstLaunchComplete, handleDeepLink } = useAuth();
  const { badgeNotifications, clearBadgeNotification } = useStatistics();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const theme = useTheme();
  
  const adaptedBadgeNotifications = React.useMemo(() =>
    badgeNotifications.map((n: any) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      imageUrl: n.iconName || n.imageUrl || '',
    })),
  [badgeNotifications]);

  // ディープリンクリスナーを設定
  useEffect(() => {
    // 初期URLを処理
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    getInitialURL();

    // リスナーを設定
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []); // handleDeepLinkを依存配列から削除

  // 認証状態の変更に基づくナビゲーション処理
  useEffect(() => {
    if (loading) {
      return; // ローディング中は何もしない
    }

    const inAuthGroup = segments[0] === 'auth';
    const isPublicScreen = segments[0] === 'webview';

    // 未ログインユーザーがauth画面以外にいる場合（publicScreenは除く）
    if (!user && !inAuthGroup && !isPublicScreen) {
    }

    // ログイン済みユーザーがauth画面にいる場合
    if (user && inAuthGroup) {
    }
  }, [user, loading, segments]);

  // Show loading state
  if (loading) {
    return null; // または適切なローディングインジケーター
  }
  
  // If onboarding is not complete, show the onboarding screen
  if (!isOnboardingComplete) {
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
  if (!user && !inAuthGroup && !isPublicScreen && !loading) {
    return <Redirect href="/auth/login" />;
  }

  // If user is authenticated and on auth screen, redirect to main app
  if (user && inAuthGroup && !loading) {
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
          name="auth/verify"
          options={{
            title: "確認コード入力",
            headerBackVisible: false,
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
        <Stack.Screen name="account" options={{ title: "アカウント管理", headerBackTitle: "戻る" }} />
        <Stack.Screen name="webview" options={{ headerBackTitle: "戻る" }} />
      </Stack>
      <BadgeNotificationManager 
        notifications={adaptedBadgeNotifications} 
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
