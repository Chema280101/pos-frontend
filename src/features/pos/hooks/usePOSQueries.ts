import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PendingSale } from '@/types/pos';

// 🎯 Hook para ventas pendientes con mejor manejo de errores
export function usePendingSales(unit: string) {
  return useQuery({
    queryKey: ['pos-pending', unit],
    queryFn: async (): Promise<PendingSale[]> => {
      const { data } = await api.get<{ data: PendingSale[] }>(`/api/pos/pending?unit=${unit}&limit=20`);
      return data.data;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 2 * 60 * 1000, // 2 minutos
    retry: (failureCount, error: any) => {
      // No reintentar en errores de autenticación
      if (error?.status === 401) return false;
      // Reintentar hasta 3 veces
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

// 🎯 Hook para crear venta con manejo mejorado de errores
export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (saleData: {
      unit: string;
      items: Array<{
        itemType: string;
        referenceId: string;
        name: string;
        unitPrice: number;
        quantity: number;
        employeeId?: string;
      }>;
      customerId?: string;
      discountAmount?: number;
      discountReason?: string;
    }) => {
      const { data } = await api.post('/api/pos', saleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      queryClient.invalidateQueries({ queryKey: ['pos-stats'] });
      console.log('Venta creada exitosamente');
    },
    onError: (error: any) => {
      console.error('Error creating sale:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Errores de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('Error de validación:', errorMessage);
          // Mostrar toast de error de validación
        }
        // Errores de caja
        else if (errorMessage.includes('caja')) {
          console.warn('Error de caja:', errorMessage);
          // Mostrar toast específico de caja
        }
        // Otros errores
        else {
          console.error('Error desconocido:', errorMessage);
          // Mostrar toast genérico
        }
      } else {
        console.error('Error de red o servidor:', error);
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para cerrar venta con manejo mejorado de errores
export function useCloseSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      saleId, 
      paymentMethod, 
      amountPaid, 
      paymentDetail 
    }: {
      saleId: string;
      paymentMethod: string;
      amountPaid: number;
      paymentDetail?: Record<string, number>;
    }) => {
      const { data } = await api.post(`/api/pos/${saleId}/close`, {
        paymentMethod,
        amountPaid,
        paymentDetail,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      queryClient.invalidateQueries({ queryKey: ['pos-stats'] });
      console.log('Venta cerrada exitosamente:', data);
    },
    onError: (error: any) => {
      console.error('Error closing sale:', error);
      
      // Manejo específico de errores de concurrencia
      if (error?.response?.data?.error?.includes('modificada por otro usuario')) {
        console.warn('Error de concurrencia:', error.response.data.error);
        // Mostrar toast para recargar
        queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      }
      // Errores de validación de pago
      else if (error?.response?.data?.error?.includes('monto pagado')) {
        console.warn('Error de pago:', error.response.data.error);
        // Mostrar toast de error de pago
      }
      // Otros errores
      else {
        console.error('Error desconocido al cerrar venta:', error);
        // Mostrar toast genérico
      }
    }
  });
}

// 🎯 Hook para cancelar venta con manejo mejorado de errores
export function useCancelSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (saleId: string) => {
      const { data } = await api.post(`/api/pos/${saleId}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      queryClient.invalidateQueries({ queryKey: ['pos-stats'] });
      console.log('Venta cancelada exitosamente');
    },
    onError: (error: any) => {
      console.error('Error cancelling sale:', error);
      
      // Manejo específico de errores de permisos
      if (error?.response?.status === 403) {
        console.warn('Error de permisos:', 'No tienes permisos para cancelar ventas');
        // Mostrar toast de permisos
      }
      // Errores de concurrencia
      else if (error?.response?.data?.error?.includes('modificada')) {
        console.warn('Error de concurrencia:', error.response.data.error);
        // Mostrar toast para recargar
        queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      }
      // Otros errores
      else {
        console.error('Error desconocido al cancelar venta:', error);
        // Mostrar toast genérico
      }
    }
  });
}

// 🎯 Hook para estadísticas del día con cache
export function useTodayStats(unit: string) {
  return useQuery({
    queryKey: ['pos-stats', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/pos/stats?unit=${unit}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// 🎯 Hook para servicios con cache y manejo de errores
export function useServices(unit: string, search?: string) {
  return useQuery({
    queryKey: ['services', unit, search],
    queryFn: async () => {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/api/services?unit=${unit}${searchParam}`);
      return data;
    },
    enabled: search ? search.length >= 2 : true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });
}

// 🎯 Hook para productos con cache y manejo de errores
export function useProducts(unit: string, search?: string) {
  return useQuery({
    queryKey: ['inventory-products', unit, search],
    queryFn: async () => {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/api/inventory/products?unit=${unit}${searchParam}`);
      return data;
    },
    enabled: search ? search.length >= 2 : true,
    staleTime: 3 * 60 * 1000, // 3 minutos
    retry: 1
  });
}

// 🎯 Hook para paquetes con cache y manejo de errores
export function usePackages(search?: string) {
  return useQuery({
    queryKey: ['packages', search],
    queryFn: async () => {
      const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/api/packages${searchParam}`);
      return data;
    },
    enabled: search ? search.length >= 2 : true,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1
  });
}

// 🎯 Hook para empleados con cache y manejo de errores
export function useEmployees(unit: string) {
  return useQuery({
    queryKey: ['employees', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/employees?unit=${unit}`);
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 1
  });
}

// 🎯 Hook para clientes con cache y manejo de errores
export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const { data } = await api.get(`/api/customers${searchParam}`);
      return data;
    },
    enabled: search ? search.length >= 2 : false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });
}
