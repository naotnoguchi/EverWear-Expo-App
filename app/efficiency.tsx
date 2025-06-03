import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { statisticsService, EfficiencyItem, Period } from "../services/statisticsServiceFactory";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";

export default function EfficiencyScreen() {
  const theme = useTheme();

  // State
  const [items, setItems] = useState<EfficiencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('3months');

  // Fetch efficiency data
  const fetchEfficiency = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getEfficiencyData(period);
      setItems(data);
    } catch (err) {
      console.error('Error fetching efficiency data:', err);
      setError('効率データの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load data on mount and when period changes
  useEffect(() => {
    fetchEfficiency();
  }, [fetchEfficiency]);

  // Handle period change
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // Get status color
  const getStatusColor = (status: 'good' | 'underwashed' | 'overwashed', wearCount?: number, washCount?: number) => {
    // 着用・洗濯履歴がない場合はグレーを返す
    if (wearCount === 0 && washCount === 0) {
      return '#999'; // Gray
    }

    switch (status) {
      case 'good': return '#27ae60'; // Green
      case 'underwashed': return '#f39c12'; // Orange
      case 'overwashed': return '#e74c3c'; // Red
      default: return '#3498db'; // Blue
    }
  };

  // Get status text
  const getStatusText = (status: 'good' | 'underwashed' | 'overwashed', wearCount: number, washCount: number) => {
    // 着用・洗濯履歴がない場合は特別なテキストを表示
    if (wearCount === 0 && washCount === 0) {
      return '履歴なし';
    }

    switch (status) {
      case 'good': return '良好';
      case 'underwashed': return '洗濯不足';
      case 'overwashed': return '洗いすぎ';
      default: return '不明';
    }
  };

  // Get efficiency message
  const getEfficiencyMessage = (status: 'good' | 'underwashed' | 'overwashed', wearCount: number, washCount: number) => {
    // 着用・洗濯履歴がない場合は特別なメッセージを表示
    if (wearCount === 0 && washCount === 0) {
      return 'このアイテムはまだ着用・洗濯の記録がありません。着用と洗濯を記録すると、洗濯効率の分析が表示されます。';
    }

    switch (status) {
      case 'good':
        return '最適な洗濯頻度で使用されています。このまま続けましょう！';
      case 'underwashed':
        return '洗濯頻度が低すぎる可能性があります。衣類の清潔さを保つため、もう少し頻繁に洗濯することを検討してください。';
      case 'overwashed':
        return '洗濯頻度が高すぎる可能性があります。洗濯の間にもっと着用することで、衣類の寿命を延ばし、環境への影響を減らせます。';
      default:
        return '洗濯データが不足しています。';
    }
  };

  // Render item
  const renderItem = ({ item }: { item: EfficiencyItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => router.push({
        pathname: '/item/stats/[id]',
        params: { id: item.id }
      })}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemCategory, { color: theme.text + "99" }]}>
          {item.brand ? `${item.brand} / ${item.category}` : item.category}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {item.wearCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
              着用回数
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {item.washCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
              洗濯回数
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {item.threshold}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
              閾値
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getStatusColor(item.status, item.wearCount, item.washCount) }]}>
              {getStatusText(item.status, item.wearCount, item.washCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
              効率
            </Text>
          </View>
        </View>

        <View style={styles.efficiencyContainer}>
          <View style={styles.efficiencyLabelContainer}>
            <Text style={[styles.efficiencyLabel, { color: theme.text }]}>
              効率
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.wearCount, item.washCount) }]}>
              <Text style={styles.statusText}>
                {getStatusText(item.status, item.wearCount, item.washCount)}
              </Text>
            </View>
          </View>

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
            {(item.wearCount > 0 || item.washCount > 0) && (
              <View
                style={[
                  styles.efficiencyIndicator,
                  {
                    left: `${100 - Math.min(item.efficiency * 50, 100)}%`,  // 反転させた位置計算
                    backgroundColor: getStatusColor(item.status, item.wearCount, item.washCount)
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

          <Text style={[styles.efficiencyText, { color: theme.text + "99" }]}>
            {getEfficiencyMessage(item.status, item.wearCount, item.washCount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    summaryCard: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    summaryContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    summaryBadgeText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    summaryItemText: {
      fontSize: 12,
    },
    summaryTip: {
      fontSize: 14,
      backgroundColor: 'rgba(243, 156, 18, 0.1)',
      padding: 12,
      borderRadius: 8,
    },
    emptyEfficiencyContainer: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyEfficiencyText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 8,
    },
    emptyEfficiencySubtext: {
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    listContent: {
      paddingBottom: 16,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    itemImage: {
      width: 80,
      height: 120,
    },
    itemInfo: {
      flex: 1,
      padding: 12,
    },
    itemName: {
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 2,
    },
    itemCategory: {
      fontSize: 12,
      marginBottom: 8,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 10,
    },
    efficiencyContainer: {
      marginTop: 4,
    },
    efficiencyLabelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    efficiencyLabel: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressBar: {
      height: '100%',
    },
    efficiencyMeter: {
      height: 30,
      marginBottom: 8,
      position: 'relative',
    },
    efficiencyIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      position: 'absolute',
      top: 0,
      transform: [{ translateX: -6 }],
    },
    optimalRange: {
      height: 6,
      backgroundColor: '#27ae60' + '40', // Green with opacity
      position: 'absolute',
      top: 3,
      borderRadius: 3,
    },
    underwashedRange: {
      height: 6,
      backgroundColor: '#f39c12' + '40', // Orange with opacity
      position: 'absolute',
      top: 3,
      borderRadius: 3,
    },
    overwashedRange: {
      height: 6,
      backgroundColor: '#e74c3c' + '40', // Red with opacity
      position: 'absolute',
      top: 3,
      borderRadius: 3,
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
      fontSize: 10,
      color: theme.text + "99",
    },
    efficiencyText: {
      fontSize: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
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
  });

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>効率データを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEfficiency}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "洗濯効率分析",
          headerBackTitle: "戻る",
        }}
      />
      <View style={styles.container}>
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

        {/* Efficiency summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="speedometer" size={24} color={theme.primary} />
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              洗濯効率サマリー
            </Text>
          </View>

          {items.length > 0 ? (
            <>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryBadge, { backgroundColor: '#f39c12' }]}>
                    <Text style={styles.summaryBadgeText}>
                      {items.filter(item => item.status === 'underwashed' && (item.wearCount > 0 || item.washCount > 0)).length}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemText, { color: theme.text }]}>
                    洗濯不足
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <View style={[styles.summaryBadge, { backgroundColor: '#27ae60' }]}>
                    <Text style={styles.summaryBadgeText}>
                      {items.filter(item => item.status === 'good' && (item.wearCount > 0 || item.washCount > 0)).length}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemText, { color: theme.text }]}>
                    良好
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <View style={[styles.summaryBadge, { backgroundColor: '#e74c3c' }]}>
                    <Text style={styles.summaryBadgeText}>
                      {items.filter(item => item.status === 'overwashed' && (item.wearCount > 0 || item.washCount > 0)).length}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemText, { color: theme.text }]}>
                    洗いすぎ
                  </Text>
                </View>
              </View>

              <Text style={[styles.summaryTip, { color: theme.text + "99" }]}>
                <Ionicons name="bulb" size={16} color={theme.warning} /> ヒント:
                洗濯効率を高めるには、設定した閾値に近い頻度で洗濯しましょう。洗いすぎも洗わなさすぎも避けることが大切です。
              </Text>
            </>
          ) : (
            <View style={styles.emptyEfficiencyContainer}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.emptyEfficiencyText, { color: theme.text }]}>
                洗濯効率データがありません
              </Text>
              <Text style={[styles.emptyEfficiencySubtext, { color: theme.text + "99" }]}>
                アイテムを登録して着用・洗濯履歴を記録すると、洗濯効率の分析情報が表示されます。
              </Text>
            </View>
          )}
        </View>

        {/* Results */}
        {items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="water-outline" size={64} color={theme.text + "66"} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              該当するアイテムがありません
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99" }]}>
              フィルター条件を変更してお試しください
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
