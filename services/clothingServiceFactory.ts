// Factory for creating clothing services
import * as supabaseService from './supabaseClothingService';

// Export the supabase service
export const clothingService = supabaseService;

// Re-export types from the database module for convenience
export { AppClothingItem, ExtendedBrand } from '../types/database';
