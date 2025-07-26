// types/categories.ts

// カテゴリIDの型（データベースで使用される英語ID）
export type CategoryId = "tops" | "bottoms" | "jacket" | "outerwear" | "setup" | "dress" | "shoes" | "bag" | "accessories" | "others";

// カテゴリの値の型（データベースで使用される値 - 英語IDに統一）
export type CategoryValue = CategoryId | null;

// カテゴリ定義のインターフェース（英語IDベース）
export interface Category {
  id: CategoryId;
  iconName: string;
}

// カテゴリ定義の配列（英語IDベース、アプリケーション全体で使用）
export const CATEGORIES: Category[] = [
  { id: "tops", iconName: "shirt-outline" },
  { id: "bottoms", iconName: "file-tray-outline" },
  { id: "jacket", iconName: "library-outline" },
  { id: "outerwear", iconName: "hand-left-outline" },
  { id: "setup", iconName: "layers-outline" },
  { id: "dress", iconName: "woman-outline" },
  { id: "shoes", iconName: "footsteps-outline" },
  { id: "bag", iconName: "bag-outline" },
  { id: "accessories", iconName: "glasses-outline" },
  { id: "others", iconName: "ellipsis-horizontal-circle-outline" }
];

// カテゴリIDから翻訳キーを取得するヘルパー関数
export function getCategoryTranslationKey(categoryId: CategoryId): string {
  return `categories.${categoryId}`;
}

// カテゴリIDからアイコン名を取得するヘルパー関数
export function getCategoryIconName(categoryId: CategoryId): string {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.iconName : "ellipsis-horizontal-circle-outline";
}

// 文字列値からカテゴリIDを取得するヘルパー関数（移行期間用）
export function getCategoryIdByValueExtended(value: string | null): CategoryId {
  if (!value) return "others";
  
  // 既に英語IDの場合
  const validIds: CategoryId[] = ["tops", "bottoms", "jacket", "outerwear", "setup", "dress", "shoes", "bag", "accessories", "others"];
  if (validIds.includes(value as CategoryId)) {
    return value as CategoryId;
  }
  
  // 日本語表示名から英語IDへのマッピング（移行期間用）
  const legacyMapping: Record<string, CategoryId> = {
    'トップス': 'tops',
    'ボトムス': 'bottoms',
    'ジャケット': 'jacket',
    'アウター': 'outerwear',
    'セットアップ': 'setup',
    'ワンピース': 'dress',
    'シューズ': 'shoes',
    'バッグ': 'bag',
    '小物': 'accessories',
    'その他': 'others'
  };
  
  return legacyMapping[value] || 'others';
}
