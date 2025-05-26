// contexts/ClothingContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// ヘルパー関数: 日付をローカルタイムゾーンでISO形式の文字列に変換
function formatDateToLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  brand: string; // ブランド情報
  image: string;
  wearCount: number;
  washThreshold: number;
  lastWorn: string;
  wearHistory: string[]; // 着用履歴の日付配列
  washHistory: string[]; // 洗濯履歴の日付配列
}

interface ClothingContextType {
  clothingItems: ClothingItem[];
  wearItem: (id: string, date?: string) => boolean; // 成功時はtrue、重複時はfalseを返す
  washItem: (id: string, date?: string) => boolean; // 成功時はtrue、重複時はfalseを返す
  addItem: (item: Omit<ClothingItem, 'id'>) => void;
  updateItem: (item: ClothingItem) => void;
  deleteItem: (id: string) => void;
  deleteWearHistory: (itemId: string, date: string) => boolean; // 成功時はtrue、失敗時はfalseを返す
  deleteWashHistory: (itemId: string, date: string) => boolean; // 成功時はtrue、失敗時はfalseを返す
  // ソート関連の状態を追加
  sortConfig: {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
  updateSortConfig: (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => void;

  // ブランド管理機能
  brands: string[]; // システムに登録されているブランドリスト
  addBrand: (brand: string) => void; // 新しいブランドをシステムに追加
  getBrandSuggestions: (query: string) => string[]; // 検索クエリに基づくブランド候補を取得
}

const ClothingContext = createContext<ClothingContextType | undefined>(undefined);

// ダミーデータ
const initialItems: ClothingItem[] = [
  {
    id: "1",
    name: "お気に入りの白シャツ",
    category: "トップス",
    brand: "ユニクロ",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80",
    wearCount: 2,
    washThreshold: 3,
    lastWorn: "2023-10-15",
    wearHistory: ["2023-10-10", "2023-10-15"],
    washHistory: ["2023-10-05"],
  },
  {
    id: "2",
    name: "黒パンツ",
    category: "ボトムス",
    brand: "GU",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
    wearCount: 3,
    washThreshold: 3,
    lastWorn: "2023-10-14",
    wearHistory: ["2023-10-08", "2023-10-12", "2023-10-14"],
    washHistory: ["2023-10-09"],
  },
  {
    id: "3",
    name: "デニムジャケット",
    category: "アウター",
    brand: "リーバイス",
    image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
    wearCount: 1,
    washThreshold: 5,
    lastWorn: "2023-10-10",
    wearHistory: ["2023-10-10"],
    washHistory: [],
  },
  {
    id: "4",
    name: "グレーのセーター",
    category: "トップス",
    brand: "無印良品",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
    wearCount: 2,
    washThreshold: 4,
    lastWorn: "2023-10-12",
    wearHistory: ["2023-10-07", "2023-10-12"],
    washHistory: ["2023-10-01"],
  },
  {
    id: "5",
    name: "チノパン",
    category: "ボトムス",
    brand: "H&M",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=397&q=80",
    wearCount: 4,
    washThreshold: 4,
    lastWorn: "2023-10-13",
    wearHistory: ["2023-10-03", "2023-10-07", "2023-10-10", "2023-10-13"],
    washHistory: ["2023-10-04", "2023-10-11"],
  },
];

export function ClothingProvider({ children }: { children: ReactNode }) {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>(initialItems);
  // ソート設定の状態を追加
  const [sortConfig, setSortConfig] = useState<{sortBy: string; sortDirection: 'asc' | 'desc'}>({
    sortBy: 'none',
    sortDirection: 'asc'
  });

  // ブランド管理のための状態
  const [brands, setBrands] = useState<string[]>([
    "ユニクロ", "GU", "無印良品", "H&M", "ZARA", "GAP", "BEAMS", 
    "ナイキ", "アディダス", "プーマ", "リーバイス", "ラコステ", "ポロ・ラルフローレン"
  ]);

  // ソート設定を更新する関数
  const updateSortConfig = (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => {
    setSortConfig(config);
  };

  // 新しいブランドを追加する関数
  const addBrand = (brand: string) => {
    if (brand && !brands.includes(brand)) {
      setBrands([...brands, brand]);
    }
  };

  // ブランド候補を検索する関数
  const getBrandSuggestions = (query: string): string[] => {
    if (!query) return brands;
    return brands.filter(brand => 
      brand.toLowerCase().includes(query.toLowerCase())
    );
  };

  // 着用ボタンクリック時の処理を修正
  const wearItem = (id: string, date?: string): boolean => {
    // dateパラメータが提供されていない場合は今日の日付を使用
    const recordDate = date || formatDateToLocalISOString(new Date());

    // 該当アイテムを検索
    const targetItem = clothingItems.find(item => item.id === id);

    // アイテムが見つからない場合はfalseを返す
    if (!targetItem) return false;

    // 既に同じ日付の記録が存在するかチェック
    if (targetItem.wearHistory && targetItem.wearHistory.includes(recordDate)) {
      // 重複している場合はfalseを返す
      return false;
    }

    // 重複していない場合は記録を追加
    setClothingItems(clothingItems.map(item => 
      item.id === id
        ? {
            ...item,
            wearCount: item.wearCount + 1,
            lastWorn: recordDate,
            // wearHistoryが存在しない場合は空の配列を初期値として使用
            wearHistory: [...(item.wearHistory || []), recordDate]
          }
        : item
    ));

    // 成功したらtrueを返す
    return true;
  };

const washItem = (id: string, date?: string): boolean => {
  // dateパラメータが提供されていない場合は今日の日付を使用
  const recordDate = date || formatDateToLocalISOString(new Date());

  // 該当アイテムを検索
  const targetItem = clothingItems.find(item => item.id === id);

  // アイテムが見つからない場合はfalseを返す
  if (!targetItem) return false;

  // 既に同じ日付の記録が存在するかチェック
  if (targetItem.washHistory && targetItem.washHistory.includes(recordDate)) {
    // 重複している場合はfalseを返す
    return false;
  }

  // 重複していない場合は記録を追加
  setClothingItems(clothingItems.map(item => 
    item.id === id
      ? {
          ...item,
          wearCount: 0,
          // washHistoryが存在しない場合は空の配列を初期値として使用
          washHistory: [...(item.washHistory || []), recordDate]
        }
      : item
  ));

  // 成功したらtrueを返す
  return true;
};

  const addItem = (item: Omit<ClothingItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(), // 簡易的なID生成
      wearHistory: item.wearHistory || [],
      washHistory: item.washHistory || [],
    };
    setClothingItems([...clothingItems, newItem]);
  };

  const updateItem = (updatedItem: ClothingItem) => {
    setClothingItems(
      clothingItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setClothingItems(clothingItems.filter((item) => item.id !== id));
  };

  // 着用履歴を削除する関数
  const deleteWearHistory = (itemId: string, date: string): boolean => {
    // 該当アイテムを検索
    const targetItem = clothingItems.find(item => item.id === itemId);

    // アイテムが見つからない場合はfalseを返す
    if (!targetItem) return false;

    // 該当する日付の履歴が存在するかチェック
    if (!targetItem.wearHistory || !targetItem.wearHistory.includes(date)) {
      return false;
    }

    // 履歴から該当する日付を削除
    const updatedWearHistory = targetItem.wearHistory.filter(d => d !== date);

    // 最終着用日の更新
    let updatedLastWorn = targetItem.lastWorn;
    if (targetItem.lastWorn === date) {
      // 削除する日付が最終着用日の場合、残りの履歴から最新の日付を取得
      updatedLastWorn = updatedWearHistory.length > 0 
        ? updatedWearHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : "";
    }

    // 着用回数の更新（削除した分だけ減らす）
    const updatedWearCount = Math.max(0, targetItem.wearCount - 1);

    // アイテムを更新
    setClothingItems(clothingItems.map(item => 
      item.id === itemId
        ? {
            ...item,
            wearCount: updatedWearCount,
            lastWorn: updatedLastWorn,
            wearHistory: updatedWearHistory
          }
        : item
    ));

    return true;
  };

  // 洗濯履歴を削除する関数
  const deleteWashHistory = (itemId: string, date: string): boolean => {
    // 該当アイテムを検索
    const targetItem = clothingItems.find(item => item.id === itemId);

    // アイテムが見つからない場合はfalseを返す
    if (!targetItem) return false;

    // 該当する日付の履歴が存在するかチェック
    if (!targetItem.washHistory || !targetItem.washHistory.includes(date)) {
      return false;
    }

    // 履歴から該当する日付を削除
    const updatedWashHistory = targetItem.washHistory.filter(d => d !== date);

    // アイテムを更新
    setClothingItems(clothingItems.map(item => 
      item.id === itemId
        ? {
            ...item,
            washHistory: updatedWashHistory
          }
        : item
    ));

    return true;
  };

  return (
    <ClothingContext.Provider
      value={{
        clothingItems,
        wearItem,
        washItem,
        addItem,
        updateItem,
        deleteItem,
        deleteWearHistory,
        deleteWashHistory,
        sortConfig,
        updateSortConfig,
        // ブランド管理機能
        brands,
        addBrand,
        getBrandSuggestions
      }}
    >
      {children}
    </ClothingContext.Provider>
  );
}

export function useClothing() {
  const context = useContext(ClothingContext);
  if (context === undefined) {
    throw new Error('useClothing must be used within a ClothingProvider');
  }
  return context;
}
