export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'SPA_SPECIALIST' | 'BARBER' | 'BEAUTICIAN' | 'MANAGER';
export type BusinessUnit = 'SPA' | 'BARBERIA';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unit: BusinessUnit | null;
  mustChangePassword: boolean;
  isLocked: boolean;
  status?: UserStatus;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  expiresInSeconds: number;
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function canAccessUnit(user: AuthUser | null, unit: BusinessUnit): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.unit === unit;
}

export function getRoleLabel(role: UserRole): string {
  const roleLabels = {
    'ADMIN': 'Administrador',
    'RECEPTIONIST': 'Recepcionista',
    'SPA_SPECIALIST': 'Especialista SPA',
    'BARBER': 'Barbero',
    'BEAUTICIAN': 'Esteticista',
    'MANAGER': 'Gerente',
  };
  return roleLabels[role] || role;
}

export function getStatusLabel(status: UserStatus): string {
  const statusLabels = {
    'ACTIVE': 'Activo',
    'INACTIVE': 'Inactivo',
    'LOCKED': 'Bloqueado',
  };
  return statusLabels[status] || status;
}
