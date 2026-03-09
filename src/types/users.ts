// Types unificados para el sistema de usuarios

import type { UserRole, BusinessUnit, UserStatus } from './auth';

// Interface principal para usuarios
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit: BusinessUnit | null;
  phone: string | null;
  commissionPct: number | null;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

// Interface para respuesta paginada
export interface PaginatedUsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para filtros de usuarios
export interface UserFilters {
  search?: string;
  role?: UserRole;
  unit?: BusinessUnit;
  status?: UserStatus;
  isActive?: boolean;
  isLocked?: boolean;
  hasPhone?: boolean;
  mustChangePassword?: boolean;
  page?: number;
  limit?: number;
}

// Interface para creación de usuarios
export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  unit?: BusinessUnit | null;
  phone?: string | null;
  commissionPct?: number | null;
  password: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

// Interface para actualización de usuarios
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  unit?: BusinessUnit | null;
  phone?: string | null;
  commissionPct?: number | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

// Interface para reset de contraseña
export interface ResetPasswordRequest {
  newPassword: string;
  forceTemp?: boolean;
}

// Interface para empleados (simplificado para POS)
export interface Employee {
  id: string;
  name: string;
  unit: BusinessUnit | null;
  commissionPct: number | null;
  isActive: boolean;
}

// Interface para métricas de usuarios
export interface UsersMetrics {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  adminUsers: number;
  employeeUsers: number;
  managerUsers: number;
  spaUsers: number;
  barberiaUsers: number;
  noUnitUsers: number;
  usersWithFailedAttempts: number;
  usersMustChangePassword: number;
  avgFailedAttempts: number;
  usersWithCommission: number;
  avgCommissionRate: number;
  recentlyCreated: number;
  recentlyActive: number;
}

// Interface para auditoría de usuarios
export interface UserAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  device?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

// Interface para respuesta de auditoría
export interface AuditLogResponse {
  data: UserAuditLog[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para filtros de auditoría
export interface AuditFilters {
  userId?: string;
  action?: string;
  entity?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasIpAddress?: boolean;
  hasDevice?: boolean;
  page?: number;
  limit?: number;
}
