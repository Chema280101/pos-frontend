import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CashRegister, CashRegisterOpen, BusinessUnit } from '@/types/cash';

// 🎯 Hook para caja abierta con manejo mejorado de errores
export function useOpenCashRegister(unit: BusinessUnit) {
  return useQuery({
    queryKey: ['cash-register-open', unit],
    queryFn: async (): Promise<CashRegisterOpen | null> => {
      const { data } = await api.get<CashRegisterOpen | null>(`/api/cash-register/open?unit=${unit}`);
      return data;
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

// 🎯 Hook para abrir caja con manejo mejorado de errores
export function useOpenCashRegisterMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { unit: BusinessUnit; openingAmount: number }) => {
      const { data: result } = await api.post('/api/cash-register/open', data);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open', variables.unit] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      console.log('✅ Caja abierta exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al abrir caja:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de caja ya abierta
        if (errorMessage.includes('Ya hay una caja abierta')) {
          console.warn('⚠️ Ya existe una caja abierta para esta unidad');
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

// 🎯 Hook para cerrar caja con manejo mejorado de errores
export function useCloseCashRegisterMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      registerId: string;
      denominations: Array<{ denomination: number; quantity: number }>;
      closingNotes?: string;
      closedBySignature: string;
    }) => {
      const { data: result } = await api.post(`/api/cash-register/${data.registerId}/close`, {
        denominations: data.denominations,
        closingNotes: data.closingNotes,
        closedBySignature: data.closedBySignature
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-summary'] });
      console.log('✅ Caja cerrada exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al cerrar caja:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de comisiones pendientes
        if (errorMessage.includes('comisiones pendientes')) {
          console.warn('⚠️ Comisiones pendientes:', errorMessage);
          // Mostrar toast detallado con comisiones
        }
        // Error de concurrencia
        else if (errorMessage.includes('modificada por otro usuario')) {
          console.warn('⚠️ Error de concurrencia:', errorMessage);
          // Mostrar toast para recargar
          queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
        }
        // Error de validación
        else if (errorMessage.includes('requerido') || errorMessage.includes('inválido')) {
          console.warn('⚠️ Error de validación:', errorMessage);
          // Mostrar toast de error de validación
        }
        // Otros errores
        else {
          console.error('❌ Error desconocido al cerrar caja:', errorMessage);
          // Mostrar toast genérico
        }
      } else {
        console.error('❌ Error de red o servidor al cerrar caja:', error);
        // Mostrar toast de error de conexión
      }
    }
  });
}

// 🎯 Hook para agregar egreso con manejo mejorado de errores
export function useAddExpenseMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      registerId: string;
      amount: number;
      reason: string;
      category?: string;
    }) => {
      const { data: result } = await api.post(`/api/cash-register/${data.registerId}/expense`, {
        amount: data.amount,
        reason: data.reason,
        category: data.category
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-summary'] });
      console.log('✅ Egreso agregado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al agregar egreso:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de caja cerrada
        if (errorMessage.includes('cerrada')) {
          console.warn('⚠️ La caja está cerrada:', errorMessage);
          // Mostrar toast específico
          queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
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

// 🎯 Hook para agregar entrada de efectivo con manejo mejorado de errores
export function useAddCashEntryMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      registerId: string;
      amount: number;
      reason: string;
      type: string;
    }) => {
      const { data: result } = await api.post(`/api/cash-register/${data.registerId}/cash-entry`, {
        amount: data.amount,
        reason: data.reason,
        type: data.type
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-summary'] });
      console.log('✅ Entrada de efectivo agregada exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al agregar entrada de efectivo:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de caja cerrada
        if (errorMessage.includes('cerrada')) {
          console.warn('⚠️ La caja está cerrada:', errorMessage);
          // Mostrar toast específico
          queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
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

// 🎯 Hook para reapertura de caja con manejo mejorado de errores
export function useReopenCashRegisterMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { registerId: string; reopenReason: string }) => {
      const { data: result } = await api.post(`/api/cash-register/${data.registerId}/reopen`, {
        reopenReason: data.reopenReason
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      console.log('✅ Caja reabierta exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error al reabrir caja:', error);
      
      // Manejo específico de errores
      if (error?.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Error de permisos
        if (error?.response?.status === 403) {
          console.warn('⚠️ Error de permisos:', 'No tienes permisos para reabrir cajas');
          // Mostrar toast de permisos
        }
        // Error de validación
        else if (errorMessage.includes('obligatorio') || errorMessage.includes('inválido')) {
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

// 🎯 Hook para lista de cajas con manejo mejorado de errores
export function useCashRegisters(unit: BusinessUnit, filters?: {
  unitFilter?: string;
  statusFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  return useQuery({
    queryKey: ['cash-registers', unit, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('unit', unit);
      if (filters?.unitFilter) params.set('unitFilter', filters.unitFilter);
      if (filters?.statusFilter) params.set('status', filters.statusFilter);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.set('dateTo', filters.dateTo.toISOString());
      params.set('limit', '20');

      const { data } = await api.get(`/api/cash-register?${params}`);
      return data;
    },
    staleTime: 60 * 1000, // 1 minuto
    retry: 2
  });
}

// 🎯 Hook para resumen de caja con manejo mejorado de errores
export function useCashRegisterSummary(unit: BusinessUnit) {
  return useQuery({
    queryKey: ['cash-register-summary', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/cash-register/summary?unit=${unit}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}

// 🎯 Hook para resumen de caja específica con manejo mejorado de errores
export function useCashRegisterDetails(registerId: string) {
  return useQuery({
    queryKey: ['cash-register-details', registerId],
    queryFn: async () => {
      const { data } = await api.get(`/api/cash-register/${registerId}/summary`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
}
