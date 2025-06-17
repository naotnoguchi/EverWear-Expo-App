import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PremiumUpgradeModal } from "../components/PremiumUpgradeModal";
import { usePremiumFeatures } from "../contexts/PurchaseContext";
import { useStatistics } from "../contexts/StatisticsContext";
import { useTheme } from "../contexts/ThemeContext";
import { useImageUrls } from '../hooks/useImageUrls';
import { getPrivateUrls } from "../lib/storageClient";
import { Period, RankingItem } from "../services/statisticsServiceFactory";
import { CategoryValue } from "../types/categories";

export default function RankingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isPremium } = usePremiumFeatures();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

      <Image
        source={{
          uri: imageUrls[item.id] || item.imageUrl || require('@/assets/images/placeholder.png'),
          cacheKey: item.imageUrl,
          width: 80,
          height: 80
        }}
        style={styles.itemImage}
        contentFit="cover"
        cachePolicy="disk"
        onError={() => {
          // エラー時は何もしない（デフォルトのフォールバック画像が表示される）
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
      backgroundColor: theme.background,
    },
    restrictedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.background + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    restrictedContent: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      margin: 20,
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    restrictedIcon: {
      marginBottom: 16,
    },
    restrictedTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    restrictedDescription: {
      fontSize: 16,
      color: theme.text + '99',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    upgradeButton: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    upgradeButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: 'bold',
    },
    backButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    backButtonText: {
      color: theme.text,
      fontSize: 16,
    },
    // 通常のコンテンツ用スタイル（プレミアムユーザー向け）
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    sectionText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
    },
    // 既存のスタイルを維持（プレミアムユーザー向け）
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
    sortContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      marginBottom: 16,
    },
    sortLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.primary,
      borderRadius: 16,
    },
    sortButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
      marginRight: 4,
    },
    listContent: {
      paddingBottom: 24,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    itemRank: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rankText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    itemCategory: {
      fontSize: 14,
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
    },
    bar: {
      height: '100%',
      borderRadius: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 48,
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

  return (
    <>
      <Stack.Screen
        options={{
          title: "着用回数ランキング",
          headerTitleStyle: {
            color: theme.text,
          },
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        {!isPremium ? (
          <View style={styles.restrictedOverlay}>
            <View style={styles.restrictedContent}>
              <View style={styles.restrictedIcon}>
                <Ionicons name="lock-closed" size={48} color="#FFD700" />
              </View>
              
              <Text style={styles.restrictedTitle}>プレミアム限定機能</Text>
              <Text style={styles.restrictedDescription}>
                着用回数ランキングはプレミアムプラン限定の機能です。{'\n'}
                アップグレードして詳細な統計情報を確認しませんか？
              </Text>
              
              <TouchableOpacity 
                style={styles.upgradeButton} 
                onPress={() => router.push('/subscription')}
              >
                <Text style={styles.upgradeButtonText}>プレミアムプランを見る</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>着用回数ランキング</Text>
              <Text style={styles.sectionText}>
                登録したアイテムの着用回数をランキング形式で表示します。
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 ランキング統計</Text>
              <Text style={styles.sectionText}>
                総アイテム数: {items?.length || 0}件{'\n'}
                最多着用アイテム: {items?.[0]?.wearCount || 0}回{'\n'}
                平均着用回数: {items?.length ? Math.round(items.reduce((sum, item) => sum + item.wearCount, 0) / items.length) : 0}回
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 トップ3アイテム</Text>
              <Text style={styles.sectionText}>
                {items?.slice(0, 3).map((item, index) => 
                  `${index + 1}位: ${item.name} (${item.wearCount}回)`
                ).join('\n') || '登録されたアイテムがありません'}
              </Text>
            </View>
          </ScrollView>
        )}
        
        <PremiumUpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="着用回数ランキング"
          description="アイテムの着用回数ランキングや詳細な統計情報はプレミアムプラン限定の機能です。"
        />
      </View>
    </>
  );
}
