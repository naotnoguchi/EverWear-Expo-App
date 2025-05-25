import { useState } from "react";
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

export default function Settings() {
  // State for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

  // Get onboarding functions
  const { resetOnboarding } = useOnboarding();

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

  return (
    <ScrollView style={styles.container}>
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
            <Text style={styles.settingLabel}>ダークモード</Text>
            <Text style={styles.settingDescription}>
              ダークテーマに切り替えます
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={darkMode ? "#3498db" : "#f4f3f4"}
          />
        </View>

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
        <TouchableOpacity
          style={styles.dangerButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    backgroundColor: "white",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2c3e50",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#2c3e50",
  },
  infoValue: {
    fontSize: 16,
    color: "#7f8c8d",
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
    color: "#95a5a6",
    textAlign: "center",
  },
});
