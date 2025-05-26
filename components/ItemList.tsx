import React, { useState, useEffect } from "react";
import { FlatList, TouchableOpacity, Text, View, Image, Alert, StyleSheet, Modal, Platform, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useClothing } from '../contexts/ClothingContext';

// ヘルパー関数: 日付をローカルタイムゾーンでISO形式の文字列に変換
function formatDateToLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// インターフェース定義
interface ClothingItem {
  id: string;
  name: string;
  category: string;
  brand: string; // ブランド情報
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
  const colorScheme = useColorScheme(); // 現在のカラースキーム（ライト/ダーク）を取得

  // 日付選択用の状態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showWearDatePicker, setShowWearDatePicker] = useState(false);
  const [showWashDatePicker, setShowWashDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  // モーダル表示用の状態（iOSの場合）
  const [showWearModal, setShowWearModal] = useState(false);
  const [showWashModal, setShowWashModal] = useState(false);


  // カテゴリでフィルタリングおよび着用メーターの長さが長い順にソートを適用
  const getFilteredAndSortedItems = () => {
    // カテゴリでフィルタリング
    let result = [...clothingItems];

    // カテゴリが指定されている場合はフィルタリング
    if (category) {
      result = result.filter(item => item.category === category);
    }

    // 着用メーターの長さ（wearCount/washThreshold比率）が長い順にソート
    // 同じ長さの場合は最終着用日が新しい順にソート
    result.sort((a, b) => {
      // 着用メーターの長さを計算（比率）
      const wearMeterA = a.wearCount / a.washThreshold;
      const wearMeterB = b.wearCount / b.washThreshold;

      // 着用メーターの長さが異なる場合、長い順（降順）にソート
      if (wearMeterA !== wearMeterB) {
        return wearMeterB - wearMeterA;
      }

      // 着用メーターの長さが同じ場合、最終着用日が新しい順にソート
      return a.lastWorn > b.lastWorn ? -1 : a.lastWorn < b.lastWorn ? 1 : 0;
    });

    return result;
  };

  // 日付選択の変更ハンドラー
  const onDateChange = (event: any, selectedDate?: Date) => {
    // キャンセルされた場合は何もせずに日付ピッカーを閉じる
    if (event.type === 'dismissed') {
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);
      setSelectedItemId(null);
      return;
    }

    const currentDate = selectedDate || new Date();
    setSelectedDate(currentDate);

    if (Platform.OS === 'android') {
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);

      // Androidの場合は日付選択後に直接アクションを実行
      if (showWearDatePicker && selectedDate && selectedItemId) {
        const formattedDate = formatDateToLocalISOString(currentDate);
        const success = wearItem(selectedItemId, formattedDate);

        if (success) {
          Alert.alert("着用記録", `${formattedDate}に着用記録を追加しました`);
        } else {
          Alert.alert("エラー", `${formattedDate}の着用記録は既に存在します`);
        }
        setSelectedItemId(null);
      } else if (showWashDatePicker && selectedDate && selectedItemId) {
        const formattedDate = formatDateToLocalISOString(currentDate);
        const success = washItem(selectedItemId, formattedDate);

        if (success) {
          Alert.alert("洗濯記録", `${formattedDate}に洗濯記録を追加しました`);
        } else {
          Alert.alert("エラー", `${formattedDate}の洗濯記録は既に存在します`);
        }
        setSelectedItemId(null);
      }
    }
  };

  // 着用記録ボタンのハンドラー
  const handleWearItem = (id: string) => {
    setSelectedItemId(id);
    // 日付を現在の日付にリセット
    setSelectedDate(new Date());

    if (Platform.OS === 'ios') {
      // iOSの場合はモーダルを表示
      setShowWearModal(true);
    } else {
      // Androidの場合は直接DatePickerを表示
      setShowWearDatePicker(true);
    }
  };

  // 洗濯記録ボタンのハンドラー
  const handleWashItem = (id: string) => {
    setSelectedItemId(id);
    // 日付を現在の日付にリセット
    setSelectedDate(new Date());

    if (Platform.OS === 'ios') {
      // iOSの場合はモーダルを表示
      setShowWashModal(true);
    } else {
      // Androidの場合は直接DatePickerを表示
      setShowWashDatePicker(true);
    }
  };

  // iOS用の着用記録確定ハンドラー
  const confirmWearDate = () => {
    if (selectedItemId) {
      const formattedDate = formatDateToLocalISOString(selectedDate);
      const success = wearItem(selectedItemId, formattedDate);

      if (success) {
        Alert.alert("着用記録", `${formattedDate}に着用記録を追加しました`);
      } else {
        Alert.alert("エラー", `${formattedDate}の着用記録は既に存在します`);
      }
      setShowWearModal(false);
      setSelectedItemId(null);
    }
  };

  // iOS用の洗濯記録確定ハンドラー
  const confirmWashDate = () => {
    if (selectedItemId) {
      const formattedDate = formatDateToLocalISOString(selectedDate);
      const success = washItem(selectedItemId, formattedDate);

      if (success) {
        Alert.alert("洗濯記録", `${formattedDate}に洗濯記録を追加しました`);
      } else {
        Alert.alert("エラー", `${formattedDate}の洗濯記録は既に存在します`);
      }
      setShowWashModal(false);
      setSelectedItemId(null);
    }
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
            <Text style={styles.itemCategory}>
              {item.brand ? `${item.brand} / ${item.category}` : item.category}
            </Text>
            <View style={styles.wearInfo}>
              {needsWash ? (
                <View style={styles.washAlertContainer}>
                  <Ionicons name="warning" size={18} color="#e74c3c" />
                  <Text style={styles.needsWashText}>
                    洗濯しましょう <Text style={styles.parenthesisText}>({item.wearCount}回着用)</Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.remainingWears}>
                  あと{remainingWears}回で洗濯 <Text style={styles.parenthesisText}>({item.wearCount}回着用)</Text>
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
      {/* StatusBarコンポーネントを条件付きでレンダリング */}
      <StatusBar style={(showWearModal || showWashModal) ? 'dark' : (colorScheme === 'dark' ? 'light' : 'dark')} />
      {/* Android用の日付ピッカー */}
      {(showWearDatePicker || showWashDatePicker) && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode={datePickerMode}
          is24Hour={true}
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()} // 未来の日付は選択できないように
          locale="ja-JP"
          themeVariant="light"
        />
      )}

      {/* iOS用の着用記録モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWearModal}
        onRequestClose={() => setShowWearModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>着用日を選択</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()} // 未来の日付は選択できないように
              style={styles.datePicker}
              locale="ja-JP"
              themeVariant="light"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWearModal(false);
                  setSelectedItemId(null);
                }}
              >
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWearDate}
              >
                <Text style={styles.modalButtonText}>確定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* iOS用の洗濯記録モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWashModal}
        onRequestClose={() => setShowWashModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>洗濯日を選択</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()} // 未来の日付は選択できないように
              style={styles.datePicker}
              locale="ja-JP"
              themeVariant="light"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWashModal(false);
                  setSelectedItemId(null);
                }}
              >
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWashDate}
              >
                <Text style={styles.modalButtonText}>確定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  // カッコ書きのテキスト用スタイル
  parenthesisText: {
    fontSize: 12, // 一段階小さく
    color: "#7f8c8d", // グレー
  },
  // モーダル関連のスタイル
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  datePicker: {
    width: 300,
    height: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
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
