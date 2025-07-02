import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import ItemCalendar from "../../components/ItemCalendar";
import { useClothing } from "../../contexts/ClothingContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDateJapanese, formatDateToLocalISOString } from '../../lib/dateUtils';
import { getImageUrl } from '../../lib/storageClient';

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
  memo: string;
  condition: string;
  purchasePrice: number | null;
  wearHistory: string[];
  washHistory: string[];
}


export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { clothingItems, wearItem, washItem, deleteItem, deleteWearHistory, deleteWashHistory } = useClothing();
  const [item, setItem] = useState<ClothingItem | null>(null);
  const colorScheme = useColorScheme(); // 現在のカラースキーム（ライト/ダーク）を取得
  const theme = useTheme(); // テーマの取得
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // 日付選択用の状態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWearDatePicker, setShowWearDatePicker] = useState(false);
  const [showWashDatePicker, setShowWashDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  // モーダル表示用の状態（iOSの場合）
  const [showWearModal, setShowWearModal] = useState(false);
  const [showWashModal, setShowWashModal] = useState(false);

  useEffect(() => {
    const foundItem = clothingItems.find(item => item.id === id);
    setItem(foundItem || null);
  }, [id, clothingItems]);

  // 画像URLを生成するためのuseEffect
  useEffect(() => {
    const loadImageUrl = async () => {
      if (!item) return;

      try {
        // アイテム詳細では高解像度(1024x1024)を使用
        const url = await getImageUrl(item.image, 1024, 1024);
        setImageUrl(url);
      } catch (error) {
        console.error(`Error generating URL for item ${item.id}:`, error);
        setImageUrl(item.image); // Fallback to the original path/URL
      }
    };

    loadImageUrl();
  }, [item]);


  // 日付選択の変更ハンドラー
  const onDateChange = (event: any, selectedDate?: Date) => {
    // キャンセルされた場合は何もせずに日付ピッカーを閉じる
    if (event.type === 'dismissed') {
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);
      return;
    }

    const currentDate = selectedDate || new Date();
    setSelectedDate(currentDate);

    if (Platform.OS === 'android') {
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);

      // Androidの場合は日付選択後に直接アクションを実行
      if (showWearDatePicker && selectedDate) {
        const formattedDate = formatDateToLocalISOString(currentDate);
        const japaneseDate = formatDateJapanese(currentDate);
        const success = wearItem(item!.id, formattedDate);

        if (success) {
          Alert.alert("着用記録", `${japaneseDate}に着用記録を追加しました`);
        } else {
          Alert.alert("エラー", `${japaneseDate}の着用記録は既に存在します`);
        }
      } else if (showWashDatePicker && selectedDate) {
        const formattedDate = formatDateToLocalISOString(currentDate);
        const japaneseDate = formatDateJapanese(currentDate);
        const success = washItem(item!.id, formattedDate);

        if (success) {
          Alert.alert("洗濯記録", `${japaneseDate}に洗濯記録を追加しました`);
        } else {
          Alert.alert("エラー", `${japaneseDate}の洗濯記録は既に存在します`);
        }
      }
    }
  };

  // 着用記録ボタンのハンドラー
  const handleWearItem = () => {
    if (item) {
      // 日付を現在の日付にリセット
      setSelectedDate(new Date());

      if (Platform.OS === 'ios') {
        // iOSの場合はモーダルを表示
        setShowWearModal(true);
      } else {
        // Androidの場合は直接DatePickerを表示
        setShowWearDatePicker(true);
      }
    }
  };

  // 洗濯記録ボタンのハンドラー
  const handleWashItem = () => {
    if (item) {
      // 日付を現在の日付にリセット
      setSelectedDate(new Date());

      if (Platform.OS === 'ios') {
        // iOSの場合はモーダルを表示
        setShowWashModal(true);
      } else {
        // Androidの場合は直接DatePickerを表示
        setShowWashDatePicker(true);
      }
    }
  };

  // iOS用の着用記録確定ハンドラー
  const confirmWearDate = () => {
    if (item) {
      const formattedDate = formatDateToLocalISOString(selectedDate);
      const japaneseDate = formatDateJapanese(selectedDate);
      const success = wearItem(item.id, formattedDate);

      if (success) {
        Alert.alert("着用記録", `${japaneseDate}に着用記録を追加しました`);
        setShowWearModal(false);
      } else {
        Alert.alert("エラー", `${japaneseDate}の着用記録は既に存在します`);
        // エラーの場合でもモーダルは閉じる
        setShowWearModal(false);
      }
    }
  };

  // iOS用の洗濯記録確定ハンドラー
  const confirmWashDate = () => {
    if (item) {
      const formattedDate = formatDateToLocalISOString(selectedDate);
      const japaneseDate = formatDateJapanese(selectedDate);
      const success = washItem(item.id, formattedDate);

      if (success) {
        Alert.alert("洗濯記録", `${japaneseDate}に洗濯記録を追加しました`);
        setShowWashModal(false);
      } else {
        Alert.alert("エラー", `${japaneseDate}の洗濯記録は既に存在します`);
        // エラーの場合でもモーダルは閉じる
        setShowWashModal(false);
      }
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
          onPress: async () => {
            try {
              const itemName = item!.name;
              await deleteItem(item!.id);
              Alert.alert(
                "削除完了", 
                `「${itemName}」を削除しました`,
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/")
                  }
                ]
              );
            } catch (err) {
              console.error('Error in handleDeleteItem:', err);
              Alert.alert("削除エラー", "アイテムの削除に失敗しました。もう一度お試しください。");
            }
          }
        }
      ]
    );
  };

  // 着用履歴削除ハンドラー
  const handleDeleteWearHistory = async (date: string) => {
    if (item) {
      try {
        await deleteWearHistory(item.id, date);
        Alert.alert("削除完了", `${formatDateJapanese(date)}の着用履歴を削除しました`);
      } catch (err) {
        console.error('Error in handleDeleteWearHistory:', err);
        Alert.alert("削除エラー", "着用履歴の削除に失敗しました。もう一度お試しください。");
      }
    }
  };

  // 洗濯履歴削除ハンドラー
  const handleDeleteWashHistory = async (date: string) => {
    if (item) {
      try {
        await deleteWashHistory(item.id, date);
        Alert.alert("削除完了", `${formatDateJapanese(date)}の洗濯履歴を削除しました`);
      } catch (err) {
        console.error('Error in handleDeleteWashHistory:', err);
        Alert.alert("削除エラー", "洗濯履歴の削除に失敗しました。もう一度お試しください。");
      }
    }
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // カッコ書きのテキスト用スタイル
    parenthesisText: {
      fontSize: 14, // 一段階小さく
      color: theme.text + "99", // グレー with transparency
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
      backgroundColor: theme.background,
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
      color: theme.text,
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
    itemImage: {
      width: "100%",
      aspectRatio: 1, // 1:1の正方形比率を維持
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
      color: theme.text,
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
      color: theme.text,
    },
    categoryValue: {
      fontSize: 16,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      color: theme.text,
    },
    statsContainer: {
      backgroundColor: theme.card,
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
      color: theme.text + "99", // with transparency
    },
    statValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
    },
    wearInfoContainer: {
      backgroundColor: theme.card,
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
      color: theme.text,
    },
    progressContainer: {
      height: 10,
      backgroundColor: theme.border,
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
    memoContainer: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    memoHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    memoTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
      color: theme.text,
    },
    memoText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.text,
    },
  });

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
          themeVariant={colorScheme}
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
              themeVariant={colorScheme}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWearModal(false)}
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
              themeVariant={colorScheme}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWashModal(false)}
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

      <Image 
        source={{ 
          uri: imageUrl || item.image,
          cacheKey: item?.image ? `${item.image}_1024x1024` : undefined
        }} 
        style={styles.itemImage} 
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />

      <View style={styles.detailsContainer}>
        <View style={styles.itemNameContainer}>
          <View style={{ flex: 1 }}>
            {item.name && item.name.trim() && (
              <Text style={styles.itemName}>{item.name}</Text>
            )}
          </View>
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

        {/* ブランド情報 */}
        {item.brand && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>ブランド:</Text>
            <Text style={styles.categoryValue}>{item.brand}</Text>
          </View>
        )}

        {/* 状態情報 */}
        {item.condition && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>状態:</Text>
            <Text style={styles.categoryValue}>
              {item.condition === "新品" ? (
                <><Ionicons name="star" size={16} color={theme.text} style={{marginRight: 4}} /> 新品</>
              ) : (
                <><Ionicons name="repeat" size={16} color={theme.text} style={{marginRight: 4}} /> 中古</>
              )}
            </Text>
          </View>
        )}

        {/* 購入価格情報 */}
        {item.purchasePrice && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>購入価格:</Text>
            <Text style={styles.categoryValue}>¥{item.purchasePrice.toLocaleString()}</Text>
          </View>
        )}

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
            <Text style={styles.statValue}>{item.lastWorn ? formatDateJapanese(item.lastWorn) : "なし"}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>最終洗濯日:</Text>
            <Text style={styles.statValue}>{item.washHistory.length > 0 ? formatDateJapanese(item.washHistory[item.washHistory.length - 1]) : "なし"}</Text>
          </View>
        </View>

        {/* [id].tsx の一部を修正（プログレスバーの部分） */}
        <View style={styles.wearInfoContainer}>
          <Text style={styles.wearInfoLabel}>
            {needsWash ? (
              <>
                洗濯しましょう <Text style={styles.parenthesisText}>({item.wearCount}回着用)</Text>
              </>
            ) : (
              <>
                あと{remainingWears}回で洗濯 <Text style={styles.parenthesisText}>({item.wearCount}回着用)</Text>
              </>
            )}
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
        </View>

        {/* メモ情報 */}
        {item.memo && (
          <View style={styles.memoContainer}>
            <View style={styles.memoHeader}>
              <Ionicons name="document-text-outline" size={20} color={theme.text} />
              <Text style={styles.memoTitle}>メモ</Text>
            </View>
            <Text style={styles.memoText}>{item.memo}</Text>
          </View>
        )}

        <ItemCalendar
            wearHistory={item.wearHistory}
            washHistory={item.washHistory}
            onDeleteWearHistory={handleDeleteWearHistory}
            onDeleteWashHistory={handleDeleteWashHistory}
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
