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

  const isPremium = subscription.isActive;

  // Revenue Cat初期化
  useEffect(() => {
    if (user?.id) {
      initializePurchases();
    }
  }, [user?.id]);

  const initializePurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      // Revenue Cat設定
      await purchaseService.configure(user!.id);

      // 現在のサブスクリプション状態を取得
      await refreshSubscription();

      // オファリング情報を取得
      await loadOfferings();

    } catch (err) {
      console.error('Error initializing purchases:', err);
      setError(err instanceof Error ? err.message : 'Purchase initialization failed');
    } finally {
      setLoading(false);
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
    loading,
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
  const { isPremium } = usePurchase();
  
  return {
    isPremium,
    canAccessPremiumFeatures: () => isPremium,
    canAddMoreItems: (currentCount: number) => isPremium || currentCount < 15,
    canAccessStatistics: () => isPremium,
    shouldShowAds: () => !isPremium,
  };
} 