import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function usePriceApprovals(status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL') {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['price-approvals', status],
    queryFn: async () => {
      const params = status && status !== 'ALL' ? `?status=${status}` : '';
      const { data } = await api.get(`/api/prices/approvals${params}`);
      return data; // Devuelve el objeto completo con data
    },
    enabled: user?.role === 'ADMIN', // Solo Admin puede ver aprobaciones
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
    staleTime: 10 * 1000,
    select: (data) => {
      // Extraer el array del objeto data (sin filtrar, el backend filtra por status)
      const approvalsArray = Array.isArray(data) ? data : data.data || [];
      return approvalsArray;
    }
  });
}

export function useUpdateApproval() {
  return async (approvalId: string, status: 'APPROVED' | 'REJECTED', approvedPrice?: number) => {
    const { data } = await api.patch(`/api/prices/approvals/${approvalId}`, {
      status,
      approvedPrice
    });
    return data;
  };
}
