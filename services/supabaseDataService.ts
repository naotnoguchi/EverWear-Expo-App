// supabaseDataService.ts
import { auth } from '../lib/authClient';
import { getAuthenticatedClient } from '../lib/dbClient';
import { AppClothingItem } from '../types/database';

// すべての衣類アイテムとその履歴を取得
export async function getClothingItemsWithHistory(): Promise<AppClothingItem[]> {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return [];
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // 単一のRPC呼び出しですべてのアイテムと履歴を取得
  const { data, error } = await authClient
    .rpc('get_clothing_items_with_history', { user_id_param: userId });

  if (error) {
    throw error;
  }

  // AppClothingItem形式に変換
  const result: AppClothingItem[] = data.map(item => {
    return {
      id: item.item_id,
      name: item.name,
      category: item.category,
      brand: item.brand_name || '',
      image: item.image_path || '',
      wearCount: item.wear_count,
      washThreshold: item.wash_threshold,
      lastWorn: item.last_worn || '',
      memo: item.memo || '',
      condition: item.condition || '',
      purchasePrice: item.purchase_price,
      wearHistory: Array.isArray(item.wear_dates) ? item.wear_dates : [],
      washHistory: Array.isArray(item.wash_dates) ? item.wash_dates : []
    };
  });

  return result;
}

// 特定のアイテムとその履歴を取得
export async function getSingleItemWithHistory(itemId: string): Promise<AppClothingItem | null> {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // 単一のRPC呼び出しでアイテムと履歴を取得
  const { data, error } = await authClient
    .rpc('get_clothing_item_by_id_with_history', {
      item_id_param: itemId,
      user_id_param: userId
    });

  if (error) {
    throw error;
  }

  // アイテムが見つからない場合
  if (!data || data.length === 0) {
    return null;
  }

  const item = data[0];

  // AppClothingItem形式に変換
  const result = {
    id: item.item_id,
    name: item.name,
    category: item.category,
    brand: item.brand_name || '',  // ブランド名を確実に設定
    image: item.image_path || '',
    wearCount: item.wear_count,
    washThreshold: item.wash_threshold,
    lastWorn: item.last_worn || '',
    memo: item.memo || '',
    condition: item.condition || '',
    purchasePrice: item.purchase_price,
    wearHistory: Array.isArray(item.wear_dates) ? item.wear_dates : [],
    washHistory: Array.isArray(item.wash_dates) ? item.wash_dates : []
  };

  return result;
}