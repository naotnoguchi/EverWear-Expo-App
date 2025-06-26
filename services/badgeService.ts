import { getAuthenticatedClient } from '../lib/dbClient';
import { AppClothingItem, UserBadge, WashHistory, WearHistory } from '../types/database';
import {
  Badge,
  BadgeEvaluationContext,
  evaluateAllBadges,
  getAllBadges,
  getBadgeById
} from './badgeDefinitions';

export interface BadgeWithStatus extends Badge {
  isEarned: boolean;
  earnedDate?: string;
  /** バッジ達成度 (0-100) */
  progress: number;
}

export class BadgeService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // 全バッジの状態を取得
  async getAllBadgesWithStatus(
    items: AppClothingItem[], 
    wearRecords: WearHistory[], 
    washRecords: WashHistory[],
    isPremiumUser: boolean
  ): Promise<BadgeWithStatus[]> {
    try {
      // 評価コンテキストを作成
      const context: BadgeEvaluationContext = {
        items,
        wearRecords,
        washRecords,
        isPremiumUser
      };

      // 現在達成済みのバッジIDを取得
      const achievedBadgeIds = evaluateAllBadges(context);

      // データベースから獲得済みバッジを取得
      const earnedBadges = await this.getEarnedBadges();
      const earnedBadgeMap = new Map(earnedBadges.map(badge => [badge.badge_id, badge]));

      // 全バッジ定義と状態を結合
      const allBadges = getAllBadges();
      return allBadges.map(badge => {
        const isAchieved = achievedBadgeIds.includes(badge.id);
        const earnedBadge = earnedBadgeMap.get(badge.id);

        return {
          ...badge,
          isEarned: !!earnedBadge,
          earnedDate: earnedBadge?.earned_date,
          progress: calculateProgressForBadge(
            badge.id,
            items,
            wearRecords,
            washRecords,
            isPremiumUser
          )
        };
      });
    } catch (error) {
      console.error('Failed to get badges with status:', error);
      throw error;
    }
  }

  // 新規獲得バッジを確認し、通知とデータベース更新を実行
  async checkAndAwardNewBadges(
    items: AppClothingItem[], 
    wearRecords: WearHistory[], 
    washRecords: WashHistory[],
    isPremiumUser: boolean
  ): Promise<Badge[]> {
    try {
      // 評価コンテキストを作成
      const context: BadgeEvaluationContext = {
        items,
        wearRecords,
        washRecords,
        isPremiumUser
      };

      // 現在達成済みのバッジIDを取得
      const achievedBadgeIds = evaluateAllBadges(context);

      // データベースから既に獲得済みのバッジを取得
      const earnedBadges = await this.getEarnedBadges();
      const earnedBadgeIds = earnedBadges.map(badge => badge.badge_id);

      // 新規獲得バッジを特定
      const newBadgeIds = achievedBadgeIds.filter(id => !earnedBadgeIds.includes(id));

      if (newBadgeIds.length > 0) {
        // 新規バッジをデータベースに記録
        await this.saveEarnedBadges(newBadgeIds);

        // 新規バッジのオブジェクトを取得して返す
        const newBadges = newBadgeIds
          .map(id => getBadgeById(id))
          .filter((badge): badge is Badge => badge !== undefined);

        return newBadges;
      }

      return [];
    } catch (error) {
      console.error('Failed to check and award new badges:', error);
      throw error;
    }
  }

  // データベースから獲得済みバッジを取得
  private async getEarnedBadges(): Promise<UserBadge[]> {
    try {
      const client = await getAuthenticatedClient();
      const { data, error } = await client
        .from('user_badges')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get earned badges:', error);
      throw error;
    }
  }

  // 新規獲得バッジをデータベースに保存
  private async saveEarnedBadges(badgeIds: string[]): Promise<void> {
    try {
      const earnedDate = new Date().toISOString();
      const userBadges = badgeIds.map(badgeId => ({
        user_id: this.userId,
        badge_id: badgeId,
        earned_date: earnedDate
      }));

      const client = await getAuthenticatedClient();
      // 重複行は無視し、既存レコードの earned_date を変更しない
      const { error } = await client
        .from('user_badges')
        .upsert(userBadges, {
          onConflict: 'user_id,badge_id',
          ignoreDuplicates: true
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to save earned badges:', error);
      throw error;
    }
  }

  // 特定のバッジが獲得済みかチェック
  async isBadgeEarned(badgeId: string): Promise<boolean> {
    try {
      const client = await getAuthenticatedClient();
      const { data, error } = await client
        .from('user_badges')
        .select('id')
        .eq('user_id', this.userId)
        .eq('badge_id', badgeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Failed to check badge status:', error);
      return false;
    }
  }

  // カテゴリ別バッジを取得
  getBadgesByCategory(category: 'milestone' | 'achievement' | 'special'): Badge[] {
    return getAllBadges().filter(badge => badge.category === category);
  }

  // バッジ統計を取得
  async getBadgeStats(): Promise<{
    totalBadges: number;
    earnedBadges: number;
    completionRate: number;
    earnedByCategory: Record<string, number>;
  }> {
    try {
      const allBadges = getAllBadges();
      const earnedBadges = await this.getEarnedBadges();
      const earnedBadgeIds = earnedBadges.map(badge => badge.badge_id);

      // カテゴリ別獲得数を計算
      const earnedByCategory = allBadges.reduce((acc, badge) => {
        if (earnedBadgeIds.includes(badge.id)) {
          acc[badge.category] = (acc[badge.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        totalBadges: allBadges.length,
        earnedBadges: earnedBadges.length,
        completionRate: Math.round((earnedBadges.length / allBadges.length) * 100),
        earnedByCategory
      };
    } catch (error) {
      console.error('Failed to get badge stats:', error);
      throw error;
    }
  }
}

// ファクトリー関数
export const createBadgeService = (userId: string): BadgeService => {
  return new BadgeService(userId);
};

/**
 * バッジ進捗計算用ユーティリティ関数群
 */

// アイテムごとの最大着用回数を取得
function getMaxWearCountForItem(wearRecords: WearHistory[]): number {
  const wearCounts = new Map<string, number>();
  wearRecords.forEach(record => {
    const count = wearCounts.get(record.clothing_item_id) || 0;
    wearCounts.set(record.clothing_item_id, count + 1);
  });
  return Math.max(0, ...Array.from(wearCounts.values()));
}

// 洗濯削減回数を計算
const ITEMS_PER_WASH_LOAD = 5;
function calculateWashesReduced(
  wearRecords: WearHistory[],
  washRecords: WashHistory[]
): number {
  const totalWears = wearRecords.length;
  const totalWashes = washRecords.length;
  return Math.max(0, Math.floor((totalWears - totalWashes) / ITEMS_PER_WASH_LOAD));
}

// 連続記録の最長日数を取得
function getLongestConsecutiveDays(wearRecords: WearHistory[], washRecords: WashHistory[]): number {
  const allDates = new Set<string>();
  wearRecords.forEach(r => allDates.add(r.wear_date));
  washRecords.forEach(r => allDates.add(r.wash_date));

  const sorted = Array.from(allDates).sort();
  if (sorted.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const cur = new Date(sorted[i]);
    const prev = new Date(sorted[i - 1]);
    const diffDays = Math.floor((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return longest;
}

// 汎用的な進捗計算 (0-100)
function calcProgress(current: number, threshold: number): number {
  return Math.min(100, Math.round((current / threshold) * 100));
}

// バッジID毎の進捗計算
function calculateProgressForBadge(
  badgeId: string,
  items: AppClothingItem[],
  wearRecords: WearHistory[],
  washRecords: WashHistory[],
  isPremium: boolean
): number {
  switch (badgeId) {
    case 'first-item':
      return calcProgress(items.length, 1);
    case 'first-wear':
      return calcProgress(wearRecords.length, 1);
    case 'first-wash':
      return calcProgress(washRecords.length, 1);

    case 'item-collector-5':
      return calcProgress(items.length, 5);
    case 'item-collector-15':
      return calcProgress(items.length, 15);
    case 'item-collector-30':
      return calcProgress(items.length, 30);

    case 'wear-achiever-item-10':
      return calcProgress(getMaxWearCountForItem(wearRecords), 10);
    case 'wear-achiever-item-30':
      return calcProgress(getMaxWearCountForItem(wearRecords), 30);
    case 'wear-achiever-item-50':
      return calcProgress(getMaxWearCountForItem(wearRecords), 50);

    case 'wear-master-10':
      return calcProgress(wearRecords.length, 10);
    case 'wear-master-50':
      return calcProgress(wearRecords.length, 50);
    case 'wear-master-100':
      return calcProgress(wearRecords.length, 100);

    case 'wash-master-10':
      return calcProgress(washRecords.length, 10);
    case 'wash-master-30':
      return calcProgress(washRecords.length, 30);
    case 'wash-master-50':
      return calcProgress(washRecords.length, 50);

    case 'wash-saver-10':
      return calcProgress(calculateWashesReduced(wearRecords, washRecords), 10);
    case 'wash-saver-50':
      return calcProgress(calculateWashesReduced(wearRecords, washRecords), 50);
    case 'wash-saver-100':
      return calcProgress(calculateWashesReduced(wearRecords, washRecords), 100);

    case 'category-master': {
      const categories = new Set<string>();
      items.forEach(item => {
        if (item.category) categories.add(item.category);
      });
      return calcProgress(categories.size, 7);
    }

    case 'premium-unlocked':
      return isPremium ? 100 : 0;

    case 'consistent-tracker':
      return calcProgress(getLongestConsecutiveDays(wearRecords, washRecords), 100);

    default:
      return 0;
  }
}
