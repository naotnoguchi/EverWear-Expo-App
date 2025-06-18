import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { purchaseService, SubscriptionInfo } from '../services/purchaseService';
import { useAuth } from './AuthContext';

interface PurchaseContextType {
  subscription: SubscriptionInfo;
  offerings: PurchasesOffering[];
  loading: boolean;
  error: string | null;
  isPremium: boolean;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

interface PurchaseProviderProps {
  children: ReactNode;
}

export function PurchaseProvider({ children }: PurchaseProviderProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: false,
    productId: null,
    expirationDate: null,
    purchaseDate: null,
    isTrialPeriod: false,
  });
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true); // 初期化中フラグを追加

  // 初期化が完了するまではプレミアム制限を適用しない（フラッシュを防ぐため）
  const isPremium = initializing ? true : subscription.isActive;

  // Revenue Cat初期化
  useEffect(() => {
    if (user?.id) {
      initializePurchases();
    }
  }, [user?.id]);

  // 開発環境では定期的にサブスクリプション状態をチェック（短期間テスト用）
  useEffect(() => {
    if (!__DEV__ || !subscription.isActive || !subscription.expirationDate) {
      return;
    }

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const expiration = subscription.expirationDate!.getTime();
      const timeUntilExpiration = expiration - now;

      // 期限まで1分以内の場合、30秒ごとにチェック
      if (timeUntilExpiration <= 60000 && timeUntilExpiration > 0) {
        console.log('Subscription expiring soon, refreshing status...');
        refreshSubscription();
      }
      // 期限切れの場合、即座にチェック
      else if (timeUntilExpiration <= 0) {
        console.log('Subscription may have expired, refreshing status...');
        refreshSubscription();
        clearInterval(checkInterval);
      }
    }, 30000); // 30秒ごとにチェック

    return () => clearInterval(checkInterval);
  }, [subscription.isActive, subscription.expirationDate]);

  const initializePurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      // Revenue Cat設定
      await purchaseService.configure(user!.id);

      // サンドボックス環境では自動的に購入履歴を復元（他の処理より先に実行）
      if (__DEV__) {
        console.log('Development mode: attempting to restore purchases');
        try {
          await purchaseService.restorePurchases();
        } catch (restoreError) {
          console.log('Restore failed (this is normal if no previous purchases):', restoreError);
        }
      }

      // RevenueCatのリクエストを順次実行（同時実行を避ける）
      await refreshSubscription();
      await loadOfferings();

    } catch (err) {
      console.error('Error initializing purchases:', err);
      setError(err instanceof Error ? err.message : 'Purchase initialization failed');
    } finally {
      setLoading(false);
      setInitializing(false); // 初期化完了をマーク
    }
  };

  const refreshSubscription = async () => {
    try {
      const subscriptionInfo = await purchaseService.getCurrentSubscription();
      console.log('Subscription info refreshed:', {
        isActive: subscriptionInfo.isActive,
        productId: subscriptionInfo.productId,
        expirationDate: subscriptionInfo.expirationDate,
        purchaseDate: subscriptionInfo.purchaseDate,
        // 開発環境では期限までの残り時間も表示
        ...__DEV__ && subscriptionInfo.expirationDate && {
          timeUntilExpiration: subscriptionInfo.expirationDate.getTime() - Date.now(),
          timeUntilExpirationMinutes: Math.round((subscriptionInfo.expirationDate.getTime() - Date.now()) / 60000)
        }
      });
      setSubscription(subscriptionInfo);
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription');
    }
  };

  const loadOfferings = async () => {
    try {
      const offeringsData = await purchaseService.getOfferings();
      setOfferings(offeringsData);
    } catch (err) {
      console.error('Error loading offerings:', err);
      // オファリングの取得失敗は致命的ではないためエラー状態は設定しない
    }
  };

  const handlePurchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setLoading(true);
      setError(null);

      await purchaseService.purchasePackage(packageToPurchase);
      
      // 購入後にサブスクリプション状態を更新
      await refreshSubscription();

    } catch (err) {
      console.error('Error purchasing package:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed');
      throw err; // 呼び出し元でエラーハンドリングできるように再スロー
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      await purchaseService.restorePurchases();
      
      // リストア後にサブスクリプション状態を更新
      await refreshSubscription();

    } catch (err) {
      console.error('Error restoring purchases:', err);
      setError(err instanceof Error ? err.message : 'Restore failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: PurchaseContextType = {
    subscription,
    offerings,
    loading: loading || initializing, // 初期化中もローディング状態として扱う
    error,
    isPremium,
    purchasePackage: handlePurchasePackage,
    restorePurchases: handleRestorePurchases,
    refreshSubscription,
  };

  return (
    <PurchaseContext.Provider value={contextValue}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase(): PurchaseContextType {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
}

// プレミアム機能の制限チェック用フック
export function usePremiumFeatures() {
  const { isPremium, loading } = usePurchase();
  
  return {
    isPremium,
    loading, // ローディング状態も提供
    canAccessPremiumFeatures: () => isPremium,
    canAddMoreItems: (currentCount: number) => isPremium || currentCount < 15,
    canAccessStatistics: () => isPremium,
    shouldShowAds: () => !isPremium && !loading, // 初期化中は広告も表示しない
  };
} 