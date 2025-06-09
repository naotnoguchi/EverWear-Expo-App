import { db, getAuthenticatedClient } from '../lib/dbClient';
import { auth } from '../lib/authClient';
import { AppClothingItem, toAppClothingItem, toDbClothingItem, Brand, ExtendedBrand } from '../types/database';
import { BrandCache } from '../lib/brandCache';
import { uploadImage, deleteImage } from '../lib/imageUtils';

// Get all clothing items with their history in a single query (optimized)
export const getClothingItemsWithHistory = async (): Promise<AppClothingItem[]> => {
  console.log('Fetching clothing items with history in a single query');
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    console.log('User not authenticated, cannot retrieve items');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  const authClient = await getAuthenticatedClient();

  // Single RPC call to get data
  const { data, error } = await authClient
    .rpc('get_clothing_items_with_history', { user_id_param: userId });

  if (error) {
    console.log('Error retrieving items with history:', error);
    throw error;
  }

  console.log(`Retrieved ${data?.length || 0} items with history from database`);

  // Convert data to AppClothingItem format
  const result: AppClothingItem[] = data.map(item => {
    return {
      id: item.item_id,
      name: item.name,
      category: item.category,
      brand: item.brand_name || '',
      image: item.image_path || '',
      wearCount: item.wear_count,
      washThreshold: item.wash_threshold,
      lastWorn: item.last_worn || '',
      memo: item.memo || '',
      condition: item.condition || '',
      purchasePrice: item.purchase_price,
      wearHistory: Array.isArray(item.wear_dates) ? item.wear_dates : [],
      washHistory: Array.isArray(item.wash_dates) ? item.wash_dates : []
    };
  });

  return result;
};

// Get all clothing items for the current user
/*
export const getClothingItems = async (): Promise<AppClothingItem[]> => {
  console.log('Fetching clothing items');
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for item retrieval');
  if (!userId) {
    console.log('User not authenticated, cannot retrieve items');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Get clothing items
  console.log('Querying clothing_items table');
  const { data: items, error } = await authClient
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.log('Error retrieving items:', error);
    throw error;
  }
  console.log(`Retrieved ${items?.length || 0} items from database`);

  // Get all brands for lookup
  console.log('Querying brands table for lookup');
  const { data: brands, error: brandsError } = await authClient
    .from('brands')
    .select('id, name');

  if (brandsError) {
    console.log('Error retrieving brands:', brandsError);
    throw brandsError;
  }
  console.log(`Retrieved ${brands?.length || 0} brands from database`);

  // Create a map of brand IDs to brand names for quick lookup
  const brandMap = new Map();
  brands?.forEach(brand => {
    brandMap.set(brand.id, brand.name);
  });

  // Get wear and wash history for each item
  console.log('Retrieving wear and wash history for each item');
  const result: AppClothingItem[] = [];

  for (const item of items) {
    const { data: wearHistory, error: wearError } = await authClient
      .from('wear_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (wearError) {
      console.log('Error retrieving wear history:', wearError);
      throw wearError;
    }

    const { data: washHistory, error: washError } = await authClient
      .from('wash_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (washError) {
      console.log('Error retrieving wash history:', washError);
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
  console.log('Fetching clothing item by ID:', id);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for item retrieval');
  if (!userId) {
    console.log('User not authenticated, cannot retrieve item');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Get the clothing item with history in a single RPC call
  console.log('Calling get_clothing_item_by_id_with_history RPC function');
  const { data, error } = await authClient
    .rpc('get_clothing_item_by_id_with_history', {
      item_id_param: id,
      user_id_param: userId
    });

  if (error) {
    console.log('Error retrieving item with history:', error);
    throw error;
  }

  // Check if item was found
  if (!data || data.length === 0) {
    console.log('Item not found:', id);
    return null;
  }

  const item = data[0];
  console.log('Retrieved item from database:', item.name);

  // Convert the data to AppClothingItem format
  return {
    id: item.item_id,
    name: item.name,
    category: item.category,
    brand: item.brand_name || '',
    image: item.image_path || '',
    wearCount: item.wear_count,
    washThreshold: item.wash_threshold,
    lastWorn: item.last_worn || '',
    memo: item.memo || '',
    condition: item.condition || '',
    purchasePrice: item.purchase_price,
    wearHistory: Array.isArray(item.wear_dates) ? item.wear_dates : [],
    washHistory: Array.isArray(item.wash_dates) ? item.wash_dates : []
  };
};

// Add a new clothing item
export const addClothingItem = async (item: Omit<AppClothingItem, 'id'>, imageUri?: string): Promise<AppClothingItem> => {
  console.log('Starting to add new clothing item:', item.name);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for item addition');
  if (!userId) {
    console.log('User not authenticated, cannot add item');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Upload image if provided
  let imageUrl = item.image;
  let uploadedImageUrl: string | null = null;

  if (imageUri && imageUri !== item.image) {
    console.log('Uploading image for item:', item.name);
    uploadedImageUrl = await uploadImage(imageUri, userId);
    if (uploadedImageUrl) {
      console.log('Image uploaded successfully');
      imageUrl = uploadedImageUrl;
    } else {
      console.log('Failed to upload image');
      throw new Error('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  }

  try {
    // Find brand ID
    console.log('Processing brand information for item:', item.name);
    let brandId = null;
    if (item.brand) {
      console.log('Brand specified:', item.brand);
      // Check if brand exists
      console.log('Checking if brand exists in database');
      const { data: existingBrand, error: brandError } = await authClient
        .from('brands')
        .select('id')
        .eq('name', item.brand)
        .single();

      if (!brandError && existingBrand) {
        console.log('Existing brand found with ID:', existingBrand.id);
        brandId = existingBrand.id;
      } else {
        console.log('Brand not found in database:', item.brand);
        // No longer creating new brands as they should be selected from master list
      }
    } else {
      console.log('No brand specified for item');
    }

    // Convert to DB format with the new image URL
    console.log('Converting item to database format');
    const dbItem = toDbClothingItem({...item, image: imageUrl}, userId, brandId);

    // Insert the item
    console.log('Inserting item into clothing_items table');
    const { data, error } = await authClient
      .from('clothing_items')
      .insert(dbItem)
      .select()
      .single();

    if (error) {
      console.log('Error inserting item into database:', error);
      throw error;
    }
    console.log('Successfully inserted item with ID:', data.id);

    // Return the new item with empty history arrays
    console.log('Returning newly created item');
    return toAppClothingItem(data, [], [], item.brand);
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (uploadedImageUrl && uploadedImageUrl.includes('supabase')) {
      console.log('Rolling back: Deleting uploaded image due to error');
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

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
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
    console.log('Uploading new image for item update');
    uploadedImageUrl = await uploadImage(imageUri, userId);
    if (uploadedImageUrl) {
      console.log('Image uploaded successfully');
      imageUrl = uploadedImageUrl;
    } else {
      console.log('Failed to upload new image');
      throw new Error('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  }

  try {
    // Merge updates with current item and new image URL
    const updatedItem = { ...currentItem, ...updates, image: imageUrl };

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
        } else {
          // No longer creating new brands as they should be selected from master list
          console.log('Brand not found in database:', updates.brand);
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
      console.log('Error updating item in database:', error);
      throw error;
    }

    // If we got here, the update was successful, so we can delete the old image if needed
    if (uploadedImageUrl && currentItem.image && currentItem.image.includes('supabase')) {
      console.log('Deleting old image after successful update');
      await deleteImage(currentItem.image).catch(deleteError => {
        console.error('Error deleting old image:', deleteError);
        // We don't throw here because the update was successful
      });
    }

    // Return the updated item with empty history arrays since we don't need the history data
    // for just updating the clothing item
    return toAppClothingItem(data, [], [], updatedItem.brand);
  } catch (error) {
    // If there was an error and we uploaded a new image, delete it
    if (uploadedImageUrl && uploadedImageUrl.includes('supabase')) {
      console.log('Rolling back: Deleting newly uploaded image due to error');
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
  console.log('Starting to delete clothing item with ID:', id);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for item deletion');
  if (!userId) {
    console.log('User not authenticated, cannot delete item');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Get the item to check if it has a custom image
  console.log('Getting item details to check for custom image');
  const { data: item, error: getError } = await authClient
    .from('clothing_items')
    .select('image_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (getError) {
    console.log('Error retrieving item details:', getError);
    throw getError;
  }

  // Delete the item (cascade will handle related records)
  console.log('Deleting item from clothing_items table');
  const { error } = await authClient
    .from('clothing_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.log('Error deleting item from database:', error);
    throw error;
  }
  console.log('Successfully deleted item with ID:', id);

  // Delete the image if it exists
  if (item && item.image_path) {
    console.log('Deleting associated image from storage');
    await deleteImage(item.image_path);
  }
};

// Add a wear record
export const addWearRecord = async (clothingItemId: string, date: string): Promise<void> => {
  console.log('Starting to add wear record for clothing item ID:', clothingItemId, 'with date:', date);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for adding wear record');
  if (!userId) {
    console.log('User not authenticated, cannot add wear record');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Call the RPC function to add the wear record and return the updated item
  console.log('Calling add_wear_record_and_return_item RPC function');
  const { data, error } = await authClient
    .rpc('add_wear_record_and_return_item', {
      item_id_param: clothingItemId,
      wear_date_param: date,
      user_id_param: userId
    });

  if (error) {
    console.log('Error adding wear record:', error);
    throw error;
  }

  console.log('Successfully added wear record and updated item');
};

// Delete a wear record
export const deleteWearRecord = async (clothingItemId: string, wearDate: string): Promise<void> => {
  console.log('Starting to delete wear record for clothing item ID:', clothingItemId, 'with date:', wearDate);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for deleting wear record');
  if (!userId) {
    console.log('User not authenticated, cannot delete wear record');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Call the RPC function to delete the wear record and return the updated item
  console.log('Calling delete_wear_record_and_return_item RPC function');
  const { data, error } = await authClient
    .rpc('delete_wear_record_and_return_item', {
      item_id_param: clothingItemId,
      wear_date_param: wearDate,
      user_id_param: userId
    });

  if (error) {
    console.log('Error deleting wear record:', error);
    throw error;
  }

  console.log('Successfully deleted wear record and updated item');
};

// Add a wash record
export const addWashRecord = async (clothingItemId: string, date: string): Promise<void> => {
  console.log('Starting to add wash record for clothing item ID:', clothingItemId, 'with date:', date);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for adding wash record');
  if (!userId) {
    console.log('User not authenticated, cannot add wash record');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Call the RPC function to add the wash record and return the updated item
  console.log('Calling add_wash_record_and_return_item RPC function');
  const { data, error } = await authClient
    .rpc('add_wash_record_and_return_item', {
      item_id_param: clothingItemId,
      wash_date_param: date,
      user_id_param: userId
    });

  if (error) {
    console.log('Error adding wash record:', error);
    throw error;
  }

  console.log('Successfully added wash record and updated item');
};

// Delete a wash record
export const deleteWashRecord = async (clothingItemId: string, washDate: string): Promise<void> => {
  console.log('Starting to delete wash record for clothing item ID:', clothingItemId, 'with date:', washDate);
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  console.log('User authentication check for deleting wash record');
  if (!userId) {
    console.log('User not authenticated, cannot delete wash record');
    throw new Error('User not authenticated');
  }

  // Get authenticated client
  console.log('Getting authenticated client for database operations');
  const authClient = await getAuthenticatedClient();

  // Call the RPC function to delete the wash record and return the updated item
  console.log('Calling delete_wash_record_and_return_item RPC function');
  const { data, error } = await authClient
    .rpc('delete_wash_record_and_return_item', {
      item_id_param: clothingItemId,
      wash_date_param: washDate,
      user_id_param: userId
    });

  if (error) {
    console.log('Error deleting wash record:', error);
    throw error;
  }

  console.log('Successfully deleted wash record and updated item');
};

// Get all brands from the brands table
export const getBrands = async (): Promise<string[]> => {
  console.log('getBrands() is now using getAllBrands() internally');
  return getAllBrands();
};

// Get all brands from the brands table (with caching)
export const getAllBrands = async (): Promise<string[]> => {
  try {
    // まずキャッシュをチェック
    const cache = BrandCache.getInstance();
    const cachedBrands = cache.get<string[]>('brands');
    if (cachedBrands) {
      console.log('Using cached brands data');
      return cachedBrands;
    }

    console.log('Fetching all brands from brands table');

    // Get authenticated client
    console.log('Getting authenticated client for database operations');
    const authClient = await getAuthenticatedClient();

    // キャッシュがない場合はSupabaseから取得
    const { data, error } = await authClient
      .from('brands')
      .select('name')
      .order('name');

    if (error) {
      console.error('Error fetching brands from brands table:', error);
      throw error;
    }

    const brandNames = data?.map(brand => brand.name) || [];

    // キャッシュに保存
    cache.set('brands', brandNames);

    console.log('Fetched brands from brands table:', brandNames.length);
    return brandNames;
  } catch (e) {
    console.error('Exception in getAllBrands:', e);
    return [];
  }
};

// 拡張ブランド情報を取得（検索用）
export const getExtendedBrands = async (): Promise<ExtendedBrand[]> => {
  try {
    // キャッシュをチェック
    const cache = BrandCache.getInstance();
    const cachedBrands = cache.get<ExtendedBrand[]>('extendedBrands');
    if (cachedBrands) {
      console.log('Using cached extended brands data');
      return cachedBrands;
    }

    console.log('Fetching extended brands from Supabase');

    // Get authenticated client
    console.log('Getting authenticated client for database operations');
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

    // キャッシュに保存
    cache.set('extendedBrands', extendedBrands);

    console.log('Fetched extended brands:', extendedBrands.length);
    return extendedBrands;
  } catch (e) {
    console.error('Error fetching extended brands:', e);
    return [];
  }
};

// キャッシュを強制的に更新
export const refreshBrandsCache = async (): Promise<void> => {
  try {
    console.log('Refreshing brands cache');
    const cache = BrandCache.getInstance();
    cache.clear('brands');
    cache.clear('extendedBrands');
    await getAllBrands();
    await getExtendedBrands();
    console.log('Brands cache refreshed');
  } catch (e) {
    console.error('Error refreshing brands cache:', e);
  }
};
