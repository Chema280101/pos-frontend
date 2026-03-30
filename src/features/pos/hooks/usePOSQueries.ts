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
    },
    onError: (error: any) => {
      // Error creating sale
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Errores de validación
        if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          // Error de validación
          // Mostrar toast de error de validación
        }
        // Errores de caja
        else if (errorMessage.includes('caja')) {
          // Error de caja
          // Mostrar toast específico de caja
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
    },
    onError: (error: any) => {
      // Error closing sale
      
      // Manejo específico de errores de concurrencia
      if (error?.response?.data?.error?.includes('modificada por otro usuario')) {
        // Error de concurrencia
        // Mostrar toast para recargar
        queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      }
      // Errores de validación de pago
      else if (error?.response?.data?.error?.includes('monto pagado')) {
        // Error de pago
        // Mostrar toast de error de pago
      }
      // Otros errores
      else {
        // Error desconocido al cerrar venta
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
    },
    onError: (error: any) => {
      // Error cancelling sale
      
      // Manejo específico de errores de permisos
      if (error?.response?.status === 403) {
        // Error de permisos
        // Mostrar toast de permisos
      }
      // Errores de concurrencia
      else if (error?.response?.data?.error?.includes('modificada')) {
        // Error de concurrencia
        // Mostrar toast para recargar
        queryClient.invalidateQueries({ queryKey: ['pos-pending'] });
      }
      // Otros errores
      else {
        // Error desconocido al cancelar venta
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
