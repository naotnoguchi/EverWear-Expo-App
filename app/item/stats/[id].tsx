import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import { statisticsService, ItemDetailStats } from "../../../services/statisticsServiceFactory";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, Stack } from "expo-router";

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // State
  const [itemStats, setItemStats] = useState<ItemDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility states
  const [showWashInfoModal, setShowWashInfoModal] = useState(false);
  const [showWaterInfoModal, setShowWaterInfoModal] = useState(false);
  const [showEnergyInfoModal, setShowEnergyInfoModal] = useState(false);
  const [showCO2InfoModal, setShowCO2InfoModal] = useState(false);

  // スタイルをuseMemoでメモ化（最初に定義）
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    itemName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.text,
    },
    itemCategory: {
      fontSize: 14,
      marginBottom: 16,
      color: theme.text + 'CC',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.text + "99",
    },
    imageContainer: {
      alignItems: 'center',
    },
    itemImage: {
      width: 120,
      height: 120,
      borderRadius: 8,
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
      color: theme.text,
    },
    efficiencyContainer: {
      marginBottom: 8,
    },
    efficiencyMeter: {
      height: 40,
      marginBottom: 16,
      position: 'relative',
    },
    efficiencyIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      position: 'absolute',
      top: 0,
      transform: [{ translateX: -8 }],
    },
    optimalRange: {
      height: 8,
      backgroundColor: '#27ae60' + '40', // Green with opacity
      position: 'absolute',
      top: 4,
      borderRadius: 4,
    },
    underwashedRange: {
      height: 8,
      backgroundColor: '#f39c12' + '40', // Orange with opacity
      position: 'absolute',
      top: 4,
      borderRadius: 4,
    },
    overwashedRange: {
      height: 8,
      backgroundColor: '#e74c3c' + '40', // Red with opacity
      position: 'absolute',
      top: 4,
      borderRadius: 4,
    },
    efficiencyScale: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    efficiencyScaleText: {
      fontSize: 12,
      color: theme.text + "99",
    },
    efficiencyDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      color: theme.text,
    },
    efficiencyTip: {
      flexDirection: 'row',
      backgroundColor: (theme.warning || '#f39c12') + '10',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    tipText: {
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
      color: theme.text + "CC",
    },
    patternContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    patternItem: {
      width: '48%',
      marginBottom: 16,
    },
    patternLabel: {
      fontSize: 12,
      marginBottom: 4,
      color: theme.text + "99",
    },
    patternValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    chartContainer: {
      height: 200,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      marginTop: 40,
    },
    chartBarContainer: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    chartValue: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.text,
    },
    chartBar: {
      width: 20,
      borderRadius: 10,
      marginBottom: 8,
    },
    chartLabel: {
      fontSize: 12,
      color: theme.text,
    },
    impactContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    impactItem: {
      alignItems: 'center',
    },
    impactIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    impactValue: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.text,
    },
    impactLabel: {
      fontSize: 12,
      color: theme.text + "99",
    },
    impactDescription: {
      fontSize: 14,
      textAlign: 'center',
      color: theme.text + "CC",
    },
    errorText: {
      textAlign: 'center',
      marginVertical: 16,
      color: theme.error || '#e74c3c',
    },
    retryButton: {
      backgroundColor: theme.primary || '#3498db',
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
  }), [theme]);

  // Fetch item detail data
  const fetchItemDetail = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getItemDetailStats(id);
      setItemStats(data);
    } catch (err) {
      console.error('Error fetching item detail data:', err);
      setError('アイテム詳細データの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load data on mount
  useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);

  // Calculate efficiency status - itemStatsがnullでないことを確認
  const getEfficiencyStatus = useCallback(() => {
    if (!itemStats) return { text: 'データなし', color: '#999' };

    // 着用・洗濯履歴がない場合は判定を表示しない
    if (itemStats.wearCount === 0 && itemStats.washCount === 0) {
      return { text: '履歴なし', color: '#999' };
    }

    const lowerThreshold = 0.8; // 閾値の80%
    const upperThreshold = 1.2; // 閾値の120%

    if (itemStats.efficiency >= lowerThreshold && itemStats.efficiency <= upperThreshold) {
      return { text: '良好', color: '#27ae60' }; // 最適範囲内
    } else if (itemStats.efficiency > upperThreshold) {
      return { text: '洗濯不足', color: '#f39c12' }; // 洗濯頻度が低すぎる
    } else {
      return { text: '洗いすぎ', color: '#e74c3c' }; // 洗濯頻度が高すぎる
    }
  }, [itemStats]);

  // Find day with most wears - itemStatsがnullでないことを確認
  const getMostWornDay = useCallback(() => {
    if (!itemStats) return null;
    const days = Object.entries(itemStats.wearsByDay);
    if (days.length === 0) return null;

    return days.reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    });
  }, [itemStats]);

  // Find month with most wears - itemStatsがnullでないことを確認
  const getMostWornMonth = useCallback(() => {
    if (!itemStats) return null;
    const months = Object.entries(itemStats.wearsByMonth);
    if (months.length === 0) return null;

    return months.reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    });
  }, [itemStats]);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary || '#3498db'} />
        <Text style={{ marginTop: 16, color: theme.text }}>アイテム詳細データを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error || !itemStats) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error || '#e74c3c'} />
        <Text style={styles.errorText}>
          {error || 'アイテムが見つかりませんでした。'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetail}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const efficiencyStatus = getEfficiencyStatus();
  const mostWornDay = getMostWornDay();
  const mostWornMonth = getMostWornMonth();

  return (
    <>
      <Stack.Screen 
        options={{
          title: "アイテム詳細分析",
          headerBackTitle: "戻る",
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Item basic info */}
        <View style={styles.card}>
          <Text style={styles.itemName}>
            {itemStats.name}
          </Text>
          <Text style={styles.itemCategory}>
            {itemStats.brand ? `${itemStats.brand} / ${itemStats.category}` : itemStats.category}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {itemStats.wearCount}
              </Text>
              <Text style={styles.statLabel}>
                着用回数
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {itemStats.washCount}
              </Text>
              <Text style={styles.statLabel}>
                洗濯回数
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {itemStats.wearPerWash.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>
                着用/洗濯
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: efficiencyStatus.color }]}>
                {efficiencyStatus.text}
              </Text>
              <Text style={styles.statLabel}>
                効率
              </Text>
            </View>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: itemStats.imageUrl }}
              style={styles.itemImage}
              contentFit="cover"
              transition={200}
            />
          </View>
        </View>

        {/* Efficiency card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              洗濯効率
            </Text>
          </View>

          <View style={styles.efficiencyContainer}>
            <View style={styles.efficiencyMeter}>
              {/* 洗濯不足範囲を示す背景 (左側) */}
              <View
                style={[
                  styles.underwashedRange,
                  {
                    left: `0%`,
                    width: `${40}%`  // 0.8 / 2.0 * 100 = 40%
                  }
                ]}
              />
              {/* 最適範囲を示す背景 (中央) */}
              <View
                style={[
                  styles.optimalRange,
                  {
                    left: `${40}%`,  // 0.8 / 2.0 * 100 = 40%
                    width: `${20}%`  // (1.2 - 0.8) / 2.0 * 100 = 20%
                  }
                ]}
              />
              {/* 洗いすぎ範囲を示す背景 (右側) */}
              <View
                style={[
                  styles.overwashedRange,
                  {
                    left: `${60}%`,  // (0.8 + 0.4) / 2.0 * 100 = 60%
                    width: `${40}%`  // (2.0 - 1.2) / 2.0 * 100 = 40%
                  }
                ]}
              />
              {/* 現在の効率を示すインジケーター - 履歴がない場合は表示しない */}
              {(itemStats.wearCount > 0 || itemStats.washCount > 0) && (
                <View
                  style={[
                    styles.efficiencyIndicator,
                    {
                      left: `${100 - Math.min(itemStats.efficiency * 50, 100)}%`,  // 反転させた位置計算
                      backgroundColor: efficiencyStatus.color
                    }
                  ]}
                />
              )}
              <View style={styles.efficiencyScale}>
                <Text style={styles.efficiencyScaleText}>洗濯不足</Text>
                <Text style={[styles.efficiencyScaleText, { position: 'absolute', left: '50%', transform: [{ translateX: -10 }] }]}>良好</Text>
                <Text style={styles.efficiencyScaleText}>洗いすぎ</Text>
              </View>
            </View>

            <Text style={styles.efficiencyDescription}>
              {itemStats.wearCount === 0 && itemStats.washCount === 0
                ? 'このアイテムはまだ着用・洗濯の記録がありません。着用と洗濯を記録すると、洗濯効率の分析が表示されます。'
                : itemStats.efficiency >= 0.8 && itemStats.efficiency <= 1.2
                  ? 'このアイテムは最適な頻度で洗濯されています。このまま続けましょう！' 
                  : itemStats.efficiency < 0.8
                    ? '洗濯頻度が高すぎる可能性があります。洗濯の間にもっと着用することで、衣類の寿命を延ばし、環境への影響を減らせます。'
                    : '洗濯頻度が低すぎる可能性があります。衣類の清潔さを保つため、もう少し頻繁に洗濯することを検討してください。'}
            </Text>

            <View style={styles.efficiencyTip}>
              <Ionicons name="bulb" size={16} color="#f39c12" />
              <Text style={styles.tipText}>
                {itemStats.category === 'デニム' 
                  ? 'デニムは5-10回着用ごとに洗濯するのが理想的です。洗いすぎも洗わなさすぎも避けましょう。' 
                  : itemStats.category === 'アウター' 
                    ? 'アウターは汚れた場合を除き、シーズンに1-2回の洗濯で十分です。ただし、汚れが目立つ場合は適宜洗濯しましょう。' 
                    : '一般的な衣類は2-3回着用ごとに洗濯するのが理想的です。衣類の種類や着用状況に応じて調整しましょう。'}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage patterns card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              着用パターン
            </Text>
          </View>

          <View style={styles.patternContainer}>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                最も着用する曜日
              </Text>
              {itemStats.wearCount > 0 && mostWornDay ? (
                <Text style={styles.patternValue}>
                  {mostWornDay[0]}（{mostWornDay[1]}回）
                </Text>
              ) : (
                <Text style={[styles.patternValue, { color: theme.text + "99" }]}>
                  データなし
                </Text>
              )}
            </View>

            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                最も着用する月
              </Text>
              {itemStats.wearCount > 0 && mostWornMonth ? (
                <Text style={styles.patternValue}>
                  {mostWornMonth[0]}（{mostWornMonth[1]}回）
                </Text>
              ) : (
                <Text style={[styles.patternValue, { color: theme.text + "99" }]}>
                  データなし
                </Text>
              )}
            </View>

            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                平均着用間隔
              </Text>
              {itemStats.wearCount > 1 ? (
                <Text style={styles.patternValue}>
                  {itemStats.averageWearInterval.toFixed(1)}日
                </Text>
              ) : (
                <Text style={[styles.patternValue, { color: theme.text + "99" }]}>
                  データなし
                </Text>
              )}
            </View>

            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                最終着用日
              </Text>
              <Text style={styles.patternValue}>
                {itemStats.lastWornDate ? new Date(itemStats.lastWornDate).toLocaleDateString('ja-JP') : 'なし'}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly usage chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              月別着用回数
            </Text>
          </View>

          {Object.keys(itemStats.wearsByMonth).length > 0 ? (
            <View style={styles.chartContainer}>
              {Object.entries(itemStats.wearsByMonth).map(([month, count]) => {
                // Calculate bar height based on maximum value
                const maxCount = Math.max(
                  ...Object.values(itemStats.wearsByMonth),
                  1 // Avoid division by zero
                );
                const heightPercentage = (count / maxCount) * 100;

                return (
                  <View key={month} style={styles.chartBarContainer}>
                    <Text style={styles.chartValue}>
                      {count}
                    </Text>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${heightPercentage}%`,
                          backgroundColor: theme.primary || '#3498db',
                        },
                      ]}
                    />
                    <Text style={styles.chartLabel}>
                      {month}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 }}>
                着用データがありません
              </Text>
              <Text style={{ fontSize: 14, textAlign: 'center', color: theme.text + "99", paddingHorizontal: 16 }}>
                このアイテムを着用すると、月別の着用回数データが表示されます。
              </Text>
            </View>
          )}
        </View>

        {/* Environmental impact */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#27ae60" />
            <Text style={styles.cardTitle}>
              環境への影響
            </Text>
            <TouchableOpacity 
              onPress={() => setShowWashInfoModal(true)}
              style={styles.infoIcon}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.text + "99"} />
            </TouchableOpacity>
          </View>

          <View style={styles.impactContainer}>
            <View style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                <Ionicons name="water" size={24} color="#3498db" />
              </View>
              <Text style={styles.impactValue}>
                {itemStats.waterSaved.toFixed(1)}L
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.impactLabel}>節水量</Text>
                <TouchableOpacity 
                  onPress={() => setShowWaterInfoModal(true)}
                  style={{ marginLeft: 2 }}
                >
                  <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                <Ionicons name="flash" size={24} color="#27ae60" />
              </View>
              <Text style={styles.impactValue}>
                {itemStats.energySaved.toFixed(1)}kWh
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.impactLabel}>節電量</Text>
                <TouchableOpacity 
                  onPress={() => setShowEnergyInfoModal(true)}
                  style={{ marginLeft: 2 }}
                >
                  <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                <Ionicons name="cloud" size={24} color="#e74c3c" />
              </View>
              <Text style={styles.impactValue}>
                {itemStats.co2Reduced.toFixed(1)}kg
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.impactLabel}>CO2削減量</Text>
                <TouchableOpacity 
                  onPress={() => setShowCO2InfoModal(true)}
                  style={{ marginLeft: 2 }}
                >
                  <Ionicons name="information-circle-outline" size={14} color={theme.text + "99"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.impactDescription}>
            このアイテムの適切な洗濯頻度により、上記の資源を節約し、環境への影響を軽減しています。
          </Text>
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
              水量の節約効果は、削減された洗濯回数に1回の洗濯で使用される平均的な水量（約65リットル）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              料金は地域によって異なりますが、一般的な水道料金（1000リットルあたり約300円）に基づいて計算しています。
            </Text>

            <Text style={styles.modalText}>
              例：洗濯回数を10回削減した場合、65リットル×10回=650リットルの水を節約したことになり、料金に換算すると約195円の節約となります。
            </Text>
          </View>
        </View>
      </Modal>

      {/* Energy Info Modal */}
      <Modal
        visible={showEnergyInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEnergyInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowEnergyInfoModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>電気量（料金）の計算方法について</Text>

            <Text style={styles.modalText}>
              電気量の節約効果は、削減された洗濯回数に1回の洗濯で使用される平均的な電力量（約0.9kWh）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              料金は電力会社や契約プランによって異なりますが、一般的な電気料金（1kWhあたり約25円）に基づいて計算しています。
            </Text>

            <Text style={styles.modalText}>
              例：洗濯回数を10回削減した場合、0.9kWh×10回=9kWhの電力を節約したことになり、料金に換算すると約225円の節約となります。
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
              CO2削減量は、節約された電力量に電力のCO2排出係数（1kWhあたり約0.6kg）を掛けて計算しています。
            </Text>

            <Text style={styles.modalText}>
              洗濯機の使用だけでなく、水の供給や処理に関連するCO2排出も考慮しています。
            </Text>

            <Text style={styles.modalText}>
              例：電力を9kWh節約した場合、9kWh×0.6kg/kWh=5.4kgのCO2排出を削減したことになります。
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
