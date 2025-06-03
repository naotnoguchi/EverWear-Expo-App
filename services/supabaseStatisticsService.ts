import { auth } from '../lib/authClient';
import { db, getAuthenticatedClient } from '../lib/dbClient';
import { CategoryValue } from '../types/categories';
import { AppClothingItem, toAppClothingItem } from '../types/database';
import {
  Badge,
  BasicStats,
  EfficiencyItem,
  ImpactData,
  ItemDetailStats,
  Period,
  RankingItem
} from '../types/statistics';
import {
  calculateBadgeProgress,
  evaluateBadgeCondition,
  fetchBadgeConditions,
  fetchBadgeDefinitions,
  fetchUserBadges,
  saveNewlyEarnedBadges
} from './badgeService';

// Helper function to filter items by period
const filterByPeriod = (dates: string[], period: Period): string[] => {
  if (period === 'all') return dates;

  const now = new Date();
  let cutoffDate = new Date();

  switch (period) {
    case '1month':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case '1year':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return dates.filter(date => new Date(date) >= cutoffDate);
};

// Cache for statistics data to avoid redundant calculations
class StatisticsCache {
  private static instance: StatisticsCache | null = null;
  private cache: {
    basicStats: Map<string, { data: BasicStats; timestamp: number }>;
    rankingData: Map<string, { data: RankingItem[]; timestamp: number }>;
    efficiencyData: Map<string, { data: EfficiencyItem[]; timestamp: number }>;
    impactData: Map<string, { data: ImpactData; timestamp: number }>;
    badges: { data: Badge[]; timestamp: number } | null;
    itemDetailStats: Map<string, { data: ItemDetailStats; timestamp: number }>;
  };

  private constructor() {
    this.cache = {
      basicStats: new Map(),
      rankingData: new Map(),
      efficiencyData: new Map(),
      impactData: new Map(),
      badges: null,
      itemDetailStats: new Map(),
    };
  }

  public static getInstance(): StatisticsCache {
    if (!StatisticsCache.instance) {
      StatisticsCache.instance = new StatisticsCache();
    }
    return StatisticsCache.instance;
  }

  public get<T>(type: string, key: string = 'default'): T | null {
    const cacheMap = this.cache[type];
    if (!cacheMap) return null;

    if (type === 'badges') {
      const cached = cacheMap as { data: T; timestamp: number } | null;
      if (!cached) return null;

      // Cache expires after 5 minutes
      if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
        this.cache[type] = null;
        return null;
      }

      return cached.data;
    }

    const cached = cacheMap.get(key);
    if (!cached) return null;

    // Cache expires after 5 minutes
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      cacheMap.delete(key);
      return null;
    }

    return cached.data as T;
  }

  public set<T>(type: string, data: T, key: string = 'default'): void {
    if (type === 'badges') {
      this.cache[type] = { data, timestamp: Date.now() };
      return;
    }

    const cacheMap = this.cache[type];
    if (!cacheMap) return;

    cacheMap.set(key, { data, timestamp: Date.now() });
  }

  public clear(type?: string): void {
    if (type) {
      if (type === 'badges') {
        this.cache[type] = null;
      } else {
        const cacheMap = this.cache[type];
        if (cacheMap) cacheMap.clear();
      }
    } else {
      Object.keys(this.cache).forEach(key => {
        if (key === 'badges') {
          this.cache[key] = null;
        } else {
          this.cache[key].clear();
        }
      });
    }
  }

  public clearEntry(type: string, key: string): void {
    if (type === 'badges') {
      this.cache[type] = null;
      return;
    }

    const cacheMap = this.cache[type];
    if (!cacheMap) return;

    cacheMap.delete(key);
  }
}

// Helper function to fetch all clothing items with their wear and wash history
async function fetchClothingItemsWithHistory(): Promise<AppClothingItem[]> {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // Get clothing items
  const { data: items, error } = await authClient
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  // Get wear and wash history for each item
  const result: AppClothingItem[] = [];

  for (const item of items) {
    const { data: wearHistory, error: wearError } = await authClient
      .from('wear_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (wearError) throw wearError;

    const { data: washHistory, error: washError } = await authClient
      .from('wash_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (washError) throw washError;

    result.push(toAppClothingItem(item, wearHistory, washHistory));
  }

  return result;
}

// Get basic statistics
export async function getBasicStats(period: Period = '3months'): Promise<BasicStats> {
  const cache = StatisticsCache.getInstance();
  const cachedData = cache.get<BasicStats>('basicStats', period);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Fetch real data from Supabase
    const items = await fetchClothingItemsWithHistory();

    // Filter items by period
    const filteredItems = items.map(item => ({
      ...item,
      filteredWearHistory: filterByPeriod(item.wearHistory, period),
      filteredWashHistory: filterByPeriod(item.washHistory, period)
    }));

    // Calculate total wears and washes in the period
    const totalWears = filteredItems.reduce((sum, item) => sum + item.filteredWearHistory.length, 0);
    const totalWashes = filteredItems.reduce((sum, item) => sum + item.filteredWashHistory.length, 0);

    // Calculate average wears between washes
    const averageWearsBetweenWashes = totalWashes > 0 ? parseFloat((totalWears / totalWashes).toFixed(1)) : 0;

    // Find most worn category
    const categoryWears: Record<CategoryValue, number> = {};
    filteredItems.forEach(item => {
      const category = item.category;
      if (!categoryWears[category]) categoryWears[category] = 0;
      categoryWears[category] += item.filteredWearHistory.length;
    });

    const mostWornCategory = Object.entries(categoryWears).length > 0 
      ? Object.entries(categoryWears)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0] as CategoryValue)[0]
      : null;

    // Find most and least worn items
    const sortedItems = [...filteredItems].sort(
      (a, b) => b.filteredWearHistory.length - a.filteredWearHistory.length
    );

    const mostWornItem = sortedItems.length > 0 ? {
      id: sortedItems[0].id,
      name: sortedItems[0].name,
      wears: sortedItems[0].filteredWearHistory.length
    } : { id: '', name: '', wears: 0 };

    const leastWornItem = sortedItems.length > 0 ? {
      id: sortedItems[sortedItems.length - 1].id,
      name: sortedItems[sortedItems.length - 1].name,
      wears: sortedItems[sortedItems.length - 1].filteredWearHistory.length
    } : { id: '', name: '', wears: 0 };

    // Calculate category breakdown
    const categories: Record<CategoryValue, number> = {};
    items.forEach(item => {
      const category = item.category;
      if (!categories[category]) categories[category] = 0;
      categories[category]++;
    });

    const totalItems = items.length;
    const categoryBreakdown = Object.entries(categories).map(([category, count]) => ({
      category: category as CategoryValue,
      count,
      percentage: Math.round((count / totalItems) * 100)
    }));

    // Calculate monthly wears
    const monthlyWears: Record<string, number> = {};
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    filteredItems.forEach(item => {
      item.filteredWearHistory.forEach(date => {
        const month = new Date(date).getMonth();
        const monthName = months[month];
        if (!monthlyWears[monthName]) monthlyWears[monthName] = 0;
        monthlyWears[monthName]++;
      });
    });

    // Convert to array and sort by month
    const monthlyWearsArray = Object.entries(monthlyWears).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => {
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    // Calculate average wash threshold
    const totalThreshold = filteredItems.reduce((sum, item) => sum + (item.washThreshold || 0), 0);
    const averageWashThreshold = filteredItems.length > 0
      ? parseFloat((totalThreshold / filteredItems.length).toFixed(1))
      : 3; // Default value of 3

    const stats: BasicStats = {
      totalItems,
      totalWears,
      totalWashes,
      averageWearsBetweenWashes,
      averageWashThreshold,
      mostWornCategory,
      mostWornItem,
      leastWornItem,
      categoryBreakdown,
      monthlyWears: monthlyWearsArray
    };

    cache.set('basicStats', stats, period);
    return stats;
  } catch (error) {
    console.error('Error fetching basic stats:', error);
    throw error;
  }
}

// Get ranking data
export async function getRankingData(
  period: Period = '3months',
  sortOrder: 'most' | 'least' = 'most',
  category: CategoryValue = null
): Promise<RankingItem[]> {
  const cacheKey = `${period}-${sortOrder}-${category || 'all'}`;
  const cache = StatisticsCache.getInstance();
  const cachedData = cache.get<RankingItem[]>('rankingData', cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Fetch real data from Supabase
    const items = await fetchClothingItemsWithHistory();

    // Filter items by period and category
    let filteredItems = items
      .filter(item => category === null || item.category === category)
      .map(item => ({
        ...item,
        filteredWearHistory: filterByPeriod(item.wearHistory, period)
      }));

    // Sort by wear count
    filteredItems = filteredItems.sort((a, b) => {
      const diff = b.filteredWearHistory.length - a.filteredWearHistory.length;
      return sortOrder === 'most' ? diff : -diff;
    });

    // Find maximum wear count for percentage calculation
    const maxWearCount = Math.max(
      ...filteredItems.map(item => item.filteredWearHistory.length),
      1 // Avoid division by zero
    );

    // Convert to RankingItem format
    const rankingData = filteredItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      imageUrl: item.image,
      wearCount: item.filteredWearHistory.length,
      percentageOfMax: Math.round((item.filteredWearHistory.length / maxWearCount) * 100)
    }));

    cache.set('rankingData', rankingData, cacheKey);
    return rankingData;
  } catch (error) {
    console.error('Error fetching ranking data:', error);
    throw error;
  }
}

// Get efficiency data
export async function getEfficiencyData(period: Period = '3months'): Promise<EfficiencyItem[]> {
  const cache = StatisticsCache.getInstance();
  const cachedData = cache.get<EfficiencyItem[]>('efficiencyData', period);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Fetch real data from Supabase
    const items = await fetchClothingItemsWithHistory();

    // Filter items by period
    const filteredItems = items.map(item => {
      const filteredWearHistory = filterByPeriod(item.wearHistory, period);
      const filteredWashHistory = filterByPeriod(item.washHistory, period);

      // Calculate efficiency
      const wearCount = filteredWearHistory.length;
      const washCount = filteredWashHistory.length;
      const actualWearsBetweenWashes = washCount > 0 ? wearCount / washCount : wearCount;
      const efficiency = item.washThreshold > 0 ? actualWearsBetweenWashes / item.washThreshold : 0;

      // Determine status based on efficiency
      const lowerThreshold = 0.8; // 80% of threshold
      const upperThreshold = 1.2; // 120% of threshold
      let status: 'good' | 'underwashed' | 'overwashed';

      // If there's no wash history or no wear and wash history, don't make a judgment
      if (washCount === 0 || (wearCount === 0 && washCount === 0)) {
        // Use 'good' as a default, but the UI will handle this special case
        status = 'good';
      } else if (efficiency >= lowerThreshold && efficiency <= upperThreshold) {
        status = 'good'; // Optimal range
      } else if (efficiency < lowerThreshold) {
        status = 'overwashed'; // Washing too frequently
      } else {
        status = 'underwashed'; // Not washing frequently enough
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        imageUrl: item.image,
        wearCount,
        washCount,
        threshold: item.washThreshold,
        efficiency,
        status
      };
    });

    // Sort by efficiency (highest first)
    const efficiencyData = filteredItems.sort((a, b) => b.efficiency - a.efficiency);

    cache.set('efficiencyData', efficiencyData, period);
    return efficiencyData;
  } catch (error) {
    console.error('Error fetching efficiency data:', error);
    throw error;
  }
}

// Get impact data
export async function getImpactData(period: Period = '3months'): Promise<ImpactData> {
  const cache = StatisticsCache.getInstance();
  const cachedData = cache.get<ImpactData>('impactData', period);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Fetch real data from Supabase
    const items = await fetchClothingItemsWithHistory();

    // Constants for impact calculations
    const ELECTRICITY_PER_WASH = 0.5; // kWh
    const ELECTRICITY_COST_PER_KWH = 25; // yen
    const WATER_PER_WASH = 50; // liters
    const WATER_COST_PER_1000L = 300; // yen
    const DETERGENT_PER_WASH = 30; // ml
    const DETERGENT_COST_PER_BOTTLE = 400; // yen (800ml bottle)
    const CO2_PER_KWH = 0.5; // kg
    const TREES_PER_KG_CO2 = 0.05; // trees per kg CO2 per year
    const ITEMS_PER_WASH_LOAD = 5; // average items per wash load

    // Filter items by period
    const filteredItems = items.map(item => {
      const filteredWearHistory = filterByPeriod(item.wearHistory, period);
      const filteredWashHistory = filterByPeriod(item.washHistory, period);

      // Calculate washes reduced
      // If we washed after every wear, we would have filteredWearHistory.length washes
      // Instead, we only have filteredWashHistory.length washes
      // Divide by ITEMS_PER_WASH_LOAD to account for multiple items being washed together
      const washesReduced = parseFloat(((filteredWearHistory.length - filteredWashHistory.length) / ITEMS_PER_WASH_LOAD).toFixed(1));

      return {
        ...item,
        filteredWearHistory,
        filteredWashHistory,
        washesReduced: Math.max(0, washesReduced) // Ensure non-negative
      };
    });

    // Calculate total washes reduced
    const totalWashesReduced = filteredItems.reduce((sum, item) => sum + (item.washesReduced || 0), 0);

    // Calculate resource savings
    const electricitySaved = {
      amount: parseFloat((totalWashesReduced * ELECTRICITY_PER_WASH).toFixed(1)),
      cost: Math.round(totalWashesReduced * ELECTRICITY_PER_WASH * ELECTRICITY_COST_PER_KWH)
    };

    const waterSaved = {
      amount: Math.round(totalWashesReduced * WATER_PER_WASH),
      cost: Math.round(totalWashesReduced * WATER_PER_WASH * WATER_COST_PER_1000L / 1000)
    };

    const detergentSaved = {
      amount: Math.round(totalWashesReduced * DETERGENT_PER_WASH),
      cost: Math.round(totalWashesReduced * DETERGENT_PER_WASH * DETERGENT_COST_PER_BOTTLE / 800)
    };

    // Calculate CO2 reduction
    const co2Reduced = parseFloat((electricitySaved.amount * CO2_PER_KWH).toFixed(1));
    const treeEquivalent = parseFloat((co2Reduced * TREES_PER_KG_CO2).toFixed(1));

    // Calculate monthly impact
    const monthlyImpact: { month: string; washesReduced: number; co2Reduced: number }[] = [];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthlyWashesReduced: Record<string, number> = {};

    // Group wears and washes by month
    filteredItems.forEach(item => {
      // Group wears by month
      const wearsByMonth: Record<string, number> = {};
      item.filteredWearHistory.forEach(date => {
        const month = months[new Date(date).getMonth()];
        wearsByMonth[month] = (wearsByMonth[month] || 0) + 1;
      });

      // Group washes by month
      const washesByMonth: Record<string, number> = {};
      item.filteredWashHistory.forEach(date => {
        const month = months[new Date(date).getMonth()];
        washesByMonth[month] = (washesByMonth[month] || 0) + 1;
      });

      // Calculate washes reduced by month
      months.forEach(month => {
        const wears = wearsByMonth[month] || 0;
        const washes = washesByMonth[month] || 0;
        const reduced = (wears - washes) / ITEMS_PER_WASH_LOAD;
        if (reduced > 0) {
          monthlyWashesReduced[month] = (monthlyWashesReduced[month] || 0) + reduced;
        }
      });
    });

    // Convert to array and calculate CO2 reduction
    Object.entries(monthlyWashesReduced).forEach(([month, washesReduced]) => {
      const co2 = parseFloat((washesReduced * ELECTRICITY_PER_WASH * CO2_PER_KWH).toFixed(1));
      monthlyImpact.push({ month, washesReduced: parseFloat(washesReduced.toFixed(1)), co2Reduced: co2 });
    });

    // Sort by month
    monthlyImpact.sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));

    const impactData: ImpactData = {
      totalWashesReduced,
      electricitySaved,
      waterSaved,
      detergentSaved,
      co2Reduced,
      treeEquivalent,
      monthlyImpact
    };

    cache.set('impactData', impactData, period);
    return impactData;
  } catch (error) {
    console.error('Error fetching impact data:', error);
    throw error;
  }
}

// Get badges
export async function getBadges(): Promise<Badge[]> {
  console.log('getBadges function called from:', new Error().stack?.split('\n')[2]?.trim() || 'unknown');

  const cache = StatisticsCache.getInstance();
  const cachedData = cache.get<Badge[]>('badges');

  if (cachedData) {
    console.log('getBadges returning cached data, count:', cachedData.length);
    return cachedData;
  }

  try {
    // Get user session
    const { data: session } = await auth.getSession();
    const userId = session?.session?.user?.id;

    console.log('Auth session in getBadges:', session ? 'exists' : 'null');
    console.log('User ID in getBadges:', userId || 'not found');

    if (!userId) {
      console.warn('User not authenticated when fetching badges');
      const defaultBadges = createDefaultBadges();
      cache.set('badges', defaultBadges);
      return defaultBadges;
    }

    // Fetch items with history
    const items = await fetchClothingItemsWithHistory();

    // Calculate statistics for badge evaluation
    const totalItems = items.length;
    const totalWears = items.reduce((sum, item) => sum + item.wearHistory.length, 0);
    const totalWashes = items.reduce((sum, item) => sum + item.washHistory.length, 0);
    const washesReduced = totalWears - totalWashes;
    const maxWears = items.length > 0 ? Math.max(...items.map(item => item.wearHistory.length)) : 0;
    const categories = new Set(items.map(item => item.category));
    const allCategories = ['トップス', 'ボトムス', 'アウター', 'シューズ', 'その他', '小物'];

    // Prepare stats object for badge evaluation
    const stats = {
      totalItems,
      totalWears,
      totalWashes,
      washesReduced,
      maxWears,
      categories
    };

    // Fetch badge definitions and conditions from database
    console.log('Fetching badge definitions, conditions, and user badges');

    let badgeDefinitions, badgeConditions, userBadges;

    try {
      [badgeDefinitions, badgeConditions, userBadges] = await Promise.all([
        fetchBadgeDefinitions(),
        fetchBadgeConditions(),
        fetchUserBadges(userId)
      ]);

      console.log('Successfully fetched badge data:',
        `definitions=${badgeDefinitions.length},`,
        `conditions=${badgeConditions.length},`,
        `userBadges=${userBadges.size}`);

    } catch (e) {
      console.error('Error fetching badge data:', e);
      const defaultBadges = createDefaultBadges(items, stats);
      cache.set('badges', defaultBadges);
      return defaultBadges;
    }

    // If no badge definitions found in database, use default hardcoded badges
    if (!badgeDefinitions || badgeDefinitions.length === 0) {
      console.warn('No badge definitions found in database, using default hardcoded badges');
      const defaultBadges = createDefaultBadges(items, stats);
      cache.set('badges', defaultBadges);
      return defaultBadges;
    }

    // Process badge definitions and evaluate conditions
    const badges: Badge[] = badgeDefinitions.map(def => {
      // Check if badge is already earned
      const isAlreadyEarned = userBadges.has(def.id);
      let isEarned = isAlreadyEarned;
      let earnedDate = isAlreadyEarned ? userBadges.get(def.id) : undefined;
      let progress = 0;

      // If not already earned, evaluate conditions
      if (!isAlreadyEarned) {
        const conditions = badgeConditions.filter(condition => condition.badge_id === def.id);

        // Special case for efficient-washer badge
        if (def.id === 'efficient-washer') {
          isEarned = items.some(item => {
            let currentCount = 0;
            let efficientWashes = 0;

            // Sort wear and wash history by date
            const sortedWears = [...item.wearHistory].sort();
            const sortedWashes = [...item.washHistory].sort();

            // Count wears between washes
            for (const wearDate of sortedWears) {
              currentCount++;
              // Check if there's a wash after this wear
              const nextWash = sortedWashes.find(washDate => washDate >= wearDate);
              if (nextWash) {
                // If the wear count is at least 90% of the threshold, count it as efficient
                if (currentCount >= item.washThreshold * 0.9) {
                  efficientWashes++;
                }
                currentCount = 0;
                // Remove this wash from consideration for future wears
                sortedWashes.splice(sortedWashes.indexOf(nextWash), 1);
              }
            }

            return efficientWashes >= 5;
          });
        } 
        // Normal case: evaluate all conditions
        else if (conditions.length > 0) {
          isEarned = conditions.every(condition => 
            evaluateBadgeCondition(condition, items, stats)
          );

          // Calculate progress for the first condition (if only one condition)
          if (conditions.length === 1) {
            progress = calculateBadgeProgress(conditions[0], stats);
          }
        }
        // Fallback for badges without conditions
        else {
          // Use hardcoded logic for common badges if no conditions defined
          switch (def.id) {
            case 'first-item':
              isEarned = totalItems > 0;
              progress = totalItems > 0 ? 100 : 0;
              break;
            case 'first-wear':
              isEarned = totalWears > 0;
              progress = totalWears > 0 ? 100 : 0;
              break;
            case 'first-wash':
              isEarned = totalWashes > 0;
              progress = totalWashes > 0 ? 100 : 0;
              break;
            case 'item-10-wears':
              isEarned = maxWears >= 10;
              progress = maxWears >= 10 ? 100 : Math.round((maxWears / 10) * 100);
              break;
            case 'item-30-wears':
              isEarned = maxWears >= 30;
              progress = maxWears >= 30 ? 100 : Math.round((maxWears / 30) * 100);
              break;
            case 'item-50-wears':
              isEarned = maxWears >= 50;
              progress = maxWears >= 50 ? 100 : Math.round((maxWears / 50) * 100);
              break;
            case 'wash-reduced-10':
              isEarned = washesReduced >= 10;
              progress = washesReduced >= 10 ? 100 : Math.round((washesReduced / 10) * 100);
              break;
            case 'wash-reduced-50':
              isEarned = washesReduced >= 50;
              progress = washesReduced >= 50 ? 100 : Math.round((washesReduced / 50) * 100);
              break;
            case 'wash-reduced-100':
              isEarned = washesReduced >= 100;
              progress = washesReduced >= 100 ? 100 : Math.round((washesReduced / 100) * 100);
              break;
            case 'category-complete':
              isEarned = allCategories.every(cat => categories.has(cat as CategoryValue));
              progress = Math.round((categories.size / allCategories.length) * 100);
              break;
            case 'eco-warrior':
              isEarned = washesReduced >= 30;
              progress = washesReduced >= 30 ? 100 : Math.round((washesReduced / 30) * 100);
              break;
          }
        }

        // Set earned date for newly earned badges
        if (isEarned) {
          earnedDate = new Date().toISOString();
        }
      }

      // Create Badge object
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        imageUrl: def.image_url,
        isEarned,
        earnedDate,
        progress: isEarned ? 100 : progress,
        category: def.category
      };
    });

    // Save newly earned badges to database
    if (userId) {
      await saveNewlyEarnedBadges(userId, badges);
    }

    // Cache and return badges
    cache.set('badges', badges);
    console.log('getBadges returning data, count:', badges.length, 'earned:', badges.filter(b => b.isEarned).length);
    return badges;
  } catch (error) {
    console.error('Error fetching badges:', error);
    const defaultBadges = createDefaultBadges();
    cache.set('badges', defaultBadges);
    return defaultBadges;
  }
}

// Helper function to create default badges
function createDefaultBadges(items?: AppClothingItem[], stats?: any): Badge[] {
  if (items && stats) {
    // If we have items and stats, calculate badge achievements
    const { totalItems, totalWears, totalWashes, washesReduced, maxWears, categories } = stats;
    const allCategories = ['トップス', 'ボトムス', 'アウター', 'シューズ', 'その他', '小物'];
    const hasAllCategories = allCategories.every(cat => categories.has(cat as CategoryValue));

    const badges = [
      // Usage badges
      {
        id: 'first-item',
        name: '初めてのアイテム登録',
        description: '最初のアイテムを登録しました',
        imageUrl: 'https://example.com/badges/first-item.png',
        isEarned: totalItems > 0,
        earnedDate: totalItems > 0 ? new Date().toISOString() : undefined,
        category: 'usage'
      },
      {
        id: 'first-wear',
        name: '初めての着用記録',
        description: '最初の着用を記録しました',
        imageUrl: 'https://example.com/badges/first-wear.png',
        isEarned: totalWears > 0,
        earnedDate: totalWears > 0 ? new Date().toISOString() : undefined,
        category: 'usage'
      },
      {
        id: 'first-wash',
        name: '初めての洗濯記録',
        description: '最初の洗濯を記録しました',
        imageUrl: 'https://example.com/badges/first-wash.png',
        isEarned: totalWashes > 0,
        earnedDate: totalWashes > 0 ? new Date().toISOString() : undefined,
        category: 'usage'
      },

      // Milestone badges
      {
        id: 'item-10-wears',
        name: '10回着用達成',
        description: '1つのアイテムを10回着用しました',
        imageUrl: 'https://example.com/badges/10-wears.png',
        isEarned: maxWears >= 10,
        earnedDate: maxWears >= 10 ? new Date().toISOString() : undefined,
        progress: maxWears >= 10 ? 100 : Math.round((maxWears / 10) * 100),
        category: 'milestone'
      },
      {
        id: 'item-30-wears',
        name: '30回着用達成',
        description: '1つのアイテムを30回着用しました',
        imageUrl: 'https://example.com/badges/30-wears.png',
        isEarned: maxWears >= 30,
        earnedDate: maxWears >= 30 ? new Date().toISOString() : undefined,
        progress: maxWears >= 30 ? 100 : Math.round((maxWears / 30) * 100),
        category: 'milestone'
      },
      {
        id: 'item-50-wears',
        name: '50回着用達成',
        description: '1つのアイテムを50回着用しました',
        imageUrl: 'https://example.com/badges/50-wears.png',
        isEarned: maxWears >= 50,
        earnedDate: maxWears >= 50 ? new Date().toISOString() : undefined,
        progress: maxWears >= 50 ? 100 : Math.round((maxWears / 50) * 100),
        category: 'milestone'
      },

      // Efficiency badges
      {
        id: 'wash-reduced-10',
        name: '洗濯10回削減',
        description: '洗濯回数を10回削減しました',
        imageUrl: 'https://example.com/badges/wash-10.png',
        isEarned: washesReduced >= 10,
        earnedDate: washesReduced >= 10 ? new Date().toISOString() : undefined,
        progress: washesReduced >= 10 ? 100 : Math.round((washesReduced / 10) * 100),
        category: 'efficiency'
      },
      {
        id: 'wash-reduced-50',
        name: '洗濯50回削減',
        description: '洗濯回数を50回削減しました',
        imageUrl: 'https://example.com/badges/wash-50.png',
        isEarned: washesReduced >= 50,
        earnedDate: washesReduced >= 50 ? new Date().toISOString() : undefined,
        progress: washesReduced >= 50 ? 100 : Math.round((washesReduced / 50) * 100),
        category: 'efficiency'
      },
      {
        id: 'wash-reduced-100',
        name: '洗濯100回削減',
        description: '洗濯回数を100回削減しました',
        imageUrl: 'https://example.com/badges/wash-100.png',
        isEarned: washesReduced >= 100,
        earnedDate: washesReduced >= 100 ? new Date().toISOString() : undefined,
        progress: washesReduced >= 100 ? 100 : Math.round((washesReduced / 100) * 100),
        category: 'efficiency'
      },

      // Special badges
      {
        id: 'category-complete',
        name: 'カテゴリコンプリート',
        description: '全カテゴリでアイテムを登録しました',
        imageUrl: 'https://example.com/badges/category-complete.png',
        isEarned: hasAllCategories,
        earnedDate: hasAllCategories ? new Date().toISOString() : undefined,
        progress: hasAllCategories ? 100 : Math.round((categories.size / allCategories.length) * 100),
        category: 'special'
      },
      {
        id: 'eco-warrior',
        name: 'エコウォリアー',
        description: '環境貢献度が高いユーザーに贈られるバッジ',
        imageUrl: 'https://example.com/badges/eco-warrior.png',
        isEarned: washesReduced >= 30,
        earnedDate: washesReduced >= 30 ? new Date().toISOString() : undefined,
        progress: washesReduced >= 30 ? 100 : Math.round((washesReduced / 30) * 100),
        category: 'special'
      },
      // Additional efficiency badges
      {
        id: 'efficient-washer',
        name: '賢い洗濯',
        description: '洗濯閾値の90%以上で洗濯を5回実施',
        imageUrl: 'https://example.com/badges/efficient-washer.png',
        isEarned: items.some(item => {
          let currentCount = 0;
          let efficientWashes = 0;

          // Sort wear and wash history by date
          const sortedWears = [...item.wearHistory].sort();
          const sortedWashes = [...item.washHistory].sort();

          // Count wears between washes
          for (const wearDate of sortedWears) {
            currentCount++;
            // Check if there's a wash after this wear
            const nextWash = sortedWashes.find(washDate => washDate >= wearDate);
            if (nextWash) {
              // If the wear count is at least 90% of the threshold, count it as efficient
              if (currentCount >= item.washThreshold * 0.9) {
                efficientWashes++;
              }
              currentCount = 0;
              // Remove this wash from consideration for future wears
              sortedWashes.splice(sortedWashes.indexOf(nextWash), 1);
            }
          }

          return efficientWashes >= 5;
        }),
        category: 'efficiency'
      }
    ];

    console.log('createDefaultBadges with items and stats, count:', badges.length, 'earned:', badges.filter(b => b.isEarned).length);
    console.log('Badge categories:', badges.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {}));

    return badges;
  } else {
    // Return default badges with isEarned set to false
    const badges = [
      // Usage badges
      {
        id: 'first-item',
        name: '初めてのアイテム登録',
        description: '最初のアイテムを登録しました',
        imageUrl: 'https://example.com/badges/first-item.png',
        isEarned: false,
        progress: 0,
        category: 'usage'
      },
      {
        id: 'first-wear',
        name: '初めての着用記録',
        description: '最初の着用を記録しました',
        imageUrl: 'https://example.com/badges/first-wear.png',
        isEarned: false,
        progress: 0,
        category: 'usage'
      },
      {
        id: 'first-wash',
        name: '初めての洗濯記録',
        description: '最初の洗濯を記録しました',
        imageUrl: 'https://example.com/badges/first-wash.png',
        isEarned: false,
        progress: 0,
        category: 'usage'
      },

      // Milestone badges
      {
        id: 'item-10-wears',
        name: '10回着用達成',
        description: '1つのアイテムを10回着用しました',
        imageUrl: 'https://example.com/badges/10-wears.png',
        isEarned: false,
        progress: 0,
        category: 'milestone'
      },
      {
        id: 'item-30-wears',
        name: '30回着用達成',
        description: '1つのアイテムを30回着用しました',
        imageUrl: 'https://example.com/badges/30-wears.png',
        isEarned: false,
        progress: 0,
        category: 'milestone'
      },
      {
        id: 'item-50-wears',
        name: '50回着用達成',
        description: '1つのアイテムを50回着用しました',
        imageUrl: 'https://example.com/badges/50-wears.png',
        isEarned: false,
        progress: 0,
        category: 'milestone'
      },

      // Efficiency badges
      {
        id: 'wash-reduced-10',
        name: '洗濯10回削減',
        description: '洗濯回数を10回削減しました',
        imageUrl: 'https://example.com/badges/wash-10.png',
        isEarned: false,
        progress: 0,
        category: 'efficiency'
      },
      {
        id: 'wash-reduced-50',
        name: '洗濯50回削減',
        description: '洗濯回数を50回削減しました',
        imageUrl: 'https://example.com/badges/wash-50.png',
        isEarned: false,
        progress: 0,
        category: 'efficiency'
      },
      {
        id: 'wash-reduced-100',
        name: '洗濯100回削減',
        description: '洗濯回数を100回削減しました',
        imageUrl: 'https://example.com/badges/wash-100.png',
        isEarned: false,
        progress: 0,
        category: 'efficiency'
      },

      // Special badges
      {
        id: 'category-complete',
        name: 'カテゴリコンプリート',
        description: '全カテゴリでアイテムを登録しました',
        imageUrl: 'https://example.com/badges/category-complete.png',
        isEarned: false,
        progress: 0,
        category: 'special'
      },
      {
        id: 'eco-warrior',
        name: 'エコウォリアー',
        description: '環境貢献度が高いユーザーに贈られるバッジ',
        imageUrl: 'https://example.com/badges/eco-warrior.png',
        isEarned: false,
        progress: 0,
        category: 'special'
      },

      // Additional efficiency badges
      {
        id: 'efficient-washer',
        name: '賢い洗濯',
        description: '洗濯閾値の90%以上で洗濯を5回実施',
        imageUrl: 'https://example.com/badges/efficient-washer.png',
        isEarned: false,
        progress: 0,
        category: 'efficiency'
      }
    ];

    console.log('createDefaultBadges with default values, count:', badges.length, 'earned:', badges.filter(b => b.isEarned).length);
    console.log('Badge categories:', badges.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {}));

    return badges;
  }
}

// Get item detail statistics
export async function getItemDetailStats(itemId: string): Promise<ItemDetailStats> {
  const cache = StatisticsCache.getInstance();
  const cachedData = cache.get<ItemDetailStats>('itemDetailStats', itemId);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Fetch the specific item with its history
    const { data: session } = await auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get authenticated client
    const authClient = await getAuthenticatedClient();

    // Get the clothing item
    const { data: item, error } = await authClient
      .from('clothing_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Get wear history
    const { data: wearHistory, error: wearError } = await authClient
      .from('wear_history')
      .select('*')
      .eq('clothing_item_id', itemId);

    if (wearError) throw wearError;

    // Get wash history
    const { data: washHistory, error: washError } = await authClient
      .from('wash_history')
      .select('*')
      .eq('clothing_item_id', itemId);

    if (washError) throw washError;

    // Convert to app format
    const appItem = toAppClothingItem(item, wearHistory, washHistory);

    // Calculate statistics
    const wearCount = appItem.wearHistory.length;
    const washCount = appItem.washHistory.length;
    const wearPerWash = washCount > 0 ? parseFloat((wearCount / washCount).toFixed(1)) : wearCount;
    const efficiency = appItem.washThreshold > 0 ? parseFloat((wearPerWash / appItem.washThreshold).toFixed(2)) : 0;

    // Calculate wear by day of week
    const wearsByDay: { [day: string]: number } = {
      '日曜日': 0, '月曜日': 0, '火曜日': 0, '水曜日': 0, '木曜日': 0, '金曜日': 0, '土曜日': 0
    };

    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

    appItem.wearHistory.forEach(dateStr => {
      const date = new Date(dateStr);
      const day = dayNames[date.getDay()];
      wearsByDay[day]++;
    });

    // Calculate wear by month
    const wearsByMonth: { [month: string]: number } = {};
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    appItem.wearHistory.forEach(dateStr => {
      const date = new Date(dateStr);
      const month = months[date.getMonth()];
      wearsByMonth[month] = (wearsByMonth[month] || 0) + 1;
    });

    // Calculate wear trend (last 6 months)
    const now = new Date();
    const wearTrend: { period: string; count: number }[] = [];
    const washTrend: { period: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[month.getMonth()];
      const monthYear = `${monthName} ${month.getFullYear()}`;

      // Count wears in this month
      const wearsInMonth = appItem.wearHistory.filter(dateStr => {
        const date = new Date(dateStr);
        return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
      }).length;

      // Count washes in this month
      const washesInMonth = appItem.washHistory.filter(dateStr => {
        const date = new Date(dateStr);
        return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
      }).length;

      wearTrend.push({ period: monthName, count: wearsInMonth });
      washTrend.push({ period: monthName, count: washesInMonth });
    }

    // Calculate average wear interval
    let averageWearInterval = 0;
    if (appItem.wearHistory.length > 1) {
      const sortedWears = [...appItem.wearHistory].sort();
      let totalDays = 0;
      let intervals = 0;

      for (let i = 1; i < sortedWears.length; i++) {
        const prevDate = new Date(sortedWears[i-1]);
        const currDate = new Date(sortedWears[i]);
        const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > 0) {
          totalDays += daysDiff;
          intervals++;
        }
      }

      averageWearInterval = intervals > 0 ? parseFloat((totalDays / intervals).toFixed(1)) : 0;
    }

    // Calculate environmental impact
    const ELECTRICITY_PER_WASH = 0.5; // kWh
    const WATER_PER_WASH = 50; // liters
    const CO2_PER_KWH = 0.5; // kg
    const ITEMS_PER_WASH_LOAD = 5; // average items per wash load

    // If we washed after every wear, we would have wearCount washes
    // Instead, we only have washCount washes
    const washesReduced = Math.max(0, (wearCount - washCount) / ITEMS_PER_WASH_LOAD);

    const waterSaved = Math.round(washesReduced * WATER_PER_WASH);
    const energySaved = parseFloat((washesReduced * ELECTRICITY_PER_WASH).toFixed(1));
    const co2Reduced = parseFloat((energySaved * CO2_PER_KWH).toFixed(1));

    // Calculate optimized threshold based on usage pattern
    let optimizedThreshold = appItem.washThreshold;
    if (washCount > 0) {
      // If actual wears between washes is consistently different from threshold,
      // suggest an optimized threshold
      const actualWearsBetweenWashes = wearPerWash;
      const thresholdDiff = Math.abs(actualWearsBetweenWashes - appItem.washThreshold);

      if (thresholdDiff > 1) {
        // Round to nearest integer
        optimizedThreshold = Math.round(actualWearsBetweenWashes);
      }
    }

    const itemDetailStats: ItemDetailStats = {
      id: appItem.id,
      name: appItem.name,
      category: appItem.category,
      brand: appItem.brand,
      imageUrl: appItem.image,
      wearCount,
      washCount,
      wearPerWash,
      efficiency,
      wearsByDay,
      wearsByMonth,
      wearTrend,
      washTrend,
      averageWearInterval,
      lastWornDate: appItem.lastWorn,
      waterSaved,
      energySaved,
      co2Reduced,
      optimizedThreshold: optimizedThreshold !== appItem.washThreshold ? optimizedThreshold : undefined
    };

    cache.set('itemDetailStats', itemDetailStats, itemId);
    return itemDetailStats;
  } catch (error) {
    console.error('Error fetching item detail stats:', error);
    throw error;
  }
}

// Clear all cache
export function clearCache(): void {
  const cache = StatisticsCache.getInstance();
  cache.clear();
}

// Clear specific cache entry
export function clearCacheEntry(type: string, key: string): void {
  const cache = StatisticsCache.getInstance();
  cache.clearEntry(type, key);
}
