import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
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
    if (itemStats.efficiency >= 1) return { text: '良好', color: '#27ae60' };
    if (itemStats.efficiency >= 0.7) return { text: '注意', color: '#f39c12' };
    return { text: '要改善', color: '#e74c3c' };
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
      <ScrollView style={styles.container}>
        {/* Item basic info */}
        <View style={styles.card}>
          <Text style={styles.itemName}>
            {itemStats.name}
          </Text>
          <Text style={styles.itemCategory}>
            {itemStats.category}
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
              <View 
                style={[
                  styles.efficiencyIndicator, 
                  { left: `${Math.min(itemStats.efficiency * 100, 100)}%`, backgroundColor: efficiencyStatus.color }
                ]} 
              />
              <View style={styles.efficiencyScale}>
                <Text style={styles.efficiencyScaleText}>低</Text>
                <Text style={styles.efficiencyScaleText}>最適</Text>
                <Text style={styles.efficiencyScaleText}>高</Text>
              </View>
            </View>

            <Text style={styles.efficiencyDescription}>
              {itemStats.efficiency >= 1 
                ? 'このアイテムは最適な頻度で洗濯されています。このまま続けましょう！' 
                : itemStats.efficiency >= 0.7 
                  ? 'このアイテムはやや頻繁に洗濯されています。もう少し着用回数を増やせる可能性があります。' 
                  : 'このアイテムは洗濯頻度が高すぎる可能性があります。洗濯の間にもっと着用することで、衣類の寿命を延ばし、環境への影響を減らせます。'}
            </Text>

            <View style={styles.efficiencyTip}>
              <Ionicons name="bulb" size={16} color="#f39c12" />
              <Text style={styles.tipText}>
                {itemStats.category === 'デニム' 
                  ? 'デニムは5-10回着用ごとに洗濯するのが理想的です。' 
                  : itemStats.category === 'アウター' 
                    ? 'アウターは汚れた場合を除き、シーズンに1-2回の洗濯で十分です。' 
                    : '一般的な衣類は2-3回着用ごとに洗濯するのが理想的です。'}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage patterns card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              使用パターン
            </Text>
          </View>

          <View style={styles.patternContainer}>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                最も着用する曜日
              </Text>
              {mostWornDay ? (
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
              {mostWornMonth ? (
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
              <Text style={styles.patternValue}>
                {itemStats.averageWearInterval.toFixed(1)}日
              </Text>
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
        </View>

        {/* Environmental impact */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#27ae60" />
            <Text style={styles.cardTitle}>
              環境への影響
            </Text>
          </View>

          <View style={styles.impactContainer}>
            <View style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                <Ionicons name="water" size={24} color="#3498db" />
              </View>
              <Text style={styles.impactValue}>
                {itemStats.waterSaved.toFixed(1)}L
              </Text>
              <Text style={styles.impactLabel}>
                節水量
              </Text>
            </View>

            <View style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                <Ionicons name="flash" size={24} color="#27ae60" />
              </View>
              <Text style={styles.impactValue}>
                {itemStats.energySaved.toFixed(1)}kWh
              </Text>
              <Text style={styles.impactLabel}>
                節電量
              </Text>
            </View>

            <View style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                <Ionicons name="cloud" size={24} color="#e74c3c" />
              </View>
              <Text style={styles.impactValue}>
                {itemStats.co2Reduced.toFixed(1)}kg
              </Text>
              <Text style={styles.impactLabel}>
                CO2削減量
              </Text>
            </View>
          </View>

          <Text style={styles.impactDescription}>
            このアイテムの適切な洗濯頻度により、上記の資源を節約し、環境への影響を軽減しています。
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
