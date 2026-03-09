'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, User, X, Search, Plus, Calendar, Clock, Scissors } from 'lucide-react';
import { api } from '@/lib/api';
import { useUnitStore } from '@/store/unitStore';
import { 
  type AppointmentFormCustomer, 
  type AppointmentFormService, 
  type AppointmentFormUser,
  type CreateAppointmentItem 
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

  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const defaultTime = '10:00';

  const [unit, setUnit] = useState<'SPA' | 'BARBERIA'>(activeUnit === 'BARBERIA' ? 'BARBERIA' : 'SPA');
  const [customerId, setCustomerId] = useState('');
  const [customerDisplay, setCustomerDisplay] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [serviceId, setServiceId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read URL parameters and set initial values
  useEffect(() => {
    const urlEmployeeId = searchParams.get('employeeId');
    const urlUnit = searchParams.get('unit') as 'SPA' | 'BARBERIA' | null;
    const urlStart = searchParams.get('start');

    if (urlEmployeeId) {
      setEmployeeId(urlEmployeeId);
    }

    if (urlUnit) {
      setUnit(urlUnit);
    }

    if (urlStart) {
      const startDate = new Date(urlStart);
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

  const { data: employeesResponse } = useQuery({
    queryKey: ['users', 'employees', unit],
    queryFn: async () => {
      const { data } = await api.get(`/api/users?unit=${unit}`);
      return data;
    },
  });
  const allEmployees = employeesResponse?.data ?? [];
  const employees = allEmployees.filter((u: any) => 
    u.role === 'BARBER' || u.role === 'SPA_SPECIALIST'
  );
  
  console.log('👥 Employees loaded:', {
    unit,
    allEmployees: allEmployees.length,
    filteredEmployees: employees.length,
    employees: employees.map((e: any) => ({ id: e.id, name: e.name, role: e.role }))
  });

  const handleSelectCustomer = useCallback((c: AppointmentFormCustomer) => {
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

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AppointmentFormCustomer>('/api/clients', {
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        email: newClientEmail.trim() || undefined,
        unit,
      });
      return data;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients-search'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
      console.log('📅 Creating appointment with data:', {
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
      
      console.log('✅ Appointment created successfully:', result.data);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 onSuccess triggered, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Emit custom event for real-time updates
      window.dispatchEvent(new CustomEvent('appointment:created', {
        detail: { appointment: data.data }
      }));
      
      router.push('/appointments');
    },
    onError: (error) => {
      console.error('❌ Error creating appointment:', error);
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
              <div>
                <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Unidad *</label>
                <select
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value as 'SPA' | 'BARBERIA');
                    setCustomerId('');
                    setCustomerDisplay('');
                    setClientSearch('');
                  }}
                  className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
                >
                  <option value="SPA">SPA</option>
                  <option value="BARBERIA">Barbería</option>
                </select>
              </div>

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
                                {searchResults.map((c: AppointmentFormCustomer) => (
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
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Servicio *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Scissors className="h-5 w-5 text-[var(--unit-text-muted)]" />
              </div>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all appearance-none cursor-pointer"
              >
                <option value="">Seleccionar servicio...</option>
                {servicesForUnit.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMin} min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">
              Empleado *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[var(--unit-text-muted)]" />
              </div>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all appearance-none cursor-pointer"
              >
                <option value="">Seleccionar empleado...</option>
                {employees.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
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
              placeholder="Añade notas adicionales sobre la cita..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => {
              console.log('🔘 Submit button clicked');
              console.log('📊 Form data:', { customerId, date, time, serviceId, employeeId, unit, canSubmit });
              if (!canSubmit) {
                console.log('❌ Cannot submit - missing required fields');
                return;
              }
              console.log('✅ All fields valid, creating appointment...');
              createMutation.mutate();
            }}
            disabled={!canSubmit || createMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando cita...
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                Crear cita
              </>
            )}
          </button>
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
        </div>
      </div>
    </div>
  );
}
