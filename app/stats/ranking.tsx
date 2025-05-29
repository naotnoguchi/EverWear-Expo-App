import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { statisticsService, RankingItem, Period } from "../../services/statisticsServiceFactory";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { CategoryValue } from "../../types/categories";
import { router } from "expo-router";

export default function RankingScreen() {
  const theme = useTheme();
  
  // State
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('3months');
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>(null);
  
  // Fetch ranking data
  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getRankingData(period, sortOrder, selectedCategory);
      setItems(data);
    } catch (err) {
      console.error('Error fetching ranking data:', err);
      setError('ランキングデータの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [period, sortOrder, selectedCategory]);
  
  // Load data on mount and when filters change
  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);
  
  // Handle period change
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };
  
  // Handle sort order change
  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'most' ? 'least' : 'most');
  };
  
  // Handle category change
  const handleCategoryChange = (category: CategoryValue) => {
    setSelectedCategory(category);
  };
  
  // Render item
  const renderItem = ({ item }: { item: RankingItem }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push({
        pathname: '/stats/item-detail',
        params: { id: item.id }
      })}
    >
      <View style={styles.itemRank}>
        <Text style={styles.rankText}>{items.indexOf(item) + 1}</Text>
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
        <Text style={[styles.itemWears, { color: theme.text }]}>
          {item.wearCount}回着用
        </Text>
        
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { width: `${item.percentageOfMax}%`, backgroundColor: "#3498db" }
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
  
  // Render loading state
  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3498db" />
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
              keyExtractor={(item) => item.value?.toString() || 'all'}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    backgroundColor: "#3498db",
    borderColor: "#3498db",
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
    borderRadius: 8,
  },
  sortToggleText: {
    marginLeft: 8,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#3498db",
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemImage: {
    width: 70,
    height: 70,
  },
  itemInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
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
  itemWears: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  barContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
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
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});