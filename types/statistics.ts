// Statistics type definitions for ClothesManagerApp
import { CategoryValue } from './categories';

// Period type for filtering statistics
export type Period = '1month' | '3months' | '6months' | '1year' | 'all';

// Basic statistics information
export interface BasicStats {
  totalItems: number;
  totalWears: number;
  totalWashes: number;
  averageWearsBetweenWashes: number;
  averageWashThreshold: number;
  mostWornCategory: CategoryValue;
  mostWornItem: {
    id: string;
    name: string;
    wears: number;
  };
  leastWornItem: {
    id: string;
    name: string;
    wears: number;
  };
  categoryBreakdown: {
    category: CategoryValue;
    count: number;
    percentage: number;
  }[];
  monthlyWears: {
    month: string;
    count: number;
  }[];
}

// Ranking data for items
export interface RankingItem {
  id: string;
  name: string;
  category: CategoryValue;
  brand?: string; // Added brand property
  imageUrl: string;
  wearCount: number;
  percentageOfMax: number; // For bar visualization (0-100)
}

// Efficiency data for items
export interface EfficiencyItem {
  id: string;
  name: string;
  category: CategoryValue;
  brand?: string; // Added brand property
  imageUrl: string;
  wearCount: number;
  washCount: number;
  threshold: number;
  efficiency: number; // Actual wears between washes / threshold
  status: 'good' | 'underwashed' | 'overwashed'; // Status based on efficiency
}

// Environmental impact data
export interface ImpactData {
  totalWashesReduced: number;
  electricitySaved: { amount: number; cost: number }; // kWh and yen
  waterSaved: { amount: number; cost: number }; // liters and yen
  detergentSaved: { amount: number; cost: number }; // ml and yen
  co2Reduced: number; // kg
  treeEquivalent: number; // Number of trees equivalent to CO2 reduction
  monthlyImpact: {
    month: string;
    washesReduced: number;
    co2Reduced: number;
  }[];
}

// Badge data
export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isEarned: boolean;
  earnedDate?: string; // ISO date string
  progress?: number; // 0-100 for unearned badges
  category: 'usage' | 'efficiency' | 'milestone' | 'special';
}

// Item detail statistics
export interface ItemDetailStats {
  id: string;
  name: string;
  category: CategoryValue;
  brand?: string; // Added brand property
  imageUrl: string; // 追加: アイテム画像URL
  wearCount: number;
  washCount: number;
  wearPerWash: number; // 追加: 着用回数/洗濯回数
  efficiency: number;
  wearsByDay: { [day: string]: number }; // Day of week statistics
  wearsByMonth: { [month: string]: number }; // Month statistics
  wearTrend: {
    period: string;
    count: number;
  }[];
  washTrend: {
    period: string;
    count: number;
  }[];
  averageWearInterval: number; // 追加: 平均着用間隔（日数）
  lastWornDate: string | null; // 追加: 最終着用日
  // 環境影響データ
  waterSaved: number; // 追加: 節水量（リットル）
  energySaved: number; // 追加: 節電量（kWh）
  co2Reduced: number; // 追加: CO2削減量（kg）
  optimizedThreshold?: number; // Recommended threshold based on usage pattern
}
