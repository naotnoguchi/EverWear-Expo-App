import { auth } from '../lib/authClient';
import { getAuthenticatedClient } from '../lib/dbClient';
import { deleteImage, uploadImage } from '../lib/imageUtils';
import { AppClothingItem, ExtendedBrand, toAppClothingItem, toDbClothingItem } from '../types/database';
import { getClothingItemsWithHistory as getItemsWithHistory, getSingleItemWithHistory } from './supabaseDataService';

// RPC関数のレスポンスをAppClothingItemに変換する関数
const convertRpcResponseToAppItem = (rpcResponse: any): AppClothingItem => {
  return {
    id: rpcResponse.id,
    name: rpcResponse.name,
    category: rpcResponse.category,
    brand: rpcResponse.brand_name || '',
    image: rpcResponse.image_path || '',
    wearCount: rpcResponse.wear_count,
    washThreshold: rpcResponse.wash_threshold,
    lastWorn: rpcResponse.last_worn || '',
    lastWashed: rpcResponse.last_washed || '',
    memo: rpcResponse.memo || '',
    condition: rpcResponse.condition || '',
    purchasePrice: rpcResponse.purchase_price,
    wearHistory: Array.isArray(rpcResponse.wear_history) ? rpcResponse.wear_history : [],
    washHistory: Array.isArray(rpcResponse.wash_history) ? rpcResponse.wash_history : [],
    createdAt: rpcResponse.created_at || ''
  };
};

// Get all clothing items with their history in a single query (optimized)
export const getClothingItemsWithHistory = async (): Promise<AppClothingItem[]> => {
  return await getItemsWithHistory();
};

// Get all clothing items for the current user
/*
export const getClothingItems = async (): Promise<AppClothingItem[]> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // Get clothing items
  const { data: items, error } = await authClient
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Get all brands for lookup
  const { data: brands, error: brandsError } = await authClient
    .from('brands')
    .select('id, name');

  if (brandsError) {
    throw brandsError;
  }

  // Create a map of brand IDs to brand names for quick lookup
  const brandMap = new Map();
  brands?.forEach(brand => {
    brandMap.set(brand.id, brand.name);
  });

  // Get wear and wash history for each item
  const result: AppClothingItem[] = [];

  for (const item of items) {
    const { data: wearHistory, error: wearError } = await authClient
      .from('wear_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (wearError) {
      throw wearError;
    }

    const { data: washHistory, error: washError } = await authClient
      .from('wash_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (washError) {
      throw washError;
    }

    // Get the brand name from the map
    const brandName = item.brand_id ? brandMap.get(item.brand_id) || '' : '';

    result.push(toAppClothingItem(item, wearHistory, washHistory, brandName));
  }

  return result;
};
*/

// Get a specific clothing item by ID
export const getClothingItemById = async (id: string): Promise<AppClothingItem | null> => {
  return await getSingleItemWithHistory(id);
};

// Add a new clothing item
export const addClothingItem = async (item: Omit<AppClothingItem, 'id'>, imageUri?: string): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Upload image if provided
  let imageUrl = item.image;
  let uploadedImageUrl: string | null = null;

  if (imageUri && !imageUri.startsWith('http')) {
    uploadedImageUrl = await uploadImage(imageUri, userId);
    if (uploadedImageUrl) {
      imageUrl = uploadedImageUrl;
    } else {
      throw new Error('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  }

  try {
    // Find brand ID
    let brandId = null;
    if (item.brand) {
      const { data: existingBrand, error: brandError } = await authClient
        .from('brands')
        .select('id')
        .eq('name', item.brand)
        .single();

      if (!brandError && existingBrand) {
        brandId = existingBrand.id;
      }
    }

    // Convert to DB format with the new image URL
    const dbItem = toDbClothingItem({...item, image: imageUrl}, userId, brandId);

    // Insert the item
    const { data, error } = await authClient
      .from('clothing_items')
      .insert(dbItem)
      .select()
      .single();

    if (error) {
      console.error('Error inserting item into database:', error);
      throw error;
    }

    return toAppClothingItem(data, [], [], item.brand);
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (uploadedImageUrl && uploadedImageUrl.includes('supabase')) {
      await deleteImage(uploadedImageUrl).catch(deleteError => {
        console.error('Error deleting image during rollback:', deleteError);
      });
    }

    // Re-throw the error
    throw error;
  }
};

// Update an existing clothing item
export const updateClothingItem = async (id: string, updates: Partial<AppClothingItem>, imageUri?: string): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Get the current item to merge with updates
  const currentItem = await getClothingItemById(id);
  if (!currentItem) {
    throw new Error('Item not found');
  }

  // Upload new image if provided
  let imageUrl = updates.image || currentItem.image;
  let uploadedImageUrl: string | null = null;

  if (imageUri && imageUri !== currentItem.image && !imageUri.startsWith('http')) {
    try {
      uploadedImageUrl = await uploadImage(imageUri, userId);

      if (uploadedImageUrl) {
        imageUrl = uploadedImageUrl;
      } else {
        console.error('Failed to upload new image: uploadImage returned null');
        throw new Error('画像のアップロードに失敗しました。もう一度お試しください。');
      }
    } catch (uploadError) {
      console.error('Error during image upload:', uploadError);
      throw new Error('画像のアップロード中にエラーが発生しました。もう一度お試しください。');
    }
  }

  try {
    // Merge updates with current item and new image URL
    const updatedItem = { 
      ...currentItem, 
      ...updates, 
      image: imageUrl,
      createdAt: currentItem.createdAt // 既存のcreatedAtを保持
    };

    // Find brand ID if brand is being updated
    let brandId = null;
    if (updates.brand !== undefined) {
      if (updates.brand) {
        // Check if brand exists
        const { data: existingBrand, error: brandError } = await authClient
          .from('brands')
          .select('id')
          .eq('name', updates.brand)
          .single();

        if (!brandError && existingBrand) {
          brandId = existingBrand.id;
        }
      }
    } else {
      // If brand is not being updated, get the current brand_id
      const { data: item, error: itemError } = await authClient
        .from('clothing_items')
        .select('brand_id')
        .eq('id', id)
        .single();

      if (!itemError && item) {
        brandId = item.brand_id;
      }
    }

    // Convert to DB format
    const dbItem = toDbClothingItem(updatedItem, userId, brandId);

    // Update the item
    const { data, error } = await authClient
      .from('clothing_items')
      .update(dbItem)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item in database:', error);
      throw error;
    }

    // If we got here, the update was successful, so we can delete the old image if needed
    if (uploadedImageUrl && currentItem.image && currentItem.image.trim() !== '') {
      await deleteImage(currentItem.image).catch(deleteError => {
        console.error('Error deleting old image:', deleteError);
        // We don't throw here because the update was successful
      });
    }

    // Return the updated item with preserved history data
    // Convert string arrays back to WearHistory/WashHistory format for toAppClothingItem
    const wearHistoryObjects = currentItem.wearHistory.map(date => ({ 
      id: '', clothing_item_id: id, wear_date: date, created_at: '' 
    }));
    const washHistoryObjects = currentItem.washHistory.map(date => ({ 
      id: '', clothing_item_id: id, wash_date: date, created_at: '' 
    }));

    return toAppClothingItem(data, wearHistoryObjects, washHistoryObjects, updatedItem.brand);
  } catch (error) {
    // If there was an error and we uploaded a new image, delete it
    if (uploadedImageUrl && uploadedImageUrl.trim() !== '') {
      await deleteImage(uploadedImageUrl).catch(deleteError => {
        console.error('Error deleting image during rollback:', deleteError);
      });
    }

    // Re-throw the error
    throw error;
  }
};

// Delete a clothing item
export const deleteClothingItem = async (id: string): Promise<void> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Get the item to check if it has a custom image
  const { data: item, error: getError } = await authClient
    .from('clothing_items')
    .select('image_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (getError) {
    console.error('Error retrieving item details:', getError);
    throw getError;
  }

  // Delete the item (cascade will handle related records)
  const { error } = await authClient
    .from('clothing_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting item from database:', error);
    throw error;
  }

  // Delete the image if it exists
  if (item && item.image_path) {
    await deleteImage(item.image_path);
  }


};

// Add a wear record
export const addWearRecord = async (clothingItemId: string, date: string): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Call the RPC function to add the wear record and return the updated item
  const { data, error } = await authClient
    .rpc('add_wear_record_and_return_item', {
      item_id_param: clothingItemId,
      wear_date_param: date,
      user_id_param: userId
    });

  if (error) {
    console.error('Error adding wear record:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from database');
  }

  // RPCレスポンスをAppClothingItemに変換して返却
  return convertRpcResponseToAppItem(data[0]);
};

// Delete a wear record
export const deleteWearRecord = async (clothingItemId: string, wearDate: string): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Call the RPC function to delete the wear record and return the updated item
  const { data, error } = await authClient
    .rpc('delete_wear_record_and_return_item', {
      item_id_param: clothingItemId,
      wear_date_param: wearDate,
      user_id_param: userId
    });

  if (error) {
    console.error('Error deleting wear record:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from database');
  }

  // RPCレスポンスをAppClothingItemに変換して返却
  return convertRpcResponseToAppItem(data[0]);
};

// Add a wash record
export const addWashRecord = async (clothingItemId: string, date: string): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Call the RPC function to add the wash record and return the updated item
  const { data, error } = await authClient
    .rpc('add_wash_record_and_return_item', {
      item_id_param: clothingItemId,
      wash_date_param: date,
      user_id_param: userId
    });

  if (error) {
    console.error('Error adding wash record:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from database');
  }

  // RPCレスポンスをAppClothingItemに変換して返却
  return convertRpcResponseToAppItem(data[0]);
};

// Delete a wash record
export const deleteWashRecord = async (clothingItemId: string, washDate: string): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const authClient = await getAuthenticatedClient();

  // Call the RPC function to delete the wash record and return the updated item
  const { data, error } = await authClient
    .rpc('delete_wash_record_and_return_item', {
      item_id_param: clothingItemId,
      wash_date_param: washDate,
      user_id_param: userId
    });

  if (error) {
    console.error('Error deleting wash record:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from database');
  }

  // RPCレスポンスをAppClothingItemに変換して返却
  return convertRpcResponseToAppItem(data[0]);
};

// Get all brands from the brands table
export const getBrands = async (): Promise<string[]> => {
  return getAllBrands();
};

// Get all brands from the brands table (always fetch fresh data)
export const getAllBrands = async (): Promise<string[]> => {
  try {
    const authClient = await getAuthenticatedClient();

    // 直接 Supabase から取得
    const { data, error } = await authClient
      .from('brands')
      .select('name')
      .order('name');

    if (error) {
      console.error('Error fetching brands from brands table:', error);
      throw error;
    }

    const brandNames = data?.map(brand => brand.name) || [];
    return brandNames;
  } catch (e) {
    console.error('Exception in getAllBrands:', e);
    return [];
  }
};

// 拡張ブランド情報を取得（検索用、常に最新データ）
export const getExtendedBrands = async (): Promise<ExtendedBrand[]> => {
  try {
    const authClient = await getAuthenticatedClient();

    // Supabaseから拡張ブランド情報を取得
    const { data, error } = await authClient
      .from('brands')
      .select('id, name, name_hiragana, name_english, search_terms')
      .order('name');

    if (error) {
      console.error('Error fetching extended brands:', error);
      throw error;
    }

    // データを変換
    const extendedBrands: ExtendedBrand[] = data.map(brand => ({
      id: brand.id,
      name: brand.name,
      nameHiragana: brand.name_hiragana || undefined,
      nameEnglish: brand.name_english || undefined,
      searchTerms: brand.search_terms || []
    }));

    return extendedBrands;
  } catch (e) {
    console.error('Error fetching extended brands:', e);
    return [];
  }
};
