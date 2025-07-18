import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabReset } from "../../contexts/TabResetContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { lastTabName, setLastTabName, resetTab } = useTabReset();
  const insets = useSafeAreaInsets();

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

  // Handle floating button press
  const handleBatchRecordPress = () => {
    router.push('/batch-record');
  };

  // カスタムタブバーコンポーネント
  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const styles = StyleSheet.create({
      tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.header,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom,
        paddingTop: 8,
        height: 50 + insets.bottom,
        alignItems: 'center',
        position: 'relative',
      },
      tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
      },
      tabIcon: {
        marginBottom: 2,
      },
      tabLabel: {
        fontSize: 12,
        color: "#95a5a6",
      },
      tabLabelActive: {
        color: "#3498db",
        fontWeight: '600',
      },
      // 中央の余白
      centerSpace: {
        width: 90, // フローティングボタンの幅に合わせて拡大
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
      },
      // フローティングボタン
      floatingButton: {
        position: 'absolute',
        top: -25, // より大きく突き出す
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: theme.header, // 他のボタンと同じ背景色
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.text, // ダークモードでも見える影色
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 2,
        borderColor: theme.border, // 境界線色を変更
      },
      floatingButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      floatingButtonIcon: {
        marginBottom: 2,
      },
      floatingButtonLabel: {
        fontSize: 12, // 他のタブと同じサイズ
        color: "#95a5a6",
        fontWeight: '600',
      },
    });

    const tabConfig: Array<{ name: string; icon: string; label: string } | 'center'> = [
      { name: 'home', icon: 'home', label: 'ホーム' },
      { name: 'history', icon: 'calendar', label: '履歴' },
      'center', // 中央の余白を示すマーカー
      { name: 'stats', icon: 'stats-chart', label: '統計' },
      { name: 'settings', icon: 'settings', label: '設定' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabConfig.map((tab, index) => {
          if (tab === 'center') {
            return (
              <View key="center" style={styles.centerSpace}>
                <TouchableOpacity
                  style={styles.floatingButton}
                  onPress={handleBatchRecordPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.floatingButtonContent}>
                    <Ionicons 
                      name="pencil" 
                      size={24} 
                      color="#95a5a6" 
                      style={styles.floatingButtonIcon}
                    />
                    <Text style={styles.floatingButtonLabel}>
                      一括記録
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          const route = state.routes.find((r: any) => r.name === tab.name);
          if (!route) return null;

          const routeIndex = state.routes.indexOf(route);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
              handleTabPress(tab.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={onPress}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={24} 
                color={isFocused ? "#3498db" : "#95a5a6"}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Tabs
      tabBar={CustomTabBar}
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
