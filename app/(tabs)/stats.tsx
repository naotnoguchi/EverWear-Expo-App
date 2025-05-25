import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Dummy data for statistics
const dummyStats = {
  totalItems: 12,
  totalWears: 87,
  totalWashes: 24,
  averageWearsBetweenWashes: 3.6,
  mostWornCategory: "トップス",
  mostWornItem: {
    name: "お気に入りの白シャツ",
    wears: 15,
  },
  leastWornItem: {
    name: "グレーのセーター",
    wears: 2,
  },
  categoryBreakdown: [
    { category: "トップス", count: 5, percentage: 42 },
    { category: "ボトムス", count: 3, percentage: 25 },
    { category: "アウター", count: 2, percentage: 17 },
    { category: "シューズ", count: 1, percentage: 8 },
    { category: "その他", count: 1, percentage: 8 },
  ],
  monthlyWears: [
    { month: "7月", count: 18 },
    { month: "8月", count: 22 },
    { month: "9月", count: 25 },
    { month: "10月", count: 22 },
  ],
};

export default function Stats() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>統計情報</Text>
        <Text style={styles.headerSubtitle}>
          過去3ヶ月間のデータに基づく分析
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="shirt" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{dummyStats.totalItems}</Text>
          <Text style={styles.statLabel}>アイテム数</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="repeat" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{dummyStats.totalWears}</Text>
          <Text style={styles.statLabel}>総着用回数</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="water" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{dummyStats.totalWashes}</Text>
          <Text style={styles.statLabel}>総洗濯回数</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="analytics" size={24} color="#3498db" />
          </View>
          <Text style={styles.statValue}>{dummyStats.averageWearsBetweenWashes}</Text>
          <Text style={styles.statLabel}>平均着用回数/洗濯</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最もよく着用するアイテム</Text>
        <View style={styles.highlightCard}>
          <View style={styles.highlightIconContainer}>
            <Ionicons name="star" size={28} color="#f1c40f" />
          </View>
          <View style={styles.highlightContent}>
            <Text style={styles.highlightTitle}>{dummyStats.mostWornItem.name}</Text>
            <Text style={styles.highlightSubtitle}>
              {dummyStats.mostWornItem.wears}回着用
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: "100%", backgroundColor: "#f1c40f" },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>カテゴリ別アイテム数</Text>
        <View style={styles.categoryBreakdownContainer}>
          {dummyStats.categoryBreakdown.map((category) => (
            <View key={category.category} style={styles.categoryItem}>
              <View style={styles.categoryLabelContainer}>
                <Text style={styles.categoryLabel}>{category.category}</Text>
                <Text style={styles.categoryCount}>{category.count}点</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${category.percentage}%`, backgroundColor: "#3498db" },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>月別着用回数</Text>
        <View style={styles.chartContainer}>
          {dummyStats.monthlyWears.map((item, index) => {
            // Calculate bar height based on maximum value
            const maxCount = Math.max(
              ...dummyStats.monthlyWears.map((i) => i.count)
            );
            const heightPercentage = (item.count / maxCount) * 100;

            return (
              <View key={item.month} style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${heightPercentage}%`,
                      backgroundColor:
                        index === dummyStats.monthlyWears.length - 1
                          ? "#3498db"
                          : "#bdc3c7",
                    },
                  ]}
                />
                <Text style={styles.chartLabel}>{item.month}</Text>
                <Text style={styles.chartValue}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>洗濯効率</Text>
        <View style={styles.efficiencyContainer}>
          <Text style={styles.efficiencyText}>
            あなたの洗濯効率は<Text style={styles.efficiencyHighlight}>良好</Text>
            です。平均して{dummyStats.averageWearsBetweenWashes}回着用ごとに洗濯しています。
          </Text>
          <Text style={styles.efficiencyTip}>
            <Ionicons name="bulb" size={16} color="#f39c12" /> ヒント:
            デニムは5-10回着用ごとに洗濯するのが理想的です。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#3498db",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    marginTop: -30,
  },
  statCard: {
    width: "46%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    margin: "2%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2c3e50",
  },
  highlightCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(241, 196, 15, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  highlightSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#ecf0f1",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  categoryBreakdownContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#2c3e50",
  },
  categoryCount: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  chartContainer: {
    height: 200,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBarContainer: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  chartValue: {
    fontSize: 10,
    color: "#7f8c8d",
    marginTop: 2,
  },
  efficiencyContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  efficiencyText: {
    fontSize: 16,
    color: "#2c3e50",
    lineHeight: 24,
  },
  efficiencyHighlight: {
    color: "#27ae60",
    fontWeight: "bold",
  },
  efficiencyTip: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 12,
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
});