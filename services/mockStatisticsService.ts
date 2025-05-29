// Mock statistics service that mimics Supabase API behavior
import { 
  BasicStats, 
  RankingItem, 
  EfficiencyItem, 
  ImpactData, 
  Badge, 
  ItemDetailStats,
  Period
} from '../types/statistics';
import { CategoryValue } from '../types/categories';
import { 
  generateBasicStats, 
  generateRankingData, 
  generateEfficiencyData, 
  generateImpactData, 
  generateBadges, 
  generateItemDetailStats 
} from './mockStatisticsData';
import { simulateNetworkDelay } from './mockData';

// Cache for statistics data
interface StatisticsCache {
  basicStats: {
    [key in Period]?: {
      data: BasicStats;
      timestamp: number;
    };
  };
  rankingData: {
    [key: string]: { // period_sortOrder_category
      data: RankingItem[];
      timestamp: number;
    };
  };
  efficiencyData: {
    [key in Period]?: {
      data: EfficiencyItem[];
      timestamp: number;
    };
  };
  impactData: {
    [key in Period]?: {
      data: ImpactData;
      timestamp: number;
    };
  };
  badges: {
    data: Badge[];
    timestamp: number;
  } | null;
  itemDetailStats: {
    [key: string]: { // itemId
      data: ItemDetailStats;
      timestamp: number;
    };
  };
}

// Initialize empty cache
const cache: StatisticsCache = {
  basicStats: {},
  rankingData: {},
  efficiencyData: {},
  impactData: {},
  badges: null,
  itemDetailStats: {}
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Get basic statistics
export const getBasicStats = async (period: Period = '3months'): Promise<BasicStats> => {
  // Check cache
  const cachedData = cache.basicStats[period];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.data;
  }
  
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Generate data
  const data = generateBasicStats(period);
  
  // Update cache
  cache.basicStats[period] = {
    data,
    timestamp: Date.now()
  };
  
  return data;
};

// Get ranking data
export const getRankingData = async (
  period: Period = '3months',
  sortOrder: 'most' | 'least' = 'most',
  category: CategoryValue = null
): Promise<RankingItem[]> => {
  // Create cache key
  const cacheKey = `${period}_${sortOrder}_${category || 'all'}`;
  
  // Check cache
  const cachedData = cache.rankingData[cacheKey];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.data;
  }
  
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Generate data
  const data = generateRankingData(period, sortOrder, category);
  
  // Update cache
  cache.rankingData[cacheKey] = {
    data,
    timestamp: Date.now()
  };
  
  return data;
};

// Get efficiency data
export const getEfficiencyData = async (period: Period = '3months'): Promise<EfficiencyItem[]> => {
  // Check cache
  const cachedData = cache.efficiencyData[period];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.data;
  }
  
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Generate data
  const data = generateEfficiencyData(period);
  
  // Update cache
  cache.efficiencyData[period] = {
    data,
    timestamp: Date.now()
  };
  
  return data;
};

// Get impact data
export const getImpactData = async (period: Period = '3months'): Promise<ImpactData> => {
  // Check cache
  const cachedData = cache.impactData[period];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.data;
  }
  
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Generate data
  const data = generateImpactData(period);
  
  // Update cache
  cache.impactData[period] = {
    data,
    timestamp: Date.now()
  };
  
  return data;
};

// Get badges
export const getBadges = async (): Promise<Badge[]> => {
  // Check cache
  if (cache.badges && Date.now() - cache.badges.timestamp < CACHE_EXPIRY) {
    return cache.badges.data;
  }
  
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Generate data
  const data = generateBadges();
  
  // Update cache
  cache.badges = {
    data,
    timestamp: Date.now()
  };
  
  return data;
};

// Get item detail statistics
export const getItemDetailStats = async (itemId: string): Promise<ItemDetailStats | null> => {
  // Check cache
  const cachedData = cache.itemDetailStats[itemId];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return cachedData.data;
  }
  
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Generate data
  const data = generateItemDetailStats(itemId);
  
  // Update cache if data exists
  if (data) {
    cache.itemDetailStats[itemId] = {
      data,
      timestamp: Date.now()
    };
  }
  
  return data;
};

// Clear cache (useful for testing)
export const clearCache = (): void => {
  cache.basicStats = {};
  cache.rankingData = {};
  cache.efficiencyData = {};
  cache.impactData = {};
  cache.badges = null;
  cache.itemDetailStats = {};
};

// Clear specific cache entry
export const clearCacheEntry = (
  type: 'basicStats' | 'rankingData' | 'efficiencyData' | 'impactData' | 'badges' | 'itemDetailStats',
  key?: string | Period
): void => {
  switch (type) {
    case 'basicStats':
      if (key) {
        delete cache.basicStats[key as Period];
      } else {
        cache.basicStats = {};
      }
      break;
    case 'rankingData':
      if (key) {
        delete cache.rankingData[key as string];
      } else {
        cache.rankingData = {};
      }
      break;
    case 'efficiencyData':
      if (key) {
        delete cache.efficiencyData[key as Period];
      } else {
        cache.efficiencyData = {};
      }
      break;
    case 'impactData':
      if (key) {
        delete cache.impactData[key as Period];
      } else {
        cache.impactData = {};
      }
      break;
    case 'badges':
      cache.badges = null;
      break;
    case 'itemDetailStats':
      if (key) {
        delete cache.itemDetailStats[key as string];
      } else {
        cache.itemDetailStats = {};
      }
      break;
  }
};