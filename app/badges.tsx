import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDateLocalized } from "../lib/dateUtils";
import type { BadgeWithStatus } from "../services/badgeService";

export default function BadgesScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<'all' | 'earned' | 'unearned'>('all');

  // バッジデータを取得
  const fetchBadgesData = useCallback(async () => {
    try {
      await recalculateStatistics();
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
  const badgesArray: BadgeWithStatus[] = Array.isArray(badges) ? badges : [];
  const filteredBadges = badgesArray.filter(badge => {
    const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory;
    const earnedMatch = showEarned === 'all' || 
                        (showEarned === 'earned' && badge.isEarned) || 
                        (showEarned === 'unearned' && !badge.isEarned);
    return categoryMatch && earnedMatch;
  });

  // Get badge icon based on category
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

  // Get badge category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'usage': return t('badges.categories.usage', '使用実績');
      case 'efficiency': return t('badges.categories.efficiency', '効率化');
      case 'milestone': return t('badges.categories.milestone', 'マイルストーン');
      case 'achievement': return t('badges.categories.achievement', '実績');
      case 'special': return t('badges.categories.special', '特別');
      default: return t('badges.categories.other', 'その他');
    }
  };

  // Get badge color based on category
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

  // Render badge item
  const renderBadgeItem = ({ item }: { item: BadgeWithStatus }) => (
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
            {t(item.nameKey)}
          </Text>
          {item.isEarned && (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark" size={12} color="white" />
              <Text style={styles.earnedText}>{t('badges.earned', '獲得済み')}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.badgeDescription, { color: theme.text + 'CC' }]}>
          {t(item.descKey)}
        </Text>

        {item.isEarned ? (
          <Text style={[styles.earnedDate, { color: theme.text + '99' }]}>
            {t('badges.earnedDate')}: {item.earnedDate ? formatDateLocalized(item.earnedDate, i18n.language) : t('badges.unknownDate')}
          </Text>
        ) : (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarContainer, { backgroundColor: getBadgeColor(item.category) + '33' }]}> 
              <View  
                style={[  
                  styles.progressBar,  
                  { width: `${item.progress || 0}%`, backgroundColor: getBadgeColor(item.category) } 
                ]}  
              /> 
            </View>
            <Text style={[styles.progressText, { color: theme.text + '99' }]}>
              {item.progress || 0}% {t('badges.achieved', '達成')}
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
  const categoryOptions: { label: string; value: string }[] = [
    { label: t('common.all', 'すべて'), value: 'all' },
    { label: t('badges.categories.usage', '使用実績'), value: 'usage' },
    { label: t('badges.categories.efficiency', '効率化'), value: 'efficiency' },
    { label: t('badges.categories.milestone', 'マイルストーン'), value: 'milestone' },
    { label: t('badges.categories.achievement', '実績'), value: 'achievement' },
    { label: t('badges.categories.special', '特別'), value: 'special' },
  ];

  // Earned status filter options
  const earnedOptions: { label: string; value: 'all' | 'earned' | 'unearned' }[] = [
    { label: t('common.all', 'すべて'), value: 'all' },
    { label: t('badges.earned', '獲得済み'), value: 'earned' },
    { label: t('badges.unearned', '未獲得'), value: 'unearned' },
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
    statsHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
      flexShrink: 1,
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
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      flexShrink: 0,
      maxWidth: 120,
    },
    overviewButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12,
      marginLeft: 4,
      flexShrink: 1,
    },
  });

  // Render loading state
  if (loading && badges.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>{t('badges.loading')}</Text>
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
          <Text style={styles.retryButtonText}>{t('badges.retry')}</Text>
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
          title: t('badges.title'),
          headerBackTitle: t('common.back'),
        }} 
      />
      <View style={styles.container}>
        {/* Badge statistics */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <View style={styles.statsHeaderContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="ribbon" size={24} color={theme.primary} />
              <Text style={[styles.statsTitle, { color: theme.text }]}>
                {t('badges.collection')}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.overviewButton}
              onPress={() => router.push('/badges-overview')}
            >
              <Ionicons name="grid" size={14} color="white" />
              <Text style={styles.overviewButtonText} numberOfLines={1}>
                {t('badges.showOverview')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {earnedBadges}/{totalBadges}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + '99' }]}>
                {t('badges.earnedBadges')}
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
                {earnedPercentage}% {t('badges.achieved')}
              </Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Category filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>{t('badges.categoryFilter')}</Text>
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
            <Text style={[styles.filterLabel, { color: theme.text }]}>{t('badges.statusFilter')}</Text>
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
        {totalBadges > 0 ? (
          filteredBadges.length > 0 ? (
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
                {t('badges.noMatchingBadges')}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.text + "99" }]}>
                {t('badges.changeFilters')}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={64} color={theme.text + "66"} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {t('badges.loadingBadges')}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99" }]}>
              {t('badges.pleaseWait')}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
