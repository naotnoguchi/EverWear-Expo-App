import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

// キャッシュ管理のための定数
const CACHE_TIMESTAMP_KEY = 'image_cache_timestamp';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

/**
 * キャッシュのタイムスタンプを保存
 */
const saveCacheTimestamp = async (): Promise<void> => {
  try {
    const timestamp = Date.now().toString();
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp);
  } catch (error) {
    console.error('Error saving cache timestamp:', error);
  }
};

/**
 * キャッシュが古いかどうかをチェック
 * @returns キャッシュが古い場合はtrue
 */
const isCacheStale = async (): Promise<boolean> => {
  try {
    const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!timestampStr) {
      // タイムスタンプがない場合は古いとみなす
      return true;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    return (now - timestamp) > CACHE_MAX_AGE;
  } catch (error) {
    console.error('Error checking cache staleness:', error);
    // エラーの場合は安全側に倒してリフレッシュする
    return true;
  }
};

/**
 * 特定の画像パスに対するキャッシュをクリア
 * @param imagePath 画像パス
 * @returns クリア成功時はtrue
 */
export const clearSpecificImageCache = async (imagePath: string): Promise<boolean> => {
  try {
    console.log(`Clearing cache for specific image: ${imagePath}`);

    // メモリキャッシュとディスクキャッシュの両方をクリア
    const memoryCleared = await Image.clearMemoryCache();
    const diskCleared = await Image.clearDiskCache();

    console.log(`Memory cache cleared: ${memoryCleared}, Disk cache cleared: ${diskCleared}`);

    return memoryCleared && diskCleared;
  } catch (error) {
    console.error('Error clearing specific image cache:', error);
    return false;
  }
};

/**
 * 画像キャッシュをクリア
 * @returns クリア成功時はtrue
 */
export const clearImageCache = async (): Promise<boolean> => {
  try {
    console.log('Clearing image cache...');
    const memoryCleared = await Image.clearMemoryCache();
    const diskCleared = await Image.clearDiskCache();
    console.log(`Memory cache cleared: ${memoryCleared}, Disk cache cleared: ${diskCleared}`);

    // 新しいタイムスタンプを保存
    await saveCacheTimestamp();

    return memoryCleared && diskCleared;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
};

/**
 * 必要に応じてキャッシュをクリアする（24時間経過時）
 */
export const checkAndClearCacheIfNeeded = async (): Promise<void> => {
  try {
    const isStale = await isCacheStale();

    if (isStale) {
      console.log('Cache is stale, clearing...');
      await clearImageCache();
    } else {
      console.log('Cache is still fresh');
    }
  } catch (error) {
    console.error('Error in cache check:', error);
  }
}; 
