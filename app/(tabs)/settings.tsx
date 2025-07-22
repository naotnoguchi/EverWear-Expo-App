import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import { formatDateLocalized } from "../../lib/dateUtils";
import { getContactUrl, getPrivacyUrl, getTermsUrl } from "../../lib/i18n";

export default function Settings() {
  // Expo Constantsのデバッグ出力を削除
  // バージョン情報をexpoConfigから取得
  const appVersion = Constants.expoConfig?.version ?? 'バージョン不明';
  
  // Get router
  const router = useRouter();
  
  // Get translation function
  const { t, i18n } = useTranslation();

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
        url: getTermsUrl(),
        title: t('settings.appInfo.terms')
      }
    });
  };

  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    router.push({
      pathname: "/webview",
      params: {
        url: getPrivacyUrl(),
        title: t('settings.appInfo.privacy')
      }
    });
  };

  // Handle feedback
  const handleFeedback = () => {
    router.push({
      pathname: "/webview",
      params: {
        url: getContactUrl(),
        title: t('settings.support.contact')
      }
    });
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      t('settings.actions.logout.title'),
      t('settings.actions.logout.message'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('settings.actions.logout.confirm'),
          onPress: async () => {
            try {
              await signOut();
              // The app will automatically redirect to the login screen
              // due to the auth state change and the logic in _layout.tsx
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.actions.logout.error'));
              console.error("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  // 匿名ユーザーのデータリセット処理
  const [isResetting, setIsResetting] = useState(false);

  const handleResetAnonymousData = async () => {
    Alert.alert(
      t('settings.actions.resetData.title'),
      t('settings.actions.resetData.message'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('settings.actions.resetData.confirm'),
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            try {
              await resetAnonymousData();
            } catch (error: any) {
              console.error("Reset error:", error);
              Alert.alert(
                t('common.error'), 
                t('settings.actions.resetData.error', { 
                  error: error.message || 'ネットワークエラーが発生しました' 
                }),
                [{ text: t('common.ok') }]
              );
            } finally {
              setIsResetting(false);
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
          <Text style={styles.sectionTitle}>{t('settings.account.title')}</Text>
          <View style={[styles.anonymousNotice, { 
            backgroundColor: theme.background === '#000000' ? '#2d1b1b' : '#FFF0F0',
            borderColor: '#e74c3c' 
          }]}>
            <Ionicons name="information-circle" size={24} color="#e74c3c" />
            <Text style={styles.anonymousNoticeText}>
              {t('settings.account.guest.status')}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, { borderBottomWidth: 0 }]} 
            onPress={() => router.push('/auth/link-account')}
          >
            <Ionicons name="person-add-outline" size={24} color="#3498db" />
            <Text style={styles.actionButtonText}>{t('settings.account.guest.register')}</Text>
          </TouchableOpacity>
          <Text style={styles.anonymousDescription}>
            {t('settings.account.guest.benefits')}
          </Text>
        </View>
      )}

      {/* 通常ユーザー向けアカウント管理 */}
      {!isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account.title')}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleAccountManagement}>
            <Ionicons name="person-outline" size={24} color="#3498db" />
            <Text style={styles.actionButtonText}>{t('settings.account.manage')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* プレミアムプラン - 匿名ユーザーには表示しない */}
      {!isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.premium.title')}</Text>

          {isPremium ? (
            // プレミアム契約済みの場合
            <View style={styles.premiumActiveContainer}>
              <View style={styles.premiumStatusHeader}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.premiumActiveTitle}>{t('settings.premium.active.member')}</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>{t('settings.premium.active.status')}</Text>
                </View>
              </View>

              <View style={styles.premiumInfoItem}>
                <Text style={styles.premiumInfoLabel}>{t('settings.premium.active.plan')}</Text>
                <Text style={styles.premiumInfoValue}>
                  {subscription.productId === process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID ? t('settings.premium.active.yearlyPlan') : t('settings.premium.active.monthlyPlan')}
                </Text>
              </View>

              {subscription.originalPurchaseDate && (
                <View style={styles.premiumInfoItem}>
                  <Text style={styles.premiumInfoLabel}>{t('settings.premium.active.originalPurchase')}</Text>
                  <Text style={styles.premiumInfoValue}>
                    {formatDateLocalized(subscription.originalPurchaseDate, i18n.language)}
                  </Text>
                </View>
              )}

              {subscription.latestPurchaseDate && (
                <View style={styles.premiumInfoItem}>
                  <Text style={styles.premiumInfoLabel}>{t('settings.premium.active.currentPurchase')}</Text>
                  <Text style={styles.premiumInfoValue}>
                    {formatDateLocalized(subscription.latestPurchaseDate, i18n.language)}
                  </Text>
                </View>
              )}

              {subscription.expirationDate && (
                <View style={styles.premiumInfoItem}>
                  <Text style={styles.premiumInfoLabel}>{t('settings.premium.active.nextRenewal')}</Text>
                  <Text style={styles.premiumInfoValue}>
                    {formatDateLocalized(subscription.expirationDate, i18n.language)}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.manageSubscriptionButton}
                onPress={() => router.push("/subscription")}
              >
                <Ionicons name="settings" size={20} color="#3498db" />
                <Text style={styles.manageSubscriptionText}>{t('settings.premium.active.manage')}</Text>
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
                <Text style={styles.actionButtonText}>{t('settings.premium.viewPlan')}</Text>
              </TouchableOpacity>
              <Text style={styles.premiumDescription}>
                {t('settings.premium.description')}
              </Text>
            </>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.appInfo.title')}</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('settings.appInfo.version')}</Text>
          <Text style={styles.infoValue}>{appVersion}</Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleTermsOfService}>
          <Ionicons name="document-text" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>{t('settings.appInfo.terms')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handlePrivacyPolicy}>
          <Ionicons name="shield-checkmark" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>{t('settings.appInfo.privacy')}</Text>
        </TouchableOpacity>
      </View>

      {/* サポート セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.support.title')}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleFeedback}>
          <Ionicons name="mail-outline" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>{t('settings.support.contact')}</Text>
        </TouchableOpacity>
      </View>

      {/* ログアウト/リセットボタン */}
      {isAnonymous ? (
        <TouchableOpacity
          style={[styles.resetButton, isResetting && { opacity: 0.6 }]}
          onPress={handleResetAnonymousData}
          disabled={isResetting}
        >
          {isResetting ? (
            <>
              <ActivityIndicator size="small" color="#d9534f" />
              <Text style={styles.resetButtonText}>{t('settings.actions.resetData.processing')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#d9534f" />
              <Text style={styles.resetButtonText}>{t('settings.actions.resetData.button')}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#d9534f" />
          <Text style={styles.logoutButtonText}>{t('settings.actions.logout.button')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('settings.footer')}
        </Text>
      </View>
    </ScrollView>
  );
}
