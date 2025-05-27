// components/HomeTabView.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import SortModal from "./SortModal";
import { useClothing } from "../contexts/ClothingContext";

// カテゴリコンポーネントのインポート
import AllItems from "./categories/AllItems";
import TopsItems from "./categories/TopsItems";
import BottomsItems from "./categories/BottomsItems";
import OuterwearItems from "./categories/OuterwearItems";
import AccessoriesItems from "./categories/AccessoriesItems";
import ShoesItems from "./categories/ShoesItems";
import OthersItems from "./categories/OthersItems";
import {useTheme} from "@/contexts/ThemeContext";

// カテゴリ定義のインポート
import { CATEGORIES, CategoryId, getCategoryValueById } from "../types/categories";

// カテゴリとコンポーネントのマッピング
const categoryComponents = {
  [CategoryId.ALL]: AllItems,
  [CategoryId.TOPS]: TopsItems,
  [CategoryId.BOTTOMS]: BottomsItems,
  [CategoryId.OUTERWEAR]: OuterwearItems,
  [CategoryId.ACCESSORIES]: AccessoriesItems,
  [CategoryId.SHOES]: ShoesItems,
  [CategoryId.OTHERS]: OthersItems,
};

const { width } = Dimensions.get("window");

export default function HomeTabView() {
  const router = useRouter();
  const tabScrollViewRef = useRef<ScrollView>(null);
  const contentScrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // ソートモーダルの表示状態（他の場所でも使用される可能性があるため維持）
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const { sortConfig, clothingItems } = useClothing();

  // カテゴリごとのアイテム数を計算する関数
  const getCategoryItemCount = (categoryId: CategoryId): number => {
    if (categoryId === CategoryId.ALL) {
      return clothingItems.length;
    }
    const categoryValue = getCategoryValueById(categoryId);
    return clothingItems.filter(item => item.category === categoryValue).length;
  };

  const theme = useTheme();

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    tabBarContainer: {
      backgroundColor: theme.background,
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
      backgroundColor: theme.card,
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
  });

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
                  <View style={[
                    styles.countBadge,
                    activeIndex === index && styles.activeCountBadge,
                  ]}>
                    <Text style={[
                      styles.countText,
                      activeIndex === index && styles.activeCountText,
                    ]}>
                      {getCategoryItemCount(category.id)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ソートボタンを削除 */}
        </View>
      </View>

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
                <CategoryComponent />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* 固定位置に追加ボタンを配置 */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/add")}
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
}
