import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useIncomeCache, incomeCacheKeys } from './useIncomeCache';
import type { BusinessUnit } from '@/types/cash';

interface Income {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  } | null;
  appointment?: {
    id: string;
    startTime: string;
  } | null;
}

interface IncomeFilters {
  search?: string;
  unitFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: string;
  status?: string;
  amountRange?: string;
  typeFilter?: string;
  page?: number;
  limit?: number;
}

interface IncomeListResponse {
  data: Income[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 🎯 Hook optimizado para lista de ingresos con cache
export const useOptimizedIncome = (filters: IncomeFilters) => {
  const cache = useIncomeCache();
  
  return useQuery({
    queryKey: ['income', filters],
    queryFn: async (): Promise<IncomeListResponse> => {
      // Intentar obtener del cache primero
      const cacheKey = incomeCacheKeys.list(filters.unitFilter, filters);
      const cached = cache.get<IncomeListResponse>(cacheKey);
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
      
      // Add payment method filter
      if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
      
      // Add status filter
      if (filters.status) params.set('status', filters.status);
      
      // Add amount range filter
      if (filters.amountRange) params.set('amountRange', filters.amountRange);
      
      // Add type filter
      if (filters.typeFilter && filters.typeFilter !== 'ALL') params.set('type', filters.typeFilter);
      
      // Add pagination con valores seguros
      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(50, Math.max(10, filters.limit || 25));
      
      params.set('page', String(page));
      params.set('limit', String(limit));

      const { data } = await api.get(`/api/income?${params}`);
      
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

// 🎯 Hook optimizado para resumen de ingresos con cache
export const useOptimizedIncomeSummary = (unit: BusinessUnit, dateFrom?: Date, dateTo?: Date) => {
  const cache = useIncomeCache();
  
  return useQuery({
    queryKey: ['income-summary', unit, dateFrom, dateTo],
    queryFn: async () => {
      // Intentar obtener del cache primero
      const cacheKey = incomeCacheKeys.summary(unit, dateFrom, dateTo);
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Si no está en cache, hacer la petición
      const params = new URLSearchParams();
      params.set('unit', unit);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      const { data } = await api.get(`/api/income/summary?${params}`);
      
      // Guardar en cache
      cache.set(cacheKey, data, 2 * 60 * 1000); // 2 minutos
      
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};

// 🎯 Hook optimizado para editar ingreso con invalidación de cache
export const useOptimizedEditIncome = () => {
  const queryClient = useQueryClient();
  const cache = useIncomeCache();
  
  return useMutation({
    mutationFn: async ({ id, total, paymentMethod }: { id: string; total: number; paymentMethod?: string }) => {
      const { data } = await api.patch(`/api/income/${id}`, { total, paymentMethod });
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      cache.invalidate('income_list');
      cache.invalidate('income_summary');
      cache.invalidate('income_today');
      cache.invalidate('income_details');
      
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['income-summary'] });
      
      console.log('✅ Ingreso editado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al editar ingreso:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('⚠️ Error de validación:', errorMessage);
        }
        // Error de estado
        else if (errorMessage.includes('estado') || errorMessage.includes('status')) {
          console.warn('⚠️ Error de estado:', errorMessage);
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
      }
    }
  });
};

// 🎯 Hook optimizado para eliminar ingreso con invalidación de cache
export const useOptimizedDeleteIncome = () => {
  const queryClient = useQueryClient();
  const cache = useIncomeCache();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.delete(`/api/income/${id}`, { data: { reason } });
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relevantes
      cache.invalidate('income_list');
      cache.invalidate('income_summary');
      cache.invalidate('income_today');
      cache.invalidate('income_details');
      
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['income-summary'] });
      
      console.log('✅ Ingreso eliminado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al eliminar ingreso:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          console.warn('⚠️ Error de permisos:', 'No tienes permisos para eliminar ingresos');
        }
        // Error de estado
        else if (errorMessage.includes('completado') || errorMessage.includes('completed')) {
          console.warn('⚠️ Error de estado:', 'No se puede eliminar un ingreso completado');
        }
        // Error de validación
        else if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('⚠️ Error de validación:', errorMessage);
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
      }
    }
  });
};

// 🎯 Hook optimizado para detalles de ingreso con cache
export const useOptimizedIncomeDetails = (incomeId: string) => {
  const cache = useIncomeCache();
  
  return useQuery({
    queryKey: ['income-details', incomeId],
    queryFn: async () => {
      // Intentar obtener del cache primero
      const cacheKey = incomeCacheKeys.details(incomeId);
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Si no está en cache, hacer la petición
      const { data } = await api.get(`/api/income/${incomeId}`);
      
      // Guardar en cache
      cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutos
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};

// 🎯 Hook optimizado para exportar ingresos
export const useOptimizedExportIncome = () => {
  return useMutation({
    mutationFn: async ({ 
      format, 
      filters 
    }: { 
      format: 'excel' | 'pdf';
      filters: IncomeFilters;
    }) => {
      const params = new URLSearchParams();
      
      // Add filters to export
      if (filters.search) params.set('search', filters.search);
      if (filters.unitFilter) params.set('unitFilter', filters.unitFilter);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
      if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
      if (filters.status) params.set('status', filters.status);
      if (filters.amountRange) params.set('amountRange', filters.amountRange);
      if (filters.typeFilter && filters.typeFilter !== 'ALL') params.set('type', filters.typeFilter);
      
      params.set('format', format);
      
      const { data } = await api.get(`/api/income/export?${params}`, {
        responseType: 'blob'
      });
      
      return data;
    },
    onSuccess: (blob, variables) => {
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ingresos.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ Exportación ${variables.format} completada`);
    },
    onError: (error: any) => {
      console.error(`❌ Error al exportar ingresos:`, error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          console.warn('⚠️ Error de permisos:', 'No tienes permisos para exportar');
        }
        // Error de formato
        else if (errorMessage.includes('formato') || errorMessage.includes('format')) {
          console.warn('⚠️ Error de formato:', errorMessage);
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
      }
    }
  });
};
