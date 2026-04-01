import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';

interface ApprovalData {
  id: string;
  serviceId: string;
  requestedPrice: number;
  status: string;
  service: {
    name: string;
    priceType: string;
  };
  requestedBy: {
    id: string;
    name: string;
    role: string;
  };
}

interface SocketApprovalData {
  approval: ApprovalData;
  requestedBy?: {
    id: string;
    name: string;
    role: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: string;
}

export function useSocket() {
  const { user, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !accessToken) {
      // Desconectar si no hay usuario o token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Evitar múltiples conexiones
    if (socketRef.current?.connected) {
      return;
    }

    // Importar y conectar Socket.io
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
          auth: {
            token: `Bearer ${accessToken}`
          },
          transports: ['polling', 'websocket']
        });

        socketRef.current = socket;

        // Eventos de conexión
        socket.on('connect', () => {
          // Conectado a Socket.io
        });

        socket.on('authenticated', (data: any) => {
          // Autenticado en Socket.io
        });

        socket.on('disconnect', (reason: any) => {
          // Desconectado de Socket.io
        });

        // Eventos de aprobaciones
        socket.on('new_approval_request', (data: SocketApprovalData) => {
          // Nueva solicitud de aprobación
          
          // Invalidar query de aprobaciones para refrescar
          queryClient.invalidateQueries({ queryKey: ['price-approvals'] });
          
          // También invalidar query de notificaciones
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        socket.on('approval_updated', (data: SocketApprovalData) => {
          // Aprobación actualizada
          
          // Invalidar query de aprobaciones para refrescar
          queryClient.invalidateQueries({ queryKey: ['price-approvals'] });
          
          // También invalidar query de notificaciones
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        socket.on('my_approval_updated', (data: SocketApprovalData) => {
          // Mi aprobación fue actualizada
          
          // Mostrar notificación al usuario que solicitó
          // Aquí podrías usar un toast o notificación local
          if (data.approval.status === 'APPROVED') {
            // Tu solicitud fue aprobada
          } else if (data.approval.status === 'REJECTED') {
            // Tu solicitud fue rechazada
          }
        });

        // Manejar errores
        socket.on('error', (error: any) => {
          // Error en Socket.io
        });

      } catch (error) {
        // Error inicializando Socket.io
      }
    };

    initSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, accessToken, queryClient]);

  return socketRef.current;
}
