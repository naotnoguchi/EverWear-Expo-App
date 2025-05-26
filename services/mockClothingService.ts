// Mock clothing service that mimics Supabase API behavior
import { AppClothingItem } from '../types/database';
import { mockClothingItems, mockBrands, simulateNetworkDelay, MOCK_USER_ID } from './mockData';

// In-memory storage for mock data
let clothingItems = [...mockClothingItems];
let brands = [...mockBrands];

// Get all clothing items
export const getClothingItems = async (): Promise<AppClothingItem[]> => {
  // Simulate network delay
  await simulateNetworkDelay();
  return [...clothingItems];
};

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
  };
  
  clothingItems.push(newItem);
  
  // Add brand to the list if it doesn't exist
  if (item.brand && !brands.includes(item.brand)) {
    brands.push(item.brand);
  }
  
  return { ...newItem };
};

// Update an existing clothing item
export const updateClothingItem = async (item: AppClothingItem): Promise<AppClothingItem> => {
  await simulateNetworkDelay();
  
  const index = clothingItems.findIndex(i => i.id === item.id);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${item.id} not found`);
  }
  
  clothingItems[index] = { ...item };
  
  // Add brand to the list if it doesn't exist
  if (item.brand && !brands.includes(item.brand)) {
    brands.push(item.brand);
  }
  
  return { ...item };
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
export const addWearRecord = async (clothingItemId: string, wearDate: string): Promise<boolean> => {
  await simulateNetworkDelay();
  
  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }
  
  // Check if the wear date already exists
  if (clothingItems[index].wearHistory.includes(wearDate)) {
    return false; // Date already exists
  }
  
  // Add wear record
  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: clothingItems[index].wearCount + 1,
    lastWorn: wearDate,
    wearHistory: [...clothingItems[index].wearHistory, wearDate].sort(),
  };
  
  return true;
};

// Delete a wear record
export const deleteWearRecord = async (clothingItemId: string, wearDate: string): Promise<boolean> => {
  await simulateNetworkDelay();
  
  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }
  
  // Check if the wear date exists
  if (!clothingItems[index].wearHistory.includes(wearDate)) {
    return false; // Date doesn't exist
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
  
  // Update wear count
  const updatedWearCount = Math.max(0, clothingItems[index].wearCount - 1);
  
  // Update the item
  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: updatedWearCount,
    lastWorn: updatedLastWorn,
    wearHistory: updatedWearHistory,
  };
  
  return true;
};

// Add a wash record
export const addWashRecord = async (clothingItemId: string, washDate: string): Promise<boolean> => {
  await simulateNetworkDelay();
  
  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }
  
  // Check if the wash date already exists
  if (clothingItems[index].washHistory.includes(washDate)) {
    return false; // Date already exists
  }
  
  // Add wash record and reset wear count
  clothingItems[index] = {
    ...clothingItems[index],
    wearCount: 0,
    washHistory: [...clothingItems[index].washHistory, washDate].sort(),
  };
  
  return true;
};

// Delete a wash record
export const deleteWashRecord = async (clothingItemId: string, washDate: string): Promise<boolean> => {
  await simulateNetworkDelay();
  
  const index = clothingItems.findIndex(item => item.id === clothingItemId);
  if (index === -1) {
    throw new Error(`Clothing item with ID ${clothingItemId} not found`);
  }
  
  // Check if the wash date exists
  if (!clothingItems[index].washHistory.includes(washDate)) {
    return false; // Date doesn't exist
  }
  
  // Remove wash record
  const updatedWashHistory = clothingItems[index].washHistory.filter(date => date !== washDate);
  
  // Update the item
  clothingItems[index] = {
    ...clothingItems[index],
    washHistory: updatedWashHistory,
  };
  
  return true;
};

// Get all brands
export const getBrands = async (): Promise<string[]> => {
  await simulateNetworkDelay();
  return [...brands];
};

// Add a new brand
export const addBrand = async (brand: string): Promise<void> => {
  await simulateNetworkDelay();
  
  if (!brands.includes(brand)) {
    brands.push(brand);
  }
};

// Reset mock data (useful for testing)
export const resetMockData = (): void => {
  clothingItems = [...mockClothingItems];
  brands = [...mockBrands];
};