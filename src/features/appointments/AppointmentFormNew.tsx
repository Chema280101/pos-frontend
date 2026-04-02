'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, setHours, setMinutes, isBefore } from 'date-fns';
import { toPeruTime, getStartOfPeruDay } from '@/utils/peruTime';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, User, X, Search, Plus, Calendar, Clock, Scissors } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { useAuthStore } from '@/store/authStore';
import { Select } from '@/components/ui';
import { useCrossTabSync } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { 
  type CreateAppointmentInput,
  type Appointment,
  type BusinessUnit 
} from '@/types/appointment';

const DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function AppointmentFormNew(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const activeUnit = useUnitStore((s) => s.activeUnit);
  const { user } = useAuthStore(); // ✅ Obtener usuario autenticado

  const today = toPeruTime(new Date());
  const defaultDate = today.toISOString().slice(0, 10);
  const defaultTime = '10:00';

  // ✅ Para RECEPTIONIST, usar su unidad asignada. Para ADMIN, usar activeUnit o URL.
  const getUnitForEmployeeQuery = () => {
    if (user?.role === 'RECEPTIONIST') {
      return user.unit || 'SPA'; // Unidad asignada al cajero
    }
    // Para ADMIN, usar la unidad de la URL o la unidad activa
    return activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA';
  };

  const unitForEmployees = getUnitForEmployeeQuery();
  
  const [unit, setUnit] = useState<'SPA' | 'BARBERIA'>(unitForEmployees);
  const [customerId, setCustomerId] = useState('');
  const [customerDisplay, setCustomerDisplay] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [serviceId, setServiceId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const { success } = useToast();
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Success confirmation state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // ✅ Estado para advertencia de cruce de medianoche
  const [crossesMidnight, setCrossesMidnight] = useState(false);
  const [showMidnightWarning, setShowMidnightWarning] = useState(false);

  // Read URL parameters and set initial values
  useEffect(() => {
    if (!searchParams) return;
    
    const urlEmployeeId = searchParams.get('employeeId');
    const urlUnit = searchParams.get('unit') as 'SPA' | 'BARBERIA' | null;
    const urlStart = searchParams.get('start');

    // 🔍 DEBUG: Log de parámetros URL
    console.log('🔍 DEBUG - Parámetros URL:', {
      urlEmployeeId,
      urlUnit,
      urlStart,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (urlEmployeeId) {
      setEmployeeId(urlEmployeeId);
      console.log('✅ EmployeeId establecido desde URL:', urlEmployeeId);
    }

    if (urlUnit) {
      setUnit(urlUnit);
    }

    if (urlStart) {
      const startDate = toPeruTime(new Date(urlStart));
      const dateStr = startDate.toISOString().slice(0, 10);
      const timeStr = startDate.toTimeString().slice(0, 5);
      setDate(dateStr);
      setTime(timeStr);
    }
  }, [searchParams]);

  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const debouncedCustomerSearch = useDebouncedValue(clientSearch, DEBOUNCE_MS);
  
  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['customers', 'search', debouncedCustomerSearch],
    queryFn: async () => {
      if (!debouncedCustomerSearch.trim()) return { data: [] };
      const { data } = await api.get(`/api/clients?search=${encodeURIComponent(debouncedCustomerSearch)}&limit=10`);
      return data;
    },
    enabled: debouncedCustomerSearch.trim().length >= 2,
  });
  const customers = customersResponse?.data ?? [];
  const searchResults = customers;

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', 'unit', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/services?unit=${unit}`);
      return data;
    },
  });
  const servicesForUnit = servicesResponse?.data ?? [];

  const { data: employeesResponse, isLoading: employeesLoading } = useQuery({
    queryKey: ['users', 'employees', unitForEmployees],
    queryFn: async () => {
      try {
        // 🔍 DEBUG: Log de la petición
        console.log('🔍 DEBUG - Haciendo petición a:', `/api/users/employees?unit=${unitForEmployees}`);
        
        // ✅ Usar endpoint específico para empleados que no requiere rol ADMIN
        const { data } = await api.get(`/api/users/employees?unit=${unitForEmployees}`);
        
        // 🔍 DEBUG: Log de la respuesta
        console.log('🔍 DEBUG - Respuesta recibida:', data);
        
        return data;
      } catch (error) {
        console.error('❌ Error cargando empleados:', error);
        throw error;
      }
    },
  });
  const allEmployees = employeesResponse ?? [];  // ✅ Acceder directamente a la respuesta
  
  // Hook para sincronización entre pestañas
  const { invalidateAcrossTabs } = useCrossTabSync();
  const employees = allEmployees.filter((u: any) => 
    u.role === 'BARBER' || u.role === 'SPA_SPECIALIST'
  );

  // 🔍 DEBUG: Log de empleados disponibles
  console.log('🔍 DEBUG - Empleados disponibles:', {
    userUnit: user?.unit,
    userRole: user?.role,
    unitForEmployees,
    totalEmployees: allEmployees.length,
    filteredEmployees: employees.length,
    allEmployees: allEmployees.map((e: any) => ({ id: e.id, name: e.name, role: e.role, unit: e.unit })),
    filteredEmployeesList: employees.map((e: any) => ({ id: e.id, name: e.name, role: e.role, unit: e.unit }))
  });

  const handleSelectCustomer = useCallback((c: any) => {
    setCustomerId(c.id);
    setCustomerDisplay(`${c.name} – ${c.phone}`);
    setClientSearch('');
    setShowClientDropdown(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Validación para detectar cruce de medianoche
  useEffect(() => {
    if (!date || !time || !serviceId) {
      setCrossesMidnight(false);
      setShowMidnightWarning(false);
      return;
    }

    const selectedService = servicesForUnit.find((s: any) => s.id === serviceId);
    const duration = selectedService?.durationMin ?? 30;
    
    const startTime = toPeruTime(new Date(`${date}T${time}`));
    const endTime = toPeruTime(new Date(startTime.getTime() + duration * 60 * 1000));
    
    // Verificar si la cita cruza medianoche (diferente día)
    const crosses = endTime.getDate() !== startTime.getDate() || 
                   endTime.getMonth() !== startTime.getMonth() ||
                   endTime.getFullYear() !== startTime.getFullYear();
    
    setCrossesMidnight(crosses);
    
    // Mostrar advertencia solo si cruza medianoche
    if (crosses) {
      setShowMidnightWarning(true);
    } else {
      setShowMidnightWarning(false);
    }
  }, [date, time, serviceId, servicesForUnit]);

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<any>('/api/clients', {
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        email: newClientEmail.trim() || undefined,
        unit,
      });
      return data;
    },
    onSuccess: (newClient) => {
      // ✅ Invalidar en todas las pestañas
      invalidateAcrossTabs(['clients-search', 'clients']);
      
      handleSelectCustomer(newClient);
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const startTime = new Date(`${date}T${time}`);
      
      const result = await api.post('/api/appointments', {
        unit,
        customerId,
        startTime: startTime.toISOString(),
        items: [
          {
            serviceId,
            employeeId,
            durationMin: servicesForUnit.find((s: any) => s.id === serviceId)?.durationMin ?? 30,
          },
        ],
        notes: notes.trim() || undefined,
      });
      
      return result;
    },
    onSuccess: (data) => {
      // ✅ Invalidar en todas las pestañas
      invalidateAcrossTabs(['appointments']);
      success('Cita creada exitosamente');
      
      // Emit custom event for real-time updates
      window.dispatchEvent(new CustomEvent('appointment:created', {
        detail: { appointment: data.data }
      }));
      
      setTimeout(() => {
        router.replace('/appointments');
      }, 1500);
    },
    onError: (error) => {
      // Error silencioso para mantener console limpio
    },
  });

  const canSubmit = customerId && date && time && serviceId && employeeId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-2xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
            <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
            <span className="text-sm font-medium text-[var(--unit-text)">
              Sistema de Citas
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Nueva Cita</h1>
          <p className="text-[var(--unit-text-muted)]">
            Programa un nuevo servicio
          </p>
        </div>

        {/* Enhanced Back Link */}
        <div className="mb-6">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/50 text-[var(--unit-accent)] font-medium bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a Agenda
          </Link>
        </div>

        {/* Enhanced Form Container */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
            {/* Form Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--unit-text)]">Información de la cita</h2>
                  <p className="text-sm text-[var(--unit-text-muted)]">Completa todos los campos requeridos</p>
                </div>
              </div>
            </div>

            {/* Enhanced Form Content */}
            <div className="p-6 space-y-6">
            {/* Enhanced Unit Field */}
              <Select
                label="Unidad *"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value as 'SPA' | 'BARBERIA');
                  setCustomerId('');
                  setCustomerDisplay('');
                  setClientSearch('');
                }}
                options={[
                  { value: 'SPA', label: 'SPA' },
                  { value: 'BARBERIA', label: 'Barbería' }
                ]}
              />

          {/* Enhanced Client Field */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Cliente *</label>
                {customerId ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                        <User className="h-4 w-4 text-[var(--unit-accent)]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--unit-text)]">{customerDisplay}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerId('');
                        setCustomerDisplay('');
                        setClientSearch('');
                        setShowClientDropdown(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10 rounded-xl transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                      </div>
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Buscar por nombre o teléfono (mín. 2 caracteres)"
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                      />
                    </div>
                    
                    {/* Premium Dropdown */}
                    {showClientDropdown && (
                      <ul className="absolute z-50 mt-2 max-h-48 w-full overflow-auto rounded-xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl text-[var(--unit-text)] py-2">
                        {isLoading ? (
                          <li className="px-4 py-3 text-sm text-[var(--unit-text-muted)] flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--unit-accent)]"></div>
                            Buscando...
                          </li>
                        ) : debouncedCustomerSearch.length >= 2 ? (
                          <>
                            {searchResults.length === 0 ? (
                              <>
                                <li className="px-4 py-3 text-sm text-[var(--unit-text-muted)]">
                                  No se encontraron clientes
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                      setShowNewClientForm(true);
                                      setShowClientDropdown(false);
                                      setNewClientName(clientSearch.trim());
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Crear nuevo cliente "{clientSearch.trim()}"
                                  </button>
                                </li>
                              </>
                            ) : (
                              <>
                                {searchResults.map((c: any) => (
                                  <li key={c.id}>
                                    <button
                                      type="button"
                                      className="w-full px-4 py-3 text-left text-sm text-[var(--unit-text)] hover:bg-[var(--unit-accent)]/10 transition-colors"
                                      onClick={() => handleSelectCustomer(c)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-[var(--unit-text-muted)]" />
                                        <span>{c.name}</span>
                                        <span className="text-[var(--unit-text-muted)]">– {c.phone}</span>
                                      </div>
                                    </button>
                                  </li>
                                ))}
                                <li className="border-t border-[var(--unit-border)]/50 mt-2 pt-2">
                                  <button
                                    type="button"
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10 transition-colors flex items-center gap-2"
                                    onClick={() => {
                                      setShowNewClientForm(true);
                                      setShowClientDropdown(false);
                                      setNewClientName(clientSearch.trim());
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Crear nuevo cliente "{clientSearch.trim()}"
                                  </button>
                                </li>
                              </>
                            )}
                          </>
                        ) : (
                          <li className="px-4 py-3 text-sm text-[var(--unit-text-muted)]/70">
                            Escribe al menos 2 caracteres para buscar
                          </li>
                        )}
                      </ul>
                    )}
                  </>
                )}
              </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
                  Fecha *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-[var(--unit-text-muted)]" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
                  Hora *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-[var(--unit-text-muted)]" />
                  </div>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                  />
                </div>
              </div>
            </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Select
              label="Servicio *"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar servicio...', disabled: true },
                ...servicesForUnit.map((s: any) => ({
                  value: s.id,
                  label: `${s.name} (${s.durationMin} min)`
                }))
              ]}
              className="pl-12"
            />
          </div>

          {/* ✅ Advertencia de cruce de medianoche */}
          {showMidnightWarning && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800">
                  Esta cita cruza la medianoche
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  La cita finalizará después de medianoche. Se mostrará correctamente en el calendario extendido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMidnightWarning(false)}
                className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-2">
            <Select
              label="Empleado *"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar empleado...', disabled: true },
                ...employees.map((u: any) => ({
                  value: u.id,
                  label: u.name
                }))
              ]}
              className="pl-12"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all resize-none"
              rows={3}
              placeholder="Ej: Cliente prefiere horario matutino, alérgico a ciertos productos, etc."
            />
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={() => {
              if (!canSubmit) {
                return;
              }
              createMutation.mutate();
            }}
            disabled={!canSubmit || createMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            isLoading={createMutation.isPending}
          >
            <Calendar className="h-5 w-5" />
            Crear cita
          </Button>
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--unit-border)] bg-[var(--unit-surface-elevated)] p-6">
            <h2 className="mb-4 text-xl font-semibold text-[var(--unit-text)]">Crear nuevo cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--unit-text)]">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[var(--unit-text)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--unit-text)]">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[var(--unit-text)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--unit-text)]">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[var(--unit-text)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClientForm(false);
                    setNewClientName('');
                    setNewClientPhone('');
                    setNewClientEmail('');
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-[var(--unit-text)] hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => createClientMutation.mutate()}
                  disabled={!newClientName.trim() || !newClientPhone.trim() || createClientMutation.isPending}
                  className="flex-1 rounded-lg bg-[var(--unit-accent)] px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                  {createClientMutation.isPending ? 'Creando...' : 'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Success Message Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg border-2 border-green-400/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
