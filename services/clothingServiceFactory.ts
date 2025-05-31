// Factory for creating clothing services
import * as mockService from './mockClothingService';
import * as supabaseService from './supabaseClothingService';
import { useMockData } from '../lib/supabase';

// Export the appropriate service based on configuration
export const clothingService = useMockData ? mockService : supabaseService;

// Re-export types from the database module for convenience
export { AppClothingItem } from '../types/database';
