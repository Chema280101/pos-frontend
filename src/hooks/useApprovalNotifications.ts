import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export function useApprovalNotifications() {
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.add);

  console.log('🔔 useApprovalNotifications - User:', user?.role, user?.name);

  // Solo verificar si es Admin
  const { data: approvals, refetch, error } = useQuery({
    queryKey: ['price-approvals-check'],
    queryFn: async () => {
      console.log('🔔 Fetching approvals...');
      const { data } = await api.get('/api/prices/approvals');
      console.log('🔔 Approvals response:', data);
      return data;
    },
    enabled: user?.role === 'ADMIN',
    refetchInterval: 30 * 1000, // Verificar cada 30 segundos
    staleTime: 10 * 1000,
  });

  if (error) {
    console.error('🔔 Error fetching approvals:', error);
  }

  useEffect(() => {
    console.log('🔔 useEffect - approvals:', approvals, 'user:', user?.role);

    if (!approvals || !user || user.role !== 'ADMIN') {
      console.log('🔔 Skipping - missing data or not admin');
      return;
    }

    // Las aprobaciones vienen en approvals.data
    const approvalsArray = Array.isArray(approvals) ? approvals : approvals.data || [];
    console.log('🔔 approvalsArray:', approvalsArray);

    // Obtener aprobaciones pendientes
    const pendingApprovals = approvalsArray.filter((a: any) => a.status === 'PENDING');
    console.log('🔔 pendingApprovals:', pendingApprovals);

    // Crear notificaciones para aprobaciones nuevas (no leídas)
    pendingApprovals.forEach((approval: any) => {
      console.log('🔔 Processing approval:', approval.id);

      // Verificar si ya existe una notificación para esta aprobación
      const existingNotif = useNotificationStore.getState().items.find(
        (n) => n.type === 'approval' && n.message.includes(approval.id)
      );

      if (!existingNotif) {
        console.log('🔔 Adding notification for approval:', approval.id);
        addNotification({
          type: 'approval',
          title: 'Nueva Solicitud de Aprobación',
          message: `Solicitud de S/ ${approval.requestedPrice} para "${approval.service.name}" por ${approval.requestedBy.name}`,
          link: '/approvals',
          linkLabel: 'Ver Aprobaciones'
        });
      } else {
        console.log('🔔 Notification already exists for approval:', approval.id);
      }
    });
  }, [approvals, user, addNotification]);
}
