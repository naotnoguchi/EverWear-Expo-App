import { CategoryValue } from '../types/categories';
import { AppClothingItem } from '../types/database';
import {
  BasicStats,
  EfficiencyItem,
  ImpactData,
  ItemDetailStats,
  Period,
  RankingItem
} from '../types/statistics';
import {
  calculateBasicStats,
  calculateEfficiencyData,
  calculateImpactData,
  calculateItemDetailStats,
  calculateRankingData
} from '../utils/statisticsCalculator';

// Get basic statistics (always fresh calculation)
export const getBasicStats = async (items: AppClothingItem[], period: Period = '3months'): Promise<BasicStats> => {
  try {
    const stats = calculateBasicStats(items, period);
    return stats;
  } catch (error) {
    console.error('Error calculating basic stats:', error);
    throw error;
  }
};

// Get ranking data (always fresh calculation)
export const getRankingData = async (
  items: AppClothingItem[],
  period: Period = '3months',
  sortOrder: 'most' | 'least' = 'most',
  category: CategoryValue = null
): Promise<RankingItem[]> => {
  try {
    const ranking = calculateRankingData(items, period, sortOrder, category);
    return ranking;
  } catch (error) {
    console.error('Error calculating ranking data:', error);
    throw error;
  }
};

// Get efficiency data (always fresh calculation)
export const getEfficiencyData = async (items: AppClothingItem[], period: Period = '3months'): Promise<EfficiencyItem[]> => {
  try {
    const efficiency = calculateEfficiencyData(items, period);
    return efficiency;
  } catch (error) {
    console.error('Error calculating efficiency data:', error);
    throw error;
  }
};

// Get impact data (always fresh calculation)
export const getImpactData = async (items: AppClothingItem[], period: Period = '3months'): Promise<ImpactData> => {
  try {
    const impact = calculateImpactData(items, period);
    return impact;
  } catch (error) {
    console.error('Error calculating impact data:', error);
    throw error;
  }
};

// Get item detail statistics (always fresh calculation)
export const getItemDetailStats = async (items: AppClothingItem[], itemId: string): Promise<ItemDetailStats | null> => {
  try {
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      return null;
    }
    
    const stats = calculateItemDetailStats(item);
    return stats;
  } catch (error) {
    console.error('Error calculating item detail stats:', error);
    throw error;
  }
};

// バッジ評価機能は badgeService.ts に移動しました

// デフォルトバッジ作成機能は badgeService.ts に移動しました

// No cache functions needed - always calculate fresh data
