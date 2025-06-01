import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { auth } from '../../lib/authClient';
import { useTheme } from '../../contexts/ThemeContext';

export default function CallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証を処理中...');
  const params = useLocalSearchParams();
  const theme = useTheme();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // URLパラメータからトークンを取得
        const token = params.token as string;
        const type = params.type as string;

        if (!token) {
          setStatus('error');
          setMessage('認証トークンが見つかりません');
          return;
        }

        // トークンの種類に応じて処理
        if (type === 'signup') {
          // メールアドレス確認の処理
          const { error } = await auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (error) throw error;
          
          setStatus('success');
          setMessage('メールアドレスが確認されました。アプリにリダイレクトします...');
          
          // 成功したら3秒後にログイン画面に遷移
          setTimeout(() => {
            router.replace('/auth/login');
          }, 3000);
        } else if (type === 'recovery') {
          // パスワードリセットの処理
          setStatus('success');
          setMessage('パスワードリセットが確認されました。アプリにリダイレクトします...');
          
          // パスワードリセット画面に遷移
          setTimeout(() => {
            router.replace({
              pathname: '/auth/reset-password',
              params: { token }
            });
          }, 3000);
        } else {
          setStatus('error');
          setMessage('不明な認証タイプです');
        }
      } catch (error) {
        console.error('認証エラー:', error);
        setStatus('error');
        setMessage(`認証に失敗しました: ${error.message || '不明なエラー'}`);
      }
    };

    processCallback();
  }, [params]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {status === 'loading' && <ActivityIndicator size="large" color={theme.primary} />}
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      {status === 'error' && (
        <Text 
          style={[styles.link, { color: theme.primary }]}
          onPress={() => router.replace('/auth/login')}
        >
          ログイン画面に戻る
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
});