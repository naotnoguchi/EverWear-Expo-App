import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function LinkAccountScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isAnonymous, startEmailLinking, linkGoogleIdentity, setTempLinkPassword } = useAuth();
  const theme = useTheme();

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
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    // 簡単なメールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }

    // パスワードバリデーション
    if (!password || !confirmPassword) {
      Alert.alert('エラー', 'パスワードを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    try {
      setIsLoading(true);

      // 一時パスワード保存
      setTempLinkPassword(password);
      await startEmailLinking(email);
      Alert.alert(
        '確認コード送信',
        'メールに 6 桁の確認コードを送信しました。\n\nコードを入力してメールアドレスを確認してください。',
        [{ 
          text: 'OK', 
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
      Alert.alert('紐付けエラー', error.message || 'アカウント紐付けに失敗しました');
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
        'Google紐付け完了！',
        'Googleアカウントとの紐付けが完了しました。\n\n既存のデータは引き続き利用できます。',
        [
          { text: 'ホームに戻る', onPress: () => router.replace('/') },
        ]
      );
    } catch (error: any) {
      Alert.alert('Google紐付けエラー', error.message || 'Google認証に失敗しました');
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
        <Text style={[styles.title, { color: theme.text }]}>アカウント登録</Text>

        {/* 案内メッセージ */}
        <View style={styles.notice}>
          <Ionicons name="information-circle" size={20} color="#3498db" />
          <Text style={[styles.noticeText, { color: theme.text }]}>
            アカウント登録すると、現在のデータを引き続き安全に利用できます
          </Text>
        </View>

        {/* メール + パスワード入力フィールド */}
        {showEmailForm && (
          <>
            {/* メールアドレスを入力してください */}
            <Text style={[styles.description, { color: theme.textSecondary, marginBottom: 10 }]}>メールアドレスとパスワードを入力してください</Text>

            <TextInput
              ref={emailInputRef}
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
              placeholder="パスワード (8文字以上)"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder="パスワード (確認)"
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
                {isLoading ? '送信中...' : '確認コードを送信'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backButton, { borderColor: theme.primary }]}
              onPress={() => setShowEmailForm(false)}
              disabled={isLoading}
            >
              <Text style={[styles.backButtonText, { color: theme.primary }]}>
                戻る
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* 紐付けオプション選択 */}
        {!showEmailForm && (
          <>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              データを引き続き安全に利用するため、アカウント登録をお願いします。
            </Text>

            {/* メール/パスワード紐付けオプション */}
            <TouchableOpacity
              style={[styles.linkingOption, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowEmailForm(true)}
            >
              <Ionicons name="mail-outline" size={20} color={theme.text} />
              <Text style={[styles.linkingOptionText, { color: theme.text }]}>
                メール/パスワードで登録
              </Text>
            </TouchableOpacity>

            {/* Google紐付けオプション */}
            <GoogleAuthButton
              onPress={handleGoogleLink}
              disabled={isLoading}
              loading={isLoading}
              text={isLoading ? "Google認証中..." : "Googleアカウントで登録"}
              style={{ marginBottom: 15 }}
            />
          </>
        )}

        {/* 規約同意注釈 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: theme.textSecondary }}>いずれかの登録方法を選択すると、</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: 'https://everwearapp.com/terms.html', title: '利用規約' } })}
          >
            利用規約
          </Text>
          <Text style={{ color: theme.textSecondary }}>と</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: 'https://everwearapp.com/privacy.html', title: 'プライバシーポリシー' } })}
          >
            プライバシーポリシー
          </Text>
          <Text style={{ color: theme.textSecondary }}>に同意したものとみなします。</Text>
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
    backgroundColor: '#EBF3FD',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
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
