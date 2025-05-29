import { Stack } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { Platform } from "react-native";

export default function StatsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: theme.background,
        },
        // Platform-specific back button
        headerBackTitle: Platform.OS === 'ios' ? "戻る" : undefined,
      }}
    >
      <Stack.Screen
        name="ranking"
        options={{
          title: "着用回数ランキング",
        }}
      />
      <Stack.Screen
        name="efficiency"
        options={{
          title: "洗濯効率分析",
        }}
      />
      <Stack.Screen
        name="impact"
        options={{
          title: "環境影響・節約効果",
        }}
      />
      <Stack.Screen
        name="badges"
        options={{
          title: "バッジ・アチーブメント",
        }}
      />
      <Stack.Screen
        name="item-detail"
        options={{
          title: "アイテム詳細分析",
        }}
      />
    </Stack>
  );
}
