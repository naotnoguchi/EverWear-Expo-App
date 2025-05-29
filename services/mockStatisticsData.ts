// Mock statistics data for development
import { 
  BasicStats, 
  RankingItem, 
  EfficiencyItem, 
  ImpactData, 
  Badge, 
  ItemDetailStats,
  Period
} from '../types/statistics';
import { mockClothingItems } from './mockData';
import { CategoryValue } from '../types/categories';

// Helper function to filter items by period
const filterByPeriod = (dates: string[], period: Period): string[] => {
  if (period === 'all') return dates;
  
  const now = new Date();
  let cutoffDate = new Date();
  
  switch (period) {
    case '1month':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case '1year':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return dates.filter(date => new Date(date) >= cutoffDate);
};

// Generate basic statistics based on mock clothing items
export const generateBasicStats = (period: Period = '3months'): BasicStats => {
  // Filter items by period
  const filteredItems = mockClothingItems.map(item => ({
    ...item,
    filteredWearHistory: filterByPeriod(item.wearHistory, period),
    filteredWashHistory: filterByPeriod(item.washHistory, period)
  }));
  
  // Calculate total wears and washes in the period
  const totalWears = filteredItems.reduce((sum, item) => sum + item.filteredWearHistory.length, 0);
  const totalWashes = filteredItems.reduce((sum, item) => sum + item.filteredWashHistory.length, 0);
  
  // Calculate average wears between washes
  const averageWearsBetweenWashes = totalWashes > 0 ? parseFloat((totalWears / totalWashes).toFixed(1)) : 0;
  
  // Find most worn category
  const categoryWears: Record<CategoryValue, number> = {};
  filteredItems.forEach(item => {
    const category = item.category;
    if (!categoryWears[category]) categoryWears[category] = 0;
    categoryWears[category] += item.filteredWearHistory.length;
  });
  
  const mostWornCategory = Object.entries(categoryWears)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0] as CategoryValue)[0];
  
  // Find most and least worn items
  const sortedItems = [...filteredItems].sort(
    (a, b) => b.filteredWearHistory.length - a.filteredWearHistory.length
  );
  
  const mostWornItem = {
    id: sortedItems[0].id,
    name: sortedItems[0].name,
    wears: sortedItems[0].filteredWearHistory.length
  };
  
  const leastWornItem = {
    id: sortedItems[sortedItems.length - 1].id,
    name: sortedItems[sortedItems.length - 1].name,
    wears: sortedItems[sortedItems.length - 1].filteredWearHistory.length
  };
  
  // Calculate category breakdown
  const categories: Record<CategoryValue, number> = {};
  mockClothingItems.forEach(item => {
    const category = item.category;
    if (!categories[category]) categories[category] = 0;
    categories[category]++;
  });
  
  const totalItems = mockClothingItems.length;
  const categoryBreakdown = Object.entries(categories).map(([category, count]) => ({
    category: category as CategoryValue,
    count,
    percentage: Math.round((count / totalItems) * 100)
  }));
  
  // Calculate monthly wears
  const monthlyWears: Record<string, number> = {};
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  filteredItems.forEach(item => {
    item.filteredWearHistory.forEach(date => {
      const month = new Date(date).getMonth();
      const monthName = months[month];
      if (!monthlyWears[monthName]) monthlyWears[monthName] = 0;
      monthlyWears[monthName]++;
    });
  });
  
  // Convert to array and sort by month
  const monthlyWearsArray = Object.entries(monthlyWears).map(([month, count]) => ({
    month,
    count
  })).sort((a, b) => {
    return months.indexOf(a.month) - months.indexOf(b.month);
  });
  
  return {
    totalItems,
    totalWears,
    totalWashes,
    averageWearsBetweenWashes,
    mostWornCategory,
    mostWornItem,
    leastWornItem,
    categoryBreakdown,
    monthlyWears: monthlyWearsArray
  };
};

// Generate ranking data based on mock clothing items
export const generateRankingData = (
  period: Period = '3months',
  sortOrder: 'most' | 'least' = 'most',
  category: CategoryValue = null
): RankingItem[] => {
  // Filter items by period and category
  let filteredItems = mockClothingItems
    .filter(item => category === null || item.category === category)
    .map(item => ({
      ...item,
      filteredWearHistory: filterByPeriod(item.wearHistory, period)
    }));
  
  // Sort by wear count
  filteredItems = filteredItems.sort((a, b) => {
    const diff = b.filteredWearHistory.length - a.filteredWearHistory.length;
    return sortOrder === 'most' ? diff : -diff;
  });
  
  // Find maximum wear count for percentage calculation
  const maxWearCount = Math.max(
    ...filteredItems.map(item => item.filteredWearHistory.length),
    1 // Avoid division by zero
  );
  
  // Convert to RankingItem format
  return filteredItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    imageUrl: item.image,
    wearCount: item.filteredWearHistory.length,
    percentageOfMax: Math.round((item.filteredWearHistory.length / maxWearCount) * 100)
  }));
};

// Generate efficiency data based on mock clothing items
export const generateEfficiencyData = (period: Period = '3months'): EfficiencyItem[] => {
  // Filter items by period
  const filteredItems = mockClothingItems.map(item => {
    const filteredWearHistory = filterByPeriod(item.wearHistory, period);
    const filteredWashHistory = filterByPeriod(item.washHistory, period);
    
    // Calculate efficiency
    const wearCount = filteredWearHistory.length;
    const washCount = filteredWashHistory.length;
    const actualWearsBetweenWashes = washCount > 0 ? wearCount / washCount : wearCount;
    const efficiency = item.washThreshold > 0 ? actualWearsBetweenWashes / item.washThreshold : 0;
    
    // Determine status based on efficiency
    let status: 'good' | 'warning' | 'bad';
    if (efficiency >= 1) {
      status = 'good';
    } else if (efficiency >= 0.7) {
      status = 'warning';
    } else {
      status = 'bad';
    }
    
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      imageUrl: item.image,
      wearCount,
      washCount,
      threshold: item.washThreshold,
      efficiency,
      status
    };
  });
  
  // Sort by efficiency (highest first)
  return filteredItems.sort((a, b) => b.efficiency - a.efficiency);
};

// Generate impact data based on mock clothing items
export const generateImpactData = (period: Period = '3months'): ImpactData => {
  // Constants for impact calculations
  const ELECTRICITY_PER_WASH = 0.5; // kWh
  const ELECTRICITY_COST_PER_KWH = 25; // yen
  const WATER_PER_WASH = 50; // liters
  const WATER_COST_PER_1000L = 300; // yen
  const DETERGENT_PER_WASH = 30; // ml
  const DETERGENT_COST_PER_BOTTLE = 400; // yen (800ml bottle)
  const CO2_PER_KWH = 0.5; // kg
  const TREES_PER_KG_CO2 = 0.05; // trees per kg CO2 per year
  
  // Filter items by period
  const filteredItems = mockClothingItems.map(item => {
    const filteredWearHistory = filterByPeriod(item.wearHistory, period);
    const filteredWashHistory = filterByPeriod(item.washHistory, period);
    
    // Calculate washes reduced
    // If we washed after every wear, we would have filteredWearHistory.length washes
    // Instead, we only have filteredWashHistory.length washes
    const washesReduced = filteredWearHistory.length - filteredWashHistory.length;
    
    return {
      ...item,
      filteredWearHistory,
      filteredWashHistory,
      washesReduced: Math.max(0, washesReduced)
    };
  });
  
  // Calculate total washes reduced
  const totalWashesReduced = filteredItems.reduce((sum, item) => sum + item.washesReduced, 0);
  
  // Calculate resource savings
  const electricitySaved = {
    amount: parseFloat((totalWashesReduced * ELECTRICITY_PER_WASH).toFixed(1)),
    cost: Math.round(totalWashesReduced * ELECTRICITY_PER_WASH * ELECTRICITY_COST_PER_KWH)
  };
  
  const waterSaved = {
    amount: Math.round(totalWashesReduced * WATER_PER_WASH),
    cost: Math.round(totalWashesReduced * WATER_PER_WASH * WATER_COST_PER_1000L / 1000)
  };
  
  const detergentSaved = {
    amount: Math.round(totalWashesReduced * DETERGENT_PER_WASH),
    cost: Math.round(totalWashesReduced * DETERGENT_PER_WASH * DETERGENT_COST_PER_BOTTLE / 800)
  };
  
  // Calculate CO2 reduction and tree equivalent
  const co2Reduced = parseFloat((electricitySaved.amount * CO2_PER_KWH).toFixed(1));
  const treeEquivalent = parseFloat((co2Reduced * TREES_PER_KG_CO2).toFixed(1));
  
  // Calculate monthly impact
  const monthlyImpact: Record<string, { washesReduced: number, co2Reduced: number }> = {};
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // Initialize months
  months.forEach(month => {
    monthlyImpact[month] = { washesReduced: 0, co2Reduced: 0 };
  });
  
  // Calculate impact for each month
  filteredItems.forEach(item => {
    // Group wear dates by month
    const wearsByMonth: Record<string, number> = {};
    item.filteredWearHistory.forEach(date => {
      const month = months[new Date(date).getMonth()];
      if (!wearsByMonth[month]) wearsByMonth[month] = 0;
      wearsByMonth[month]++;
    });
    
    // Group wash dates by month
    const washesByMonth: Record<string, number> = {};
    item.filteredWashHistory.forEach(date => {
      const month = months[new Date(date).getMonth()];
      if (!washesByMonth[month]) washesByMonth[month] = 0;
      washesByMonth[month]++;
    });
    
    // Calculate washes reduced for each month
    Object.entries(wearsByMonth).forEach(([month, wears]) => {
      const washes = washesByMonth[month] || 0;
      const reduced = Math.max(0, wears - washes);
      monthlyImpact[month].washesReduced += reduced;
      monthlyImpact[month].co2Reduced += reduced * ELECTRICITY_PER_WASH * CO2_PER_KWH;
    });
  });
  
  // Convert to array and sort by month
  const monthlyImpactArray = Object.entries(monthlyImpact)
    .filter(([_, impact]) => impact.washesReduced > 0) // Only include months with impact
    .map(([month, impact]) => ({
      month,
      washesReduced: impact.washesReduced,
      co2Reduced: parseFloat(impact.co2Reduced.toFixed(1))
    }))
    .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  
  return {
    totalWashesReduced,
    electricitySaved,
    waterSaved,
    detergentSaved,
    co2Reduced,
    treeEquivalent,
    monthlyImpact: monthlyImpactArray
  };
};

// Generate badge data
export const generateBadges = (): Badge[] => {
  // Calculate some statistics for badge progress
  const totalItems = mockClothingItems.length;
  const totalWears = mockClothingItems.reduce((sum, item) => sum + item.wearHistory.length, 0);
  const totalWashes = mockClothingItems.reduce((sum, item) => sum + item.washHistory.length, 0);
  const washesReduced = totalWears - totalWashes;
  
  // Check if we have items in all categories
  const categories = new Set(mockClothingItems.map(item => item.category));
  const allCategories = ['トップス', 'ボトムス', 'アウター', 'シューズ', 'その他', '小物'];
  const hasAllCategories = allCategories.every(cat => categories.has(cat as CategoryValue));
  
  // Find item with most wears
  const maxWears = Math.max(...mockClothingItems.map(item => item.wearHistory.length));
  
  return [
    // Usage badges
    {
      id: 'first-item',
      name: '初めてのアイテム登録',
      description: '最初のアイテムを登録しました',
      imageUrl: 'https://example.com/badges/first-item.png',
      isEarned: totalItems > 0,
      earnedDate: totalItems > 0 ? '2025-01-01' : undefined,
      category: 'usage'
    },
    {
      id: 'first-wear',
      name: '初めての着用記録',
      description: '最初の着用を記録しました',
      imageUrl: 'https://example.com/badges/first-wear.png',
      isEarned: totalWears > 0,
      earnedDate: totalWears > 0 ? '2025-01-05' : undefined,
      category: 'usage'
    },
    {
      id: 'first-wash',
      name: '初めての洗濯記録',
      description: '最初の洗濯を記録しました',
      imageUrl: 'https://example.com/badges/first-wash.png',
      isEarned: totalWashes > 0,
      earnedDate: totalWashes > 0 ? '2025-01-10' : undefined,
      category: 'usage'
    },
    
    // Milestone badges
    {
      id: 'item-10-wears',
      name: '10回着用達成',
      description: '1つのアイテムを10回着用しました',
      imageUrl: 'https://example.com/badges/10-wears.png',
      isEarned: maxWears >= 10,
      earnedDate: maxWears >= 10 ? '2025-02-15' : undefined,
      progress: maxWears >= 10 ? 100 : Math.round((maxWears / 10) * 100),
      category: 'milestone'
    },
    {
      id: 'item-30-wears',
      name: '30回着用達成',
      description: '1つのアイテムを30回着用しました',
      imageUrl: 'https://example.com/badges/30-wears.png',
      isEarned: maxWears >= 30,
      earnedDate: maxWears >= 30 ? '2025-04-20' : undefined,
      progress: maxWears >= 30 ? 100 : Math.round((maxWears / 30) * 100),
      category: 'milestone'
    },
    {
      id: 'item-50-wears',
      name: '50回着用達成',
      description: '1つのアイテムを50回着用しました',
      imageUrl: 'https://example.com/badges/50-wears.png',
      isEarned: false,
      progress: Math.round((maxWears / 50) * 100),
      category: 'milestone'
    },
    
    // Efficiency badges
    {
      id: 'wash-reduced-10',
      name: '洗濯10回削減',
      description: '洗濯回数を10回削減しました',
      imageUrl: 'https://example.com/badges/wash-10.png',
      isEarned: washesReduced >= 10,
      earnedDate: washesReduced >= 10 ? '2025-03-01' : undefined,
      progress: washesReduced >= 10 ? 100 : Math.round((washesReduced / 10) * 100),
      category: 'efficiency'
    },
    {
      id: 'wash-reduced-50',
      name: '洗濯50回削減',
      description: '洗濯回数を50回削減しました',
      imageUrl: 'https://example.com/badges/wash-50.png',
      isEarned: washesReduced >= 50,
      earnedDate: washesReduced >= 50 ? '2025-05-15' : undefined,
      progress: washesReduced >= 50 ? 100 : Math.round((washesReduced / 50) * 100),
      category: 'efficiency'
    },
    {
      id: 'wash-reduced-100',
      name: '洗濯100回削減',
      description: '洗濯回数を100回削減しました',
      imageUrl: 'https://example.com/badges/wash-100.png',
      isEarned: false,
      progress: Math.round((washesReduced / 100) * 100),
      category: 'efficiency'
    },
    
    // Special badges
    {
      id: 'category-complete',
      name: 'カテゴリコンプリート',
      description: '全カテゴリでアイテムを登録しました',
      imageUrl: 'https://example.com/badges/category-complete.png',
      isEarned: hasAllCategories,
      earnedDate: hasAllCategories ? '2025-04-01' : undefined,
      progress: hasAllCategories ? 100 : Math.round((categories.size / allCategories.length) * 100),
      category: 'special'
    },
    {
      id: 'eco-warrior',
      name: 'エコウォリアー',
      description: '環境貢献度が高いユーザーに贈られるバッジ',
      imageUrl: 'https://example.com/badges/eco-warrior.png',
      isEarned: washesReduced >= 30,
      earnedDate: washesReduced >= 30 ? '2025-04-22' : undefined,
      progress: washesReduced >= 30 ? 100 : Math.round((washesReduced / 30) * 100),
      category: 'special'
    }
  ];
};

// Generate item detail statistics
export const generateItemDetailStats = (itemId: string): ItemDetailStats | null => {
  const item = mockClothingItems.find(item => item.id === itemId);
  if (!item) return null;
  
  // Calculate wear count and wash count
  const wearCount = item.wearHistory.length;
  const washCount = item.washHistory.length;
  
  // Calculate efficiency
  const efficiency = item.washThreshold > 0 && washCount > 0
    ? (wearCount / washCount) / item.washThreshold
    : 0;
  
  // Calculate wears by day of week
  const wearsByDay: Record<string, number> = {
    '日': 0, '月': 0, '火': 0, '水': 0, '木': 0, '金': 0, '土': 0
  };
  
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  item.wearHistory.forEach(date => {
    const day = dayNames[new Date(date).getDay()];
    wearsByDay[day]++;
  });
  
  // Calculate wears by month
  const wearsByMonth: Record<string, number> = {};
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  item.wearHistory.forEach(date => {
    const month = months[new Date(date).getMonth()];
    if (!wearsByMonth[month]) wearsByMonth[month] = 0;
    wearsByMonth[month]++;
  });
  
  // Calculate wear trend (last 6 months)
  const wearTrend: { period: string, count: number }[] = [];
  const washTrend: { period: string, count: number }[] = [];
  
  // Get last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const period = `${year}/${monthName}`;
    
    // Count wears in this month
    const monthStart = new Date(year, date.getMonth(), 1);
    const monthEnd = new Date(year, date.getMonth() + 1, 0);
    
    const wearsInMonth = item.wearHistory.filter(date => {
      const wearDate = new Date(date);
      return wearDate >= monthStart && wearDate <= monthEnd;
    }).length;
    
    const washesInMonth = item.washHistory.filter(date => {
      const washDate = new Date(date);
      return washDate >= monthStart && washDate <= monthEnd;
    }).length;
    
    wearTrend.push({ period: monthName, count: wearsInMonth });
    washTrend.push({ period: monthName, count: washesInMonth });
  }
  
  // Calculate optimized threshold based on usage pattern
  // This is a simplified calculation - in a real app, this would be more sophisticated
  const optimizedThreshold = Math.round(wearCount / (washCount || 1));
  
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    wearCount,
    washCount,
    efficiency,
    wearsByDay,
    wearsByMonth,
    wearTrend,
    washTrend,
    optimizedThreshold: optimizedThreshold > 0 ? optimizedThreshold : item.washThreshold
  };
};