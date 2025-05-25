import { useState, useMemo, useRef, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClothing } from '../../contexts/ClothingContext';
import { router } from "expo-router";
import HistoryCalendar from "../../components/HistoryCalendar";

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
  eventType: "wear" | "wash";
  date: string;
}

// セクションデータの型定義
interface HistorySection {
  date: string;
  title: string;
  data: HistoryItem[];
}

// Dummy history data
const dummyHistoryData: HistoryItem[] = [
  {
    id: "1",
    itemId: "1",
    itemName: "お気に入りの白シャツ",
    category: "トップス",
    eventType: "wear",
    date: "2023-10-15",
  },
  {
    id: "2",
    itemId: "2",
    itemName: "黒パンツ",
    category: "ボトムス",
    eventType: "wear",
    date: "2023-10-14",
  },
  {
    id: "3",
    itemId: "3",
    itemName: "デニムジャケット",
    category: "アウター",
    eventType: "wear",
    date: "2023-10-10",
  },
  {
    id: "4",
    itemId: "1",
    itemName: "お気に入りの白シャツ",
    category: "トップス",
    eventType: "wash",
    date: "2023-10-09",
  },
  {
    id: "5",
    itemId: "2",
    itemName: "黒パンツ",
    category: "ボトムス",
    eventType: "wash",
    date: "2023-10-08",
  },
  {
    id: "6",
    itemId: "4",
    itemName: "グレーのセーター",
    category: "トップス",
    eventType: "wear",
    date: "2023-10-12",
  },
  {
    id: "7",
    itemId: "5",
    itemName: "チノパン",
    category: "ボトムス",
    eventType: "wear",
    date: "2023-10-13",
  },
  {
    id: "8",
    itemId: "4",
    itemName: "グレーのセーター",
    category: "トップス",
    eventType: "wash",
    date: "2023-10-07",
  },
  {
    id: "9",
    itemId: "3",
    itemName: "デニムジャケット",
    category: "アウター",
    eventType: "wash",
    date: "2023-10-05",
  },
  {
    id: "10",
    itemId: "5",
    itemName: "チノパン",
    category: "ボトムス",
    eventType: "wash",
    date: "2023-10-06",
  },
];

// 曜日付きの日付フォーマット
const formatDateWithDay = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dayOfWeek = days[date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
};

export default function History() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 選択された日付
  const [isCalendarMinimized, setIsCalendarMinimized] = useState(false); // カレンダーが最小化されているかどうか
  const sectionListRef = useRef<SectionList>(null);
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

  // 測定されたカレンダーの元の高さ
  const [fullCalendarHeight, setFullCalendarHeight] = useState(350); // デフォルト値を大きめに設定
  
  // デバイスの画面高さを取得
  const { height: windowHeight } = useWindowDimensions();
  
  // 画面の高さに応じてカレンダーの最大高さを設定
  const maxCalendarHeight = Math.min(windowHeight * 0.4, 350); // 画面の60%または500pxのいずれか小さい方

  // Filter history data based on selected date only
  const filteredHistory = useMemo(() => {
    if (selectedDate) {
      return dummyHistoryData.filter(item => item.date === selectedDate);
    }
    return dummyHistoryData;
  }, [selectedDate]);

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
        title: formatDateWithDay(date),
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

        // 測定を再実行して正確な高さを取得
        setTimeout(() => {
          setFullCalendarHeight(prev => Math.max(prev, 350));
        }, 50);
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

  // カレンダーコンテナのサイズを測定
  const measureCalendarContainer = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !isCalendarMinimized) {
      console.log("Measured calendar height:", height);
      // 最小値を設定して、常に十分な高さを確保する
      setFullCalendarHeight(Math.max(height, 350));
    }
  };

  // コンポーネントマウント時に一度だけ初期高さを設定
  useEffect(() => {
    // デフォルトの最低高さを設定
    setFullCalendarHeight(350);
  }, []);

  const handleItemPress = (itemId: string) => {
    // アイテム詳細へのナビゲーション
    router.push(`/item/${itemId}`);
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleItemPress(item.itemId)}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBackground,
              { backgroundColor: item.eventType === "wear" ? "#3498db" : "#e74c3c" },
            ]}
          >
            <Ionicons
              name={item.eventType === "wear" ? "shirt" : "water"}
              size={20}
              color="white"
            />
          </View>
        </View>
        <View style={styles.historyContent}>
          <Text style={styles.historyTitle}>
            {item.itemName}
            <Text style={styles.historyCategory}> ({item.category})</Text>
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
      console.log("Minimizing calendar, scrollY:", scrollY);
      animateCalendar(true);
    } 
    // カレンダーを最大化する条件: 上スクロール時で、リストの先頭に近い場合
    else if (newDirection === 'up' && scrollY < 5 && isCalendarMinimized) {
      console.log("Maximizing calendar, scrollY:", scrollY);
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
    outputRange: [60, 100, Math.max(fullCalendarHeight, maxCalendarHeight)], // 中間値を追加してスムーズに
    extrapolate: 'clamp', // 範囲外の値をクランプ
  });

  // カレンダー最小化時のスタイル
  const minimizedCalendarStyle = {
    height: interpolatedHeight,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  };

  // カスタムカレンダースタイル
  const calendarCustomStyle = {
    container: {
      backgroundColor: 'white',
      padding: 16,
      paddingBottom: 6, // 下部のパディングをさらに減らす
    },
    legend: {
      marginTop: 2, // 8pxから2pxに縮小
      justifyContent: 'flex-end', // 右寄せにする
      paddingRight: 8, // 右側の余白を追加
    },
    calendarGrid: {
      marginBottom: 0, // グリッドの下マージンをなくす
    }
  };

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
            historyData={dummyHistoryData}
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
                <Ionicons name="chevron-down" size={20} color="#333" />
                <Text style={styles.expandButtonText}>カレンダーを表示</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </Animated.View>

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
            <Ionicons name="document-text-outline" size={60} color="#bdc3c7" />
            <Text style={styles.placeholderText}>履歴がありません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    // フローティングボタンが削除されたので余白を減らす
    paddingBottom: 30,
  },
  sectionHeader: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 8,
    borderRadius: 4,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#34495e",
  },
  historyItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  historyCategory: {
    fontWeight: "normal",
    color: "#7f8c8d",
  },
  historyAction: {
    fontSize: 14,
    color: "#34495e",
  },
  calendarContainer: {
    zIndex: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden', // 内容がはみ出ないようにする
  },
  expandButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 5,
  },
  expandButtonTouchable: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expandButtonText: {
    fontSize: 12,
    marginLeft: 5,
    color: '#333',
    fontWeight: '500',
  },
  minimizedHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: "#34495e",
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
});