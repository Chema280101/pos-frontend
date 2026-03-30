import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useExpensesCache, expensesCacheKeys } from './useExpensesCache';
import type { BusinessUnit } from '@/types/cash';

interface Expense {
  id: string;
  amount: number;
  reason: string;
  category: string;
  createdAt: string;
  cashRegisterId: string;
  createdBy: {
    id: string;
    name: string;
  };
  cashRegister?: {
    id: string;
    unit: string;
    status: string;
  };
}

interface ExpenseFilters {
  search?: string;
  unitFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  amountRange?: string;
  page?: number;
  limit?: number;
}

interface ExpenseListResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateExpenseRequest {
  amount: number;
  reason: string;
  category?: string;
}

interface UpdateExpenseRequest {
  amount?: number;
  reason?: string;
  category?: string;
}

// 🎯 Hook optimizado para lista de gastos con cache
export const useOptimizedExpenses = (filters: ExpenseFilters) => {
  const cache = useExpensesCache();
  
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async (): Promise<ExpenseListResponse> => {
      // Intentar obtener del cache primero
      const cacheKey = expensesCacheKeys.list(filters.unitFilter, filters);
      const cached = cache.get<ExpenseListResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Si no está en cache, hacer la petición
      const params = new URLSearchParams();
      
      // Add search filter
      if (filters.search) params.set('search', filters.search);
      
      // Add unit filter
      if (filters.unitFilter) params.set('unitFilter', filters.unitFilter);
      
      // Add date range filters
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
      
      // Add category filter
      if (filters.category) params.set('category', filters.category);
      
      // Add amount range filter
      if (filters.amountRange) params.set('amountRange', filters.amountRange);
      
      // Add pagination con valores seguros
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(50, Math.max(10, filters.limit || 20));
      
      params.set('page', String(page));
      params.set('limit', String(limit));

      const { data } = await api.get(`/api/expenses?${params}`);
      
      // Guardar en cache
      cache.set(cacheKey, data, 3 * 60 * 1000); // 3 minutos
      
      return data;
    },
    staleTime: 60 * 1000, // 1 minuto
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

// 🎯 Hook optimizado para resumen de gastos con cache
export const useOptimizedExpensesSummary = (unit: BusinessUnit, dateFrom?: Date, dateTo?: Date) => {
  const cache = useExpensesCache();
  
  return useQuery({
    queryKey: ['expenses-summary', unit, dateFrom, dateTo],
    queryFn: async () => {
      // Intentar obtener del cache primero
      const cacheKey = expensesCacheKeys.summary(unit, dateFrom, dateTo);
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Si no está en cache, hacer la petición
      const params = new URLSearchParams();
      params.set('unit', unit);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      const { data } = await api.get(`/api/expenses/summary?${params}`);
      
      // Guardar en cache
      cache.set(cacheKey, data, 2 * 60 * 1000); // 2 minutos
      
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};

// 🎯 Hook optimizado para crear gasto con invalidación de cache
export const useOptimizedCreateExpense = () => {
  const queryClient = useQueryClient();
  const cache = useExpensesCache();
  
  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      const { data: result } = await api.post('/api/expenses', data);
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      cache.invalidate('expenses_list');
      cache.invalidate('expenses_summary');
      cache.invalidate('expenses_today');
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
    },
    onError: (error: any) => {
      // Error al crear gasto
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          // Error de validación
        }
        // Error de caja cerrada
        else if (errorMessage.includes('cerrada') || errorMessage.includes('abierta')) {
          // Error de caja
          queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
        }
        // Otros errores
        else {
          // Error desconocido
        }
      } else {
        // Error de red o servidor
      }
    }
  });
};

// 🎯 Hook optimizado para editar gasto con invalidación de cache
export const useOptimizedEditExpense = () => {
  const queryClient = useQueryClient();
  const cache = useExpensesCache();
  
  return useMutation({
    mutationFn: async ({ id, amount, reason, category }: UpdateExpenseRequest & { id: string }) => {
      const { data } = await api.patch(`/api/expenses/${id}`, { amount, reason, category });
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      cache.invalidate('expenses_list');
      cache.invalidate('expenses_summary');
      cache.invalidate('expenses_today');
      cache.invalidate('expense_details');
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
    },
    onError: (error: any) => {
      // Error al editar gasto
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          // Error de validación
        }
        // Error de permisos
        else if (error?.response?.status === 403) {
          // Error de permisos
        }
        // Otros errores
        else {
          // Error desconocido
        }
      } else {
        // Error de red o servidor
      }
    }
  });
};

// 🎯 Hook optimizado para eliminar gasto con invalidación de cache
export const useOptimizedDeleteExpense = () => {
  const queryClient = useQueryClient();
  const cache = useExpensesCache();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.delete(`/api/expenses/${id}`, { data: { reason } });
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      cache.invalidate('expenses_list');
      cache.invalidate('expenses_summary');
      cache.invalidate('expenses_today');
      cache.invalidate('expense_details');
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
    },
    onError: (error: any) => {
      // Error al eliminar gasto
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          // Error de permisos
        }
        // Error de antigüedad
        else if (errorMessage.includes('antiguo') || errorMessage.includes('old')) {
          // Error de antigüedad
        }
        // Error de validación
        else if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          // Error de validación
        }
        // Otros errores
        else {
          // Error desconocido
        }
      } else {
        // Error de red o servidor
      }
    }
  });
};

// 🎯 Hook optimizado para detalles de gasto con cache
export const useOptimizedExpenseDetails = (expenseId: string) => {
  const cache = useExpensesCache();
  
  return useQuery({
    queryKey: ['expense-details', expenseId],
    queryFn: async () => {
      // Intentar obtener del cache primero
      const cacheKey = expensesCacheKeys.details(expenseId);
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Si no está en cache, hacer la petición
      const { data } = await api.get(`/api/expenses/${expenseId}`);
      
      // Guardar en cache
      cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutos
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};

// 🎯 Hook optimizado para exportar gastos
export const useOptimizedExportExpenses = () => {
  return useMutation({
    mutationFn: async ({ 
      format, 
      filters 
    }: { 
      format: 'excel' | 'pdf';
      filters: ExpenseFilters;
    }) => {
      const params = new URLSearchParams();
      
      // Add filters to export
      if (filters.search) params.set('search', filters.search);
      if (filters.unitFilter) params.set('unitFilter', filters.unitFilter);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
      if (filters.category) params.set('category', filters.category);
      if (filters.amountRange) params.set('amountRange', filters.amountRange);
      
      params.set('format', format);
      
      const { data } = await api.get(`/api/expenses/export?${params}`, {
        responseType: 'blob'
      });
      
      return data;
    },
    onSuccess: (blob, variables) => {
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gastos.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error: any) => {
      // Error al exportar gastos
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          // Error de permisos
        }
        // Error de formato
        else if (errorMessage.includes('formato') || errorMessage.includes('format')) {
          // Error de formato
        }
        // Otros errores
        else {
          // Error desconocido
        }
      } else {
        // Error de red o servidor
      }
    }
  });
};
