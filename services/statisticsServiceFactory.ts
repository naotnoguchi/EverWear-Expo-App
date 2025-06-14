// Factory for creating statistics services
import * as supabaseService from './supabaseStatisticsService';

// Export the appropriate service based on configuration
// Note: mockStatisticsService has been removed as part of cache elimination
export const statisticsService = supabaseService;

// Re-export types from the statistics module for convenience
export {
    Badge, BasicStats, EfficiencyItem,
    ImpactData, ItemDetailStats,
    Period, RankingItem
} from '../types/statistics';



