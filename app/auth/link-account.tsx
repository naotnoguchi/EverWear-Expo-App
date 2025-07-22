import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AppleAuthButton from '../../components/AppleAuthButton';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getPrivacyUrl, getTermsUrl } from '../../lib/i18n';

export default function LinkAccountScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isAnonymous, startEmailLinking, linkGoogleIdentity, linkAppleIdentity, setTempLinkPassword } = useAuth();
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  // 自動フォーカス用のref
  const emailInputRef = useRef<TextInput>(null);

  // 匿名ユーザーでない場合はログイン画面にリダイレクト
  if (!isAnonymous) {
    router.replace('/auth/login');
    return null;
  }

  // 自動フォーカス（改善案4）
  React.useEffect(() => {
    if (showEmailForm) {
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showEmailForm]);

  const handleEmailPasswordLink = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('linkAccount.alerts.validation.emailRequired'));
      return;
    }

    // 簡単なメールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('linkAccount.alerts.validation.emailInvalid'));
      return;
    }

    // パスワードバリデーション
    if (!password || !confirmPassword) {
      Alert.alert(t('common.error'), t('linkAccount.alerts.validation.passwordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('linkAccount.alerts.validation.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), t('linkAccount.alerts.validation.passwordTooShort'));
      return;
    }

    try {
      setIsLoading(true);

      // 一時パスワード保存
      setTempLinkPassword(password);
      await startEmailLinking(email);
      Alert.alert(
        t('linkAccount.alerts.codeSent.title'),
        t('linkAccount.alerts.codeSent.message'),
        [{ 
          text: t('common.ok'), 
          onPress: () => router.replace({ 
            pathname: '/auth/verify', 
            params: { 
              email, 
              type: 'link'
            } 
          }) 
        }]
      );
    } catch (error: any) {
      Alert.alert(t('linkAccount.alerts.error.linkingTitle'), error.message || t('linkAccount.alerts.error.linkingFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLink = async () => {
    try {
      setIsLoading(true);
      await linkGoogleIdentity();
      // 成功時のフィードバック
      Alert.alert(
        t('linkAccount.alerts.success.title'),
        t('linkAccount.alerts.success.googleMessage'),
        [
          { text: t('common.ok'), onPress: () => router.replace('/') },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('linkAccount.alerts.error.title'), error.message || t('linkAccount.alerts.error.googleFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLink = async () => {
    try {
      setIsLoading(true);
      await linkAppleIdentity();
      // 成功時のフィードバック
      Alert.alert(
        t('linkAccount.alerts.success.title'),
        t('linkAccount.alerts.success.appleMessage'),
        [
          { text: t('common.ok'), onPress: () => router.replace('/') },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('linkAccount.alerts.error.title'), error.message || t('linkAccount.alerts.error.appleFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('linkAccount.title')}</Text>

        {/* 案内メッセージ */}
        <View style={[styles.notice, {
          backgroundColor: theme.background === '#000000' ? '#1a2332' : '#EBF3FD',
          borderColor: theme.primary
        }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.noticeText, { color: theme.text }]}>
            {t('linkAccount.notice')}
          </Text>
        </View>

        {/* メール + パスワード入力フィールド */}
        {showEmailForm && (
          <>
            {/* メールアドレスを入力してください */}
            <Text style={[styles.description, { color: theme.textSecondary, marginBottom: 10 }]}>{t('linkAccount.description.emailForm')}</Text>

            <TextInput
              ref={emailInputRef}
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('linkAccount.form.placeholder.email')}
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('linkAccount.form.placeholder.password')}
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('linkAccount.form.placeholder.confirmPassword')}
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleEmailPasswordLink}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                {isLoading ? t('linkAccount.form.button.sending') : t('linkAccount.form.button.sendCode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backButton, { borderColor: theme.primary }]}
              onPress={() => setShowEmailForm(false)}
              disabled={isLoading}
            >
              <Text style={[styles.backButtonText, { color: theme.primary }]}>
                {t('linkAccount.form.button.back')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* 紐付けオプション選択 */}
        {!showEmailForm && (
          <>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {t('linkAccount.description.main')}
            </Text>

            {/* メール/パスワード紐付けオプション */}
            <TouchableOpacity
              style={[styles.linkingOption, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowEmailForm(true)}
            >
              <Ionicons name="mail-outline" size={20} color={theme.text} />
              <Text style={[styles.linkingOptionText, { color: theme.text }]}>
                {t('linkAccount.options.email')}
              </Text>
            </TouchableOpacity>

            {/* Google紐付けオプション */}
            <GoogleAuthButton
              onPress={handleGoogleLink}
              disabled={isLoading}
              loading={isLoading}
              text={isLoading ? t('linkAccount.options.googleLoading') : t('linkAccount.options.google')}
              style={{ marginBottom: 15 }}
            />

            {/* Apple紐付けオプション (iOS only) */}
            {Platform.OS === 'ios' && (
              <AppleAuthButton
                onPress={handleAppleLink}
                disabled={isLoading}
                loading={isLoading}
                style={{ marginBottom: 15 }}
              />
            )}
          </>
        )}

        {/* 規約同意注釈 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: theme.textSecondary }}>{t('linkAccount.agreement.prefix')}</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: getTermsUrl(), title: t('linkAccount.agreement.terms') } })}
          >
            {t('linkAccount.agreement.terms')}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{i18n.language === 'ja' ? 'と' : ' and '}</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: getPrivacyUrl(), title: t('linkAccount.agreement.privacy') } })}
          >
            {t('linkAccount.agreement.privacy')}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{t('linkAccount.agreement.suffix')}</Text>
        </View>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  noticeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
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
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkingOption: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
  },
  linkingOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 
