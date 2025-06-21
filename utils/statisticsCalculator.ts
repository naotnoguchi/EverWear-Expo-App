// utils/statisticsCalculator.ts
import { CategoryValue } from '../types/categories';
import { AppClothingItem } from '../types/database';
import {
    BasicStats,
    EfficiencyItem,
    ImpactData,
    ItemDetailStats,
    Period,
    RankingItem
} from '../types/statistics';

// Helper function to filter items by period
export const filterByPeriod = (dates: string[], period: Period): string[] => {
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

// 基本統計を計算する関数
export function calculateBasicStats(items: AppClothingItem[], period: Period): BasicStats {
  // 期間でフィルタリング
  const filteredItems = items.map(item => ({
    ...item,
    filteredWearHistory: filterByPeriod(item.wearHistory, period),
    filteredWashHistory: filterByPeriod(item.washHistory, period)
  }));

  // 総着用回数と洗濯回数を計算
  const totalWears = filteredItems.reduce((sum, item) => sum + item.filteredWearHistory.length, 0);
  const totalWashes = filteredItems.reduce((sum, item) => sum + item.filteredWashHistory.length, 0);

  // 洗濯あたりの平均着用回数を計算
  const averageWearsBetweenWashes = totalWashes > 0 ? parseFloat((totalWears / totalWashes).toFixed(1)) : 0;

  // 最も着用されたカテゴリを見つける
  const categoryWears: Record<string, number> = {
    'トップス': 0,
    'ボトムス': 0,
    'ジャケット': 0,
    'アウター': 0,
    'セットアップ': 0,
    'ワンピース': 0,
    'シューズ': 0,
    'バッグ': 0,
    '小物': 0,
    'その他': 0
  };
  filteredItems.forEach(item => {
    const category = item.category;
    if (category) {
      categoryWears[category] += item.filteredWearHistory.length;
    }
  });

  const mostWornCategory = Object.entries(categoryWears).length > 0 
    ? Object.entries(categoryWears)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0] as CategoryValue)[0]
    : null;

  // 最も着用されたアイテムと最も着用されていないアイテムを見つける
  const sortedItems = [...filteredItems].sort(
    (a, b) => b.filteredWearHistory.length - a.filteredWearHistory.length
  );

  const mostWornItem = sortedItems.length > 0 ? {
    id: sortedItems[0].id,
    name: sortedItems[0].name,
    wears: sortedItems[0].filteredWearHistory.length
  } : { id: '', name: '', wears: 0 };

  const leastWornItem = sortedItems.length > 0 ? {
    id: sortedItems[sortedItems.length - 1].id,
    name: sortedItems[sortedItems.length - 1].name,
    wears: sortedItems[sortedItems.length - 1].filteredWearHistory.length
  } : { id: '', name: '', wears: 0 };

  // カテゴリ別の内訳を計算
  const categories: Record<string, number> = {
    'トップス': 0,
    'ボトムス': 0,
    'ジャケット': 0,
    'アウター': 0,
    'セットアップ': 0,
    'ワンピース': 0,
    'シューズ': 0,
    'バッグ': 0,
    '小物': 0,
    'その他': 0
  };
  items.forEach(item => {
    const category = item.category;
    if (category) {
      categories[category]++;
    }
  });

  const totalItems = items.length;
  const categoryBreakdown = Object.entries(categories).map(([category, count]) => ({
    category: category as CategoryValue,
    count,
    percentage: Math.round((count / totalItems) * 100)
  }));

  // 月別着用回数を計算
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

  // 配列に変換して月順にソート
  const monthlyWearsArray = Object.entries(monthlyWears).map(([month, count]) => ({
    month,
    count
  })).sort((a, b) => {
    return months.indexOf(a.month) - months.indexOf(b.month);
  });

  // 平均洗濯閾値を計算
  const totalThreshold = filteredItems.reduce((sum, item) => sum + (item.washThreshold || 0), 0);
  const averageWashThreshold = filteredItems.length > 0
    ? parseFloat((totalThreshold / filteredItems.length).toFixed(1))
    : 0;

  // 結果を返す
  return {
    totalItems,
    totalWears,
    totalWashes,
    averageWearsBetweenWashes,
    mostWornCategory,
    mostWornItem,
    leastWornItem,
    categoryBreakdown,
    monthlyWears: monthlyWearsArray,
    averageWashThreshold
  };
}

// ランキングデータを計算する関数
export function calculateRankingData(
  items: AppClothingItem[], 
  period: Period,
  sortOrder: 'most' | 'least' = 'most',
  category: CategoryValue = null
): RankingItem[] {
  // 期間でフィルタリング
  const filteredItems = items.map(item => ({
    ...item,
    filteredWearHistory: filterByPeriod(item.wearHistory, period)
  }));

  // カテゴリでフィルタリング（指定されている場合）
  let targetItems = filteredItems;
  if (category) {
    targetItems = filteredItems.filter(item => item.category === category);
  }

  // 着用回数でソート
  const sortedItems = [...targetItems].sort((a, b) => {
    const aWears = a.filteredWearHistory.length;
    const bWears = b.filteredWearHistory.length;
    return sortOrder === 'most' ? bWears - aWears : aWears - bWears;
  });

  // 最大着用回数を計算（パーセンテージ計算用）
  const maxWearCount = Math.max(...sortedItems.map(item => item.filteredWearHistory.length), 1);

  // ランキングアイテムに変換
  const rankingItems: RankingItem[] = sortedItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    brand: item.brand,
    imageUrl: item.image,
    wearCount: item.filteredWearHistory.length,
    percentageOfMax: Math.round((item.filteredWearHistory.length / maxWearCount) * 100)
  }));

  return rankingItems;
}

// 効率データを計算する関数
export function calculateEfficiencyData(items: AppClothingItem[], period: Period): EfficiencyItem[] {

  // 期間でフィルタリング
  const filteredItems = items.map(item => ({
    ...item,
    filteredWearHistory: filterByPeriod(item.wearHistory, period),
    filteredWashHistory: filterByPeriod(item.washHistory, period)
  }));

  // 効率を計算
  const efficiencyItems: EfficiencyItem[] = filteredItems.map(item => {
    const wears = item.filteredWearHistory.length;
    const washes = item.filteredWashHistory.length;
    const wearsPerWash = washes > 0 ? parseFloat((wears / washes).toFixed(1)) : wears;
    const efficiency = item.washThreshold > 0 
      ? parseFloat((wearsPerWash / item.washThreshold).toFixed(2)) 
      : 0;

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      imageUrl: item.image,
      wearCount: wears,
      washCount: washes,
      threshold: item.washThreshold,
      efficiency,
      status: efficiency >= 0.8 && efficiency <= 1.2 ? 'good' : efficiency < 0.8 ? 'overwashed' : 'underwashed'
    };
  });

  // 効率でソート（高い順）
  const sortedItems = [...efficiencyItems].sort((a, b) => b.efficiency - a.efficiency);

  return sortedItems;
}

// 環境影響データを計算する関数
export function calculateImpactData(items: AppClothingItem[], period: Period): ImpactData {
  // 期間でフィルタリング
  const filteredItems = items.map(item => ({
    ...item,
    filteredWearHistory: filterByPeriod(item.wearHistory, period),
    filteredWashHistory: filterByPeriod(item.washHistory, period)
  }));

  // 環境影響の定数
  const ELECTRICITY_PER_WASH = 0.5; // kWh
  const WATER_PER_WASH = 50; // liters
  const CO2_PER_KWH = 0.5; // kg
  const ITEMS_PER_WASH_LOAD = 5; // 1回の洗濯で平均5アイテム

  // 総着用回数と洗濯回数
  const totalWears = filteredItems.reduce((sum, item) => sum + item.filteredWearHistory.length, 0);
  const totalWashes = filteredItems.reduce((sum, item) => sum + item.filteredWashHistory.length, 0);

  // 削減された洗濯回数を計算
  // 毎回着用後に洗濯した場合は totalWears 回の洗濯が必要
  // 実際は totalWashes 回の洗濯しか行っていない
  const washesReduced = Math.max(0, (totalWears - totalWashes) / ITEMS_PER_WASH_LOAD);

  // 節約された水と電力、削減されたCO2を計算
  const waterSaved = Math.round(washesReduced * WATER_PER_WASH);
  const energySaved = parseFloat((washesReduced * ELECTRICITY_PER_WASH).toFixed(1));
  const co2Reduced = parseFloat((energySaved * CO2_PER_KWH).toFixed(1));

  // 結果を返す
  return {
    totalWashesReduced: washesReduced,
    electricitySaved: { amount: energySaved, cost: Math.round(energySaved * 25) }, // 電気の単価を25円/kWhと仮定
    waterSaved: { amount: waterSaved, cost: Math.round(waterSaved * 0.2) }, // 水の単価を0.2円/Lと仮定
    detergentSaved: { amount: Math.round(washesReduced * 30), cost: Math.round(washesReduced * 30 * 0.05) }, // 洗剤は1回30ml、単価0.05円/mlと仮定
    co2Reduced,
    treeEquivalent: parseFloat((co2Reduced / 20).toFixed(1)), // 1本の木が年間約20kgのCO2を吸収すると仮定
    monthlyImpact: [] // 月別影響データは現在未実装
  };
}

// アイテム詳細統計を計算する関数
export function calculateItemDetailStats(item: AppClothingItem): ItemDetailStats {
  // 基本統計を計算
  const wearCount = item.wearHistory.length;
  const washCount = item.washHistory.length;
  const wearPerWash = washCount > 0 ? parseFloat((wearCount / washCount).toFixed(1)) : wearCount;
  const efficiency = item.washThreshold > 0 ? parseFloat((wearPerWash / item.washThreshold).toFixed(2)) : 0;

  // 曜日別着用回数を計算
  const wearsByDay: { [day: string]: number } = {
    '日曜日': 0, '月曜日': 0, '火曜日': 0, '水曜日': 0, '木曜日': 0, '金曜日': 0, '土曜日': 0
  };

  const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

  item.wearHistory.forEach(dateStr => {
    const date = new Date(dateStr);
    const day = dayNames[date.getDay()];
    wearsByDay[day]++;
  });

  // 月別着用回数を計算
  const wearsByMonth: { [month: string]: number } = {};
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  item.wearHistory.forEach(dateStr => {
    const date = new Date(dateStr);
    const month = months[date.getMonth()];
    wearsByMonth[month] = (wearsByMonth[month] || 0) + 1;
  });

  // 過去6ヶ月の着用・洗濯トレンドを計算
  const now = new Date();
  const wearTrend: { period: string; count: number }[] = [];
  const washTrend: { period: string; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[month.getMonth()];
    const monthYear = `${monthName} ${month.getFullYear()}`;

    // この月の着用回数をカウント
    const wearsInMonth = item.wearHistory.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    }).length;

    // この月の洗濯回数をカウント
    const washesInMonth = item.washHistory.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    }).length;

    wearTrend.push({ period: monthName, count: wearsInMonth });
    washTrend.push({ period: monthName, count: washesInMonth });
  }

  // 平均着用間隔を計算
  let averageWearInterval = 0;
  if (item.wearHistory.length > 1) {
    const sortedWears = [...item.wearHistory].sort();
    let totalDays = 0;
    let intervals = 0;

    for (let i = 1; i < sortedWears.length; i++) {
      const prevDate = new Date(sortedWears[i - 1]);
      const currDate = new Date(sortedWears[i]);
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        totalDays += diffDays;
        intervals++;
      }
    }

    averageWearInterval = intervals > 0 ? parseFloat((totalDays / intervals).toFixed(1)) : 0;
  }

  // 環境影響を計算
  const ELECTRICITY_PER_WASH = 0.5; // kWh
  const WATER_PER_WASH = 50; // liters
  const CO2_PER_KWH = 0.5; // kg
  const ITEMS_PER_WASH_LOAD = 5; // 1回の洗濯で平均5アイテム

  // 毎回着用後に洗濯した場合は wearCount 回の洗濯が必要
  // 実際は washCount 回の洗濯しか行っていない
  const washesReduced = Math.max(0, (wearCount - washCount) / ITEMS_PER_WASH_LOAD);

  const waterSaved = Math.round(washesReduced * WATER_PER_WASH);
  const energySaved = parseFloat((washesReduced * ELECTRICITY_PER_WASH).toFixed(1));
  const co2Reduced = parseFloat((energySaved * CO2_PER_KWH).toFixed(1));

  // 最適化された洗濯閾値を計算
  let optimizedThreshold = item.washThreshold;
  if (washCount > 0) {
    // 実際の着用回数/洗濯回数が閾値と大きく異なる場合、最適化された閾値を提案
    const actualWearsBetweenWashes = wearPerWash;
    const thresholdDiff = Math.abs(actualWearsBetweenWashes - item.washThreshold);

    if (thresholdDiff > 1) {
      // 最も近い整数に丸める
      optimizedThreshold = Math.round(actualWearsBetweenWashes);
    }
  }

  // 最終着用日を計算
  let lastWornDate: string | null = null;
  if (item.wearHistory.length > 0) {
    const sortedWears = [...item.wearHistory].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    lastWornDate = sortedWears[0];
  }

  // 結果を返す
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    brand: item.brand, // ブランド名を追加
    imageUrl: item.image, // imageUrlプロパティに修正
    wearCount,
    washCount,
    wearPerWash,
    efficiency,
    wearsByDay,
    wearsByMonth,
    wearTrend,
    washTrend,
    averageWearInterval,
    lastWornDate, // 最終着用日を追加
    // 環境影響データを個別プロパティとして設定
    waterSaved: waterSaved,
    energySaved: energySaved,
    co2Reduced: co2Reduced,
    optimizedThreshold: optimizedThreshold !== item.washThreshold ? optimizedThreshold : undefined
  };
}
