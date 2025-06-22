// contexts/StatisticsContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../lib/authClient';
import { BadgeWithStatus, createBadgeService } from '../services/badgeService';
import {
  BasicStats,
  EfficiencyItem,
  ImpactData,
  ItemDetailStats,
  Period,
  RankingItem,
  statisticsService
} from '../services/statisticsServiceFactory';
import { CategoryValue } from '../types/categories';
import { useClothing } from './ClothingContext';
import { usePurchase } from './PurchaseContext';

// 表示済みバッジ通知のキー
const SHOWN_BADGE_NOTIFICATIONS_KEY = 'shown_badge_notifications';

// 新しいバッジ通知の型
interface BadgeNotification {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
}

// コンテキストの型定義（簡素化）
interface StatisticsContextType {
  // 計算済みデータ（常に最新）
  basicStats: BasicStats | null;
  rankingData: RankingItem[];
  efficiencyData: EfficiencyItem[];
  impactData: ImpactData | null;
  badges: BadgeWithStatus[];
  itemDetailStats: Map<string, ItemDetailStats>;

  // バッジ通知
  badgeNotifications: BadgeNotification[];
  clearBadgeNotification: (badgeId: string) => void;

  // 計算状態
  isCalculating: boolean;
  calculationError: string | null;

  // 期間とフィルター設定
  period: Period;
  setPeriod: (period: Period) => void;
  sortOrder: 'most' | 'least';
  setSortOrder: (order: 'most' | 'least') => void;
  categoryFilter: CategoryValue;
  setCategoryFilter: (category: CategoryValue) => void;

  // 手動再計算（エラー時の復旧用）
  recalculateStatistics: () => Promise<void>;
  
  // アイテム詳細統計の取得
  getItemDetailStats: (itemId: string) => Promise<ItemDetailStats | null>;
}

// コンテキストの作成
const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function StatisticsProvider({ children }: { children: React.ReactNode }) {
  // ClothingContextとPurchaseContextからデータを取得
  const { clothingItems, loading: clothingLoading } = useClothing();
  const { isPremium } = usePurchase();

  // clothingItemsから着用・洗濯履歴を抽出
  const wearHistory = useMemo(() => {
    const history: any[] = [];
    clothingItems.forEach(item => {
      item.wearHistory.forEach(date => {
        history.push({
          clothing_item_id: item.id,
          wear_date: date
        });
      });
    });
    return history;
  }, [clothingItems]);

  const washHistory = useMemo(() => {
    const history: any[] = [];
    clothingItems.forEach(item => {
      item.washHistory.forEach(date => {
        history.push({
          clothing_item_id: item.id,
          wash_date: date
        });
      });
    });
    return history;
  }, [clothingItems]);

  // 計算済みデータの状態
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyItem[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [itemDetailStats, setItemDetailStats] = useState<Map<string, ItemDetailStats>>(new Map());

  // バッジ通知
  const [badgeNotifications, setBadgeNotifications] = useState<BadgeNotification[]>([]);

  // 計算状態
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // 期間とフィルター設定
  const [period, setPeriod] = useState<Period>('3months');
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');
  const [categoryFilter, setCategoryFilter] = useState<CategoryValue>(null);

  // 前回のバッジ状態を保持（新しいバッジ検出用）
  const previousBadgesRef = useRef<BadgeWithStatus[]>([]);
  // 表示済みバッジ通知のIDを保持
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());

  // 表示済み通知の読み込み
  const loadShownNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOWN_BADGE_NOTIFICATIONS_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setShownNotificationIds(new Set(ids));
      }
    } catch (error) {
      console.error('Failed to load shown notifications:', error);
    }
  }, []);

  // 表示済み通知の保存
  const saveShownNotifications = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(SHOWN_BADGE_NOTIFICATIONS_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Failed to save shown notifications:', error);
    }
  }, []);

  // バックグラウンドで統計を計算する関数
  const calculateStatisticsInBackground = useCallback(async () => {
    if (clothingLoading || clothingItems.length === 0) {
      return;
    }

    // 認証状態を確認してから統計計算を実行
    const { data: { user } } = await auth.getUser();
    if (!user) {
      // 認証されていない場合は空の状態を設定
      setBasicStats(null);
      setRankingData([]);
      setEfficiencyData([]);
      setImpactData(null);
      setBadges([]);
      previousBadgesRef.current = [];
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // バッジサービスを作成
      const badgeServiceInstance = createBadgeService(user.id);

      // 並列で全ての統計データを計算
      const [
        basicStatsResult,
        rankingDataResult,
        efficiencyDataResult,
        impactDataResult,
        badgesResult,
        newBadgesResult
      ] = await Promise.all([
        statisticsService.getBasicStats(clothingItems, period),
        statisticsService.getRankingData(clothingItems, period, sortOrder, categoryFilter),
        statisticsService.getEfficiencyData(clothingItems, period),
        statisticsService.getImpactData(clothingItems, period),
        badgeServiceInstance.getAllBadgesWithStatus(clothingItems, wearHistory, washHistory, isPremium),
        badgeServiceInstance.checkAndAwardNewBadges(clothingItems, wearHistory, washHistory, isPremium)
      ]);

      // 新しいバッジがある場合は通知を追加（表示済み通知を考慮）
      const newlyEarnedBadges = newBadgesResult.filter(
        badge => !shownNotificationIds.has(badge.id)
      );

      if (newlyEarnedBadges.length > 0) {
        const notifications = newlyEarnedBadges.map(badge => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          iconName: badge.iconName,
          color: badge.color
        }));
        
        setBadgeNotifications(prev => [...prev, ...notifications]);

        // 表示済み通知として記録
        const newShownIds = new Set([...shownNotificationIds, ...newlyEarnedBadges.map(b => b.id)]);
        setShownNotificationIds(newShownIds);
        saveShownNotifications(newShownIds);
      }

      // 状態を更新
      setBasicStats(basicStatsResult);
      setRankingData(rankingDataResult);
      setEfficiencyData(efficiencyDataResult);
      setImpactData(impactDataResult);
      setBadges(badgesResult);

      // 前回のバッジ状態を更新
      previousBadgesRef.current = badgesResult;
    } catch (error) {
      console.error('StatisticsContext: Background calculation failed:', error);
      setCalculationError('統計データの計算に失敗しました。統計タブで再計算を試してください。');
    } finally {
      setIsCalculating(false);
    }
  }, [clothingItems, wearHistory, washHistory, clothingLoading, period, sortOrder, categoryFilter, isPremium, shownNotificationIds, saveShownNotifications]);

  // 手動再計算（エラー時の復旧用）
  const recalculateStatistics = useCallback(async () => {
    await calculateStatisticsInBackground();
  }, [calculateStatisticsInBackground]);

  // アイテム詳細統計の取得
  const getItemDetailStats = useCallback(async (itemId: string): Promise<ItemDetailStats | null> => {
    if (itemDetailStats.has(itemId)) {
      return itemDetailStats.get(itemId) || null;
    }

    try {
      const item = clothingItems.find(item => item.id === itemId);
      if (!item) return null;

      const stats = await statisticsService.getItemDetailStats(clothingItems, itemId);
      if (stats) {
        setItemDetailStats(prev => new Map(prev).set(itemId, stats));
      }
      return stats;
    } catch (error) {
      console.error('Error calculating item detail stats:', error);
      return null;
    }
  }, [clothingItems, itemDetailStats]);

  // バッジ通知をクリアする関数
  const clearBadgeNotification = useCallback((badgeId: string) => {
    setBadgeNotifications(prev => prev.filter(notification => notification.id !== badgeId));
  }, []);

  // データが変更されたときの再計算
  useEffect(() => {
    if (!clothingLoading) {
      calculateStatisticsInBackground();
    }
  }, [clothingItems, wearHistory, washHistory, period, sortOrder, categoryFilter, isPremium, calculateStatisticsInBackground]);

  // 初期化処理
  useEffect(() => {
    loadShownNotifications();
  }, [loadShownNotifications]);

  const contextValue: StatisticsContextType = {
    // 計算済みデータ
    basicStats,
    rankingData,
    efficiencyData,
    impactData,
    badges,
    itemDetailStats,

    // バッジ通知
    badgeNotifications,
    clearBadgeNotification,

    // 計算状態
    isCalculating,
    calculationError,

    // 期間とフィルター設定
    period,
    setPeriod,
    sortOrder,
    setSortOrder,
    categoryFilter,
    setCategoryFilter,

    // 手動再計算
    recalculateStatistics,
    
    // アイテム詳細統計
    getItemDetailStats
  };

  return (
    <StatisticsContext.Provider value={contextValue}>
      {children}
    </StatisticsContext.Provider>
  );
}

export function useStatistics() {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
}
