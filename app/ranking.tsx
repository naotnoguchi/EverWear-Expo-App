import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { useImageUrls } from '../hooks/useImageUrls';
import { getPrivateUrls } from "../lib/storageClient";
import { Period, RankingItem } from "../services/statisticsServiceFactory";
import { CategoryValue, getCategoryIdByValueExtended } from "../types/categories";

export default function RankingScreen() {
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
    rankingData: items,
    isCalculating,
    calculationError,
    period,
    setPeriod,
    sortOrder,
    setSortOrder,
    categoryFilter,
    setCategoryFilter,
    recalculateStatistics
  } = useStatistics();

  // ローディングとエラーの状態
  const loading = isCalculating;
  const error = calculationError;

  // ローカル状態をコンテキストの状態に同期
  const selectedCategory = categoryFilter;

  // 画像URLを取得
  const imageUrls = useImageUrls(items || [], { 
    width: 320, 
    height: 320
  });

  // 画像URLを一括で取得
  useEffect(() => {
    const loadAllImageUrls = async () => {
      if (!items || items.length === 0) return;

      // 画像パスの配列を作成
      const imagePaths = items
        .filter(item => item.imageUrl && !item.imageUrl.startsWith('http'))
        .map(item => item.imageUrl);

      if (imagePaths.length === 0) return;

      try {
        // 一括で署名付きURLを取得
        const urls = await getPrivateUrls(imagePaths);
        
        // 取得したURLをマッピング
        const newImageUrls: Record<string, string> = {};
        items.forEach((item, index) => {
          if (urls[index]) {
            newImageUrls[item.id] = urls[index];
          }
        });

        // ここではuseImageUrlsを更新する必要がありますが、このコードでは既存のimageUrlsを使用
      } catch (error) {
        console.error('Error loading image URLs:', error);
      }
    };

    loadAllImageUrls();
  }, [items]);

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // ソート順変更の処理
  const handleSortOrderChange = () => {
    const newSortOrder = sortOrder === 'most' ? 'least' : 'most';
    setSortOrder(newSortOrder);
  };

  // カテゴリ変更の処理
  const handleCategoryChange = (category: CategoryValue) => {
    setCategoryFilter(category);
  };

  // Render item
  const renderItem = ({ item }: { item: RankingItem }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push({
        pathname: '/item/stats/[id]',
        params: { id: item.id }
      })}
    >
      <View style={styles.itemRank}>
        <Text style={styles.rankText}>{items.indexOf(item) + 1}</Text>
      </View>

      <View style={styles.itemImageContainer}>
        {imageUrls[item.id] || item.imageUrl ? (
          <Image
            source={{
              uri: imageUrls[item.id] || item.imageUrl,
              cacheKey: item.imageUrl,
              width: 80,
              height: 80
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
            <Ionicons name="shirt-outline" size={40} color={theme.text + "66"} />
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
                        {item.name && item.name.trim() && (
                  <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                )}
        <Text style={[styles.itemCategory, { color: theme.text + "99" }]}>
          {item.brand ? `${item.brand} / ${getCategoryName(item.category) || t('ranking.noCategory')}` : (getCategoryName(item.category) || t('ranking.noCategory'))}
        </Text>
        <Text style={[styles.itemWears, { color: theme.text }]}>
          {t('ranking.wearCount', { count: item.wearCount })}
        </Text>

        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { width: `${item.percentageOfMax}%`, backgroundColor: theme.primary }
            ]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Period options
  const periodOptions: { label: string; value: Period }[] = [
    { label: t('ranking.period.1month'), value: '1month' },
    { label: t('ranking.period.3months'), value: '3months' },
    { label: t('ranking.period.6months'), value: '6months' },
    { label: t('ranking.period.1year'), value: '1year' },
    { label: t('ranking.period.all'), value: 'all' },
  ];

  // Category options
  const categoryOptions: { label: string; value: CategoryValue }[] = [
    { label: t('categories.all'), value: null },
    { label: t('categories.tops'), value: 'トップス' },
    { label: t('categories.bottoms'), value: 'ボトムス' },
    { label: t('categories.jacket'), value: 'ジャケット' },
    { label: t('categories.outerwear'), value: 'アウター' },
    { label: t('categories.setup'), value: 'セットアップ' },
    { label: t('categories.dress'), value: 'ワンピース' },
    { label: t('categories.shoes'), value: 'シューズ' },
    { label: t('categories.bag'), value: 'バッグ' },
    { label: t('categories.accessories'), value: '小物' },
    { label: t('categories.others'), value: 'その他' },
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
    filtersContainer: {
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
    sortToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
    },
    sortToggleText: {
      fontSize: 14,
      marginLeft: 8,
    },
    listContent: {
      paddingVertical: 8,
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
    itemRank: {
      width: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
    },
    rankText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    itemImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginLeft: 8,
      marginVertical: 8, // 上下の余白を追加（アイテム名が空でも最低限の余白を確保）
      alignSelf: 'center',
      backgroundColor: theme.border,
    },
    itemImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.border,
    },
    itemInfo: {
      flex: 1,
      padding: 8,
    },
    itemName: {
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 2,
    },
    itemCategory: {
      fontSize: 12,
      marginBottom: 4,
    },
    itemWears: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    barContainer: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
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
        <Text style={{ marginTop: 16, color: theme.text }}>{t('ranking.loading')}</Text>
      </View>
    );
  }

  // Render error state
  if (error && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={recalculateStatistics}>
          <Text style={styles.retryButtonText}>{t('ranking.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('ranking.title'),
          headerBackTitle: t('common.back'),
        }} 
      />
      
      <View style={styles.container}>
        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Period selector */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>{t('ranking.filters.period')}</Text>
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

          {/* Sort order toggle */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>{t('ranking.filters.sortOrder')}</Text>
            <TouchableOpacity
              style={[styles.sortToggle, { backgroundColor: theme.card }]}
              onPress={handleSortOrderChange}
            >
              <Ionicons 
                name={sortOrder === 'most' ? "arrow-down" : "arrow-up"} 
                size={16} 
                color={theme.text} 
              />
              <Text style={[styles.sortToggleText, { color: theme.text }]}>
                {sortOrder === 'most' ? t('ranking.sortOrder.mostWorn') : t('ranking.sortOrder.leastWorn')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category selector */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>{t('ranking.filters.category')}</Text>
            <View style={styles.optionsRow}>
              <FlatList
                data={categoryOptions}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      selectedCategory === item.value && styles.filterOptionSelected,
                      { borderColor: theme.border }
                    ]}
                    onPress={() => handleCategoryChange(item.value)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        { color: theme.text },
                        selectedCategory === item.value && styles.filterOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.label}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
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
            <Ionicons name="shirt-outline" size={64} color={theme.text + "66"} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {t('ranking.noItems')}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text + "99" }]}>
              {t('ranking.changeFilters')}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
