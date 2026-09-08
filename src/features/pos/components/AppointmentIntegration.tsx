'use client';

import { useState } from 'react';
import { Calendar, Clock, User, DollarSign, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CartItem, BusinessUnit } from '@/types/pos';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  employee: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    price: number | string;
    durationMin: number;
  };
  saleId?: string | null;
}

interface AppointmentIntegrationProps {
  unit: BusinessUnit;
  onConvertToSale: (appointment: Appointment) => void;
  onAddServiceToCart: (service: any, employeeId: string) => void;
}

export function AppointmentIntegration({ 
  unit, 
  onConvertToSale, 
  onAddServiceToCart 
}: AppointmentIntegrationProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Obtener citas del día
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments-for-pos', unit],
    queryFn: async (): Promise<Appointment[]> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data } = await api.get(`/api/appointments`, {
        params: {
          unit,
          start: today.toISOString(),
          end: tomorrow.toISOString(),
          status: 'SCHEDULED,IN_PROGRESS'
        }
      });
      
      return data.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000 // 5 minutos
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-[var(--unit-text)] border-[var(--unit-border)]/60';
      default: return 'bg-gray-100 text-[var(--unit-text)] border-[var(--unit-border)]/60';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Programada';
      case 'IN_PROGRESS': return 'En curso';
      case 'COMPLETED': return 'Completada';
      default: return status;
    }
  };

  const canConvertToSale = (appointment: Appointment) => {
    return !appointment.saleId && appointment.status !== 'COMPLETED';
  };

  const canAddToCart = (appointment: Appointment) => {
    return appointment.status === 'IN_PROGRESS' && !appointment.saleId;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-blue-500/10">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--unit-text)]">Citas del Día</h3>
          <p className="text-sm text-[var(--unit-text-muted)]">
            Convierte citas en ventas o agrega servicios al carrito
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="relative">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-blue-500/20"></div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {!isLoading && appointments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-sm text-[var(--unit-text-muted)]">Sin citas para hoy</p>
          <p className="text-xs text-[var(--unit-text-muted)] mt-1">
            No hay citas programadas para esta unidad
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="relative overflow-hidden rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)] p-4 transition-all hover:shadow-unit hover:scale-[1.01]"
            >
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                  getStatusColor(appointment.status)
                )}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>

              {/* Appointment Info */}
              <div className="space-y-3">
                {/* Time and Customer */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--unit-text)]">
                        {formatTime(appointment.startTime)}
                      </span>
                      <span className="text-xs text-[var(--unit-text-muted)]">-</span>
                      <span className="text-sm font-semibold text-[var(--unit-text)]">
                        {formatTime(appointment.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-[var(--unit-text-muted)]" />
                      <span className="text-sm text-[var(--unit-text)]">
                        {appointment.customer.name}
                      </span>
                      {appointment.customer.phone && (
                        <span className="text-xs text-[var(--unit-text-muted)]">
                          • {appointment.customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service and Employee */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-green-500/10">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--unit-text)]">
                      {appointment.service.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--unit-text-muted)]">
                        Con: {appointment.employee.name}
                      </span>
                      <span className="text-xs text-[var(--unit-text-muted)]">
                        • {appointment.service.durationMin} min
                      </span>
                      <span className="text-xs font-semibold text-green-600">
                        • S/ {typeof appointment.service.price === 'number' 
                          ? appointment.service.price.toFixed(2) 
                          : Number(appointment.service.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sale Status */}
                {appointment.saleId && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-unit p-2">
                    <p className="text-xs text-emerald-800">
                      ✅ Ya tiene una venta asociada
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {canConvertToSale(appointment) && (
                    <button
                      type="button"
                      onClick={() => onConvertToSale(appointment)}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-unit hover:from-blue-600 hover:to-blue-700 transition-all shadow-unit-sm hover:shadow-unit"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Convertir a Venta
                    </button>
                  )}
                  
                  {canAddToCart(appointment) && (
                    <button
                      type="button"
                      onClick={() => onAddServiceToCart(appointment.service, appointment.employee.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-unit hover:from-green-600 hover:to-green-700 transition-all shadow-unit-sm hover:shadow-unit"
                    >
                      <DollarSign className="h-3 w-3" />
                      Agregar al Carrito
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-unit p-3 mt-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Cómo funciona:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Convertir a Venta:</strong> Crea una venta automáticamente con el servicio de la cita</li>
          <li>• <strong>Agregar al Carrito:</strong> Añade el servicio al carrito actual (para citas en curso)</li>
          <li>• Las citas completadas o con venta asociada no se pueden convertir</li>
        </ul>
      </div>
    </div>
  );
}
