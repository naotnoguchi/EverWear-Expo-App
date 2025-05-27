// Database type definitions for ClothesManagerApp
import { CategoryValue } from './categories';

// User type (matches Supabase auth user)
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
}

// Clothing item type
export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: CategoryValue;
  brand: string | null;
  image_url: string | null;
  wear_count: number;
  wash_threshold: number;
  last_worn: string | null; // ISO date string
  created_at: string;
  updated_at: string;
}

// Wear history type
export interface WearHistory {
  id: string;
  clothing_item_id: string;
  wear_date: string; // ISO date string
  created_at: string;
}

// Wash history type
export interface WashHistory {
  id: string;
  clothing_item_id: string;
  wash_date: string; // ISO date string
  created_at: string;
}

// Brand type
export interface Brand {
  id: string;
  name: string;
  created_at: string;
}

// Database schema type (for Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'created_at' | 'updated_at'>>;
      };
      clothing_items: {
        Row: ClothingItem;
        Insert: Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>>;
      };
      wear_history: {
        Row: WearHistory;
        Insert: Omit<WearHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<WearHistory, 'id' | 'created_at'>>;
      };
      wash_history: {
        Row: WashHistory;
        Insert: Omit<WashHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<WashHistory, 'id' | 'created_at'>>;
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, 'id' | 'created_at'>;
        Update: Partial<Omit<Brand, 'id' | 'created_at'>>;
      };
    };
  };
}

// Type for the current context clothing item (used in the app)
export interface AppClothingItem {
  id: string;
  name: string;
  category: CategoryValue;
  brand: string;
  image: string;
  wearCount: number;
  washThreshold: number;
  lastWorn: string;
  wearHistory: string[];
  washHistory: string[];
}

// Conversion functions between database and app models
export const toAppClothingItem = (dbItem: ClothingItem, wearHistory: WearHistory[], washHistory: WashHistory[]): AppClothingItem => {
  return {
    id: dbItem.id,
    name: dbItem.name,
    category: dbItem.category,
    brand: dbItem.brand || '',
    image: dbItem.image_url || '',
    wearCount: dbItem.wear_count,
    washThreshold: dbItem.wash_threshold,
    lastWorn: dbItem.last_worn || '',
    wearHistory: wearHistory.map(wh => wh.wear_date),
    washHistory: washHistory.map(wh => wh.wash_date)
  };
};

export const toDbClothingItem = (appItem: Partial<AppClothingItem>, userId: string): Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'> => {
  return {
    user_id: userId,
    name: appItem.name || '',
    category: appItem.category || null,
    brand: appItem.brand || null,
    image_url: appItem.image || null,
    wear_count: appItem.wearCount || 0,
    wash_threshold: appItem.washThreshold || 3,
    last_worn: appItem.lastWorn || null
  };
};
