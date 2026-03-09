import type { AuthUser, UserRole } from '@/types/auth';

export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export const routePermissions: Record<string, UserRole[]> = {
    '/admin/users': ['ADMIN'],
    '/admin/audit': ['ADMIN'],
    '/admin/backups': ['ADMIN'],
    '/reports': ['ADMIN', 'RECEPTIONIST'],
  };