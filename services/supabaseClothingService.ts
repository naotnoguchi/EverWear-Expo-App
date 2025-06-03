import { db } from '../lib/dbClient';
import { auth } from '../lib/authClient';
import { AppClothingItem, toAppClothingItem, toDbClothingItem, Brand, ExtendedBrand } from '../types/database';
import { BrandCache } from '../lib/brandCache';

// Get all clothing items for the current user
export const getClothingItems = async (): Promise<AppClothingItem[]> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get clothing items
  const { data: items, error } = await db
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  // Get all brands for lookup
  const { data: brands, error: brandsError } = await db
    .from('brands')
    .select('id, name');

  if (brandsError) throw brandsError;

  // Create a map of brand IDs to brand names for quick lookup
  const brandMap = new Map();
  brands?.forEach(brand => {
    brandMap.set(brand.id, brand.name);
  });

  // Get wear and wash history for each item
  const result: AppClothingItem[] = [];

  for (const item of items) {
    const { data: wearHistory, error: wearError } = await db
      .from('wear_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (wearError) throw wearError;

    const { data: washHistory, error: washError } = await db
      .from('wash_history')
      .select('*')
      .eq('clothing_item_id', item.id);

    if (washError) throw washError;

    // Get the brand name from the map
    const brandName = item.brand_id ? brandMap.get(item.brand_id) || '' : '';

    result.push(toAppClothingItem(item, wearHistory, washHistory, brandName));
  }

  return result;
};

// Get a specific clothing item by ID
export const getClothingItemById = async (id: string): Promise<AppClothingItem | null> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get the clothing item
  const { data: item, error } = await db
    .from('clothing_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Item not found
    }
    throw error;
  }

  // Get wear history
  const { data: wearHistory, error: wearError } = await db
    .from('wear_history')
    .select('*')
    .eq('clothing_item_id', id);

  if (wearError) throw wearError;

  // Get wash history
  const { data: washHistory, error: washError } = await db
    .from('wash_history')
    .select('*')
    .eq('clothing_item_id', id);

  if (washError) throw washError;

  // Get brand name if brand_id exists
  let brandName = '';
  if (item.brand_id) {
    const { data: brand, error: brandError } = await db
      .from('brands')
      .select('name')
      .eq('id', item.brand_id)
      .single();

    if (!brandError && brand) {
      brandName = brand.name;
    }
  }

  return toAppClothingItem(item, wearHistory, washHistory, brandName);
};

// Add a new clothing item
export const addClothingItem = async (item: Omit<AppClothingItem, 'id'>): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Find or create brand ID
  let brandId = null;
  if (item.brand) {
    // Check if brand exists
    const { data: existingBrand, error: brandError } = await db
      .from('brands')
      .select('id')
      .eq('name', item.brand)
      .single();

    if (!brandError && existingBrand) {
      brandId = existingBrand.id;
    } else {
      // Create new brand
      const { data: newBrand, error: createError } = await db
        .from('brands')
        .insert({ name: item.brand })
        .select()
        .single();

      if (createError) throw createError;
      brandId = newBrand.id;
    }
  }

  // Convert to DB format
  const dbItem = toDbClothingItem(item, userId, brandId);

  // Insert the item
  const { data, error } = await db
    .from('clothing_items')
    .insert(dbItem)
    .select()
    .single();

  if (error) throw error;

  // Return the new item with empty history arrays
  return toAppClothingItem(data, [], [], item.brand);
};

// Update an existing clothing item
export const updateClothingItem = async (id: string, updates: Partial<AppClothingItem>): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get the current item to merge with updates
  const currentItem = await getClothingItemById(id);
  if (!currentItem) {
    throw new Error('Item not found');
  }

  // Merge updates with current item
  const updatedItem = { ...currentItem, ...updates };

  // Find or create brand ID if brand is being updated
  let brandId = null;
  if (updates.brand !== undefined) {
    if (updates.brand) {
      // Check if brand exists
      const { data: existingBrand, error: brandError } = await db
        .from('brands')
        .select('id')
        .eq('name', updates.brand)
        .single();

      if (!brandError && existingBrand) {
        brandId = existingBrand.id;
      } else {
        // Create new brand
        const { data: newBrand, error: createError } = await db
          .from('brands')
          .insert({ name: updates.brand })
          .select()
          .single();

        if (createError) throw createError;
        brandId = newBrand.id;
      }
    }
  } else {
    // If brand is not being updated, get the current brand_id
    const { data: item, error: itemError } = await db
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
  const { data, error } = await db
    .from('clothing_items')
    .update(dbItem)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // Get updated history
  const { data: wearHistory, error: wearError } = await db
    .from('wear_history')
    .select('*')
    .eq('clothing_item_id', id);

  if (wearError) throw wearError;

  const { data: washHistory, error: washError } = await db
    .from('wash_history')
    .select('*')
    .eq('clothing_item_id', id);

  if (washError) throw washError;

  return toAppClothingItem(data, wearHistory, washHistory, updatedItem.brand);
};

// Delete a clothing item
export const deleteClothingItem = async (id: string): Promise<void> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Delete the item (cascade will handle related records)
  const { error } = await db
    .from('clothing_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};

// Add a wear record
export const addWearRecord = async (clothingItemId: string, date: string): Promise<void> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Verify the item belongs to the user
  const { count, error: countError } = await db
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', clothingItemId)
    .eq('user_id', userId);

  if (countError) throw countError;

  if (count === 0) {
    throw new Error('Item not found or does not belong to the user');
  }

  // Add wear record
  const { error } = await db
    .from('wear_history')
    .insert({
      clothing_item_id: clothingItemId,
      date,
    });

  if (error) throw error;

  // Update last_worn date on the clothing item
  await db
    .from('clothing_items')
    .update({ last_worn: date })
    .eq('id', clothingItemId);
};

// Delete a wear record
export const deleteWearRecord = async (wearId: string): Promise<void> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get the wear record to verify ownership
  const { data: wearRecord, error: getError } = await db
    .from('wear_history')
    .select('clothing_item_id')
    .eq('id', wearId)
    .single();

  if (getError) throw getError;

  // Verify the item belongs to the user
  const { count, error: countError } = await db
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', wearRecord.clothing_item_id)
    .eq('user_id', userId);

  if (countError) throw countError;

  if (count === 0) {
    throw new Error('Item not found or does not belong to the user');
  }

  // Delete the wear record
  const { error } = await db
    .from('wear_history')
    .delete()
    .eq('id', wearId);

  if (error) throw error;

  // Update last_worn date to the most recent wear record
  const { data: latestWear, error: latestError } = await db
    .from('wear_history')
    .select('date')
    .eq('clothing_item_id', wearRecord.clothing_item_id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (latestError && latestError.code !== 'PGRST116') {
    throw latestError;
  }

  await db
    .from('clothing_items')
    .update({ 
      last_worn: latestWear ? latestWear.date : null 
    })
    .eq('id', wearRecord.clothing_item_id);
};

// Add a wash record
export const addWashRecord = async (clothingItemId: string, date: string): Promise<void> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Verify the item belongs to the user
  const { count, error: countError } = await db
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', clothingItemId)
    .eq('user_id', userId);

  if (countError) throw countError;

  if (count === 0) {
    throw new Error('Item not found or does not belong to the user');
  }

  // Add wash record
  const { error } = await db
    .from('wash_history')
    .insert({
      clothing_item_id: clothingItemId,
      date,
    });

  if (error) throw error;
};

// Delete a wash record
export const deleteWashRecord = async (washId: string): Promise<void> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get the wash record to verify ownership
  const { data: washRecord, error: getError } = await db
    .from('wash_history')
    .select('clothing_item_id')
    .eq('id', washId)
    .single();

  if (getError) throw getError;

  // Verify the item belongs to the user
  const { count, error: countError } = await db
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', washRecord.clothing_item_id)
    .eq('user_id', userId);

  if (countError) throw countError;

  if (count === 0) {
    throw new Error('Item not found or does not belong to the user');
  }

  // Delete the wash record
  const { error } = await db
    .from('wash_history')
    .delete()
    .eq('id', washId);

  if (error) throw error;
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

    // キャッシュがない場合はSupabaseから取得
    const { data, error } = await db
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

    // Supabaseから拡張ブランド情報を取得
    const { data, error } = await db
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
