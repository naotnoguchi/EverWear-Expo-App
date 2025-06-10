import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Share } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { Period } from "../services/statisticsServiceFactory";
import { useStatistics } from "../contexts/StatisticsContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";

export default function ImpactScreen() {
  const theme = useTheme();

  // 統計コンテキストを使用
  const {
    impactData: impact,
    loading: { impactData: isLoading },
    error: { impactData: contextError },
    period,
    setPeriod,
    fetchImpactData
  } = useStatistics();

  // ローディングとエラーの状態
  const loading = isLoading;
  const error = contextError;

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

  // 環境影響データを取得
  const fetchImpact = useCallback(async () => {
    try {
      await fetchImpactData(period);
    } catch (err) {
      console.error('環境影響データの取得エラー:', err);
    }
  }, [fetchImpactData, period]);

  // マウント時とperiod変更時にデータを取得
  useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    fetchImpact();
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
      padding: 16,
      backgroundColor: theme.background, // 固定の白色から変更
    },
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
    totalSavings: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    totalSavingsLabel: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    totalSavingsValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: "#27ae60",
    },
    lifespanDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    lifespanEffect: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      padding: 12,
      borderRadius: 8,
    },
    lifespanIconContainer: {
      marginRight: 12,
    },
    lifespanValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    chartContainer: {
      height: 200,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      marginTop: 60,
      marginBottom: 16,
    },
    chartBarContainer: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    chartBarLabels: {
      alignItems: 'center',
      marginBottom: 4,
    },
    chartValue: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    chartCo2Value: {
      fontSize: 10,
    },
    chartBar: {
      width: 20,
      borderRadius: 10,
      marginBottom: 8,
    },
    chartLabel: {
      fontSize: 12,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 4,
    },
    legendText: {
      fontSize: 12,
    },
    environmentalImpact: {
      marginBottom: 16,
    },
    treeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 12,
    },
    treeIcon: {
      marginHorizontal: 4,
    },
    environmentalText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    shareButton: {
      backgroundColor: "#27ae60",
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
    },
    shareButtonText: {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 8,
    },
    errorText: {
      textAlign: 'center',
      marginVertical: 16,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.text,
    },
    modalText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      color: theme.text,
    },
    modalCloseButton: {
      alignSelf: 'flex-end',
      padding: 8,
    },
    infoIcon: {
      marginLeft: 8,
    },
  });

  // Render loading state
  if (loading && !impact) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>環境影響データを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && !impact) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchImpact}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "環境影響・節約効果",
          headerBackTitle: "戻る",
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Period selector */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>期間</Text>
          <View style={styles.optionsRow}>
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  period === option.value && styles.filterOptionSelected,
                  { borderColor: theme.border }
                ]}
                onPress={() => handlePeriodChange(option.value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    { color: theme.text },
                    period === option.value && styles.filterOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main impact card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#27ae60" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              洗濯削減効果
            </Text>
            <TouchableOpacity 
              onPress={() => setShowWashInfoModal(true)}
              style={styles.infoIcon}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.text + "99"} />
            </TouchableOpacity>
          </View>

          <View style={styles.highlightContainer}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{(impact?.totalWashesReduced || 0).toFixed(1)}</Text>
              <Text style={[styles.highlightLabel, { color: theme.text }]}>洗濯回数削減</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{(impact?.co2Reduced || 0).toFixed(1)} kg</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.highlightLabel, { color: theme.text }]}>CO2削減量</Text>
                <TouchableOpacity 
                  onPress={() => setShowCO2InfoModal(true)}
                  style={{ marginLeft: 2 }}
                >
                  <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{(impact?.treeEquivalent || 0).toFixed(1)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.highlightLabel, { color: theme.text }]}>植樹相当効果</Text>
                <TouchableOpacity 
                  onPress={() => setShowTreeInfoModal(true)}
                  style={{ marginLeft: 2 }}
                >
                  <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={[styles.impactDescription, { color: theme.text + "CC" }]}>
            「着用するたびに洗濯する」場合と比較して、あなたは{(impact?.totalWashesReduced || 0).toFixed(1)}回の洗濯を削減しました。
            これは約{(impact?.treeEquivalent || 0).toFixed(1)}本の木を植えるのと同等のCO2削減効果があります。
          </Text>
        </View>

        {/* Resource savings card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="water" size={24} color="#3498db" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              資源節約効果
            </Text>
          </View>

          <View style={styles.resourceItem}>
            <View style={styles.resourceIconContainer}>
              <Ionicons name="flash" size={24} color="#f1c40f" />
            </View>
            <View style={styles.resourceInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.resourceTitle, { color: theme.text }]}>電気</Text>
                <TouchableOpacity 
                  onPress={() => setShowElectricityInfoModal(true)}
                  style={styles.infoIcon}
                >
                  <Ionicons name="information-circle-outline" size={16} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.resourceValue, { color: theme.text }]}>
                {impact?.electricitySaved.amount || 0} kWh（{impact?.electricitySaved.cost || 0}円相当）
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(((impact?.electricitySaved.amount || 0) / 10) * 100, 100)}%`, 
                      backgroundColor: "#f1c40f" 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.resourceItem}>
            <View style={styles.resourceIconContainer}>
              <Ionicons name="water" size={24} color="#3498db" />
            </View>
            <View style={styles.resourceInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.resourceTitle, { color: theme.text }]}>水</Text>
                <TouchableOpacity 
                  onPress={() => setShowWaterInfoModal(true)}
                  style={styles.infoIcon}
                >
                  <Ionicons name="information-circle-outline" size={16} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.resourceValue, { color: theme.text }]}>
                {impact?.waterSaved.amount || 0} L（{impact?.waterSaved.cost || 0}円相当）
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(((impact?.waterSaved.amount || 0) / 1000) * 100, 100)}%`, 
                      backgroundColor: "#3498db" 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.resourceItem}>
            <View style={styles.resourceIconContainer}>
              <Ionicons name="flask" size={24} color="#9b59b6" />
            </View>
            <View style={styles.resourceInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.resourceTitle, { color: theme.text }]}>洗剤</Text>
                <TouchableOpacity 
                  onPress={() => setShowDetergentInfoModal(true)}
                  style={styles.infoIcon}
                >
                  <Ionicons name="information-circle-outline" size={16} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.resourceValue, { color: theme.text }]}>
                {impact?.detergentSaved.amount || 0} ml（{impact?.detergentSaved.cost || 0}円相当）
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(((impact?.detergentSaved.amount || 0) / 500) * 100, 100)}%`, 
                      backgroundColor: "#9b59b6" 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.totalSavings}>
            <Text style={[styles.totalSavingsLabel, { color: theme.text }]}>
              総節約金額
            </Text>
            <Text style={styles.totalSavingsValue}>
              {((impact?.electricitySaved.cost || 0) + 
                (impact?.waterSaved.cost || 0) + 
                (impact?.detergentSaved.cost || 0)).toLocaleString()}円
            </Text>
          </View>
        </View>

        {/* Clothing lifespan card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shirt" size={24} color="#e74c3c" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              洋服寿命延長効果
            </Text>
            <TouchableOpacity 
              onPress={() => setShowLifespanInfoModal(true)}
              style={styles.infoIcon}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.text + "99"} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.lifespanDescription, { color: theme.text }]}>
            洗濯回数を{(impact?.totalWashesReduced || 0).toFixed(1)}回削減したことで、あなたの洋服の寿命が延びています。
            洗濯による繊維へのダメージが軽減され、お気に入りの服をより長く着ることができます。
          </Text>

          <View style={styles.lifespanEffect}>
            <View style={styles.lifespanIconContainer}>
              <Ionicons name="time" size={32} color="#e74c3c" />
            </View>
            <Text style={[styles.lifespanValue, { color: theme.text }]}>
              洋服の寿命 約{Math.round((impact?.totalWashesReduced || 0) * 0.05) + 1}倍に延長
            </Text>
          </View>
        </View>

        {/* Monthly impact chart */}
        {impact && impact.monthlyImpact.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart" size={24} color="#3498db" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                月別削減効果
              </Text>
            </View>

            <View style={styles.chartContainer}>
              {impact.monthlyImpact.map((item, index) => {
                // Calculate bar height based on maximum value
                const maxCount = Math.max(
                  ...impact.monthlyImpact.map((i) => i.washesReduced),
                  1 // Avoid division by zero
                );
                const heightPercentage = (item.washesReduced / maxCount) * 100;

                return (
                  <View key={item.month} style={styles.chartBarContainer}>
                    <View style={styles.chartBarLabels}>
                      <Text style={[styles.chartValue, { color: theme.text }]}>
                        {item.washesReduced.toFixed(1)}
                      </Text>
                      <Text style={[styles.chartCo2Value, { color: "#27ae60" }]}>
                        {item.co2Reduced.toFixed(1)}kg
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${heightPercentage}%`,
                          backgroundColor: "#3498db",
                        },
                      ]}
                    />
                    <Text style={[styles.chartLabel, { color: theme.text }]}>
                      {item.month}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#3498db" }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>洗濯回数削減</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#27ae60" }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>CO2削減量(kg)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Environmental impact card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe" size={24} color="#27ae60" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              環境貢献度
            </Text>
          </View>

          <View style={styles.environmentalImpact}>
            <View style={styles.treeContainer}>
              {Array.from({ length: Math.min(Math.ceil(impact?.treeEquivalent || 0), 5) }).map((_, index) => (
                <Ionicons 
                  key={index} 
                  name="leaf" 
                  size={32} 
                  color="#27ae60" 
                  style={styles.treeIcon} 
                />
              ))}
            </View>

            <Text style={[styles.environmentalText, { color: theme.text }]}>
              あなたの洗濯習慣の改善により、{(impact?.co2Reduced || 0).toFixed(1)}kgのCO2排出を削減しました。
              これは約{(impact?.treeEquivalent || 0).toFixed(1)}本の木が1年間に吸収するCO2量に相当します。
            </Text>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={16} color="white" />
            <Text style={styles.shareButtonText}>環境貢献度をシェアする</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Wash Info Modal */}
      <Modal
        visible={showWashInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWashInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWashInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>洗濯回数削減の計算方法について</Text>

            <Text style={styles.modalText}>
              環境影響の計算は、「着用するたびに洗濯する」場合と比較して、実際の洗濯回数の差に基づいています。
            </Text>

            <Text style={styles.modalText}>
              ただし、実際には複数のアイテムを一度に洗濯することが一般的です。そのため、削減された洗濯回数は平均的な洗濯機1回あたりのアイテム数（5アイテム）で割って計算しています。
            </Text>

            <Text style={styles.modalText}>
              例：10回着用して2回洗濯した場合、理論上は8回の洗濯を削減したことになりますが、1回の洗濯で平均5アイテムを洗うと考えると、実際の削減効果は8÷5=1.6回分となります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* Water Info Modal */}
      <Modal
        visible={showWaterInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWaterInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWaterInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>水量（料金）の計算方法について</Text>

            <Text style={styles.modalText}>
              水量の節約効果は、削減された洗濯回数に1回の洗濯で使用される平均的な水量（約50リットル）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              料金は地域によって異なりますが、一般的な水道料金（1000リットルあたり約300円）に基づいて計算しています。
            </Text>

            <Text style={styles.modalText}>
              例：洗濯回数を10回削減した場合、50リットル×10回=500リットルの水を節約したことになり、料金に換算すると約150円の節約となります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* Electricity Info Modal */}
      <Modal
        visible={showElectricityInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowElectricityInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowElectricityInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>電気量（料金）の計算方法について</Text>

            <Text style={styles.modalText}>
              電気量の節約効果は、削減された洗濯回数に1回の洗濯で使用される平均的な電力量（約0.5kWh）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              料金は電力会社や契約プランによって異なりますが、一般的な電気料金（1kWhあたり約25円）に基づいて計算しています。
            </Text>

            <Text style={styles.modalText}>
              例：洗濯回数を10回削減した場合、0.5kWh×10回=5kWhの電力を節約したことになり、料金に換算すると約125円の節約となります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* CO2 Info Modal */}
      <Modal
        visible={showCO2InfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCO2InfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCO2InfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>CO2削減量の計算方法について</Text>

            <Text style={styles.modalText}>
              CO2削減量は、節約された電力量に電力のCO2排出係数（1kWhあたり約0.5kg）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              洗濯機の使用だけでなく、水の供給や処理に関連するCO2排出も考慮しています。
            </Text>

            <Text style={styles.modalText}>
              例：電力を5kWh節約した場合、5kWh×0.5kg/kWh=2.5kgのCO2排出を削減したことになります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* Tree Info Modal */}
      <Modal
        visible={showTreeInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTreeInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTreeInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>植樹相当効果の計算方法について</Text>

            <Text style={styles.modalText}>
              植樹相当効果は、削減されたCO2排出量を、1本の木が1年間に吸収するCO2量（約20kg）で割って計算しています。
            </Text>

            <Text style={styles.modalText}>
              この値は、あなたの洗濯習慣の改善が、どれだけの数の木を植えるのと同等のCO2吸収効果があるかを示しています。
            </Text>

            <Text style={styles.modalText}>
              例：CO2排出を10kg削減した場合、10kg÷20kg/本=0.5本の木を植えるのと同等の効果があります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* Detergent Info Modal */}
      <Modal
        visible={showDetergentInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetergentInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDetergentInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>洗剤消費量（料金）の計算方法について</Text>

            <Text style={styles.modalText}>
              洗剤の節約効果は、削減された洗濯回数に1回の洗濯で使用される平均的な洗剤量（約30ml）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              料金は洗剤の種類によって異なりますが、一般的な洗剤の価格（800mlボトルで約400円）に基づいて計算しています。
            </Text>

            <Text style={styles.modalText}>
              例：洗濯回数を10回削減した場合、30ml×10回=300mlの洗剤を節約したことになり、料金に換算すると約150円の節約となります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* Lifespan Info Modal */}
      <Modal
        visible={showLifespanInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLifespanInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowLifespanInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>洋服寿命延長効果の計算方法について</Text>

            <Text style={styles.modalText}>
              洋服の寿命延長効果は、洗濯回数の削減に基づいて計算しています。一般的に、洗濯は衣類の繊維を傷め、色落ちや形崩れの原因となります。
            </Text>

            <Text style={styles.modalText}>
              研究によると、洗濯回数が20%減少すると、衣類の寿命は約1.5倍に延びるとされています。このデータに基づき、削減された洗濯回数から寿命延長効果を推定しています。
            </Text>

            <Text style={styles.modalText}>
              例：洗濯回数を20回から16回に20%削減した場合、衣類の寿命は約1.5倍に延びると推定されます。
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
