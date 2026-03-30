// 🎯 CACHE INTELIGENTE PARA GASTOS

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheKey {
  type: string;
  unit?: string;
  filters?: Record<string, any>;
}

class ExpensesCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  // Generar key para cache
  private generateKey(key: CacheKey): string {
    const parts = [key.type];
    if (key.unit) parts.push(key.unit);
    if (key.filters) {
      parts.push(JSON.stringify(key.filters));
    }
    return parts.join(':');
  }

  // Limpiar cache expirado
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Obtener del cache
  get<T>(key: CacheKey): T | null {
    this.cleanup();
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    
    return null;
  }

  // Guardar en cache
  set<T>(key: CacheKey, data: T, ttl?: number): void {
    const cacheKey = this.generateKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  // Invalidar cache por tipo
  invalidate(type: string, unit?: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(type)) {
        if (!unit || key.includes(unit)) {
          this.cache.delete(key);
        }
      }
    }
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    };
  }
}

// Instancia global
export const expensesCache = new ExpensesCache();

// Keys de cache
export const expensesCacheKeys = {
  list: (unit?: string, filters?: Record<string, any>) => ({
    type: 'expenses_list',
    unit,
    filters
  }),
  summary: (unit: string, dateFrom?: Date, dateTo?: Date) => ({
    type: 'expenses_summary',
    unit,
    filters: { dateFrom: dateFrom?.toISOString(), dateTo: dateTo?.toISOString() }
  }),
  details: (id: string) => ({
    type: 'expense_details',
    filters: { id }
  }),
  categories: (unit?: string) => ({
    type: 'expenses_categories',
    unit
  }),
  today: (unit: string) => ({
    type: 'expenses_today',
    unit,
    filters: { today: new Date().toISOString().split('T')[0] }
  })
};

// Hook de cache para gastos
export const useExpensesCache = () => {
  return {
    get: expensesCache.get.bind(expensesCache),
    set: expensesCache.set.bind(expensesCache),
    invalidate: expensesCache.invalidate.bind(expensesCache),
    clear: expensesCache.clear.bind(expensesCache),
    stats: expensesCache.getStats.bind(expensesCache)
  };
};
