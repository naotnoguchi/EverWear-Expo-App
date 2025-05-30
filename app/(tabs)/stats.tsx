import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useTabReset } from "../../contexts/TabResetContext";
import { useRef, useEffect, useState, useCallback } from "react";
import { statisticsService, BasicStats, Period, RankingItem, ImpactData, Badge } from "../../services/statisticsServiceFactory";
import { router } from "expo-router";
import { Image } from "expo-image";

export default function Stats() {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const { registerResetFunction } = useTabReset();

  // State for statistics data
  const [stats, setStats] = useState<BasicStats | null>(null);
  const [topItems, setTopItems] = useState<RankingItem[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [recentBadge, setRecentBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('3months');
  const [error, setError] = useState<string | null>(null);

  // Fetch statistics data
  const fetchStats = useCallback(async (selectedPeriod: Period = period) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic stats
      const basicData = await statisticsService.getBasicStats(selectedPeriod);
      setStats(basicData);

      // Fetch top 5 items by wear count
      const rankingData = await statisticsService.getRankingData(selectedPeriod, 'most');
      setTopItems(rankingData.slice(0, 5));

      // Fetch impact data
      const impact = await statisticsService.getImpactData(selectedPeriod);
      setImpactData(impact);

      // Fetch badges and get the most recent one
      const badges = await statisticsService.getBadges();
      const earnedBadges = badges.filter(badge => badge.isEarned);
      if (earnedBadges.length > 0) {
        // Sort by earned date (most recent first)
        const sortedBadges = [...earnedBadges].sort((a, b) => {
          if (!a.earnedDate || !b.earnedDate) return 0;
          return new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime();
        });
        setRecentBadge(sortedBadges[0]);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('統計データの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load statistics on mount and when period changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Register the reset function with the TabResetContext
  useEffect(() => {
    registerResetFunction("stats", () => {
      // Scroll to the top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      // Refresh data
      fetchStats();
    });
  }, [registerResetFunction, fetchStats]);

  // Handle period change
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    fetchStats(newPeriod);
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
      color: "#27ae60", // Keep green for positive feedback
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
    wearCountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    wearCount: {
      fontSize: 12,
      fontWeight: 'bold',
      color: "#3498db",
      marginRight: 8,
      width: 40,
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
      marginBottom: 16,
    },
    checkBadgesButton: {
      backgroundColor: "#3498db",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
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
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="shirt" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>アイテム数</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="repeat" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalWears || 0}</Text>
          <Text style={styles.statLabel}>総着用回数</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="water" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.totalWashes || 0}</Text>
          <Text style={styles.statLabel}>総洗濯回数</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="analytics" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{stats?.averageWearsBetweenWashes || 0}</Text>
          <Text style={styles.statLabel}>平均着用回数/洗濯</Text>
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

        {topItems.length > 0 ? (
          <View style={styles.rankingList}>
            {topItems.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.rankingItem}
                onPress={() => router.push({
                  pathname: '/item/stats/[id]',
                  params: { id: item.id }
                })}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
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
                    {item.category}
                  </Text>
                  <View style={styles.wearCountContainer}>
                    <Text style={styles.wearCount}>{item.wearCount}回</Text>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar, 
                          { width: `${item.percentageOfMax}%`, backgroundColor: "#3498db" }
                        ]} 
                      />
                    </View>
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
          <Text style={styles.efficiencyText}>
            あなたの洗濯効率は
            <Text style={styles.efficiencyHighlight}>
              {stats && stats.averageWearsBetweenWashes >= 3 ? '良好' : '要改善'}
            </Text>
            です。平均して{stats?.averageWearsBetweenWashes || 0}回着用ごとに洗濯しています。
          </Text>
          <Text style={styles.efficiencyTip}>
            <Ionicons name="bulb" size={16} color="#f39c12" /> ヒント:
            デニムは5-10回着用ごとに洗濯するのが理想的です。
          </Text>
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
              <View style={styles.impactItem}>
                <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                  <Ionicons name="water" size={24} color="#3498db" />
                </View>
                <Text style={styles.impactValue}>{impactData.totalWashesReduced}</Text>
                <Text style={[styles.impactLabel, { color: theme.text + "99" }]}>洗濯回数削減</Text>
              </View>

              <View style={styles.impactItem}>
                <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                  <Ionicons name="leaf" size={24} color="#27ae60" />
                </View>
                <Text style={styles.impactValue}>{impactData.co2Reduced} kg</Text>
                <Text style={[styles.impactLabel, { color: theme.text + "99" }]}>CO2削減量</Text>
              </View>

              <View style={styles.impactItem}>
                <View style={[styles.impactIconContainer, { backgroundColor: 'rgba(241, 196, 15, 0.1)' }]}>
                  <Ionicons name="cash" size={24} color="#f1c40f" />
                </View>
                <Text style={styles.impactValue}>
                  {((impactData.electricitySaved.cost || 0) + 
                    (impactData.waterSaved.cost || 0) + 
                    (impactData.detergentSaved.cost || 0))}円
                </Text>
                <Text style={[styles.impactLabel, { color: theme.text + "99" }]}>節約金額</Text>
              </View>
            </View>

            <Text style={[styles.impactDescription, { color: theme.text + "CC" }]}>
              「着用するたびに洗濯する」場合と比較して、あなたは{impactData.totalWashesReduced}回の洗濯を削減しました。
              これは約{impactData.treeEquivalent}本の木を植えるのと同等のCO2削減効果があります。
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
            onPress={() => router.push('/stats/badges')}
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
                    <Text style={styles.recentBadgeText}>最近獲得</Text>
                  </View>
                </View>

                <Text style={[styles.badgeDescription, { color: theme.text + "CC" }]} numberOfLines={2}>
                  {recentBadge.description}
                </Text>

                <Text style={[styles.badgeDate, { color: theme.text + "99" }]}>
                  獲得日: {recentBadge.earnedDate ? new Date(recentBadge.earnedDate).toLocaleDateString('ja-JP') : '不明'}
                </Text>
              </View>
            </View>

            <Text style={styles.moreBadgesText}>
              他のバッジも確認する <Ionicons name="arrow-forward" size={14} color="#3498db" />
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>
              獲得したバッジはありません
            </Text>
            <TouchableOpacity 
              style={styles.checkBadgesButton}
              onPress={() => router.push('/stats/badges')}
            >
              <Text style={styles.checkBadgesText}>バッジを確認する</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
}
