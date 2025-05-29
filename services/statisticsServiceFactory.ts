// Factory for creating statistics services (simplified to only use mock service)
import * as mockService from './mockStatisticsService';

// Export the mock service directly
export const statisticsService = mockService;

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