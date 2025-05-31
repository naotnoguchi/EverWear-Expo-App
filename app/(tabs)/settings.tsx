import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useTabReset } from "../../contexts/TabResetContext";
import { useAuth } from "../../contexts/AuthContext";

export default function Settings() {
  // State for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  // Get onboarding functions and router
  const { resetOnboarding } = useOnboarding();
  const router = useRouter();

  // Get auth functions
  const { signOut } = useAuth();

  // Get theme
  const theme = useTheme();

  // Create a ref for the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  const { registerResetFunction } = useTabReset();

  // Register the reset function with the TabResetContext
  useEffect(() => {
    registerResetFunction("settings", () => {
      // Scroll to the top
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    });
  }, [registerResetFunction]);

  // Handle backup
  const handleBackup = () => {
    Alert.alert(
      "バックアップ",
      "データのバックアップを作成しますか？",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "バックアップ",
          onPress: () => {
            // In a real app, this would trigger a backup process
            Alert.alert("成功", "バックアップが完了しました");
          },
        },
      ]
    );
  };

  // Handle restore
  const handleRestore = () => {
    Alert.alert(
      "復元",
      "バックアップからデータを復元しますか？現在のデータは上書きされます。",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "復元",
          onPress: () => {
            // In a real app, this would trigger a restore process
            Alert.alert("成功", "データが復元されました");
          },
        },
      ]
    );
  };

  // Handle data export
  const handleExport = () => {
    Alert.alert("エクスポート", "データをCSV形式でエクスポートしました");
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      "アカウント削除",
      "本当にアカウントを削除しますか？この操作は取り消せません。",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            // In a real app, this would delete the account
            Alert.alert("削除完了", "アカウントが削除されました");
          },
        },
      ]
    );
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // The app will automatically redirect to the login screen
      // due to the auth state change and the logic in _layout.tsx
    } catch (error) {
      Alert.alert("エラー", "ログアウトに失敗しました");
      console.error("Logout error:", error);
    }
  };

  // Define styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    section: {
      backgroundColor: theme.card,
      marginBottom: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    premiumButton: {
      borderBottomWidth: 0,
    },
    premiumDescription: {
      fontSize: 12,
      color: theme.text + "99", // Adding transparency for secondary text
      paddingHorizontal: 12,
      marginTop: 8,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.text,
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingTextContainer: {
      flex: 1,
      paddingRight: 16,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.text + "99", // Adding transparency for secondary text
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    actionButtonText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    infoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoLabel: {
      fontSize: 16,
      color: theme.text,
    },
    infoValue: {
      fontSize: 16,
      color: theme.text + "99", // Adding transparency for secondary text
    },
    dangerButton: {
      backgroundColor: "#e74c3c",
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
    },
    dangerButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    footer: {
      padding: 24,
      alignItems: "center",
    },
    footerText: {
      fontSize: 12,
      color: theme.text + "77", // Adding more transparency for footer text
      textAlign: "center",
    },
  });

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingTop: 16 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知設定</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>洗濯タイミング通知</Text>
            <Text style={styles.settingDescription}>
              洗濯推奨タイミングになったらお知らせします
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={notificationsEnabled ? "#3498db" : "#f4f3f4"}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>リマインダー通知</Text>
            <Text style={styles.settingDescription}>
              24時間以上記録がない場合に通知します
            </Text>
          </View>
          <Switch
            value={reminderNotifications}
            onValueChange={setReminderNotifications}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={reminderNotifications ? "#3498db" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ設定</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>自動バックアップ</Text>
            <Text style={styles.settingDescription}>
              毎週自動でデータをバックアップします
            </Text>
          </View>
          <Switch
            value={autoBackup}
            onValueChange={setAutoBackup}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={autoBackup ? "#3498db" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={resetOnboarding}>
          <Ionicons name="help-circle" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>オンボーディングを表示</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleBackup}>
          <Ionicons name="cloud-upload" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>データをバックアップ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleRestore}>
          <Ionicons name="cloud-download" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>バックアップから復元</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Ionicons name="download" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>データをエクスポート (CSV)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>プレミアムプラン</Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.premiumButton]} 
          onPress={() => router.push("/subscription")}
        >
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.actionButtonText}>プレミアムプランを見る</Text>
        </TouchableOpacity>
        <Text style={styles.premiumDescription}>
          プレミアムプランでは、アイテム登録数の制限解除、高度な分析機能、広告非表示などの特典があります。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>バージョン</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>開発者</Text>
          <Text style={styles.infoValue}>洋服管理アプリ開発チーム</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color="#3498db" />
          <Text style={styles.actionButtonText}>ログアウト</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, { marginTop: 16 }]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.dangerButtonText}>アカウントを削除</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2023 洋服管理アプリ All Rights Reserved
        </Text>
      </View>
    </ScrollView>
  );
}
