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
          console.log('🔌 Socket.io conectado:', socket.id);
          console.log('👤 Usuario:', user?.email, 'Rol:', user?.role);
        });

        socket.on('authenticated', (data: any) => {
          console.log('✅ Socket.io autenticado:', data);
        });

        socket.on('disconnect', (reason: any) => {
          console.log('❌ Socket.io desconectado:', reason);
        });

        // Eventos de aprobaciones
        socket.on('new_approval_request', (data: SocketApprovalData) => {
          // Nueva solicitud de aprobación
          console.log('🔔 Nueva solicitud de aprobación recibida:', data);
          
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
          console.log('🔔 Mi aprobación actualizada:', data);
          
          // Mostrar notificación al usuario que solicitó
          if (data.approval.status === 'APPROVED') {
            // Tu solicitud fue aprobada
            console.log('✅ Solicitud aprobada:', data.approval);
            
            // Invalidar queries para actualizar el carrito
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['price-approvals'] });
            
            // Emitir evento personalizado para actualizar el carrito
            window.dispatchEvent(new CustomEvent('approval_updated', { 
              detail: { approval: data.approval } 
            }));
            
            // Mostrar toast de éxito (opcional - necesitarías useToast)
            // success('¡Tu solicitud de precio fue aprobada!');
          } else if (data.approval.status === 'REJECTED') {
            // Tu solicitud fue rechazada
            console.log('❌ Solicitud rechazada:', data.approval);
            
            // Invalidar queries para actualizar el carrito
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['price-approvals'] });
            
            // Emitir evento personalizado para actualizar el carrito
            window.dispatchEvent(new CustomEvent('approval_updated', { 
              detail: { approval: data.approval } 
            }));
            
            // Mostrar toast de rechazo (opcional - necesitarías useToast)
            // error('Tu solicitud de precio fue rechazada');
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
