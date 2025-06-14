// contexts/StatisticsContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Badge,
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

// 新しいバッジ通知の型
interface BadgeNotification {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

// コンテキストの型定義（簡素化）
interface StatisticsContextType {
  // 計算済みデータ（常に最新）
  basicStats: BasicStats | null;
  rankingData: RankingItem[];
  efficiencyData: EfficiencyItem[];
  impactData: ImpactData | null;
  badges: Badge[];
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
  // ClothingContextからデータを取得
  const { clothingItems, loading: clothingLoading } = useClothing();

  // 計算済みデータの状態
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyItem[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
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
  const previousBadgesRef = useRef<Badge[]>([]);

  // バックグラウンドで統計を計算する関数
  const calculateStatisticsInBackground = useCallback(async () => {
    if (clothingLoading || clothingItems.length === 0) {
      console.log('StatisticsContext: Skipping calculation - data not ready');
      return;
    }

    console.log('StatisticsContext: Starting background statistics calculation');
    setIsCalculating(true);
    setCalculationError(null);

    try {
      // 並列で全ての統計データを計算
      const [
        basicStatsResult,
        rankingDataResult,
        efficiencyDataResult,
        impactDataResult,
        badgesResult
      ] = await Promise.all([
        statisticsService.getBasicStats(period),
        statisticsService.getRankingData(period, sortOrder, categoryFilter),
        statisticsService.getEfficiencyData(period),
        statisticsService.getImpactData(period),
        statisticsService.getBadges()
      ]);

      // 新しいバッジの検出
      const previousBadges = previousBadgesRef.current;
      const newlyEarnedBadges = badgesResult.filter(
        current => current.isEarned && 
                  !previousBadges.some(prev => prev.id === current.id && prev.isEarned)
      );

      // 新しいバッジがある場合は通知を追加
      if (newlyEarnedBadges.length > 0) {
        console.log(`StatisticsContext: ${newlyEarnedBadges.length} new badges earned:`, 
          newlyEarnedBadges.map(b => b.name).join(', '));
        
        const notifications = newlyEarnedBadges.map(badge => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          imageUrl: badge.imageUrl
        }));
        
        setBadgeNotifications(prev => [...prev, ...notifications]);
      }

      // 状態を更新
      setBasicStats(basicStatsResult);
      setRankingData(rankingDataResult);
      setEfficiencyData(efficiencyDataResult);
      setImpactData(impactDataResult);
      setBadges(badgesResult);

      // 前回のバッジ状態を更新
      previousBadgesRef.current = badgesResult;

      console.log('StatisticsContext: Background calculation completed successfully');
    } catch (error) {
      console.error('StatisticsContext: Background calculation failed:', error);
      setCalculationError('統計データの計算に失敗しました。統計タブで再計算を試してください。');
    } finally {
      setIsCalculating(false);
    }
  }, [clothingItems, clothingLoading, period, sortOrder, categoryFilter]);

  // 手動再計算（エラー時の復旧用）
  const recalculateStatistics = useCallback(async () => {
    console.log('StatisticsContext: Manual recalculation requested');
    await calculateStatisticsInBackground();
  }, [calculateStatisticsInBackground]);

  // アイテム詳細統計の取得
  const getItemDetailStats = useCallback(async (itemId: string): Promise<ItemDetailStats | null> => {
    console.log(`StatisticsContext: Getting item detail stats for ${itemId}`);
    
    // キャッシュから確認
    const cached = itemDetailStats.get(itemId);
    if (cached) {
      console.log(`StatisticsContext: Returning cached item detail stats for ${itemId}`);
      return cached;
    }

    try {
      const stats = await statisticsService.getItemDetailStats(itemId);
      if (stats) {
        // キャッシュに保存
        setItemDetailStats(prev => new Map(prev).set(itemId, stats));
        console.log(`StatisticsContext: Item detail stats calculated and cached for ${itemId}`);
      }
      return stats;
    } catch (error) {
      console.error(`StatisticsContext: Failed to get item detail stats for ${itemId}:`, error);
      return null;
    }
  }, [itemDetailStats]);

  // バッジ通知をクリア
  const clearBadgeNotification = useCallback((badgeId: string) => {
    setBadgeNotifications(prev => prev.filter(notification => notification.id !== badgeId));
  }, []);

  // 衣類データが変更されたときにバックグラウンドで統計を再計算
  useEffect(() => {
    if (!clothingLoading && clothingItems.length > 0) {
      console.log('StatisticsContext: Clothing data changed, triggering background calculation');
      calculateStatisticsInBackground();
    }
  }, [clothingItems, clothingLoading, calculateStatisticsInBackground]);

  // 期間やフィルターが変更されたときに再計算
  useEffect(() => {
    if (!clothingLoading && clothingItems.length > 0) {
      console.log('StatisticsContext: Period or filter changed, triggering background calculation');
      calculateStatisticsInBackground();
    }
  }, [period, sortOrder, categoryFilter, clothingLoading, clothingItems.length, calculateStatisticsInBackground]);

  // アプリ起動時にバッジデータを取得
  useEffect(() => {
    const initializeBadges = async () => {
      try {
        console.log('StatisticsContext: Initializing badges on app startup');
        const initialBadges = await statisticsService.getBadges();
        setBadges(initialBadges);
        previousBadgesRef.current = initialBadges;
        console.log('StatisticsContext: Initial badges loaded');
      } catch (error) {
        console.log('StatisticsContext: バッジの初期化中にエラーが発生しましたが、継続します:', error);
        // エラーが発生してもアプリは継続動作させる
        // デフォルトバッジを設定
        const defaultBadges = await statisticsService.getBadges().catch(() => []);
        setBadges(defaultBadges);
        previousBadgesRef.current = defaultBadges;
      }
    };

    initializeBadges();
  }, []);

  // コンテキスト値
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

// カスタムフック
export function useStatistics() {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
}
