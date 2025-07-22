import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useClothing } from "../contexts/ClothingContext";
import { useTheme } from "../contexts/ThemeContext";
import { useImageUrls } from '../hooks/useImageUrls';
import { formatDateJapanese, formatDateToLocalISOString } from '../lib/dateUtils';
import { CategoryValue, getCategoryIdByValue } from '../types/categories';

// BatchResult interface is defined in ClothingContext
type BatchResult = {
  successful: string[];
  failed: Array<{
    itemId: string;
    itemName: string;
    error: string;
  }>;
};

// アイテムのグループ化用の型
type GroupedItems = {
  [category: string]: Array<{
    id: string;
    name: string;
    category: CategoryValue;
    image: string;
  }>;
};

export default function BatchRecord() {
  const router = useRouter();
  const { allClothingItems, batchWearItems, batchWashItems, loading } = useClothing();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  // カテゴリ翻訳関数
  const getCategoryName = (categoryValue: CategoryValue) => {
    if (!categoryValue) return t('batchRecord.categories.others');
    
    // CategoryValue（日本語表示名）からカテゴリIDを取得
    const categoryId = getCategoryIdByValue(categoryValue);
    
    // カテゴリIDを翻訳キーに変換
    return t(`addItem.categories.${categoryId}`);
  };
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date()); // iOS用の一時的な日付
  const [selectedAction, setSelectedAction] = useState<'wear' | 'wash'>('wear');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false); // iOS用モーダル

  // 画面サイズを取得
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 64) / 3; // 左右のpadding(16) + 2つのgap(16) を考慮して3列

  // 画像URLを取得（useImageUrlsフックを使用）
  const imageUrls = useImageUrls(allClothingItems.map(item => ({ 
    id: item.id, 
    imageUrl: item.image || ''
  })), { 
    width: 200, 
    height: 200
  });

  // 画面が開かれた時に状態をリセット
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    setTempDate(today);
    setSelectedAction('wear');
    setSelectedItems(new Set());
    setBatchLoading(false);
    setShowDatePicker(false);
    setShowDateModal(false);
  }, []);

  // アイテムをカテゴリごとにグループ化（アクションに応じてフィルタリング）
  const groupedItems = useMemo(() => {
    const groups: GroupedItems = {};
    
    // 洗濯アクションの場合は着用回数が1以上のアイテムのみ
    const filteredItems = selectedAction === 'wash' 
      ? allClothingItems.filter(item => item.wearCount >= 1)
      : allClothingItems;
    
    filteredItems.forEach(item => {
      const category = getCategoryName(item.category);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({
        id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
      });
    });
    
    return groups;
  }, [allClothingItems, selectedAction, t]);

  // フィルタリング後のアイテム数を計算
  const filteredItemsCount = useMemo(() => {
    return Object.values(groupedItems).reduce((total, items) => total + items.length, 0);
  }, [groupedItems]);

  // フィルタリング後のアイテムIDリストを取得
  const filteredItemIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(groupedItems).forEach(items => {
      items.forEach(item => ids.push(item.id));
    });
    return ids;
  }, [groupedItems]);

  // アクション切り替え時に選択状態を調整
  useEffect(() => {
    if (selectedAction === 'wash') {
      // 洗濯アクション選択時：着用回数が0のアイテムの選択を解除
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        const washableItemIds = new Set(filteredItemIds);
        
        // フィルタリング後のアイテムにないものを選択から除外
        prev.forEach(itemId => {
          if (!washableItemIds.has(itemId)) {
            newSelection.delete(itemId);
          }
        });
        
        return newSelection;
      });
    }
  }, [selectedAction, filteredItemIds]);

  // 閉じるボタンのハンドラ
  const handleClose = () => {
    // 選択内容があれば確認ダイアログを表示
    if (selectedItems.size > 0) {
      Alert.alert(
        t('batchRecord.alerts.discardTitle'),
        t('batchRecord.alerts.discardMessage'),
        [
          { text: t('common.cancel'), style: "cancel" },
          { 
            text: t('batchRecord.alerts.discard'), 
            style: "destructive",
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } else {
      // 選択内容がなければそのまま閉じる
      router.back();
    }
  };

  // アイテム選択の切り替え
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // 全選択/全解除（フィルタリング後のアイテムに基づく）
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItemsCount) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItemIds));
    }
  };

  // 日付選択ボタンのハンドラー
  const handleDatePickerPress = () => {
    if (Platform.OS === 'ios') {
      setTempDate(selectedDate); // 現在の日付を一時的な日付にコピー
      setShowDateModal(true);
    } else {
      setShowDatePicker(true);
    }
  };

  // 日付変更ハンドラー
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setSelectedDate(selectedDate);
      }
    } else {
      // iOS用の処理 - 一時的な日付を更新
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  // iOS用の日付確定ハンドラー
  const confirmDateSelection = () => {
    setSelectedDate(tempDate); // 一時的な日付を正式な日付に反映
    setShowDateModal(false);
  };

  // iOS用の日付キャンセルハンドラー
  const cancelDateSelection = () => {
    setTempDate(selectedDate); // 一時的な日付を元に戻す
    setShowDateModal(false);
  };

  // 一括記録の実行
  const executeBatchRecord = async () => {
    if (selectedItems.size === 0) {
      Alert.alert(t('common.error'), t('batchRecord.alerts.selectItems'));
      return;
    }

    setBatchLoading(true);
    try {
      const itemIds = Array.from(selectedItems);
      const dateString = formatDateToLocalISOString(selectedDate);

      let result: BatchResult;
      if (selectedAction === 'wear') {
        result = await batchWearItems(itemIds, dateString);
      } else {
        result = await batchWashItems(itemIds, dateString);
      }

      // 結果表示
      showBatchResult(result);

      // 成功した場合は選択をクリアして画面を閉じる
      if (result.successful.length > 0) {
        setSelectedItems(new Set());
        if (result.failed.length === 0) {
          router.back();
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('batchRecord.alerts.batchFailed'));
    } finally {
      setBatchLoading(false);
    }
  };

  // 結果表示
  const showBatchResult = (result: BatchResult) => {
    const successCount = result.successful.length;
    const failCount = result.failed.length;
    const actionText = selectedAction === 'wear' ? t('batchRecord.actions.wear') : t('batchRecord.actions.wash');

    let message = '';

    if (failCount === 0) {
      // 全て成功した場合
      message = t('batchRecord.results.allSuccess', { count: successCount, action: actionText });
    } else if (successCount === 0) {
      // 全て失敗した場合
      const errorMessage = result.failed[0].error;
      if (errorMessage.includes('既に存在します')) {
        message = t('batchRecord.results.allFailedDuplicate', { count: failCount, action: actionText });
      } else {
        message = t('batchRecord.results.allFailedError', { count: failCount, action: actionText });
      }
    } else {
      // 一部成功、一部失敗の場合
      const duplicateErrors = result.failed.filter(f => f.error.includes('既に存在します')).length;
      if (duplicateErrors === failCount) {
        message = t('batchRecord.results.partialSuccessDuplicate', { successCount, failCount, action: actionText });
      } else if (duplicateErrors > 0) {
        message = t('batchRecord.results.partialSuccessMixed', { successCount, failCount, action: actionText });
      } else {
        message = t('batchRecord.results.partialSuccessError', { successCount, failCount, action: actionText });
      }
    }

    Alert.alert(t('batchRecord.title'), message);
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    formContainer: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.text,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 8,
    },
    dateText: {
      fontSize: 16,
      flex: 1,
      color: theme.text,
    },
    actionButtons: {
      flexDirection: 'row',
      marginHorizontal: -4,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      margin: 4,
      borderWidth: 1,
      borderColor: theme.border,
      flex: 1,
      justifyContent: 'center',
    },
    actionIcon: {
      marginRight: 6,
    },
    actionButtonActive: {
      backgroundColor: '#3498db',
      borderColor: '#3498db',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.text + "99",
    },
    actionButtonTextActive: {
      color: 'white',
      fontWeight: 'bold',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    selectAllText: {
      color: '#3498db',
      fontSize: 14,
    },
    categorySection: {
      marginBottom: 16,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.text,
      opacity: 0.8,
    },
    itemGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    itemCard: {
      width: cardWidth,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    itemCardSelected: {
      borderColor: '#3498db',
      backgroundColor: theme.card,
    },
    itemImage: {
      width: '100%',
      height: cardWidth * 0.8,
      backgroundColor: theme.border,
    },
    itemImagePlaceholder: {
      width: '100%',
      height: cardWidth * 0.8,
      backgroundColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemInfo: {
      padding: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemName: {
      fontSize: 10,
      color: theme.text,
      flex: 1,
      marginRight: 4,
    },
    checkboxContainer: {
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    executeButton: {
      flexDirection: "row",
      backgroundColor: "#3498db",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
      shadowColor: "#3498db",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    executeButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
      color: theme.text,
      opacity: 0.6,
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.text,
      opacity: 0.6,
      fontStyle: 'italic',
    },
    // iOS用モーダルスタイル
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: theme.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    cancelButton: {
      backgroundColor: theme.border,
    },
    confirmButton: {
      backgroundColor: '#3498db',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    datePicker: {
      width: '100%',
      height: 200,
    },
  });

  return (
    <>
      {/* ヘッダータイトルの設定と閉じるボタンの追加 */}
      <Stack.Screen options={{ 
        title: t('batchRecord.title'),
        presentation: "modal", // モーダル風の表示
        headerTitleStyle: {
          fontWeight: "600",
          color: theme.text,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        ),
      }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* 日付選択 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('batchRecord.fields.date')}</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={handleDatePickerPress}
              >
                <Ionicons name="calendar" size={20} color={theme.text} style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {i18n.language === 'ja' 
                    ? formatDateJapanese(selectedDate)
                    : selectedDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {/* アクション選択 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('batchRecord.fields.action')}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedAction === 'wear' && styles.actionButtonActive
                  ]}
                  onPress={() => setSelectedAction('wear')}
                >
                  <Ionicons 
                    name="shirt" 
                    size={20} 
                    color={selectedAction === 'wear' ? "#fff" : theme.text + "99"} 
                    style={styles.actionIcon}
                  />
                  <Text style={[
                    styles.actionButtonText,
                    selectedAction === 'wear' && styles.actionButtonTextActive
                  ]}>
                    {t('batchRecord.actions.wear')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedAction === 'wash' && styles.actionButtonActive
                  ]}
                  onPress={() => setSelectedAction('wash')}
                >
                  <Ionicons 
                    name="water" 
                    size={20} 
                    color={selectedAction === 'wash' ? "#fff" : theme.text + "99"} 
                    style={styles.actionIcon}
                  />
                  <Text style={[
                    styles.actionButtonText,
                    selectedAction === 'wash' && styles.actionButtonTextActive
                  ]}>
                    {t('batchRecord.actions.wash')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* アイテム選択 */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>
                  {t('batchRecord.fields.itemSelection', { selected: selectedItems.size, total: filteredItemsCount })}
                </Text>
                <TouchableOpacity onPress={toggleSelectAll}>
                  <Text style={styles.selectAllText}>
                    {selectedItems.size === filteredItemsCount ? t('batchRecord.actions.deselectAll') : t('batchRecord.actions.selectAll')}
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.text} />
                  <Text style={styles.loadingText}>{t('batchRecord.loading')}</Text>
                </View>
              ) : filteredItemsCount === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {selectedAction === 'wash' 
                      ? t('batchRecord.emptyStates.noWashableItems')
                      : t('batchRecord.emptyStates.noItems')
                    }
                  </Text>
                </View>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.itemGrid}>
                      {items.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemCard,
                            selectedItems.has(item.id) && styles.itemCardSelected
                          ]}
                          onPress={() => toggleItemSelection(item.id)}
                        >
                          {imageUrls[item.id] ? (
                            <Image
                              source={{ 
                                uri: imageUrls[item.id],
                                cacheKey: `${item.image}_200x200`
                              }}
                              style={styles.itemImage}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="disk"
                            />
                          ) : (
                            <View style={styles.itemImagePlaceholder}>
                              <Ionicons name="image-outline" size={20} color={theme.text} />
                            </View>
                          )}
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {item.name || t('batchRecord.noName')}
                            </Text>
                            <View style={styles.checkboxContainer}>
                              <Ionicons
                                name={selectedItems.has(item.id) ? "checkbox" : "square-outline"}
                                size={16}
                                color={selectedItems.has(item.id) ? "#3498db" : theme.text}
                              />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 実行ボタン */}
            <TouchableOpacity
              style={[
                styles.executeButton,
                { opacity: selectedItems.size === 0 || batchLoading ? 0.5 : 1 }
              ]}
              onPress={executeBatchRecord}
              disabled={selectedItems.size === 0 || batchLoading}
            >
              {batchLoading ? (
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.executeButtonText}>
                {t('batchRecord.executeButton', { 
                  action: selectedAction === 'wear' ? t('batchRecord.actions.wearRecord') : t('batchRecord.actions.washRecord') 
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Android用の日付ピッカー */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
            locale={i18n.language === 'ja' ? "ja-JP" : "en-US"}
            themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
          />
        )}

        {/* iOS用の日付選択モーダル */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDateModal}
          onRequestClose={cancelDateSelection}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('batchRecord.dateModal.title')}</Text>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
                style={styles.datePicker}
                locale={i18n.language === 'ja' ? "ja-JP" : "en-US"}
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelDateSelection}
                >
                  <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmDateSelection}
                >
                  <Text style={styles.modalButtonText}>{t('batchRecord.dateModal.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}