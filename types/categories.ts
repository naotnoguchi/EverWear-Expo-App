// types/categories.ts

// カテゴリIDの列挙型（型安全性の強化）
export enum CategoryId {
  ALL = "all",
  TOPS = "tops",
  BOTTOMS = "bottoms",
  OUTERWEAR = "outerwear",
  ACCESSORIES = "accessories",
  SHOES = "shoes",
  OTHERS = "others"
}

// カテゴリの表示名の型（型安全性の強化）
export type CategoryDisplayName = "すべて" | "トップス" | "ボトムス" | "アウター" | "小物" | "シューズ" | "その他";

// カテゴリの値の型（データベースで使用される値）
export type CategoryValue = "トップス" | "ボトムス" | "アウター" | "小物" | "シューズ" | "その他" | null;

// カテゴリ定義のインターフェース
export interface Category {
  id: CategoryId;
  name: CategoryDisplayName;
  value: CategoryValue;
}

// カテゴリ定義の配列（アプリケーション全体で使用）
export const CATEGORIES: Category[] = [
  { id: CategoryId.ALL, name: "すべて", value: null },
  { id: CategoryId.TOPS, name: "トップス", value: "トップス" },
  { id: CategoryId.BOTTOMS, name: "ボトムス", value: "ボトムス" },
  { id: CategoryId.OUTERWEAR, name: "アウター", value: "アウター" },
  { id: CategoryId.ACCESSORIES, name: "小物", value: "小物" },
  { id: CategoryId.SHOES, name: "シューズ", value: "シューズ" },
  { id: CategoryId.OTHERS, name: "その他", value: "その他" }
];

// カテゴリIDから対応するカテゴリ値を取得するヘルパー関数
export function getCategoryValueById(categoryId: CategoryId): CategoryValue {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.value : null;
}

// カテゴリIDから対応するカテゴリ名を取得するヘルパー関数
export function getCategoryNameById(categoryId: CategoryId): CategoryDisplayName {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  if (!category) throw new Error(`Invalid category ID: ${categoryId}`);
  return category.name;
}

// カテゴリ値からカテゴリIDを取得するヘルパー関数
export function getCategoryIdByValue(value: CategoryValue): CategoryId {
  const category = CATEGORIES.find(cat => cat.value === value);
  return category ? category.id : CategoryId.ALL;
}
