// contexts/ClothingContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image: string;
  wearCount: number;
  washThreshold: number;
  lastWorn: string;
  wearHistory: string[]; // 着用履歴の日付配列
  washHistory: string[]; // 洗濯履歴の日付配列
}

interface ClothingContextType {
  clothingItems: ClothingItem[];
  wearItem: (id: string) => void;
  washItem: (id: string) => void;
  addItem: (item: Omit<ClothingItem, 'id'>) => void;
  updateItem: (item: ClothingItem) => void;
  deleteItem: (id: string) => void;
  // ソート関連の状態を追加
  sortConfig: {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
  updateSortConfig: (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => void;
}

const ClothingContext = createContext<ClothingContextType | undefined>(undefined);

// ダミーデータ
const initialItems: ClothingItem[] = [
  {
    id: "1",
    name: "お気に入りの白シャツ",
    category: "トップス",
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

  // ソート設定を更新する関数
  const updateSortConfig = (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => {
    setSortConfig(config);
  };

  // 着用ボタンクリック時の処理を修正
  const wearItem = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    setClothingItems(clothingItems.map(item => 
      item.id === id
        ? {
            ...item,
            wearCount: item.wearCount + 1,
            lastWorn: today,
            // wearHistoryが存在しない場合は空の配列を初期値として使用
            wearHistory: [...(item.wearHistory || []), today]
          }
        : item
    ));
  };

const washItem = (id: string) => {
  const today = new Date().toISOString().split("T")[0];
  setClothingItems(clothingItems.map(item => 
    item.id === id
      ? {
          ...item,
          wearCount: 0,
          // washHistoryが存在しない場合は空の配列を初期値として使用
          washHistory: [...(item.washHistory || []), today]
        }
      : item
  ));
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

  return (
    <ClothingContext.Provider
      value={{
        clothingItems,
        wearItem,
        washItem,
        addItem,
        updateItem,
        deleteItem,
        sortConfig,
        updateSortConfig
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