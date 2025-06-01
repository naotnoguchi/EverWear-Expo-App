import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { signIn, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const theme = useTheme();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      router.replace('/');
    } catch (error) {
      Alert.alert('ログインエラー', error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // 注: Google認証はリダイレクトベースなので、AuthContextのuseEffectで処理
    } catch (error) {
      Alert.alert('Googleログインエラー', error.message || 'Googleログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
      // 注: Apple認証の成功はAuthContextで処理
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Appleログインエラー', error.message || 'Appleログインに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleOpenOnboarding = async () => {
    try {
      await resetOnboarding();
      // After resetting onboarding status, the app will automatically show the onboarding screen
      // due to the logic in _layout.tsx
    } catch (error) {
      Alert.alert('エラー', 'オンボーディングの表示に失敗しました');
    }
  };

  // パスワードリセット処理
  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(resetEmail);
      Alert.alert(
        'パスワードリセット',
        'パスワードリセットのリンクを送信しました。メールを確認してください。',
        [{ text: 'OK', onPress: () => setShowResetForm(false) }]
      );
    } catch (error) {
      Alert.alert('エラー', error.message || 'パスワードリセットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // パスワードリセットフォームを表示する関数
  const renderResetForm = () => {
    if (!showResetForm) return null;

    return (
      <View style={styles.resetForm}>
        <Text style={[styles.resetTitle, { color: theme.text }]}>
          パスワードをリセット
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder="メールアドレス"
          placeholderTextColor={theme.textSecondary}
          value={resetEmail}
          onChangeText={setResetEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '送信中...' : 'リセットリンクを送信'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowResetForm(false)}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
            キャンセル
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>ClothesManagerApp</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>アカウントにログイン</Text>

      {!showResetForm && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="メールアドレス"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="パスワード"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: '#ffffff' }]}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowResetForm(true)}>
            <Text style={[styles.forgotPassword, { color: theme.primary }]}>
              パスワードをお忘れですか？
            </Text>
          </TouchableOpacity>
        </>
      )}

      {renderResetForm()}

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.textSecondary }]}>または</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      <TouchableOpacity
        style={[
          styles.socialButton, 
          styles.googleButton,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }
        ]}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        <Text style={[styles.socialButtonText, { color: theme.text }]}>Googleでログイン</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={styles.appleButton}
          onPress={handleAppleLogin}
        />
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          アカウントをお持ちでない場合は
        </Text>
        <TouchableOpacity onPress={handleSignUp}>
          <Text style={[styles.footerLink, { color: theme.primary }]}>
            新規登録
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.onboardingLink}>
        <TouchableOpacity onPress={handleOpenOnboarding}>
          <Text style={[styles.onboardingLinkText, { color: theme.primary }]}>
            アプリの使い方を見る
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white', // Will be overridden for dark mode
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  resetForm: {
    marginTop: 20,
    width: '100%',
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
  },
  socialButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
  },
  googleButton: {
    backgroundColor: 'white', // Will be overridden with theme color
    borderWidth: 1,
    borderColor: '#ddd', // Will be overridden with theme color
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333', // Will be overridden with theme color
  },
  appleButton: {
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 5,
  },
  footerLink: {
    fontWeight: '600',
  },
  onboardingLink: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  onboardingLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
