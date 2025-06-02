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
  memo: string | null;
  condition: string | null;
  purchase_price: number | null;
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

// Badge definition type
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: 'usage' | 'efficiency' | 'milestone' | 'special';
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Badge condition type
export interface BadgeCondition {
  id: string;
  badge_id: string;
  condition_type: string;
  condition_value: any; // JSONB data
  created_at: string;
  updated_at: string;
}

// User badge type
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_date: string; // ISO date string
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
      badge_definitions: {
        Row: BadgeDefinition;
        Insert: Omit<BadgeDefinition, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BadgeDefinition, 'created_at' | 'updated_at'>>;
      };
      badge_conditions: {
        Row: BadgeCondition;
        Insert: Omit<BadgeCondition, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BadgeCondition, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_badges: {
        Row: UserBadge;
        Insert: Omit<UserBadge, 'id' | 'created_at'>;
        Update: Partial<Omit<UserBadge, 'id' | 'created_at'>>;
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
  memo: string;
  condition: string;
  purchasePrice: number | null;
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
    memo: dbItem.memo || '',
    condition: dbItem.condition || '',
    purchasePrice: dbItem.purchase_price,
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
    last_worn: appItem.lastWorn || null,
    memo: appItem.memo || null,
    condition: appItem.condition || null,
    purchase_price: appItem.purchasePrice || null
  };
};
