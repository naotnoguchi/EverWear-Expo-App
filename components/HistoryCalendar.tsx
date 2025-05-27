import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';

interface HistoryItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  eventType: "wear" | "wash";
  date: string;
}

interface HistoryCalendarProps {
  historyData: HistoryItem[];
  onDateSelect: (date: string | null) => void;
  selectedDate: string | null;
  onResetToToday?: () => void;
  customStyle?: {
    container?: object;
    legend?: object;
    calendarGrid?: object;
  };
}

// 月の日数を取得する関数
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// 月の最初の日の曜日を取得する関数（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// 日付をYYYY-MM-DD形式に変換する関数
const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function HistoryCalendar({
  historyData,
  onDateSelect,
  selectedDate,
  onResetToToday,
  customStyle = {}
}: HistoryCalendarProps) {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{ day: number; date: string } | null>>([]);

  // カレンダーを今日の日付にリセットする関数
  const resetCalendarToToday = () => {
    setCurrentDate(new Date());
  };

  // 現在の年と月
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 実際の現在日付（システム日付）
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  // 現在表示中の月が今月かどうかをチェック
  const isCurrentMonthToday = currentYear === todayYear && currentMonth === todayMonth;

  // 月の名前
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // 曜日の名前
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 前の月に移動
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  // 次の月に移動（当月を超えないように制限）
  const goToNextMonth = useCallback(() => {
    // 既に当月を表示している場合は何もしない
    if (isCurrentMonthToday) {
      return;
    }

    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);

      // 移動先が当月を超えないことを確認
      if (newDate.getFullYear() > todayYear ||
          (newDate.getFullYear() === todayYear && newDate.getMonth() > todayMonth)) {
        // 当月までしか進めない場合は当月に設定
        newDate.setFullYear(todayYear);
        newDate.setMonth(todayMonth);
      }

      return newDate;
    });
  }, [isCurrentMonthToday, todayYear, todayMonth]);

  // 横スワイプのジェスチャーを設定
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])  // 横方向に20px以上動いたらジェスチャー開始
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 50) {
        if (e.translationX > 0) {
          // 右にスワイプ -> 前の月へ
          goToPreviousMonth();
        } else if (!isCurrentMonthToday) {
          // 左にスワイプ -> 次の月へ (今月でない場合のみ)
          goToNextMonth();
        }
      }
    });

  // カレンダーの日付を生成
  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

    const days: Array<{ day: number; date: string } | null> = [];

    // 月の最初の日の前に空白を追加
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // 月の日を追加
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: formatDate(currentYear, currentMonth, i)
      });
    }

    setCalendarDays(days);
  }, [currentDate]);

  // 日付ごとのイベントを集計
  const eventsByDate = historyData.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = { wear: 0, wash: 0 };
    }

    if (item.eventType === 'wear') {
      acc[item.date].wear += 1;
    } else if (item.eventType === 'wash') {
      acc[item.date].wash += 1;
    }

    return acc;
  }, {} as Record<string, { wear: number; wash: number }>);

  // 日付をタップしたときの処理
  const handleDatePress = (date: string) => {
    // 既に選択されている日付をタップした場合は選択を解除
    if (selectedDate === date) {
      onDateSelect(null);
    } else {
      onDateSelect(date);
    }
  };

  // カレンダー内容部分
  const renderCalendarContent = () => {
    return (
      <View>
        <View style={styles.daysHeader}>
          {dayNames.map((day, index) => (
            <Text key={index} style={[
              styles.dayName,
              index === 0 ? styles.sundayText : null,
              index === 6 ? styles.saturdayText : null
            ]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={[styles.calendarGrid, customStyle.calendarGrid]}>
          {calendarDays.map((dayObj, index) => {
            if (!dayObj) {
              return <View key={`empty-${index}`} style={styles.emptyDay} />;
            }

            const events = eventsByDate[dayObj.date] || { wear: 0, wash: 0 };
            const hasEvents = events.wear > 0 || events.wash > 0;

            // 当月のカレンダーで、今日より後の日付かどうかをチェック
            const isDateInFuture = isCurrentMonthToday && dayObj.day > today.getDate();
            const isSelected = selectedDate === dayObj.date;
            // 本日の日付かどうかをチェック
            const isToday = isCurrentMonthToday && dayObj.day === today.getDate();

            return (
              <TouchableOpacity
                key={dayObj.day}
                style={[
                  styles.dayCell,
                  isDateInFuture ? styles.futureDay : null,
                  hasEvents ? styles.hasEventsDay : null,
                  isSelected ? styles.selectedDay : null,
                  isToday ? styles.todayDay : null // 本日の日付用スタイル
                ]}
                onPress={() => !isDateInFuture && handleDatePress(dayObj.date)}
                disabled={isDateInFuture}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isDateInFuture ? styles.futureDayText : null,
                    isSelected ? styles.selectedDayText : null,
                    isToday ? styles.todayDayText : null // 本日の日付用テキストスタイル
                  ]}
                >
                  {dayObj.day}
                </Text>
                {!isDateInFuture && hasEvents && (
                  <View style={styles.eventIndicators}>
                    {events.wear > 0 && (
                      <View style={styles.wearIndicator}>
                        {events.wear > 1 && (
                          <Text style={styles.eventCount}>{events.wear}</Text>
                        )}
                      </View>
                    )}
                    {events.wash > 0 && (
                      <View style={styles.washIndicator}>
                        {events.wash > 1 && (
                          <Text style={styles.eventCount}>{events.wash}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      padding: 16,
      minHeight: 330, // 最小高さを少し減らす
    },
    header: {
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16, // 16pxから12pxに縮小
    },
    monthText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    todayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    todayButtonText: {
      color: '#3498db',
      fontSize: 12,
      marginLeft: 2,
    },
    disabledButton: {
      opacity: 0.5,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    daysHeader: {
      flexDirection: 'row',
      marginBottom: 6, // 8pxから6pxに縮小
    },
    dayName: {
      flex: 1,
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.text,
    },
    sundayText: {
      color: '#e74c3c', // Keep red for Sunday
    },
    saturdayText: {
      color: '#3498db', // Keep blue for Saturday
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      maxHeight: 220,
    },
    emptyDay: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      padding: 2, // 4pxから2pxに縮小
      justifyContent: 'center',
      alignItems: 'center',
    },
    hasEventsDay: {
      backgroundColor: theme.card === '#ffffff' ? '#f8f9fa' : '#2a2a2a',
    },
    selectedDay: {
      backgroundColor: theme.card === '#ffffff' ? '#e3f2fd' : '#1a3f5f',
      borderRadius: 20,
    },
    todayDay: {
      backgroundColor: theme.card === '#ffffff' ? '#fff8e1' : '#3a3000', // Adjust for dark mode
      borderWidth: 1.5,
      borderColor: '#ffc107', // Keep yellow border for today
      borderRadius: 20,
    },
    futureDay: {
      opacity: 0.3,
    },
    dayNumber: {
      fontSize: 14,
      marginBottom: 2, // 4pxから2pxに縮小
      color: theme.text,
    },
    selectedDayText: {
      fontWeight: 'bold',
      color: theme.card === '#ffffff' ? '#1976d2' : '#64b5f6', // Lighter blue for dark mode
    },
    todayDayText: {
      fontWeight: 'bold',
      color: '#ff8f00', // Keep orange for today
    },
    futureDayText: {
      color: theme.text + '55', // with high transparency
    },
    eventIndicators: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    wearIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#3498db', // Keep blue for wear indicator
      marginHorizontal: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    washIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2ecc71', // Keep green for wash indicator
      marginHorizontal: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventCount: {
      fontSize: 6,
      color: 'white', // Keep white for contrast
      fontWeight: 'bold',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'flex-end', // 中央揃えから右寄せに変更
      paddingRight: 8, // 右側に少し余白を追加
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 4, // さらに縮小して密集させる
      marginLeft: 8, // 左側の間隔を広げる
    },
    legendText: {
      marginLeft: 3, // 4pxから3pxに縮小
      fontSize: 11, // 12pxから11pxに縮小
      color: theme.text,
    },
  });

  return (
    <View style={[styles.container, customStyle.container]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.monthText}>{currentYear}年 {monthNames[currentMonth]}</Text>
          {onResetToToday && selectedDate && (
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                resetCalendarToToday();
                onResetToToday();
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#3498db" />
              <Text style={styles.todayButtonText}>表示をリセット</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 当月を表示している場合は次の月ボタンを非表示または無効化 */}
        {isCurrentMonthToday ? (
          <View style={styles.disabledButton}>
            <Ionicons name="chevron-forward" size={24} color={theme.text + "44"} />
          </View>
        ) : (
          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      <GestureDetector gesture={panGesture}>
        {renderCalendarContent()}
      </GestureDetector>

      <View style={[styles.legend, customStyle.legend]}>
        <View style={styles.legendItem}>
          <View style={styles.wearIndicator} />
          <Text style={styles.legendText}>着用</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.washIndicator} />
          <Text style={styles.legendText}>洗濯</Text>
        </View>
      </View>
    </View>
  );
}

