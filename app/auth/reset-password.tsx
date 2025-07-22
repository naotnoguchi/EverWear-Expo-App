import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(t('common.error'), t('resetPassword.alert.emptyFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('resetPassword.alert.passwordMismatch'));
      return;
    }

    try {
      setIsLoading(true);

      // OTPベースのパスワードリセットではrecoveryTokenのみを使用
      if (!recoveryToken) {
        Alert.alert(t('common.error'), t('resetPassword.alert.tokenMissing'));
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
          t('resetPassword.successTitle'),
          t('resetPassword.successMessage'),
          [{ 
            text: t('common.ok'), 
            onPress: () => router.replace('/auth/login')
          }]
        );
      }, 100); // 100ms待機してからアラート表示
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(t('common.error'), error.message || t('resetPassword.alert.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('resetPassword.title')}</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder={t('resetPassword.placeholder.newPassword')}
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder={t('resetPassword.placeholder.newPasswordConfirm')}
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
            {isLoading ? t('common.loading.processing') : t('resetPassword.button.change')}
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
