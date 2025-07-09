import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { usePremiumFeatures, usePurchase } from "../../contexts/PurchaseContext";
import { useTabReset } from "../../contexts/TabResetContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function Settings() {
  // Get router
  const router = useRouter();

  // Get auth functions
  const { signOut, isAnonymous, resetAnonymousData } = useAuth();

  // Get premium features and subscription info
  const { isPremium } = usePremiumFeatures();
  const { subscription } = usePurchase();

  // Get theme
  const theme = useTheme();

  // Create a ref for the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  const { registerResetFunction } = useTabReset();

  // Register the reset function with the TabResetContext
  useEffect(() => {
    registerResetFunction("settings", () => {
      // Scroll to the top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    });
  }, [registerResetFunction]);

  // Handle terms of service
  const handleTermsOfService = () => {
    router.push({
      pathname: "/webview",
      params: {
        url: "https://everwearapp.com/terms.html",
        title: "利用規約"
      }
    });
  };

  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    router.push({
      pathname: "/webview",
      params: {
        url: "https://everwearapp.com/privacy.html",
        title: "プライバシーポリシー"
      }
    });
  };

  // Handle feedback
  const FEEDBACK_URL = "https://forms.gle/wUCJnuHMkazHNF7B7";
  const handleFeedback = () => {
    router.push({
      pathname: "/webview",
      params: {
        url: FEEDBACK_URL,
        title: "お問い合わせ"
      }
    });
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "ログアウト",
      "本当にログアウトしますか？",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "ログアウト",
          onPress: async () => {
            try {
              await signOut();
              // The app will automatically redirect to the login screen
              // due to the auth state change and the logic in _layout.tsx
            } catch (error) {
              Alert.alert("エラー", "ログアウトに失敗しました");
              console.error("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  // 匿名ユーザーのデータリセット処理
  const handleResetAnonymousData = async () => {
    Alert.alert(
      "データリセット",
      "全てのデータが削除され、ログイン画面に戻ります。\n\nこの操作は取り消すことができません。",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "リセット",
          style: "destructive",
          onPress: async () => {
            try {
              await resetAnonymousData();
            } catch (error) {
              Alert.alert("エラー", "データリセットに失敗しました");
              console.error("Reset error:", error);
            }
          },
        },
      ]
    );
  };

  // Handle account management
  const handleAccountManagement = () => {
    router.push('/account');
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    section: {
      backgroundColor: theme.card,
      marginBottom: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    premiumButton: {
      borderBottomWidth: 0,
    },
    premiumDescription: {
      fontSize: 12,
      color: theme.text + "99", // Adding transparency for secondary text
      paddingHorizontal: 12,
      marginTop: 8,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.text,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    actionButtonText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    infoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoLabel: {
      fontSize: 16,
      color: theme.text,
    },
    infoValue: {
      fontSize: 16,
      color: theme.text + "99", // Adding transparency for secondary text
    },
    footer: {
      padding: 24,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: theme.text + "77", // Adding more transparency for footer text
      textAlign: "center",
    },
    premiumActiveContainer: {
      paddingVertical: 8,
    },
    premiumStatusHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    premiumActiveTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 8,
      marginRight: 8,
      color: theme.text,
    },
    premiumBadge: {
      backgroundColor: "#4CAF50",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    premiumBadgeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "white",
    },
    premiumInfoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    premiumInfoLabel: {
      fontSize: 16,
      color: theme.text,
    },
    premiumInfoValue: {
      fontSize: 16,
      color: theme.text + "99",
      fontWeight: "500",
    },
    manageSubscriptionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    manageSubscriptionText: {
      fontSize: 16,
      color: "#3498db",
      marginLeft: 8,
    },
    // 匿名ユーザー向けスタイル
    anonymousNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 12,
    },
    anonymousNoticeText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    anonymousDescription: {
      fontSize: 14,
      color: theme.text + "99",
      marginTop: 8,
      lineHeight: 20,
    },
    resetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 32,
      marginTop: 8,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "#d9534f",
      borderRadius: 8,
    },
    resetButtonText: {
      color: "#d9534f",
      fontSize: 16,
      marginLeft: 8,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 32,
      marginTop: 8,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "#d9534f",
      borderRadius: 8,
    },
    logoutButtonText: {
      color: "#d9534f",
      fontSize: 16,
      marginLeft: 8,
    },
  });

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingTop: 16 }}>

      {/* 匿名ユーザー向けアカウント案内 */}
      {isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={[styles.anonymousNotice, { 
            backgroundColor: theme.background === '#000000' ? '#2d1b1b' : '#FFF0F0',
            borderColor: '#e74c3c' 
          }]}>
            <Ionicons name="information-circle" size={24} color="#e74c3c" />
            <Text style={styles.anonymousNoticeText}>
              現在ゲストとして利用中です
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, { borderBottomWidth: 0 }]} 
            onPress={() => router.push('/auth/link-account')}
          >
            <Ionicons name="person-add-outline" size={24} color="#3498db" />
            <Text style={styles.actionButtonText}>アカウント登録</Text>
          </TouchableOpacity>
          <Text style={styles.anonymousDescription}>
            アカウント登録すると：{'\n'}
            • 長期間経過してもデータが安全に保存されます{'\n'}
            • 複数端末でデータを同期できます{'\n'}
            • プレミアム機能(無制限のアイテム登録)を購入できます
          </Text>
        </View>
      )}

      {/* 通常ユーザー向けアカウント管理 */}
      {!isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleAccountManagement}>
            <Ionicons name="person-outline" size={24} color="#3498db" />
            <Text style={styles.actionButtonText}>アカウント管理</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* プレミアムプラン - 匿名ユーザーには表示しない */}
      {!isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プレミアムプラン</Text>

          {isPremium ? (
            // プレミアム契約済みの場合
            <View style={styles.premiumActiveContainer}>
              <View style={styles.premiumStatusHeader}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.premiumActiveTitle}>プレミアム会員</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>有効</Text>
                </View>
              </View>

              <View style={styles.premiumInfoItem}>
                <Text style={styles.premiumInfoLabel}>契約プラン</Text>
                <Text style={styles.premiumInfoValue}>
                  {subscription.productId === process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID ? '年額プラン' : '月額プラン'}
                </Text>
              </View>

              {subscription.originalPurchaseDate && (
                <View style={styles.premiumInfoItem}>
                  <Text style={styles.premiumInfoLabel}>初回契約開始日</Text>
                  <Text style={styles.premiumInfoValue}>
                    {subscription.originalPurchaseDate.toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              )}

              {subscription.latestPurchaseDate && (
                <View style={styles.premiumInfoItem}>
                  <Text style={styles.premiumInfoLabel}>現在の契約開始日</Text>
                  <Text style={styles.premiumInfoValue}>
                    {subscription.latestPurchaseDate.toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              )}

              {subscription.expirationDate && (
                <View style={styles.premiumInfoItem}>
                  <Text style={styles.premiumInfoLabel}>次回更新日</Text>
                  <Text style={styles.premiumInfoValue}>
                    {subscription.expirationDate.toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.manageSubscriptionButton}
                onPress={() => router.push("/subscription")}
              >
                <Ionicons name="settings" size={20} color="#3498db" />
                <Text style={styles.manageSubscriptionText}>契約管理</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // 無料プランの場合
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.premiumButton]} 
                onPress={() => router.push("/subscription")}
              >
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.actionButtonText}>プレミアムプランを見る</Text>
              </TouchableOpacity>
              <Text style={styles.premiumDescription}>
                プレミアムプランでは、アイテム登録数の制限解除（無料プランは5件まで）などの特典があります。
              </Text>
            </>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>バージョン</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleTermsOfService}>
          <Ionicons name="document-text" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>利用規約</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handlePrivacyPolicy}>
          <Ionicons name="shield-checkmark" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>プライバシーポリシー</Text>
        </TouchableOpacity>
      </View>

      {/* サポート セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>サポート</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleFeedback}>
          <Ionicons name="mail-outline" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>お問い合わせ</Text>
        </TouchableOpacity>
      </View>

      {/* ログアウト/リセットボタン */}
      {isAnonymous ? (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetAnonymousData}
        >
          <Ionicons name="refresh" size={20} color="#d9534f" />
          <Text style={styles.resetButtonText}>データをリセット</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#d9534f" />
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 EverWear All Rights Reserved
        </Text>
      </View>
    </ScrollView>
  );
}
