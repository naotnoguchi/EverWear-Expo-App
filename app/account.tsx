import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import DeleteAccountModal from "../components/DeleteAccountModal";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Account() {
  const router = useRouter();
  const theme = useTheme();
  const { getUserInfo } = useAuth();
  const { t, i18n } = useTranslation();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const userInfo = getUserInfo();

  // 認証方法を翻訳する関数
  const getAuthMethodText = (provider: string) => {
    // 正規化してから比較
    const normalizedProvider = provider?.toLowerCase().trim();
    
    // 日本語のハードコーディングされた値をチェック
    if (provider === 'メール/パスワード' || 
        provider === 'メール / パスワード' ||
        normalizedProvider === 'email') {
      return t('account.authMethods.email');
    }
    
    if (provider === 'Google' || 
        normalizedProvider === 'google') {
      return t('account.authMethods.google');
    }
    
    if (provider === 'Apple' || 
        normalizedProvider === 'apple') {
      return t('account.authMethods.apple');
    }
    
    if (provider === 'ゲスト' || 
        normalizedProvider === 'anonymous') {
      return t('account.authMethods.anonymous');
    }
    
    if (provider === '不明' || 
        normalizedProvider === 'unknown') {
      return t('account.authMethods.unknown');
    }
    
    // デフォルトはそのまま返す
    return provider;
  };

  // Apple Private Relay メールアドレスを検出する関数
  const isApplePrivateRelayEmail = (email: string | null): boolean => {
    if (!email || typeof email !== 'string') return false;

    // Apple Private Relay の既知のパターン
    const applePrivateRelayPatterns = [
      /@privaterelay\.appleid\.com$/i,
      // 将来的な拡張に備えて他のパターンも追加可能
    ];

    return applePrivateRelayPatterns.some(pattern => pattern.test(email));
  };

  // 表示用のメールアドレスを取得する関数
  const getDisplayEmail = (email: string | null): string | null => {
    if (!email) return null;
    return isApplePrivateRelayEmail(email) ? t('account.info.privateEmail') : email;
  };

  // アカウント削除処理
  const handleDeleteAccount = () => {
    Alert.alert(
      t('account.deleteAccount.title'),
      t('account.deleteAccount.message'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('account.deleteAccount.delete'),
          style: "destructive",
          onPress: () => setShowDeleteAccountModal(true),
        },
      ]
    );
  };

  // アカウント削除完了処理
  const onAccountDeleted = () => {
    router.replace('/auth/login');
  };

  // 作成日のフォーマット
  const formatCreatedAt = (createdAt: string | null) => {
    if (!createdAt) return t('account.info.unknown');
    try {
      const date = new Date(createdAt);
      return i18n.language === 'ja' 
        ? date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
    } catch {
      return t('account.info.unknown');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.text,
    },
    infoItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoLabel: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    infoValue: {
      fontSize: 16,
      color: theme.text + "99",
      flex: 2,
      textAlign: "right",
    },
    dangerSection: {
      backgroundColor: theme.card,
      marginBottom: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.error + "33",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    dangerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.error,
    },
    dangerDescription: {
      fontSize: 14,
      color: theme.text + "99",
      marginBottom: 16,
      lineHeight: 20,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.error,
      borderRadius: 8,
      backgroundColor: theme.error + "11",
    },
    deleteButtonText: {
      color: theme.error,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: 16 }}>
        {/* アカウント情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account.sections.accountInfo')}</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('account.info.authMethod')}</Text>
            <Text style={styles.infoValue}>{getAuthMethodText(userInfo.provider)}</Text>
          </View>

          {userInfo.email && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('account.info.email')}</Text>
              <Text style={styles.infoValue}>{getDisplayEmail(userInfo.email)}</Text>
            </View>
          )}

          <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>{t('account.info.createdDate')}</Text>
            <Text style={styles.infoValue}>
              {formatCreatedAt(userInfo.createdAt)}
            </Text>
          </View>
        </View>

        {/* 危険な操作セクション */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>{t('account.sections.dangerZone')}</Text>
          <Text style={styles.dangerDescription}>
            {t('account.deleteAccount.description')}
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={theme.error} />
            <Text style={styles.deleteButtonText}>{t('account.deleteAccount.button')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* アカウント削除モーダル */}
      <DeleteAccountModal
        visible={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onAccountDeleted={onAccountDeleted}
      />
    </View>
  );
} 
