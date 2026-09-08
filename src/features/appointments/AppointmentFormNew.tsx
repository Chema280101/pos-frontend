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
import { Select, Input, Textarea } from '@/components/ui';
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
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit-sm shrink-0">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                  Nuevo
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--unit-text)]">
                Nueva Cita
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[var(--unit-text-muted)] mt-0.5">
                Sistema de Citas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/appointments')}
            className="self-start sm:self-auto px-5 py-2 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] shadow-sm transition-all flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        </div>

        {/* Enhanced Form Container */}
        <div className="space-y-6">
          <div className="rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 backdrop-blur-md p-6 space-y-4">
            {/* Form Header */}
            <div className="flex items-center gap-2 text-[var(--unit-accent)] border-b border-[var(--unit-border)]/30 pb-3">
              <Calendar className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                Información de la cita
              </h2>
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
                  <div className="flex items-center justify-between p-3 rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface-elevated)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-unit bg-[var(--unit-accent)]/10 border border-[var(--unit-accent)]/20 text-[var(--unit-accent)]">
                        <User className="h-4 w-4" />
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/10 rounded-unit transition-colors"
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
                        className="w-full rounded-unit border border-[var(--unit-border)]/60 pl-11 pr-4 py-2.5 text-sm text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                      />
                    </div>
                    
                    {/* Premium Dropdown */}
                    {showClientDropdown && (
                      <ul className="absolute z-50 mt-2 max-h-48 w-full overflow-auto rounded-unit border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg text-[var(--unit-text)] py-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  label="Fecha *"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  leftIcon={<Calendar className="h-4 w-4" />}
                />
              </div>
              <div>
                <Input
                  type="time"
                  label="Hora *"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  leftIcon={<Clock className="h-4 w-4" />}
                />
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
            <div className="rounded-unit border-2 border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
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
            <Textarea
              label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ej: Cliente prefiere horario matutino, alérgico a ciertos productos, etc."
            />
          </div>

          {/* Action Bar */}
          <div className="flex gap-4 pt-4 mt-6 border-t border-[var(--unit-border)]/40">
            <button
              type="button"
              onClick={() => router.push('/appointments')}
              className="px-6 py-2.5 rounded-full font-bold text-[var(--unit-text-muted)] hover:text-[var(--unit-text)] bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] border border-[var(--unit-border)]/60 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <Button
              type="button"
              onClick={() => {
                if (!canSubmit) {
                  return;
                }
                createMutation.mutate();
              }}
              disabled={!canSubmit || createMutation.isPending}
              isLoading={createMutation.isPending}
              variant="primary"
              className="flex-1 py-2.5 rounded-full font-bold shadow-unit-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Crear Cita
            </Button>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-unit-lg border border-[var(--unit-border)]/40 bg-[var(--unit-surface)] shadow-unit-lg p-6">
            <h2 className="mb-4 text-xl font-bold text-[var(--unit-text)] flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--unit-accent)]" />
              Crear nuevo cliente
            </h2>
            <div className="space-y-4">
              <Input
                label="Nombre *"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                autoFocus
              />
              <Input
                label="Teléfono *"
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />
              
              <div className="flex gap-3 pt-4 mt-2 border-t border-[var(--unit-border)]/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClientForm(false);
                    setNewClientName('');
                    setNewClientPhone('');
                    setNewClientEmail('');
                  }}
                  className="flex-1 px-4 py-2 rounded-full border border-[var(--unit-border)]/60 text-sm font-bold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => createClientMutation.mutate()}
                  disabled={!newClientName.trim() || !newClientPhone.trim() || createClientMutation.isPending}
                  isLoading={createClientMutation.isPending}
                  className="flex-1 py-2 rounded-full font-bold shadow-unit-sm"
                >
                  Crear cliente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Success Message Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-unit shadow-unit border-2 border-green-400/50 backdrop-blur-sm">
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
