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
          earnedDate: earnedBadge?.earned_date
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
      const { error } = await client
        .from('user_badges')
        .insert(userBadges);

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
