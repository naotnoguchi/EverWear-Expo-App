import React from "react";
import { FlatList, TouchableOpacity, Text, View, Image, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useClothing } from '../contexts/ClothingContext';

// インターフェース定義
interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image: string;
  wearCount: number;
  washThreshold: number;
  lastWorn: string;
  wearHistory: string[];
  washHistory: string[];
}

interface ItemListProps {
  category: string | null;
}

export default function ItemList({ category }: ItemListProps) {
  const { clothingItems, wearItem, washItem } = useClothing();
  const router = useRouter();

  // カテゴリでフィルタリングおよび残り着用可能回数が少ない順にソートを適用
  const getFilteredAndSortedItems = () => {
    // カテゴリでフィルタリング
    let result = [...clothingItems];
    
    // カテゴリが指定されている場合はフィルタリング
    if (category) {
      result = result.filter(item => item.category === category);
    }

    // 常に洗濯推奨が一番上、次に着用回数が多い順にソート
    result.sort((a, b) => {
      // 洗濯推奨のアイテムを上位に
      const needsWashA = a.wearCount >= a.washThreshold;
      const needsWashB = b.wearCount >= b.washThreshold;
      
      if (needsWashA && !needsWashB) return -1;
      if (!needsWashA && needsWashB) return 1;
      
      // 同じ洗濯状態なら着用回数の多い順
      return b.wearCount - a.wearCount;
    });
    
    return result;
  };

  const handleWearItem = (id: string) => {
    wearItem(id);
    Alert.alert("着用記録", "着用回数を更新しました");
  };

  const handleWashItem = (id: string) => {
    washItem(id);
    Alert.alert("洗濯記録", "洗濯を記録し、着用回数をリセットしました");
  };

  const renderItem = ({ item }: { item: ClothingItem }) => {
    const wearProgress = item.wearCount / item.washThreshold; // 0〜1の進捗値
    const needsWash = wearProgress >= 1; // 着用回数が閾値以上なら洗濯推奨
    const remainingWears = Math.max(0, item.washThreshold - item.wearCount);

    const handleItemPress = () => {
      router.push(`/item/${item.id}`);
    };

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer, 
          needsWash && styles.needsWashContainer
        ]}
        onPress={handleItemPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.contentContainer}>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
            <View style={styles.wearInfo}>
              {needsWash ? (
                <View style={styles.washAlertContainer}>
                  <Ionicons name="warning" size={18} color="#e74c3c" />
                  <Text style={styles.needsWashText}>洗濯しましょう</Text>
                </View>
              ) : (
                <Text style={styles.remainingWears}>
                  あと{remainingWears}回で洗濯
                </Text>
              )}
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      // 変更: 着用回数に比例して長くなるよう変更
                      width: `${Math.min(100, wearProgress * 100)}%`,
                      // 変更: 通常は青色、洗濯推奨になったら赤色に
                      backgroundColor: needsWash ? "#e74c3c" : "#3498db"
                    }
                  ]}
                />
              </View>
            </View>
            <Text style={styles.lastWorn}>最終着用日: {item.lastWorn}</Text>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleWearItem(item.id);
              }}
            >
              <Ionicons name="shirt" size={20} color="#3498db" />
              <Text style={styles.actionText}>着用</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                needsWash && styles.washActionHighlight
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleWashItem(item.id);
              }}
            >
              <Ionicons 
                name="water" 
                size={20} 
                color={needsWash ? "#e74c3c" : "#3498db"} 
              />
              <Text style={[
                styles.actionText,
                needsWash && styles.washActionText
              ]}>洗濯</Text>
            </TouchableOpacity>
          </View>
        </View>
        {needsWash && (
          <View style={styles.washBadge}>
            <Ionicons name="water" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Get filtered and sorted items
  const filteredAndSortedItems = getFilteredAndSortedItems();

  // データがない場合のフォールバック表示
  if (filteredAndSortedItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {category ? `${category}カテゴリのアイテムはありません` : "アイテムはありません"}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredAndSortedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // リストのスタイル
  listContainer: {
    padding: 12,
    paddingBottom: 80, // 追加ボタンの下にスペースを確保
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative", // バッジ表示のため
  },
  needsWashContainer: {
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
    backgroundColor: "#fff8f8", // 薄い赤色の背景に変更
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  itemDetails: {
    flex: 1,
    padding: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 6,
  },
  wearInfo: {
    marginBottom: 4,
  },
  remainingWears: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  needsWashText: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 4,
  },
  washAlertContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#ecf0f1",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  lastWorn: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  actionsContainer: {
    width: 60,
    borderLeftWidth: 1,
    borderLeftColor: "#ecf0f1",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  washActionHighlight: {
    backgroundColor: "#fff0f0", // 洗濯ボタンの背景色を変更
    borderRadius: 4,
  },
  actionText: {
    fontSize: 10,
    color: "#3498db",
    fontWeight: "500",
  },
  washActionText: {
    color: "#e74c3c", // 洗濯テキストの色を変更
    fontWeight: "bold",
  },
  // 洗濯バッジを追加
  washBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#e74c3c",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  // 空の状態用のスタイル
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
});