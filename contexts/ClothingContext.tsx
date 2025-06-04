// contexts/ClothingContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { clothingService, AppClothingItem } from '../services/clothingServiceFactory';
import { formatDateToLocalISOString, formatDateJapanese } from '../lib/dateUtils';
import { ExtendedBrand } from '../types/database';

// Use AppClothingItem from our database types
type ClothingItem = AppClothingItem;

interface ClothingContextType {
  clothingItems: ClothingItem[];
  loading: boolean;
  error: string | null;
  wearItem: (id: string, date?: string) => Promise<boolean>; // 成功時はtrue、重複時はfalseを返す
  washItem: (id: string, date?: string) => Promise<boolean>; // 成功時はtrue、重複時はfalseを返す
  addItem: (item: Omit<ClothingItem, 'id'>, imageUri?: string) => Promise<void>;
  updateItem: (item: ClothingItem, imageUri?: string) => Promise<void>;
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
  extendedBrands: ExtendedBrand[]; // 拡張ブランド情報
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
  const [extendedBrands, setExtendedBrands] = useState<ExtendedBrand[]>([]);

  // データを読み込む関数
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 衣類アイテムを取得
      const items = await clothingService.getClothingItems();
      setClothingItems(items);

      // ブランドを取得（キャッシュ優先）
      const brandList = await clothingService.getAllBrands();
      setBrands(brandList);

      // 拡張ブランド情報も取得（検索用）
      if (clothingService.getExtendedBrands) {
        try {
          const extendedBrandList = await clothingService.getExtendedBrands();
          setExtendedBrands(extendedBrandList);
        } catch (extendedBrandsError) {
          console.error('Failed to load extended brands:', extendedBrandsError);
          // 拡張ブランド情報の取得に失敗しても、アプリ全体の動作には影響しないようにする
        }
      }
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
    // ブランドキャッシュを更新（利用可能な場合）
    if (clothingService.refreshBrandsCache) {
      try {
        await clothingService.refreshBrandsCache();
      } catch (cacheError) {
        console.error('Failed to refresh brands cache:', cacheError);
        // キャッシュの更新に失敗しても、アプリ全体の動作には影響しないようにする
      }
    }

    // 全データを再読み込み
    await loadData();
  }, [loadData]);

  // ソート設定を更新する関数
  const updateSortConfig = (config: {sortBy: string; sortDirection: 'asc' | 'desc'}) => {
    setSortConfig(config);
  };

  // Note: addBrand function has been removed as per requirements

  // ブランド候補を検索する関数
  const getBrandSuggestions = (query: string): string[] => {
    if (!query) return brands.slice(0, 10); // 入力がない場合は最初の10件を表示

    const normalizedQuery = query.toLowerCase();

    // 拡張ブランド情報がある場合は、それを使用して検索
    if (extendedBrands.length > 0) {
      // 複数の条件でフィルタリング
      const matchedBrands = extendedBrands.filter(brand => {
        // 標準名での検索
        if (brand.name.toLowerCase().includes(normalizedQuery)) return true;

        // ひらがな名での検索
        if (brand.nameHiragana?.toLowerCase().includes(normalizedQuery)) return true;

        // 英語名での検索
        if (brand.nameEnglish?.toLowerCase().includes(normalizedQuery)) return true;

        // 検索語句での検索
        if (brand.searchTerms?.some(term => term.toLowerCase().includes(normalizedQuery))) return true;

        return false;
      });

      // 結果をブランド名のリストに変換
      return matchedBrands.map(brand => brand.name);
    }

    // 拡張ブランド情報がない場合は、通常の検索を行う
    return brands.filter(brand => 
      brand.toLowerCase().includes(normalizedQuery)
    );
  };

  // 着用ボタンクリック時の処理を修正
  const wearItem = async (id: string, date?: string): Promise<boolean> => {
    // dateパラメータが提供されていない場合は今日の日付を使用
    const recordDate = date || formatDateToLocalISOString(new Date());

    try {
      await clothingService.addWearRecord(id, recordDate);
      // データを再読み込み
      await loadData();
      return true;
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
      await clothingService.addWashRecord(id, recordDate);
      // データを再読み込み
      await loadData();
      return true;
    } catch (err) {
      console.error('Failed to record wash:', err);
      setError('洗濯記録の追加に失敗しました');
      return false;
    }
  };

  const addItem = async (item: Omit<ClothingItem, 'id'>, imageUri?: string) => {
    try {
      await clothingService.addClothingItem(item, imageUri);
      // データを再読み込み
      await loadData();
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('アイテムの追加に失敗しました');
      // エラーを再スローして呼び出し元でキャッチできるようにする
      throw err;
    }
  };

  const updateItem = async (updatedItem: ClothingItem, imageUri?: string) => {
    try {
      await clothingService.updateClothingItem(updatedItem.id, updatedItem, imageUri);
      // データを再読み込み
      await loadData();
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('アイテムの更新に失敗しました');
      // エラーを再スローして呼び出し元でキャッチできるようにする
      throw err;
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
      await clothingService.deleteWearRecord(itemId, date);
      // データを再読み込み
      await loadData();
      return true;
    } catch (err) {
      console.error('Failed to delete wear history:', err);
      setError('着用履歴の削除に失敗しました');
      return false;
    }
  };

  // 洗濯履歴を削除する関数
  const deleteWashHistory = async (itemId: string, date: string): Promise<boolean> => {
    try {
      await clothingService.deleteWashRecord(itemId, date);
      // データを再読み込み
      await loadData();
      return true;
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
        extendedBrands,
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
