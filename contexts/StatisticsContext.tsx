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
  // 表示済みバッジ通知のIDを保持 (Ref に変更して再計算ループを防止)
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());

  // 表示済み通知の読み込み
  const loadShownNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOWN_BADGE_NOTIFICATIONS_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        shownNotificationIdsRef.current = new Set(ids);
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

  // 認証されていない場合のバッジ進捗計算
  const calculateProgressForUnauthenticatedUser = useCallback((
    badgeId: string,
    itemCount: number,
    wearCount: number,
    washCount: number
  ): number => {
    switch (badgeId) {
      case 'first-item':
        return Math.min(100, Math.round((itemCount / 1) * 100));
      case 'first-wear':
        return Math.min(100, Math.round((wearCount / 1) * 100));
      case 'first-wash':
        return Math.min(100, Math.round((washCount / 1) * 100));
      case 'item-collector-5':
        return Math.min(100, Math.round((itemCount / 5) * 100));
      case 'item-collector-15':
        return Math.min(100, Math.round((itemCount / 15) * 100));
      case 'item-collector-30':
        return Math.min(100, Math.round((itemCount / 30) * 100));
      case 'wear-master-10':
        return Math.min(100, Math.round((wearCount / 10) * 100));
      case 'wear-master-50':
        return Math.min(100, Math.round((wearCount / 50) * 100));
      case 'wear-master-100':
        return Math.min(100, Math.round((wearCount / 100) * 100));
      case 'wash-master-10':
        return Math.min(100, Math.round((washCount / 10) * 100));
      case 'wash-master-30':
        return Math.min(100, Math.round((washCount / 30) * 100));
      case 'wash-master-50':
        return Math.min(100, Math.round((washCount / 50) * 100));
      case 'premium-unlocked':
        return isPremium ? 100 : 0;
      default:
        return 0;
    }
  }, [isPremium]);

  // バックグラウンドで統計を計算する関数
  const calculateStatisticsInBackground = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      // 認証状態を確認
      const { data: { user } } = await auth.getUser();
      
      // バッジは常に表示する（認証やアイテムの有無に関係なく）
      let badgeServiceInstance: any = null;
      let badgesResult: BadgeWithStatus[] = [];
      let newBadgesResult: any[] = [];

      if (user) {
        badgeServiceInstance = createBadgeService(user.id);
        badgesResult = await badgeServiceInstance.getAllBadgesWithStatus(clothingItems, wearHistory, washHistory, isPremium);
        newBadgesResult = await badgeServiceInstance.checkAndAwardNewBadges(clothingItems, wearHistory, washHistory, isPremium);
      } else {
        // 認証されていない場合は、全バッジを未獲得状態で表示
        const { getAllBadges } = await import('../services/badgeDefinitions');
        const allBadges = getAllBadges();
        badgesResult = allBadges.map(badge => ({
          ...badge,
          isEarned: false,
          earnedDate: undefined,
          progress: calculateProgressForUnauthenticatedUser(badge.id, clothingItems.length, wearHistory.length, washHistory.length)
        }));
      }

      // アイテムデータがある場合のみ統計を計算
      if (!clothingLoading && clothingItems.length > 0) {
        const [
          basicStatsResult,
          rankingDataResult,
          efficiencyDataResult,
          impactDataResult
        ] = await Promise.all([
          statisticsService.getBasicStats(clothingItems, period),
          statisticsService.getRankingData(clothingItems, period, sortOrder, categoryFilter),
          statisticsService.getEfficiencyData(clothingItems, period),
          statisticsService.getImpactData(clothingItems, period)
        ]);

        // 状態を更新
        setBasicStats(basicStatsResult);
        setRankingData(rankingDataResult);
        setEfficiencyData(efficiencyDataResult);
        setImpactData(impactDataResult);
      } else {
        // アイテムがない場合は統計を空にリセット
        setBasicStats(null);
        setRankingData([]);
        setEfficiencyData([]);
        setImpactData(null);
      }

      // バッジは常に設定
      setBadges(badgesResult);

      // 新しいバッジがある場合は通知を追加（認証済みユーザーのみ）
      if (user && newBadgesResult.length > 0) {
        const newlyEarnedBadges = newBadgesResult.filter(
          badge => !shownNotificationIdsRef.current.has(badge.id)
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
          const newShownIds = new Set([...shownNotificationIdsRef.current, ...newlyEarnedBadges.map(b => b.id)]);
          shownNotificationIdsRef.current = newShownIds;
          saveShownNotifications(newShownIds);
        }
      }

      // 前回のバッジ状態を更新
      previousBadgesRef.current = badgesResult;
    } catch (error) {
      console.error('StatisticsContext: Background calculation failed:', error);
      setCalculationError('統計データの計算に失敗しました。統計タブで再計算を試してください。');
      
      // エラーが発生してもバッジデータは表示する
      try {
        const { getAllBadges } = await import('../services/badgeDefinitions');
        const allBadges = getAllBadges();
        const badgesResult = allBadges.map(badge => ({
          ...badge,
          isEarned: false,
          earnedDate: undefined,
          progress: calculateProgressForUnauthenticatedUser(badge.id, clothingItems.length, wearHistory.length, washHistory.length)
        }));
        setBadges(badgesResult);
      } catch (badgeError) {
        console.error('Failed to load badge definitions:', badgeError);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [clothingItems, wearHistory, washHistory, clothingLoading, period, sortOrder, categoryFilter, isPremium, saveShownNotifications, calculateProgressForUnauthenticatedUser]);

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
    // 通知を既読に
    if (shownNotificationIdsRef.current.has(badgeId)) {
      const newSet = new Set(shownNotificationIdsRef.current);
      newSet.delete(badgeId);
      shownNotificationIdsRef.current = newSet;
      saveShownNotifications(newSet);
    }
  }, [saveShownNotifications]);

  // データが変更されたときの再計算
  useEffect(() => {
    calculateStatisticsInBackground();
  }, [clothingItems, wearHistory, washHistory, period, sortOrder, categoryFilter, isPremium, calculateStatisticsInBackground]);

  // 初期化処理
  useEffect(() => {
    loadShownNotifications();
    // 初期化時にもバッジデータを読み込む
    calculateStatisticsInBackground();
  }, [loadShownNotifications, calculateStatisticsInBackground]);

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
