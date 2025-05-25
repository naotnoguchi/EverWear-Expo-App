import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import ItemCalendar from "../../components/ItemCalendar";
import { useClothing } from "../../contexts/ClothingContext";

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


export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { clothingItems, wearItem, washItem, deleteItem } = useClothing();
  const [item, setItem] = useState<ClothingItem | null>(null);

  useEffect(() => {
    const foundItem = clothingItems.find(item => item.id === id);
    setItem(foundItem || null);
  }, [id, clothingItems]);

  const handleWearItem = () => {
    if (item) {
      wearItem(item.id);
    }
  };

  const handleWashItem = () => {
    if (item) {
      washItem(item.id);
    }
  };

  const handleDeleteItem = () => {
    Alert.alert(
      "アイテムの削除",
      "このアイテムを削除してもよろしいですか？\n\n※削除すると、このアイテムに関連する着用履歴や洗濯履歴などのデータもすべて削除されます。",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "削除", 
          style: "destructive",
          onPress: () => {
            deleteItem(item!.id);
            router.replace("/");
          }
        }
      ]
    );
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text>アイテムが見つかりません</Text>
      </View>
    );
  }

  const remainingWears = item.washThreshold - item.wearCount;
  const needsWash = remainingWears <= 0;

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.itemImage} 
        resizeMode="cover"
      />

      <View style={styles.detailsContainer}>
        <View style={styles.itemNameContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/item/edit/${item.id}`)}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.editButtonText}>編集</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>カテゴリ:</Text>
          <Text style={styles.categoryValue}>{item.category}</Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
              style={[styles.actionButton, styles.wearButton]}
              onPress={handleWearItem}
          >
            <Ionicons name="shirt" size={24} color="white" />
            <Text style={styles.actionButtonText}>着用記録</Text>
          </TouchableOpacity>

          <TouchableOpacity
              style={[styles.actionButton, styles.washButton]}
              onPress={handleWashItem}
          >
            <Ionicons name="water" size={24} color="white" />
            <Text style={styles.actionButtonText}>洗濯記録</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>着用回数:</Text>
            <Text style={styles.statValue}>{item.wearCount}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>洗濯閾値:</Text>
            <Text style={styles.statValue}>{item.washThreshold}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>最終着用日:</Text>
            <Text style={styles.statValue}>{item.lastWorn}</Text>
          </View>
        </View>

        {/* [id].tsx の一部を修正（プログレスバーの部分） */}
        <View style={styles.wearInfoContainer}>
          <Text style={styles.wearInfoLabel}>
            {needsWash ? "洗濯しましょう" : `あと${remainingWears}回で洗濯`}
          </Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  // 着用回数に比例して長くなるよう変更
                  width: `${Math.min(100, (item.wearCount / item.washThreshold) * 100)}%`,
                  backgroundColor: needsWash ? "#e74c3c" : "#3498db",
                },
              ]}
            />
          </View>
          {needsWash && (
            <Text style={styles.washAlert}>洗濯しましょう</Text>
          )}
        </View>

        <ItemCalendar
            wearHistory={item.wearHistory}
            washHistory={item.washHistory}
        />

        <TouchableOpacity
          style={styles.deleteButtonBottom}
          onPress={handleDeleteItem}
        >
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.deleteButtonBottomText}>このアイテムを削除</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  itemImage: {
    width: "100%",
    height: 300,
  },
  detailsContainer: {
    padding: 16,
  },
  itemNameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 10,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  categoryValue: {
    fontSize: 16,
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statsContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  wearInfoContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wearInfoLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#ecf0f1",
    borderRadius: 5,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  washAlert: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  wearButton: {
    backgroundColor: "#3498db",
  },
  washButton: {
    backgroundColor: "#2ecc71",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  deleteButtonBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  deleteButtonBottomText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});
