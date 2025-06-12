import { StorageClient } from '@supabase/storage-js';
import { auth } from './authClient';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// 衣類画像用のバケット名
export const CLOTHING_BUCKET = 'clothing-images';

// Initialize StorageClient
export const storage = new StorageClient(`${supabaseUrl}/storage/v1`, {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`
});

// Function to get headers with auth token if available
const getAuthHeaders = async () => {
  const { data } = await auth.getSession();
  const accessToken = data.session?.access_token;

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken || supabaseAnonKey}`
  };
};

// Function to get an authenticated storage client
export const getAuthenticatedStorage = async () => {
  const headers = await getAuthHeaders();
  return new StorageClient(`${supabaseUrl}/storage/v1`, headers);
};

// 認証済みユーザー専用のURLを取得する関数
export const getPrivateUrl = async (path: string, width: number = 160, height: number = 160): Promise<string | null> => {
  if (!path) return null;
  
  try {
    const authStorage = await getAuthenticatedStorage();
    const { data, error } = await authStorage
      .from(CLOTHING_BUCKET)
      .createSignedUrl(path, 60 * 60, {
        transform: {
          width,
          height,
          resize: 'cover',
          quality: 80
        }
      });

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getPrivateUrl:', error);
    return null;
  }
};

// 複数の画像パスから署名付きURLを一括取得する関数
export const getPrivateUrls = async (paths: string[], width: number = 160, height: number = 160): Promise<(string | null)[]> => {
  if (!paths || paths.length === 0) return [];

  try {
    const authStorage = await getAuthenticatedStorage();
    
    // 各パスに対して個別に署名付きURLを取得
    const urlPromises = paths.map(path => 
      getPrivateUrl(path, width, height)
    );
    
    const urls = await Promise.all(urlPromises);
    return urls;
  } catch (error) {
    console.error('Error in getPrivateUrls:', error);
    return paths.map(() => null);
  }
};

// 画像パスからURLを取得する関数（既存のURLはそのまま返す）
export const getImageUrl = async (imagePath: string | null): Promise<string | null> => {
  if (!imagePath) return null;

  // 既にURLの場合はそのまま返す
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // パスの場合は署名付きURLを取得
  return await getPrivateUrl(imagePath);
};
