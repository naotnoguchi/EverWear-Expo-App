import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { auth } from '../../lib/authClient';

export default function CallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証を処理中...');
  const params = useLocalSearchParams();
  const theme = useTheme();
  const { recoveryToken, clearRecoveryToken } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('Processing auth callback');

        // URLパラメータから基本情報を取得
        const type = params.type as string | null;

        if (!type) {
          console.error('No type parameter found');
          setStatus('error');
          setMessage('認証タイプが指定されていません');
          return;
        }

        // トークンの種類に応じて処理
        if (type === 'signup') {
          // メールアドレス確認の処理（サインアップはrecoveryTokenを使用しない）
          const token = params.token as string;
          if (!token) {
            setStatus('error');
            setMessage('サインアップ確認用のトークンが見つかりません');
            return;
          }
          
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
          if (!recoveryToken) {
            console.error('No recovery token found');
            setStatus('error');
            setMessage('認証トークンが見つかりません');
            return;
          }
          
          setStatus('success');
          setMessage('パスワードリセットが確認されました。アプリにリダイレクトします...');
          
          // パスワードリセット画面に遷移
          setTimeout(() => {
            router.replace({
              pathname: '/auth/reset-password',
              params: { token: recoveryToken }
            });
            // トークンは後でパスワード更新完了時にクリア
          }, 3000);
        } else {
          setStatus('error');
          setMessage('不明な認証タイプです');
        }
      } catch (error: any) {
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