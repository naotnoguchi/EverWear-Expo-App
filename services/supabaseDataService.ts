// supabaseDataService.ts
import { auth } from '../lib/authClient';
import { getAuthenticatedClient } from '../lib/dbClient';
import { AppClothingItem } from '../types/database';

// すべての衣類アイテムとその履歴を取得
export async function getClothingItemsWithHistory(): Promise<AppClothingItem[]> {
  console.log('共通データサービス: すべてのアイテムと履歴の取得開始');
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    console.log('共通データサービス: ユーザー認証エラー - 認証されていないユーザー');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // 単一のRPC呼び出しですべてのアイテムと履歴を取得
  console.log('共通データサービス: get_clothing_items_with_history RPCを呼び出し');
  const { data, error } = await authClient
    .rpc('get_clothing_items_with_history', { user_id_param: userId });

  if (error) {
    console.log(`共通データサービス: アイテム取得エラー: ${error.message}`);
    throw error;
  }

  console.log(`共通データサービス: ${data.length}件のアイテムとその履歴を取得`);

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
  console.log(`共通データサービス: 単一アイテムと履歴の取得開始: ID=${itemId}`);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    console.log('共通データサービス: ユーザー認証エラー - 認証されていないユーザー');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // 単一のRPC呼び出しでアイテムと履歴を取得
  console.log(`共通データサービス: get_clothing_item_by_id_with_history RPCを呼び出し: ID=${itemId}`);
  const { data, error } = await authClient
    .rpc('get_clothing_item_by_id_with_history', {
      item_id_param: itemId,
      user_id_param: userId
    });

  if (error) {
    console.log(`共通データサービス: アイテム取得エラー: ${error.message}`);
    throw error;
  }

  // アイテムが見つからない場合
  if (!data || data.length === 0) {
    console.log(`共通データサービス: アイテムが見つかりません: ID=${itemId}`);
    return null;
  }

  const item = data[0];
  console.log(`共通データサービス: アイテムデータ取得成功: ${item.name}`);

  // AppClothingItem形式に変換
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
}