import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PurchasesPackage } from "react-native-purchases";
import { usePremiumFeatures, usePurchase } from "../contexts/PurchaseContext";
import { useTheme } from "../contexts/ThemeContext";

export default function SubscriptionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { subscription, offerings, loading, error, purchasePackage, restorePurchases } = usePurchase();
  const { isPremium } = usePremiumFeatures();
  const [purchasing, setPurchasing] = useState(false);

  const monthlyPackage = offerings
    .flatMap(offering => offering.availablePackages)
    .find(pkg => pkg.product.identifier === process.env.EXPO_PUBLIC_PREMIUM_MONTHLY_PRODUCT_ID);

  const yearlyPackage = offerings
    .flatMap(offering => offering.availablePackages)
    .find(pkg => pkg.product.identifier === process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID);

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setPurchasing(true);
      await purchasePackage(packageToPurchase);
      
      Alert.alert(
        "購入完了",
        "プレミアムプランにアップグレードしました！",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        "購入エラー",
        "購入処理中にエラーが発生しました。もう一度お試しください。"
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      await restorePurchases();
      
      Alert.alert(
        "購入履歴の復元",
        "購入履歴を確認しました。"
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        "復元エラー",
        "購入履歴の復元中にエラーが発生しました。"
      );
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: number, currencyCode: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
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
  });

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "プレミアムプラン",
            headerTitleStyle: {
              color: theme.text,
            },
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={[styles.errorText, { marginTop: 16 }]}>
            読み込み中...
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
            title: "プレミアムプラン",
            headerTitleStyle: {
              color: theme.text,
            },
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.restoreButton} onPress={() => router.back()}>
            <Text style={styles.restoreButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "プレミアムプラン",
          headerTitleStyle: {
            color: theme.text,
          },
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <Ionicons name="star" size={60} color="#FFD700" />
          <Text style={styles.headerTitle}>プレミアムプランで全機能を解放</Text>
          <Text style={styles.headerSubtitle}>
            あなたの洋服管理をさらに便利に
          </Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>プレミアム会員</Text>
            </View>
          )}
        </View>

        {/* プレミアム契約済みユーザー向けの契約詳細 */}
        {isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>契約詳細</Text>
            
            <View style={styles.subscriptionDetailCard}>
              <View style={styles.subscriptionHeader}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.subscriptionTitle}>アクティブなプレミアムプラン</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>有効</Text>
                </View>
              </View>
              
              <View style={styles.subscriptionInfo}>
                <View style={styles.subscriptionInfoItem}>
                  <Text style={styles.subscriptionInfoLabel}>契約プラン</Text>
                  <Text style={styles.subscriptionInfoValue}>
                    {subscription.productId === process.env.EXPO_PUBLIC_PREMIUM_YEARLY_PRODUCT_ID ? '年額プラン' : '月額プラン'}
                  </Text>
                </View>
                
                {subscription.purchaseDate && (
                  <View style={styles.subscriptionInfoItem}>
                    <Text style={styles.subscriptionInfoLabel}>契約開始日</Text>
                    <Text style={styles.subscriptionInfoValue}>
                      {subscription.purchaseDate.toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                )}
                
                {subscription.expirationDate && (
                  <View style={styles.subscriptionInfoItem}>
                    <Text style={styles.subscriptionInfoLabel}>次回更新日</Text>
                    <Text style={styles.subscriptionInfoValue}>
                      {subscription.expirationDate.toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.subscriptionActions}>
                <Text style={styles.subscriptionNote}>
                  サブスクリプションの解約や変更は、App Store（iOS）またはGoogle Play（Android）から行ってください。
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>プラン比較</Text>

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>無料プラン</Text>
              <Text style={styles.planPrice}>¥0</Text>
            </View>
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>大切な洋服15件まで登録可能</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>日々の着用・洗濯を簡単記録</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>着用履歴でスタイリングを振り返り</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>基本統計でワードローブの全体像を把握</Text>
              </View>
            </View>
          </View>

          {/* 月額プラン */}
          {monthlyPackage && (
            <View style={[styles.planCard, styles.premiumCard]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, styles.premiumTitle]}>月額プラン</Text>
                <Text style={styles.planPrice}>
                  {formatPrice(monthlyPackage.product.price, monthlyPackage.product.currencyCode)}
                </Text>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>無料プランのすべての機能</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>お気に入りアイテムを無制限登録</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>洗濯効率の最適化と環境・節約効果を可視化</Text>
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
                    <Text style={styles.purchaseButtonText}>月額プランを購入</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 年額プラン */}
          {yearlyPackage && (
            <View style={[styles.planCard, styles.premiumCard]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, styles.premiumTitle]}>年額プラン</Text>
                <Text style={styles.planPrice}>
                  {formatPrice(yearlyPackage.product.price, yearlyPackage.product.currencyCode)}
                </Text>
                <Text style={styles.yearlyPrice}>
                  月額換算: {formatPrice(yearlyPackage.product.price / 12, yearlyPackage.product.currencyCode)}
                </Text>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>無料プランのすべての機能</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>お気に入りアイテムを無制限登録</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.featureText}>洗濯効率の最適化と環境・節約効果を可視化</Text>
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
                    <Text style={styles.purchaseButtonText}>年額プランを購入</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 購入履歴復元ボタン */}
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>購入履歴を復元</Text>
        </TouchableOpacity>

        {/* データ保持に関する重要な説明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ保持について</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              プレミアム登録中に作成したアイテムは、サブスクリプションをキャンセルした後も安全に保持されます。
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="eye" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              無料プランでは最新の15件のアイテムのみ表示されますが、16件目以降のデータは削除されません。
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              プレミアムプランに再度アップグレードすると、保存されている全てのアイテムが再び表示されます。
            </Text>
          </View>
        </View>

        {!isPremium && (
          <Text style={styles.ctaNote}>
            ※ 実際の課金が発生します。購入前にご確認ください。
          </Text>
        )}
      </ScrollView>
    </>
  );
}
