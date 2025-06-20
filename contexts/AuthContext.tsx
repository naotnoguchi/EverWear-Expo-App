import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthChangeEvent, Session, User } from '@supabase/auth-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../lib/authClient';

// AsyncStorageのキー
const AUTH_STATE_KEY = 'auth_state';
const FIRST_LAUNCH_KEY = 'first_launch';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isFirstLaunch: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setFirstLaunchComplete: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  updatePassword: (password: string, token?: string) => Promise<void>;
  handleDeepLink: (url: string) => Promise<void>;
  recoveryToken: string | null;
  recoveryRefreshToken: string | null;
  clearRecoveryToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [recoveryRefreshToken, setRecoveryRefreshToken] = useState<string | null>(null);
  const [isPasswordResetting, setIsPasswordResetting] = useState<boolean>(false);

  // Google認証の設定（iOS用、Supabase連携でwebClientIdも必要）
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // iOSでは実際にiOSクライアントIDが使用されるため、設定を統一
    clientId: Platform.OS === 'ios' 
      ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID 
      : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // 認証エラー処理関数
  const handleAuthError = async () => {
    console.log('Handling auth error - clearing session and redirecting to login');
    
    // ローカル状態をクリア
    setSession(null);
    setUser(null);
    
    // AsyncStorageから認証データを削除
    try {
      await AsyncStorage.multiRemove([
        AUTH_STATE_KEY,
        'supabase.auth.token',
        'sb-auth-token',
        '@supabase/auth-js'
      ]);
      
      // Android向けの追加クリーンアップ
      if (Platform.OS === 'android') {
        const allKeys = await AsyncStorage.getAllKeys();
        const authKeys = allKeys.filter(key => 
          key.includes('auth') || 
          key.includes('supabase') || 
          key.includes('session') ||
          key.includes('token')
        );
        
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
        }
      }
    } catch (error) {
      console.warn('Error clearing auth storage:', error);
    }
  };

  // 初回起動かどうかを確認
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        setIsFirstLaunch(value === null);
      } catch (error) {
        console.error('Error checking first launch status:', error);
        setIsFirstLaunch(true);
      }
    };
    checkFirstLaunch();
  }, []);

  // セッションの取得と認証状態の監視
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);

        // セッションの取得
        const { data, error } = await auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          
          // リフレッシュトークンエラーの場合は自動的にサインアウト
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('AuthApiError')) {
            await handleAuthError();
            return;
          }
          
          throw error;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);

                // 認証状態の変更を監視
        const { data: authListener } = auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            console.log('Auth state changed:', event, session?.user?.id || 'no user');
            
            // パスワードリセット中は一時的なセッション変更を無視
            if (isPasswordResetting && event === 'SIGNED_IN') {
              console.log('Password reset in progress, ignoring temporary session change');
              return;
            }
            
            setSession(session);
            setUser(session?.user ?? null);
            
            // Google認証成功時の特別処理
            if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'google') {
              console.log('Google authentication completed successfully');
            }
            
            // トークンリフレッシュに失敗した場合やサインアウトイベント
            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              console.log('Auth session lost, clearing state');
              await handleAuthError();
            }
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
              } catch (error) {
          console.error('Error loading auth session:', error);
          
          // 認証エラーの場合は自動的にクリーンアップ
          if (error instanceof Error && (
              error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('AuthApiError'))) {
            await handleAuthError();
          }
        } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Google認証レスポンスの処理
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
    }
  }, [response]);

  // Google認証トークンの処理
  const handleGoogleToken = async (idToken: string) => {
    try {
      console.log('Attempting to sign in with Google ID token');
      
      const { error } = await auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Supabase Google auth error:', error);
        throw error;
      }
      
      console.log('Google authentication successful');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error; // エラーを再投げして上位で処理できるようにする
    }
  };

  // メール/パスワードでサインアップ
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await auth.signUp({ email, password });
      if (error) {
        const translatedError = new Error(translateAuthError(error));
        throw translatedError;
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Supabaseエラーメッセージを日本語に変換する関数
  const translateAuthError = (error: any): string => {
    if (!error) return 'ログインに失敗しました';
    
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    
    // メール未確認エラー
    if (errorMessage.includes('Email not confirmed') || errorCode === 'email_not_confirmed') {
      return 'メールアドレスの確認が完了していません。\n\n登録時に送信された確認メールをご確認いただき、メール内のリンクをクリックしてメールアドレスを確認してください。\n\n確認メールが見つからない場合は、迷惑メールフォルダもご確認ください。';
    }
    
    // パスワード間違い・ユーザー不存在
    if (errorMessage.includes('Invalid login credentials') || 
        errorMessage.includes('Invalid credentials') ||
        errorMessage.includes('Email not found') ||
        errorCode === 'invalid_credentials') {
      return 'メールアドレスまたはパスワードが正しくありません。\n\n入力内容をご確認の上、再度お試しください。';
    }
    
    // アカウントロック・レート制限
    if (errorMessage.includes('too many requests') || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('For security purposes') ||
        errorMessage.includes('wait') ||
        errorCode === 'too_many_requests') {
      return 'リクエスト回数が上限に達しました。\n\nセキュリティ上の理由により、しばらく時間をおいてから再度お試しください。';
    }
    
    // パスワード強度不足（サインアップ時）
    if (errorMessage.includes('Password should be at least') ||
        errorMessage.includes('weak password')) {
      return 'パスワードが要件を満たしていません。\n\n8文字以上で、大文字・小文字・数字を含むパスワードを設定してください。';
    }
    
    // メールアドレス形式エラー
    if (errorMessage.includes('Invalid email') || 
        errorMessage.includes('email format') ||
        errorCode === 'invalid_email') {
      return 'メールアドレスの形式が正しくありません。\n\n正しいメールアドレスを入力してください。';
    }
    
    // ネットワークエラー
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorCode === 'network_error') {
      return 'ネットワークエラーが発生しました。\n\nインターネット接続を確認の上、再度お試しください。';
    }
    
    // その他のエラー
    return 'ログインに失敗しました。\n\n問題が続く場合は、しばらく時間をおいてから再度お試しください。';
  };

  // メール/パスワードでサインイン
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await auth.signInWithPassword({ email, password });
      if (error) {
        const translatedError = new Error(translateAuthError(error));
        throw translatedError;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Googleでサインイン
  const signInWithGoogle = async () => {
    try {
      // 環境変数の確認
      if (!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID && !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        throw new Error('Google認証の設定が不完全です。環境変数を確認してください。');
      }
      
      console.log('Initiating Google OAuth flow');
      await promptAsync();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Appleでサインイン
  const signInWithApple = async () => {
    try {
      if (Platform.OS === 'ios') {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (credential.identityToken) {
          const { error } = await auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          });

          if (error) throw error;
        }
      } else {
        throw new Error('Apple Sign In is only available on iOS devices');
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Error signing in with Apple:', error);
        throw error;
      }
    }
  };

  // サインアウト（Android Expo Go対応版）
  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // 1. Supabaseからのサインアウト
      const { error } = await auth.signOut();
      if (error && !error.message.includes('Auth session missing')) {
        console.error('Supabase signOut error:', error);
      }
      
      // 2. ローカル状態を即座にクリア
      setSession(null);
      setUser(null);
      
      // 3. AsyncStorageから全ての認証関連データを削除
      await AsyncStorage.multiRemove([
        AUTH_STATE_KEY,
        'supabase.auth.token', // Supabaseのデフォルトキー
        'sb-auth-token', // 代替キー
        '@supabase/auth-js',  // ライブラリのキー
      ]);
      
      // 4. Android Expo Go専用: さらに徹底的なクリア
      if (Platform.OS === 'android') {
        try {
          // 全てのストレージキーを取得して認証関連のものを削除
          const allKeys = await AsyncStorage.getAllKeys();
          const authKeys = allKeys.filter(key => 
            key.includes('auth') || 
            key.includes('supabase') || 
            key.includes('session') ||
            key.includes('token')
          );
          
          if (authKeys.length > 0) {
            await AsyncStorage.multiRemove(authKeys);
            console.log('Cleared additional auth keys:', authKeys);
          }
        } catch (error) {
          console.warn('Error clearing additional storage:', error);
        }
      }
      
      // 5. AuthClientを強制的にリセット
      try {
        // 新しい空のセッションを強制設定
        await auth.setSession({
          access_token: '',
          refresh_token: '',
        });
      } catch (resetError) {
        console.warn('Session reset error (expected):', resetError);
      }
      
      console.log('Sign out completed');
      
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // エラーが発生してもローカル状態はクリア
      setSession(null);
      setUser(null);
      
      throw error;
    }
  };

  // パスワードリセットメールの送信
  const resetPassword = async (email: string) => {
    try {
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: 'clothesmanagerapp://auth/callback?type=recovery',
      });
      if (error) {
        const translatedError = new Error(translateAuthError(error));
        throw translatedError;
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  // メール確認の再送信
  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) {
        const translatedError = new Error(translateAuthError(error));
        throw translatedError;
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      throw error;
    }
  };

  // パスワードの更新
  const updatePassword = async (password: string, token?: string) => {
    try {
      console.log('Password update started');
      
      // パスワードリセット中フラグを設定
      setIsPasswordResetting(true);
      
      // recoveryTokenを使用（パラメータのtokenまたはコンテキストのrecoveryToken）
      const activeToken = token || recoveryToken;
      
      if (!activeToken) {
        throw new Error('認証トークンが見つかりません。パスワードリセットリンクを再度クリックしてください。');
      }
      
      // recovery用のaccess_tokenとrefresh_tokenでセッションを設定
      const { data: sessionData, error: sessionError } = await auth.setSession({
        access_token: activeToken,
        refresh_token: recoveryRefreshToken || ''
      });
      
      if (sessionError) {
        console.error('Session setup error:', sessionError);
        
        // トークンの有効期限切れやトークンが無効な場合
        if (sessionError.message?.includes('expired') || 
            sessionError.message?.includes('invalid') ||
            sessionError.message?.includes('Token has expired') ||
            sessionError.message?.includes('Invalid token')) {
          throw new Error('パスワードリセットリンクの有効期限が切れています。新しいリセットリンクを取得してください。');
        }
        
        throw new Error(`セッションの設定に失敗しました: ${sessionError.message}`);
      }
      
      // セッション設定後、パスワードを更新
      const { data, error } = await auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error('Password update error:', error);
        
        // トークンの有効期限切れやトークンが無効な場合
        if (error.message?.includes('expired') || 
            error.message?.includes('invalid') ||
            error.message?.includes('Token has expired') ||
            error.message?.includes('Invalid token')) {
          throw new Error('パスワードリセットリンクの有効期限が切れています。新しいリセットリンクを取得してください。');
        }
        
        // その他のエラー
        throw new Error(`パスワードの更新に失敗しました: ${error.message}`);
      }
      
      console.log('Password update successful');
      
      // 成功したらrecoveryTokenをクリア
      setRecoveryToken(null);
      setRecoveryRefreshToken(null);
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      throw error;
    } finally {
      // パスワードリセット中フラグをクリア
      setIsPasswordResetting(false);
    }
  };

  // ディープリンクの処理
  const handleDeepLink = async (url: string) => {
    try {
      if (!url) {
        return;
      }

      console.log('Processing deep link:', url);

      const parsedUrl = new URL(url);

      // URLパラメータとハッシュフラグメントの両方からパラメータを取得
      let token = parsedUrl.searchParams.get('token');
      let access_token = parsedUrl.searchParams.get('access_token');
      let token_hash = parsedUrl.searchParams.get('token_hash');
      let type = parsedUrl.searchParams.get('type');

      // ハッシュフラグメントからもパラメータを取得（Supabaseの認証はこちらを使用）
      if (parsedUrl.hash) {
        const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
        
        // ハッシュからパラメータを取得（存在しない場合は既存値を保持）
        token = token || hashParams.get('token');
        access_token = access_token || hashParams.get('access_token');
        token_hash = token_hash || hashParams.get('token_hash');
        type = type || hashParams.get('type');
        
        // エラー情報も取得
        const error = hashParams.get('error');
        const error_code = hashParams.get('error_code');
        const error_description = hashParams.get('error_description');
        
        // エラーが存在する場合は処理を中断
        if (error) {
          console.log('Authentication error in deep link:', { error, error_code, error_description });
          // エラーの場合はcallback.tsxに処理を委ねる
          return;
        }
      }

      // トークンまたはaccess_tokenのいずれかが存在する場合に処理を続行
      const hasValidToken = token || access_token || token_hash;
      
      if (hasValidToken && type) {
        // トークンの種類に応じて処理
        if (type === 'signup') {
          console.log('Processing signup confirmation');
          console.log('Available tokens:', { access_token: !!access_token, token_hash: !!token_hash, token: !!token });
          
          // メールアドレス確認の処理 - 新しいSupabaseバージョンではaccess_tokenを使用
          if (access_token) {
            const refresh_token = parsedUrl.hash ? new URLSearchParams(parsedUrl.hash.substring(1)).get('refresh_token') : null;
            
            console.log('Setting session with access_token');
            const { error } = await auth.setSession({
              access_token: access_token,
              refresh_token: refresh_token || ''
            });
            
            if (error) {
              console.error('Signup verification error:', error);
              throw error;
            }
            
            console.log('Signup confirmation successful, redirecting to home');
            // 処理が成功した場合はreturnして重複処理を避ける
            return;
          } else {
            // 古いバージョンの処理（fallback）
            const verifyToken = token_hash || token;
            if (verifyToken) {
              console.log('Using verifyOtp with token:', verifyToken);
              const { error } = await auth.verifyOtp({
                token_hash: verifyToken,
                type: 'email',
              });
              if (error) {
                console.error('Signup verification error:', error);
                throw error;
              }
            } else {
              console.error('No valid token found for signup verification');
              console.error('Debug - URL:', url);
              console.error('Debug - parsedUrl.hash:', parsedUrl.hash);
            }
          }
        } else if (type === 'recovery') {
          console.log('Processing password recovery');
          // パスワードリセットの場合は、access_tokenとrefresh_tokenを保存
          const recoveryAccessToken = access_token || token;
          const refreshToken = parsedUrl.hash ? new URLSearchParams(parsedUrl.hash.substring(1)).get('refresh_token') : null;
          
          if (recoveryAccessToken) {
            setRecoveryToken(recoveryAccessToken);
          }
          
          if (refreshToken) {
            setRecoveryRefreshToken(refreshToken);
          }
          
          return;
        }
      }
      
    } catch (error) {
      console.error('Error handling deep link:', error);
      throw error;
    }
  };

  // 初回起動完了を記録
  const setFirstLaunchComplete = async () => {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error setting first launch status:', error);
    }
  };

  // リカバリートークンをクリア
  const clearRecoveryToken = () => {
    setRecoveryToken(null);
    setRecoveryRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isFirstLaunch,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
        setFirstLaunchComplete,
        resetPassword,
        resendConfirmation,
        updatePassword,
        handleDeepLink,
        recoveryToken,
        recoveryRefreshToken,
        clearRecoveryToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}