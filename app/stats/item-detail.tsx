import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { statisticsService, ItemDetailStats } from "../../services/statisticsServiceFactory";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // State
  const [itemStats, setItemStats] = useState<ItemDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch item detail data
  const fetchItemDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getItemDetailStats(id);
      setItemStats(data);
    } catch (err) {
      console.error('Error fetching item detail data:', err);
      setError('アイテム詳細データの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Load data on mount
  useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);
  
  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, color: theme.text }}>アイテム詳細データを読み込み中...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error || !itemStats) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error || 'アイテムが見つかりませんでした。'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetail}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Calculate efficiency status
  const getEfficiencyStatus = () => {
    if (itemStats.efficiency >= 1) return { text: '良好', color: '#27ae60' };
    if (itemStats.efficiency >= 0.7) return { text: '注意', color: '#f39c12' };
    return { text: '要改善', color: '#e74c3c' };
  };
  
  const efficiencyStatus = getEfficiencyStatus();
  
  // Find day with most wears
  const getMostWornDay = () => {
    const days = Object.entries(itemStats.wearsByDay);
    if (days.length === 0) return null;
    
    return days.reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    });
  };
  
  const mostWornDay = getMostWornDay();
  
  // Find month with most wears
  const getMostWornMonth = () => {
    const months = Object.entries(itemStats.wearsByMonth);
    if (months.length === 0) return null;
    
    return months.reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    });
  };
  
  const mostWornMonth = getMostWornMonth();
  
  return (
    <ScrollView style={styles.container}>
      {/* Item basic info */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.itemName, { color: theme.text }]}>
          {itemStats.name}
        </Text>
        <Text style={[styles.itemCategory, { color: theme.text + 'CC' }]}>
          {itemStats.category}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {itemStats.wearCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + '99' }]}>
              着用回数
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {itemStats.washCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + '99' }]}>
              洗濯回数
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: efficiencyStatus.color }]}>
              {itemStats.washCount > 0 
                ? (itemStats.wearCount / itemStats.washCount).toFixed(1) 
                : itemStats.wearCount.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text + '99' }]}>
              平均着用/洗濯
            </Text>
          </View>
        </View>
      </View>
      
      {/* Efficiency analysis */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer" size={24} color="#3498db" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            洗濯効率分析
          </Text>
        </View>
        
        <View style={styles.efficiencyContainer}>
          <View style={styles.efficiencyLabelContainer}>
            <Text style={[styles.efficiencyLabel, { color: theme.text }]}>
              効率
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: efficiencyStatus.color }]}>
              <Text style={styles.statusText}>
                {efficiencyStatus.text}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${Math.min(itemStats.efficiency * 100, 100)}%`, backgroundColor: efficiencyStatus.color }
              ]} 
            />
          </View>
          
          <Text style={[styles.efficiencyText, { color: theme.text + 'CC' }]}>
            {itemStats.efficiency >= 1 
              ? '最適な洗濯頻度で使用されています' 
              : itemStats.efficiency >= 0.7 
                ? 'もう少し着用回数を増やせる可能性があります' 
                : '洗濯頻度が高すぎる可能性があります'}
          </Text>
        </View>
        
        <View style={styles.optimizationContainer}>
          <Text style={[styles.optimizationTitle, { color: theme.text }]}>
            最適化提案
          </Text>
          <Text style={[styles.optimizationText, { color: theme.text + 'CC' }]}>
            このアイテムの使用パターンに基づくと、理想的な洗濯閾値は
            <Text style={{ fontWeight: 'bold', color: theme.text }}> {itemStats.optimizedThreshold} </Text>
            回です。現在の設定値を調整することで、洋服の寿命を延ばし、資源を節約できます。
          </Text>
          
          <TouchableOpacity style={styles.optimizeButton}>
            <Text style={styles.optimizeButtonText}>閾値を最適化する</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Usage pattern analysis */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={24} color="#3498db" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            使用パターン分析
          </Text>
        </View>
        
        <View style={styles.patternContainer}>
          <View style={styles.patternItem}>
            <Ionicons name="today" size={20} color="#3498db" />
            <Text style={[styles.patternText, { color: theme.text }]}>
              最も着用する曜日: 
              <Text style={{ fontWeight: 'bold' }}> {mostWornDay ? mostWornDay[0] : '該当なし'} </Text>
              ({mostWornDay ? mostWornDay[1] : 0}回)
            </Text>
          </View>
          
          <View style={styles.patternItem}>
            <Ionicons name="calendar" size={20} color="#3498db" />
            <Text style={[styles.patternText, { color: theme.text }]}>
              最も着用する月: 
              <Text style={{ fontWeight: 'bold' }}> {mostWornMonth ? mostWornMonth[0] : '該当なし'} </Text>
              ({mostWornMonth ? mostWornMonth[1] : 0}回)
            </Text>
          </View>
        </View>
        
        {/* Day of week chart */}
        <Text style={[styles.chartTitle, { color: theme.text }]}>曜日別着用回数</Text>
        <View style={styles.dayChartContainer}>
          {Object.entries(itemStats.wearsByDay).map(([day, count]) => {
            const maxCount = Math.max(...Object.values(itemStats.wearsByDay), 1);
            const heightPercentage = (count / maxCount) * 100;
            
            return (
              <View key={day} style={styles.dayBarContainer}>
                <Text style={[styles.chartValue, { color: theme.text }]}>
                  {count}
                </Text>
                <View
                  style={[
                    styles.dayBar,
                    {
                      height: `${heightPercentage}%`,
                      backgroundColor: day === (mostWornDay ? mostWornDay[0] : '') ? "#3498db" : theme.text + "33",
                    },
                  ]}
                />
                <Text style={[styles.chartLabel, { color: theme.text }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Trend analysis */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up" size={24} color="#3498db" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            トレンド分析
          </Text>
        </View>
        
        <Text style={[styles.chartTitle, { color: theme.text }]}>月別着用・洗濯回数</Text>
        <View style={styles.trendChartContainer}>
          {itemStats.wearTrend.map((item, index) => {
            const wearCount = item.count;
            const washCount = itemStats.washTrend[index]?.count || 0;
            
            const maxWearCount = Math.max(...itemStats.wearTrend.map(i => i.count), 1);
            const wearHeightPercentage = (wearCount / maxWearCount) * 100;
            const washHeightPercentage = (washCount / maxWearCount) * 100;
            
            return (
              <View key={item.period} style={styles.trendBarContainer}>
                <View style={styles.trendBarLabels}>
                  <Text style={[styles.chartValue, { color: theme.text }]}>
                    {wearCount}
                  </Text>
                  <Text style={[styles.chartWashValue, { color: "#e74c3c" }]}>
                    {washCount}
                  </Text>
                </View>
                <View style={styles.trendBarsGroup}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: `${wearHeightPercentage}%`,
                        backgroundColor: "#3498db",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: `${washHeightPercentage}%`,
                        backgroundColor: "#e74c3c",
                        marginLeft: 4,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: theme.text }]}>
                  {item.period}
                </Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#3498db" }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>着用回数</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#e74c3c" }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>洗濯回数</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  efficiencyContainer: {
    marginBottom: 16,
  },
  efficiencyLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  efficiencyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
  },
  efficiencyText: {
    fontSize: 14,
  },
  optimizationContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 16,
    borderRadius: 8,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optimizationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  optimizeButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  optimizeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  patternContainer: {
    marginBottom: 16,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternText: {
    fontSize: 14,
    marginLeft: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dayChartContainer: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  dayBarContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dayBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 12,
  },
  trendChartContainer: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  trendBarContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendBarLabels: {
    alignItems: 'center',
    marginBottom: 4,
  },
  chartWashValue: {
    fontSize: 10,
  },
  trendBarsGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  trendBar: {
    width: 10,
    borderRadius: 5,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});