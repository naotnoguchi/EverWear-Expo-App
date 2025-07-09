// Mock clothing service that mimics Supabase API behavior
import { AppClothingItem, ExtendedBrand } from '../types/database';
import { mockBrands, mockClothingItems, simulateNetworkDelay } from './mockData';

// In-memory storage for mock data
let clothingItems = [...mockClothingItems];
let brands = [...mockBrands];

// Get all clothing items with their history in a single query (optimized version)
export const getClothingItemsWithHistory = async (): Promise<AppClothingItem[]> => {
  // Return all mock items with their histories
  return mockClothingItems;
};

// Get all clothing items
/*
export const getClothingItems = async (): Promise<AppClothingItem[]> => {
  // Simulate network delay
  await simulateNetworkDelay();
  return [...clothingItems];
};
*/

// Get a single clothing item by ID
export const getClothingItemById = async (id: string): Promise<AppClothingItem | null> => {
  await simulateNetworkDelay();
  const item = clothingItems.find(item => item.id === id);
  return item ? { ...item } : null;
};

// Add a new clothing item
export const addClothingItem = async (item: Omit<AppClothingItem, 'id'>): Promise<AppClothingItem> => {
  await simulateNetworkDelay();

  const newItem: AppClothingItem = {
    ...item,
    id: Date.now().toString(), // Simple ID generation
    wearHistory: item.wearHistory || [],
    washHistory: item.washHistory || [],
    createdAt: new Date().toISOString(), // 現在時刻をcreatedAtとして設定
  };

  clothingItems.push(newItem);

  // No longer adding brands to the list as they should be selected from master list
  // if (item.brand && !brands.includes(item.brand)) {
  //   brands.push(item.brand);
  // }

  return { ...newItem };
};

// Update an existing clothing item
export const updateClothingItem = async (id: string, updates: Partial<AppClothingItem>): Promise<AppClothingItem> => {
  await simulateNetworkDelay();

  const index = clothingItems.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${id} not found`);
  }

  // Merge updates while preserving createdAt
  clothingItems[index] = { 
    ...clothingItems[index], 
    ...updates,
    createdAt: clothingItems[index].createdAt // 既存のcreatedAtを保持
  };

  return { ...clothingItems[index] };
};

// Delete a clothing item
export const deleteClothingItem = async (id: string): Promise<void> => {
  await simulateNetworkDelay();

  const index = clothingItems.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${id} not found`);
  }

  clothingItems.splice(index, 1);
};


// Add a wear record
export const addWearRecord = async (clothingItemId: string, wearDate: string): Promise<AppClothingItem> => {
  await simulateNetworkDelay();

  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }

  // Check if the wear date already exists
  if (clothingItems[index].wearHistory.includes(wearDate)) {
    throw new Error('この日付の着用記録は既に存在します');
  }

  // Add wear record
  const updatedWearHistory = [...clothingItems[index].wearHistory, wearDate].sort();

  // 最新の洗濯日を取得
  const latestWashDate = clothingItems[index].washHistory.length > 0 
    ? clothingItems[index].washHistory.sort().slice(-1)[0] 
    : '';

  // 最新の洗濯日以降の着用回数を再計算
  const updatedWearCount = latestWashDate 
    ? updatedWearHistory.filter(date => date > latestWashDate).length 
    : updatedWearHistory.length;

  // Update last worn date
  const updatedLastWorn = updatedWearHistory.length > 0 
    ? updatedWearHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : '';

  // Update the item
  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: updatedWearCount,
    lastWorn: updatedLastWorn,
    wearHistory: updatedWearHistory,
  };

  return { ...clothingItems[index] };
};

// Delete a wear record
export const deleteWearRecord = async (clothingItemId: string, wearDate: string): Promise<AppClothingItem> => {
  await simulateNetworkDelay();

  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }

  // Check if the wear date exists
  if (!clothingItems[index].wearHistory.includes(wearDate)) {
    throw new Error('Wear record not found for the given clothing item ID and date');
  }

  // Remove wear record
  const updatedWearHistory = clothingItems[index].wearHistory.filter(date => date !== wearDate);

  // Update last worn date if necessary
  let updatedLastWorn = clothingItems[index].lastWorn;
  if (clothingItems[index].lastWorn === wearDate) {
    // If we're removing the last worn date, set it to the most recent remaining date
    updatedLastWorn = updatedWearHistory.length > 0 
      ? updatedWearHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : '';
  }

  // 最新の洗濯日を取得
  const latestWashDate = clothingItems[index].washHistory.length > 0 
    ? clothingItems[index].washHistory.sort().slice(-1)[0] 
    : '';

  // 最新の洗濯日以降の着用回数を再計算
  const updatedWearCount = latestWashDate 
    ? updatedWearHistory.filter(date => date > latestWashDate).length 
    : updatedWearHistory.length;

  // Update the item
  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: updatedWearCount,
    lastWorn: updatedLastWorn,
    wearHistory: updatedWearHistory,
  };

  return { ...clothingItems[index] };
};

// Add a wash record
export const addWashRecord = async (clothingItemId: string, washDate: string): Promise<AppClothingItem> => {
  await simulateNetworkDelay();

  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }

  // Check if the wash date already exists
  if (clothingItems[index].washHistory.includes(washDate)) {
    throw new Error('この日付の洗濯記録は既に存在します');
  }

  // Add wash record
  const updatedWashHistory = [...clothingItems[index].washHistory, washDate].sort();

  // この洗濯日以降の着用回数を計算
  const updatedWearCount = clothingItems[index].wearHistory
    .filter(date => date > washDate)
    .length;

  // Update last washed date
  const updatedLastWashed = updatedWashHistory.length > 0 
    ? updatedWashHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : '';

  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: updatedWearCount,
    lastWashed: updatedLastWashed,
    washHistory: updatedWashHistory,
  };

  return { ...clothingItems[index] };
};

// Delete a wash record
export const deleteWashRecord = async (clothingItemId: string, washDate: string): Promise<AppClothingItem> => {
  await simulateNetworkDelay();

  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }

  // Check if the wash date exists
  if (!clothingItems[index].washHistory.includes(washDate)) {
    throw new Error('Wash record not found for the given clothing item ID and date');
  }

  // Remove wash record
  const updatedWashHistory = clothingItems[index].washHistory.filter(date => date !== washDate);

  // 最新の洗濯日を取得（削除後）
  const latestWashDate = updatedWashHistory.length > 0 
    ? updatedWashHistory.sort().slice(-1)[0] 
    : '';

  // 最新の洗濯日以降の着用回数を再計算
  const updatedWearCount = latestWashDate 
    ? clothingItems[index].wearHistory.filter(date => date > latestWashDate).length 
    : clothingItems[index].wearHistory.length;

  // Update last washed date
  const updatedLastWashed = updatedWashHistory.length > 0 
    ? updatedWashHistory.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : '';

  // Update the item
  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: updatedWearCount,
    lastWashed: updatedLastWashed,
    washHistory: updatedWashHistory,
  };

  return { ...clothingItems[index] };
};

// Get all brands (simple alias for compatibility)
export const getAllBrands = async (): Promise<string[]> => {
  await simulateNetworkDelay();
  return [...brands];
};

// Backward-compatible alias
export const getBrands = getAllBrands;

// Get extended brands with additional information for search
export const getExtendedBrands = async (): Promise<ExtendedBrand[]> => {
  await simulateNetworkDelay();

  // Create mock extended brands from the basic brand list
  const extendedBrands: ExtendedBrand[] = brands.map((brandName, index) => {
    // Generate some mock data for Japanese brands
    const isJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(brandName);

    return {
      id: `mock-brand-${index}`,
      name: brandName,
      // For Japanese brands, create English version; for English brands, create hiragana version
      nameHiragana: isJapanese ? undefined : `${brandName}のひらがな表記`,
      nameEnglish: isJapanese ? `${brandName} in English` : undefined,
      // Create some mock search terms
      searchTerms: [
        brandName.toLowerCase(),
        brandName.toUpperCase(),
        // Add some variations
        `${brandName} brand`,
        isJapanese ? `${brandName}ブランド` : `${brandName} ブランド`
      ]
    };
  });

  return extendedBrands;
};

// Note: addBrand function has been removed as per requirements

// Reset mock data (useful for testing)
export const resetMockData = (): void => {
  clothingItems = [...mockClothingItems];
  brands = [...mockBrands];
};
