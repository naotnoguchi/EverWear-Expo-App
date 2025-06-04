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
export const getPrivateUrl = async (path: string): Promise<string | null> => {
  try {
    const authStorage = await getAuthenticatedStorage();
    const { data, error } = await authStorage
      .from(CLOTHING_BUCKET)
      .createSignedUrl(path, 60 * 60); // 1時間有効

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
