import { auth } from '../lib/authClient';
import { CategoryValue } from '../types/categories';
import { AppClothingItem } from '../types/database';
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
  calculateBasicStats,
  calculateEfficiencyData,
  calculateImpactData,
  calculateItemDetailStats,
  calculateRankingData
} from '../utils/statisticsCalculator';
import {
  calculateBadgeProgress,
  evaluateBadgeCondition,
  fetchBadgeData,
  fetchUserBadges,
  saveNewlyEarnedBadges
} from './badgeService';

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

// Get badges (always fresh evaluation)
export async function getBadges(items: AppClothingItem[]): Promise<Badge[]> {
  try {
    // Get user session
    const { data: session, error: sessionError } = await auth.getSession();
    
    // 認証エラーの場合は空の配列を返す
    if (sessionError) {
      if (sessionError.message?.includes('Invalid Refresh Token') || 
          sessionError.message?.includes('Refresh Token Not Found') ||
          sessionError.message?.includes('AuthApiError')) {
        console.log('認証エラーが発生しました - 空のバッジ配列を返します');
        return [];
      }
      throw sessionError;
    }
    
    const userId = session?.session?.user?.id;

    if (!userId) {
      console.log('ユーザーが認証されていません - 空のバッジ配列を返します');
      return [];
    }

    // Fetch badge data and user badges in parallel
    const [badgeData, userBadges] = await Promise.all([
      fetchBadgeData(),
      fetchUserBadges(userId)
    ]);

    const { definitions: badgeDefinitions, conditions: badgeConditions } = badgeData;

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

    // If no badge definitions found in database, use default hardcoded badges
    if (!badgeDefinitions || badgeDefinitions.length === 0) {
      console.warn('No badge definitions found in database, using default hardcoded badges');
      return createDefaultBadges(items, stats);
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
        category: def.category as 'usage' | 'efficiency' | 'milestone' | 'special'
      };
    });

    // Save newly earned badges to database
    if (userId) {
      try {
        await saveNewlyEarnedBadges(userId, badges);
      } catch (error) {
        console.error('Failed to save badges, but continuing with badge data:', error);
        // バッジ保存に失敗してもバッジデータは返す
      }
    }

    return badges;
      } catch (error) {
      console.error('Error fetching badges:', error);
      
      // 認証エラーの場合は空の配列を返す
      if (error instanceof Error && (
          error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('AuthApiError'))) {
        console.log('認証エラーが発生しました - 空のバッジ配列を返します');
        return [];
      }
      
      // その他のエラーの場合はデフォルトバッジを返す
      return createDefaultBadges(items);
    }
}

// Helper function to create default badges
function createDefaultBadges(items?: AppClothingItem[], stats?: any): Badge[] {
  if (items && stats) {
    // If we have items and stats, calculate badge achievements
    const { totalItems, totalWears, totalWashes, washesReduced, maxWears, categories } = stats;
    const allCategories = ['トップス', 'ボトムス', 'アウター', 'シューズ', 'その他', '小物'];
    const hasAllCategories = allCategories.every(cat => categories.has(cat as CategoryValue));

    const badges: Badge[] = [
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

    return badges;
  }

  // Return default badges with isEarned set to false
  const badges: Badge[] = [
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

  return badges;
}

// No cache functions needed - always calculate fresh data
