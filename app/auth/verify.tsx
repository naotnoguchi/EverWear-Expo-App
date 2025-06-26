import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function VerifyCodeScreen() {
  const params = useLocalSearchParams<{ email?: string; type?: string }>();
  const email = params.email as string | undefined;
  const type = params.type as 'signup' | 'recovery' | undefined;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp } = useAuth();
  const theme = useTheme();

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
      }
    } catch (e: any) {
      Alert.alert('認証エラー', e.message || 'コードの検証に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>確認コード入力</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>メールに送信された 6 桁コードを入力してください</Text>
        <TextInput
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
}); 