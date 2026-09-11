import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export function useApprovalNotifications() {
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.add);

  // Solo verificar si es Admin
  const { data: approvals } = useQuery({
    queryKey: ['price-approvals-check'],
    queryFn: async () => {
      const { data } = await api.get('/api/prices/approvals');
      return data;
    },
    enabled: user?.role === 'ADMIN',
    refetchInterval: 30 * 1000, // Verificar cada 30 segundos
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    if (!approvals || !user || user.role !== 'ADMIN') return;

    // Las aprobaciones vienen en approvals.data
    const approvalsArray = Array.isArray(approvals) ? approvals : approvals.data || [];
    
    // Obtener aprobaciones pendientes
    const pendingApprovals = approvalsArray.filter((a: any) => a.status === 'PENDING');
    
    // Crear notificaciones para aprobaciones nuevas (no leídas)
    pendingApprovals.forEach((approval: any) => {
      // Verificar si ya existe una notificación para esta aprobación
      const existingNotif = useNotificationStore.getState().items.find(
        (n) => n.type === 'approval' && n.message.includes(approval.id)
      );
      
      if (!existingNotif) {
        addNotification({
          type: 'approval',
          title: 'Nueva Solicitud de Aprobación',
          message: `Solicitud de S/ ${approval.requestedPrice} para "${approval.service.name}" por ${approval.requestedBy.name}`,
          link: '/approvals',
          linkLabel: 'Ver Aprobaciones'
        });
      }
    });
  }, [approvals, user, addNotification]);
}
