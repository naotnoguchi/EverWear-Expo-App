import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, useColorScheme } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { signIn, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const appleButtonStyle =
    colorScheme === 'dark'
      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK;

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      router.replace('/');
    } catch (error: any) {
      const message = error.message || '';
      if (message.includes('メールアドレスの確認')) {
        // メール未確認の場合は確認コード入力画面へ遷移
        router.push({ pathname: '/auth/verify', params: { email, type: 'signup' } });
      } else {
        Alert.alert('ログインエラー', message || 'ログインに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login process');
      await signInWithGoogle();
      // 注: Google認証はリダイレクトベースなので、AuthContextのuseEffectで処理される
      // 成功時は自動的にホーム画面にリダイレクトされる
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert(
        'Googleログインエラー', 
        error.message || 'Googleログインに失敗しました。\n\n・インターネット接続を確認してください\n・Google認証設定を確認してください'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
      // 注: Apple認証の成功はAuthContextで処理
    } catch (error: any) {
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
    } catch (error: any) {
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
        'メールに 6 桁のリセットコードを送信しました。コードを入力してください。',
        [{ 
          text: 'OK', 
          onPress: () => {
            setShowResetForm(false);
            router.push({ pathname: '/auth/verify', params: { email: resetEmail, type: 'recovery' } });
          }
        }]
      );
    } catch (error: any) {
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
            {isLoading ? '送信中...' : 'リセットコードを送信'}
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>EverWear</Text>
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

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={() => setShowResetForm(true)}>
                <Text style={[styles.forgotPassword, { color: theme.primary }]}>
                  パスワードをお忘れですか？
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {renderResetForm()}

        {!showResetForm && (
          <>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>または</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleLogo}
              />
              <Text style={styles.socialButtonText}>
                {isLoading ? '認証中...' : 'Googleでログイン'}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={appleButtonStyle}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />
            )}

            {/* 規約同意注釈 */}
            <Text style={[styles.agreementText, { color: theme.textSecondary }]} selectable={false}>
              「ログイン」または「サインイン」ボタンをタップすると、
              <Text
                style={{ color: theme.primary, textDecorationLine: 'underline' }}
                onPress={() => router.push({ pathname: '/webview', params: { url: 'https://naotnoguchi.github.io/EverWear/terms-ja.html', title: '利用規約' } })}
              >
                利用規約
              </Text>
              と
              <Text
                style={{ color: theme.primary, textDecorationLine: 'underline' }}
                onPress={() => router.push({ pathname: '/webview', params: { url: 'https://naotnoguchi.github.io/EverWear/privacy-ja.html', title: 'プライバシーポリシー' } })}
              >
                プライバシーポリシー
              </Text>
              に同意したものとみなします。
            </Text>

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
          </>
        )}
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
  forgotPassword: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  linkContainer: {
    alignItems: 'center',
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
  resendDescription: {
    fontSize: 14,
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
    marginTop: 15,
    marginBottom: 15,
    flexDirection: 'row',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleLogo: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F6368',
  },
  appleButton: {
    height: 50,
    width: '100%',
    marginBottom: 15,
    borderRadius: 8,
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
  agreementText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  onboardingLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
