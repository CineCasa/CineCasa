interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };
    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Limpar itens expirados
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Estatísticas do cache
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implementar tracking de hits/misses
    };
  }
}

export const cacheManager = new CacheManager();

// Hook para cache com React Query
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) => {
  return {
    getCached: () => cacheManager.get<T>(key),
    setCached: (data: T) => cacheManager.set(key, data, ttl),
    clearCache: () => cacheManager.delete(key),
  };
};

// Cache específico para Supabase
export const supabaseCache = {
  // Cache para tabelas específicas
  async getCachedData<T>(table: string, query?: string): Promise<T | null> {
    const key = `supabase:${table}:${query || 'all'}`;
    return cacheManager.get<T>(key);
  },

  async setCachedData<T>(
    table: string,
    data: T,
    query?: string,
    ttl?: number
  ): Promise<void> {
    const key = `supabase:${table}:${query || 'all'}`;
    cacheManager.set(key, data, ttl);
  },

  invalidateTable(table: string): void {
    // Limpar todos os caches relacionados a esta tabela
    for (const key of cacheManager.cache.keys()) {
      if (key.startsWith(`supabase:${table}:`)) {
        cacheManager.delete(key);
      }
    }
  },
};

// Auto cleanup a cada 10 minutos
setInterval(() => {
  cacheManager.cleanup();
}, 10 * 60 * 1000);
