import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { getPrivateUrls } from "../lib/storageClient";
import { Period, RankingItem } from "../services/statisticsServiceFactory";
import { CategoryValue } from "../types/categories";

export default function RankingScreen() {
  const theme = useTheme();

  // 画像URL管理用の状態
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // 統計コンテキストを使用
  const {
    rankingData: items,
    loading: { rankingData: isLoading },
    error: { rankingData: contextError },
    period,
    setPeriod,
    fetchRankingData
  } = useStatistics();

  // ローディングとエラーの状態
  const loading = isLoading;
  const error = contextError;

  // ローカル状態（コンテキストにない状態）
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>(null);

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

        setImageUrls(prev => ({ ...prev, ...newImageUrls }));
      } catch (error) {
        console.error('Error loading image URLs:', error);
      }
    };

    loadAllImageUrls();
  }, [items]);

  // ランキングデータを取得
  const fetchRanking = useCallback(async () => {
    try {
      await fetchRankingData(period, sortOrder, selectedCategory);
    } catch (err) {
      console.error('ランキングデータの取得エラー:', err);
    }
  }, [fetchRankingData, period, sortOrder, selectedCategory]);

  // マウント時とフィルター変更時にデータを取得
  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // 期間変更の処理
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    fetchRanking();
  };

  // ソート順変更の処理
  const handleSortOrderChange = () => {
    const newSortOrder = sortOrder === 'most' ? 'least' : 'most';
    setSortOrder(newSortOrder);
    fetchRanking();
  };

  // カテゴリ変更の処理
  const handleCategoryChange = (category: CategoryValue) => {
    setSelectedCategory(category);
    fetchRanking();
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

      <Image
        source={{
          uri: imageUrls[item.id] || item.imageUrl,
          cacheKey: item.imageUrl,
          width: 60,
          height: 80
        }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
        onLoadStart={() => {
          console.log(`[Image Load Start] Item ID: ${item.id}, Image: ${item.imageUrl.slice(0, 50)}...`);
        }}
        onLoad={(event) => {
          console.log(`[Image Loaded] Item ID: ${item.id}, Image: ${item.imageUrl.slice(0, 50)}...`);
          console.log('Load event:', event);
        }}
        onLoadEnd={() => {
          console.log(`[Image Load End] Item ID: ${item.id}, Image: ${item.imageUrl.slice(0, 50)}...`);
        }}
        onError={(error) => {
          console.error(`[Image Load Error] Item ID: ${item.id}, Image: ${item.imageUrl.slice(0, 50)}...`);
          console.error('Error:', error);
        }}
      />

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemCategory, { color: theme.text + "99" }]}>
          {item.brand ? `${item.brand} / ${item.category}` : item.category}
        </Text>
        <Text style={[styles.itemWears, { color: theme.text }]}>
          {item.wearCount}回着用
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
    { label: '1ヶ月', value: '1month' },
    { label: '3ヶ月', value: '3months' },
    { label: '6ヶ月', value: '6months' },
    { label: '1年', value: '1year' },
    { label: 'すべて', value: 'all' },
  ];

  // Category options
  const categoryOptions: { label: string; value: CategoryValue }[] = [
    { label: 'すべて', value: null },
    { label: 'トップス', value: 'トップス' },
    { label: 'ボトムス', value: 'ボトムス' },
    { label: 'アウター', value: 'アウター' },
    { label: '小物', value: '小物' },
    { label: 'シューズ', value: 'シューズ' },
    { label: 'その他', value: 'その他' },
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
    itemImage: {
      width: 60,
      height: 80,
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
        <Text style={{ marginTop: 16, color: theme.text }}>ランキングデータを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRanking}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "着用回数ランキング",
          headerBackTitle: "戻る",
        }} 
      />
      <View style={styles.container}>
        {/* Filters */}
        <View style={styles.filtersContainer}>
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

          {/* Sort order toggle */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>並び順</Text>
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
                {sortOrder === 'most' ? '着用回数 多い順' : '着用回数 少ない順'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category selector */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>カテゴリ</Text>
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
