import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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

// 🎯 Hook para lista de gastos con manejo mejorado de errores
export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async (): Promise<ExpenseListResponse> => {
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
      
      // Add pagination
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      else params.set('limit', '20');

      const { data } = await api.get(`/api/expenses?${params}`);
      return data;
    },
    staleTime: 60 * 1000, // 1 minuto
    retry: 2
  });
}

// 🎯 Hook para resumen de gastos con manejo mejorado de errores
export function useExpensesSummary(unit: BusinessUnit, dateFrom?: Date, dateTo?: Date) {
  return useQuery({
    queryKey: ['expenses-summary', unit, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('unit', unit);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      const { data } = await api.get(`/api/expenses/summary?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// 🎯 Hook para crear gasto con manejo mejorado de errores
export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      const { data: result } = await api.post('/api/expenses', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      console.log('✅ Gasto creado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al crear gasto:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('⚠️ Error de validación:', errorMessage);
          // Mostrar toast de error de validación
        }
        // Error de caja cerrada
        else if (errorMessage.includes('cerrada') || errorMessage.includes('abierta')) {
          console.warn('⚠️ Error de caja:', errorMessage);
          // Mostrar toast específico de caja
          queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
          // Mostrar toast genérico
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para editar gasto con manejo mejorado de errores
export function useEditExpenseMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, amount, reason, category }: UpdateExpenseRequest & { id: string }) => {
      const { data } = await api.patch(`/api/expenses/${id}`, { amount, reason, category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      console.log('✅ Gasto editado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al editar gasto:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('⚠️ Error de validación:', errorMessage);
          // Mostrar toast de error de validación
        }
        // Error de permisos
        else if (error?.response?.status === 403) {
          console.warn('⚠️ Error de permisos:', 'No tienes permisos para editar gastos');
          // Mostrar toast de permisos
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
          // Mostrar toast genérico
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para eliminar gasto con manejo mejorado de errores
export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.delete(`/api/expenses/${id}`, { data: { reason } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      console.log('✅ Gasto eliminado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al eliminar gasto:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          console.warn('⚠️ Error de permisos:', 'No tienes permisos para eliminar gastos');
          // Mostrar toast de permisos
        }
        // Error de antigüedad
        else if (errorMessage.includes('antiguo') || errorMessage.includes('old')) {
          console.warn('⚠️ Error de antigüedad:', 'No se puede eliminar un gasto muy antiguo');
          // Mostrar toast específico
        }
        // Error de validación
        else if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('⚠️ Error de validación:', errorMessage);
          // Mostrar toast de error de validación
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
          // Mostrar toast genérico
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para detalles de gasto específico con manejo mejorado de errores
export function useExpenseDetails(expenseId: string) {
  return useQuery({
    queryKey: ['expense-details', expenseId],
    queryFn: async () => {
      const { data } = await api.get(`/api/expenses/${expenseId}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// 🎯 Hook para exportar gastos con manejo mejorado de errores
export function useExportExpensesMutation() {
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
      
      console.log(`✅ Exportación ${variables.format} completada`);
    },
    onError: (error: any) => {
      console.error(`❌ Error al exportar gastos:`, error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          console.warn('⚠️ Error de permisos:', 'No tienes permisos para exportar');
          // Mostrar toast de permisos
        }
        // Error de formato
        else if (errorMessage.includes('formato') || errorMessage.includes('format')) {
          console.warn('⚠️ Error de formato:', errorMessage);
          // Mostrar toast específico
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido:', errorMessage);
          // Mostrar toast genérico
        }
      } else {
        console.error('❌ Error de red o servidor:', error);
        // Mostrar toast de error de conexión
      }
    }
  });
}
