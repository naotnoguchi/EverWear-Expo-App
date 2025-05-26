// Factory for creating clothing services (simplified to only use mock service)
import * as mockService from './mockClothingService';

// Export the mock service directly
export const clothingService = mockService;

// Re-export types from the database module for convenience
export { AppClothingItem } from '../types/database';
