import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useClothing } from '../contexts/ClothingContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateJapanese, formatDateLocalized, formatDateToLocalISOString } from '../lib/dateUtils';
import { getPrivateUrls } from '../lib/storageClient';
import { CategoryValue } from '../types/categories';
import { ClothingItem } from '../types/clothing';

// カテゴリ値から翻訳キーへのマッピング
const getCategoryTranslationKey = (categoryValue: CategoryValue): string => {
  const categoryMap: Record<string, string> = {
    'トップス': 'categories.tops',
    'ボトムス': 'categories.bottoms',
    'ジャケット': 'categories.jacket',
    'アウター': 'categories.outerwear',
    'セットアップ': 'categories.setup',
    'ワンピース': 'categories.dress',
    'シューズ': 'categories.shoes',
    'バッグ': 'categories.bag',
    '小物': 'categories.accessories',
    'その他': 'categories.others'
  };
  
  return categoryValue ? categoryMap[categoryValue] || categoryValue : '';
};

// 公開するメソッドの型定義
export type ItemListRefType = {
  scrollToTop: () => void;
};

interface ItemListProps {
  category: CategoryValue;
  onRefresh?: () => void;
}

const ItemList = forwardRef<ItemListRefType, ItemListProps>(({ category, onRefresh }, ref) => {
  const { clothingItems, wearItem, washItem, loading, sortConfig } = useClothing();
  const router = useRouter();
  const colorScheme = useColorScheme(); // 現在のカラースキーム（ライト/ダーク）を取得
  const theme = useTheme(); // テーマの取得
  const { t, i18n } = useTranslation();

  // FlatListへの参照
  const flatListRef = useRef<FlatList>(null);

  // 親コンポーネントに公開するメソッド
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }
  }));

  // 日付選択用の状態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showWearDatePicker, setShowWearDatePicker] = useState(false);
  const [showWashDatePicker, setShowWashDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  // モーダル表示用の状態（iOSの場合）
  const [showWearModal, setShowWearModal] = useState(false);
  const [showWashModal, setShowWashModal] = useState(false);

  // 画像URL管理用の状態
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // アイテムリストが更新されたときに、すべての画像URLを一括で取得
  useEffect(() => {
    const loadAllImageUrls = async () => {
      if (!clothingItems || clothingItems.length === 0) return;

      // 画像パスの配列を作成（既にURLがあるものでも、画像パスが変わった場合は再取得）
      const itemsNeedingUrls = clothingItems.filter(
        item => item.image && 
               !item.image.startsWith('http')
      );

      if (itemsNeedingUrls.length === 0) return;

      try {
        // 一括で署名付きURLを取得
        const imagePaths = itemsNeedingUrls.map(item => item.image);
        const urls = await getPrivateUrls(imagePaths);

        // 取得したURLをマッピング
        const newImageUrls: Record<string, string> = {};
        itemsNeedingUrls.forEach((item, index) => {
          if (urls[index]) {
            newImageUrls[item.id] = urls[index]!;
          }
        });

        // 既存のキャッシュと新しいURLをマージ（変更された画像は上書き）
        setImageUrls(prev => {
          const updated = { ...prev };

          // 現在のアイテムリストにないアイテムのキャッシュを削除
          const currentItemIds = new Set(clothingItems.map(item => item.id));
          Object.keys(updated).forEach(itemId => {
            if (!currentItemIds.has(itemId)) {
              delete updated[itemId];
            }
          });

          // 新しいURLを追加/更新
          return {
            ...updated,
            ...newImageUrls
          };
        });
      } catch (error) {
        console.error('Error loading image URLs:', error);
      }
    };

    loadAllImageUrls();
  }, [clothingItems]); // clothingItemsの変更を監視し、画像変更も検出

  // カテゴリでフィルタリングおよび着用メーターの長さが長い順にソートを適用 - メモ化して再計算を防止
  const filteredAndSortedItems = useMemo(() => {
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
  }, [clothingItems, category, sortConfig]);

  // 日付選択の変更ハンドラー
  const onDateChange = async (event: any, selectedDate?: Date) => {
    if (!selectedDate) return;

    // 現在の日付を更新
    const currentDate = selectedDate;
    setSelectedDate(currentDate);

    // iOSの場合はDatePickerを非表示に
    if (Platform.OS === 'ios') {
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);
    }

    // 日付が選択された場合（「完了」ボタンが押された場合）
    if (event.type === 'dismissed') {
      // モーダルを閉じる
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);
      setSelectedItemId(null);
    } else if (event.type === 'set' || event.type === 'neutralButtonPressed') {
      // 日付が選択された場合は記録を追加
      if (showWearDatePicker && selectedDate && selectedItemId) {
        try {
          const formattedDate = formatDateToLocalISOString(currentDate);
          const displayDate = i18n.language === 'ja' 
            ? formatDateJapanese(currentDate)
            : currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

          await wearItem(selectedItemId, formattedDate);
          Alert.alert(t('itemList.alerts.wearRecorded'), t('itemList.alerts.wearRecordedMessage', { date: displayDate }));
          onRefresh?.();
        } catch (error: any) {
          const displayDate = i18n.language === 'ja' 
            ? formatDateJapanese(currentDate)
            : currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          console.error('Error adding wear record:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);

          // Check if the error is about duplicate records
          if (error?.message && error.message.includes('着用記録は既に存在します')) {
            Alert.alert(t('itemList.alerts.duplicateError'), t('itemList.alerts.wearDuplicateMessage', { date: displayDate }));
          } else {
            Alert.alert(t('common.error'), t('itemList.alerts.wearError', { date: displayDate }));
          }
        }
        setSelectedItemId(null);
      } else if (showWashDatePicker && selectedDate && selectedItemId) {
        try {
          const formattedDate = formatDateToLocalISOString(currentDate);
          const displayDate = i18n.language === 'ja' 
            ? formatDateJapanese(currentDate)
            : currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

          await washItem(selectedItemId, formattedDate);
          Alert.alert(t('itemList.alerts.washRecorded'), t('itemList.alerts.washRecordedMessage', { date: displayDate }));
          onRefresh?.();
        } catch (error: any) {
          const displayDate = i18n.language === 'ja' 
            ? formatDateJapanese(currentDate)
            : currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          console.error('Error adding wash record:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);

          // Check if the error is about duplicate records
          if (error?.message && error.message.includes('洗濯記録は既に存在します')) {
            Alert.alert(t('itemList.alerts.duplicateError'), t('itemList.alerts.washDuplicateMessage', { date: displayDate }));
          } else {
            Alert.alert(t('common.error'), t('itemList.alerts.washError', { date: displayDate }));
          }
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
  const confirmWearDate = async () => {
    if (!selectedItemId) return;

    try {
      const formattedDate = formatDateToLocalISOString(selectedDate);
      const displayDate = i18n.language === 'ja' 
        ? formatDateJapanese(selectedDate)
        : selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      await wearItem(selectedItemId, formattedDate);
      Alert.alert(t('itemList.alerts.wearRecorded'), t('itemList.alerts.wearRecordedMessage', { date: displayDate }));

      setShowWearModal(false);
      setSelectedItemId(null);
      // 親コンポーネントに更新を通知
      onRefresh?.();
    } catch (error: any) {
      const displayDate = i18n.language === 'ja' 
        ? formatDateJapanese(selectedDate)
        : selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      console.error('Error adding wear record:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);

      // Check if the error is about duplicate records
      if (error?.message && error.message.includes('着用記録は既に存在します')) {
        Alert.alert(t('itemList.alerts.duplicateError'), t('itemList.alerts.wearDuplicateMessage', { date: displayDate }));
      } else {
        Alert.alert(t('common.error'), t('itemList.alerts.wearError', { date: displayDate }));
      }

      // エラー時もモーダルを閉じる
      setShowWearModal(false);
      setSelectedItemId(null);
    }
  };

  // iOS用の洗濯記録確定ハンドラー
  const confirmWashDate = async () => {
    if (!selectedItemId) return;

    try {
      const formattedDate = formatDateToLocalISOString(selectedDate);
      const displayDate = i18n.language === 'ja' 
        ? formatDateJapanese(selectedDate)
        : selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      await washItem(selectedItemId, formattedDate);
      Alert.alert(t('itemList.alerts.washRecorded'), t('itemList.alerts.washRecordedMessage', { date: displayDate }));

      setShowWashModal(false);
      setSelectedItemId(null);
      // 親コンポーネントに更新を通知
      onRefresh?.();
    } catch (error: any) {
      const displayDate = i18n.language === 'ja' 
        ? formatDateJapanese(selectedDate)
        : selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      console.error('Error adding wash record:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);

      // Check if the error is about duplicate records
      if (error?.message && error.message.includes('洗濯記録は既に存在します')) {
        Alert.alert(t('itemList.alerts.duplicateError'), t('itemList.alerts.washDuplicateMessage', { date: displayDate }));
      } else {
        Alert.alert(t('common.error'), t('itemList.alerts.washError', { date: displayDate }));
      }

      // エラー時もモーダルを閉じる
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
          source={{
            uri: imageUrls[item.id] || item.image,
            cacheKey: item.image,
            width: 80,
            height: 80
          }}
          style={styles.itemImage}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          priority="high"
          recyclingKey={item.id}
        />
        <View style={styles.contentContainer}>
          <View style={styles.itemDetails}>
            {item.name && item.name.trim() && (
              <Text style={styles.itemName}>{item.name}</Text>
            )}
            <Text style={styles.itemCategory}>
              {item.brand ? `${item.brand} / ${t(getCategoryTranslationKey(item.category))}` : t(getCategoryTranslationKey(item.category))}
            </Text>
            <View style={styles.wearInfo}>
              {needsWash ? (
                <View style={styles.washAlertContainer}>
                  <Ionicons name="warning" size={18} color="#e74c3c" />
                  <Text style={styles.needsWashText}>
                    {t('itemList.needsWash')} <Text style={styles.parenthesisText}>({t('itemList.wearCount', { count: item.wearCount })})</Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.remainingWears}>
                  {t('itemList.remainingWears', { count: remainingWears })} <Text style={styles.parenthesisText}>({t('itemList.wearCount', { count: item.wearCount })})</Text>
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
            <Text style={styles.lastWorn}>{t('itemList.lastWorn')}: {item.lastWorn ? formatDateLocalized(item.lastWorn, i18n.language) : t('itemList.none')}</Text>
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
              <Text style={styles.actionText}>{t('itemList.actions.wear')}</Text>
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
                color={needsWash ? "#e74c3c" : "#2ecc71"}
              />
              <Text style={[
                needsWash ? styles.washActionText : styles.washActionTextNormal
              ]}>{t('itemList.actions.wash')}</Text>
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

  // filteredAndSortedItems is now directly defined with useMemo above

  // Define styles with theme colors
  const styles = StyleSheet.create({
    // リストのスタイル
    listContainer: {
      padding: 12,
      paddingBottom: 80, // 追加ボタンの下にスペースを確保
    },
    // カッコ書きのテキスト用スタイル
    parenthesisText: {
      fontSize: 12, // 一段階小さく
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
      backgroundColor: theme.card,
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
      backgroundColor: theme.card === "#ffffff" ? "#fff8f8" : "#3a1a1a", // 薄い赤色の背景に変更（ダークモード対応）
    },
    itemImage: {
      width: 80,
      height: 80,
      backgroundColor: theme.border, // 画像読み込み中の背景色
      borderRadius: 8, // 角丸を追加
      alignSelf: 'center', // 上下中央配置
      marginLeft: 8, // 左の余白
      marginVertical: 8, // 上下の余白を追加（アイテム名が空でも最低限の余白を確保）
    },
    contentContainer: {
      flex: 1,
      flexDirection: "row",
    },
    itemDetails: {
      flex: 1,
      padding: 8,
      justifyContent: 'center', // 垂直方向の中央寄せで余白を均等に配分
    },
    itemName: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 2,
      color: theme.text,
    },
    itemCategory: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      marginBottom: 4,
    },
    itemBrand: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      marginBottom: 4,
    },
    wearInfo: {
      marginBottom: 4,
    },
    remainingWears: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 2,
      color: theme.text,
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
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      borderRadius: 2,
    },
    lastWorn: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      marginTop: 4,
    },
    actionsContainer: {
      width: 60,
      borderLeftWidth: 1,
      borderLeftColor: theme.border,
      justifyContent: "space-evenly", // ボタンを均等に配置
    },
    actionButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4, // パディングを調整
    },
    washActionHighlight: {
      backgroundColor: theme.card === "#ffffff" ? "#fff0f0" : "#3a1a1a", // 洗濯ボタンの背景色を変更（ダークモード対応）
      borderRadius: 4,
    },
    actionText: {
      fontSize: 10,
      color: "#3498db",
      fontWeight: "500",
    },
    washActionTextNormal: {
      fontSize: 10,
      color: "#2ecc71",
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
      backgroundColor: theme.background,
    },
    emptyText: {
      fontSize: 16,
      color: theme.text + "99", // with transparency
      textAlign: 'center',
      marginBottom: 20,
    },
    container: {
      flex: 1,
    },
  });

  // ローディング中の表示
  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.emptyText}>
          {t('common.loading.processing')}
        </Text>
      </View>
    );
  }

  // データがない場合のフォールバック表示
  if (filteredAndSortedItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {category ? t('itemList.empty.category', { category: t(getCategoryTranslationKey(category)) }) : t('itemList.empty.all')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          locale={i18n.language === 'ja' ? 'ja-JP' : 'en-US'}
          themeVariant={colorScheme || 'light'}
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
            <Text style={styles.modalTitle}>{t('itemList.modal.selectWearDate')}</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()} // 未来の日付は選択できないように
              style={styles.datePicker}
              locale={i18n.language === 'ja' ? 'ja-JP' : 'en-US'}
              themeVariant={colorScheme || 'light'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWearModal(false);
                  setSelectedItemId(null);
                }}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWearDate}
              >
                <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
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
            <Text style={styles.modalTitle}>{t('itemList.modal.selectWashDate')}</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()} // 未来の日付は選択できないように
              style={styles.datePicker}
              locale={i18n.language === 'ja' ? 'ja-JP' : 'en-US'}
              themeVariant={colorScheme || 'light'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWashModal(false);
                  setSelectedItemId(null);
                }}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWashDate}
              >
                <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        ref={flatListRef}
        data={filteredAndSortedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
});

export default ItemList;
