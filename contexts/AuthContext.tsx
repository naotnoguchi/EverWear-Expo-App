import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/auth-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
// @ts-ignore - expo-random is provided by Expo runtime
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../lib/authClient';
import { getAuthenticatedClient } from '../lib/dbClient';
import { deleteImage } from '../lib/imageUtils';

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
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'link') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setFirstLaunchComplete: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string, type?: 'signup' | 'link') => Promise<void>;
  updatePassword: (password: string, token?: string) => Promise<void>;
  handleDeepLink: (url: string) => Promise<void>;
  recoveryToken: string | null;
  recoveryRefreshToken: string | null;
  clearRecoveryToken: () => void;
  deleteAccount: () => Promise<void>;
  getAuthProvider: () => 'email' | 'google' | 'apple' | 'anonymous' | 'unknown';
  getUserInfo: () => { provider: string; email: string | null; createdAt: string | null };
  // 匿名ログイン関連の追加
  signInAnonymously: () => Promise<void>;
  isAnonymous: boolean;
  linkIdentity: (email: string, password: string) => Promise<void>;
  startEmailLinking: (email: string) => Promise<void>;
  setPasswordForLinkedAccount: (password: string) => Promise<void>;
  linkGoogleIdentity: () => Promise<void>;
  resetAnonymousData: () => Promise<void>;
  // 一時パスワード保持（匿名→メール紐付け用）
  setTempLinkPassword: (pwd: string | null) => void;
  tempLinkPassword: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider: Component mounting/re-mounting');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [recoveryRefreshToken, setRecoveryRefreshToken] = useState<string | null>(null);
  // 一時的なパスワード保存は不要になったため削除

  const [isPasswordResetting, setIsPasswordResetting] = useState<boolean>(false);

  // 匿名ユーザー判定
  const isAnonymous = React.useMemo(() => {
    return user?.is_anonymous === true;
  }, [user]);

  // Google認証の設定（iOS用、Supabase連携でwebClientIdも必要）
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  // 匿名→メール紐付け時の一時パスワード
  const tempLinkPasswordRef = React.useRef<string | null>(null);

  const setTempLinkPassword = (pwd: string | null) => {
    tempLinkPasswordRef.current = pwd;
  };

  // 認証エラー処理関数
  const handleAuthError = async () => {
    console.log('handleAuthError: Starting auth error handling');

    // ローカル状態をクリア
    console.log('handleAuthError: Clearing session and user state');
    setSession(null);
    setUser(null);
    console.log('handleAuthError: Setting loading to false');
    setLoading(false); // ローディング状態を確実にクリア

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
    let cleanup: (() => void) | undefined;
    let isHandlingAuthError = false;
    let loadSessionCallCount = 0;

    const loadSession = async () => {
      loadSessionCallCount++;
      setLoading(true);

      try {
        const { data, error } = await auth.getSession();

        if (error) {
          console.error('Auth session error:', error);
          if (error.message?.includes('Invalid Refresh Token') ||
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('AuthApiError')) {
            if (!isHandlingAuthError) {
              isHandlingAuthError = true;
              await handleAuthError();
            }
            return;
          }
          throw error;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);

        const { data: authListener } = auth.onAuthStateChange(async (event, session) => {
          console.log('=== AUTH STATE CHANGE ===');
          console.log('Event:', event);
          console.log('Session exists:', !!session);
          console.log('User exists:', !!session?.user);
          console.log('User email:', session?.user?.email);
          console.log('User is_anonymous:', session?.user?.is_anonymous);
          console.log('=======================');
          
          setSession(session);
          setUser(session?.user ?? null);

          if ((event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) && !isHandlingAuthError) {
            isHandlingAuthError = true;
            await handleAuthError();
          }
        });

        cleanup = () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error loading auth session:', error);
        if (error instanceof Error && (
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('AuthApiError'))) {
          if (!isHandlingAuthError) {
            isHandlingAuthError = true;
            await handleAuthError();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // Google認証レスポンスの処理
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params as any;
      handleGoogleToken(id_token, access_token);
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
    }
  }, [response]);

  // Google認証トークンの処理
  const handleGoogleToken = async (idToken: string, accessToken?: string) => {
    try {
      console.log('Attempting to sign in with Google ID token');

      const { error } = await auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        access_token: accessToken,
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

    // トークン期限切れ・無効エラーの処理を追加
    if (errorMessage.includes('Token has expired') || 
        errorMessage.includes('Invalid token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorCode === 'token_expired' ||
        errorCode === 'invalid_token') {
      return '確認コードの有効期限が切れているか、無効です。\n\n「確認コードを再送信」ボタンを押して、新しいコードを取得してください。';
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

    // 同一パスワードエラー（匿名ユーザーの紐付け時）
    if (errorMessage.includes('New password should be different from the old password')) {
      return '別のパスワードを入力してください。\n\n現在のパスワードと異なるパスワードを設定する必要があります。';
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
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        throw new Error('Google認証の設定が不完全です。環境変数を確認してください。');
      }

      console.log('Initiating Google OAuth flow');
      await promptAsync();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // -------------------------
  // Utility helpers (Apple Sign-In)
  // -------------------------

  // ランダムな英数字32文字（Apple 推奨）の nonce を生成
  const generateRandomNonce = (length: number = 32): string => {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    const randomBytes = Crypto.getRandomBytes(length);
    let result = '';
    randomBytes.forEach((b: number) => (result += charset[b % charset.length]));
    return result;
  };

  // SHA-256 でハッシュ化（16進文字列）
  const sha256Async = async (value: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      value,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  };

  // Appleでサインイン
  const signInWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS devices');
      }

      // 1️⃣ nonce を生成
      const rawNonce = generateRandomNonce();
      const hashedNonce = await sha256Async(rawNonce);

      // 2️⃣ Apple 認証モーダルを表示
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // 3️⃣ Supabase へ ID トークン + nonce を送信
      if (credential.identityToken) {
        const { error } = await auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce,
        });

        if (error) throw error;
      } else {
        throw new Error('Failed to obtain identity token from Apple credential');
      }
    } catch (error: any) {
      // ユーザーキャンセルは無視
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
  const resendConfirmation = async (email: string, type?: 'signup' | 'link') => {
    try {
      // 匿名ユーザーのメール紐付けの場合は 'email_change' タイプを使用
      const resendType = type === 'link' ? 'email_change' : 'signup';
      const { error } = await auth.resend({
        type: resendType,
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

  // OTP検証
  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'link') => {
    try {
      console.log('=== OTP VERIFY DEBUG ===');
      console.log('verifyOtp called with:', { email, token: token.length, type });
      console.log('Before OTP verify - user:', !!user, 'isAnonymous:', isAnonymous);
      console.log('Before OTP verify - user email:', user?.email);

      // 匿名ユーザーのメール紐付けの場合は 'email_change' タイプを使用
      // （auth.updateUser でメールアドレスを設定した際に発行される OTP は email_change 用のため）
      const otpType = type === 'link' ? 'email_change' : type;
      console.log('Using OTP type:', otpType);

      const { data, error } = await auth.verifyOtp({
        email: email,
        token: token,
        type: otpType as 'signup' | 'recovery' | 'email_change',
      });

      if (error) {
        console.error('Verify OTP error details:', {
          message: error.message,
          code: error.code,
          status: error.status
        });
        throw new Error(translateAuthError(error));
      }

      console.log('OTP verify successful - data:', data);
      console.log('After OTP verify - user:', !!user, 'isAnonymous:', isAnonymous);
      console.log('After OTP verify - user email:', user?.email);
      console.log('========================');

      // パスワードリセットの場合、セッションを作成せずにトークンを保存
      if (type === 'recovery' && data.session) {
        console.log('Password recovery OTP verified, storing tokens');

        setRecoveryToken(data.session.access_token);
        setRecoveryRefreshToken(data.session.refresh_token);

        // セッションを保持せずにトークンのみ保存
        // signOutは呼ばずに、状態管理でセッションをクリア
        setSession(null);
        setUser(null);
      } else if (type === 'recovery') {
        console.error('Recovery OTP verified but no session data received');
      } else if (type === 'link') {
        console.log('Anonymous user email verification successful');
        // 段階的入力方式では、OTP検証後にパスワード設定画面に遷移するため、ここでは何もしない
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
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

      console.log('Setting up session for password update');

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

      console.log('Session setup successful, updating password');

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
        if (type === 'link' && access_token) {
          console.log('Processing identity link callback');
          
          // URLから refresh_token を取得
          const refresh_token = parsedUrl.hash ? new URLSearchParams(parsedUrl.hash.substring(1)).get('refresh_token') : null;
          
          const { error } = await auth.setSession({
            access_token: access_token,
            refresh_token: refresh_token || '',
          });
          if (error) {
            console.error('Link callback session error:', error);
            throw error;
          }
          console.log('Identity link completed successfully');
          return;
        } else if (type === 'signup') {
          console.log('Processing signup confirmation');
          console.log('Available tokens:', { access_token: !!access_token, token_hash: !!token_hash, token: !!token });

          // メールアドレス確認の処理 - 新しいSupabaseバージョンではaccess_tokenを使用
          if (access_token) {
            const refresh_token = parsedUrl.hash ? new URLSearchParams(parsedUrl.hash.substring(1)).get('refresh_token') : null;

            console.log('Setting session with access_token');
            const { error } = await auth.setSession({
              access_token: access_token,
              refresh_token: refresh_token || '',
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

  // アカウント削除
  const deleteAccount = async () => {
    try {
      if (!user?.id) {
        throw new Error('ユーザーが認証されていません');
      }

      // アクセストークンを取得
      const { data: sessionData } = await auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('トークン取得に失敗しました');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const fnUrl = `${supabaseUrl}/functions/v1/delete-user-account`;

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`アカウント削除に失敗しました: ${txt}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error('アカウント削除に失敗しました');
      }
      const deletedImagePaths: string[] = json.detail?.[0]?.deleted_image_paths || [];

      // 画像ファイルを削除
      for (const imagePath of deletedImagePaths) {
        if (imagePath && imagePath.includes('supabase')) {
          try {
            await deleteImage(imagePath);
          } catch (imageError) {
            console.error('Error deleting image:', imagePath, imageError);
          }
        }
      }

      // ローカル状態をクリア
      setSession(null);
      setUser(null);
      await handleAuthError();
      console.log('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  // 匿名ログイン
  const signInAnonymously = async () => {
    try {
      console.log('Starting anonymous sign in');
      const { error } = await auth.signInAnonymously();
      if (error) {
        console.error('Anonymous sign in error:', error);
        throw error;
      }
      console.log('Anonymous sign in successful');
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  // 匿名ユーザーから本アカウントへの紐付け（後方互換性のため）
  const linkIdentity = async (email: string, password: string) => {
    try {
      if (!isAnonymous) {
        throw new Error('匿名ユーザーではありません');
      }

      console.log('Starting identity linking');
      const { error } = await auth.updateUser({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Identity linking error:', error);
        throw new Error(translateAuthError(error));
      }

      console.log('Identity linking successful');
    } catch (error) {
      console.error('Error linking identity:', error);
      throw error;
    }
  };

  // メール認証への紐付け開始（段階1: メール設定とOTP送信）
  const startEmailLinking = async (email: string) => {
    try {
      if (!isAnonymous) {
        throw new Error('匿名ユーザーではありません');
      }

      console.log('Starting email linking process (step 1: email setup)');

      // 段階1: メールアドレスのみを設定（パスワードは後で設定）
      const { error } = await auth.updateUser({
        email: email
        // パスワードは意図的に設定しない - OTP検証後に設定
      });

      if (error) {
        console.error('Email linking error:', error);
        throw new Error(translateAuthError(error));
      }

      console.log('Email linking initiated, OTP verification required');
    } catch (error) {
      console.error('Error starting email linking:', error);
      throw error;
    }
  };

  // Googleアカウントを匿名ユーザーにリンク
  const linkGoogleIdentity = async () => {
    try {
      if (!isAnonymous) throw new Error('匿名ユーザーではありません');

      console.log('Starting Google identity linking (linkIdentity)');

      // Supabase からリンク用 URL を取得
      const redirectTo = 'clothesmanagerapp://auth/callback?type=link';
      const { data, error } = await auth.linkIdentity({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('linkIdentity から URL を取得できませんでした');

      // ブラウザで OAuth フローを開始
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'dismiss') {
        throw new Error('Google認証がキャンセルされました');
      }

      // Deep-link URL を手動で処理する
      if (result.type === 'success' && result.url) {
        console.log('Handling deep link after Google identity linking');
        await handleDeepLink(result.url);
        console.log('Google identity linking flow completed successfully');
      } else {
        throw new Error('Google認証フローが正常に完了しませんでした');
      }
    } catch (err) {
      console.error('Error linking Google identity:', err);
      throw err;
    }
  };

  // 匿名ユーザーのメール紐付け完了後のパスワード設定
  const setPasswordForLinkedAccount = async (password: string) => {
    try {
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }

      console.log('Setting password for linked account');

      const { error } = await auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password setting error:', error);
        throw new Error(translateAuthError(error));
      }

      console.log('Password set successfully for linked account');
    } catch (error) {
      console.error('Error setting password for linked account:', error);
      throw error;
    }
  };

  // 匿名ユーザーのデータリセット
  const resetAnonymousData = async () => {
    try {
      if (!isAnonymous) {
        throw new Error('匿名ユーザーではありません');
      }

      console.log('Starting anonymous data reset');

      // 1. ユーザーのデータを削除
      if (user?.id) {
        const authClient = await getAuthenticatedClient();
        const { error: deleteError } = await authClient
          .rpc('delete_user_account', { user_id_param: user.id });

        if (deleteError) {
          console.error('Error deleting anonymous user data:', deleteError);
          // データ削除に失敗してもセッションはクリアする
        }
      }

      // 2. セッションをクリア
      await signOut();

      console.log('Anonymous data reset completed');
    } catch (error) {
      console.error('Error resetting anonymous data:', error);
      throw error;
    }
  };

  // 認証プロバイダーの取得
  const getAuthProvider = (): 'email' | 'google' | 'apple' | 'anonymous' | 'unknown' => {
    if (!user) return 'unknown';

    if (user.is_anonymous) return 'anonymous';

    // identitiesから最初のプロバイダーを取得
    const provider = user.identities?.[0]?.provider || user.app_metadata?.provider;

    switch (provider) {
      case 'email':
        return 'email';
      case 'google':
        return 'google';
      case 'apple':
        return 'apple';
      default:
        return 'unknown';
    }
  };

  // デバッグ用：ユーザー状態をログ出力
  const debugUserState = React.useCallback(() => {
    console.log('=== User State Debug ===');
    console.log('User ID:', user?.id);
    console.log('Email:', user?.email);
    console.log('Is Anonymous:', isAnonymous);
    console.log('Provider:', getAuthProvider());
    console.log('Session exists:', !!session);
    console.log('Loading:', loading);
    console.log('========================');
  }, [user, isAnonymous, session, loading]);

  // ユーザー状態変更時にデバッグログを出力（開発環境のみ）
  React.useEffect(() => {
    if (__DEV__) {
      debugUserState();
    }
  }, [debugUserState]);

  // ユーザー情報の取得
  const getUserInfo = () => {
    if (!user) {
      return {
        provider: 'unknown',
        email: null,
        createdAt: null
      };
    }

    const provider = getAuthProvider();
    const providerNames = {
      email: 'メール/パスワード',
      google: 'Google',
      apple: 'Apple',
      anonymous: 'ゲスト',
      unknown: '不明'
    };

    return {
      provider: providerNames[provider],
      email: user.email || null,
      createdAt: user.created_at || null
    };
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
        verifyOtp,
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
        deleteAccount,
        getAuthProvider,
        getUserInfo,
        // 匿名ログイン関連
        signInAnonymously,
        isAnonymous,
        linkIdentity,
        startEmailLinking,
        setPasswordForLinkedAccount,
        linkGoogleIdentity,
        resetAnonymousData,
        // 一時パスワード
        setTempLinkPassword,
        tempLinkPassword: tempLinkPasswordRef.current,
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
