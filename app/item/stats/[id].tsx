import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../../../contexts/StatisticsContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { formatDateLocalized } from "../../../lib/dateUtils";
import { getPrivateUrl } from "../../../lib/storageClient";
import { ItemDetailStats } from "../../../services/statisticsServiceFactory";
import { CategoryValue } from "../../../types/categories";

export default function ItemDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // 統計コンテキストを使用（新しいAPI）
  const { getItemDetailStats } = useStatistics();

  // ローカル状態
  const [itemStats, setItemStats] = useState<ItemDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // モーダル表示状態
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
    placeholderContainer: {
      width: 120,
      height: 120,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.card + '20',
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

  // アイテム詳細データを取得
  const fetchItemDetail = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      console.log('アイテム詳細画面: データ取得開始');
      const data = await getItemDetailStats(id);
      if (!data) {
        throw new Error(t('itemDetail.dataNotFound'));
      }
      console.log('アイテム詳細画面: 取得したデータ:', {
        id: data.id,
        name: data.name,
        category: data.category,
        brand: data.brand,
        imageUrl: data.imageUrl
      });
      setItemStats(data);

      // 画像URLを取得
      const imagePath = data.imageUrl;
      console.log('画像パス:', imagePath);
      if (imagePath) {
        try {
          // 単一の画像URLを取得
          const url = await getPrivateUrl(imagePath);
          console.log('取得した画像URL:', url);
          setImageUrl(url);
        } catch (error) {
          console.error('画像URL取得エラー:', error);
          setImageUrl(null);
        }
      } else {
        console.log('画像パスが存在しません');
        setImageUrl(null);
      }
    } catch (err) {
      console.error('アイテム詳細データの取得エラー:', err);
      setError(t('itemDetail.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [id, getItemDetailStats]);

  // Load data on mount
  useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);

  // Calculate efficiency status - itemStatsがnullでないことを確認
  const getEfficiencyStatus = useCallback(() => {
    if (!itemStats) return { text: t('itemStats.efficiency.noData'), color: '#999' };

    // 着用・洗濯履歴がない場合、または洗濯履歴が0件の場合は判定を表示しない
    if (itemStats.wearCount === 0 && itemStats.washCount === 0) {
      return { text: t('itemStats.efficiency.noHistory'), color: '#999' };
    } else if (itemStats.washCount === 0) {
      return { text: t('itemStats.efficiency.noData'), color: '#999' };
    }

    const lowerThreshold = 0.8; // 閾値の80%
    const upperThreshold = 1.2; // 閾値の120%

    if (itemStats.efficiency >= lowerThreshold && itemStats.efficiency <= upperThreshold) {
      return { text: t('itemStats.efficiency.good'), color: '#27ae60' }; // 最適範囲内
    } else if (itemStats.efficiency > upperThreshold) {
      return { text: t('itemStats.efficiency.underwashed'), color: '#f39c12' }; // 洗濯頻度が低すぎる
    } else {
      return { text: t('itemStats.efficiency.overwashed'), color: '#e74c3c' }; // 洗濯頻度が高すぎる
    }
  }, [itemStats, t]);

  // Find day with most wears - itemStatsがnullでないことを確認
  const getMostWornDay = useCallback(() => {
    if (!itemStats) return null;
    const days = Object.entries(itemStats.wearsByDay);
    if (days.length === 0) return null;

    console.log('Days data:', days); // デバッグ用

    return days.reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    });
  }, [itemStats]);

  // Find month with most wears - itemStatsがnullでないことを確認
  const getMostWornMonth = useCallback(() => {
    if (!itemStats) return null;
    const months = Object.entries(itemStats.wearsByMonth);
    if (months.length === 0) return null;

    console.log('Months data:', months); // デバッグ用

    return months.reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    });
  }, [itemStats]);

  // カテゴリ名を翻訳する関数
  const getCategoryName = useCallback((category: CategoryValue) => {
    if (!category) return '';
    
    const categoryMap: Record<string, string> = {
      'トップス': 'tops',
      'ボトムス': 'bottoms',
      'ワンピース': 'dress',
      'アウター': 'outerwear',
      'ジャケット': 'jacket',
      'シューズ': 'shoes',
      'バッグ': 'bag',
      '小物': 'accessories',
      'セットアップ': 'setup',
      'その他': 'others'
    };
    return t(`itemStats.categories.${categoryMap[category]}`);
  }, [t]);

  // 曜日名を翻訳する関数
  const getDayName = useCallback((day: string) => {
    console.log('getDayName called with:', day); // デバッグ用
    
    const dayMap: Record<string, string> = {
      // 英語の曜日
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday',
      // 日本語の曜日
      '月曜日': 'monday',
      '火曜日': 'tuesday',
      '水曜日': 'wednesday',
      '木曜日': 'thursday',
      '金曜日': 'friday',
      '土曜日': 'saturday',
      '日曜日': 'sunday'
    };
    
    const mappedDay = dayMap[day];
    console.log('Mapped day:', mappedDay); // デバッグ用
    
    if (!mappedDay) {
      console.warn('Unknown day:', day);
      return day; // 翻訳できない場合は元の値を返す
    }
    
    return t(`itemStats.days.${mappedDay}`);
  }, [t]);

  // 月名を翻訳する関数
  const getMonthName = useCallback((month: string) => {
    console.log('getMonthName called with:', month); // デバッグ用
    
    const monthMap: Record<string, string> = {
      // 英語の月
      'January': 'january',
      'February': 'february',
      'March': 'march',
      'April': 'april',
      'May': 'may',
      'June': 'june',
      'July': 'july',
      'August': 'august',
      'September': 'september',
      'October': 'october',
      'November': 'november',
      'December': 'december',
      // 日本語の月
      '1月': 'january',
      '2月': 'february',
      '3月': 'march',
      '4月': 'april',
      '5月': 'may',
      '6月': 'june',
      '7月': 'july',
      '8月': 'august',
      '9月': 'september',
      '10月': 'october',
      '11月': 'november',
      '12月': 'december'
    };
    
    const mappedMonth = monthMap[month];
    console.log('Mapped month:', mappedMonth); // デバッグ用
    
    if (!mappedMonth) {
      console.warn('Unknown month:', month);
      return month; // 翻訳できない場合は元の値を返す
    }
    
    return t(`itemStats.months.${mappedMonth}`);
  }, [t]);

  // カテゴリに基づく洗濯アドバイスを取得
  const getWashingAdvice = useCallback((category: CategoryValue) => {
    switch (category) {
      case 'ボトムス':
        return t('itemStats.efficiency.tip.bottoms');
      case 'アウター':
        return t('itemStats.efficiency.tip.outerwear');
      default:
        return t('itemStats.efficiency.tip.default');
    }
  }, [t]);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary || '#3498db'} />
        <Text style={{ marginTop: 16, color: theme.text }}>{t('itemStats.loading')}</Text>
      </View>
    );
  }

  // Render error state
  if (error || !itemStats) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error || '#e74c3c'} />
        <Text style={styles.errorText}>
          {error || t('itemDetail.notFound')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetail}>
          <Text style={styles.retryButtonText}>{t('itemStats.retry')}</Text>
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
          title: t('itemStats.title'),
          headerBackTitle: t('common.back'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Item basic info */}
        <View style={styles.card}>
          {itemStats.name && itemStats.name.trim() && (
            <Text style={styles.itemName}>
              {itemStats.name}
            </Text>
          )}
          <Text style={styles.itemCategory}>
            {itemStats.brand ? `${itemStats.brand} / ${getCategoryName(itemStats.category)}` : getCategoryName(itemStats.category)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {itemStats.wearCount}
              </Text>
              <Text style={styles.statLabel}>
                {t('itemStats.stats.wearCount')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {itemStats.washCount}
              </Text>
              <Text style={styles.statLabel}>
                {t('itemStats.stats.washCount')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(itemStats.wearPerWash || 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>
                {t('itemStats.stats.wearPerWash')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: efficiencyStatus.color }]}>
                {efficiencyStatus.text}
              </Text>
              <Text style={styles.statLabel}>
                {t('itemStats.stats.efficiency')}
              </Text>
            </View>
          </View>

          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{
                  uri: imageUrl,
                  width: 120,
                  height: 120
                }}
                style={[styles.itemImage, { width: 120, height: 120 }]}
                contentFit="cover"
                cachePolicy="disk"
                transition={200}
                onError={(error) => {
                  console.error('Image load error:', error);
                  setImageUrl(null);
                }}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="shirt-outline" size={60} color={theme.text + "66"} />
              </View>
            )}
          </View>
        </View>

        {/* Efficiency card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              {t('itemStats.efficiency.title')}
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
              {/* 現在の効率を示すインジケーター - 履歴がない場合、または洗濯履歴が0件の場合は表示しない */}
              {itemStats.washCount > 0 && (
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
                <Text style={styles.efficiencyScaleText}>{t('itemStats.efficiency.underwashed')}</Text>
                <Text style={[styles.efficiencyScaleText, { position: 'absolute', left: '50%', transform: [{ translateX: -10 }] }]}>{t('itemStats.efficiency.good')}</Text>
                <Text style={styles.efficiencyScaleText}>{t('itemStats.efficiency.overwashed')}</Text>
              </View>
            </View>

            <Text style={styles.efficiencyDescription}>
              {itemStats.wearCount === 0 && itemStats.washCount === 0
                ? t('itemStats.efficiency.noWearWashHistory')
                : itemStats.washCount === 0
                  ? t('itemStats.efficiency.noWashHistory')
                  : itemStats.efficiency >= 0.8 && itemStats.efficiency <= 1.2
                    ? t('itemStats.efficiency.optimal')
                    : itemStats.efficiency < 0.8
                      ? t('itemStats.efficiency.overwashedDesc')
                      : t('itemStats.efficiency.underwashedDesc')}
            </Text>

            <View style={styles.efficiencyTip}>
              <Ionicons name="bulb" size={16} color="#f39c12" />
              <Text style={styles.tipText}>
                {getWashingAdvice(itemStats.category)}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage patterns card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              {t('itemStats.patterns.title')}
            </Text>
          </View>

          <View style={styles.patternContainer}>
            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                {t('itemStats.patterns.mostWornDay')}
              </Text>
              {itemStats.wearCount > 0 && mostWornDay ? (
                <Text style={styles.patternValue}>
                  {getDayName(mostWornDay[0])}（{mostWornDay[1]}{t('itemStats.patterns.times')}）
                </Text>
              ) : (
                <Text style={[styles.patternValue, { color: theme.text + "99" }]}>
                  {t('itemStats.patterns.noData')}
                </Text>
              )}
            </View>

            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                {t('itemStats.patterns.mostWornMonth')}
              </Text>
              {itemStats.wearCount > 0 && mostWornMonth ? (
                <Text style={styles.patternValue}>
                  {getMonthName(mostWornMonth[0])}（{mostWornMonth[1]}{t('itemStats.patterns.times')}）
                </Text>
              ) : (
                <Text style={[styles.patternValue, { color: theme.text + "99" }]}>
                  {t('itemStats.patterns.noData')}
                </Text>
              )}
            </View>

            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                {t('itemStats.patterns.avgWearInterval')}
              </Text>
              {itemStats.wearCount > 1 ? (
                <Text style={styles.patternValue}>
                  {(itemStats.averageWearInterval || 0).toFixed(1)}{t('itemStats.units.days')}
                </Text>
              ) : (
                <Text style={[styles.patternValue, { color: theme.text + "99" }]}>
                  {t('itemStats.patterns.noData')}
                </Text>
              )}
            </View>

            <View style={styles.patternItem}>
              <Text style={styles.patternLabel}>
                {t('itemStats.patterns.lastWornDate')}
              </Text>
              <Text style={styles.patternValue}>
                {itemStats.lastWornDate ? formatDateLocalized(itemStats.lastWornDate, i18n.language) : t('itemDetail.stats.none')}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly usage chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>
              {t('itemStats.monthlyChart.title')}
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
                      {getMonthName(month)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 }}>
                {t('itemStats.monthlyChart.noData')}
              </Text>
              <Text style={{ fontSize: 14, textAlign: 'center', color: theme.text + "99", paddingHorizontal: 16 }}>
                {t('itemStats.monthlyChart.noDataDesc')}
              </Text>
            </View>
          )}
        </View>

        {/* Environmental impact */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#27ae60" />
            <Text style={styles.cardTitle}>
              {t('itemStats.environmental.title')}
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
                {(itemStats.waterSaved || 0).toFixed(1)}L
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.impactLabel}>{t('itemStats.environmental.waterSaved')}</Text>
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
                {(itemStats.energySaved || 0).toFixed(1)}kWh
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.impactLabel}>{t('itemStats.environmental.energySaved')}</Text>
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
                {(itemStats.co2Reduced || 0).toFixed(1)}kg
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.impactLabel}>{t('itemStats.environmental.co2Reduced')}</Text>
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
            {t('itemStats.environmental.description')}
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

            <Text style={styles.modalTitle}>{t('itemStats.modals.washInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.washInfo.description1')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.washInfo.description2')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.washInfo.example')}
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

            <Text style={styles.modalTitle}>{t('itemStats.modals.waterInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.waterInfo.description1')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.waterInfo.description2')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.waterInfo.example')}
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

            <Text style={styles.modalTitle}>{t('itemStats.modals.energyInfo.title')}</Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.energyInfo.description1')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.energyInfo.description2')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.energyInfo.example')}
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

            <Text style={styles.modalTitle}>{t('itemStats.modals.co2Info.title')}</Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.co2Info.description1')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.co2Info.description2')}
            </Text>

            <Text style={styles.modalText}>
              {t('itemStats.modals.co2Info.example')}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
