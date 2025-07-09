// components/HomeTabView.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from '../contexts/AuthContext';
import { useClothing } from "../contexts/ClothingContext";
import { usePremiumFeatures } from "../contexts/PurchaseContext";
import SortModal from "./SortModal";

// カテゴリコンポーネントのインポート
import { useTheme } from "@/contexts/ThemeContext";
import AccessoriesItems from "./categories/AccessoriesItems";
import AllItems from "./categories/AllItems";
import BagItems from "./categories/BagItems";
import BottomsItems from "./categories/BottomsItems";
import DressItems from "./categories/DressItems";
import JacketItems from "./categories/JacketItems";
import OthersItems from "./categories/OthersItems";
import OuterwearItems from "./categories/OuterwearItems";
import SetupItems from "./categories/SetupItems";
import ShoesItems from "./categories/ShoesItems";
import TopsItems from "./categories/TopsItems";

// カテゴリ定義のインポート
import { CATEGORIES, CategoryId, getCategoryValueById } from "../types/categories";
import { ItemListRefType } from "./ItemList";

// カテゴリとコンポーネントのマッピング
const categoryComponents: Record<CategoryId, React.ComponentType<{ 
  ref?: React.Ref<ItemListRefType>;
  onRefresh?: () => void;
}>> = {
  [CategoryId.ALL]: AllItems,
  [CategoryId.TOPS]: TopsItems,
  [CategoryId.BOTTOMS]: BottomsItems,
  [CategoryId.JACKET]: JacketItems,
  [CategoryId.OUTERWEAR]: OuterwearItems,
  [CategoryId.SETUP]: SetupItems,
  [CategoryId.DRESS]: DressItems,
  [CategoryId.SHOES]: ShoesItems,
  [CategoryId.BAG]: BagItems,
  [CategoryId.ACCESSORIES]: AccessoriesItems,
  [CategoryId.OTHERS]: OthersItems,
};

const { width } = Dimensions.get("window");

// Define the ref type
export type HomeTabViewRefType = {
  resetTab: () => void;
};

export default forwardRef<HomeTabViewRefType, {}>((props, ref) => {
  const router = useRouter();
  const { isPremium, loading: purchaseLoading } = usePremiumFeatures();
  const { isAnonymous } = useAuth();
  const tabScrollViewRef = useRef<ScrollView>(null);
  const contentScrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // カテゴリコンポーネントへの参照を保持する配列
  const categoryRefs = useRef<Array<ItemListRefType | null>>(
    Array(CATEGORIES.length).fill(null)
  );

  // ソートモーダルの表示状態（他の場所でも使用される可能性があるため維持）
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const { sortConfig, clothingItems, hiddenItemsCount, loading: clothingLoading } = useClothing();

  // 統合ローディング状態
  const isInitializing = purchaseLoading || clothingLoading;

  // カテゴリごとのアイテム数を計算する関数 - メモ化して再計算を防止
  const categoryItemCounts = useMemo(() => {
    // 各カテゴリのアイテム数を計算して保存するオブジェクト
    const counts: Record<CategoryId, number> = {} as Record<CategoryId, number>;

    // ALL カテゴリは全アイテム数
    counts[CategoryId.ALL] = clothingItems.length;

    // 他のカテゴリはフィルタリングして計算
    for (const category of CATEGORIES) {
      if (category.id !== CategoryId.ALL) {
        const categoryValue = getCategoryValueById(category.id);
        counts[category.id] = clothingItems.filter(item => item.category === categoryValue).length;
      }
    }

    return counts;
  }, [clothingItems]);

  // カテゴリIDからアイテム数を取得する関数
  const getCategoryItemCount = (categoryId: CategoryId): number => {
    return categoryItemCounts[categoryId];
  };

  const theme = useTheme();

  // Expose the resetTab function to the parent component
  useImperativeHandle(ref, () => ({
    resetTab: () => {
      // Reset to the "All" category (index 0)
      setActiveIndex(0);

      // Scroll the tab bar to the beginning
      if (tabScrollViewRef.current) {
        tabScrollViewRef.current.scrollTo({
          x: 0,
          animated: true,
        });
      }

      // Scroll the content to the beginning
      if (contentScrollViewRef.current) {
        contentScrollViewRef.current.scrollTo({
          x: 0,
          animated: true,
        });
      }

      // Scroll the active category's FlatList to the top
      if (categoryRefs.current[0]) {
        categoryRefs.current[0].scrollToTop();
      }
    }
  }));

  // タブが変更されたときのハンドラー
  const handleTabChange = (index: number) => {
    if (index >= 0 && index < CATEGORIES.length && index !== activeIndex) {
      setActiveIndex(index);

      // タブスクロールビューの位置を調整
      if (tabScrollViewRef.current) {
        tabScrollViewRef.current.scrollTo({
          x: Math.max(0, index * 100 - 50),
          animated: true,
        });
      }

      // コンテンツスクロールビューを対応する位置にスクロール
      if (contentScrollViewRef.current) {
        contentScrollViewRef.current.scrollTo({
          x: index * width,
          animated: true,
        });
      }
    }
  };

  // スクロールハンドラー - 通常のScrollView用
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // ここでスクロール位置を使用する処理を行う場合
    // const scrollX = event.nativeEvent.contentOffset.x;
  };

  // スクロール終了時のハンドラー
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(scrollX / width);

    if (pageIndex !== activeIndex) {
      setActiveIndex(pageIndex);
      syncTabPosition(pageIndex);
    }
  };

  // タブの位置を同期
  const syncTabPosition = (index: number) => {
    if (tabScrollViewRef.current) {
      tabScrollViewRef.current.scrollTo({
        x: Math.max(0, index * 100 - 50),
        animated: true,
      });
    }
  };

  // アイテム追加ボタンのハンドラー
  const handleAddItem = () => {
    const currentItemCount = getCategoryItemCount(CategoryId.ALL);

    // プレミアムユーザーは制限なし
    if (isPremium) {
      router.push("/add");
      return;
    }

    // 5件制限に達した場合の処理
    if (currentItemCount >= 5) {
      if (isAnonymous) {
        // 匿名ユーザー向けメッセージ
        Alert.alert(
          "アイテム登録制限",
          `現在${currentItemCount}件のアイテムが登録されています。\n\n無料プランでは最大5件まで登録可能です。\n\nアカウント登録してプレミアムプランにアップグレードすると、無制限にアイテムを登録できます。`,
          [
            {
              text: "キャンセル",
              style: "cancel"
            },
            {
              text: "アカウント登録",
              onPress: () => router.push("/auth/link-account")
            }
          ]
        );
      } else {
        // 通常の無料ユーザー向けメッセージ
        Alert.alert(
          "アイテム登録制限",
          `現在${currentItemCount}件のアイテムが登録されています。\n\n無料プランでは最大5件まで登録可能です。\n\nプレミアムプランにアップグレードすると、無制限にアイテムを登録できます。`,
          [
            {
              text: "キャンセル",
              style: "cancel"
            },
            {
              text: "プレミアムプランを見る",
              onPress: () => router.push("/subscription")
            }
          ]
        );
      }
    } else {
      router.push("/add");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    tabBarContainer: {
      backgroundColor: theme.tabBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      zIndex: 10,
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    tabsScrollContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    tabButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: theme.tabButton,
    },
    activeTabButton: {
      backgroundColor: "#3498db",
    },
    tabText: {
      fontSize: 14,
      color: theme.text + "99", // with transparency
    },
    activeTabText: {
      color: "#fff", // Keep white for contrast on blue background
      fontWeight: "bold",
    },
    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    countBadge: {
      marginLeft: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme.text + "20", // with high transparency
      minWidth: 20,
      alignItems: 'center',
    },
    activeCountBadge: {
      backgroundColor: "#ffffff40", // white with transparency
    },
    countText: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      textAlign: 'center',
    },
    activeCountText: {
      color: "#fff", // white for contrast on blue background
    },
    contentWrapper: {
      flex: 1,
      overflow: 'hidden',
    },
    horizontalScroller: {
      flex: 1,
    },
    pageContainer: {
      flex: 1,
    },
    // sortButton関連のスタイルを削除
    floatingButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#3498db', // Keep blue for brand consistency
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 100,
    },
    hiddenItemsBanner: {
      backgroundColor: '#2c3e50',
      borderBottomWidth: 1,
      borderBottomColor: '#FFD700',
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    bannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerText: {
      flex: 1,
      fontSize: 14,
      color: '#FFD700',
      textAlign: 'center',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      fontSize: 16,
      color: theme.text + "99", // with transparency
      marginTop: 16,
    },
    anonymousBanner: {
      borderWidth: 1,
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
    },
    anonymousBannerText: {
      flex: 1,
      marginLeft: 8,
      marginRight: 8,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
    },
  });

  // 初期化中はローディング画面を表示
  if (isInitializing) {
    return (
      <GestureHandlerRootView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* カスタムタブバー */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabsRow}>
          <ScrollView
            ref={tabScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContainer}
            style={styles.scrollView}
          >
            {CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.tabButton,
                  activeIndex === index && styles.activeTabButton,
                ]}
                onPress={() => handleTabChange(index)}
              >
                <View style={styles.tabContent}>
                  <Text
                    style={[
                      styles.tabText,
                      activeIndex === index && styles.activeTabText,
                    ]}
                  >
                    {category.name}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      activeIndex === index && styles.activeCountBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        activeIndex === index && styles.activeCountText,
                      ]}
                    >
                      {getCategoryItemCount(category.id)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 匿名ユーザー向けバナー */}
      {isAnonymous && (
        <TouchableOpacity 
          style={[styles.anonymousBanner, {
            backgroundColor: theme.background === '#000000' ? '#2d1b1b' : '#FFF0F0',
            borderColor: '#e74c3c'
          }]}
          onPress={() => router.push('/auth/link-account')}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="person-outline" size={20} color="#e74c3c" />
            <Text style={[styles.anonymousBannerText, { color: theme.text }]}>
              ゲスト利用中 - 長期間経過するとデータが失われる可能性があります。アカウント登録をお願いします。
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#e74c3c" />
          </View>
        </TouchableOpacity>
      )}

      {/* 既存のプレミアム制限バナー（無料ユーザーのみ） */}
      {!isPremium && !isAnonymous && hiddenItemsCount > 0 && (
        <TouchableOpacity 
          style={styles.hiddenItemsBanner}
          onPress={() => router.push('/subscription')}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="eye-off" size={20} color="#FFD700" />
            <Text style={styles.bannerText}>
              {hiddenItemsCount}件のアイテムが非表示になっています
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFD700" />
          </View>
        </TouchableOpacity>
      )}

      {/* 水平スクロール可能なコンテンツエリア */}
      <View style={styles.contentWrapper}>
        <ScrollView
          ref={contentScrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
          style={styles.horizontalScroller}
        >
          {CATEGORIES.map((category, index) => {
            const CategoryComponent = categoryComponents[category.id];
            return (
              <View key={category.id} style={[styles.pageContainer, { width }]}>
                <CategoryComponent
                  ref={(el: ItemListRefType | null) => {
                    categoryRefs.current[index] = el;
                  }}
                  onRefresh={() => {
                    // Refresh all category components when any category is refreshed
                    categoryRefs.current.forEach(ref => {
                      ref?.scrollToTop?.();
                    });
                  }}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* 固定位置に追加ボタンを配置 */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleAddItem}
      >
        <Ionicons name="add" size={24} color="#fff" /* Keep white for contrast on blue background */ />
      </TouchableOpacity>

      {/* ソートモーダル（他の場所から開く可能性があるので維持） */}
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
      />
    </GestureHandlerRootView>
  );
});
