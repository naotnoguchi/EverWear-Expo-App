import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useTabReset } from "../../contexts/TabResetContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function TabsLayout() {
  const theme = useTheme();
  const { lastTabName, setLastTabName, resetTab } = useTabReset();

  // Set initial tab name on component mount
  useEffect(() => {
    setLastTabName("home");
  }, []);

  // Handle tab press
  const handleTabPress = (tabName: string) => {
    // If the tab is already active, reset it
    if (lastTabName === tabName) {
      resetTab(tabName);
    }
    // Update the last active tab
    setLastTabName(tabName);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3498db",
        tabBarInactiveTintColor: "#95a5a6",
        headerShown: true,
        headerStyle: {
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.header,
        },
        headerTitleStyle: {
          color: theme.text,
        },
        tabBarStyle: {
          backgroundColor: theme.header,
          borderTopColor: theme.border,
        },
      }}
    >
        <Tabs.Screen
            name="home"
            options={{
                title: "ホーム",
                headerTitle: "クローゼット",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="home" size={size} color={color} />
                ),
            }}
            listeners={{
              tabPress: () => handleTabPress("home"),
            }}
        />
      <Tabs.Screen
        name="history"
        options={{
          title: "履歴",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress("history"),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "統計",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress("stats"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "設定",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => handleTabPress("settings"),
        }}
      />
    </Tabs>
  );
}
