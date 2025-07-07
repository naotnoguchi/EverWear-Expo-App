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
  refreshOfferings: () => Promise<void>;
  clearError: () => void;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

interface PurchaseProviderProps {
  children: ReactNode;
}

export function PurchaseProvider({ children }: PurchaseProviderProps) {
  const { user, isAnonymous } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: false,
    productId: null,
    expirationDate: null,
    originalPurchaseDate: null,
    latestPurchaseDate: null,
    isTrialPeriod: false,
  });
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true); // 初期化中フラグを追加

  // 匿名ユーザーはプレミアム機能を利用できない
  const isPremium = initializing ? false : (isAnonymous ? false : subscription.isActive);

  // Revenue Cat初期化 - 匿名ユーザーは初期化しない
  useEffect(() => {
    if (user?.id && !isAnonymous) {
      // 通常ユーザーの場合のみ初期化を実行
      initializePurchases();
    } else {
      // ログアウトまたは匿名ユーザーの場合は状態をリセット
      setOfferings([]);
      setSubscription({
        isActive: false,
        productId: null,
        expirationDate: null,
        originalPurchaseDate: null,
        latestPurchaseDate: null,
        isTrialPeriod: false,
      });
      setInitializing(false);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, isAnonymous]);

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
      setInitializing(true); // 初期化開始をマーク

      // Revenue Cat設定
      await purchaseService.configure(user!.id);

      // サンドボックス環境では自動的に購入履歴を復元（他の処理より先に実行）
      if (__DEV__) {
        try {
          await purchaseService.restorePurchases();
        } catch (restoreError) {
          // 購入履歴がない、あるいはキャンセルされた場合は無視
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
      setSubscription(subscriptionInfo);
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription');
    }
  };

  const loadOfferings = async () => {
    try {
      console.log('Loading offerings...');
      const offeringsData = await purchaseService.getOfferings();
      setOfferings(offeringsData);
      console.log('Offerings loaded successfully:', offeringsData.length, 'offerings');
      
      // オファリング内のパッケージ情報もログ出力
      offeringsData.forEach((offering, index) => {
        console.log(`Offering ${index + 1}:`, offering.identifier, 'packages:', offering.availablePackages.length);
      });
    } catch (err) {
      console.error('Error loading offerings:', err);
      // オファリングの取得失敗は致命的ではないためエラー状態は設定しない
      // ただし、空の配列を設定して状態を明確にする
      setOfferings([]);
    }
  };

  // オファリング情報を再取得する関数を追加
  const refreshOfferings = async () => {
    try {
      console.log('Refreshing offerings...');
      setError(null);
      await loadOfferings();
    } catch (err) {
      console.error('Error refreshing offerings:', err);
    }
  };

  const handlePurchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setLoading(true);
      setError(null);

      await purchaseService.purchasePackage(packageToPurchase);
      
      // 購入後にサブスクリプション状態を更新
      await refreshSubscription();

    } catch (err: any) {
      console.error('Error purchasing package:', err);
      
      // キャンセルエラーの場合は error 状態を設定しない（通常UIを維持）
      const isCancelledError = err?.userCancelled === true || 
                              (err instanceof Error && err.message === 'Purchase was cancelled.');
      
      if (!isCancelledError) {
        setError(err instanceof Error ? err.message : 'Purchase failed');
      }
      
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

    } catch (err: any) {
      console.error('Error restoring purchases:', err);
      
      // キャンセルエラーの場合は error 状態を設定しない（通常UIを維持）
      const isCancelledError = err?.userCancelled === true || 
                              (err instanceof Error && err.message === 'Purchase was cancelled.');
      
      if (!isCancelledError) {
        setError(err instanceof Error ? err.message : 'Restore failed');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
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
    refreshOfferings,
    clearError,
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
  const { isAnonymous } = useAuth();
  
  return {
    isPremium,
    loading,
    canAccessPremiumFeatures: () => !isAnonymous && isPremium,
    canAddMoreItems: (currentCount: number) => isPremium || currentCount < 5, // 匿名/無料共に5件制限
    canAccessStatistics: () => true, // 統計機能は匿名ユーザーも利用可能
    shouldShowAds: () => !isPremium && !loading,
  };
}

// Stub 用など他コンポーネントから直接 Context を参照できるようにエクスポート
export { PurchaseContext, PurchaseContextType };
