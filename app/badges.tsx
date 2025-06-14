import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { Badge } from "../services/statisticsServiceFactory";

export default function BadgesScreen() {
  const theme = useTheme();

  // 統計コンテキストを使用
  const {
    badges,
    isCalculating,
    calculationError,
    recalculateStatistics
  } = useStatistics();

  // ローディングとエラーの状態
  const loading = isCalculating;
  const error = calculationError;

  // ローカル状態（コンテキストにない状態）
  const [selectedCategory, setSelectedCategory] = useState<Badge['category'] | 'all'>('all');
  const [showEarned, setShowEarned] = useState<'all' | 'earned' | 'unearned'>('all');

  // バッジデータを取得
  const fetchBadgesData = useCallback(async () => {
    try {
      await recalculateStatistics();
      console.log('バッジ画面 - バッジデータ取得結果:', 
        `総数=${badges.length},`, 
        `獲得済み=${badges.filter(b => b.isEarned).length},`,
        `カテゴリ=${Object.keys(badges.reduce((acc, b) => {
          acc[b.category] = true;
          return acc;
        }, {})).join(',')}`
      );
    } catch (err) {
      console.error('バッジデータの取得エラー:', err);
    }
  }, [recalculateStatistics, badges.length]);

  // マウント時にデータを取得
  useEffect(() => {
    fetchBadgesData();
  }, [fetchBadgesData]);

  // Filter badges based on selected category and earned status
  // Ensure badges is an array before filtering
  const badgesArray = Array.isArray(badges) ? badges : [];
  const filteredBadges = badgesArray.filter(badge => {
    const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory;
    const earnedMatch = showEarned === 'all' || 
                        (showEarned === 'earned' && badge.isEarned) || 
                        (showEarned === 'unearned' && !badge.isEarned);
    return categoryMatch && earnedMatch;
  });

  // Get badge icon based on category
  const getBadgeIcon = (category: Badge['category']) => {
    switch (category) {
      case 'usage': return 'checkmark-circle';
      case 'efficiency': return 'speedometer';
      case 'milestone': return 'trophy';
      case 'special': return 'star';
      default: return 'ribbon';
    }
  };

  // Get badge category display name
  const getCategoryName = (category: Badge['category']) => {
    switch (category) {
      case 'usage': return '使用実績';
      case 'efficiency': return '効率化';
      case 'milestone': return 'マイルストーン';
      case 'special': return '特別';
      default: return 'その他';
    }
  };

  // Get badge color based on category
  const getBadgeColor = (category: Badge['category']) => {
    switch (category) {
      case 'usage': return '#3498db'; // Blue
      case 'efficiency': return '#27ae60'; // Green
      case 'milestone': return '#f39c12'; // Orange
      case 'special': return '#9b59b6'; // Purple
      default: return '#95a5a6'; // Gray
    }
  };

  // Render badge item
  const renderBadgeItem = ({ item }: { item: Badge }) => (
    <View style={[styles.badgeCard, { backgroundColor: theme.card }]}>
      <View 
        style={[
          styles.badgeIconContainer, 
          { 
            backgroundColor: item.isEarned 
              ? getBadgeColor(item.category) 
              : theme.text + '10' 
          }
        ]}
      >
        <Ionicons 
          name={getBadgeIcon(item.category)} 
          size={32} 
          color={item.isEarned ? 'white' : theme.text + '66'} 
        />
      </View>

      <View style={styles.badgeInfo}>
        <View style={styles.badgeHeader}>
          <Text style={[styles.badgeName, { color: theme.text }]}>
            {item.name}
          </Text>
          {item.isEarned && (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark" size={12} color="white" />
              <Text style={styles.earnedText}>獲得済み</Text>
            </View>
          )}
        </View>

        <Text style={[styles.badgeDescription, { color: theme.text + 'CC' }]}>
          {item.description}
        </Text>

        {item.isEarned ? (
          <Text style={[styles.earnedDate, { color: theme.text + '99' }]}>
            獲得日: {new Date(item.earnedDate || '').toLocaleDateString('ja-JP')}
          </Text>
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${item.progress || 0}%`, backgroundColor: getBadgeColor(item.category) }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.text + '99' }]}>
              {item.progress || 0}% 達成
            </Text>
          </View>
        )}

        <View style={styles.badgeCategory}>
          <Text style={[styles.categoryText, { color: getBadgeColor(item.category) }]}>
            {getCategoryName(item.category)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Category filter options
  const categoryOptions: { label: string; value: Badge['category'] | 'all' }[] = [
    { label: 'すべて', value: 'all' },
    { label: '使用実績', value: 'usage' },
    { label: '効率化', value: 'efficiency' },
    { label: 'マイルストーン', value: 'milestone' },
    { label: '特別', value: 'special' },
  ];

  // Earned status filter options
  const earnedOptions: { label: string; value: 'all' | 'earned' | 'unearned' }[] = [
    { label: 'すべて', value: 'all' },
    { label: '獲得済み', value: 'earned' },
    { label: '未獲得', value: 'unearned' },
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
    statsCard: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    statsContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statItem: {
      marginRight: 16,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
    },
    progressContainer: {
      flex: 1,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBar: {
      height: '100%',
    },
    progressText: {
      fontSize: 12,
      textAlign: 'right',
    },
    filtersContainer: {
      marginBottom: 16,
    },
    filterSection: {
      marginBottom: 12,
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
    listContent: {
      paddingBottom: 16,
    },
    badgeCard: {
      flexDirection: 'row',
      borderRadius: 8,
      marginBottom: 12,
      padding: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
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
    earnedBadge: {
      flexDirection: 'row',
      backgroundColor: theme.success,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignItems: 'center',
    },
    earnedText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
      marginLeft: 2,
    },
    badgeDescription: {
      fontSize: 14,
      marginBottom: 8,
    },
    earnedDate: {
      fontSize: 12,
    },
    badgeCategory: {
      marginTop: 8,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: 'bold',
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
    overviewButton: {
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    overviewButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
      marginLeft: 6,
    },
  });

  // Render loading state
  if (loading && badges.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>バッジデータを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && badges.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBadgesData}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate badge statistics
  // Ensure badges is an array before calculating statistics
  const totalBadges = badgesArray.length;
  const earnedBadges = badgesArray.filter(badge => badge.isEarned).length;
  const earnedPercentage = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;

  return (
    <>
      <Stack.Screen 
        options={{
          title: "バッジ・アチーブメント",
          headerBackTitle: "戻る",
        }} 
      />
      <View style={styles.container}>
        {/* Badge statistics */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <View style={styles.statsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="ribbon" size={24} color={theme.primary} />
              <Text style={[styles.statsTitle, { color: theme.text }]}>
                バッジコレクション
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.overviewButton}
              onPress={() => router.push('/badges-overview')}
            >
              <Ionicons name="grid" size={16} color="white" />
              <Text style={styles.overviewButtonText}>一覧を表示</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {earnedBadges}/{totalBadges}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + '99' }]}>
                獲得バッジ
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${earnedPercentage}%`, backgroundColor: theme.primary }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: theme.text + '99' }]}>
                {earnedPercentage}% 達成
              </Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Category filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>カテゴリ</Text>
            <View style={styles.optionsRow}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    selectedCategory === option.value && styles.filterOptionSelected,
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setSelectedCategory(option.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: theme.text },
                      selectedCategory === option.value && styles.filterOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Earned status filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>獲得状況</Text>
            <View style={styles.optionsRow}>
              {earnedOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    showEarned === option.value && styles.filterOptionSelected,
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setShowEarned(option.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: theme.text },
                      showEarned === option.value && styles.filterOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Badge list */}
        {filteredBadges.length > 0 ? (
          <FlatList
            data={filteredBadges}
            renderItem={renderBadgeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={64} color={theme.text + "66"} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {badges.length > 0 ? '該当するバッジがありません' : 'バッジはまだありません'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99" }]}>
              {badges.length > 0 
                ? 'フィルター条件を変更してお試しください' 
                : 'アイテムを登録して着用・洗濯を記録すると、様々なバッジを獲得できます。\n最初のアイテムを登録して、バッジ収集を始めましょう！'}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
