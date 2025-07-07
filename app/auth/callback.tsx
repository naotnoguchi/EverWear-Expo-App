import * as Linking from 'expo-linking';
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
        console.log('Raw params:', params);

        // AuthContextでの処理を待つための遅延
        // AuthContextのhandleDeepLinkが先に実行されるため、少し待つ
        await new Promise(resolve => setTimeout(resolve, 200));

        // AuthContextで既に認証が成功している場合は、ホーム画面にリダイレクト
        const { data: currentSession } = await auth.getSession();
        if (currentSession.session) {
          console.log('Already authenticated, redirecting to home');
          setStatus('success');
          setMessage('メールアドレスが確認されました。\n\nアプリにリダイレクトします...');
          setTimeout(() => {
            router.replace('/');
          }, 2000);
          return;
        }

        // Linking APIを使用してURLを取得し、フラグメントパラメータを処理
        const handleUrl = async (url: string) => {
          console.log('Processing URL in callback:', url);
          
          try {
            const parsedUrl = new URL(url);
            let type = null;
            let access_token = null;
            let token_hash = null;
            let token = null;
            let refresh_token = null;
            let error = null;
            let error_code = null;
            let error_description = null;

            // 追加: クエリ(?foo=bar) からパラメータを取得
            const queryParams = parsedUrl.searchParams;
            if (queryParams) {
              type = queryParams.get('type') || type;
              access_token = queryParams.get('access_token') || access_token;
              token_hash = queryParams.get('token_hash') || token_hash;
              token = queryParams.get('token') || token;
              refresh_token = queryParams.get('refresh_token') || refresh_token;
              error = queryParams.get('error') || error;
              error_code = queryParams.get('error_code') || error_code;
              error_description = queryParams.get('error_description') || error_description;
            }

            // フラグメント（#）からパラメータを取得
            if (parsedUrl.hash) {
              const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
              type = type || hashParams.get('type');
              access_token = access_token || hashParams.get('access_token');
              token_hash = token_hash || hashParams.get('token_hash');
              token = token || hashParams.get('token');
              refresh_token = refresh_token || hashParams.get('refresh_token');
              error = error || hashParams.get('error');
              error_code = error_code || hashParams.get('error_code');
              error_description = error_description || hashParams.get('error_description');
            }

            console.log('Parsed parameters from URL:', { type, error, error_code, has_access_token: !!access_token });

            // エラーが存在する場合の処理
            if (error) {
              console.log('Authentication error detected:', { error, error_code, error_description });
              
              let errorMessage = '認証に失敗しました';
              
              if (error_code === 'otp_expired' || error_description?.includes('expired')) {
                errorMessage = 'メール確認リンクの有効期限が切れています。\n\n新しい確認メールを再送信してください。';
              } else if (error === 'access_denied') {
                errorMessage = 'メール確認がキャンセルされたか、無効なリンクです。\n\n新しい確認メールを再送信してください。';
              } else if (error_description) {
                errorMessage = `認証エラー: ${decodeURIComponent(error_description.replace(/\+/g, ' '))}`;
              }
              
              setStatus('error');
              setMessage(errorMessage);
              return;
            }

            if (!type) {
              console.error('No type parameter found in URL');
              setStatus('error');
              setMessage('認証タイプが指定されていません\n\n有効な認証リンクを使用してください。');
              return;
            }

            // AuthContextで処理されなかった場合のフォールバック処理
            if (type === 'signup' && access_token) {
              console.log('Fallback: Processing signup in callback');
              const { error } = await auth.setSession({
                access_token: access_token,
                refresh_token: refresh_token || ''
              });

              if (error) throw error;
              
              setStatus('success');
              setMessage('メールアドレスが確認されました。\n\nアプリにリダイレクトします...');
              
              setTimeout(() => {
                router.replace('/');
              }, 3000);
            } else if (type === 'link' && access_token) {
              // 匿名ユーザーの紐付け完了処理
              console.log('Fallback: Processing anonymous user identity linking');
              const { error } = await auth.setSession({
                access_token: access_token,
                refresh_token: refresh_token || ''
              });

              if (error) throw error;
              
              setStatus('success');
              setMessage('Google紐付け完了！\n\nGoogleアカウントとの紐付けが完了しました。\n既存のデータは引き続き利用できます。\n\nアプリにリダイレクトします...');
              
              setTimeout(() => {
                router.replace('/');
              }, 3000);
            } else if (type === 'recovery') {
              // パスワードリセットの処理
              if (!recoveryToken) {
                console.error('No recovery token found');
                setStatus('error');
                setMessage('認証トークンが見つかりません\n\nパスワードリセットリンクを再度クリックしてください。');
                return;
              }
              
              setStatus('success');
              setMessage('パスワードリセットが確認されました。\n\nアプリにリダイレクトします...');
              
              setTimeout(() => {
                router.replace({
                  pathname: '/auth/reset-password',
                  params: { token: recoveryToken }
                });
              }, 3000);
            } else {
              setStatus('error');
              setMessage(`処理できない認証タイプです: ${type}\n\n新しい認証リンクを取得してください。`);
            }
          } catch (urlError) {
            console.error('Error parsing URL:', urlError);
            setStatus('error');
            setMessage('認証URLの解析に失敗しました\n\n新しい認証リンクを取得してください。');
          }
        };

        // 現在のURLを取得（アプリ起動時）
        const initialUrl = await Linking.getInitialURL();
        console.log('Initial URL:', initialUrl);
        
        if (initialUrl) {
          await handleUrl(initialUrl);
          return;
        }

        // アプリが既に起動中の場合はURLイベントリスナーを設定
        const subscription = Linking.addEventListener('url', async (event) => {
          console.log('URL event received:', event.url);
          await handleUrl(event.url);
          subscription?.remove();
        });

        // 3秒後にURLが受信されなかった場合はエラー表示
        setTimeout(() => {
          subscription?.remove();
          if (status === 'loading') {
            setStatus('error');
            setMessage('認証URLが見つかりませんでした\n\n新しい認証リンクを使用してください。');
          }
        }, 3000);

      } catch (error: any) {
        console.error('認証エラー:', error);
        setStatus('error');
        setMessage(`認証に失敗しました: ${error.message || '不明なエラー'}\n\n新しい認証リンクを取得してください。`);
      }
    };

    processCallback();
  }, [params, recoveryToken]);

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
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
});