import type { AuthUser, UserRole } from '@/types/auth';

export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export const routePermissions: Record<string, UserRole[]> = {
    '/dashboard': ['ADMIN'],
    '/clients': ['ADMIN', 'RECEPTIONIST'],
    '/pos': ['ADMIN', 'RECEPTIONIST'],
    '/cash-register': ['ADMIN', 'RECEPTIONIST'],
    '/expenses': ['ADMIN', 'RECEPTIONIST'],
    '/income': ['ADMIN', 'RECEPTIONIST'],
    '/inventory': ['ADMIN', 'RECEPTIONIST'],
    '/suppliers': ['ADMIN'],
    '/services': ['ADMIN', 'RECEPTIONIST'],
    '/packages': ['ADMIN', 'RECEPTIONIST'],
    '/reports': ['ADMIN'],
    '/admin/users': ['ADMIN'],
    '/admin/audit': ['ADMIN'],
    '/admin/backups': ['ADMIN'],
    // Allow all roles for appointments and commissions
    '/appointments': ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'],
    '/commissions': ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER'],
};