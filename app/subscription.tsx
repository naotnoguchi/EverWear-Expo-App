import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PurchasesPackage } from "react-native-purchases";
import { useAuth } from "../contexts/AuthContext";
import { usePremiumFeatures, usePurchase } from "../contexts/PurchaseContext";
import { useTheme } from "../contexts/ThemeContext";
import { getPrivacyUrl, getTermsUrl } from "../lib/i18n";

export default function SubscriptionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { subscription, offerings, loading, error, purchasePackage, restorePurchases, clearError, refreshOfferings } = usePurchase();
  const { isPremium } = usePremiumFeatures();
  const [purchasing, setPurchasing] = useState(false);
  const { isAnonymous } = useAuth();

  // 画面が表示される時にエラー状態をクリア
  useEffect(() => {
    clearError();
  }, [clearError]);

  // ログイン状態変化時にオファリング情報を再取得
  useEffect(() => {
    if (user?.id && !loading) {
      // ログインしているかつローディング中でない場合に、オファリング情報を確認
      if (offerings.length === 0) {
        console.log('User logged in but no offerings available, refreshing...');
        refreshOfferings();
      }
    }
  }, [user?.id, loading, offerings.length, refreshOfferings]);

  // 画面フォーカス時にオファリング情報を再取得（必要に応じて）
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !loading && offerings.length === 0) {
        console.log('Screen focused with no offerings, refreshing...');
        refreshOfferings();
      }
    }, [user?.id, loading, offerings.length, refreshOfferings])
  );

  const monthlyPackage = offerings
    .flatMap(offering => offering.availablePackages)
    .find(pkg => pkg.product.identifier === process.env.EXPO_PUBLIC_PREMIUM_MONTHLY_PRODUCT_ID);

  const yearlyPackage = offerings
    .flatMap(offering => offering.availablePackages)
    .find(pkg => pkg.product.identifier === process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID);

  // 月額・年額プランでは RevenueCat から返るローカライズ済みの priceString をそのまま使用する
  // 無料プランは端末のロケールに合わせて 0 をフォーマット
  const localeCurrencyCode = monthlyPackage?.product.currencyCode || yearlyPackage?.product.currencyCode || 'JPY';
  const freePlanPriceString = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: localeCurrencyCode,
  }).format(0);

  const monthlyDisplayPrice = monthlyPackage?.product.priceString || '-';
  const yearlyDisplayPrice = yearlyPackage?.product.priceString || '-';
  const yearlyMonthlyEquivalentDisplay = yearlyPackage
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: yearlyPackage.product.currencyCode,
      }).format(yearlyPackage.product.price / 12)
    : '-';

  // formatPrice は互換用途に残しておく（今後の削除候補）
  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    if (isAnonymous) {
      Alert.alert(
        t('subscription.alerts.accountRequired.title'),
        t('subscription.alerts.accountRequired.premium'),
        [
          { text: t('subscription.alerts.accountRequired.cancel'), style: "cancel" },
          { text: t('subscription.alerts.accountRequired.register'), onPress: () => router.push('/auth/link-account') }
        ]
      );
      return;
    }

    try {
      setPurchasing(true);
      await purchasePackage(packageToPurchase);

      Alert.alert(
        t('subscription.alerts.purchase.successTitle'),
        t('subscription.alerts.purchase.successMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Purchase error:', error);

      // キャンセルエラーの場合は何もしない（ユーザーが意図的にキャンセルしたため）
      const isCancelledError = error?.userCancelled === true || 
                              (error instanceof Error && error.message === 'Purchase was cancelled.');

      if (!isCancelledError) {
        Alert.alert(
          t('subscription.alerts.purchase.errorTitle'),
          t('subscription.alerts.purchase.errorMessage')
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isAnonymous) {
      Alert.alert(
        t('subscription.alerts.accountRequired.title'),
        t('subscription.alerts.accountRequired.restore'),
        [
          { text: t('subscription.alerts.accountRequired.cancel'), style: "cancel" },
          { text: t('subscription.alerts.accountRequired.register'), onPress: () => router.push('/auth/link-account') }
        ]
      );
      return;
    }

    try {
      setPurchasing(true);
      await restorePurchases();

      Alert.alert(
        t('subscription.alerts.restore.successTitle'),
        t('subscription.alerts.restore.successMessage')
      );
    } catch (error: any) {
      console.error('Restore error:', error);

      // キャンセルエラーの場合は何もしない
      const isCancelledError = error?.userCancelled === true || 
                              (error instanceof Error && error.message === 'Purchase was cancelled.');

      if (!isCancelledError) {
        Alert.alert(
          t('subscription.alerts.restore.errorTitle'),
          t('subscription.alerts.restore.errorMessage')
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleManageSubscription = () => {
    if (isAnonymous) {
      Alert.alert(
        t('subscription.alerts.accountRequired.title'),
        t('subscription.alerts.accountRequired.manage'),
        [
          { text: t('subscription.alerts.accountRequired.cancel'), style: "cancel" },
          { text: t('subscription.alerts.accountRequired.register'), onPress: () => router.push('/auth/link-account') }
        ]
      );
      return;
    }

    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions'
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.card,
      borderRadius: 8,
      margin: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 16,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.text + "99",
      marginTop: 8,
      textAlign: "center",
    },
    premiumBadge: {
      backgroundColor: "#FFD700",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 16,
    },
    premiumBadgeText: {
      color: "#000",
      fontWeight: "bold",
      fontSize: 14,
    },
    planSection: {
      backgroundColor: theme.card,
      borderRadius: 8,
      margin: 16,
      padding: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    section: {
      backgroundColor: theme.card,
      borderRadius: 8,
      margin: 16,
      padding: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.text,
    },
    planCard: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      marginBottom: 16,
      overflow: "hidden",
    },
    premiumCard: {
      borderColor: "#FFD700",
      borderWidth: 2,
    },
    planHeader: {
      padding: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    planTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
    },
    premiumTitle: {
      color: "#FFD700",
    },
    planPrice: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    yearlyPrice: {
      fontSize: 14,
      color: theme.text + "99",
      marginTop: 4,
    },
    planFeatures: {
      padding: 16,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    featureText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.text,
    },
    purchaseButton: {
      backgroundColor: "#3498db",
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 32,
      margin: 16,
      alignItems: "center",
    },
    purchaseButtonDisabled: {
      backgroundColor: theme.text + "40",
    },
    purchaseButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    restoreButton: {
      backgroundColor: "transparent",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 32,
      marginHorizontal: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    restoreButtonText: {
      color: theme.text,
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.text,
      textAlign: "center",
      marginBottom: 20,
    },
    ctaNote: {
      marginTop: 16,
      fontSize: 12,
      color: theme.text + "99",
      textAlign: "center",
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    infoText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.text,
      flex: 1,
      lineHeight: 20,
    },
    subscriptionDetailCard: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      marginBottom: 16,
      overflow: "hidden",
    },
    subscriptionHeader: {
      padding: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    subscriptionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
    },
    activeBadge: {
      backgroundColor: "#FFD700",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 8,
    },
    activeBadgeText: {
      color: "#000",
      fontWeight: "bold",
      fontSize: 14,
    },
    subscriptionInfo: {
      padding: 16,
    },
    subscriptionInfoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    subscriptionInfoLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.text,
      marginRight: 8,
    },
    subscriptionInfoValue: {
      fontSize: 14,
      color: theme.text,
    },
    subscriptionActions: {
      padding: 16,
    },
    subscriptionNote: {
      fontSize: 12,
      color: theme.text + "99",
      textAlign: "center",
    },
    agreementText: {
      textAlign: "center",
      marginBottom: 12,
      marginHorizontal: 16,
      fontSize: 12,
      lineHeight: 16,
    },
  });

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('subscription.title'),
            headerTitleStyle: {
              color: theme.text,
            },
            headerStyle: {
              backgroundColor: theme.background,
            },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={[styles.errorText, { marginTop: 16 }]}>
            {t('subscription.loading')}
          </Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t('subscription.title'),
            headerTitleStyle: {
              color: theme.text,
            },
            headerStyle: {
              backgroundColor: theme.background,
            },
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.restoreButton} onPress={() => router.back()}>
            <Text style={styles.restoreButtonText}>{t('subscription.error.back')}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // 匿名ユーザーの場合は自動的にホーム画面にリダイレクト
  if (isAnonymous) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('subscription.title'),
          headerTitleStyle: {
            color: theme.text,
          },
          headerStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <Ionicons name="star" size={60} color="#FFD700" />
          <Text style={styles.headerTitle}>{t('subscription.header.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('subscription.header.subtitle')}
          </Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>{t('subscription.header.premiumBadge')}</Text>
            </View>
          )}
        </View>

        {/* プレミアム契約済みユーザー向けの契約詳細 */}
        {isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('subscription.subscription.sectionTitle')}</Text>

            <View style={styles.subscriptionDetailCard}>
              <View style={styles.subscriptionHeader}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.subscriptionTitle}>{t('subscription.subscription.activeTitle')}</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{t('subscription.subscription.activeBadge')}</Text>
                </View>
              </View>

              <View style={styles.subscriptionInfo}>
                <View style={styles.subscriptionInfoItem}>
                  <Text style={styles.subscriptionInfoLabel}>{t('subscription.subscription.plan')}</Text>
                  <Text style={styles.subscriptionInfoValue}>
                    {subscription.productId === process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID 
                      ? t('subscription.subscription.yearlyPlan') 
                      : t('subscription.subscription.monthlyPlan')
                    }
                  </Text>
                </View>

                {subscription.originalPurchaseDate && (
                  <View style={styles.subscriptionInfoItem}>
                    <Text style={styles.subscriptionInfoLabel}>{t('subscription.subscription.originalPurchase')}</Text>
                    <Text style={styles.subscriptionInfoValue}>
                      {subscription.originalPurchaseDate.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US')}
                    </Text>
                  </View>
                )}

                {subscription.latestPurchaseDate && (
                  <View style={styles.subscriptionInfoItem}>
                    <Text style={styles.subscriptionInfoLabel}>{t('subscription.subscription.currentPurchase')}</Text>
                    <Text style={styles.subscriptionInfoValue}>
                      {subscription.latestPurchaseDate.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US')}
                    </Text>
                  </View>
                )}

                {subscription.expirationDate && (
                  <View style={styles.subscriptionInfoItem}>
                    <Text style={styles.subscriptionInfoLabel}>{t('subscription.subscription.nextRenewal')}</Text>
                    <Text style={styles.subscriptionInfoValue}>
                      {subscription.expirationDate.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.subscriptionActions}>
                <Text style={styles.subscriptionNote}>
                  {t('subscription.subscription.note')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>{t('subscription.plans.sectionTitle')}</Text>

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{t('subscription.plans.free.title')}</Text>
              <Text style={styles.planPrice}>{freePlanPriceString}</Text>
            </View>
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>{t('subscription.plans.free.features.itemLimit')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>{t('subscription.plans.free.features.recording')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>{t('subscription.plans.free.features.history')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>{t('subscription.plans.free.features.statistics')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>{t('subscription.plans.free.features.analysis')}</Text>
              </View>
            </View>
          </View>

          {/* 月額プラン */}
          {monthlyPackage && (
            <View style={[styles.planCard, styles.premiumCard]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, styles.premiumTitle]}>{t('subscription.plans.monthly.title')}</Text>
                <Text style={styles.planPrice}>{monthlyDisplayPrice}</Text>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>{t('subscription.plans.monthly.features.allFree')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>{t('subscription.plans.monthly.features.unlimited')}</Text>
                </View>
              </View>
              {!isPremium && (
                <TouchableOpacity 
                  style={[styles.purchaseButton, (purchasing ? styles.purchaseButtonDisabled : {})]}
                  onPress={() => handlePurchase(monthlyPackage)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.purchaseButtonText}>{t('subscription.plans.monthly.purchaseButton')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 年額プラン */}
          {yearlyPackage && (
            <View style={[styles.planCard, styles.premiumCard]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, styles.premiumTitle]}>{t('subscription.plans.yearly.title')}</Text>
                <Text style={styles.planPrice}>{yearlyDisplayPrice}</Text>
                <Text style={styles.yearlyPrice}>
                  {t('subscription.plans.yearly.monthlyEquivalent', { price: yearlyMonthlyEquivalentDisplay })}
                </Text>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>{t('subscription.plans.yearly.features.allFree')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>{t('subscription.plans.yearly.features.unlimited')}</Text>
                </View>
              </View>
              {!isPremium && (
                <TouchableOpacity 
                  style={[styles.purchaseButton, (purchasing ? styles.purchaseButtonDisabled : {})]}
                  onPress={() => handlePurchase(yearlyPackage)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.purchaseButtonText}>{t('subscription.plans.yearly.purchaseButton')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 規約同意注釈 */}
        {!isPremium && (
          <Text style={[styles.agreementText, { color: theme.text + "99" }]} selectable={false}>
            {t('subscription.agreement.prefix')}
            <Text
              style={{ color: theme.primary, textDecorationLine: 'underline' }}
              onPress={() => router.push({ pathname: '/webview', params: { url: getTermsUrl(), title: t('subscription.agreement.terms') } })}
            >
              {t('subscription.agreement.terms')}
            </Text>
            {i18n.language === 'ja' ? 'と' : ' and '}
            <Text
              style={{ color: theme.primary, textDecorationLine: 'underline' }}
              onPress={() => router.push({ pathname: '/webview', params: { url: getPrivacyUrl(), title: t('subscription.agreement.privacy') } })}
            >
              {t('subscription.agreement.privacy')}
            </Text>
            {t('subscription.agreement.suffix')}
          </Text>
        )}

        {/* 購入履歴復元ボタン */}
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>{t('subscription.actions.restorePurchases')}</Text>
        </TouchableOpacity>

        {/* データ保持に関する重要な説明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('subscription.dataRetention.sectionTitle')}</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              {t('subscription.dataRetention.preserved')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="eye" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              {t('subscription.dataRetention.freeLimit')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              {t('subscription.dataRetention.reupgrade')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleManageSubscription}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>{t('subscription.actions.manageSubscription')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </>
  );
}
