import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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
      Alert.alert('エラー', '無効なリンクです。');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('エラー', '6 桁のコードを入力してください。');
      return;
    }
    try {
      setLoading(true);

      // AuthContextのverifyOtp関数を使用
      await verifyOtp(email, code, type);

      if (type === 'signup') {
        Alert.alert('成功', 'メールアドレスが確認されました。', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
      } else if (type === 'recovery') {
        // recovery の場合はパスワードリセット画面へ
        Alert.alert('成功', 'コードが確認されました。新しいパスワードを設定してください。', [
          { text: 'OK', onPress: () => router.replace({ pathname: '/auth/reset-password', params: { email, token: code } }) },
        ]);
      } else if (type === 'link') {
        // 匿名→メール紐付け: OTP検証成功後、保存していたパスワードを設定
        if (tempLinkPassword) {
          try {
            await setPasswordForLinkedAccount(tempLinkPassword);
          } catch (err: any) {
            Alert.alert('エラー', err.message || 'パスワード設定に失敗しました');
            return;
          } finally {
            setTempLinkPassword(null);
          }
        }

        Alert.alert(
          'アカウント登録完了',
          'メールアドレスとパスワードの設定が完了しました。',
          [
            { text: 'OK', onPress: () => router.replace('/') }
          ]
        );
        return;
      }
    } catch (e: any) {
      Alert.alert('認証エラー', e.message || 'コードの検証に失敗しました。');
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
      Alert.alert('エラー', 'メールアドレスが不明です。やり直してください。');
      return;
    }

    try {
      setIsResending(true);

      if (type === 'recovery') {
        // パスワードリセット用のコードを再送
        await resetPassword(email);
        Alert.alert('送信完了', 'リセットコードを再送信しました。メールをご確認ください。');
      } else if (type === 'link') {
        // 匿名ユーザーのメール紐付け用再送信
        await resendConfirmation(email, 'link');
        Alert.alert('送信完了', '確認コードを再送信しました。メールをご確認ください。');
      } else {
        // サインアップ確認用のコードを再送
        await resendConfirmation(email, 'signup');
        Alert.alert('送信完了', '確認コードを再送信しました。メールをご確認ください。');
      }
    } catch (e: any) {
      Alert.alert('エラー', e.message || 'コードの再送信に失敗しました。');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>確認コード入力</Text>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>メールに送信された 6 桁コードを入力してください</Text>
        
        <TextInput
          ref={codeInputRef}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '確認中...' : '確認する'}</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={handleResend} disabled={isResending}>
            <Text style={[styles.resendLink, { color: theme.primary }]}> 
              {isResending ? '送信中...' : type === 'recovery' ? 'リセットコードを再送信' : '確認コードを再送信'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={[styles.cancelLink, { color: theme.textSecondary }]}>キャンセル</Text>
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
