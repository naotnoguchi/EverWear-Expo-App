// Factory for creating statistics services
import * as statisticsServiceImpl from './statisticsService';

// Export the statistics service
export const statisticsService = statisticsServiceImpl;

// Re-export types from the statistics module for convenience
export {
    Badge, BasicStats, EfficiencyItem,
    ImpactData, ItemDetailStats,
    Period, RankingItem
} from '../types/statistics';



