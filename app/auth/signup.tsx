import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const theme = useTheme();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(email, password);
      Alert.alert(
        '確認コード送信',
        'メールに 6 桁の確認コードを送信しました。コードを入力してください。',
        [{ text: 'OK', onPress: () => router.replace({ pathname: '/auth/verify', params: { email, type: 'signup' } }) }]
      );
    } catch (error: any) {
      Alert.alert('登録エラー', error.message || 'アカウント登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>アカウント作成</Text>

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

        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          placeholder="パスワード（確認）"
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#ffffff' }]}>
            {isLoading ? '登録中...' : 'アカウント作成'}
          </Text>
        </TouchableOpacity>

        {/* 規約同意注釈 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: theme.textSecondary }}>「アカウント作成」をタップすると、</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: 'https://naotnoguchi.github.io/EverWear/terms-ja.html', title: '利用規約' } })}
          >
            利用規約
          </Text>
          <Text style={{ color: theme.textSecondary }}>と</Text>
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => router.push({ pathname: '/webview', params: { url: 'https://naotnoguchi.github.io/EverWear/privacy-ja.html', title: 'プライバシーポリシー' } })}
          >
            プライバシーポリシー
          </Text>
          <Text style={{ color: theme.textSecondary }}>に同意したものとみなします。</Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            すでにアカウントをお持ちの場合は
          </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              ログイン
            </Text>
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
});
