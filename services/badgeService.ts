import { auth } from '../lib/authClient';
import { getAuthenticatedClient } from '../lib/dbClient';
import { AppClothingItem } from '../types/database';
import { Badge } from '../types/statistics';
import { BADGE_DEFINITIONS, BadgeDefinition } from './badgeDefinitions';

// ユーザーIDを取得するヘルパー関数
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: session, error: sessionError } = await auth.getSession();
    
    if (sessionError) {
      if (sessionError.message?.includes('Invalid Refresh Token') || 
          sessionError.message?.includes('Refresh Token Not Found') ||
          sessionError.message?.includes('AuthApiError')) {
        console.log('認証エラーが発生しました');
        return null;
      }
      throw sessionError;
    }
    
    return session?.session?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// ユーザーの獲得済みバッジを取得
export async function fetchUserBadges(userId: string): Promise<Map<string, string>> {
  try {
    const authClient = await getAuthenticatedClient();

    const { data, error } = await authClient
      .from('user_badges')
      .select('badge_id, earned_date')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }

    // バッジIDと獲得日のマップを作成
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

// 新規獲得バッジをデータベースに保存
export async function saveNewlyEarnedBadges(userId: string, badges: Badge[]): Promise<void> {
  try {
    if (!userId || badges.length === 0) {
      return;
    }

    // 認証状態を確認
    const { data: { user } } = await auth.getUser();
    if (!user) {
      return;
    }

    // 既存バッジを取得
    const existingBadges = await fetchUserBadges(userId);

    // 新規獲得バッジをフィルタリング
    const newlyEarnedBadges = badges.filter(
      badge => badge.isEarned && !existingBadges.has(badge.id)
    );

    if (newlyEarnedBadges.length === 0) {
      return;
    }

    // 挿入用データを準備
    const badgesToInsert = newlyEarnedBadges.map(badge => ({
      user_id: userId,
      badge_id: badge.id,
      earned_date: badge.earnedDate || new Date().toISOString()
    }));

    const authClient = await getAuthenticatedClient();

    // データベースにバッジを保存
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

// メインのバッジ評価・取得関数
export async function getBadges(items: AppClothingItem[]): Promise<Badge[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('ユーザーが認証されていません - 空のバッジ配列を返します');
      return [];
    }

    // 既獲得バッジを取得
    const earnedBadgeMap = await fetchUserBadges(userId);

    // 各バッジ定義を評価してBadgeオブジェクトを作成
    const badges: Badge[] = BADGE_DEFINITIONS.map(definition => {
      const isAlreadyEarned = earnedBadgeMap.has(definition.id);
      
      if (isAlreadyEarned) {
        // 既に獲得済みの場合
        return {
          id: definition.id,
          name: definition.name,
          description: definition.description,
          imageUrl: definition.imageUrl,
          category: definition.category,
          isEarned: true,
          earnedDate: earnedBadgeMap.get(definition.id),
          progress: 100
        };
      } else {
        // 新規評価
        const evaluation = definition.evaluate(items);
        return {
          id: definition.id,
          name: definition.name,
          description: definition.description,
          imageUrl: definition.imageUrl,
          category: definition.category,
          isEarned: evaluation.isEarned,
          earnedDate: evaluation.isEarned ? new Date().toISOString() : undefined,
          progress: evaluation.progress
        };
      }
    });

    // 新規獲得バッジを保存
    await saveNewlyEarnedBadges(userId, badges);

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
    
    // その他のエラーの場合もエラーをスローせず、空の配列を返す
    console.warn('バッジ取得でエラーが発生しましたが、空の配列を返します');
    return [];
  }
}

// バッジ定義を取得する関数群（クライアント側の定義を返す）
export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return BADGE_DEFINITIONS;
}

export function getBadgeDefinitionById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.id === id);
}

export function getBadgeDefinitionsByCategory(category: 'usage' | 'efficiency' | 'milestone' | 'special'): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => badge.category === category);
}
