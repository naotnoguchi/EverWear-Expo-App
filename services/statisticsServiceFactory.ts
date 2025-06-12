// Factory for creating statistics services
import { useMockData } from '../lib/supabase';
import * as mockService from './mockStatisticsService';
import * as supabaseService from './supabaseStatisticsService';

// Export the appropriate service based on configuration
export const statisticsService = useMockData ? mockService : supabaseService;

// Re-export types from the statistics module for convenience
export {
  Badge, BasicStats, EfficiencyItem,
  ImpactData, ItemDetailStats,
  Period, RankingItem
} from '../types/statistics';

export interface ItemDetailStats {
  id: string;
  name: string;
  category: CategoryValue;
  brand: string;
  imageUrl: string;
  image?: string;  // 画像パス（オプショナル）
  wearCount: number;
  washCount: number;
  wearPerWash: number;
  efficiency: number;
  wearsByDay: { [day: string]: number };
  wearsByMonth: { [month: string]: number };
  averageWearInterval: number;
  lastWorn: string;
  memo: string;
  condition: string;
  purchasePrice: number;
  waterSaved?: number;
  energySaved?: number;
  co2Reduced?: number;
}

