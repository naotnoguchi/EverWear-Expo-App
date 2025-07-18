import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { signIn, signInWithGoogle, signInWithApple, resetPassword, signInAnonymously, isAnonymous } = useAuth();
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
      // ユーザーキャンセルは無視（複数のパターンをチェック）
      const isUserCanceled = 
        error.code === 'ERR_CANCELED' || 
        error.message?.includes('user canceled') ||
        error.message?.includes('The user canceled');

      if (!isUserCanceled) {
        Alert.alert('Appleログインに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      await signInAnonymously();
      router.replace('/');
    } catch (error: any) {
      Alert.alert('ゲストログインエラー', error.message || 'ゲストログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    // 匿名ユーザーの場合はアカウント紐付け画面に遷移
    if (isAnonymous) {
      router.push('/auth/link-account');
    } else {
      router.push('/auth/signup');
    }
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
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Text style={[styles.title, { color: theme.text }]}>EverWearにログイン</Text>

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
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={[styles.forgotPassword, { color: theme.primary }]}>
                  新規登録
                </Text>
              </TouchableOpacity>
              <Text style={{ color: theme.textSecondary, marginHorizontal: 8 }}> | </Text>
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

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>または</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.guestButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleGuestLogin}
              disabled={isLoading}
            >
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <Text style={[styles.guestButtonText, { color: theme.primary }]}>
                {isLoading ? 'ゲストログイン中...' : 'ゲストとして利用'}
              </Text>
            </TouchableOpacity>


            {/* 規約同意注釈 */}
            <Text style={[styles.agreementText, { color: theme.textSecondary }]} selectable={false}>
              いずれかのログイン方法を選択すると、
              <Text
                style={{ color: theme.primary, textDecorationLine: 'underline' }}
                onPress={() => router.push({ pathname: '/webview', params: { url: 'https://everwearapp.com/terms.html', title: '利用規約' } })}
              >
                利用規約
              </Text>
              と
              <Text
                style={{ color: theme.primary, textDecorationLine: 'underline' }}
                onPress={() => router.push({ pathname: '/webview', params: { url: 'https://everwearapp.com/privacy.html', title: 'プライバシーポリシー' } })}
              >
                プライバシーポリシー
              </Text>
              に同意したものとみなします。
            </Text>

            <View style={styles.onboardingLink}>
              <TouchableOpacity onPress={handleOpenOnboarding}>
                <Text style={[styles.onboardingLinkText, { color: theme.primary }]}>
                  アプリの使い方を見る
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height - 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 24,
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
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  guestButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    borderWidth: 1,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  },
  onboardingLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
