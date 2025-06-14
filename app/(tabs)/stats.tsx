import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../../contexts/StatisticsContext";
import { useTabReset } from "../../contexts/TabResetContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getPrivateUrls } from "../../lib/storageClient";
import { Badge, Period, RankingItem } from "../../services/statisticsServiceFactory";

export default function Stats() {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const { registerResetFunction } = useTabReset();

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
  const [recentBadge, setRecentBadge] = useState<Badge | null>(null);

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
        // 一括で署名付きURLを取得
        const urls = await getPrivateUrls(imagePaths);
        
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
    switch (status) {
      case '良好': return '#27ae60'; // Green
      case '洗濯不足': return '#f39c12'; // Orange
      case '洗いすぎ': return '#e74c3c'; // Red
      default: return '#3498db'; // Blue
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
      console.log('Stats: Setting topItems from rankingData:', rankingData.slice(0, 5).map(item => ({ id: item.id, name: item.name })));
      setTopItems(rankingData.slice(0, 5));
    } else {
      console.log('Stats: No rankingData available, setting empty topItems');
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
      marginBottom: 8,
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
      width: 40,
      height: 40,
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
      flex: 1,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
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
      fontSize: 12,
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
    { label: '1ヶ月', value: '1month' },
    { label: '3ヶ月', value: '3months' },
    { label: '6ヶ月', value: '6months' },
    { label: '1年', value: '1year' },
    { label: 'すべて', value: 'all' },
  ];

  // Get period display text
  const getPeriodText = () => {
    switch (period) {
      case '1month': return '過去1ヶ月間';
      case '3months': return '過去3ヶ月間';
      case '6months': return '過去6ヶ月間';
      case '1year': return '過去1年間';
      case 'all': return 'すべての期間';
    }
  };

  // Render loading state
  if (loading && !stats) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, color: theme.text }}>統計データを読み込み中...</Text>
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
          <Text style={styles.retryButtonText}>再試行</Text>
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
          {getPeriodText()}のデータに基づく分析
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
          <Text style={styles.statLabel}>アイテム数</Text>
        </View>

        <View key="total-wears" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="repeat" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalWears || 0}</Text>
          <Text style={styles.statLabel}>総着用回数</Text>
        </View>

        <View key="total-washes" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="water" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalWashes || 0}</Text>
          <Text style={styles.statLabel}>総洗濯回数</Text>
        </View>

        <View key="average-wears" style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="analytics" size={24} color="#3498db" />
          </View>
          {stats && stats.totalWashes > 0 ? (
            <>
              <Text style={styles.statValue}>{stats.averageWearsBetweenWashes || 0}</Text>
              <Text style={styles.statLabel}>平均着用回数/洗濯</Text>
            </>
          ) : (
            <>
              <Text style={[styles.statValue, { fontSize: 14 }]}>データなし</Text>
              <Text style={styles.statLabel}>洗濯履歴が必要です</Text>
            </>
          )}
        </View>
      </View>

      {/* Ranking section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>着用回数ランキング</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/ranking')}
          >
            <Text style={styles.viewAllText}>すべて見る</Text>
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
                    width: 40,
                    height: 40
                  }}
                  style={styles.itemImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="disk"
                  onLoadStart={() => {
                    console.log(`[Image Load Start] Item ID: ${item.id || 'undefined'}, Image: ${(item.imageUrl || '').slice(0, 50)}...`);
                  }}
                  onLoad={(event) => {
                    console.log(`[Image Loaded] Item ID: ${item.id || 'undefined'}, Image: ${(item.imageUrl || '').slice(0, 50)}...`);
                  }}
                  onLoadEnd={() => {
                    console.log(`[Image Load End] Item ID: ${item.id || 'undefined'}, Image: ${(item.imageUrl || '').slice(0, 50)}...`);
                  }}
                  onError={(error) => {
                    console.error(`[Image Load Error] Item ID: ${item.id || 'undefined'}, Image: ${(item.imageUrl || '').slice(0, 50)}...`);
                    console.error('Error:', error);
                  }}
                />
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                    {item.name || '名前なし'}
                  </Text>
                  <Text style={[styles.itemCategory, { color: theme.text + "99" }]}>
                    {item.brand ? `${item.brand} / ${item.category || 'カテゴリなし'}` : (item.category || 'カテゴリなし')}
                  </Text>
                  <Text style={[styles.itemWears, { color: theme.text }]} numberOfLines={1}>
                    {item.wearCount || 0}回着用
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
              データがありません
            </Text>
          </View>
        )}
      </View>

      {/* Efficiency information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>洗濯効率</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/efficiency')}
          >
            <Text style={styles.viewAllText}>詳細を見る</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>
        <View style={styles.efficiencyContainer}>
          {stats && stats.totalItems > 0 ? (
            stats.totalWears === 0 || stats.totalWashes === 0 ? (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 }}>
                  着用・洗濯履歴がありません
                </Text>
                <Text style={{ fontSize: 14, textAlign: 'center', color: theme.text + "99", paddingHorizontal: 16 }}>
                  アイテムの着用と洗濯を記録すると、洗濯効率の分析情報が表示されます。
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.efficiencyText}>
                  あなたの洗濯効率は
                  {(() => {
                    const status = stats.averageWearsBetweenWashes >= stats.averageWashThreshold * 0.8 && 
                      stats.averageWearsBetweenWashes <= stats.averageWashThreshold * 1.2 ? '良好' : 
                      stats.averageWearsBetweenWashes < stats.averageWashThreshold * 0.8 ? '洗いすぎ' : '洗濯不足';
                    return (
                      <Text style={[styles.efficiencyHighlight, { color: getEfficiencyStatusColor(status) }]}>
                        {status}
                      </Text>
                    );
                  })()}
                  です。平均して{stats.averageWearsBetweenWashes}回着用ごとに洗濯しています。
                </Text>
                <Text style={styles.efficiencyTip}>
                  <Ionicons name="bulb" size={16} color="#f39c12" /> ヒント:
                  最適な洗濯頻度は衣類の種類によって異なります。洗いすぎも洗わなさすぎも避けましょう。
                </Text>
              </>
            )
          ) : (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 }}>
                洗濯効率データがありません
              </Text>
              <Text style={{ fontSize: 14, textAlign: 'center', color: theme.text + "99", paddingHorizontal: 16 }}>
                アイテムを登録して着用・洗濯履歴を記録すると、洗濯効率の分析情報が表示されます。
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Environmental impact section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>環境影響・節約効果</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/impact')}
          >
            <Text style={styles.viewAllText}>詳細を見る</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {impactData ? (
          <View style={styles.impactContainer}>
            <View style={styles.impactRow}>
              <View key="washes-reduced" style={styles.impactItem}>
                <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                  <Ionicons name="water" size={24} color="#3498db" />
                </View>
                <Text style={styles.impactValue}>{impactData?.totalWashesReduced?.toFixed(1) || '0.0'}</Text>
                <Text style={[styles.impactLabel, { color: theme.text + "99" }]}>洗濯回数削減</Text>
              </View>

              <View key="co2-reduced" style={styles.impactItem}>
                <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                  <Ionicons name="leaf" size={24} color="#27ae60" />
                </View>
                <Text style={styles.impactValue}>{impactData?.co2Reduced?.toFixed(1) || '0.0'} kg</Text>
                <Text style={[styles.impactLabel, { color: theme.text + "99" }]}>CO2削減量</Text>
              </View>

              <View key="savings" style={styles.impactItem}>
                <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(241, 196, 15, 0.1)' }]}>
                  <Ionicons name="cash" size={24} color="#f1c40f" />
                </View>
                <Text style={styles.impactValue}>
                  {impactData ? (
                    ((impactData.waterSaved?.cost || 0) + 
                    (impactData.electricitySaved?.cost || 0) + 
                    (impactData.detergentSaved?.cost || 0)).toLocaleString()
                  ) : 0}円
                </Text>
                <Text style={[styles.impactLabel, { color: theme.text + "99" }]}>節約金額</Text>
              </View>
            </View>

            <Text style={[styles.impactDescription, { color: theme.text + "CC" }]}>
              「着用するたびに洗濯する」場合と比較して、あなたは{impactData?.totalWashesReduced?.toFixed(1) || '0.0'}回の洗濯を削減しました。
              これは約{impactData?.treeEquivalent?.toFixed(1) || '0.0'}本の木を植えるのと同等のCO2削減効果があります。
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>
              データがありません
            </Text>
          </View>
        )}
      </View>

      {/* Badges section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>バッジ・アチーブメント</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/badges')}
          >
            <Text style={styles.viewAllText}>すべて見る</Text>
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
                    backgroundColor: 
                      recentBadge.category === 'usage' ? '#3498db' : 
                      recentBadge.category === 'efficiency' ? '#27ae60' : 
                      recentBadge.category === 'milestone' ? '#f39c12' : 
                      '#9b59b6'
                  }
                ]}
              >
                <Ionicons 
                  name={
                    recentBadge.category === 'usage' ? 'checkmark-circle' : 
                    recentBadge.category === 'efficiency' ? 'speedometer' : 
                    recentBadge.category === 'milestone' ? 'trophy' : 
                    'star'
                  } 
                  size={32} 
                  color="white" 
                />
              </View>

              <View style={styles.badgeInfo}>
                <View style={styles.badgeHeader}>
                  <Text style={[styles.badgeName, { color: theme.text }]}>
                    {recentBadge.name}
                  </Text>
                  <View style={styles.recentBadge}>
                    <Ionicons name="time-outline" size={10} color="white" style={{ marginRight: 2 }} />
                    <Text style={styles.recentBadgeText}>NEW</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={12} color={theme.text + "99"} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeDate, { color: theme.text + "99" }]}>
                    {recentBadge.earnedDate ? new Date(recentBadge.earnedDate).toLocaleDateString('ja-JP') : '不明'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.moreBadgesText}>
              バッジをもっと見る <Ionicons name="arrow-forward" size={14} color="#3498db" />
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={48} color={theme.text + "66"} />
            <Text style={[styles.emptyText, { color: theme.text, marginTop: 12 }]}>
              {badges.length > 0 ? '獲得したバッジはありません' : 'バッジコレクションを始めよう！'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99", marginBottom: 12 }]}>
              {badges.length > 0 
                ? 'アプリを使い続けて、様々な条件を達成するとバッジが獲得できます。チャレンジしてみましょう！' 
                : 'アイテムを登録して着用・洗濯を記録すると、様々なバッジを獲得できます。最初のアイテムを登録して、バッジ収集を始めましょう！'}
            </Text>
            <TouchableOpacity 
              style={styles.checkBadgesButton}
              onPress={() => router.push('/badges')}
            >
              <Ionicons name="ribbon" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.checkBadgesText}>
                {badges.length > 0 ? 'バッジ一覧を見る' : 'バッジの種類を見る'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
}
