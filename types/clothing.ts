import { CategoryValue } from './categories';

export interface ClothingItem {
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