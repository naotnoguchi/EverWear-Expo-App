import { db, getAuthenticatedClient } from '../lib/dbClient';
import { auth } from '../lib/authClient';
import { AppClothingItem, toAppClothingItem, toDbClothingItem, Brand, ExtendedBrand } from '../types/database';
import { BrandCache } from '../lib/brandCache';
import { uploadImage, deleteImage } from '../lib/imageUtils';

// Get all clothing items for the current user
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

  // Get the clothing item
  console.log('Querying clothing_items table for item:', id);
  const { data: item, error } = await authClient
    .from('clothing_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('Item not found:', id);
      return null; // Item not found
    }
    console.log('Error retrieving item:', error);
    throw error;
  }
  console.log('Retrieved item from database:', item.name);

  // Get wear history
  console.log('Querying wear_history for item:', id);
  const { data: wearHistory, error: wearError } = await authClient
    .from('wear_history')
    .select('*')
    .eq('clothing_item_id', id);

  if (wearError) {
    console.log('Error retrieving wear history:', wearError);
    throw wearError;
  }
  console.log(`Retrieved ${wearHistory?.length || 0} wear records`);

  // Get wash history
  console.log('Querying wash_history for item:', id);
  const { data: washHistory, error: washError } = await authClient
    .from('wash_history')
    .select('*')
    .eq('clothing_item_id', id);

  if (washError) {
    console.log('Error retrieving wash history:', washError);
    throw washError;
  }
  console.log(`Retrieved ${washHistory?.length || 0} wash records`);

  // Get brand name if brand_id exists
  let brandName = '';
  if (item.brand_id) {
    console.log('Querying brands table for brand ID:', item.brand_id);
    const { data: brand, error: brandError } = await authClient
      .from('brands')
      .select('name')
      .eq('id', item.brand_id)
      .single();

    if (!brandError && brand) {
      brandName = brand.name;
      console.log('Retrieved brand name:', brandName);
    } else if (brandError) {
      console.log('Error retrieving brand:', brandError);
    }
  }

  return toAppClothingItem(item, wearHistory, washHistory, brandName);
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
  if (imageUri && imageUri !== item.image) {
    console.log('Uploading image for item:', item.name);
    const uploadedUrl = await uploadImage(imageUri, userId);
    if (uploadedUrl) {
      imageUrl = uploadedUrl;
    } else {
      console.log('Failed to upload image, using default or provided URL');
    }
  }

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
  if (imageUri && imageUri !== currentItem.image && !imageUri.startsWith('http')) {
    console.log('Uploading new image for item update');
    const uploadedUrl = await uploadImage(imageUri, userId);
    if (uploadedUrl) {
      imageUrl = uploadedUrl;

      // Delete old image if it exists and is not a default image
      if (currentItem.image && currentItem.image.includes('supabase')) {
        await deleteImage(currentItem.image);
      }
    } else {
      console.log('Failed to upload new image, keeping existing image');
    }
  }

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
    .select('image_url')
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

  // Delete the image if it exists and is stored in Supabase
  if (item && item.image_url && item.image_url.includes('supabase')) {
    console.log('Deleting associated image from storage');
    await deleteImage(item.image_url);
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

  // Verify the item belongs to the user
  console.log('Verifying item belongs to the user');
  const { count, error: countError } = await authClient
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', clothingItemId)
    .eq('user_id', userId);

  if (countError) {
    console.log('Error verifying item ownership:', countError);
    throw countError;
  }

  if (count === 0) {
    console.log('Item not found or does not belong to the user');
    throw new Error('Item not found or does not belong to the user');
  }

  // Add wear record
  console.log('Adding wear record to wear_history table');
  const { error } = await authClient
    .from('wear_history')
    .insert({
      clothing_item_id: clothingItemId,
      wear_date: date,
    });

  if (error) {
    console.log('Error adding wear record:', error);
    throw error;
  }
  console.log('Successfully added wear record');

  // Get the latest wash date to calculate wear count
  console.log('Getting latest wash date to calculate wear count');
  const { data: latestWash, error: washError } = await authClient
    .from('wash_history')
    .select('wash_date')
    .eq('clothing_item_id', clothingItemId)
    .order('wash_date', { ascending: false })
    .limit(1)
    .single();

  if (washError && washError.code !== 'PGRST116') {
    console.log('Error retrieving latest wash record:', washError);
    throw washError;
  }

  // Get all wear records after the latest wash to calculate wear count
  console.log('Calculating updated wear count');
  let wearCount = 0;

  if (latestWash) {
    // If there's a wash record, count wears after the latest wash
    const { data: wearRecordsAfterWash, error: wearCountError } = await authClient
      .from('wear_history')
      .select('id')
      .eq('clothing_item_id', clothingItemId)
      .gt('wear_date', latestWash.wash_date);

    if (wearCountError) {
      console.log('Error counting wear records after wash:', wearCountError);
      throw wearCountError;
    }

    wearCount = wearRecordsAfterWash ? wearRecordsAfterWash.length : 0;
  } else {
    // If no wash record, count all wear records
    const { data: allWearRecords, error: wearCountError } = await authClient
      .from('wear_history')
      .select('id')
      .eq('clothing_item_id', clothingItemId);

    if (wearCountError) {
      console.log('Error counting all wear records:', wearCountError);
      throw wearCountError;
    }

    wearCount = allWearRecords ? allWearRecords.length : 0;
  }

  // Update last_worn date and wear count on the clothing item
  console.log('Updating last_worn date and wear count on clothing item');
  await authClient
    .from('clothing_items')
    .update({ 
      last_worn: date,
      wear_count: wearCount
    })
    .eq('id', clothingItemId);
  console.log('Successfully updated last_worn date and wear count');
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

  // Verify the item belongs to the user
  console.log('Verifying item belongs to the user');
  const { count, error: countError } = await authClient
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', clothingItemId)
    .eq('user_id', userId);

  if (countError) {
    console.log('Error verifying item ownership:', countError);
    throw countError;
  }

  if (count === 0) {
    console.log('Item not found or does not belong to the user');
    throw new Error('Item not found or does not belong to the user');
  }

  // Find the wear record with the given clothing item ID and date
  console.log('Finding wear record with clothing item ID and date');
  const { data: wearRecords, error: findError } = await authClient
    .from('wear_history')
    .select('id')
    .eq('clothing_item_id', clothingItemId)
    .eq('wear_date', wearDate);

  if (findError) {
    console.log('Error finding wear record:', findError);
    throw findError;
  }

  if (!wearRecords || wearRecords.length === 0) {
    console.log('Wear record not found for the given clothing item ID and date');
    throw new Error('Wear record not found for the given clothing item ID and date');
  }

  // Delete the wear record(s)
  console.log('Deleting wear record(s) from wear_history table');
  const { error } = await authClient
    .from('wear_history')
    .delete()
    .eq('clothing_item_id', clothingItemId)
    .eq('wear_date', wearDate);

  if (error) {
    console.log('Error deleting wear record:', error);
    throw error;
  }
  console.log('Successfully deleted wear record(s)');

  // Update last_worn date to the most recent wear record
  console.log('Updating last_worn date to most recent wear record');
  const { data: latestWear, error: latestError } = await authClient
    .from('wear_history')
    .select('wear_date')
    .eq('clothing_item_id', clothingItemId)
    .order('wear_date', { ascending: false })
    .limit(1)
    .single();

  if (latestError && latestError.code !== 'PGRST116') {
    console.log('Error retrieving latest wear record:', latestError);
    throw latestError;
  }

  // Get the latest wash date to calculate wear count
  console.log('Getting latest wash date to calculate wear count');
  const { data: latestWash, error: washError } = await authClient
    .from('wash_history')
    .select('wash_date')
    .eq('clothing_item_id', clothingItemId)
    .order('wash_date', { ascending: false })
    .limit(1)
    .single();

  if (washError && washError.code !== 'PGRST116') {
    console.log('Error retrieving latest wash record:', washError);
    throw washError;
  }

  // Get all wear records after the latest wash to calculate wear count
  console.log('Calculating updated wear count');
  let wearCount = 0;

  if (latestWash) {
    // If there's a wash record, count wears after the latest wash
    const { data: wearRecordsAfterWash, error: wearCountError } = await authClient
      .from('wear_history')
      .select('id')
      .eq('clothing_item_id', clothingItemId)
      .gt('wear_date', latestWash.wash_date);

    if (wearCountError) {
      console.log('Error counting wear records after wash:', wearCountError);
      throw wearCountError;
    }

    wearCount = wearRecordsAfterWash ? wearRecordsAfterWash.length : 0;
  } else {
    // If no wash record, count all wear records
    const { data: allWearRecords, error: wearCountError } = await authClient
      .from('wear_history')
      .select('id')
      .eq('clothing_item_id', clothingItemId);

    if (wearCountError) {
      console.log('Error counting all wear records:', wearCountError);
      throw wearCountError;
    }

    wearCount = allWearRecords ? allWearRecords.length : 0;
  }

  console.log('Updating clothing item with new last_worn date and wear count');
  await authClient
    .from('clothing_items')
    .update({ 
      last_worn: latestWear ? latestWear.wear_date : null,
      wear_count: wearCount
    })
    .eq('id', clothingItemId);
  console.log('Successfully updated last_worn date and wear count');
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

  // Verify the item belongs to the user
  console.log('Verifying item belongs to the user');
  const { count, error: countError } = await authClient
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', clothingItemId)
    .eq('user_id', userId);

  if (countError) {
    console.log('Error verifying item ownership:', countError);
    throw countError;
  }

  if (count === 0) {
    console.log('Item not found or does not belong to the user');
    throw new Error('Item not found or does not belong to the user');
  }

  // Add wash record
  console.log('Adding wash record to wash_history table');
  const { error } = await authClient
    .from('wash_history')
    .insert({
      clothing_item_id: clothingItemId,
      wash_date: date,
    });

  if (error) {
    console.log('Error adding wash record:', error);
    throw error;
  }
  console.log('Successfully added wash record');

  // Get wear records after this wash date to calculate wear count
  console.log('Calculating updated wear count');
  const { data: wearRecordsAfterWash, error: wearCountError } = await authClient
    .from('wear_history')
    .select('id')
    .eq('clothing_item_id', clothingItemId)
    .gt('wear_date', date);

  if (wearCountError) {
    console.log('Error counting wear records after wash:', wearCountError);
    throw wearCountError;
  }

  // After adding a wash record, the wear count should be the number of wears after this wash
  const wearCount = wearRecordsAfterWash ? wearRecordsAfterWash.length : 0;

  // Update wear count on the clothing item
  console.log('Updating wear count on clothing item');
  await authClient
    .from('clothing_items')
    .update({ wear_count: wearCount })
    .eq('id', clothingItemId);
  console.log('Successfully updated wear count');
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

  // Verify the item belongs to the user
  console.log('Verifying item belongs to the user');
  const { count, error: countError } = await authClient
    .from('clothing_items')
    .select('*', { count: 'exact', head: true })
    .eq('id', clothingItemId)
    .eq('user_id', userId);

  if (countError) {
    console.log('Error verifying item ownership:', countError);
    throw countError;
  }

  if (count === 0) {
    console.log('Item not found or does not belong to the user');
    throw new Error('Item not found or does not belong to the user');
  }

  // Find the wash record with the given clothing item ID and date
  console.log('Finding wash record with clothing item ID and date');
  const { data: washRecords, error: findError } = await authClient
    .from('wash_history')
    .select('id')
    .eq('clothing_item_id', clothingItemId)
    .eq('wash_date', washDate);

  if (findError) {
    console.log('Error finding wash record:', findError);
    throw findError;
  }

  if (!washRecords || washRecords.length === 0) {
    console.log('Wash record not found for the given clothing item ID and date');
    throw new Error('Wash record not found for the given clothing item ID and date');
  }

  // Delete the wash record(s)
  console.log('Deleting wash record(s) from wash_history table');
  const { error } = await authClient
    .from('wash_history')
    .delete()
    .eq('clothing_item_id', clothingItemId)
    .eq('wash_date', washDate);

  if (error) {
    console.log('Error deleting wash record:', error);
    throw error;
  }
  console.log('Successfully deleted wash record(s)');

  // Get the latest wash date after deletion
  console.log('Getting latest wash date to calculate wear count');
  const { data: latestWash, error: washError } = await authClient
    .from('wash_history')
    .select('wash_date')
    .eq('clothing_item_id', clothingItemId)
    .order('wash_date', { ascending: false })
    .limit(1)
    .single();

  if (washError && washError.code !== 'PGRST116') {
    console.log('Error retrieving latest wash record:', washError);
    throw washError;
  }

  // Get all wear records after the latest wash to calculate wear count
  console.log('Calculating updated wear count');
  let wearCount = 0;

  if (latestWash) {
    // If there's a wash record, count wears after the latest wash
    const { data: wearRecordsAfterWash, error: wearCountError } = await authClient
      .from('wear_history')
      .select('id')
      .eq('clothing_item_id', clothingItemId)
      .gt('wear_date', latestWash.wash_date);

    if (wearCountError) {
      console.log('Error counting wear records after wash:', wearCountError);
      throw wearCountError;
    }

    wearCount = wearRecordsAfterWash ? wearRecordsAfterWash.length : 0;
  } else {
    // If no wash record, count all wear records
    const { data: allWearRecords, error: wearCountError } = await authClient
      .from('wear_history')
      .select('id')
      .eq('clothing_item_id', clothingItemId);

    if (wearCountError) {
      console.log('Error counting all wear records:', wearCountError);
      throw wearCountError;
    }

    wearCount = allWearRecords ? allWearRecords.length : 0;
  }

  // Update wear count on the clothing item
  console.log('Updating wear count on clothing item');
  await authClient
    .from('clothing_items')
    .update({ wear_count: wearCount })
    .eq('id', clothingItemId);
  console.log('Successfully updated wear count');
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
