import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { useClothing } from "../contexts/ClothingContext";
import { useTheme } from "../contexts/ThemeContext";
import * as badgeService from "../services/badgeService";
import { Badge } from "../services/statisticsServiceFactory";

export default function BadgesOverviewScreen() {
  const theme = useTheme();
  const { clothingItems } = useClothing();
  const viewShotRef = useRef<ViewShot>(null);

  // State
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEarnedDates, setShowEarnedDates] = useState(false);

  // Fetch badges data
  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await badgeService.getBadges(clothingItems);
      // Ensure data is an array before using array methods
      const badgesArray = Array.isArray(data) ? data : [];
      console.log('Badges Overview screen - getBadges result:', 
        `count=${badgesArray.length},`, 
        `earned=${badgesArray.filter(b => b.isEarned).length},`,
        `categories=${Object.keys(badgesArray.reduce((acc: Record<string, boolean>, b) => {
          acc[b.category] = true;
          return acc;
        }, {})).join(',')}`
      );
      setBadges(badgesArray);
    } catch (err) {
      console.error('Error fetching badges data:', err);
      setError('バッジデータの取得に失敗しました。後でもう一度お試しください。');
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, [clothingItems]);

  // Load data on mount
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Get badge icon based on category
  const getBadgeIcon = (category: Badge['category']) => {
    switch (category) {
      case 'usage': return 'checkmark-circle';
      case 'efficiency': return 'speedometer';
      case 'milestone': return 'trophy';
      case 'special': return 'star';
      default: return 'ribbon';
    }
  };

  // Get badge color based on category
  const getBadgeColor = (category: Badge['category']) => {
    switch (category) {
      case 'usage': return '#3498db'; // Blue
      case 'efficiency': return '#27ae60'; // Green
      case 'milestone': return '#f39c12'; // Orange
      case 'special': return '#9b59b6'; // Purple
      default: return '#95a5a6'; // Gray
    }
  };

  // Handle screenshot and share
  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;

    try {
      const uri = await viewShotRef.current.capture();

      // Ensure badges is an array before filtering
      const badgesArray = Array.isArray(badges) ? badges : [];
      await Share.share({
        url: uri,
        title: 'バッジコレクション',
        message: `私のバッジコレクション: ${badgesArray.filter(b => b.isEarned).length}/${badgesArray.length}個獲得しました！`
      });
    } catch (error) {
      console.error('Error sharing screenshot:', error);
    }
  };

  // Calculate badge statistics
  // Ensure badges is an array before calculating statistics
  const badgesArray = Array.isArray(badges) ? badges : [];
  const totalBadges = badgesArray.length;
  const earnedBadges = badgesArray.filter(badge => badge.isEarned).length;
  const earnedPercentage = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      textAlign: 'center',
      marginVertical: 16,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    screenshotContainer: {
      backgroundColor: theme.card, // Use theme background color for dark mode support
      padding: 16,
      margin: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      marginBottom: 16,
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text, // Use theme text color for dark mode support
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.text + 'CC', // Use theme text color with opacity for dark mode support
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    badgeItem: {
      width: '30%',
      aspectRatio: 0.8,
      marginBottom: 16,
      alignItems: 'center',
      position: 'relative',
    },
    badgeIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    badgeName: {
      fontSize: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    earnedDate: {
      fontSize: 10,
      color: theme.text + '99',
      marginTop: 4,
    },
    earnedIndicator: {
      position: 'absolute',
      top: -5,
      right: -5,
    },
    actionButtons: {
      padding: 16,
      marginBottom: 24,
    },
    actionButton: {
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    dateToggleButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.primary,
      marginBottom: 12,
    },
    actionButtonText: {
      color: 'white', // Keep white for contrast on colored buttons
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

  // Render loading state
  if (loading && badges.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>バッジデータを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && badges.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBadges}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "バッジコレクション",
          headerBackTitle: "戻る",
        }} 
      />
      <ScrollView style={styles.container}>
        {badges.length > 0 ? (
          <ViewShot 
            ref={viewShotRef} 
            options={{ format: "jpg", quality: 0.9 }}
            style={styles.screenshotContainer}
          >
            <View style={styles.header}>
              <Text style={styles.title}>バッジコレクション</Text>
              <Text style={styles.subtitle}>獲得済み: {earnedBadges}/{totalBadges} ({earnedPercentage}%)</Text>
            </View>

            <View style={styles.badgeGrid}>
              {badges.map(badge => (
                <View key={badge.id} style={styles.badgeItem}>
                  <View 
                    style={[
                      styles.badgeIcon, 
                      { backgroundColor: badge.isEarned 
                        ? getBadgeColor(badge.category) 
                        : theme.text + '20' } // Use theme text color with opacity for unearned badges
                    ]}
                  >
                    <Ionicons 
                      name={getBadgeIcon(badge.category)} 
                      size={24} 
                      color={badge.isEarned ? 'white' : theme.text + '66'} // Use theme text color with opacity for unearned badge icons
                    />
                  </View>
                  <Text 
                    style={[
                      styles.badgeName, 
                      { color: badge.isEarned ? theme.text : theme.text + '66' } // Use theme text color for earned, with opacity for unearned
                    ]}
                    numberOfLines={2}
                  >
                    {badge.name}
                  </Text>
                  {badge.isEarned && showEarnedDates && badge.earnedDate && (
                    <Text style={[styles.earnedDate, { color: theme.text + '99' }]}>
                      {new Date(badge.earnedDate).toLocaleDateString('ja-JP')}
                    </Text>
                  )}
                  {badge.isEarned && (
                    <View style={styles.earnedIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ViewShot>
        ) : (
          <View style={[styles.screenshotContainer, styles.centerContent]}>
            <Ionicons name="ribbon-outline" size={64} color={theme.text + "66"} />
            <Text style={[styles.title, { marginTop: 16 }]}>バッジはまだありません</Text>
            <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 8, marginBottom: 16 }]}>
              アイテムを登録して着用・洗濯を記録すると、様々なバッジを獲得できます。最初のアイテムを登録して、バッジ収集を始めましょう！
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.dateToggleButton, 
              showEarnedDates ? { backgroundColor: theme.primary } : {}]} 
            onPress={() => setShowEarnedDates(!showEarnedDates)}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={showEarnedDates ? 'white' : theme.primary} 
            />
            <Text 
              style={[styles.actionButtonText, 
                { color: showEarnedDates ? 'white' : theme.primary }]}
            >
              {showEarnedDates ? '獲得日を非表示' : '獲得日を表示'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social" size={16} color="white" />
            <Text style={styles.actionButtonText}>バッジコレクションをシェアする</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
