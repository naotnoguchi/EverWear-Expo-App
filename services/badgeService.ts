import { db, getAuthenticatedClient } from '../lib/dbClient';
import { CategoryValue } from '../types/categories';
import { AppClothingItem } from '../types/database';
import { Badge } from '../types/statistics';

// Fetch badge definitions and conditions from the database in a single query
export async function fetchBadgeData(): Promise<{ definitions: any[], conditions: any[] }> {
  try {
    // Fetch badge definitions with their conditions using a JOIN query
    const { data: definitionsWithConditions, error: definitionsError } = await db
      .from('badge_definitions')
      .select(`
        *,
        badge_conditions(*)
      `)
      .eq('is_active', true)
      .order('display_order');

    if (definitionsError) {
      console.error('Error fetching badge definitions with conditions:', definitionsError);
      throw definitionsError;
    }

    // Extract definitions and conditions from the joined result
    const definitions = definitionsWithConditions || [];
    const conditions: any[] = [];

    // Extract conditions from each definition
    definitions.forEach(def => {
      if (def.badge_conditions && Array.isArray(def.badge_conditions)) {
        conditions.push(...def.badge_conditions);
        // Remove the conditions from the definition to keep the structure clean
        delete def.badge_conditions;
      }
    });

    return { definitions, conditions };
  } catch (e) {
    console.error('Exception in fetchBadgeData:', e);
    return { definitions: [], conditions: [] };
  }
}

// Legacy functions for backward compatibility
export async function fetchBadgeDefinitions(): Promise<any[]> {
  try {
    const { definitions } = await fetchBadgeData();
    return definitions;
  } catch (e) {
    console.error('Exception in fetchBadgeDefinitions:', e);
    return [];
  }
}

export async function fetchBadgeConditions(): Promise<any[]> {
  try {
    const { conditions } = await fetchBadgeData();
    return conditions;
  } catch (e) {
    console.error('Exception in fetchBadgeConditions:', e);
    return [];
  }
}

// Fetch user's earned badges from the database
export async function fetchUserBadges(userId: string): Promise<Map<string, string>> {
  try {
    // Get authenticated client
    const authClient = await getAuthenticatedClient();

    const { data, error } = await authClient
      .from('user_badges')
      .select('badge_id, earned_date')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }

    // Create a map of badge IDs to earned dates
    const badgeMap = new Map<string, string>();
    data.forEach(badge => {
      badgeMap.set(badge.badge_id, badge.earned_date);
    });

    return badgeMap;
  } catch (e) {
    console.error('Exception in fetchUserBadges:', e);
    return new Map<string, string>();
  }
}

// Save newly earned badges to the database
export async function saveNewlyEarnedBadges(userId: string, earnedBadges: Badge[]): Promise<void> {
  try {
    if (!userId || earnedBadges.length === 0) {
      return;
    }

    // Get existing badges
    const existingBadges = await fetchUserBadges(userId);

    // Filter out badges that are already earned
    const newlyEarnedBadges = earnedBadges.filter(
      badge => badge.isEarned && !existingBadges.has(badge.id)
    );

    if (newlyEarnedBadges.length === 0) {
      return;
    }

    // Prepare badges for insertion
    const badgesToInsert = newlyEarnedBadges.map(badge => ({
      user_id: userId,
      badge_id: badge.id,
      earned_date: badge.earnedDate || new Date().toISOString()
    }));

    // Get authenticated client
    const authClient = await getAuthenticatedClient();

    // Insert badges into the database
    const { error } = await authClient
      .from('user_badges')
      .upsert(badgesToInsert, { onConflict: 'user_id,badge_id' });

    if (error) {
      console.error('Error saving badges to database:', error);
      throw error;
    }


  } catch (e) {
    console.error('Exception in saveNewlyEarnedBadges:', e);
  }
}

// Evaluate badge conditions
export function evaluateBadgeCondition(
  condition: any, 
  items: AppClothingItem[],
  stats: {
    totalItems: number;
    totalWears: number;
    totalWashes: number;
    washesReduced: number;
    maxWears: number;
    categories: Set<CategoryValue>;
  }
): boolean {
  const { condition_type, condition_value } = condition;
  const value = typeof condition_value === 'string' ? JSON.parse(condition_value) : condition_value;

  switch (condition_type) {
    case 'total_items':
      return stats.totalItems >= value.min;

    case 'total_wears':
      return stats.totalWears >= value.min;

    case 'total_washes':
      return stats.totalWashes >= value.min;

    case 'max_item_wears':
      return stats.maxWears >= value.min;

    case 'washes_reduced':
      return stats.washesReduced >= value.min;

    case 'all_categories':
      return value.categories.every(cat => stats.categories.has(cat));

    case 'efficient_washer':
      // Complex condition for efficient washer badge
      return items.some(item => {
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

    default:
      return false;
  }
}

// Calculate badge progress
export function calculateBadgeProgress(
  condition: any,
  stats: {
    totalItems: number;
    totalWears: number;
    totalWashes: number;
    washesReduced: number;
    maxWears: number;
    categories: Set<CategoryValue>;
  }
): number {
  const { condition_type, condition_value } = condition;
  const value = typeof condition_value === 'string' ? JSON.parse(condition_value) : condition_value;

  switch (condition_type) {
    case 'total_items':
      return Math.min(100, Math.round((stats.totalItems / value.min) * 100));

    case 'total_wears':
      return Math.min(100, Math.round((stats.totalWears / value.min) * 100));

    case 'total_washes':
      return Math.min(100, Math.round((stats.totalWashes / value.min) * 100));

    case 'max_item_wears':
      return Math.min(100, Math.round((stats.maxWears / value.min) * 100));

    case 'washes_reduced':
      return Math.min(100, Math.round((stats.washesReduced / value.min) * 100));

    case 'all_categories':
      return Math.min(100, Math.round((stats.categories.size / value.categories.length) * 100));

    default:
      return 0;
  }
}
