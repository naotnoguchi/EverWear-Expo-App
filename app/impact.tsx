import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { statisticsService, ImpactData, Period } from "../services/statisticsServiceFactory";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";

export default function ImpactScreen() {
  const theme = useTheme();

  // State
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('3months');

  // Fetch impact data
  const fetchImpact = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getImpactData(period);
      setImpact(data);
    } catch (err) {
      console.error('Error fetching impact data:', err);
      setError('環境影響データの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load data on mount and when period changes
  useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  // Handle period change
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // Period options
  const periodOptions: { label: string; value: Period }[] = [
    { label: '1ヶ月', value: '1month' },
    { label: '3ヶ月', value: '3months' },
    { label: '6ヶ月', value: '6months' },
    { label: '1年', value: '1year' },
    { label: 'すべて', value: 'all' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background, // 固定の白色から変更
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterSection: {
      marginBottom: 16,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
    filterOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterOptionText: {
      fontSize: 12,
    },
    filterOptionTextSelected: {
      color: "white",
      fontWeight: 'bold',
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
    highlightContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    highlightItem: {
      flex: 1,
      alignItems: 'center',
    },
    highlightValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: "#27ae60",
      marginBottom: 4,
    },
    highlightLabel: {
      fontSize: 12,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    impactDescription: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    resourceItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    resourceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    resourceInfo: {
      flex: 1,
    },
    resourceTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    resourceValue: {
      fontSize: 14,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
    },
    totalSavings: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    totalSavingsLabel: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    totalSavingsValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: "#27ae60",
    },
    lifespanDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    lifespanEffect: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      padding: 12,
      borderRadius: 8,
    },
    lifespanIconContainer: {
      marginRight: 12,
    },
    lifespanValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    chartContainer: {
      height: 200,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      marginTop: 40,
      marginBottom: 16,
    },
    chartBarContainer: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    chartBarLabels: {
      alignItems: 'center',
      marginBottom: 4,
    },
    chartValue: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    chartCo2Value: {
      fontSize: 10,
    },
    chartBar: {
      width: 20,
      borderRadius: 10,
      marginBottom: 8,
    },
    chartLabel: {
      fontSize: 12,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
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
    environmentalImpact: {
      marginBottom: 16,
    },
    treeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 12,
    },
    treeIcon: {
      marginHorizontal: 4,
    },
    environmentalText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    shareButton: {
      backgroundColor: "#27ae60",
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
    },
    shareButtonText: {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 8,
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
  });

  // Render loading state
  if (loading && !impact) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.text }}>環境影響データを読み込み中...</Text>
      </View>
    );
  }

  // Render error state
  if (error && !impact) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchImpact}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "環境影響・節約効果",
          headerBackTitle: "戻る",
        }} 
      />
      <ScrollView style={styles.container}>
        {/* Period selector */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>期間</Text>
          <View style={styles.optionsRow}>
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  period === option.value && styles.filterOptionSelected,
                  { borderColor: theme.border }
                ]}
                onPress={() => handlePeriodChange(option.value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    { color: theme.text },
                    period === option.value && styles.filterOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main impact card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#27ae60" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              洗濯削減効果
            </Text>
          </View>

          <View style={styles.highlightContainer}>
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{impact?.totalWashesReduced || 0}</Text>
              <Text style={[styles.highlightLabel, { color: theme.text }]}>洗濯回数削減</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{impact?.co2Reduced || 0} kg</Text>
              <Text style={[styles.highlightLabel, { color: theme.text }]}>CO2削減量</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{impact?.treeEquivalent || 0}</Text>
              <Text style={[styles.highlightLabel, { color: theme.text }]}>植樹相当効果</Text>
            </View>
          </View>

          <Text style={[styles.impactDescription, { color: theme.text + "CC" }]}>
            「着用するたびに洗濯する」場合と比較して、あなたは{impact?.totalWashesReduced || 0}回の洗濯を削減しました。
            これは約{impact?.treeEquivalent || 0}本の木を植えるのと同等のCO2削減効果があります。
          </Text>
        </View>

        {/* Resource savings card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="water" size={24} color="#3498db" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              資源節約効果
            </Text>
          </View>

          <View style={styles.resourceItem}>
            <View style={styles.resourceIconContainer}>
              <Ionicons name="flash" size={24} color="#f1c40f" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>電気</Text>
              <Text style={[styles.resourceValue, { color: theme.text }]}>
                {impact?.electricitySaved.amount || 0} kWh（{impact?.electricitySaved.cost || 0}円相当）
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(((impact?.electricitySaved.amount || 0) / 10) * 100, 100)}%`, 
                      backgroundColor: "#f1c40f" 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.resourceItem}>
            <View style={styles.resourceIconContainer}>
              <Ionicons name="water" size={24} color="#3498db" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>水</Text>
              <Text style={[styles.resourceValue, { color: theme.text }]}>
                {impact?.waterSaved.amount || 0} L（{impact?.waterSaved.cost || 0}円相当）
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(((impact?.waterSaved.amount || 0) / 1000) * 100, 100)}%`, 
                      backgroundColor: "#3498db" 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.resourceItem}>
            <View style={styles.resourceIconContainer}>
              <Ionicons name="flask" size={24} color="#9b59b6" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>洗剤</Text>
              <Text style={[styles.resourceValue, { color: theme.text }]}>
                {impact?.detergentSaved.amount || 0} ml（{impact?.detergentSaved.cost || 0}円相当）
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(((impact?.detergentSaved.amount || 0) / 500) * 100, 100)}%`, 
                      backgroundColor: "#9b59b6" 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.totalSavings}>
            <Text style={[styles.totalSavingsLabel, { color: theme.text }]}>
              総節約金額
            </Text>
            <Text style={styles.totalSavingsValue}>
              {((impact?.electricitySaved.cost || 0) + 
                (impact?.waterSaved.cost || 0) + 
                (impact?.detergentSaved.cost || 0)).toLocaleString()}円
            </Text>
          </View>
        </View>

        {/* Clothing lifespan card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shirt" size={24} color="#e74c3c" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              洋服寿命延長効果
            </Text>
          </View>

          <Text style={[styles.lifespanDescription, { color: theme.text }]}>
            洗濯回数を{impact?.totalWashesReduced || 0}回削減したことで、あなたの洋服の寿命が延びています。
            洗濯による繊維へのダメージが軽減され、お気に入りの服をより長く着ることができます。
          </Text>

          <View style={styles.lifespanEffect}>
            <View style={styles.lifespanIconContainer}>
              <Ionicons name="time" size={32} color="#e74c3c" />
            </View>
            <Text style={[styles.lifespanValue, { color: theme.text }]}>
              洋服の寿命 約{Math.round((impact?.totalWashesReduced || 0) * 0.05) + 1}倍に延長
            </Text>
          </View>
        </View>

        {/* Monthly impact chart */}
        {impact && impact.monthlyImpact.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart" size={24} color="#3498db" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                月別削減効果
              </Text>
            </View>

            <View style={styles.chartContainer}>
              {impact.monthlyImpact.map((item, index) => {
                // Calculate bar height based on maximum value
                const maxCount = Math.max(
                  ...impact.monthlyImpact.map((i) => i.washesReduced),
                  1 // Avoid division by zero
                );
                const heightPercentage = (item.washesReduced / maxCount) * 100;

                return (
                  <View key={item.month} style={styles.chartBarContainer}>
                    <View style={styles.chartBarLabels}>
                      <Text style={[styles.chartValue, { color: theme.text }]}>
                        {item.washesReduced}
                      </Text>
                      <Text style={[styles.chartCo2Value, { color: "#27ae60" }]}>
                        {item.co2Reduced}kg
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${heightPercentage}%`,
                          backgroundColor: "#3498db",
                        },
                      ]}
                    />
                    <Text style={[styles.chartLabel, { color: theme.text }]}>
                      {item.month}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#3498db" }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>洗濯回数削減</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#27ae60" }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>CO2削減量(kg)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Environmental impact card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe" size={24} color="#27ae60" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              環境貢献度
            </Text>
          </View>

          <View style={styles.environmentalImpact}>
            <View style={styles.treeContainer}>
              {Array.from({ length: Math.min(Math.ceil(impact?.treeEquivalent || 0), 5) }).map((_, index) => (
                <Ionicons 
                  key={index} 
                  name="leaf" 
                  size={32} 
                  color="#27ae60" 
                  style={styles.treeIcon} 
                />
              ))}
            </View>

            <Text style={[styles.environmentalText, { color: theme.text }]}>
              あなたの洗濯習慣の改善により、{impact?.co2Reduced || 0}kgのCO2排出を削減しました。
              これは約{impact?.treeEquivalent || 0}本の木が1年間に吸収するCO2量に相当します。
            </Text>
          </View>

          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social" size={16} color="white" />
            <Text style={styles.shareButtonText}>環境貢献度をシェアする</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}