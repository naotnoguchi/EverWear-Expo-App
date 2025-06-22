import { CategoryValue } from '../types/categories';
import { AppClothingItem } from '../types/database';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'usage' | 'efficiency' | 'milestone' | 'special';
  displayOrder: number;
  evaluate: (items: AppClothingItem[]) => BadgeEvaluation;
}

export interface BadgeEvaluation {
  isEarned: boolean;
  progress: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Usage badges
  {
    id: 'first-item',
    name: '初めてのアイテム登録',
    description: '最初のアイテムを登録しました',
    imageUrl: 'https://example.com/badges/first-item.png',
    category: 'usage',
    displayOrder: 1,
    evaluate: (items) => ({
      isEarned: items.length > 0,
      progress: items.length > 0 ? 100 : 0
    })
  },
  {
    id: 'first-wear',
    name: '初めての着用記録',
    description: '最初の着用を記録しました',
    imageUrl: 'https://example.com/badges/first-wear.png',
    category: 'usage',
    displayOrder: 2,
    evaluate: (items) => {
      const totalWears = items.reduce((sum, item) => sum + item.wearHistory.length, 0);
      return {
        isEarned: totalWears > 0,
        progress: totalWears > 0 ? 100 : 0
      };
    }
  },
  {
    id: 'first-wash',
    name: '初めての洗濯記録',
    description: '最初の洗濯を記録しました',
    imageUrl: 'https://example.com/badges/first-wash.png',
    category: 'usage',
    displayOrder: 3,
    evaluate: (items) => {
      const totalWashes = items.reduce((sum, item) => sum + item.washHistory.length, 0);
      return {
        isEarned: totalWashes > 0,
        progress: totalWashes > 0 ? 100 : 0
      };
    }
  },

  // Milestone badges
  {
    id: 'item-10-wears',
    name: '10回着用達成',
    description: '1つのアイテムを10回着用しました',
    imageUrl: 'https://example.com/badges/10-wears.png',
    category: 'milestone',
    displayOrder: 4,
    evaluate: (items) => {
      const maxWears = items.length > 0 ? Math.max(...items.map(item => item.wearHistory.length)) : 0;
      return {
        isEarned: maxWears >= 10,
        progress: maxWears >= 10 ? 100 : Math.round((maxWears / 10) * 100)
      };
    }
  },
  {
    id: 'item-30-wears',
    name: '30回着用達成',
    description: '1つのアイテムを30回着用しました',
    imageUrl: 'https://example.com/badges/30-wears.png',
    category: 'milestone',
    displayOrder: 5,
    evaluate: (items) => {
      const maxWears = items.length > 0 ? Math.max(...items.map(item => item.wearHistory.length)) : 0;
      return {
        isEarned: maxWears >= 30,
        progress: maxWears >= 30 ? 100 : Math.round((maxWears / 30) * 100)
      };
    }
  },
  {
    id: 'item-50-wears',
    name: '50回着用達成',
    description: '1つのアイテムを50回着用しました',
    imageUrl: 'https://example.com/badges/50-wears.png',
    category: 'milestone',
    displayOrder: 6,
    evaluate: (items) => {
      const maxWears = items.length > 0 ? Math.max(...items.map(item => item.wearHistory.length)) : 0;
      return {
        isEarned: maxWears >= 50,
        progress: maxWears >= 50 ? 100 : Math.round((maxWears / 50) * 100)
      };
    }
  },

  // Efficiency badges
  {
    id: 'wash-reduced-10',
    name: '洗濯10回削減',
    description: '洗濯回数を10回削減しました',
    imageUrl: 'https://example.com/badges/wash-10.png',
    category: 'efficiency',
    displayOrder: 7,
    evaluate: (items) => {
      const totalWears = items.reduce((sum, item) => sum + item.wearHistory.length, 0);
      const totalWashes = items.reduce((sum, item) => sum + item.washHistory.length, 0);
      const ITEMS_PER_WASH_LOAD = 5; // 1回の洗濯で平均5アイテム
      const washesReduced = Math.max(0, (totalWears - totalWashes) / ITEMS_PER_WASH_LOAD);
      return {
        isEarned: washesReduced >= 10,
        progress: washesReduced >= 10 ? 100 : Math.round((washesReduced / 10) * 100)
      };
    }
  },
  {
    id: 'wash-reduced-50',
    name: '洗濯50回削減',
    description: '洗濯回数を50回削減しました',
    imageUrl: 'https://example.com/badges/wash-50.png',
    category: 'efficiency',
    displayOrder: 8,
    evaluate: (items) => {
      const totalWears = items.reduce((sum, item) => sum + item.wearHistory.length, 0);
      const totalWashes = items.reduce((sum, item) => sum + item.washHistory.length, 0);
      const ITEMS_PER_WASH_LOAD = 5; // 1回の洗濯で平均5アイテム
      const washesReduced = Math.max(0, (totalWears - totalWashes) / ITEMS_PER_WASH_LOAD);
      return {
        isEarned: washesReduced >= 50,
        progress: washesReduced >= 50 ? 100 : Math.round((washesReduced / 50) * 100)
      };
    }
  },
  {
    id: 'wash-reduced-100',
    name: '洗濯100回削減',
    description: '洗濯回数を100回削減しました',
    imageUrl: 'https://example.com/badges/wash-100.png',
    category: 'efficiency',
    displayOrder: 9,
    evaluate: (items) => {
      const totalWears = items.reduce((sum, item) => sum + item.wearHistory.length, 0);
      const totalWashes = items.reduce((sum, item) => sum + item.washHistory.length, 0);
      const ITEMS_PER_WASH_LOAD = 5; // 1回の洗濯で平均5アイテム
      const washesReduced = Math.max(0, (totalWears - totalWashes) / ITEMS_PER_WASH_LOAD);
      return {
        isEarned: washesReduced >= 100,
        progress: washesReduced >= 100 ? 100 : Math.round((washesReduced / 100) * 100)
      };
    }
  },
  {
    id: 'efficient-washer',
    name: '賢い洗濯',
    description: '洗濯閾値の90%以上で洗濯を5回実施',
    imageUrl: 'https://example.com/badges/efficient-washer.png',
    category: 'efficiency',
    displayOrder: 12,
    evaluate: (items) => {
      const hasEfficientWasher = items.some(item => {
        let currentCount = 0;
        let efficientWashes = 0;

        // Sort wear and wash history by date
        const sortedWears = [...item.wearHistory].sort();
        const sortedWashes = [...item.washHistory].sort();

        // Count wears between washes
        for (const wearDate of sortedWears) {
          currentCount++;
          // Check if there's a wash after this wear
          const nextWash = sortedWashes.find(washDate => washDate >= wearDate);
          if (nextWash) {
            // If the wear count is at least 90% of the threshold, count it as efficient
            if (currentCount >= item.washThreshold * 0.9) {
              efficientWashes++;
            }
            currentCount = 0;
            // Remove this wash from consideration for future wears
            sortedWashes.splice(sortedWashes.indexOf(nextWash), 1);
          }
        }

        return efficientWashes >= 5;
      });

      return {
        isEarned: hasEfficientWasher,
        progress: hasEfficientWasher ? 100 : 0
      };
    }
  },

  // Special badges
  {
    id: 'category-complete',
    name: 'カテゴリコンプリート',
    description: '全カテゴリでアイテムを登録しました',
    imageUrl: 'https://example.com/badges/category-complete.png',
    category: 'special',
    displayOrder: 10,
    evaluate: (items) => {
      const categories = new Set(items.map(item => item.category));
      const allCategories: CategoryValue[] = ['トップス', 'ボトムス', 'ジャケット', 'アウター', 'セットアップ', 'ワンピース', 'シューズ', 'バッグ', '小物', 'その他'];
      const hasAllCategories = allCategories.every(cat => categories.has(cat));
      return {
        isEarned: hasAllCategories,
        progress: hasAllCategories ? 100 : Math.round((categories.size / allCategories.length) * 100)
      };
    }
  },
  {
    id: 'eco-warrior',
    name: 'エコウォリアー',
    description: '環境貢献度が高いユーザーに贈られるバッジ',
    imageUrl: 'https://example.com/badges/eco-warrior.png',
    category: 'special',
    displayOrder: 11,
    evaluate: (items) => {
      const totalWears = items.reduce((sum, item) => sum + item.wearHistory.length, 0);
      const totalWashes = items.reduce((sum, item) => sum + item.washHistory.length, 0);
      const ITEMS_PER_WASH_LOAD = 5; // 1回の洗濯で平均5アイテム
      const washesReduced = Math.max(0, (totalWears - totalWashes) / ITEMS_PER_WASH_LOAD);
      return {
        isEarned: washesReduced >= 30,
        progress: washesReduced >= 30 ? 100 : Math.round((washesReduced / 30) * 100)
      };
    }
  }
];

// バッジIDでバッジ定義を取得するヘルパー関数
export function getBadgeDefinitionById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.id === id);
}

// カテゴリでバッジ定義を取得するヘルパー関数
export function getBadgeDefinitionsByCategory(category: 'usage' | 'efficiency' | 'milestone' | 'special'): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => badge.category === category);
}

// 表示順でソートされたバッジ定義を取得するヘルパー関数
export function getSortedBadgeDefinitions(): BadgeDefinition[] {
  return [...BADGE_DEFINITIONS].sort((a, b) => a.displayOrder - b.displayOrder);
} 