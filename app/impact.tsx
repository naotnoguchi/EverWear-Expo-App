import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PremiumUpgradeModal } from "../components/PremiumUpgradeModal";
import { usePremiumFeatures } from "../contexts/PurchaseContext";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { Period } from "../services/statisticsServiceFactory";

export default function ImpactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isPremium } = usePremiumFeatures();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 統計コンテキストを使用（新しいAPI）
  const {
    impactData: impact,
    isCalculating,
    calculationError,
    period,
    setPeriod,
    recalculateStatistics
  } = useStatistics();

  // ローディングとエラーの状態
  const loading = isCalculating;
  const error = calculationError;

  // 環境影響データを共有
  const handleShare = async () => {
    try {
      const shareMessage = `
🌱 私の環境貢献度 🌱

🌍 CO2削減量: ${impact?.co2Reduced.toFixed(1)}kg
🌳 植樹相当効果: ${impact?.treeEquivalent.toFixed(1)}本の木

💧 節水: ${impact?.waterSaved.amount}L (${impact?.waterSaved.cost}円相当)
⚡ 節電: ${impact?.electricitySaved.amount}kWh (${impact?.electricitySaved.cost}円相当)
🧴 洗剤節約: ${impact?.detergentSaved.amount}ml (${impact?.detergentSaved.cost}円相当)

総節約金額: ${((impact?.electricitySaved.cost || 0) + (impact?.waterSaved.cost || 0) + (impact?.detergentSaved.cost || 0))}円

ClothesManagerAppで洋服の寿命を延ばしながら環境にも貢献しよう！
`;

      await Share.share({
        message: shareMessage,
        title: '私の環境貢献度'
      });
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };

  // モーダル表示状態
  const [showWashInfoModal, setShowWashInfoModal] = useState(false);
  const [showWaterInfoModal, setShowWaterInfoModal] = useState(false);
  const [showElectricityInfoModal, setShowElectricityInfoModal] = useState(false);
  const [showCO2InfoModal, setShowCO2InfoModal] = useState(false);
  const [showTreeInfoModal, setShowTreeInfoModal] = useState(false);
  const [showDetergentInfoModal, setShowDetergentInfoModal] = useState(false);
  const [showLifespanInfoModal, setShowLifespanInfoModal] = useState(false);

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // Period options
  const periodOptions: { label: string; value: Period }[] = [
    { label: '1ヶ月', value: '1month' },
    { label: '3ヶ月', value: '3months' },
    { label: '6ヶ月', value: '6months' },
    { label: '1年', value: '1year' },
    { label: 'すべて', value: 'all' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    restrictedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.background + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    restrictedContent: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    restrictedIcon: {
      marginBottom: 16,
    },
    restrictedTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    restrictedDescription: {
      fontSize: 16,
      color: theme.text + '99',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    upgradeButton: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    upgradeButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: 'bold',
    },
    backButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    backButtonText: {
      color: theme.text,
      fontSize: 16,
    },
    // 通常のコンテンツ用スタイル（プレミアムユーザー向け）
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    sectionText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
    },
    // 既存のスタイルを維持（プレミアムユーザー向け）
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterSection: {
      marginBottom: 16,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
    filterOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterOptionText: {
      fontSize: 12,
    },
    filterOptionTextSelected: {
      color: "white",
      fontWeight: 'bold',
    },
    card: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    highlightContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    highlightItem: {
      flex: 1,
      alignItems: 'center',
    },
    highlightValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: "#27ae60",
      marginBottom: 4,
    },
    highlightLabel: {
      fontSize: 12,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    impactDescription: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    resourceItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    resourceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    resourceInfo: {
      flex: 1,
    },
    resourceTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    resourceValue: {
      fontSize: 14,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: "環境影響・節約効果",
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
      
      <View style={styles.container}>
        {!isPremium ? (
          <View style={styles.restrictedOverlay}>
            <View style={styles.restrictedContent}>
              <View style={styles.restrictedIcon}>
                <Ionicons name="lock-closed" size={48} color="#FFD700" />
              </View>
              
              <Text style={styles.restrictedTitle}>プレミアム限定機能</Text>
              <Text style={styles.restrictedDescription}>
                環境影響・節約効果の分析はプレミアムプラン限定の機能です。{'\n'}
                アップグレードして詳細な環境貢献度を確認しませんか？
              </Text>
              
              <TouchableOpacity 
                style={styles.upgradeButton} 
                onPress={() => router.push('/subscription')}
              >
                <Text style={styles.upgradeButtonText}>プレミアムプランを見る</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>環境影響・節約効果</Text>
              <Text style={styles.sectionText}>
                あなたの洋服管理による環境への貢献度と節約効果を可視化します。
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌍 環境貢献度</Text>
              <Text style={styles.sectionText}>
                CO2削減量: {impact?.co2Reduced.toFixed(1) || '0.0'}kg{'\n'}
                植樹相当効果: {impact?.treeEquivalent.toFixed(1) || '0.0'}本の木
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 節約効果</Text>
              <Text style={styles.sectionText}>
                💧 節水: {impact?.waterSaved.amount || 0}L ({impact?.waterSaved.cost || 0}円相当){'\n'}
                ⚡ 節電: {impact?.electricitySaved.amount || 0}kWh ({impact?.electricitySaved.cost || 0}円相当){'\n'}
                🧴 洗剤節約: {impact?.detergentSaved.amount || 0}ml ({impact?.detergentSaved.cost || 0}円相当)
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>総節約金額</Text>
              <Text style={[styles.sectionText, { fontSize: 20, fontWeight: 'bold', color: '#27ae60' }]}>
                {((impact?.electricitySaved.cost || 0) + (impact?.waterSaved.cost || 0) + (impact?.detergentSaved.cost || 0))}円
              </Text>
            </View>
          </ScrollView>
        )}
        
        <PremiumUpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="環境影響・節約効果"
          description="環境貢献度の詳細分析や節約効果の可視化はプレミアムプラン限定の機能です。"
        />
      </View>
    </>
  );
}
