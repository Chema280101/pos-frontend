'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UsersMetrics } from './UsersMetrics';
import { format } from 'date-fns';
import { t, getPlaceholder } from '@/lib/uiTranslations';
import { Plus, Lock, RotateCcw, User as UserIcon, AlertTriangle, Eye, Edit, Trash2, AlertCircle, Users, Filter, ChevronDown, ChevronUp, X, Package, BarChart3, Clock, CheckCircle2, Building2, Calendar, TrendingUp, Activity, Shield, Key, UserCheck, UserX, Settings, Search } from 'lucide-react';
import type { UserRole, BusinessUnit, getRoleLabel, getStatusLabel } from '@/types/auth';
import type { User, PaginatedUsersResponse } from '@/types/users';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { getRoleLabel as getRoleLabelCentral, getUnitLabel } from '@/lib/translations';
import { useAuthStore } from '@/store/authStore';
import { useUnitStore } from '@/store/unitStore';

interface UserRow extends User {}

export function UsersPage(): JSX.Element {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  
  // ✅ Obtener contexto de usuario para query keys específicas
  const user = useAuthStore((s) => s.user);
  const activeUnit = useUnitStore((s) => s.activeUnit);
  
  // Debounce hook para búsqueda
  function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }
  
  const debouncedSearchFilter = useDebouncedValue(searchFilter.trim(), 300);

  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const [unlockUser, setUnlockUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [forceTemp, setForceTemp] = useState(false);

  // Reset page when filters change (except searchFilter to avoid unwanted behavior)
  useEffect(() => {
    setPage(1);
  }, [roleFilter, isActiveFilter, unitFilter]); // Removed searchFilter dependency

  // ✅ MEJORADO: Build query parameters for backend
  const queryParams = useMemo(() => {
    const params: any = {
      page: page.toString(),
      limit: limit.toString(),
    };
    
    if (roleFilter) params.role = roleFilter;
    if (isActiveFilter) {
      if (isActiveFilter === 'ACTIVE') {
        params.isActive = 'true';
        params.isLocked = 'false';
      } else if (isActiveFilter === 'INACTIVE') {
        params.isActive = 'false';
        params.isLocked = 'false';
      } else if (isActiveFilter === 'LOCKED') {
        params.isActive = 'true';
        params.isLocked = 'true';
      }
    }
    if (unitFilter) params.unit = unitFilter;
    if (debouncedSearchFilter) params.search = debouncedSearchFilter;
    
    return params;
  }, [page, limit, roleFilter, isActiveFilter, unitFilter, debouncedSearchFilter]);

  // ✅ MEJORADO: Use new paginated endpoint con caching específico por usuario/rol
  const { data: usersData, isLoading } = useQuery({
    // ✅ Query key específica por rol y unidad para evitar caché entre sesiones
    queryKey: ['users', { 
      role: user?.role, 
      unit: user?.unit || activeUnit, 
      userId: user?.id 
    }, queryParams],
    queryFn: async () => {
      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await api.get(`/api/users?${queryString}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    // ✅ Solo ejecutar si hay usuario autenticado
    enabled: !!user,
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  // Reset page when filters change (except searchFilter to avoid unwanted behavior)
  useEffect(() => {
    setPage(1);
  }, [roleFilter, isActiveFilter, unitFilter]); // Removed searchFilter dependency

  // Debug: Log searchFilter changes to identify unwanted modifications
  useEffect(() => {
    // 🔥 Alerta si el valor sospechoso aparece
    if (searchFilter === 'admin@barberiaspa.com') {
      // Alerta silenciosa para valor sospechoso
      return;
    }
  }, [searchFilter]);

  const unlockMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/api/users/${userId}/unlock`);
    },
    onSuccess: () => {
      // ✅ Invalidar queries específicas del usuario actual
      queryClient.invalidateQueries({ 
        queryKey: ['users', { 
          role: user?.role, 
          unit: user?.unit || activeUnit, 
          userId: user?.id 
        }] 
      });
      setUnlockUser(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async ({ userId, newPassword: pwd, forceTemp: temp }: { userId: string; newPassword: string; forceTemp: boolean }) => {
      await api.post(`/api/users/${userId}/reset-password`, { newPassword: pwd, forceTemp: temp });
    },
    onSuccess: () => {
      // ✅ Invalidar queries específicas del usuario actual
      queryClient.invalidateQueries({ 
        queryKey: ['users', { 
          role: user?.role, 
          unit: user?.unit || activeUnit, 
          userId: user?.id 
        }] 
      });
      setResetUser(null);
      setNewPassword('');
      setForceTemp(false);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role,
        phone: data.phone?.trim() || undefined,
        unit: data.unit,
        commissionPct: data.commissionPct ? parseFloat(data.commissionPct) : null,
      };
      const { data: result } = await api.post<UserRow>('/api/users', payload);
      return result;
    },
    onSuccess: () => {
      // ✅ Invalidar queries específicas del usuario actual
      queryClient.invalidateQueries({ 
        queryKey: ['users', { 
          role: user?.role, 
          unit: user?.unit || activeUnit, 
          userId: user?.id 
        }] 
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (userData: { id: string; name?: string; email?: string; role?: string; unit?: string | null; phone?: string; commissionPct?: number | null }) => {
      const { id, ...updateData } = userData;
      const payload = {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.email !== undefined && { email: updateData.email }),
        ...(updateData.role !== undefined && { role: updateData.role }),
        ...(updateData.unit !== undefined && { unit: updateData.unit }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.commissionPct !== undefined && { commissionPct: updateData.commissionPct }),
      };
      const { data } = await api.patch(`/api/users/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      // ✅ Invalidar queries específicas del usuario actual
      queryClient.invalidateQueries({ 
        queryKey: ['users', { 
          role: user?.role, 
          unit: user?.unit || activeUnit, 
          userId: user?.id 
        }] 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/users/${userId}`);
    },
    onSuccess: () => {
      // ✅ Invalidar queries específicas del usuario actual
      queryClient.invalidateQueries({ 
        queryKey: ['users', { 
          role: user?.role, 
          unit: user?.unit || activeUnit, 
          userId: user?.id 
        }] 
      });
      setDeleteUser(null);
    },
  });

  const handleUnlock = useCallback(() => {
    if (unlockUser) unlockMutation.mutate(unlockUser.id);
  }, [unlockUser, unlockMutation]);

  const handleResetSubmit = useCallback(() => {
    if (!resetUser || !newPassword.trim()) return;
    if (newPassword.length < 6) return;
    resetMutation.mutate({ userId: resetUser.id, newPassword: newPassword.trim(), forceTemp });
  }, [resetUser, newPassword, forceTemp, resetMutation, searchFilter]);

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    RECEPTIONIST: 'Recepcionista',
    SPA_SPECIALIST: 'Especialista SPA',
    BARBER: 'Barbero',
    BEAUTICIAN: 'Esteticista',
    MANAGER: 'Gerente',
  };

  // Define filters for DataTable
  const filters = [
    {
      key: 'showInactive',
      label: 'Mostrar inactivos',
      type: 'checkbox' as const,
    },
    {
      key: 'role',
      label: 'Rol',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Recepcionista', value: 'RECEPTIONIST' },
        { label: 'Especialista SPA', value: 'SPA_SPECIALIST' },
        { label: 'Barbero', value: 'BARBER' },
        { label: 'Esteticista', value: 'BEAUTICIAN' },
        { label: 'Gerente', value: 'MANAGER' },
      ],
    },
    {
      key: 'unit',
      label: 'Unidad',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'SPA', value: 'SPA' },
        { label: 'Barbería', value: 'BARBERIA' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: [
        { label: 'Todos', value: '' },
        { label: 'Activos', value: 'true' },
        { label: 'Inactivos', value: 'false' },
        { label: 'Bloqueados', value: 'locked' },
        { label: 'Requieren cambio de contraseña', value: 'MUST_CHANGE_PASSWORD' },
      ],
    },
    {
      key: 'hasPhone',
      label: 'Con teléfono',
      type: 'checkbox' as const,
    },
    {
      key: 'lockedUsers',
      label: 'Usuarios bloqueados',
      type: 'checkbox' as const,
    },
  ];

  // Define columns for DataTable
  const columns = [
    {
      key: 'name',
      header: 'Usuario',
      sortable: true,
      render: (row: UserRow) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--unit-text-muted)]">
              {row.name}
            </span>
            {row.isLocked && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
          </div>
          {row.phone && (
            <span className="font-medium text-[var(--unit-text-muted)]">
              {row.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row: UserRow) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
          {row.email}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      render: (row: UserRow) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.role === 'ADMIN'
            ? 'bg-red-100 text-red-800'
            : row.role === 'RECEPTIONIST'
            ? 'bg-blue-100 text-blue-800'
            : row.role === 'SPA_SPECIALIST'
            ? 'bg-green-100 text-green-800'
            : row.role === 'BARBER'
            ? 'bg-amber-100 text-amber-800'
            : row.role === 'BEAUTICIAN'
            ? 'bg-pink-100 text-pink-800'
            : row.role === 'MANAGER'
            ? 'bg-indigo-100 text-indigo-800'
            : 'bg-gray-100 text-gray-800'
        )}>
          {getRoleLabelCentral(row.role)}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      sortable: true,
      render: (row: UserRow) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          row.unit === 'SPA'
            ? 'bg-purple-100 text-purple-800'
            : row.unit === 'BARBERIA'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        )}>
          {getUnitLabel(row.unit || '') || 'Sin unidad'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (row: UserRow) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          !row.isActive
            ? 'bg-red-100 text-red-800'
            : row.isLocked
            ? 'bg-amber-100 text-amber-800'
            : row.mustChangePassword
            ? 'bg-cyan-100 text-cyan-800'
            : 'bg-green-100 text-green-800'
        )}>
          {!row.isActive
            ? 'Inactivo'
            : row.isLocked
            ? 'Bloqueado'
            : row.mustChangePassword
            ? 'Cambiar contraseña'
            : 'Activo'}
        </span>
      ),
    },
  ];

  // Define actions for DataTable
  const actions = [
    {
      label: t('view'),
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: UserRow) => setViewUser(row),
      className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
    },
    {
      label: t('edit'),
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: UserRow) => {
        router.push(`/users/${row.id}`);
      },
      className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
      disabled: (row: UserRow) => row.role === 'ADMIN', // Prevent editing admin users
    },
    {
      label: 'Desbloquear',
      icon: <Lock className="h-4 w-4" />,
      onClick: (row: UserRow) => setUnlockUser(row),
      className: 'text-[var(--unit-warning)] hover:bg-[var(--unit-warning)]/10',
      disabled: (row: UserRow) => !row.isLocked,
    },
    {
      label: 'Resetear contraseña',
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: (row: UserRow) => {
        setResetUser(row);
      },
      className: 'text-[var(--unit-primary)] hover:bg-[var(--unit-primary)]/10',
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: UserRow) => setDeleteUser(row),
      className: 'text-[var(--unit-error)] hover:bg-[var(--unit-error)]/10',
      disabled: (row: UserRow) => row.role === 'ADMIN', // Prevent deleting admin users
    },
  ];

  // Helper functions for custom filtering
  const getUserStatus = (user: UserRow) => {
    if (!user.isActive) return 'INACTIVE';
    if (user.isLocked) return 'LOCKED';
    if (user.mustChangePassword) return 'MUST_CHANGE_PASSWORD';
    return 'ACTIVE';
  };

  // Apply filters to users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user: any) => {
      // showInactive filter - only show active unless checked
      if (!user.isActive) {
        return false; // DataTable will handle this filter
      }

      return true; // DataTable will handle other filters
    });
  }, [users]);

  // Custom filter logic
  const customFilterLogic = (data: UserRow[], filterValues: Record<string, any>) => {
    return data.filter((user: UserRow) => {
      // showInactive filter
      if (filterValues.showInactive && !user.isActive) return false;
      if (!filterValues.showInactive && !user.isActive) return false;

      // role filter
      if (filterValues.role && user.role !== filterValues.role) return false;

      // unit filter
      if (filterValues.unit && user.unit !== filterValues.unit) return false;

      // status filter
      if (filterValues.status) {
        const status = getUserStatus(user);
        if (status !== filterValues.status) return false;
      }

      // hasPhone filter
      if (filterValues.hasPhone && !user.phone) return false;

      // lockedUsers filter
      if (filterValues.lockedUsers && !user.isLocked) return false;

      return true;
    });
  };

  // ESC key handler for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Reset Password Modal
        if (resetUser) {
          setResetUser(null);
          setNewPassword('');
          setForceTemp(false);
        }
        // View User Modal
        if (viewUser) {
          setViewUser(null);
        }
        // Delete User Modal
        if (deleteUser) {
          setDeleteUser(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetUser, newPassword, forceTemp, viewUser, deleteUser]);

  const lockedUsersCount = users?.filter((u: any) => u.isLocked).length ?? 0;

  return (
    <div className="relative z-10">
      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Header - Idéntico a Inventory */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--unit-accent)] animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Sistema de Usuarios
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Usuarios</h1>
            <p className="text-[var(--unit-text-muted)]">
              Gestiona empleados, desbloqueos y restablecimientos de contraseña con control total
            </p>
          </div>

          {/* Users Metrics */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--unit-accent)] border-t-transparent"></div>
              <span className="ml-2 text-[var(--unit-text)]">Cargando métricas...</span>
            </div>
          ) : (
            <UsersMetrics users={users} />
          )}

          {/* Enhanced Action Buttons - Estilo Inventory */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 relative z-20">
            {lockedUsersCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-bold">{lockedUsersCount} usuarios bloqueados</span>
              </div>
            )}
            <button
              onClick={() => {
                router.push('/users/new');
              }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              {t('create')} usuario
            </button>
          </div>
        </div>

        {/* Enhanced Users Filters - Premium Glassmorphism como Inventory */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Filter Header - Exacto estilo Inventory */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)">{t('filter')}s de Usuarios</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Refina tu búsqueda de usuarios</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--unit-border)]/30 bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] transition-all"
                >
                  {showFilters ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar filtros
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Mostrar filtros
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Content - Conditional Rendering */}
            {showFilters && (
              <div className="space-y-6">
                {/* Additional Filter Controls - Estilo Inventory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Role Filter */}
                  <div>
                    <Select
                      label="Rol"
                      options={[
                        { value: '', label: t('allRoles') },
                        { value: 'ADMIN', label: 'Administrador' },
                        { value: 'RECEPTIONIST', label: 'Recepcionista' },
                        { value: 'BARBER', label: 'Barbero' },
                        { value: 'BEAUTICIAN', label: 'Esteticista' },
                        { value: 'MANAGER', label: 'Gerente' }
                      ]}
                      value={roleFilter}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Select
                      label="Estado"
                      options={[
                        { value: '', label: t('allStatuses') },
                        { value: 'ACTIVE', label: 'Activo' },
                        { value: 'INACTIVE', label: 'Inactivo' },
                        { value: 'LOCKED', label: 'Bloqueado' }
                      ]}
                      value={isActiveFilter}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIsActiveFilter(e.target.value)}
                    />
                  </div>

                  {/* Unit Filter */}
                  <div>
                    <Select
                      label="Unidad"
                      options={[
                        { value: '', label: t('allUnits') },
                        { value: 'SPA', label: 'SPA' },
                        { value: 'BARBERIA', label: 'Barbería' }
                      ]}
                      value={unitFilter}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUnitFilter(e.target.value)}
                    />
                  </div>
                </div>

                {/* Search Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">{t('search')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-[var(--unit-text-muted)]" />
                    </div>
                    <input
                      type="text"
                      placeholder={t('searchPlaceholder')}
                      value={searchFilter}
                      onChange={(e) => {
  const value = e.target.value;
  
  // 🔥 Protección adicional: Validar que el valor venga de una interacción real del usuario
  if (!document.hasFocus() && value === 'admin@barberiaspa.com') {
    // Ignorar valor sin foco del documento
    return;
  }
  
  setSearchFilter(value);
}}
                      autoComplete="off"
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 pl-12 pr-12 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchFilter('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--unit-accent)] text-white hover:bg-[var(--unit-accent)]/80 transition-colors">
                          <X className="h-3 w-3" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Enhanced Active Filters Summary */}
                {(roleFilter || isActiveFilter || unitFilter || searchFilter) && (
                  <div className="rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--unit-text)] uppercase tracking-wider">Filtros activos:</span>
                        <div className="flex flex-wrap gap-2">
                          {roleFilter && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                              Rol: {roleFilter === 'ADMIN' ? 'Administrador' : roleFilter === 'RECEPTIONIST' ? 'Recepcionista' : roleFilter === 'BARBER' ? 'Barbero' : roleFilter === 'BEAUTICIAN' ? 'Esteticista' : 'Gerente'}
                            </span>
                          )}
                          {isActiveFilter && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                              Estado: {isActiveFilter === 'ACTIVE' ? 'Activo' : isActiveFilter === 'INACTIVE' ? 'Inactivo' : 'Bloqueado'}
                            </span>
                          )}
                          {unitFilter && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                              Unidad: {unitFilter === 'SPA' ? 'SPA' : 'Barbería'}
                            </span>
                          )}
                          {searchFilter && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                              {t('search')}: {searchFilter}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setRoleFilter('');
                          setIsActiveFilter('');
                          setUnitFilter('');
                          setSearchFilter('');
                          setPage(1);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--unit-accent)] hover:bg-[var(--unit-accent)] hover:text-white rounded-xl border-2 border-[var(--unit-accent)]/50 transition-all"
                      >
                        <X className="h-4 w-4" />
                        {t('clearFilters')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
              {/* Enhanced Users Table - Premium Glassmorphism como Inventory */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Premium Table Header */}
            <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Usuarios</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Gestión de usuarios y permisos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/20 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-sm">
                    {users.length} usuarios
                  </span>
                </div>
              </div>
            </div>

            {/* Role Summary */}
            <div className="flex items-center gap-2 text-xs text-[var(--unit-text)] mb-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                {users.filter((u: UserRow) => u.role === 'ADMIN').length} administradores
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {users.filter((u: UserRow) => u.role === 'RECEPTIONIST').length} recepcionistas
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                {users.filter((u: UserRow) => u.role === 'BARBER').length} barberos
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {users.filter((u: UserRow) => u.role === 'SPA_SPECIALIST').length} esteticistas
              </span>
              <span className="text-[var(--unit-text-muted)]">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                {lockedUsersCount} bloqueados
              </span>
            </div>
            
            {/* Enhanced DataTable Container */}
            <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
              {isLoading ? (
                <TableSkeleton rows={10} columns={6} />
              ) : (
                <DataTable
                  data={users}
                  columns={columns as any}
                  actions={actions as any}
                  loading={isLoading}
                  keyExtractor={(item: any) => item.id}
                  emptyMessage="No se encontraron usuarios para los filtros seleccionados."
                  pageSize={limit}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Modals - Premium Glassmorphism */}
        {/* Unlock User Modal */}
        {unlockUser && (
          <ConfirmDialog
            isOpen={!!unlockUser}
            onClose={() => setUnlockUser(null)}
            onCancel={() => setUnlockUser(null)}
            onConfirm={() => {
              if (unlockUser) {
                unlockMutation.mutate(unlockUser.id);
              }
            }}
            title="Desbloquear Usuario"
            message={`¿Estás seguro de que deseas desbloquear al usuario ${unlockUser.name}?`}
            confirmText="Desbloquear"
            cancelText="Cancelar"
            type="warning"
            isLoading={unlockMutation.isPending}
          />
        )}

        {/* Reset Password Modal - Estilo Eliminar Servicio */}
        {resetUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setResetUser(null);
              setNewPassword('');
              setForceTemp(false);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-50/95 to-blue-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern - Estilo Eliminar Gasto */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Premium Header - Estándar consistente */}
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  {/* Background gradient for header - Consistente con Modal.tsx */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <RotateCcw className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">{t('update')} Contraseña</h3>
                      <p className="text-sm text-blue-700">Crea una nueva contraseña temporal</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setResetUser(null);
                      setNewPassword('');
                      setForceTemp(false);
                    }}
                    className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Warning Content - Estilo Eliminar Servicio */}
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-100 to-blue-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 mt-1">
                        <Key className="h-4 w-4 text-[var(--unit-primary)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          ¿Estás seguro de que deseas resetear la contraseña?
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Se generará una nueva contraseña temporal para el usuario {resetUser.name}.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Details */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Usuario</span>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {resetUser.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Email</span>
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                          {resetUser.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">
                        {t('password')} *
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        placeholder={getPlaceholder('password')}
                      />
                      {newPassword && newPassword.length < 6 && (
                        <p className="mt-2 text-sm text-[var(--unit-error)] font-medium flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          La contraseña debe tener al menos 6 caracteres
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100">
                      <input
                        type="checkbox"
                        id="forceTemp"
                        checked={forceTemp}
                        onChange={(e) => setForceTemp(e.target.checked)}
                        className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="forceTemp" className="text-sm font-medium text-blue-900 cursor-pointer">
                        Forzar cambio de contraseña en próximo inicio
                      </label>
                    </div>
                  </div>
                  
                  {/* Premium Action Buttons - Estilo Eliminar Servicio */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => {
                        setResetUser(null);
                        setNewPassword('');
                        setForceTemp(false);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold border-2 border-gray-300/50 transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (resetUser && newPassword && newPassword.length >= 6) {
                          resetMutation.mutate({
                            userId: resetUser.id,
                            newPassword: newPassword.trim(),
                            forceTemp,
                          });
                        }
                      }}
                      disabled={!newPassword || newPassword.length < 6 || resetMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          Reseteando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4" />
                          Resetear Contraseña
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* El modal de creación se eliminó - ahora redirige a /users/new */}

        {/* View User Modal - Exacto estilo ServicesPage */}
        {viewUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewUser(null);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Enhanced Header - Estándar consistente */}
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  {/* Background gradient for header - Consistente con Modal.tsx */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--unit-text)]">Detalles del Usuario</h3>
                      <p className="text-sm text-[var(--unit-text-muted)]">{viewUser.name}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setViewUser(null)}
                    className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Enhanced Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Enhanced Basic Information - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <UserIcon className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información General</h4>
                      </div>

                      {/* Enhanced User Info List */}
                      <div className="space-y-4">
                        {/* Name */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Nombre</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {viewUser.name}
                          </span>
                        </div>

                        {/* Email */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Email</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30 max-w-xs truncate">
                            {viewUser.email}
                          </span>
                        </div>

                        {/* Phone */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--unit-text)]">Teléfono</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {viewUser.phone || 'No registrado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Role and Unit - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Settings className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Rol y Unidad</h4>
                      </div>

                      {/* Enhanced Role List */}
                      <div className="space-y-4">
                        {/* Role */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-[var(--unit-primary)]/30 bg-gradient-to-r from-[var(--unit-primary)]/5 to-[var(--unit-accent)]/5 hover:from-[var(--unit-primary)]/10 hover:to-[var(--unit-accent)]/10 transition-all">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[var(--unit-primary)]" />
                            <span className="text-sm font-bold text-[var(--unit-primary)]">Rol</span>
                          </div>
                          <span className="font-bold text-[var(--unit-primary)] bg-white px-3 py-1 rounded-lg border-2 border-[var(--unit-primary)]/30 shadow-lg">
                            {viewUser.role === 'ADMIN' ? 'Administrador' :
                             viewUser.role === 'RECEPTIONIST' ? 'Recepcionista' :
                             viewUser.role === 'BARBER' ? 'Barbero' :
                             viewUser.role === 'SPA_SPECIALIST' ? 'Esteticista' : viewUser.role}
                          </span>
                        </div>

                        {/* Unit */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Unidad</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {viewUser.unit === 'SPA' ? 'SPA' : viewUser.unit === 'BARBERIA' ? 'Barbería' : 'Sin unidad'}
                          </span>
                        </div>

                        {/* Commission */}
                        {viewUser.commissionPct && (
                          <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-800">Comisión</span>
                            </div>
                            <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border-2 border-emerald-300/30 shadow-lg">
                              {viewUser.commissionPct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Status and Security - Glassmorphism Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--unit-accent)]/5 to-[var(--unit-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                    <div className="relative">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--unit-accent)]/20 to-[var(--unit-primary)]/20 border border-[var(--unit-accent)]/30">
                          <Shield className="h-4 w-4 text-[var(--unit-accent)]" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Estado y Seguridad</h4>
                      </div>

                      {/* Enhanced Status List */}
                      <div className="space-y-4">
                        {/* Status */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Estado</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                            viewUser.isActive && !viewUser.isLocked
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : viewUser.isLocked
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {viewUser.isActive && !viewUser.isLocked
                              ? 'Activo'
                              : viewUser.isLocked
                              ? 'Bloqueado'
                              : 'Inactivo'}
                          </span>
                        </div>

                        {/* Created At */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Creado</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {format(new Date(viewUser.createdAt), 'dd/MM/yyyy')}
                          </span>
                        </div>

                        {/* Failed Login Attempts */}
                        <div className="group/item flex justify-between items-center py-3 px-4 rounded-xl border border-[var(--unit-border)]/20 hover:border-[var(--unit-accent)]/30 hover:bg-[var(--unit-surface)]/50 transition-all">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-[var(--unit-text-muted)]" />
                            <span className="text-sm font-medium text-[var(--unit-text)]">Intentos Fallidos</span>
                          </div>
                          <span className="font-bold text-[var(--unit-text)] bg-[var(--unit-surface)] px-3 py-1 rounded-lg border border-[var(--unit-border)]/30">
                            {viewUser.failedLoginAttempts}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[var(--unit-border)]">
                  <button
                    onClick={() => {
                      router.push(`/users/${viewUser.id}`);
                      setViewUser(null);
                    }}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Edit className="h-4 w-4" />
                    Editar Usuario
                  </button>
                  {viewUser.isLocked && (
                    <button
                      onClick={() => {
                        setUnlockUser(viewUser);
                        setViewUser(null);
                      }}
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-lg border-2 border-amber-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Lock className="h-4 w-4" />
                      Desbloquear
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setResetUser(viewUser);
                      setViewUser(null);
                    }}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg border-2 border-blue-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Resetear Contraseña
                  </button>
                  {viewUser.role !== 'ADMIN' && (
                    <button
                      onClick={() => {
                        setDeleteUser(viewUser);
                        setViewUser(null);
                      }}
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* El modal de edición se eliminó - ahora redirige a /users/[id] */}

        {/* Delete User Modal - Estilo Eliminar Servicio */}
        {deleteUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteUser(null);
            }
          }}>
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-50/95 to-red-100/85 backdrop-blur-md shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Background Pattern - Estilo Eliminar Gasto */}
              <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DC2626' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              <div className="relative">
                {/* Premium Header - Estándar consistente */}
                <div className="relative mb-6 flex items-start justify-between gap-4">
                  {/* Background gradient for header - Consistente con Modal.tsx */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--unit-accent)]/20 to-transparent"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                      <Trash2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900">Eliminar Usuario</h3>
                      <p className="text-sm text-red-700">Esta acción es permanente</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setDeleteUser(null);
                    }}
                    className="relative z-10 shrink-0 rounded-xl border-2 border-[var(--unit-border)]/50 bg-[var(--unit-surface)]/50 p-2 text-[var(--unit-text-muted)] transition-all duration-200 hover:border-[var(--unit-accent)]/50 hover:bg-[var(--unit-accent)]/10 hover:text-[var(--unit-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Warning Content - Estilo Eliminar Servicio */}
                <div className="space-y-6">
                  {/* Warning Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-100 to-red-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 mt-1">
                        <AlertTriangle className="h-4 w-4 text-[var(--unit-error)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">
                          ¿Estás seguro de que deseas eliminar al usuario "{deleteUser.name}"?
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Esta acción no se puede deshacer y el usuario será eliminado permanentemente del sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Details */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-gray-500/30 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Usuario</span>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {deleteUser.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Email</span>
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                          {deleteUser.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Rol</span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          {deleteUser.role === 'ADMIN' ? 'Admin' : 
                           deleteUser.role === 'RECEPTIONIST' ? 'Recepcionista' :
                           deleteUser.role === 'SPA_SPECIALIST' ? 'Especialista SPA' : 'Barbero'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Premium Action Buttons - Eliminar siempre a la izquierda */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setDeleteUser(null)}
                      className="flex-1 rounded-xl border-2 border-red-300/50 px-6 py-3 text-sm font-medium text-red-700 bg-white/80 hover:bg-red-50 transition-all hover:shadow-lg active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (deleteUser) {
                          deleteUserMutation.mutate(deleteUser.id);
                        }
                      }}
                      disabled={deleteUserMutation.isPending}
                      className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-lg border-2 border-red-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {deleteUserMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                          Eliminando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Eliminar Usuario
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
                      
