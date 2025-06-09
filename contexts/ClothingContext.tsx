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
  loadBrands: () => Promise<void>; // ブランド情報を読み込む関数
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

  // 状態内の単一アイテムを更新するヘルパー関数
  const updateItemInState = useCallback((updatedItem: ClothingItem) => {
    setClothingItems(prevItems => {
      const index = prevItems.findIndex(item => item.id === updatedItem.id);
      if (index === -1) return prevItems;

      const newItems = [...prevItems];
      newItems[index] = updatedItem;
      return newItems;
    });
  }, []);

  // 状態に新しいアイテムを追加するヘルパー関数
  const addItemToState = useCallback((newItem: ClothingItem) => {
    setClothingItems(prevItems => [...prevItems, newItem]);
  }, []);

  // 状態からアイテムを削除するヘルパー関数
  const removeItemFromState = useCallback((id: string) => {
    setClothingItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  // データを読み込む関数
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 最適化された関数を使用して衣類アイテムを取得
      const items = await clothingService.getClothingItemsWithHistory();
      setClothingItems(items);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // ブランド情報を読み込む関数
  const loadBrands = useCallback(async () => {
    try {
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
      console.error('Failed to load brands:', err);
    }
  }, []);

  // コンポーネントマウント時にデータを読み込む
  useEffect(() => {
    loadData();
  }, [loadData]);

  // データを再読み込みする関数
  const refreshData = useCallback(async () => {
    // 衣類アイテムデータを再読み込み
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

    // 現在の状態から対象アイテムを検索
    const targetItem = clothingItems.find(item => item.id === id);
    if (!targetItem) return false;

    try {
      // APIを呼び出して着用記録を追加
      await clothingService.addWearRecord(id, recordDate);

      // 新しいデータで状態のアイテムを更新
      const updatedItem = {
        ...targetItem,
        wearCount: targetItem.wearCount + 1,
        lastWorn: recordDate,
        wearHistory: [...targetItem.wearHistory, recordDate].sort()
      };

      // 状態を更新
      updateItemInState(updatedItem);
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

    // 現在の状態から対象アイテムを検索
    const targetItem = clothingItems.find(item => item.id === id);
    if (!targetItem) return false;

    try {
      // APIを呼び出して洗濯記録を追加
      await clothingService.addWashRecord(id, recordDate);

      // 新しいデータで状態のアイテムを更新
      // 洗濯後は着用回数が0にリセットされる
      const updatedItem = {
        ...targetItem,
        wearCount: 0,
        washHistory: [...targetItem.washHistory, recordDate].sort()
      };

      // 状態を更新
      updateItemInState(updatedItem);
      return true;
    } catch (err) {
      console.error('Failed to record wash:', err);
      setError('洗濯記録の追加に失敗しました');
      return false;
    }
  };

  const addItem = async (item: Omit<ClothingItem, 'id'>, imageUri?: string) => {
    try {
      // APIを呼び出してアイテムを追加
      const newItem = await clothingService.addClothingItem(item, imageUri);

      // 新しいアイテムを状態に追加
      addItemToState(newItem);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('アイテムの追加に失敗しました');
      // エラーを再スローして呼び出し元でキャッチできるようにする
      throw err;
    }
  };

  const updateItem = async (updatedItem: ClothingItem, imageUri?: string) => {
    try {
      // APIを呼び出してアイテムを更新
      const result = await clothingService.updateClothingItem(updatedItem.id, updatedItem, imageUri);

      // 状態内のアイテムを更新
      updateItemInState(result);
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('アイテムの更新に失敗しました');
      // エラーを再スローして呼び出し元でキャッチできるようにする
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // APIを呼び出してアイテムを削除
      await clothingService.deleteClothingItem(id);

      // 状態からアイテムを削除
      removeItemFromState(id);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('アイテムの削除に失敗しました');
    }
  };

  // 着用履歴を削除する関数
  const deleteWearHistory = async (itemId: string, date: string): Promise<boolean> => {
    // 現在の状態から対象アイテムを検索
    const targetItem = clothingItems.find(item => item.id === itemId);
    if (!targetItem) return false;

    try {
      // APIを呼び出して着用記録を削除
      await clothingService.deleteWearRecord(itemId, date);

      // 新しい着用回数と最終着用日を計算
      const updatedWearHistory = targetItem.wearHistory.filter(d => d !== date);
      const newLastWorn = updatedWearHistory.length > 0 
        ? updatedWearHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : '';

      // 最新の洗濯日を取得して着用回数を計算
      const sortedWashHistory = [...targetItem.washHistory].sort();
      const latestWashDate = sortedWashHistory.length > 0 ? sortedWashHistory[sortedWashHistory.length - 1] : '';

      // 最新の洗濯後の着用回数を計算
      const wearCount = latestWashDate 
        ? updatedWearHistory.filter(d => d > latestWashDate).length 
        : updatedWearHistory.length;

      // 状態内のアイテムを更新
      const updatedItem = {
        ...targetItem,
        wearCount,
        lastWorn: newLastWorn,
        wearHistory: updatedWearHistory
      };

      // 状態を更新
      updateItemInState(updatedItem);
      return true;
    } catch (err) {
      console.error('Failed to delete wear history:', err);
      setError('着用履歴の削除に失敗しました');
      return false;
    }
  };

  // 洗濯履歴を削除する関数
  const deleteWashHistory = async (itemId: string, date: string): Promise<boolean> => {
    // 現在の状態から対象アイテムを検索
    const targetItem = clothingItems.find(item => item.id === itemId);
    if (!targetItem) return false;

    try {
      // APIを呼び出して洗濯記録を削除
      await clothingService.deleteWashRecord(itemId, date);

      // 洗濯履歴を更新
      const updatedWashHistory = targetItem.washHistory.filter(d => d !== date);

      // 削除後の最新の洗濯日を取得
      const sortedWashHistory = [...updatedWashHistory].sort();
      const latestWashDate = sortedWashHistory.length > 0 ? sortedWashHistory[sortedWashHistory.length - 1] : '';

      // 最新の洗濯日以降の着用回数を再計算
      const wearCount = latestWashDate 
        ? targetItem.wearHistory.filter(d => d > latestWashDate).length 
        : targetItem.wearHistory.length;

      // 状態内のアイテムを更新
      const updatedItem = {
        ...targetItem,
        wearCount,
        washHistory: updatedWashHistory
      };

      // 状態を更新
      updateItemInState(updatedItem);
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
        loadBrands,
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
