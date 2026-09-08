'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { TableBadge, getTableBadgeTypeForRole } from '@/components/ui/TableBadge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { UsersMetrics } from './UsersMetrics';
import { format } from 'date-fns';
import { t, getPlaceholder } from '@/lib/uiTranslations';
import { Plus, Lock, Unlock, RotateCcw, User as UserIcon, AlertTriangle, Eye, Edit, Trash2, AlertCircle, Users, Filter, ChevronDown, ChevronUp, X, Package, BarChart3, Clock, CheckCircle2, Building2, Calendar, TrendingUp, Activity, Shield, Key, UserCheck, UserX, Settings, Search, Loader2, RefreshCw } from 'lucide-react';
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
        <TableBadge type="email">
          {row.email}
        </TableBadge>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      render: (row: UserRow) => (
        <TableBadge type={getTableBadgeTypeForRole(row.role)}>
          {getRoleLabelCentral(row.role)}
        </TableBadge>
      ),
    },
    {
      key: 'unit',
      header: 'Unidad',
      sortable: true,
      render: (row: UserRow) => (
        <TableBadge type={row.unit === 'SPA' ? 'unit-spa' : row.unit === 'BARBERIA' ? 'unit-barberia' : 'status-default'}>
          {getUnitLabel(row.unit || '') || 'Sin unidad'}
        </TableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (row: UserRow) => {
        let statusType: 'status-active' | 'status-inactive' | 'status-pending' | 'status-default' = 'status-default';
        if (!row.isActive) statusType = 'status-inactive';
        else if (row.isLocked) statusType = 'status-pending';
        else if (row.mustChangePassword) statusType = 'status-pending';
        else statusType = 'status-active';
        
        return (
          <TableBadge type={statusType}>
            {!row.isActive
              ? 'Inactivo'
              : row.isLocked
              ? 'Bloqueado'
              : row.mustChangePassword
              ? 'Cambiar contraseña'
              : 'Activo'}
          </TableBadge>
        );
      },
    },
  ];

  // Define actions for DataTable
  const actions = [
    {
      label: t('view'),
      variant: 'view' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: UserRow) => setViewUser(row),
    },
    {
      label: t('edit'),
      variant: 'edit' as const,
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: UserRow) => {
        router.push(`/users/${row.id}`);
      },
      disabled: (row: UserRow) => row.role === 'ADMIN', // Prevent editing admin users
    },
    {
      label: 'Desbloquear',
      variant: 'success' as const,
      icon: <Unlock className="h-4 w-4" />,
      onClick: (row: UserRow) => setUnlockUser(row),
      disabled: (row: UserRow) => !row.isLocked,
    },
    {
      label: 'Resetear contraseña',
      variant: 'refresh' as const,
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: (row: UserRow) => {
        setResetUser(row);
      },
    },
    {
      label: 'Eliminar',
      variant: 'delete' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: UserRow) => setDeleteUser(row),
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
    <div className="min-h-screen bg-[var(--unit-surface)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--unit-border)]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--unit-accent)]/10 text-[var(--unit-accent)] text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--unit-accent)] animate-pulse" />
                Seguridad & Accesos • {activeUnit === 'BARBERIA' ? 'Barbería' : 'SPA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--unit-text)] tracking-tight">
              Gestión de Usuarios & Personal
            </h1>
            <p className="text-xs sm:text-sm text-[var(--unit-text-muted)]">
              Administración de cuentas, roles de acceso, desbloqueos y restablecimiento de contraseñas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {lockedUsersCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-unit bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{lockedUsersCount} bloqueados</span>
              </div>
            )}

            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-xs font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-surface)] transition-all shadow-unit"
              title="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin text-[var(--unit-accent)]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={() => {
                router.push('/users/new');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white text-xs font-bold transition-all shadow-unit active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </button>
          </div>
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

        {/* Unified TableToolbar */}
        <TableToolbar
          search={searchFilter}
          onSearchChange={setSearchFilter}
          searchPlaceholder={t('searchPlaceholder')}
          chips={[
            { id: '', label: 'Todos', count: users.length },
            { id: 'ADMIN', label: 'Admin', count: users.filter((u: UserRow) => u.role === 'ADMIN').length, activeColor: 'bg-red-600 text-white' },
            { id: 'RECEPTIONIST', label: 'Recepción', count: users.filter((u: UserRow) => u.role === 'RECEPTIONIST').length, activeColor: 'bg-blue-600 text-white' },
            { id: 'BARBER', label: 'Barbero', count: users.filter((u: UserRow) => u.role === 'BARBER').length, activeColor: 'bg-amber-600 text-white' },
            { id: 'SPA_SPECIALIST', label: 'Especialista', count: users.filter((u: UserRow) => u.role === 'SPA_SPECIALIST' || u.role === 'BEAUTICIAN').length, activeColor: 'bg-green-600 text-white' },
          ]}
          activeChip={roleFilter}
          onChipChange={(id) => setRoleFilter(String(id))}
          showAdvancedFiltersButton={true}
          isAdvancedOpen={showFilters}
          onToggleAdvanced={() => setShowFilters(!showFilters)}
          activeFiltersCount={(roleFilter ? 1 : 0) + (isActiveFilter ? 1 : 0) + (unitFilter ? 1 : 0) + (searchFilter ? 1 : 0)}
          onResetFilters={() => {
            setRoleFilter('');
            setIsActiveFilter('');
            setUnitFilter('');
            setSearchFilter('');
            setPage(1);
          }}
          advancedFiltersContent={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          }
        />

        {/* Enhanced Users Table - Premium Glassmorphism como Inventory */}
        <div className="relative overflow-hidden rounded-unit-lg border border-[var(--unit-border)]/60 bg-[var(--unit-surface)] shadow-unit-lg p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            {/* Premium Table Header */}
            <div className="bg-[var(--unit-surface-elevated)] px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-unit bg-[var(--unit-accent)] text-white shadow-unit">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Lista de Usuarios</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Gestión de usuarios y permisos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--unit-accent)]/15 px-3 py-1.5 text-sm font-bold text-[var(--unit-accent)] border border-[var(--unit-accent)]/30 shadow-unit-sm">
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
            <div className="relative overflow-hidden rounded-unit border-2 border-[var(--unit-border)]/30 bg-gradient-to-br from-[var(--unit-surface)] to-[var(--unit-surface-elevated)] p-4">
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
                  disableInternalPagination={true}
                  pagination={pagination}
                  onPageChange={(page) => setPage(page)}
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

        {/* Reset Password Modal */}
        {resetUser && (
          <Modal
            open={!!resetUser}
            onClose={() => {
              setResetUser(null);
              setNewPassword('');
              setForceTemp(false);
            }}
            title="Resetear Contraseña"
            description={`Generar una nueva contraseña para ${resetUser.name}`}
            headerIcon={<Key className="h-5 w-5" />}
            size="md"
          >
            <div className="space-y-4">
              <div className="p-3.5 rounded-unit border border-[var(--unit-accent)]/30 bg-[var(--unit-accent)]/10 text-xs text-[var(--unit-text)]">
                Se actualizarán las credenciales de acceso para <strong>{resetUser.email}</strong>.
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--unit-text)]">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-unit border border-[var(--unit-border)]/60 px-4 py-2.5 text-sm text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/40 focus:border-[var(--unit-accent)] transition-all placeholder:text-[var(--unit-text-muted)]/50"
                  placeholder="Mínimo 6 caracteres"
                />
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 p-3 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-border)]/20 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  id="forceTemp"
                  checked={forceTemp}
                  onChange={(e) => setForceTemp(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--unit-accent)]"
                  style={{ accentColor: 'var(--unit-accent)' }}
                />
                <span className="text-xs font-semibold text-[var(--unit-text)]">
                  Forzar cambio de contraseña en próximo inicio de sesión
                </span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setResetUser(null);
                    setNewPassword('');
                    setForceTemp(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-unit border border-[var(--unit-border)]/60 text-sm font-semibold text-[var(--unit-text)] bg-[var(--unit-surface-elevated)] hover:bg-[var(--unit-border)]/20 transition-all active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
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
                  className="flex-1 px-4 py-2.5 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-bold shadow-unit shadow-[var(--unit-accent)]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Resetear
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* View User Modal */}
        {viewUser && (
          <Modal
            open={!!viewUser}
            onClose={() => setViewUser(null)}
            title="Detalles del Usuario"
            description={viewUser.name}
            headerIcon={<UserIcon className="h-5 w-5" />}
            size="lg"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 space-y-2">
                  <span className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">Información Básica</span>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-[var(--unit-text)]">{viewUser.name}</p>
                    <p className="text-[var(--unit-text-muted)] text-xs">{viewUser.email}</p>
                    <p className="text-[var(--unit-text-muted)] text-xs">{viewUser.phone || 'Sin teléfono'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-unit border border-[var(--unit-border)]/40 bg-[var(--unit-surface-elevated)]/40 space-y-2">
                  <span className="text-xs font-bold text-[var(--unit-text-muted)] uppercase tracking-wider">Rol y Unidad</span>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-[var(--unit-text)]">{getRoleLabelCentral(viewUser.role)}</p>
                    <p className="text-[var(--unit-text-muted)] text-xs">{getUnitLabel(viewUser.unit || '') || 'Sin unidad'}</p>
                    {viewUser.commissionPct != null && (
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Comisión: {viewUser.commissionPct}%</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--unit-border)]/30">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/users/${viewUser.id}`);
                    setViewUser(null);
                  }}
                  className="px-4 py-2 rounded-unit bg-[var(--unit-accent)] hover:bg-[var(--unit-accent)]/90 text-white font-semibold text-sm shadow-unit transition-all active:scale-95 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete User Confirm Dialog */}
        {deleteUser && (
          <ConfirmDialog
            isOpen={!!deleteUser}
            onClose={() => setDeleteUser(null)}
            onConfirm={() => {
              if (deleteUser) {
                deleteUserMutation.mutate(deleteUser.id);
              }
            }}
            title="Eliminar Usuario"
            message={`¿Estás seguro de que deseas eliminar permanentemente a "${deleteUser.name}" (${deleteUser.email})? Esta acción no se puede deshacer.`}
            type="danger"
            confirmText="Eliminar permanentemente"
            cancelText="Cancelar"
            isLoading={deleteUserMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
                      
