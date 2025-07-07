import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updatePassword, recoveryToken, clearRecoveryToken, signOut } = useAuth();
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    try {
      setIsLoading(true);

      // OTPベースのパスワードリセットではrecoveryTokenのみを使用
      if (!recoveryToken) {
        Alert.alert('エラー', '認証トークンが見つかりません。パスワードリセットを再度実行してください。');
        return;
      }

      await updatePassword(password);

      // リカバリートークンをクリア
      clearRecoveryToken();

      // ログアウト処理を先に実行
      await signOut();

      // ログアウト完了後にアラート表示
      setTimeout(() => {
        Alert.alert(
          'パスワード変更完了',
          'セキュリティのため、新しいパスワードで再度ログインしてください。',
          [{ 
            text: 'OK', 
            onPress: () => router.replace('/auth/login')
          }]
        );
      }, 100); // 100ms待機してからアラート表示
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('エラー', error.message || 'パスワードの変更に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>新しいパスワードを設定</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder="新しいパスワード"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder="新しいパスワード（確認）"
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '処理中...' : 'パスワードを変更'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    letterSpacing: 0,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
