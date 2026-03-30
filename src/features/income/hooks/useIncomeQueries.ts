import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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

// 🎯 Hook para lista de ingresos con manejo mejorado de errores
export function useIncome(filters: IncomeFilters) {
  return useQuery({
    queryKey: ['income', filters],
    queryFn: async (): Promise<IncomeListResponse> => {
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
      
      params.set('page', '1');
      params.set('limit', '50');

      const { data } = await api.get(`/api/income?${params}`);
      return data;
    },
    staleTime: 60 * 1000, // 1 minuto
    retry: 2
  });
}

// 🎯 Hook para resumen de ingresos con manejo mejorado de errores
export function useIncomeSummary(unit: BusinessUnit, dateFrom?: Date, dateTo?: Date) {
  return useQuery({
    queryKey: ['income-summary', unit, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('unit', unit);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
      if (dateTo) params.set('dateTo', dateTo.toISOString());
      
      const { data } = await api.get(`/api/income/summary?${params}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// 🎯 Hook para editar ingreso con manejo mejorado de errores
export function useEditIncomeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, total, paymentMethod }: { id: string; total: number; paymentMethod?: string }) => {
      const { data } = await api.patch(`/api/income/${id}`, { total, paymentMethod });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
    },
    onError: (error: any) => {
      // Error al editar ingreso
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          // Error de validación
          // Mostrar toast de error de validación
        }
        // Error de estado
        else if (errorMessage.includes('estado') || errorMessage.includes('status')) {
          // Error de estado
          // Mostrar toast específico de estado
        }
        // Otros errores
        else {
          // Error desconocido
          // Mostrar toast genérico
        }
      } else {
        // Error de red o servidor
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para eliminar ingreso con manejo mejorado de errores
export function useDeleteIncomeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.delete(`/api/income/${id}`, { data: { reason } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['income-summary'] });
    },
    onError: (error: any) => {
      // Error al eliminar ingreso
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          // Error de permisos
          // Mostrar toast de permisos
        }
        // Error de estado
        else if (errorMessage.includes('completado') || errorMessage.includes('completed')) {
          // Error de estado
          // Mostrar toast específico
        }
        // Error de validación
        else if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          // Error de validación
          // Mostrar toast de error de validación
        }
        // Otros errores
        else {
          // Error desconocido
          // Mostrar toast genérico
        }
      } else {
        // Error de red o servidor
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para detalles de ingreso específico con manejo mejorado de errores
export function useIncomeDetails(incomeId: string) {
  return useQuery({
    queryKey: ['income-details', incomeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/income/${incomeId}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// 🎯 Hook para exportar ingresos con manejo mejorado de errores
export function useExportIncomeMutation() {
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
    },
    onError: (error: any) => {
      // Error al exportar ingresos
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          // Error de permisos
          // Mostrar toast de permisos
        }
        // Error de formato
        else if (errorMessage.includes('formato') || errorMessage.includes('format')) {
          // Error de formato
          // Mostrar toast específico
        }
        // Otros errores
        else {
          // Error desconocido
          // Mostrar toast genérico
        }
      } else {
        // Error de red o servidor
        // Mostrar toast de error de conexión
      }
    }
  });
}
