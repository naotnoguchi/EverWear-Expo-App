// Factory for creating statistics services
import * as mockService from './mockStatisticsService';
import * as supabaseService from './supabaseStatisticsService';
import { useMockData } from '../lib/supabase';

// Export the appropriate service based on configuration
export const statisticsService = useMockData ? mockService : supabaseService;

// Re-export types from the statistics module for convenience
export { 
  BasicStats, 
  RankingItem, 
  EfficiencyItem, 
  ImpactData, 
  Badge, 
  ItemDetailStats,
  Period
} from '../types/statistics';
