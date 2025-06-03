// Cache for brand data to avoid redundant fetches
class BrandCache {
  private static instance: BrandCache | null = null;
  private cache: {
    brands: Map<string, { data: string[]; timestamp: number }>;
    extendedBrands: Map<string, { data: any[]; timestamp: number }>;
  };
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5分間（ミリ秒）

  private constructor() {
    this.cache = {
      brands: new Map(),
      extendedBrands: new Map()
    };
  }

  public static getInstance(): BrandCache {
    if (!BrandCache.instance) {
      BrandCache.instance = new BrandCache();
    }
    return BrandCache.instance;
  }

  public get<T>(type: 'brands' | 'extendedBrands', key: string = 'default'): T | null {
    const cacheMap = this.cache[type];
    if (!cacheMap) return null;

    const cached = cacheMap.get(key);
    if (!cached) return null;

    // Cache expires after 5 minutes
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      cacheMap.delete(key);
      return null;
    }

    return cached.data as T;
  }

  public set<T>(type: 'brands' | 'extendedBrands', data: T, key: string = 'default'): void {
    const cacheMap = this.cache[type];
    if (!cacheMap) return;

    cacheMap.set(key, { data, timestamp: Date.now() });
  }

  public clear(type?: 'brands' | 'extendedBrands'): void {
    if (type) {
      const cacheMap = this.cache[type];
      if (cacheMap) cacheMap.clear();
    } else {
      Object.keys(this.cache).forEach(key => {
        this.cache[key].clear();
      });
    }
  }
}

export { BrandCache };
