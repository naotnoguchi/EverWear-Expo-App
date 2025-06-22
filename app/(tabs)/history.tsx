import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import HistoryCalendar, { HistoryCalendarRefType } from "../../components/HistoryCalendar";
import { useClothing } from '../../contexts/ClothingContext';
import { useTabReset } from '../../contexts/TabResetContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useImageUrls } from '../../hooks/useImageUrls';
import { formatDateJapanese } from '../../lib/dateUtils';

// React Native の LayoutAnimation を有効化（Android用）
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// 履歴アイテムの型定義
interface HistoryItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  brand?: string; // ブランド情報を追加
  imageUrl?: string; // アイテム画像を追加
  eventType: "wear" | "wash";
  date: string;
}

// セクションデータの型定義
interface HistorySection {
  date: string;
  title: string;
  data: HistoryItem[];
}

// 実際の履歴データを生成する関数
const generateHistoryData = (clothingItems: any[]): HistoryItem[] => {
  const historyItems: HistoryItem[] = [];
  const processedDates = new Set<string>(); // 処理済みの日付を追跡

  clothingItems.forEach(item => {
    // 着用履歴を追加
    if (item.wearHistory && item.wearHistory.length > 0) {
      item.wearHistory.forEach((date: string, index: number) => {
        const uniqueId = `wear-${item.id}-${date}-${index}`; // インデックスを追加して一意性を確保
        if (!processedDates.has(uniqueId)) {
          historyItems.push({
            id: uniqueId,
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            brand: item.brand,
            imageUrl: item.image,
            eventType: "wear",
            date: date
          });
          processedDates.add(uniqueId);
        }
      });
    }

    // 洗濯履歴を追加
    if (item.washHistory && item.washHistory.length > 0) {
      item.washHistory.forEach((date: string, index: number) => {
        const uniqueId = `wash-${item.id}-${date}-${index}`; // インデックスを追加して一意性を確保
        if (!processedDates.has(uniqueId)) {
          historyItems.push({
            id: uniqueId,
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            brand: item.brand,
            imageUrl: item.image,
            eventType: "wash",
            date: date
          });
          processedDates.add(uniqueId);
        }
      });
    }
  });

  return historyItems;
};

// 日付フォーマットはlib/dateUtils.tsから使用

export default function History() {
  const { clothingItems, deleteWearHistory, deleteWashHistory } = useClothing();
  const theme = useTheme();
  const { registerResetFunction } = useTabReset();
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 選択された日付
  const [isCalendarMinimized, setIsCalendarMinimized] = useState(false); // カレンダーが最小化されているかどうか
  const [showHint, setShowHint] = useState(true); // ヒントを表示するかどうか
  const sectionListRef = useRef<SectionList>(null);
  const calendarRef = useRef<HistoryCalendarRefType>(null);
  const lastScrollY = useRef(0); // 前回のスクロール位置を記録
  const scrollDirection = useRef<'up' | 'down'>('down'); // スクロール方向
  const isScrolling = useRef(false); // スクロール中かどうか
  const animationInProgressRef = useRef(false); // アニメーション進行中フラグ

  // アニメーション用の値
  const calendarHeight = useRef(new Animated.Value(1)).current; // 1: 最大化、0: 最小化
  const calendarHeaderOpacity = useRef(new Animated.Value(1)).current; // ヘッダーの透明度
  const expandButtonOpacity = useRef(new Animated.Value(0)).current; // 展開ボタンの透明度
  // 折りたたみボタンの位置のアニメーション値を削除

  // ページがフォーカスされた時に状態をリセット
  useEffect(() => {
    // カレンダーを最大化状態に戻す
    if (isCalendarMinimized) {
      animateCalendar(false);
    }

    // スクロール位置をリセット
    lastScrollY.current = 0;
    scrollDirection.current = 'down';

    return () => {
      // クリーンアップ
    };
  }, []);

  // Register the reset function with the TabResetContext
  useEffect(() => {
    registerResetFunction("history", () => {
      // Maximize the calendar if it's minimized
      if (isCalendarMinimized) {
        animateCalendar(false);
      }

      // Reset to today and scroll to top
      resetToToday();
    });
  }, [registerResetFunction, isCalendarMinimized]);

  // デバイスの画面高さを取得
  const { height: windowHeight } = useWindowDimensions();

  // 履歴データを取得
  const historyData = useMemo(() => generateHistoryData(clothingItems), [clothingItems]);

  // 画像URLを取得
  const imageUrls = useImageUrls(historyData.map(item => ({ 
    id: item.itemId, 
    imageUrl: item.imageUrl || ''
  })), { 
    width: 320, 
    height: 320
  });

  // Filter history data based on selected date only
  const filteredHistory = useMemo(() => {
    if (selectedDate) {
      return historyData.filter(item => item.date === selectedDate);
    }
    return historyData;
  }, [selectedDate, historyData]);

  // Group by date and create section data
  const groupedSections = useMemo(() => {
    // 日付ごとにグループ化
    const groupedByDate: { [key: string]: HistoryItem[] } = {};

    filteredHistory.forEach(item => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = [];
      }
      groupedByDate[item.date].push(item);
    });

    // セクションデータに変換
    const sections = Object.keys(groupedByDate)
      .map(date => ({
        date,
        title: formatDateJapanese(date),
        data: groupedByDate[date]
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return sections;
  }, [filteredHistory]);

  // アニメーションの設定
  const animateCalendar = (minimize: boolean) => {
    // アニメーション中は不要な再レンダリングを防止
    if ((minimize && isCalendarMinimized) || (!minimize && !isCalendarMinimized) || animationInProgressRef.current) {
      return;
    }

    // アニメーション進行中フラグを設定
    animationInProgressRef.current = true;

    // 共通のアニメーション設定
    const config = {
      duration: 250, // より速くする
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false
    };

    // 最小化時は先に状態を更新してUIを変更
    if (minimize) {
      setIsCalendarMinimized(true);
    }

    // メインのカレンダーアニメーション
    Animated.parallel([
      Animated.timing(calendarHeight, {
        toValue: minimize ? 0 : 1,
        ...config
      }),
      Animated.timing(calendarHeaderOpacity, {
        toValue: minimize ? 0 : 1,
        ...config
      }),
      Animated.timing(expandButtonOpacity, {
        toValue: minimize ? 1 : 0,
        ...config
      })
      // 折りたたみボタン位置のアニメーションを削除
    ]).start(() => {
      // 最大化時は、アニメーション完了後に状態を更新
      if (!minimize) {
        setIsCalendarMinimized(false);
      }

      // アニメーション進行中フラグをリセット
      animationInProgressRef.current = false;
    });

    // リスト部分のレイアウトアニメーション
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 250 // アニメーション時間を同期
    });
  };

  // カレンダーコンテナのサイズを測定（高さの自動調整のため、測定は不要になりました）
  const measureCalendarContainer = (event: any) => {
    // 高さの自動調整のため、測定は不要になりました
  };


  const handleItemPress = (itemId: string) => {
    // アイテム詳細へのナビゲーション
    router.push(`/item/${itemId}`);
  };

  // 履歴削除ハンドラー
  const handleDeleteHistory = (item: HistoryItem) => {
    Alert.alert(
      `${item.eventType === "wear" ? "着用" : "洗濯"}履歴を削除`,
      `${item.itemName}の${item.date}の履歴を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.eventType === "wear") {
                await deleteWearHistory(item.itemId, item.date);
              } else {
                await deleteWashHistory(item.itemId, item.date);
              }

              Alert.alert(
                "削除完了", 
                `${item.itemName}の${item.date}の${item.eventType === "wear" ? "着用" : "洗濯"}履歴を削除しました`
              );
            } catch (err) {
              console.error('Error in handleDeleteHistory:', err);
              Alert.alert(
                "削除エラー", 
                `${item.eventType === "wear" ? "着用" : "洗濯"}履歴の削除に失敗しました。もう一度お試しください。`
              );
            }
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleItemPress(item.itemId)}
        onLongPress={() => handleDeleteHistory(item)} // 長押しで削除オプションを表示
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBackground,
              { backgroundColor: item.eventType === "wear" ? "#3498db" : "#2ecc71" },
            ]}
          >
            <Ionicons
              name={item.eventType === "wear" ? "shirt" : "water"}
              size={20}
              color="white"
            />
          </View>
        </View>

        <Image
          source={{
            uri: imageUrls[item.itemId] || item.imageUrl || require('@/assets/images/placeholder.png'),
            cacheKey: item.imageUrl,
            width: 60,
            height: 60
          }}
          style={styles.itemImage}
          contentFit="cover"
          cachePolicy="disk"
          onError={() => {
            // エラー時は何もしない（デフォルトのフォールバック画像が表示される）
          }}
        />

        <View style={styles.historyContent}>
          {item.itemName && item.itemName.trim() && (
            <Text style={styles.historyTitle}>{item.itemName}</Text>
          )}
          <Text style={styles.historyCategory}>
            {item.brand ? `${item.brand} / ${item.category}` : item.category}
          </Text>
          <Text style={styles.historyAction}>
            {item.eventType === "wear" ? "着用しました" : "洗濯しました"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // セクションヘッダーのレンダリング
  const renderSectionHeader = ({ section }: { section: HistorySection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  // Function to scroll to a specific date section
  const scrollToDate = (date: string | null) => {
    if (!date) return;

    // Find the index of the section with the matching date
    const sectionIndex = groupedSections.findIndex(section => section.date === date);
    if (sectionIndex !== -1) {
      // Scroll to the section
      sectionListRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
      });
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date);
    if (date) {
      scrollToDate(date);
    }
  };

  // Reset to today's date
  const resetToToday = () => {
    // セクションの存在をチェックしてからスクロール
    if (groupedSections.length > 0) {
      // 先にスクロール処理を行い、その後で選択状態をリセット
      sectionListRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
      });
    }

    // カレンダーの表示月を今月にリセット
    if (calendarRef.current) {
      calendarRef.current.resetCalendarToToday();
    }

    // 選択状態のリセットは最後に行う
    setSelectedDate(null);
  };

  // Handle scroll events to minimize/maximize calendar
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;

    // アニメーション中は処理をスキップ
    if (animationInProgressRef.current) {
      return;
    }

    // スクロール方向を判定（前回のスクロール位置と比較）
    // 閾値を下げて、より敏感に反応するようにする
    const isSignificantChange = Math.abs(scrollY - lastScrollY.current) > 0.5;
    const newDirection = isSignificantChange 
      ? (scrollY > lastScrollY.current ? 'down' : 'up')
      : scrollDirection.current;

    if (isSignificantChange) {
      scrollDirection.current = newDirection;
      lastScrollY.current = scrollY;
    }

    // カレンダーを最小化する条件: 下スクロール時で、閾値よりスクロールした場合
    if (newDirection === 'down' && scrollY > 10 && !isCalendarMinimized) {
      animateCalendar(true);
    } 
    // カレンダーを最大化する条件: 上スクロール時で、リストの先頭に近い場合
    else if (newDirection === 'up' && scrollY < 5 && isCalendarMinimized) {
      animateCalendar(false);
    }
  };

  // Toggle calendar minimized state with animation
  const toggleCalendarMinimized = () => {
    animateCalendar(!isCalendarMinimized);
  };

  // アニメーション用の補間値
  const interpolatedHeight = calendarHeight.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [60, 100, 'auto'], // 最大化時は 'auto' を使用
    extrapolate: 'clamp', // 範囲外の値をクランプ
  });

  // カレンダー最小化時のスタイル
  const minimizedCalendarStyle = {
    height: isCalendarMinimized ? interpolatedHeight : 'auto', // 最大化時は auto
    overflow: 'hidden',
    borderBottomWidth: 0, // 下部の境界線を削除（カード形式のため）
  };

  // カスタムカレンダースタイル
  const calendarCustomStyle = {
    container: {
      backgroundColor: theme.card,
      padding: 16,
      paddingBottom: 8, // ItemCalendarと同じ値に
      // borderRadiusなどはcalendarContainerで設定するため不要
    },
    legend: {
      marginTop: 4, // ItemCalendarと同じ値に
      justifyContent: 'flex-end',
      paddingRight: 8,
    },
    calendarGrid: {
      marginBottom: 2, // ItemCalendarと同じ値に
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContainer: {
      padding: 16,
      paddingTop: 8,
      // フローティングボタンが削除されたので余白を減らす
      paddingBottom: 30,
    },
    sectionHeader: {
      backgroundColor: theme.background,
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginBottom: 8,
      marginTop: 8,
      borderRadius: 4,
    },
    sectionHeaderText: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.text,
    },
    historyItem: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 8,
      marginBottom: 8,
      flexDirection: "row",
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    iconContainer: {
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
    },
    iconBackground: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      alignSelf: 'center',
      backgroundColor: theme.border,
    },
    historyContent: {
      flex: 1,
      marginLeft: 8,
      justifyContent: "center",
    },
    historyDate: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      marginBottom: 4,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 2,
      color: theme.text,
    },
    historyCategory: {
      fontSize: 12,
      color: theme.text + "99", // with transparency
      marginBottom: 4,
    },
    historyAction: {
      fontSize: 14,
      color: theme.text,
    },
    calendarContainer: {
      zIndex: 10,
      backgroundColor: theme.card,
      borderRadius: 8, // カード形式に変更
      margin: 16, // 周囲に余白を追加
      marginBottom: 8, // 下部の余白を調整
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden', // 内容がはみ出ないようにする
    },
    expandButton: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingBottom: 5,
      borderBottomLeftRadius: 8, // カード形式の角丸に合わせる
      borderBottomRightRadius: 8, // カード形式の角丸に合わせる
    },
    expandButtonTouchable: {
      backgroundColor: theme.card,
      borderRadius: 20,
      paddingHorizontal: 15,
      height: 40,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    expandButtonText: {
      fontSize: 12,
      marginLeft: 5,
      color: theme.text,
      fontWeight: '500',
    },
    minimizedHeader: {
      height: 60,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderRadius: 8, // カード形式に合わせる
    },
    // フローティングボタンのスタイルを削除
    selectedDateHistoryContainer: {
      flex: 1,
      marginTop: 16,
    },
    selectedDateTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    placeholderText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.text + "99", // with transparency
      textAlign: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 30,
    },
    hintContainer: {
      backgroundColor: theme.card,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: '#3498db',
    },
    hintText: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    hintCloseText: {
      fontSize: 14,
      color: '#3498db',
      fontWeight: '500',
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.calendarContainer,
          minimizedCalendarStyle
        ]}
        onLayout={measureCalendarContainer}
      >
        {/* 最小化/最大化共通のコンテナ - アニメーション用 */}
        <Animated.View 
          style={{ 
            opacity: calendarHeaderOpacity, 
            height: isCalendarMinimized ? 0 : 'auto',
            overflow: 'hidden'
          }}
        >
          <HistoryCalendar
            ref={calendarRef}
            historyData={historyData}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            onResetToToday={resetToToday}
            customStyle={calendarCustomStyle}
          />
        </Animated.View>

        {/* 最小化時のヘッダーとボタン */}
        {isCalendarMinimized && (
          <>
            <View style={styles.minimizedHeader}>
            </View>

            <Animated.View style={[
              styles.expandButton,
              { opacity: expandButtonOpacity }
            ]}>
              <TouchableOpacity 
                onPress={() => animateCalendar(false)}
                style={styles.expandButtonTouchable}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-down" size={20} color={theme.text} />
                <Text style={styles.expandButtonText}>カレンダーを表示</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </Animated.View>

      {/* ヒント表示 */}
      {showHint && filteredHistory.length > 0 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            履歴を長押しすると削除できます
          </Text>
          <TouchableOpacity onPress={() => setShowHint(false)}>
            <Text style={styles.hintCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 履歴リスト表示 */}
      <SectionList
        ref={sectionListRef}
        sections={groupedSections}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        onScroll={handleScroll}
        scrollEventThrottle={8} // スクロールイベントの頻度を上げる
        onScrollBeginDrag={(e) => {
          // スクロール開始時に現在の位置を記録
          lastScrollY.current = e.nativeEvent.contentOffset.y;
          isScrolling.current = true;
        }}
        onScrollEndDrag={() => {
          // スクロール終了時にフラグをリセット
          isScrolling.current = false;
        }}
        onMomentumScrollEnd={() => {
          // 慣性スクロール終了時にフラグをリセット
          isScrolling.current = false;
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={theme.text + "66"} /* with more transparency */ />
            <Text style={styles.placeholderText}>履歴がありません</Text>
          </View>
        }
      />
    </View>
  );
}
