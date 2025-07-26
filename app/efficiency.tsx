import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { useImageUrls } from '../hooks/useImageUrls';
import { EfficiencyItem, Period } from "../services/statisticsServiceFactory";
import { CategoryValue, getCategoryIdByValueExtended } from "../types/categories";

export default function EfficiencyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  // カテゴリ翻訳関数
  const getCategoryName = (categoryValue: CategoryValue) => {
    if (!categoryValue) return '';
    
    // CategoryValue（日本語表示名）からカテゴリIDを取得
    const categoryId = getCategoryIdByValueExtended(categoryValue);
    
    // カテゴリIDを翻訳キーに変換
    return t(`categories.${categoryId}`);
  };

  // 統計コンテキストを使用（新しいAPI）
  const {
    efficiencyData: items,
    isCalculating,
    calculationError,
    period,
    setPeriod,
    recalculateStatistics
  } = useStatistics();

  // 画像URLを取得
  const imageUrls = useImageUrls(items || [], { 
    width: 320, 
    height: 320
  });

  // ローディングとエラーの状態
  const loading = isCalculating;
  const error = calculationError;

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // Get status color
  const getStatusColor = (status: 'good' | 'underwashed' | 'overwashed', wearCount?: number, washCount?: number) => {
    // 着用・洗濯履歴がない場合、または洗濯履歴が0件の場合はグレーを返す
    if (wearCount === 0 && washCount === 0) {
      return '#999'; // Gray
    } else if (washCount === 0) {
      return '#999'; // Gray
    }

    switch (status) {
      case 'good': return '#27ae60'; // Green
      case 'underwashed': return '#f39c12'; // Orange
      case 'overwashed': return '#e74c3c'; // Red
      default: return '#999'; // Gray
    }
  };

  // Get status text
  const getStatusText = (status: 'good' | 'underwashed' | 'overwashed', wearCount: number, washCount: number) => {
    // 着用・洗濯履歴がない場合、または洗濯履歴が0件の場合は特別なテキストを表示
    if (wearCount === 0 && washCount === 0) {
      return t('efficiency.status.noHistory');
    } else if (washCount === 0) {
      return t('efficiency.status.noData');
    }

    switch (status) {
      case 'good': return t('efficiency.status.good');
      case 'underwashed': return t('efficiency.status.underwashed');
      case 'overwashed': return t('efficiency.status.overwashed');
      default: return t('efficiency.status.unknown');
    }
  };

  // Get efficiency message
  const getEfficiencyMessage = (status: 'good' | 'underwashed' | 'overwashed', wearCount: number, washCount: number) => {
    // 着用・洗濯履歴がない場合は特別なメッセージを表示
    if (wearCount === 0 && washCount === 0) {
      return t('efficiency.messages.noHistory');
    } else if (washCount === 0) {
      return t('efficiency.messages.noWashData');
    }

    switch (status) {
      case 'good':
        return t('efficiency.messages.good');
      case 'underwashed':
        return t('efficiency.messages.underwashed');
      case 'overwashed':
        return t('efficiency.messages.overwashed');
      default:
        return t('efficiency.messages.insufficient');
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
      {/* 上部セクション：画像、アイテム名、統計値 */}
      <View style={styles.upperSection}>
        <View style={styles.imageContainer}>
          {imageUrls[item.id] || item.imageUrl ? (
            <Image
              source={{
                uri: imageUrls[item.id] || item.imageUrl,
                cacheKey: item.imageUrl,
                width: 60,
                height: 60
              }}
              style={styles.itemImage}
              contentFit="cover"
              cachePolicy="disk"
              onError={() => {
                // エラー時は何もしない（フォールバック表示になる）
              }}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="shirt-outline" size={30} color={theme.text + "66"} />
            </View>
          )}
        </View>

        <View style={styles.itemInfoSection}>
                          {item.name && item.name.trim() && (
                  <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                )}
          <Text style={[styles.itemCategory, { color: theme.text + "99" }]}>
            {item.brand ? `${item.brand} / ${getCategoryName(item.category)}` : getCategoryName(item.category)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {item.wearCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
                {t('efficiency.stats.wearCount')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {item.washCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
                {t('efficiency.stats.washCount')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {item.threshold}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
                {t('efficiency.stats.threshold')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getStatusColor(item.status, item.wearCount, item.washCount) }]}>
                {getStatusText(item.status, item.wearCount, item.washCount)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
                {t('efficiency.stats.efficiency')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 下部セクション：効率の詳細説明 */}
      <View style={styles.lowerSection}>
        <View style={styles.efficiencyContainer}>
          <View style={styles.efficiencyLabelContainer}>
            <Text style={[styles.efficiencyLabel, { color: theme.text }]}>
              {t('efficiency.stats.efficiency')}
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
            {/* 現在の効率を示すインジケーター - 履歴がない場合、または洗濯履歴が0件の場合は表示しない */}
            {item.washCount > 0 && (
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
              <Text style={styles.efficiencyScaleText}>{t('efficiency.status.underwashed')}</Text>
              <Text style={[styles.efficiencyScaleText, { position: 'absolute', left: '50%', transform: [{ translateX: -10 }] }]}>{t('efficiency.status.good')}</Text>
              <Text style={styles.efficiencyScaleText}>{t('efficiency.status.overwashed')}</Text>
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
    { label: t('efficiency.period.1month'), value: '1month' },
    { label: t('efficiency.period.3months'), value: '3months' },
    { label: t('efficiency.period.6months'), value: '6months' },
    { label: t('efficiency.period.1year'), value: '1year' },
    { label: t('efficiency.period.all'), value: 'all' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
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
      backgroundColor: theme.card,
      borderRadius: 8,
      marginBottom: 12,
      padding: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 4,
      backgroundColor: '#f0f0f0',
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
      marginTop: 12,
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
    upperSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    imageContainer: {
      marginRight: 12,
    },
    itemInfoSection: {
      flex: 1,
    },
    lowerSection: {
      flex: 1,
    },
    placeholderContainer: {
      width: 60,
      height: 60,
      borderRadius: 4,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>{t('efficiency.loading')}</Text>
      </View>
    );
  }

  // Render error state
  if (error && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{t('efficiency.error.title')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={recalculateStatistics}>
          <Text style={styles.retryButtonText}>{t('efficiency.error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('efficiency.title'),
          headerBackTitle: t('common.back'),
        }}
      />
      <View style={styles.container}>
        {/* Period selector */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>{t('common.period')}</Text>
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
              {t('efficiency.summary.title')}
            </Text>
          </View>

          {items.length > 0 ? (
            <>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryBadge, { backgroundColor: '#f39c12' }]}>
                    <Text style={styles.summaryBadgeText}>
                      {items.filter(item => item.status === 'underwashed' && item.washCount > 0).length}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemText, { color: theme.text }]}>
                    {t('efficiency.status.underwashed')}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryBadge, { backgroundColor: '#27ae60' }]}>
                    <Text style={styles.summaryBadgeText}>
                      {items.filter(item => item.status === 'good' && item.washCount > 0).length}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemText, { color: theme.text }]}>
                    {t('efficiency.status.good')}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryBadge, { backgroundColor: '#e74c3c' }]}>
                    <Text style={styles.summaryBadgeText}>
                      {items.filter(item => item.status === 'overwashed' && item.washCount > 0).length}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemText, { color: theme.text }]}>
                    {t('efficiency.status.overwashed')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.summaryTip, { color: theme.text + "99" }]}>
                <Ionicons name="bulb" size={16} color={theme.warning} /> {t('common.tip')}:
                {t('efficiency.tip')}
              </Text>
            </>
          ) : (
            <View style={styles.emptyEfficiencyContainer}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.emptyEfficiencyText, { color: theme.text }]}>
                {t('efficiency.noData.title')}
              </Text>
              <Text style={[styles.emptyEfficiencySubtext, { color: theme.text + "99" }]}>
                {t('efficiency.noData.message')}
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
              {t('common.noItems')}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99" }]}>
              {t('common.changeFilter')}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
