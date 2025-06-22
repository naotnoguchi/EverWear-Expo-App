// contexts/StatisticsContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { auth } from '../lib/authClient';
import * as badgeService from '../services/badgeService';
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

// 表示済みバッジ通知のキー
const SHOWN_BADGE_NOTIFICATIONS_KEY = 'shown_badge_notifications';

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
      // 並列で全ての統計データを計算
      const [
        basicStatsResult,
        rankingDataResult,
        efficiencyDataResult,
        impactDataResult,
        badgesResult
      ] = await Promise.all([
        statisticsService.getBasicStats(clothingItems, period),
        statisticsService.getRankingData(clothingItems, period, sortOrder, categoryFilter),
        statisticsService.getEfficiencyData(clothingItems, period),
        statisticsService.getImpactData(clothingItems, period),
        badgeService.getBadges(clothingItems)
      ]);

      // 新しいバッジの検出（表示済み通知を考慮）
      const previousBadges = previousBadgesRef.current;
      const newlyEarnedBadges = badgesResult.filter(
        current => current.isEarned && 
                  !previousBadges.some(prev => prev.id === current.id && prev.isEarned) &&
                  !shownNotificationIds.has(current.id) // 既に表示済みでないかチェック
      );

      // 新しいバッジがある場合は通知を追加
      if (newlyEarnedBadges.length > 0) {
        const notifications = newlyEarnedBadges.map(badge => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          imageUrl: badge.imageUrl
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
  }, [clothingItems, clothingLoading, period, sortOrder, categoryFilter, shownNotificationIds, saveShownNotifications]);

  // 手動再計算（エラー時の復旧用）
  const recalculateStatistics = useCallback(async () => {
    await calculateStatisticsInBackground();
  }, [calculateStatisticsInBackground]);

  // アイテム詳細統計の取得
  const getItemDetailStats = useCallback(async (itemId: string): Promise<ItemDetailStats | null> => {
    // キャッシュから確認
    const cached = itemDetailStats.get(itemId);
    if (cached) {
      return cached;
    }

    try {
      const stats = await statisticsService.getItemDetailStats(clothingItems, itemId);
      if (stats) {
        // キャッシュに保存
        setItemDetailStats(prev => new Map(prev).set(itemId, stats));
      }
      return stats;
    } catch (error) {
      console.error(`StatisticsContext: Failed to get item detail stats for ${itemId}:`, error);
      return null;
    }
  }, [itemDetailStats, clothingItems]);

  // バッジ通知をクリア
  const clearBadgeNotification = useCallback((badgeId: string) => {
    setBadgeNotifications(prev => prev.filter(notification => notification.id !== badgeId));
  }, []);

  // 初期化時に表示済み通知を読み込み
  useEffect(() => {
    loadShownNotifications();
  }, [loadShownNotifications]);

  // 衣類データや期間・フィルターが変更されたときにバックグラウンドで統計を再計算
  useEffect(() => {
    if (!clothingLoading && clothingItems.length > 0 && shownNotificationIds.size >= 0) {
      calculateStatisticsInBackground();
    }
  }, [period, sortOrder, categoryFilter, clothingLoading, clothingItems.length, calculateStatisticsInBackground, shownNotificationIds.size]);

  // アプリ起動時にバッジデータを取得
  useEffect(() => {
    const initializeBadges = async () => {
      try {
        // 認証状態を確認してからバッジを初期化
        const { data: { user } } = await auth.getUser();
        if (!user) {
          setBadges([]);
          previousBadgesRef.current = [];
          return;
        }
        
        const initialBadges = await badgeService.getBadges(clothingItems);
        setBadges(initialBadges);
        // 初期化時は既に獲得済みのバッジとして設定
        previousBadgesRef.current = initialBadges;
      } catch (error) {
        console.error('StatisticsContext: バッジの初期化中にエラーが発生しました:', error);
        
        // 認証エラーの場合は空の配列を設定
        if (error instanceof Error && (
            error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('AuthApiError'))) {
          setBadges([]);
          previousBadgesRef.current = [];
          return;
        }
      
        // その他のエラーの場合はデフォルトバッジを試行
        try {
          const defaultBadges = await badgeService.getBadges(clothingItems).catch(() => []);
          setBadges(defaultBadges);
          previousBadgesRef.current = defaultBadges;
        } catch (fallbackError) {
          console.error('StatisticsContext: フォールバック処理も失敗しました:', fallbackError);
          setBadges([]);
          previousBadgesRef.current = [];
        }
      }
    };

    // 表示済み通知の読み込みが完了してから初期化
    if (shownNotificationIds.size >= 0) {
      initializeBadges();
    }
  }, [shownNotificationIds.size]);

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
