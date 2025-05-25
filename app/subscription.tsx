import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

export default function SubscriptionScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "プレミアムプラン",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="star" size={60} color="#FFD700" />
          <Text style={styles.headerTitle}>プレミアムプランで全機能を解放</Text>
          <Text style={styles.headerSubtitle}>
            あなたの洋服管理をさらに便利に
          </Text>
        </View>

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
                <Text style={styles.featureText}>アイテム登録: 最大15件</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>基本的な着用記録機能</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                <Text style={styles.featureText}>洗濯タイミング通知</Text>
              </View>
            </View>
          </View>

          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planTitle, styles.premiumTitle]}>プレミアムプラン</Text>
              <Text style={styles.planPrice}>¥480/月</Text>
              <Text style={styles.yearlyPrice}>年間プラン: ¥4,800 (¥400/月)</Text>
            </View>
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.featureText}>アイテム登録: 無制限</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.featureText}>高度な分析機能</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.featureText}>広告非表示</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.featureText}>着用頻度グラフ</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.featureText}>洗濯サイクル最適化</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                <Text style={styles.featureText}>ブランド別統計</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>友達紹介プログラム</Text>
          <View style={styles.referralCard}>
            <Text style={styles.referralText}>
              友達を招待して特典をゲット！
            </Text>
            <View style={styles.referralFeature}>
              <Ionicons name="gift" size={20} color="#e74c3c" />
              <Text style={styles.referralFeatureText}>
                友達を招待すると、あなたに1ヶ月のプレミアム特典
              </Text>
            </View>
            <View style={styles.referralFeature}>
              <Ionicons name="gift" size={20} color="#e74c3c" />
              <Text style={styles.referralFeatureText}>
                招待された友達には14日間のプレミアム機能トライアル
              </Text>
            </View>
            <View style={styles.referralFeature}>
              <Ionicons name="gift" size={20} color="#e74c3c" />
              <Text style={styles.referralFeatureText}>
                3人招待で3ヶ月プレミアム、5人招待で6ヶ月プレミアム
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>プレミアムを始める</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>
            ※ 課金機能は現在開発中です。実際の課金は発生しません。
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "white",
    borderRadius: 8,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 16,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 8,
    textAlign: "center",
  },
  planSection: {
    backgroundColor: "white",
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2c3e50",
  },
  planCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  premiumTitle: {
    color: "#FFD700",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  yearlyPrice: {
    fontSize: 14,
    color: "#7f8c8d",
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
    color: "#2c3e50",
  },
  referralCard: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  referralText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  referralFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  referralFeatureText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2c3e50",
  },
  ctaSection: {
    alignItems: "center",
    padding: 24,
    margin: 16,
  },
  ctaButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  ctaButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  ctaNote: {
    marginTop: 16,
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
});