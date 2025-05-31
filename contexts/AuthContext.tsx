import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../lib/authClient';
import { User, Session, AuthChangeEvent } from '@supabase/auth-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);

  // Google認証の設定
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

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
        if (error) throw error;

        setSession(data.session);
        setUser(data.session?.user ?? null);

        // 認証状態の変更を監視
        const { data: authListener, error: listenerError } = auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
          }
        );

        if (listenerError) throw listenerError;

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error loading auth session:', error);
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
    }
  }, [response]);

  // Google認証トークンの処理
  const handleGoogleToken = async (idToken: string) => {
    try {
      const { error } = await auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  // メール/パスワードでサインアップ
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // メール/パスワードでサインイン
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Googleでサインイン
  const signInWithGoogle = async () => {
    try {
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
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Error signing in with Apple:', error);
        throw error;
      }
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
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
