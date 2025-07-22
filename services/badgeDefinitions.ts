import { CategoryValue } from '../types/categories';
import { AppClothingItem, WashHistory, WearHistory } from '../types/database';

export interface Badge {
  id: string;
  nameKey: string;  // 翻訳キー
  descKey: string;  // 翻訳キー
  iconName: string;
  color: string;
  category: 'milestone' | 'achievement' | 'special';
}

export interface BadgeEvaluationContext {
  items: AppClothingItem[];
  wearRecords: WearHistory[];
  washRecords: WashHistory[];
  isPremiumUser: boolean;
}

export interface BadgeEvaluator {
  badge: Badge;
  isAchieved: (context: BadgeEvaluationContext) => boolean;
}

// 洗濯削減回数の計算ロジック
const ITEMS_PER_WASH_LOAD = 5;

const calculateWashesReduced = (items: AppClothingItem[], wearRecords: WearHistory[], washRecords: WashHistory[]): number => {
  const totalWears = wearRecords.length;
  const totalWashes = washRecords.length;
  return Math.max(0, Math.floor((totalWears - totalWashes) / ITEMS_PER_WASH_LOAD));
};

// 100日連続記録の判定ロジック
const hasConsecutive100Days = (wearRecords: WearHistory[], washRecords: WashHistory[]): boolean => {
  // 着用記録と洗濯記録の日付を結合してソート
  const allDates = new Set<string>();
  wearRecords.forEach(record => {
    allDates.add(record.wear_date);
  });
  washRecords.forEach(record => {
    allDates.add(record.wash_date);
  });

  const sortedDates = Array.from(allDates).sort();
  
  if (sortedDates.length < 100) return false;

  // 連続する日数をカウント
  let consecutiveDays = 1;
  let maxConsecutiveDays = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = new Date(sortedDates[i - 1]);
    
    // 日差を計算
    const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      consecutiveDays++;
      maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
    } else {
      consecutiveDays = 1;
    }
  }

  return maxConsecutiveDays >= 100;
};

// カテゴリマスターの判定ロジック
const hasCategoryMaster = (items: AppClothingItem[]): boolean => {
  const categories = new Set<CategoryValue>();
  items.forEach(item => {
    if (item.category) {
      categories.add(item.category);
    }
  });
  return categories.size >= 7;
};

// アイテム別の最大着用回数を取得
const getMaxWearCountForItem = (items: AppClothingItem[], wearRecords: WearHistory[]): number => {
  const wearCounts = new Map<string, number>();
  
  wearRecords.forEach(record => {
    const count = wearCounts.get(record.clothing_item_id) || 0;
    wearCounts.set(record.clothing_item_id, count + 1);
  });

  return Math.max(0, ...Array.from(wearCounts.values()));
};

export const BADGE_DEFINITIONS: BadgeEvaluator[] = [
  // 初めての3つ
  {
    badge: {
      id: 'first-item',
      nameKey: 'badges.names.firstItem',
      descKey: 'badges.descriptions.firstItem',
      iconName: 'shirt',
      color: '#10B981',
      category: 'milestone'
    },
    isAchieved: (context) => context.items.length >= 1
  },
  {
    badge: {
      id: 'first-wear',
      nameKey: 'badges.names.firstWear',
      descKey: 'badges.descriptions.firstWear',
      iconName: 'calendar',
      color: '#3B82F6',
      category: 'milestone'
    },
    isAchieved: (context) => context.wearRecords.length >= 1
  },
  {
    badge: {
      id: 'first-wash',
      nameKey: 'badges.names.firstWash',
      descKey: 'badges.descriptions.firstWash',
      iconName: 'water-drop',
      color: '#06B6D4',
      category: 'milestone'
    },
    isAchieved: (context) => context.washRecords.length >= 1
  },

  // アイテム登録数
  {
    badge: {
      id: 'item-collector-5',
      nameKey: 'badges.names.itemCollector5',
      descKey: 'badges.descriptions.itemCollector5',
      iconName: 'shirt',
      color: '#8B5CF6',
      category: 'achievement'
    },
    isAchieved: (context) => context.items.length >= 5
  },
  {
    badge: {
      id: 'item-collector-15',
      nameKey: 'badges.names.itemCollector15',
      descKey: 'badges.descriptions.itemCollector15',
      iconName: 'shirt',
      color: '#A855F7',
      category: 'achievement'
    },
    isAchieved: (context) => context.items.length >= 15
  },
  {
    badge: {
      id: 'item-collector-30',
      nameKey: 'badges.names.itemCollector30',
      descKey: 'badges.descriptions.itemCollector30',
      iconName: 'shirt',
      color: '#9333EA',
      category: 'achievement'
    },
    isAchieved: (context) => context.items.length >= 30
  },

  // アイテム別着用達成
  {
    badge: {
      id: 'wear-achiever-item-10',
      nameKey: 'badges.names.wearAchieverItem10',
      descKey: 'badges.descriptions.wearAchieverItem10',
      iconName: 'heart',
      color: '#EC4899',
      category: 'achievement'
    },
    isAchieved: (context) => getMaxWearCountForItem(context.items, context.wearRecords) >= 10
  },
  {
    badge: {
      id: 'wear-achiever-item-30',
      nameKey: 'badges.names.wearAchieverItem30',
      descKey: 'badges.descriptions.wearAchieverItem30',
      iconName: 'heart',
      color: '#DB2777',
      category: 'achievement'
    },
    isAchieved: (context) => getMaxWearCountForItem(context.items, context.wearRecords) >= 30
  },
  {
    badge: {
      id: 'wear-achiever-item-50',
      nameKey: 'badges.names.wearAchieverItem50',
      descKey: 'badges.descriptions.wearAchieverItem50',
      iconName: 'heart',
      color: '#BE185D',
      category: 'achievement'
    },
    isAchieved: (context) => getMaxWearCountForItem(context.items, context.wearRecords) >= 50
  },

  // 累計着用達成
  {
    badge: {
      id: 'wear-master-10',
      nameKey: 'badges.names.wearMaster10',
      descKey: 'badges.descriptions.wearMaster10',
      iconName: 'calendar',
      color: '#65A30D',
      category: 'achievement'
    },
    isAchieved: (context) => context.wearRecords.length >= 10
  },
  {
    badge: {
      id: 'wear-master-50',
      nameKey: 'badges.names.wearMaster50',
      descKey: 'badges.descriptions.wearMaster50',
      iconName: 'calendar',
      color: '#16A34A',
      category: 'achievement'
    },
    isAchieved: (context) => context.wearRecords.length >= 50
  },
  {
    badge: {
      id: 'wear-master-100',
      nameKey: 'badges.names.wearMaster100',
      descKey: 'badges.descriptions.wearMaster100',
      iconName: 'calendar',
      color: '#15803D',
      category: 'achievement'
    },
    isAchieved: (context) => context.wearRecords.length >= 100
  },

  // 洗濯記録累計
  {
    badge: {
      id: 'wash-master-10',
      nameKey: 'badges.names.washMaster10',
      descKey: 'badges.descriptions.washMaster10',
      iconName: 'water-drop',
      color: '#0EA5E9',
      category: 'achievement'
    },
    isAchieved: (context) => context.washRecords.length >= 10
  },
  {
    badge: {
      id: 'wash-master-30',
      nameKey: 'badges.names.washMaster30',
      descKey: 'badges.descriptions.washMaster30',
      iconName: 'water-drop',
      color: '#0284C7',
      category: 'achievement'
    },
    isAchieved: (context) => context.washRecords.length >= 30
  },
  {
    badge: {
      id: 'wash-master-50',
      nameKey: 'badges.names.washMaster50',
      descKey: 'badges.descriptions.washMaster50',
      iconName: 'water-drop',
      color: '#0369A1',
      category: 'achievement'
    },
    isAchieved: (context) => context.washRecords.length >= 50
  },

  // 洗濯削減バッジ
  {
    badge: {
      id: 'wash-saver-10',
      nameKey: 'badges.names.washSaver10',
      descKey: 'badges.descriptions.washSaver10',
      iconName: 'leaf',
      color: '#059669',
      category: 'achievement'
    },
    isAchieved: (context) => calculateWashesReduced(context.items, context.wearRecords, context.washRecords) >= 10
  },
  {
    badge: {
      id: 'wash-saver-50',
      nameKey: 'badges.names.washSaver50',
      descKey: 'badges.descriptions.washSaver50',
      iconName: 'leaf',
      color: '#047857',
      category: 'achievement'
    },
    isAchieved: (context) => calculateWashesReduced(context.items, context.wearRecords, context.washRecords) >= 50
  },
  {
    badge: {
      id: 'wash-saver-100',
      nameKey: 'badges.names.washSaver100',
      descKey: 'badges.descriptions.washSaver100',
      iconName: 'leaf',
      color: '#065F46',
      category: 'achievement'
    },
    isAchieved: (context) => calculateWashesReduced(context.items, context.wearRecords, context.washRecords) >= 100
  },

  // 特別なバッジ
  {
    badge: {
      id: 'category-master',
      nameKey: 'badges.names.categoryMaster',
      descKey: 'badges.descriptions.categoryMaster',
      iconName: 'star',
      color: '#D97706',
      category: 'special'
    },
    isAchieved: (context) => hasCategoryMaster(context.items)
  },
  {
    badge: {
      id: 'premium-unlocked',
      nameKey: 'badges.names.premiumUnlocked',
      descKey: 'badges.descriptions.premiumUnlocked',
      iconName: 'crown',
      color: '#F59E0B',
      category: 'special'
    },
    isAchieved: (context) => context.isPremiumUser
  },
  {
    badge: {
      id: 'consistent-tracker',
      nameKey: 'badges.names.consistentTracker',
      descKey: 'badges.descriptions.consistentTracker',
      iconName: 'fire',
      color: '#DC2626',
      category: 'special'
    },
    isAchieved: (context) => hasConsecutive100Days(context.wearRecords, context.washRecords)
  }
];

export const getBadgeById = (id: string): Badge | undefined => {
  return BADGE_DEFINITIONS.find(def => def.badge.id === id)?.badge;
};

export const getAllBadges = (): Badge[] => {
  return BADGE_DEFINITIONS.map(def => def.badge);
};

export const evaluateAllBadges = (context: BadgeEvaluationContext): string[] => {
  return BADGE_DEFINITIONS
    .filter(def => def.isAchieved(context))
    .map(def => def.badge.id);
}; 