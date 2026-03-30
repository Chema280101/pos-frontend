/**
 * API Security Middleware for VersatPOS
 * Implements role-based access control for API endpoints
 */

import type { AuthUser, UserRole } from '@/types/auth';

// Enhanced JWT token validation
export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  unit: string | null;
  iat: number;
  exp: number;
}

// Data access control rules
export const DATA_ACCESS_RULES = {
  // Client data access
  clients: {
    ADMIN: ['read', 'write', 'delete'],
    RECEPTIONIST: ['read', 'write'],
    SPA_SPECIALIST: ['read'],
    BARBER: ['read'],
    BEAUTICIAN: ['read'],
    MANAGER: ['read', 'write']
  },
  
  // Appointment data access
  appointments: {
    ADMIN: ['read', 'write', 'delete'],
    RECEPTIONIST: ['read', 'write', 'delete'],
    SPA_SPECIALIST: ['read', 'write:own'],
    BARBER: ['read', 'write:own'],
    BEAUTICIAN: ['read', 'write:own'],
    MANAGER: ['read', 'write', 'delete']
  },
  
  // Sales data access
  sales: {
    ADMIN: ['read', 'write', 'delete'],
    RECEPTIONIST: ['read', 'write'],
    SPA_SPECIALIST: ['read:own'],
    BARBER: ['read:own'],
    BEAUTICIAN: ['read:own'],
    MANAGER: ['read', 'write']
  },
  
  // Financial data access
  financial: {
    ADMIN: ['read', 'write', 'delete'],
    RECEPTIONIST: ['read', 'write'],
    SPA_SPECIALIST: ['read:own'],
    BARBER: ['read:own'],
    BEAUTICIAN: ['read:own'],
    MANAGER: ['read', 'write']
  },
  
  // Inventory data access
  inventory: {
    ADMIN: ['read', 'write', 'delete'],
    RECEPTIONIST: ['read', 'write'],
    SPA_SPECIALIST: ['read'],
    BARBER: ['read'],
    BEAUTICIAN: ['read'],
    MANAGER: ['read', 'write']
  },
  
  // User management access
  users: {
    ADMIN: ['read', 'write', 'delete'],
    RECEPTIONIST: ['read'],
    SPA_SPECIALIST: ['read'],
    BARBER: ['read'],
    BEAUTICIAN: ['read'],
    MANAGER: ['read', 'write']
  },
  
  // Reports access
  reports: {
    ADMIN: ['read', 'write'],
    RECEPTIONIST: ['read:limited'],
    SPA_SPECIALIST: ['read:own'],
    BARBER: ['read:own'],
    BEAUTICIAN: ['read:own'],
    MANAGER: ['read', 'write']
  }
};

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  ADMIN: [], // Highest level
  MANAGER: ['ADMIN'],
  RECEPTIONIST: ['ADMIN', 'MANAGER'],
  SPA_SPECIALIST: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  BARBER: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  BEAUTICIAN: ['ADMIN', 'MANAGER', 'RECEPTIONIST']
};

/**
 * Validate and decode JWT token
 */
export function validateToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return payload as JWTPayload;
  } catch (error) {
    // Token validation error
    return null;
  }
}

/**
 * Check if user has specific permission for data type
 */
export function hasDataAccess(
  user: AuthUser,
  dataType: keyof typeof DATA_ACCESS_RULES,
  permission: string,
  resourceUserId?: string
): boolean {
  const userPermissions = DATA_ACCESS_RULES[dataType][user.role];
  
  if (!userPermissions) {
    return false;
  }
  
  // Check for own resource access
  if (permission.includes(':own') && resourceUserId) {
    const basePermission = permission.replace(':own', '');
    const hasOwnAccess = userPermissions.includes(`${basePermission}:own`) || 
                         userPermissions.includes(basePermission);
    
    return hasOwnAccess && user.id === resourceUserId;
  }
  
  // Check for general access
  return userPermissions.includes(permission);
}

/**
 * Filter data based on user role and permissions
 */
export function filterDataByRole<T extends { [key: string]: any }>(
  data: T[],
  user: AuthUser,
  dataType: keyof typeof DATA_ACCESS_RULES,
  userField = 'userId'
): T[] {
  const permissions = DATA_ACCESS_RULES[dataType][user.role];
  
  if (!permissions || permissions.includes('read')) {
    return data; // Full read access
  }
  
  if (permissions.includes('read:own')) {
    // Only user's own data
    return data.filter(item => item[userField] === user.id);
  }
  
  if (permissions.includes('read:limited')) {
    // Limited access - filter sensitive fields
    return data.map(item => {
      const filtered = { ...item };
      // Remove sensitive fields based on role
      if (user.role === 'RECEPTIONIST') {
        delete filtered.commissionAmount;
        delete filtered.salary;
      }
      return filtered;
    });
  }
  
  return []; // No access
}

/**
 * Check if user can access specific endpoint
 */
export function canAccessEndpoint(
  user: AuthUser,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): boolean {
  const endpointPermissions: Record<string, UserRole[]> = {
    // Client endpoints
    '/api/clients': ['ADMIN', 'RECEPTIONIST', 'MANAGER'],
    '/api/clients/[id]': ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'],
    
    // Appointment endpoints
    '/api/appointments': ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'],
    '/api/appointments/[id]': ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'],
    
    // Sales endpoints
    '/api/sales': ['ADMIN', 'RECEPTIONIST', 'MANAGER'],
    '/api/sales/[id]': ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'],
    
    // Financial endpoints
    '/api/cash-register': ['ADMIN', 'RECEPTIONIST'],
    '/api/expenses': ['ADMIN', 'RECEPTIONIST'],
    '/api/income': ['ADMIN', 'RECEPTIONIST'],
    
    // Inventory endpoints
    '/api/inventory': ['ADMIN', 'RECEPTIONIST', 'MANAGER'],
    '/api/suppliers': ['ADMIN'],
    
    // Service endpoints
    '/api/services': ['ADMIN', 'RECEPTIONIST', 'MANAGER'],
    '/api/packages': ['ADMIN', 'RECEPTIONIST', 'MANAGER'],
    
    // User management
    '/api/users': ['ADMIN'],
    '/api/users/[id]': ['ADMIN'],
    
    // Reports
    '/api/reports': ['ADMIN', 'MANAGER'],
    
    // Commissions
    '/api/commissions': ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'],
  };
  
  // Handle dynamic routes
  const pattern = endpoint.replace(/\[.*?\]/g, '[id]');
  const allowedRoles = endpointPermissions[pattern] || endpointPermissions[endpoint];
  
  if (!allowedRoles) {
    return false;
  }
  
  // Check if user role is in allowed roles
  return allowedRoles.includes(user.role);
}

/**
 * Create audit log for security events
 */
export function createSecurityAuditLog(
  user: AuthUser,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any
) {
  return {
    userId: user.id,
    userName: user.name,
    action: `SECURITY_${action}`,
    entity: resource,
    entityId: resourceId || 'unknown',
    before: details?.before,
    after: details?.after,
    device: typeof window !== 'undefined' ? navigator.userAgent : null,
    ipAddress: null, // Will be filled by server
    createdAt: new Date().toISOString()
  };
}

/**
 * Rate limiting for sensitive operations
 */
export class RateLimiter {
  private static instances = new Map<string, { count: number; resetTime: number }>();
  
  static checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.instances.get(key);
    
    if (!record || now > record.resetTime) {
      this.instances.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.instances.entries()) {
      if (now > record.resetTime) {
        this.instances.delete(key);
      }
    }
  }
}

/**
 * Sanitize input data to prevent injection attacks
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Validate sensitive data access
 */
export function validateSensitiveDataAccess(
  user: AuthUser,
  dataType: string,
  operation: 'read' | 'write' | 'delete',
  data?: any
): { allowed: boolean; reason?: string; filteredData?: any } {
  // Check rate limiting for sensitive operations
  const rateLimitKey = `${user.id}_${dataType}_${operation}`;
  if (!RateLimiter.checkLimit(rateLimitKey, 10, 60000)) { // 10 requests per minute
    return { allowed: false, reason: 'Rate limit exceeded' };
  }
  
  // Check data access permissions
  const hasPermission = hasDataAccess(user, dataType as keyof typeof DATA_ACCESS_RULES, operation);
  
  if (!hasPermission) {
    return { allowed: false, reason: 'Insufficient permissions' };
  }
  
  // Filter sensitive data if needed
  if (operation === 'read' && data) {
    const filteredData = filterDataByRole(Array.isArray(data) ? data : [data], user, dataType as keyof typeof DATA_ACCESS_RULES);
    return { allowed: true, filteredData: Array.isArray(data) ? filteredData : filteredData[0] };
  }
  
  return { allowed: true };
}

// Cleanup rate limiter periodically
if (typeof window !== 'undefined') {
  setInterval(() => RateLimiter.cleanup(), 60000); // Every minute
}
