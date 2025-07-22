import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrivacyUrl, getTermsUrl } from '../../lib/i18n';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const { t } = useTranslation();
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
      Alert.alert(t('common.error'), t('login.alertEmptyFields'));
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
        Alert.alert(t('login.loginErrorTitle'), message || t('login.loginFailed'));
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
        t('login.googleErrorTitle'),
        error.message || t('login.googleFailed')
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
        Alert.alert(t('login.appleFailed'));
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
      Alert.alert(t('login.guestErrorTitle'), error.message || t('login.guestFailed'));
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
      Alert.alert(t('common.error'), t('login.onboardingFailed'));
    }
  };

  // パスワードリセット処理
  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert(t('common.error'), t('login.reset.emailRequired'));
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(resetEmail);
      Alert.alert(
        t('login.reset.title'),
        t('login.reset.sent'),
        [{ 
          text: t('common.ok'), 
          onPress: () => {
            setShowResetForm(false);
            router.push({ pathname: '/auth/verify', params: { email: resetEmail, type: 'recovery' } });
          }
        }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('login.reset.failed'));
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
          {t('login.reset.formTitle')}
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder={t('common.placeholder.email')}
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
            {isLoading ? t('common.loading.sending') : t('login.button.sendResetCode')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowResetForm(false)}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
            {t('common.cancel')}
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
        <Text style={[styles.title, { color: theme.text }]}>{t('login.title')}</Text>

        {!showResetForm && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('common.placeholder.email')}
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('common.placeholder.password')}
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
                {isLoading ? t('common.loading.loggingIn') : t('login.button.login') }
              </Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={[styles.forgotPassword, { color: theme.primary }]}>
                  {t('login.button.signup')}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: theme.textSecondary, marginHorizontal: 8 }}>{t('common.or')}</Text>
              <TouchableOpacity onPress={() => setShowResetForm(true)}>
                <Text style={[styles.forgotPassword, { color: theme.primary }]}>
                  {t('login.link.forgotPassword')}
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
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('common.or')}</Text>
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
                {isLoading ? t('common.loading.authenticating') : t('login.button.google')}
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
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('common.or')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.guestButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleGuestLogin}
              disabled={isLoading}
            >
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <Text style={[styles.guestButtonText, { color: theme.primary }]}>
                {isLoading ? t('common.loading.guestLoggingIn') : t('login.button.guest')}
              </Text>
            </TouchableOpacity>


            {/* 規約同意注釈 */}
            <Text style={[styles.agreementText, { color: theme.textSecondary }]} selectable={false}>
              {t('login.agreement.prefix')}
              <Text
                style={{ color: theme.primary, textDecorationLine: 'underline' }}
                onPress={() => router.push({ pathname: '/webview', params: { url: getTermsUrl(), title: t('login.agreement.terms') } })}
              >
                {t('login.agreement.terms')}
              </Text>
              {t('common.and')}
              <Text
                style={{ color: theme.primary, textDecorationLine: 'underline' }}
                onPress={() => router.push({ pathname: '/webview', params: { url: getPrivacyUrl(), title: t('login.agreement.privacy') } })}
              >
                {t('login.agreement.privacy')}
              </Text>
              {t('login.agreement.suffix')}
            </Text>

            <View style={styles.onboardingLink}>
              <TouchableOpacity onPress={handleOpenOnboarding}>
                <Text style={[styles.onboardingLinkText, { color: theme.primary }]}>
                  {t('login.link.viewOnboarding')}
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
