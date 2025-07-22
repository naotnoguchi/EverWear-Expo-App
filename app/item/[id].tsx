import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import ItemCalendar from "../../components/ItemCalendar";
import { useClothing } from "../../contexts/ClothingContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDateToLocalISOString } from '../../lib/dateUtils';
import { getImageUrl } from '../../lib/storageClient';
import { AppClothingItem } from '../../types/database';

// カテゴリ値から翻訳キーへのマッピング
const getCategoryTranslationKey = (categoryValue: string): string => {
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
  
  return categoryMap[categoryValue] || categoryValue;
};

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { clothingItems, wearItem, washItem, deleteItem, deleteWearHistory, deleteWashHistory } = useClothing();
  const [item, setItem] = useState<AppClothingItem | null>(null);
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

  // 日付フォーマット関数をロケール対応に
  const formatDateLocalized = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US');
  };

  // Android用の日付変更ハンドラー
  const onDateChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowWearDatePicker(false);
      setShowWashDatePicker(false);
    }

    if (selectedDate && item) {
      const currentDate = selectedDate;
      
      if (showWearDatePicker || showWearModal) {
        // 着用記録の処理
        try {
          const formattedDate = formatDateToLocalISOString(currentDate);
          const localizedDate = formatDateLocalized(currentDate);
          await wearItem(item.id, formattedDate);
          Alert.alert(t('itemDetail.actions.recordWear'), t('itemDetail.alerts.wearRecorded', { date: localizedDate }));
        } catch (error: any) {
          const localizedDate = formatDateLocalized(currentDate);
          console.error('Error adding wear record:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);

          // Check if the error is about duplicate records
          if (error?.message && error.message.includes('着用記録は既に存在します')) {
            Alert.alert(t('common.error'), t('itemDetail.alerts.wearDuplicate', { date: localizedDate }));
          } else {
            Alert.alert(t('common.error'), t('itemDetail.alerts.wearError', { date: localizedDate }));
          }
        }
      } else if (showWashDatePicker || showWashModal) {
        // 洗濯記録の処理
        try {
          const formattedDate = formatDateToLocalISOString(currentDate);
          const localizedDate = formatDateLocalized(currentDate);
          await washItem(item.id, formattedDate);
          Alert.alert(t('itemDetail.actions.recordWash'), t('itemDetail.alerts.washRecorded', { date: localizedDate }));
        } catch (error: any) {
          const localizedDate = formatDateLocalized(currentDate);
          console.error('Error adding wash record:', error);
          console.error('Error code:', error?.code);
          console.error('Error message:', error?.message);

          // Check if the error is about duplicate records
          if (error?.message && error.message.includes('洗濯記録は既に存在します')) {
            Alert.alert(t('common.error'), t('itemDetail.alerts.washDuplicate', { date: localizedDate }));
          } else {
            Alert.alert(t('common.error'), t('itemDetail.alerts.washError', { date: localizedDate }));
          }
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
  const confirmWearDate = async () => {
    if (item) {
      try {
        const formattedDate = formatDateToLocalISOString(selectedDate);
        const localizedDate = formatDateLocalized(selectedDate);
        await wearItem(item.id, formattedDate);
        Alert.alert(t('itemDetail.actions.recordWear'), t('itemDetail.alerts.wearRecorded', { date: localizedDate }));
        setShowWearModal(false);
      } catch (error: any) {
        const localizedDate = formatDateLocalized(selectedDate);
        console.error('Error adding wear record:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);

        // Check if the error is about duplicate records
        if (error?.message && error.message.includes('着用記録は既に存在します')) {
          Alert.alert(t('common.error'), t('itemDetail.alerts.wearDuplicate', { date: localizedDate }));
        } else {
          Alert.alert(t('common.error'), t('itemDetail.alerts.wearError', { date: localizedDate }));
        }
        // エラーの場合でもモーダルは閉じる
        setShowWearModal(false);
      }
    }
  };

  // iOS用の洗濯記録確定ハンドラー
  const confirmWashDate = async () => {
    if (item) {
      try {
        const formattedDate = formatDateToLocalISOString(selectedDate);
        const localizedDate = formatDateLocalized(selectedDate);
        await washItem(item.id, formattedDate);
        Alert.alert(t('itemDetail.actions.recordWash'), t('itemDetail.alerts.washRecorded', { date: localizedDate }));
        setShowWashModal(false);
      } catch (error: any) {
        const localizedDate = formatDateLocalized(selectedDate);
        console.error('Error adding wash record:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);

        // Check if the error is about duplicate records
        if (error?.message && error.message.includes('洗濯記録は既に存在します')) {
          Alert.alert(t('common.error'), t('itemDetail.alerts.washDuplicate', { date: localizedDate }));
        } else {
          Alert.alert(t('common.error'), t('itemDetail.alerts.washError', { date: localizedDate }));
        }
        // エラーの場合でもモーダルは閉じる
        setShowWashModal(false);
      }
    }
  };

  const handleDeleteItem = () => {
    Alert.alert(
      t('itemDetail.alerts.deleteConfirm'),
      t('itemDetail.alerts.deleteMessage'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('itemDetail.actions.deleteItem'), 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItem(item!.id);
              Alert.alert(
                t('itemDetail.alerts.deleteSuccess'), 
                undefined,
                [
                  {
                    text: t('common.ok'),
                    onPress: () => router.replace("/")
                  }
                ]
              );
            } catch (err) {
              console.error('Error in handleDeleteItem:', err);
              Alert.alert(t('common.error'), t('itemDetail.alerts.deleteError'));
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
        const localizedDate = formatDateLocalized(date);
        Alert.alert(t('itemDetail.alerts.deleteSuccess'), t('itemDetail.alerts.wearHistoryDeleted', { date: localizedDate }));
      } catch (err) {
        console.error('Error in handleDeleteWearHistory:', err);
        Alert.alert(t('common.error'), t('itemDetail.alerts.deleteError'));
      }
    }
  };

  // 洗濯履歴削除ハンドラー
  const handleDeleteWashHistory = async (date: string) => {
    if (item) {
      try {
        await deleteWashHistory(item.id, date);
        const localizedDate = formatDateLocalized(date);
        Alert.alert(t('itemDetail.alerts.deleteSuccess'), t('itemDetail.alerts.washHistoryDeleted', { date: localizedDate }));
      } catch (err) {
        console.error('Error in handleDeleteWashHistory:', err);
        Alert.alert(t('common.error'), t('itemDetail.alerts.deleteError'));
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
          <Text style={{ color: theme.text }}>{t('itemDetail.notFound')}</Text>
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
          locale={i18n.language === 'ja' ? 'ja-JP' : 'en-US'}
          themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
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
            <Text style={styles.modalTitle}>{t('itemDetail.actions.recordWear')}</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()} // 未来の日付は選択できないように
              style={styles.datePicker}
              locale={i18n.language === 'ja' ? 'ja-JP' : 'en-US'}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWearModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWearDate}
              >
                <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
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
            <Text style={styles.modalTitle}>{t('itemDetail.actions.recordWash')}</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()} // 未来の日付は選択できないように
              style={styles.datePicker}
              locale={i18n.language === 'ja' ? 'ja-JP' : 'en-US'}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWashModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmWashDate}
              >
                <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
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
              <Text style={styles.editButtonText}>{t('itemDetail.actions.edit')}</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>{t('itemDetail.labels.category')}</Text>
          <Text style={styles.categoryValue}>
            {item.category ? t(getCategoryTranslationKey(item.category)) : t('itemDetail.stats.none')}
          </Text>
        </View>

        {/* ブランド情報 */}
        {item.brand && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>{t('itemDetail.labels.brand')}</Text>
            <Text style={styles.categoryValue}>{item.brand}</Text>
          </View>
        )}

        {/* 状態情報 */}
        {item.condition && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>{t('itemDetail.labels.condition')}</Text>
            <Text style={styles.categoryValue}>
              {item.condition === "新品" || item.condition === "New" ? (
                <React.Fragment><Ionicons name="star" size={16} color={theme.text} style={{marginRight: 4}} /> {t('itemDetail.labels.new')}</React.Fragment>
              ) : (
                <React.Fragment><Ionicons name="repeat" size={16} color={theme.text} style={{marginRight: 4}} /> {t('itemDetail.labels.used')}</React.Fragment>
              )}
            </Text>
          </View>
        )}

        {/* 購入価格情報 */}
        {item.purchasePrice && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>{t('itemDetail.labels.purchasePrice')}</Text>
            <Text style={styles.categoryValue}>¥{item.purchasePrice.toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
              style={[styles.actionButton, styles.wearButton]}
              onPress={handleWearItem}
          >
            <Ionicons name="shirt" size={24} color="white" />
            <Text style={styles.actionButtonText}>{t('itemDetail.actions.recordWear')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
              style={[styles.actionButton, styles.washButton]}
              onPress={handleWashItem}
          >
            <Ionicons name="water" size={24} color="white" />
            <Text style={styles.actionButtonText}>{t('itemDetail.actions.recordWash')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('itemDetail.stats.wearCount')}</Text>
            <Text style={styles.statValue}>{item.wearCount}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('itemDetail.stats.washThreshold')}</Text>
            <Text style={styles.statValue}>{item.washThreshold}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('itemDetail.stats.lastWorn')}</Text>
            <Text style={styles.statValue}>
              {item.lastWorn ? formatDateLocalized(item.lastWorn) : t('itemDetail.stats.none')}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('itemDetail.stats.lastWashed')}</Text>
            <Text style={styles.statValue}>
              {item.lastWashed ? formatDateLocalized(item.lastWashed) : t('itemDetail.stats.none')}
            </Text>
          </View>
        </View>

        {/* 洗濯状態表示 */}
        <View style={styles.wearInfoContainer}>
          <Text style={styles.wearInfoLabel}>
            {needsWash ? (
              <React.Fragment>
                {t('itemDetail.washStatus.needsWash')} <Text style={styles.parenthesisText}>{t('itemDetail.washStatus.wearCount', { count: item.wearCount })}</Text>
              </React.Fragment>
            ) : (
              <React.Fragment>
                {t('itemDetail.washStatus.remainingWears', { count: remainingWears })} <Text style={styles.parenthesisText}>{t('itemDetail.washStatus.wearCount', { count: item.wearCount })}</Text>
              </React.Fragment>
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
              <Text style={styles.memoTitle}>{t('itemDetail.memo.title')}</Text>
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
          <Text style={styles.deleteButtonBottomText}>{t('itemDetail.actions.deleteItem')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
