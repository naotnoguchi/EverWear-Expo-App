// contexts/StatisticsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  statisticsService, 
  BasicStats, 
  RankingItem, 
  EfficiencyItem, 
  ImpactData, 
  Badge, 
  ItemDetailStats,
  Period
} from '../services/statisticsServiceFactory';
import { CategoryValue } from '../types/categories';
import { useClothing } from './ClothingContext';
import { 
  calculateBasicStats,
  calculateRankingData,
  calculateEfficiencyData,
  calculateImpactData,
  calculateItemDetailStats
} from '../utils/statisticsCalculator';

// コンテキストの型定義
interface StatisticsContextType {
  // データの状態
  basicStats: BasicStats | null;
  rankingData: RankingItem[];
  efficiencyData: EfficiencyItem[];
  impactData: ImpactData | null;
  badges: Badge[];

  // アイテム詳細統計のキャッシュ
  itemDetailStats: Map<string, ItemDetailStats>;

  // ローディングとエラーの状態
  loading: {
    basicStats: boolean;
    rankingData: boolean;
    efficiencyData: boolean;
    impactData: boolean;
    badges: boolean;
  };
  error: {
    basicStats: string | null;
    rankingData: string | null;
    efficiencyData: string | null;
    impactData: string | null;
    badges: string | null;
  };

  // 期間の状態（画面間で共有）
  period: Period;
  setPeriod: (period: Period) => void;

  // ランキングのフィルター状態
  sortOrder: 'most' | 'least';
  setSortOrder: (order: 'most' | 'least') => void;
  categoryFilter: CategoryValue;
  setCategoryFilter: (category: CategoryValue) => void;

  // データ取得関数
  fetchBasicStats: (period?: Period) => Promise<void>;
  fetchRankingData: (period?: Period, sortOrder?: 'most' | 'least', category?: CategoryValue) => Promise<void>;
  fetchEfficiencyData: (period?: Period) => Promise<void>;
  fetchImpactData: (period?: Period) => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchItemDetailStats: (itemId: string) => Promise<ItemDetailStats | null>;

  // すべてのデータを更新
  refreshAllData: () => Promise<void>;

  // キャッシュをクリア（テストやデバッグ用）
  clearCache: () => void;
}

// コンテキストの作成
const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function StatisticsProvider({ children }: { children: React.ReactNode }) {
  // ClothingContextからデータを取得
  const { clothingItems, loading: clothingLoading } = useClothing();

  // データの状態
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyItem[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [itemDetailStats, setItemDetailStats] = useState<Map<string, ItemDetailStats>>(new Map());

  // ローディング状態
  const [loading, setLoading] = useState({
    basicStats: false,
    rankingData: false,
    efficiencyData: false,
    impactData: false,
    badges: false,
  });

  // エラー状態
  const [error, setError] = useState({
    basicStats: null as string | null,
    rankingData: null as string | null,
    efficiencyData: null as string | null,
    impactData: null as string | null,
    badges: null as string | null,
  });

  // 期間の状態（デフォルトは3ヶ月）
  const [period, setPeriod] = useState<Period>('3months');

  // ランキングのフィルター状態
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');
  const [categoryFilter, setCategoryFilter] = useState<CategoryValue>(null);

  // 基本統計データを計算
  const fetchBasicStats = useCallback(async (selectedPeriod: Period = period) => {
    console.log(`StatisticsContext: 基本統計データの計算開始 (期間=${selectedPeriod})`);
    try {
      setLoading(prev => ({ ...prev, basicStats: true }));
      setError(prev => ({ ...prev, basicStats: null }));

      // ClothingContextのデータを使用して計算
      if (clothingItems.length === 0 && !clothingLoading) {
        console.log('StatisticsContext: アイテムデータがありません');
        setBasicStats({
          totalItems: 0,
          totalWears: 0,
          totalWashes: 0,
          averageWearsBetweenWashes: 0,
          mostWornCategory: null,
          mostWornItem: { id: '', name: '', wears: 0 },
          leastWornItem: { id: '', name: '', wears: 0 },
          categoryBreakdown: [],
          monthlyWears: [],
          averageWashThreshold: 0
        });
        return;
      }

      if (clothingLoading) {
        console.log('StatisticsContext: アイテムデータ読み込み中...');
        return;
      }

      const data = calculateBasicStats(clothingItems, selectedPeriod);
      console.log(`StatisticsContext: 基本統計データの計算成功 (アイテム数=${data.totalItems}, 着用回数=${data.totalWears}, 洗濯回数=${data.totalWashes})`);
      setBasicStats(data);
    } catch (err) {
      console.error('StatisticsContext: 基本統計データの計算エラー:', err);
      setError(prev => ({ ...prev, basicStats: '基本統計データの計算に失敗しました' }));
    } finally {
      setLoading(prev => ({ ...prev, basicStats: false }));
    }
  }, [period, clothingItems, clothingLoading]);

  // ランキングデータを計算
  const fetchRankingData = useCallback(async (
    selectedPeriod: Period = period,
    selectedSortOrder: 'most' | 'least' = sortOrder,
    selectedCategory: CategoryValue = categoryFilter
  ) => {
    console.log(`StatisticsContext: ランキングデータの計算開始 (期間=${selectedPeriod}, 並び順=${selectedSortOrder}, カテゴリ=${selectedCategory || 'すべて'})`);
    try {
      setLoading(prev => ({ ...prev, rankingData: true }));
      setError(prev => ({ ...prev, rankingData: null }));

      // ClothingContextのデータを使用して計算
      if (clothingItems.length === 0 && !clothingLoading) {
        console.log('StatisticsContext: アイテムデータがありません');
        setRankingData([]);
        return;
      }

      if (clothingLoading) {
        console.log('StatisticsContext: アイテムデータ読み込み中...');
        return;
      }

      const data = calculateRankingData(
        clothingItems, 
        selectedPeriod, 
        selectedSortOrder, 
        selectedCategory
      );
      console.log(`StatisticsContext: ランキングデータの計算成功 (${data.length}件のアイテム)`);
      setRankingData(data);
    } catch (err) {
      console.error('StatisticsContext: ランキングデータの計算エラー:', err);
      setError(prev => ({ ...prev, rankingData: 'ランキングデータの計算に失敗しました' }));
    } finally {
      setLoading(prev => ({ ...prev, rankingData: false }));
    }
  }, [period, sortOrder, categoryFilter, clothingItems, clothingLoading]);

  // 効率データを計算
  const fetchEfficiencyData = useCallback(async (selectedPeriod: Period = period) => {
    console.log(`StatisticsContext: 効率データの計算開始 (期間=${selectedPeriod})`);
    try {
      setLoading(prev => ({ ...prev, efficiencyData: true }));
      setError(prev => ({ ...prev, efficiencyData: null }));

      // ClothingContextのデータを使用して計算
      if (clothingItems.length === 0 && !clothingLoading) {
        console.log('StatisticsContext: アイテムデータがありません');
        setEfficiencyData([]);
        return;
      }

      if (clothingLoading) {
        console.log('StatisticsContext: アイテムデータ読み込み中...');
        return;
      }

      const data = calculateEfficiencyData(clothingItems, selectedPeriod);
      console.log(`StatisticsContext: 効率データの計算成功 (${data.length}件のアイテム)`);
      setEfficiencyData(data);
    } catch (err) {
      console.error('StatisticsContext: 効率データの計算エラー:', err);
      setError(prev => ({ ...prev, efficiencyData: '効率データの計算に失敗しました' }));
    } finally {
      setLoading(prev => ({ ...prev, efficiencyData: false }));
    }
  }, [period, clothingItems, clothingLoading]);

  // 環境影響データを計算
  const fetchImpactData = useCallback(async (selectedPeriod: Period = period) => {
    console.log(`StatisticsContext: 環境影響データの計算開始 (期間=${selectedPeriod})`);
    try {
      setLoading(prev => ({ ...prev, impactData: true }));
      setError(prev => ({ ...prev, impactData: null }));

      // ClothingContextのデータを使用して計算
      if (clothingItems.length === 0 && !clothingLoading) {
        console.log('StatisticsContext: アイテムデータがありません');
        setImpactData({
          totalWears: 0,
          totalWashes: 0,
          totalWashesReduced: 0,
          waterSaved: 0,
          energySaved: 0,
          co2Reduced: 0
        });
        return;
      }

      if (clothingLoading) {
        console.log('StatisticsContext: アイテムデータ読み込み中...');
        return;
      }

      const data = calculateImpactData(clothingItems, selectedPeriod);
      console.log(`StatisticsContext: 環境影響データの計算成功 (洗濯削減=${data.totalWashesReduced.toFixed(1)}回, CO2削減=${data.co2Reduced.toFixed(1)}kg)`);
      setImpactData(data);
    } catch (err) {
      console.error('StatisticsContext: 環境影響データの計算エラー:', err);
      setError(prev => ({ ...prev, impactData: '環境影響データの計算に失敗しました' }));
    } finally {
      setLoading(prev => ({ ...prev, impactData: false }));
    }
  }, [period, clothingItems, clothingLoading]);

  // バッジデータを取得
  const fetchBadges = useCallback(async () => {
    console.log('StatisticsContext: バッジデータの取得開始');
    try {
      setLoading(prev => ({ ...prev, badges: true }));
      setError(prev => ({ ...prev, badges: null }));

      const data = await statisticsService.getBadges();
      console.log(`StatisticsContext: バッジデータの取得成功 (${data.length}件のバッジ, 獲得済み=${data.filter(b => b.isEarned).length}件)`);
      setBadges(data);
    } catch (err) {
      console.error('StatisticsContext: バッジデータの取得エラー:', err);
      setError(prev => ({ ...prev, badges: 'バッジデータの読み込みに失敗しました' }));
    } finally {
      setLoading(prev => ({ ...prev, badges: false }));
    }
  }, []);

  // アイテム詳細統計を計算
  const fetchItemDetailStats = useCallback(async (itemId: string): Promise<ItemDetailStats | null> => {
    console.log(`StatisticsContext: アイテム詳細統計の計算開始 (ID=${itemId})`);
    try {
      // すでにキャッシュにあるか確認
      if (itemDetailStats.has(itemId)) {
        console.log(`StatisticsContext: アイテム詳細統計がキャッシュに存在、キャッシュから返却 (ID=${itemId})`);
        return itemDetailStats.get(itemId) || null;
      }

      // ClothingContextのデータを使用して計算
      if (clothingLoading) {
        console.log('StatisticsContext: アイテムデータ読み込み中...');
        return null;
      }

      // 対象のアイテムを検索
      const item = clothingItems.find(item => item.id === itemId);
      if (!item) {
        console.log(`StatisticsContext: アイテムが見つかりません (ID=${itemId})`);
        return null;
      }

      console.log(`StatisticsContext: アイテム詳細統計を計算 (ID=${itemId})`);
      const data = calculateItemDetailStats(item);
      console.log(`StatisticsContext: アイテム詳細統計の計算成功 (ID=${itemId}, 着用回数=${data.wearCount}, 洗濯回数=${data.washCount})`);

      // キャッシュを更新
      setItemDetailStats(prev => {
        const newMap = new Map(prev);
        newMap.set(itemId, data);
        return newMap;
      });
      console.log(`StatisticsContext: アイテム詳細統計をコンテキストキャッシュに保存 (ID=${itemId})`);

      return data;
    } catch (err) {
      console.error(`StatisticsContext: アイテム詳細統計の計算エラー (ID: ${itemId}):`, err);
      return null;
    }
  }, [itemDetailStats, clothingItems, clothingLoading]);

  // すべてのデータを更新
  const refreshAllData = useCallback(async () => {
    console.log('StatisticsContext: すべての統計データの更新開始');

    console.log('StatisticsContext: 各種統計データの並列計算を開始');
    await Promise.all([
      fetchBasicStats(),
      fetchRankingData(),
      fetchEfficiencyData(),
      fetchImpactData(),
      fetchBadges()
    ]);
    console.log('StatisticsContext: すべての統計データの更新完了');
  }, [fetchBasicStats, fetchRankingData, fetchEfficiencyData, fetchImpactData, fetchBadges]);

  // キャッシュをクリア
  const clearCache = useCallback(() => {
    console.log('StatisticsContext: コンテキスト内の統計データをリセット');
    setBasicStats(null);
    setRankingData([]);
    setEfficiencyData([]);
    setImpactData(null);
    setBadges([]);
    setItemDetailStats(new Map());
    console.log('StatisticsContext: キャッシュクリア完了');
  }, []);

  // 期間が変更されたときのエフェクト
  useEffect(() => {
    // 期間が変更されたときに自動的にデータを再計算しない
    // 各画面がマウントされたとき、または期間が変更されたときに必要なデータを計算する
    // これにより、表示されていない画面のデータを不必要に計算することを防ぐ
  }, [period]);

  // clothingItemsが変更されたときのエフェクト
  useEffect(() => {
    console.log('StatisticsContext: clothingItemsが変更されました、表示中の統計データを更新');

    // 現在表示中の統計データのみを更新
    const updatePromises: Promise<void>[] = [];

    // 基本統計データが読み込まれている場合は更新
    if (basicStats !== null) {
      console.log('StatisticsContext: 基本統計データを更新');
      updatePromises.push(fetchBasicStats());
    }

    // ランキングデータが読み込まれている場合は更新
    if (rankingData.length > 0) {
      console.log('StatisticsContext: ランキングデータを更新');
      updatePromises.push(fetchRankingData());
    }

    // 効率データが読み込まれている場合は更新
    if (efficiencyData.length > 0) {
      console.log('StatisticsContext: 効率データを更新');
      updatePromises.push(fetchEfficiencyData());
    }

    // 環境影響データが読み込まれている場合は更新
    if (impactData !== null) {
      console.log('StatisticsContext: 環境影響データを更新');
      updatePromises.push(fetchImpactData());
    }

    // アイテム詳細統計のキャッシュをクリア
    if (itemDetailStats.size > 0) {
      console.log('StatisticsContext: アイテム詳細統計のキャッシュをクリア');
      setItemDetailStats(new Map());
    }

    // すべての更新を並行して実行
    if (updatePromises.length > 0) {
      Promise.all(updatePromises)
        .then(() => console.log('StatisticsContext: clothingItems変更による更新が完了'))
        .catch(err => console.error('StatisticsContext: 更新中にエラー:', err));
    }
  }, [clothingItems]);


  // コンテキスト値を提供
  const contextValue: StatisticsContextType = {
    // データ
    basicStats,
    rankingData,
    efficiencyData,
    impactData,
    badges,
    itemDetailStats,

    // ローディングとエラーの状態
    loading,
    error,

    // 期間の状態
    period,
    setPeriod,

    // ランキングのフィルター状態
    sortOrder,
    setSortOrder,
    categoryFilter,
    setCategoryFilter,

    // データ取得関数
    fetchBasicStats,
    fetchRankingData,
    fetchEfficiencyData,
    fetchImpactData,
    fetchBadges,
    fetchItemDetailStats,

    // すべてのデータを更新
    refreshAllData,

    // キャッシュをクリア
    clearCache,
  };

  return (
    <StatisticsContext.Provider value={contextValue}>
      {children}
    </StatisticsContext.Provider>
  );
}

// 統計コンテキストを使用するためのフック
export function useStatistics() {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
}
