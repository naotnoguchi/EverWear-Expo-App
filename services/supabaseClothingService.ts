import { db } from '../lib/dbClient';
import { auth } from '../lib/authClient';
import { AppClothingItem, toAppClothingItem, toDbClothingItem } from '../types/database';

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

    result.push(toAppClothingItem(item, wearHistory, washHistory));
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

  return toAppClothingItem(item, wearHistory, washHistory);
};

// Add a new clothing item
export const addClothingItem = async (item: Omit<AppClothingItem, 'id'>): Promise<AppClothingItem> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Convert to DB format
  const dbItem = toDbClothingItem(item);
  dbItem.user_id = userId;

  // Insert the item
  const { data, error } = await db
    .from('clothing_items')
    .insert(dbItem)
    .select()
    .single();

  if (error) throw error;

  // Return the new item with empty history arrays
  return toAppClothingItem(data, [], []);
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

  // Convert to DB format
  const dbItem = toDbClothingItem(updatedItem);

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

  return toAppClothingItem(data, wearHistory, washHistory);
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

// Get all brands
export const getBrands = async (): Promise<string[]> => {
  const { data: session } = await auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get all brands from the user's items
  const { data, error } = await db
    .from('clothing_items')
    .select('brand')
    .eq('user_id', userId)
    .not('brand', 'is', null);

  if (error) throw error;

  // Extract unique brands
  const brands = [...new Set(data.map(item => item.brand))];
  return brands.filter(brand => brand && brand.trim() !== '');
};
