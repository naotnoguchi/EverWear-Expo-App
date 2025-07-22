import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';

interface ItemCalendarProps {
  wearHistory: string[];
  washHistory: string[];
  onDeleteWearHistory?: (date: string) => void;
  onDeleteWashHistory?: (date: string) => void;
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

export default function ItemCalendar({ wearHistory, washHistory, onDeleteWearHistory, onDeleteWashHistory }: ItemCalendarProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{ day: number; date: string } | null>>([]);

  // 日付フォーマット関数をロケール対応に
  const formatDateLocalized = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US');
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

  // カレンダーを今日の日付にリセットする関数
  const resetCalendarToToday = () => {
    setCurrentDate(new Date());
  };

  // 月の名前
  const getMonthNames = () => [
    t('itemCalendar.months.january'),
    t('itemCalendar.months.february'),
    t('itemCalendar.months.march'),
    t('itemCalendar.months.april'),
    t('itemCalendar.months.may'),
    t('itemCalendar.months.june'),
    t('itemCalendar.months.july'),
    t('itemCalendar.months.august'),
    t('itemCalendar.months.september'),
    t('itemCalendar.months.october'),
    t('itemCalendar.months.november'),
    t('itemCalendar.months.december')
  ];

  // 曜日の名前
  const getDayNames = () => [
    t('itemCalendar.days.sunday'),
    t('itemCalendar.days.monday'),
    t('itemCalendar.days.tuesday'),
    t('itemCalendar.days.wednesday'),
    t('itemCalendar.days.thursday'),
    t('itemCalendar.days.friday'),
    t('itemCalendar.days.saturday')
  ];

  // 前の月に移動
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // 次の月に移動（当月を超えないように制限）
  const goToNextMonth = () => {
    // 既に当月を表示している場合は何もしない
    if (isCurrentMonthToday) {
      return;
    }

    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);

    // 移動先が当月を超えないことを確認
    if (newDate.getFullYear() > todayYear || 
        (newDate.getFullYear() === todayYear && newDate.getMonth() > todayMonth)) {
      // 当月までしか進めない場合は当月に設定
      newDate.setFullYear(todayYear);
      newDate.setMonth(todayMonth);
    }

    setCurrentDate(newDate);
  };

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

  // 日付タップ時のハンドラー
  const handleDayPress = (dayObj: { day: number; date: string }) => {
    const isWorn = wearHistory.includes(dayObj.date);
    const isWashed = washHistory.includes(dayObj.date);

    if (!isWorn && !isWashed) return; // 履歴がない日付は何もしない

    // 履歴削除のオプションを表示
    const localizedDate = formatDateLocalized(dayObj.date);
    Alert.alert(
      t('itemCalendar.alerts.deleteTitle'),
      t('itemCalendar.alerts.deleteMessage', { date: localizedDate }),
      [
        { text: t('common.cancel'), style: "cancel" },
        ...(isWorn ? [{
          text: t('itemCalendar.alerts.deleteWearHistory'),
          style: "destructive" as const,
          onPress: () => onDeleteWearHistory && onDeleteWearHistory(dayObj.date)
        }] : []),
        ...(isWashed ? [{
          text: t('itemCalendar.alerts.deleteWashHistory'),
          style: "destructive" as const,
          onPress: () => onDeleteWashHistory && onDeleteWashHistory(dayObj.date)
        }] : [])
      ]
    );
  };

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

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      paddingBottom: 8, // 下部のパディングを減らす
      marginBottom: 16,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
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
      marginBottom: 16,
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
      // ボタンの幅と高さを保持して、レイアウトが崩れないようにする
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    daysHeader: {
      flexDirection: 'row',
      marginBottom: 8,
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
      maxHeight: undefined, // 固定高さ制限を削除
      marginBottom: 2, // マージンを追加
    },
    emptyDay: {
      flexBasis: `${100 / 7}%`,
      maxWidth: `${100 / 7}%`,
      marginBottom: 4,
    },
    dayCell: {
      flexBasis: `${100 / 7}%`,
      maxWidth: `${100 / 7}%`,
      paddingVertical: 4,
      paddingHorizontal: 0,
      marginBottom: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    futureDay: {
      opacity: 0.3, // 未来の日付は薄く表示
    },
    todayDay: {
      backgroundColor: theme.card === '#ffffff' ? '#fff8e1' : '#3a3000', // Adjust for dark mode
      borderWidth: 1.5,
      borderColor: '#ffc107', // Keep yellow border for today
      borderRadius: 20,
    },
    dayNumber: {
      fontSize: 14,
      marginBottom: 2, // 4pxから2pxに縮小
      color: theme.text,
    },
    futureDayText: {
      color: theme.text + "55", // 未来の日付のテキストを薄く
    },
    todayDayText: {
      fontWeight: 'bold',
      color: '#ff8f00', // Keep orange for today
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
    },
    washIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2ecc71', // Keep green for wash indicator
      marginHorizontal: 2,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'flex-end', // 右寄せに変更
      marginTop: 4, // 4pxのままキープ
      paddingRight: 8, // 右側に余白を追加
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 4, // さらに縮小
      marginLeft: 8, // 左側の間隔を広げる
    },
    legendText: {
      marginLeft: 3, // 4pxから3pxに縮小
      fontSize: 11, // 12pxから11pxに縮小
      color: theme.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('itemCalendar.title')}</Text>
      </View>

      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.monthText}>
            {i18n.language === 'ja' ? `${currentYear}年 ${getMonthNames()[currentMonth]}` : `${getMonthNames()[currentMonth]} ${currentYear}`}
          </Text>
          {!isCurrentMonthToday && (
            <TouchableOpacity
              style={styles.todayButton}
              onPress={resetCalendarToToday}
            >
              <Ionicons name="refresh-outline" size={16} color="#3498db" />
              <Text style={styles.todayButtonText}>{t('itemCalendar.returnToThisMonth')}</Text>
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
        <View>
          <View style={styles.daysHeader}>
            {getDayNames().map((day, index) => (
              <Text key={index} style={[
                styles.dayName,
                index === 0 ? styles.sundayText : null,
                index === 6 ? styles.saturdayText : null
              ]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((dayObj, index) => {
              if (!dayObj) {
                return <View key={`empty-${index}`} style={styles.emptyDay} />;
              }

              const isWorn = wearHistory.includes(dayObj.date);
              const isWashed = washHistory.includes(dayObj.date);

              // 当月のカレンダーで、今日より後の日付かどうかをチェック
              const isDateInFuture = isCurrentMonthToday && dayObj.day > today.getDate();

              // 本日の日付かどうかをチェック
              const isToday = isCurrentMonthToday && dayObj.day === today.getDate();

              return (
                <TouchableOpacity
                  key={dayObj.day}
                  style={[
                    styles.dayCell,
                    isDateInFuture ? styles.futureDay : null,
                    isToday ? styles.todayDay : null
                  ]}
                  onPress={() => !isDateInFuture && handleDayPress(dayObj)}
                  disabled={isDateInFuture || (!isWorn && !isWashed)}
                  activeOpacity={isWorn || isWashed ? 0.7 : 1}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isDateInFuture ? styles.futureDayText : null,
                      isToday ? styles.todayDayText : null
                    ]}
                  >
                    {dayObj.day}
                  </Text>
                  {!isDateInFuture && (
                    <View style={styles.eventIndicators}>
                      {isWorn && <View style={styles.wearIndicator} />}
                      {isWashed && <View style={styles.washIndicator} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </GestureDetector>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.wearIndicator} />
          <Text style={styles.legendText}>{t('itemCalendar.legend.wear')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.washIndicator} />
          <Text style={styles.legendText}>{t('itemCalendar.legend.wash')}</Text>
        </View>
      </View>
    </View>
  );
}
