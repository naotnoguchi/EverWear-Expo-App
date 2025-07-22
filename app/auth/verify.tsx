import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function VerifyCodeScreen() {
  const params = useLocalSearchParams<{ email?: string; type?: string }>();
  const email = params.email as string | undefined;
  const type = params.type as 'signup' | 'recovery' | 'link' | undefined;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { t } = useTranslation();
  const { verifyOtp, resendConfirmation, resetPassword, updatePassword, isAnonymous, tempLinkPassword, setTempLinkPassword, setPasswordForLinkedAccount } = useAuth();
  const theme = useTheme();
  
  // 自動フォーカス用のref
  const codeInputRef = React.useRef<TextInput>(null);

  // 画面表示時に自動フォーカス（改善案4）
  React.useEffect(() => {
    const timer = setTimeout(() => {
      codeInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async () => {
    if (!email || !type) {
      Alert.alert(t('common.error'), t('verify.alert.invalidLink'));
      return;
    }
    if (code.length !== 6) {
      Alert.alert(t('common.error'), t('verify.alert.codeRequired'));
      return;
    }
    try {
      setLoading(true);

      // AuthContextのverifyOtp関数を使用
      await verifyOtp(email, code, type);

      if (type === 'signup') {
        Alert.alert(t('common.success'), t('verify.alert.emailVerified'), [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
      } else if (type === 'recovery') {
        // recovery の場合はパスワードリセット画面へ
        Alert.alert(t('common.success'), t('verify.alert.codeVerified'), [
          { text: 'OK', onPress: () => router.replace({ pathname: '/auth/reset-password', params: { email, token: code } }) },
        ]);
      } else if (type === 'link') {
        // 匿名→メール紐付け: OTP検証成功後、保存していたパスワードを設定
        if (tempLinkPassword) {
          try {
            await setPasswordForLinkedAccount(tempLinkPassword);
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('verify.alert.passwordSetupFailed'));
            return;
          } finally {
            setTempLinkPassword(null);
          }
        }

        Alert.alert(
          t('verify.alert.accountLinkedTitle'),
          t('verify.alert.accountLinkedMessage'),
          [
            { text: 'OK', onPress: () => router.replace('/') }
          ]
        );
        return;
      }
    } catch (e: any) {
      Alert.alert(t('verify.alert.verificationErrorTitle'), e.message || t('verify.alert.verificationFailed'));
    } finally {
      setLoading(false);
      if (type === 'link') {
        // 失敗・成功問わず一時パスワードを破棄
        setTempLinkPassword(null);
      }
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('verify.alert.emailUnknown'));
      return;
    }

    try {
      setIsResending(true);

      if (type === 'recovery') {
        // パスワードリセット用のコードを再送
        await resetPassword(email);
        Alert.alert(t('verify.alert.sentTitle'), t('verify.alert.resetResent'));
      } else if (type === 'link') {
        // 匿名ユーザーのメール紐付け用再送信
        await resendConfirmation(email, 'link');
        Alert.alert(t('verify.alert.sentTitle'), t('verify.alert.codeResent'));
      } else {
        // サインアップ確認用のコードを再送
        await resendConfirmation(email, 'signup');
        Alert.alert(t('verify.alert.sentTitle'), t('verify.alert.codeResent'));
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('verify.alert.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('screen.verify.title')}</Text>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('verify.subtitle')}</Text>
        
        <TextInput
          ref={codeInputRef}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          value={code}
          onChangeText={setCode}
          placeholder={t('verify.placeholder.code')}
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? t('common.loading.verifying') : t('verify.button.verify')}</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={handleResend} disabled={isResending}>
            <Text style={[styles.resendLink, { color: theme.primary }]}> 
              {isResending ? t('common.loading.sending') : type === 'recovery' ? t('verify.button.resendReset') : t('verify.button.resendCode')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={[styles.cancelLink, { color: theme.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  cancelLink: {
    fontSize: 14,
  },
}); 
