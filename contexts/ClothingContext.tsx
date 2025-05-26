// contexts/ClothingContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { clothingService, AppClothingItem } from '../services/clothingServiceFactory';

// ヘルパー関数: 日付をローカルタイムゾーンでISO形式の文字列に変換
function formatDateToLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Use AppClothingItem from our database types
type ClothingItem = AppClothingItem;

interface ClothingContextType {
  clothingItems: ClothingItem[];
  loading: boolean;
  error: string | null;
  wearItem: (id: string, date?: string) => Promise<boolean>; // 成功時はtrue、重複時はfalseを返す
  washItem: (id: string, date?: string) => Promise<boolean>; // 成功時はtrue、重複時はfalseを返す
  addItem: (item: Omit<ClothingItem, 'id'>) => Promise<void>;
  updateItem: (item: ClothingItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteWearHistory: (itemId: string, date: string) => Promise<boolean>; // 成功時はtrue、失敗時はfalseを返す
  deleteWashHistory: (itemId: string, date: string) => Promise<boolean>; // 成功時はtrue、失敗時はfalseを返す
  // ソート関連の状態を追加
  sortConfig: {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
  updateSortConfig: (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => void;

  // ブランド管理機能
  brands: string[]; // システムに登録されているブランドリスト
  addBrand: (brand: string) => Promise<void>; // 新しいブランドをシステムに追加
  getBrandSuggestions: (query: string) => string[]; // 検索クエリに基づくブランド候補を取得
  refreshData: () => Promise<void>; // データを再読み込みする関数
}

const ClothingContext = createContext<ClothingContextType | undefined>(undefined);

// No longer need hardcoded initial data as we'll load from the service

export function ClothingProvider({ children }: { children: ReactNode }) {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ソート設定の状態を追加
  const [sortConfig, setSortConfig] = useState<{sortBy: string; sortDirection: 'asc' | 'desc'}>({
    sortBy: 'none',
    sortDirection: 'asc'
  });

  // ブランド管理のための状態
  const [brands, setBrands] = useState<string[]>([]);

  // データを読み込む関数
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 衣類アイテムを取得
      const items = await clothingService.getClothingItems();
      setClothingItems(items);

      // ブランドを取得
      const brandList = await clothingService.getBrands();
      setBrands(brandList);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // コンポーネントマウント時にデータを読み込む
  useEffect(() => {
    loadData();
  }, [loadData]);

  // データを再読み込みする関数
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // ソート設定を更新する関数
  const updateSortConfig = (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => {
    setSortConfig(config);
  };

  // 新しいブランドを追加する関数
  const addBrand = async (brand: string) => {
    if (!brand) return;

    try {
      await clothingService.addBrand(brand);
      // ブランドリストを更新
      const updatedBrands = await clothingService.getBrands();
      setBrands(updatedBrands);
    } catch (err) {
      console.error('Failed to add brand:', err);
      setError('ブランドの追加に失敗しました');
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
  const wearItem = async (id: string, date?: string): Promise<boolean> => {
    // dateパラメータが提供されていない場合は今日の日付を使用
    const recordDate = date || formatDateToLocalISOString(new Date());

    try {
      const success = await clothingService.addWearRecord(id, recordDate);
      if (success) {
        // データを再読み込み
        await loadData();
      }
      return success;
    } catch (err) {
      console.error('Failed to record wear:', err);
      setError('着用記録の追加に失敗しました');
      return false;
    }
  };

  const washItem = async (id: string, date?: string): Promise<boolean> => {
    // dateパラメータが提供されていない場合は今日の日付を使用
    const recordDate = date || formatDateToLocalISOString(new Date());

    try {
      const success = await clothingService.addWashRecord(id, recordDate);
      if (success) {
        // データを再読み込み
        await loadData();
      }
      return success;
    } catch (err) {
      console.error('Failed to record wash:', err);
      setError('洗濯記録の追加に失敗しました');
      return false;
    }
  };

  const addItem = async (item: Omit<ClothingItem, 'id'>) => {
    try {
      await clothingService.addClothingItem(item);
      // データを再読み込み
      await loadData();
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('アイテムの追加に失敗しました');
    }
  };

  const updateItem = async (updatedItem: ClothingItem) => {
    try {
      await clothingService.updateClothingItem(updatedItem);
      // データを再読み込み
      await loadData();
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('アイテムの更新に失敗しました');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await clothingService.deleteClothingItem(id);
      // データを再読み込み
      await loadData();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('アイテムの削除に失敗しました');
    }
  };

  // 着用履歴を削除する関数
  const deleteWearHistory = async (itemId: string, date: string): Promise<boolean> => {
    try {
      const success = await clothingService.deleteWearRecord(itemId, date);
      if (success) {
        // データを再読み込み
        await loadData();
      }
      return success;
    } catch (err) {
      console.error('Failed to delete wear history:', err);
      setError('着用履歴の削除に失敗しました');
      return false;
    }
  };

  // 洗濯履歴を削除する関数
  const deleteWashHistory = async (itemId: string, date: string): Promise<boolean> => {
    try {
      const success = await clothingService.deleteWashRecord(itemId, date);
      if (success) {
        // データを再読み込み
        await loadData();
      }
      return success;
    } catch (err) {
      console.error('Failed to delete wash history:', err);
      setError('洗濯履歴の削除に失敗しました');
      return false;
    }
  };

  return (
    <ClothingContext.Provider
      value={{
        clothingItems,
        loading,
        error,
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
        getBrandSuggestions,
        refreshData
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
