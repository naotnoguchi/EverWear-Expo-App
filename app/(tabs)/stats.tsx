import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../../contexts/StatisticsContext";
import { useTabReset } from "../../contexts/TabResetContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDateLocalized } from "../../lib/dateUtils";
import { getPrivateUrls } from "../../lib/storageClient";
import type { BadgeWithStatus } from "../../services/badgeService";
import { Period, RankingItem } from "../../services/statisticsServiceFactory";
import { CategoryValue, getCategoryIdByValue } from "../../types/categories";

export default function Stats() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { registerResetFunction } = useTabReset();

  // カテゴリ翻訳関数
  const getCategoryName = (categoryValue: CategoryValue) => {
    if (!categoryValue) return '';
    
    // CategoryValue（日本語表示名）からカテゴリIDを取得
    const categoryId = getCategoryIdByValue(categoryValue);
    
    // カテゴリIDを翻訳キーに変換
    return t(`addItem.categories.${categoryId}`);
  };

  // 画像URL管理用の状態
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // 統計コンテキストを使用
  const { 
    basicStats: stats, 
    rankingData,
    impactData, 
    badges,
    isCalculating,
    calculationError,
    period,
    setPeriod,
    recalculateStatistics
  } = useStatistics();

  // トップ5アイテムと最新バッジの状態
  const [topItems, setTopItems] = useState<RankingItem[]>([]);
  const [recentBadge, setRecentBadge] = useState<BadgeWithStatus | null>(null);

  // ローディングとエラーの状態をコンテキストから取得
  const loading = isCalculating;
  const error = calculationError;

  // 画像URLを一括で取得
  useEffect(() => {
    const loadAllImageUrls = async () => {
      if (!rankingData || rankingData.length === 0) return;

      // 画像パスの配列を作成
      const imagePaths = rankingData
        .filter(item => item.imageUrl && !item.imageUrl.startsWith('http'))
        .map(item => item.imageUrl);

      if (imagePaths.length === 0) return;

      try {
        // 一括で署名付きURLを取得（高解像度サイズで取得）
        const urls = await getPrivateUrls(imagePaths, 320, 320);
        
        // 取得したURLをマッピング
        const newImageUrls: Record<string, string> = {};
        rankingData.forEach((item, index) => {
          if (urls[index]) {
            newImageUrls[item.id] = urls[index];
          }
        });

        setImageUrls(prev => ({ ...prev, ...newImageUrls }));
      } catch (error) {
        console.error('Error loading image URLs:', error);
      }
    };

    loadAllImageUrls();
  }, [rankingData]);

  // 効率ステータスの色を取得
  const getEfficiencyStatusColor = (status: string) => {
    if (status === t('stats.laundryEfficiency.status.good')) return '#27ae60'; // Green
    if (status === t('stats.laundryEfficiency.status.underwashing')) return '#f39c12'; // Orange
    if (status === t('stats.laundryEfficiency.status.overwashing')) return '#e74c3c'; // Red
    return '#3498db'; // Blue
  };

  // 追加: バッジカテゴリごとの色を取得（Badges 画面と統一）
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'usage': return '#3498db'; // Blue
      case 'efficiency': return '#27ae60'; // Green
      case 'milestone': return '#f39c12'; // Orange
      case 'achievement': return '#3498db'; // Blue (align with overview)
      case 'special': return '#9b59b6'; // Purple
      default: return '#95a5a6'; // Gray
    }
  };

  // 追加: バッジカテゴリごとのアイコンを取得（Badges 画面と統一）
  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'usage': return 'checkmark-circle';
      case 'efficiency': return 'speedometer';
      case 'milestone': return 'trophy';
      case 'achievement': return 'medal';
      case 'special': return 'star';
      default: return 'ribbon';
    }
  };

  // 統計データを取得
  const fetchStats = useCallback(async (selectedPeriod: Period = period) => {
    try {
      // 新しいAPIでは期間の変更はsetPeriodで行い、recalculateStatisticsは引数を取らない
      if (selectedPeriod !== period) {
        setPeriod(selectedPeriod);
      }
      await recalculateStatistics();
    } catch (err) {
      console.error('統計データの取得エラー:', err);
    }
  }, [recalculateStatistics, period, setPeriod]);

  // ランキングデータとバッジデータが更新されたときにトップ5と最新バッジを更新
  useEffect(() => {
    if (rankingData && Array.isArray(rankingData) && rankingData.length > 0) {
      setTopItems(rankingData.slice(0, 5));
    } else {
      setTopItems([]);
    }
  }, [rankingData]);

  useEffect(() => {
    if (badges && Array.isArray(badges) && badges.length > 0) {
      const earnedBadges = badges.filter(badge => badge.isEarned);
      if (earnedBadges.length > 0) {
        // 獲得日で並べ替え（最新順）
        const sortedBadges = [...earnedBadges].sort((a, b) => {
          if (!a.earnedDate || !b.earnedDate) return 0;
          return new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime();
        });
        setRecentBadge(sortedBadges[0]);
      } else {
        setRecentBadge(null);
      }
    } else {
      setRecentBadge(null);
    }
  }, [badges]);

  // マウント時とperiod変更時にデータを取得
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // タブリセット関数を登録
  useEffect(() => {
    registerResetFunction("stats", () => {
      // 一番上にスクロール
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      // データを更新
      fetchStats();
    });
  }, [registerResetFunction, fetchStats]);

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    // 新しいAPIでは期間変更時に自動で再計算されるため、fetchStatsの呼び出しは不要
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 16,
      backgroundColor: "#3498db", // Keep blue for brand consistency
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white", // Keep white for contrast on blue background
    },
    headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)", // Keep white with transparency for contrast on blue background
      marginTop: 4,
    },
    periodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      marginTop: 8,
      padding: 4,
    },
    periodOption: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    periodOptionSelected: {
      backgroundColor: 'white',
    },
    periodText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 12,
      fontWeight: '500',
    },
    periodTextSelected: {
      color: '#3498db',
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
    },
    errorText: {
      color: theme.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: "#3498db",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    navigationCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    navigationIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(52, 152, 219, 0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    navigationContent: {
      flex: 1,
    },
    navigationTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
    },
    navigationDescription: {
      fontSize: 14,
      color: theme.text + "99", // with transparency
      marginTop: 2,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 8,
      marginTop: -30,
    },
    statCard: {
      width: "46%",
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      margin: "2%",
      alignItems: "center",
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(52, 152, 219, 0.1)", // Keep blue with transparency for brand consistency
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      marginTop: 4,
    },
    section: {
      padding: 16,
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: 14,
      color: "#3498db",
      marginRight: 4,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
    },
    efficiencyContainer: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    efficiencyText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
    },
    efficiencyHighlight: {
      fontWeight: "bold",
    },
    efficiencyTip: {
      fontSize: 14,
      color: theme.text + "99", // with transparency
      marginTop: 12,
      backgroundColor: "rgba(243, 156, 18, 0.1)", // Keep orange with transparency for tips
      padding: 12,
      borderRadius: 8,
    },
    // Ranking styles
    rankingList: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 8,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    rankingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#3498db",
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    rankText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 4,
      marginRight: 12,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    itemCategory: {
      fontSize: 12,
      marginBottom: 4,
    },
    itemWears: {
      fontSize: 12,
      fontWeight: 'bold',
      color: "#3498db",
      marginBottom: 4,
    },
    barContainer: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 2,
    },
    bar: {
      height: '100%',
    },
    // Impact styles
    impactContainer: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    impactRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    impactItem: {
      alignItems: 'center',
      flex: 1,
      maxWidth: '33.33%',
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
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    impactLabel: {
      fontSize: 11,
      textAlign: 'center',
    },
    impactDescription: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    // Badge styles
    badgeCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    badgeContent: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    badgeIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    badgeInfo: {
      flex: 1,
    },
    badgeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    badgeName: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
    },
    recentBadge: {
      backgroundColor: '#27ae60',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    recentBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    badgeDescription: {
      fontSize: 14,
      marginBottom: 8,
    },
    badgeDate: {
      fontSize: 12,
    },
    moreBadgesText: {
      textAlign: 'center',
      color: "#3498db",
      fontSize: 14,
    },
    // Empty state
    emptyContainer: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 24,
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginHorizontal: 16,
      color: theme.text + "99",
    },
    checkBadgesButton: {
      backgroundColor: "#3498db",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBadgesText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });

  // Period options for selector
  const periodOptions: { label: string; value: Period }[] = [
    { label: t('stats.period.1month'), value: '1month' },
    { label: t('stats.period.3months'), value: '3months' },
    { label: t('stats.period.6months'), value: '6months' },
    { label: t('stats.period.1year'), value: '1year' },
    { label: t('stats.period.all'), value: 'all' },
  ];

  // Get period display text
  const getPeriodText = () => {
    return t(`stats.periodText.${period}`);
  };

  // Render loading state
  if (loading && !stats) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, color: theme.text }}>{t('common.loading.loadingStats')}</Text>
      </View>
    );
  }

  // Render error state
  if (error && !stats) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStats()}>
          <Text style={styles.retryButtonText}>{t('stats.error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          {t('stats.periodDescription', { period: getPeriodText() })}
        </Text>

        {/* Period selector */}
        <View style={styles.periodSelector}>
          {periodOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.periodOption,
                period === option.value && styles.periodOptionSelected,
              ]}
              onPress={() => handlePeriodChange(option.value)}
            >
              <Text
                style={[
                  styles.periodText,
                  period === option.value && styles.periodTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Basic statistics grid */}
      <View style={styles.statsGrid}>
        <View key="total-items" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="shirt" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>{t('stats.basicStats.totalItems')}</Text>
        </View>

        <View key="total-wears" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="repeat" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalWears || 0}</Text>
          <Text style={styles.statLabel}>{t('stats.basicStats.totalWears')}</Text>
        </View>

        <View key="total-washes" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="water" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalWashes || 0}</Text>
          <Text style={styles.statLabel}>{t('stats.basicStats.totalWashes')}</Text>
        </View>

        <View key="average-wears" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="analytics" size={24} color="#3498db" />
          </View>
          {stats && stats.totalWashes > 0 ? (
            <>
              <Text style={styles.statValue}>{stats.averageWearsBetweenWashes || 0}</Text>
              <Text style={styles.statLabel}>{t('stats.basicStats.averageWears')}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.statValue, { fontSize: 14 }]}>{t('stats.basicStats.noData')}</Text>
              <Text style={styles.statLabel}>{t('stats.basicStats.needWashHistory')}</Text>
            </>
          )}
        </View>
      </View>

      {/* Ranking section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stats.ranking.title')}</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/ranking')}
          >
            <Text style={styles.viewAllText}>{t('stats.ranking.viewAll')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {topItems && topItems.length > 0 ? (
          <View style={styles.rankingList}>
            {topItems.map((item, index) => (
              <TouchableOpacity 
                key={item.id || `ranking-item-${index}`}
                style={styles.rankingItem}
                onPress={() => {
                  if (item.id) {
                    router.push({
                      pathname: '/item/stats/[id]',
                      params: { id: item.id }
                    });
                  }
                }}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Image
                  source={{
                    uri: (item.id && imageUrls[item.id]) || item.imageUrl || '',
                    cacheKey: item.imageUrl || `fallback-${index}`,
                    width: 60,
                    height: 60
                  }}
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="disk"
                  onError={(error) => {
                    console.error(`[Image Load Error] Item ID: ${item.id || 'undefined'}`);
                  }}
                />
                <View style={styles.itemInfo}>
                  {item.name && item.name.trim() && (
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  )}
                  <Text style={[styles.itemCategory, { color: theme.text + "99" }]}>
                    {item.brand ? `${item.brand} / ${getCategoryName(item.category) || t('stats.ranking.noCategory')}` : (getCategoryName(item.category) || t('stats.ranking.noCategory'))}
                  </Text>
                  <Text style={[styles.itemWears, { color: theme.text }]} numberOfLines={1}>
                    {t('stats.ranking.wearCount', { count: item.wearCount || 0 })}
                  </Text>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { width: `${item.percentageOfMax || 0}%`, backgroundColor: theme.primary }
                      ]} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {t('stats.ranking.noData')}
            </Text>
          </View>
        )}
      </View>

      {/* Efficiency information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stats.laundryEfficiency.title')}</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/efficiency')}
          >
            <Text style={styles.viewAllText}>{t('stats.viewAll')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>
        <View style={styles.efficiencyContainer}>
          {stats && stats.totalItems > 0 ? (
            stats.totalWears === 0 || stats.totalWashes === 0 ? (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 }}>
                  {t('stats.laundryEfficiency.noHistory')}
                </Text>
                <Text style={{ fontSize: 14, textAlign: 'center', color: theme.text + "99", paddingHorizontal: 16 }}>
                  {t('stats.laundryEfficiency.noHistoryDescription')}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.efficiencyText}>
                  {(() => {
                    const status = stats.averageWearsBetweenWashes >= stats.averageWashThreshold * 0.8 && 
                      stats.averageWearsBetweenWashes <= stats.averageWashThreshold * 1.2 ? 'good' : 
                      stats.averageWearsBetweenWashes < stats.averageWashThreshold * 0.8 ? 'overwashing' : 'underwashing';
                    const statusText = t(`stats.laundryEfficiency.status.${status}`);
                    const fullText = t('stats.laundryEfficiency.statusText', { 
                      status: statusText,
                      count: stats.averageWearsBetweenWashes 
                    });
                    const parts = fullText.split(statusText);
                    
                    return (
                      <>
                        <Text>{parts[0]}</Text>
                        <Text style={[styles.efficiencyHighlight, { color: getEfficiencyStatusColor(statusText) }]}>
                          {statusText}
                        </Text>
                        <Text>{parts[1] || ''}</Text>
                      </>
                    );
                  })()}
                </Text>
                <Text style={styles.efficiencyTip}>
                  <Ionicons name="bulb" size={16} color="#f39c12" /> {t('stats.laundryEfficiency.tip')}
                </Text>
              </>
            )
          ) : (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 }}>
                {t('stats.laundryEfficiency.noData')}
              </Text>
              <Text style={{ fontSize: 14, textAlign: 'center', color: theme.text + "99", paddingHorizontal: 16 }}>
                {t('stats.laundryEfficiency.noDataDescription')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Environmental impact section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stats.environment.title')}</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/impact')}
          >
            <Text style={styles.viewAllText}>{t('stats.viewAll')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        <View style={styles.impactContainer}>
          <View style={styles.impactRow}>
            <View key="washes-reduced" style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                <Ionicons name="water" size={24} color="#3498db" />
              </View>
              <Text style={styles.impactValue}>{impactData?.totalWashesReduced?.toFixed(1) || '0.0'}</Text>
              <Text style={[styles.impactLabel, { color: theme.text + "99" }]} numberOfLines={2}>{t('stats.environment.washesReduced')}</Text>
            </View>

            <View key="co2-reduced" style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                <Ionicons name="leaf" size={24} color="#27ae60" />
              </View>
              <Text style={styles.impactValue}>{impactData?.co2Reduced?.toFixed(1) || '0.0'} kg</Text>
              <Text style={[styles.impactLabel, { color: theme.text + "99" }]} numberOfLines={2}>{t('stats.environment.co2Reduced')}</Text>
            </View>

            <View key="savings" style={styles.impactItem}>
              <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(241, 196, 15, 0.1)' }]}>
                <Ionicons name="cash" size={24} color="#f1c40f" />
              </View>
              <Text style={styles.impactValue}>
                {impactData ? (
                  i18n.language === 'ja' 
                    ? `${((impactData.waterSaved?.cost || 0) + (impactData.electricitySaved?.cost || 0) + (impactData.detergentSaved?.cost || 0)).toLocaleString()}${t('impact.units.yen')}`
                    : `${t('impact.units.yen')}${((impactData.waterSaved?.cost || 0) + (impactData.electricitySaved?.cost || 0) + (impactData.detergentSaved?.cost || 0)).toLocaleString()}`
                ) : (
                  i18n.language === 'ja' ? `0${t('impact.units.yen')}` : `${t('impact.units.yen')}0`
                )}
              </Text>
              <Text style={[styles.impactLabel, { color: theme.text + "99" }]} numberOfLines={2}>{t('stats.environment.savings')}</Text>
            </View>
          </View>

          <Text style={[styles.impactDescription, { color: theme.text + "CC" }]}>
            {t('stats.environment.description', { 
              washesReduced: impactData?.totalWashesReduced?.toFixed(1) || '0.0',
              trees: impactData?.treeEquivalent?.toFixed(1) || '0.0'
            })}
          </Text>
        </View>
      </View>

      {/* Badges section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stats.badges.title')}</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/badges')}
          >
            <Text style={styles.viewAllText}>{t('stats.viewAllBadges')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {recentBadge ? (
          <TouchableOpacity 
            style={styles.badgeCard}
            onPress={() => router.push('/badges')}
          >
            <View style={styles.badgeContent}>
              <View 
                style={[
                  styles.badgeIconContainer, 
                  { 
                    backgroundColor: getBadgeColor(recentBadge.category)
                  }
                ]}
              >
                <Ionicons 
                  name={getBadgeIcon(recentBadge.category)} 
                  size={32} 
                  color="white" 
                />
              </View>

              <View style={styles.badgeInfo}>
                <View style={styles.badgeHeader}>
                  <Text style={[styles.badgeName, { color: theme.text }]}>
                    {t(recentBadge.nameKey)}
                  </Text>
                  <View style={styles.recentBadge}>
                    <Ionicons name="time-outline" size={10} color="white" style={{ marginRight: 2 }} />
                    <Text style={styles.recentBadgeText}>{t('stats.badges.newBadge')}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={12} color={theme.text + "99"} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeDate, { color: theme.text + "99" }]}>
                    {recentBadge.earnedDate ? formatDateLocalized(recentBadge.earnedDate, i18n.language) : t('stats.badges.unknownDate')}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.moreBadgesText}>
              {t('stats.badges.moreBadges')} <Ionicons name="arrow-forward" size={14} color="#3498db" />
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={48} color={theme.text + "66"} />
            <Text style={[styles.emptyText, { color: theme.text, marginTop: 12 }]}>
              {badges.length > 0 ? t('stats.badges.noBadges') : t('stats.badges.startCollection')}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99", marginBottom: 12 }]}>
              {badges.length > 0 
                ? t('stats.badges.noBadgesDescription')
                : t('stats.badges.startDescription')}
            </Text>
            <TouchableOpacity 
              style={styles.checkBadgesButton}
              onPress={() => router.push('/badges')}
            >
              <Ionicons name="ribbon" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.checkBadgesText}>
                {badges.length > 0 ? t('stats.badges.viewBadges') : t('stats.badges.viewBadgeTypes')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
}
