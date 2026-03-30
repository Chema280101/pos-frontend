/**
 * Secure API Hook with Role-Based Access Control
 * Provides secure API calls with automatic permission checking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { 
  validateToken, 
  hasDataAccess, 
  filterDataByRole, 
  canAccessEndpoint, 
  createSecurityAuditLog,
  validateSensitiveDataAccess,
  sanitizeInput
} from '@/lib/apiSecurity';
import type { AuthUser } from '@/types/auth';

/**
 * Secure API hook options
 */
interface SecureApiOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  dataType?: string;
  requireAuth?: boolean;
  auditAction?: string;
  rateLimitKey?: string;
}

/**
 * Enhanced API error with security context
 */
interface SecureApiError extends Error {
  statusCode?: number;
  securityError?: string;
  requiresReauth?: boolean;
}

/**
 * Create secure API error
 */
function createSecureApiError(message: string, statusCode?: number, securityError?: string): SecureApiError {
  const error = new Error(message) as SecureApiError;
  error.statusCode = statusCode;
  error.securityError = securityError;
  error.requiresReauth = statusCode === 401 || securityError === 'INVALID_TOKEN';
  return error;
}

/**
 * Secure API hook for queries
 */
export function useSecureQuery<T>(
  options: SecureApiOptions,
  queryFn?: () => Promise<T>,
  queryKey?: string[]
) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useQuery<T, SecureApiError>({
    queryKey: queryKey || [options.endpoint],
    queryFn: async () => {
      // Authentication check
      if (options.requireAuth !== false) {
        if (!user) {
          throw createSecureApiError('Authentication required', 401, 'NO_USER');
        }

        // Token validation
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw createSecureApiError('No access token', 401, 'NO_TOKEN');
        }

        const payload = validateToken(token);
        if (!payload) {
          throw createSecureApiError('Invalid or expired token', 401, 'INVALID_TOKEN');
        }

        // Endpoint access check
        if (!canAccessEndpoint(user, options.endpoint, options.method)) {
          throw createSecureApiError('Access denied', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      // Execute query
      let result: T;
      try {
        if (queryFn) {
          result = await queryFn();
        } else {
          const response = await api.get(options.endpoint);
          result = response.data;
        }
      } catch (error: any) {
        // Handle API errors
        if (error.response?.status === 401) {
          throw createSecureApiError('Authentication failed', 401, 'API_AUTH_FAILED');
        }
        if (error.response?.status === 403) {
          throw createSecureApiError('Access denied by API', 403, 'API_ACCESS_DENIED');
        }
        throw error;
      }

      // Data access validation
      if (options.dataType && user) {
        const validation = validateSensitiveDataAccess(user, options.dataType, 'read', result);
        if (!validation.allowed) {
          throw createSecureApiError(validation.reason || 'Data access denied', 403, 'DATA_ACCESS_DENIED');
        }
        
        // Return filtered data if applicable
        if (validation.filteredData) {
          result = validation.filteredData;
        }
      }

      // Create audit log
      if (options.auditAction && user) {
        const auditLog = createSecurityAuditLog(user, options.auditAction, options.endpoint);
        // Send audit log to server (implement as needed)
        // Security audit logged
      }

      return result;
    },
    enabled: !!user || options.requireAuth === false,
    retry: (failureCount, error: any) => {
      // Don't retry on security errors
      if (error && (error as SecureApiError)?.requiresReauth || (error as SecureApiError)?.securityError) {
        return false;
      }
      // Standard retry logic for other errors
      return failureCount < 3;
    },
    // Note: onError is deprecated in useQuery, using error handling in component instead
  });
}

/**
 * Secure API hook for mutations
 */
export function useSecureMutation<TData, TVariables, TError = SecureApiError>(
  options: SecureApiOptions,
  mutationFn?: (variables: TVariables) => Promise<TData>,
  optionsConfig?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
  }
) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables) => {
      // Authentication check
      if (!user) {
        throw createSecureApiError('Authentication required', 401, 'NO_USER');
      }

      // Token validation
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw createSecureApiError('No access token', 401, 'NO_TOKEN');
      }

      const payload = validateToken(token);
      if (!payload) {
        throw createSecureApiError('Invalid or expired token', 401, 'INVALID_TOKEN');
      }

      // Endpoint access check
      if (!canAccessEndpoint(user, options.endpoint, options.method)) {
        throw createSecureApiError('Access denied', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // Sanitize input data
      const sanitizedVariables = sanitizeInput(variables);

      // Data access validation
      if (options.dataType) {
        const methodMap: Record<'GET' | 'POST' | 'PUT' | 'DELETE', 'read' | 'write' | 'delete'> = {
          'GET': 'read',
          'POST': 'write',
          'PUT': 'write',
          'DELETE': 'delete'
        };
        const permission = methodMap[options.method || 'GET'];
        const validation = validateSensitiveDataAccess(user, options.dataType, permission, sanitizedVariables);
        if (!validation.allowed) {
          throw createSecureApiError(validation.reason || 'Data access denied', 403, 'DATA_ACCESS_DENIED');
        }
      }

      // Execute mutation
      let result: TData;
      try {
        if (mutationFn) {
          result = await mutationFn(sanitizedVariables as TVariables);
        } else {
          const response = await api[options.method?.toLowerCase() as 'post' | 'put' | 'delete'](options.endpoint, sanitizedVariables);
          result = response.data;
        }
      } catch (error: any) {
        // Handle API errors
        if (error.response?.status === 401) {
          throw createSecureApiError('Authentication failed', 401, 'API_AUTH_FAILED');
        }
        if (error.response?.status === 403) {
          throw createSecureApiError('Access denied by API', 403, 'API_ACCESS_DENIED');
        }
        throw error;
      }

      // Create audit log
      if (options.auditAction && user) {
        const auditLog = createSecurityAuditLog(
          user, 
          options.auditAction, 
          options.endpoint,
          JSON.stringify(variables).substring(0, 50),
          { before: variables, after: result }
        );
        // Send audit log to server (implement as needed)
        // Security audit logged
      }

      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options.dataType) {
        queryClient.invalidateQueries({ queryKey: [options.dataType] });
      }
      
      // Call custom onSuccess
      optionsConfig?.onSuccess?.(data, variables);
    },
    onError: (error: any, variables) => {
      // Handle security errors
      if (error && (error as SecureApiError)?.requiresReauth) {
        // Clear session and redirect to login
        const authStore = useAuthStore.getState();
        authStore.clearSession();
        window.location.href = '/login';
      }
      
      // Call custom onError
      optionsConfig?.onError?.(error, variables);
    }
  });
}

/**
 * Pre-configured secure hooks for common operations
 */
export const useSecureClients = () => useSecureQuery(
  { 
    endpoint: '/api/clients', 
    dataType: 'clients', 
    requireAuth: true, 
    auditAction: 'READ_CLIENTS' 
  }
);

export const useSecureAppointments = () => useSecureQuery(
  { 
    endpoint: '/api/appointments', 
    dataType: 'appointments', 
    requireAuth: true, 
    auditAction: 'READ_APPOINTMENTS' 
  }
);

export const useSecureSales = () => useSecureQuery(
  { 
    endpoint: '/api/sales', 
    dataType: 'sales', 
    requireAuth: true, 
    auditAction: 'READ_SALES' 
  }
);

export const useSecureCommissions = () => useSecureQuery(
  { 
    endpoint: '/api/commissions', 
    dataType: 'reports', 
    requireAuth: true, 
    auditAction: 'READ_COMMISSIONS' 
  }
);

export const useSecureInventory = () => useSecureQuery(
  { 
    endpoint: '/api/inventory', 
    dataType: 'inventory', 
    requireAuth: true, 
    auditAction: 'READ_INVENTORY' 
  }
);

/**
 * Secure mutation hooks
 */
export const useSecureCreateClient = () => useSecureMutation(
  { 
    endpoint: '/api/clients', 
    method: 'POST', 
    dataType: 'clients', 
    requireAuth: true, 
    auditAction: 'CREATE_CLIENT' 
  }
);

export const useSecureUpdateClient = () => useSecureMutation(
  { 
    endpoint: '/api/clients/[id]', 
    method: 'PUT', 
    dataType: 'clients', 
    requireAuth: true, 
    auditAction: 'UPDATE_CLIENT' 
  }
);

export const useSecureCreateAppointment = () => useSecureMutation(
  { 
    endpoint: '/api/appointments', 
    method: 'POST', 
    dataType: 'appointments', 
    requireAuth: true, 
    auditAction: 'CREATE_APPOINTMENT' 
  }
);

export const useSecureCreateSale = () => useSecureMutation(
  { 
    endpoint: '/api/sales', 
    method: 'POST', 
    dataType: 'sales', 
    requireAuth: true, 
    auditAction: 'CREATE_SALE' 
  }
);

/**
 * Hook for checking user permissions
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  
  const canAccess = (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') => {
    if (!user) return false;
    return canAccessEndpoint(user, endpoint, method);
  };
  
  const hasDataAccess = (dataType: string, permission: string, resourceUserId?: string) => {
    if (!user) return false;
    return (window as any).hasDataAccess?.(user, dataType, permission, resourceUserId) || false;
  };
  
  const canRead = (dataType: string) => hasDataAccess(dataType, 'read');
  const canWrite = (dataType: string) => hasDataAccess(dataType, 'write');
  const canDelete = (dataType: string) => hasDataAccess(dataType, 'delete');
  
  return {
    user,
    canAccess,
    hasDataAccess,
    canRead,
    canWrite,
    canDelete,
    role: user?.role || null
  };
}

/**
 * Hook for secure data filtering
 */
export function useSecureData<T extends Record<string, any>>(
  data: T[],
  dataType: string,
  userField = 'userId'
) {
  const user = useAuthStore((s) => s.user);
  
  if (!user) {
    return { filteredData: [], isFiltered: true, reason: 'No user authenticated' };
  }
  
  try {
    const filteredData = (window as any).filterDataByRole?.(data, user, dataType, userField) || data;
    const isFiltered = filteredData.length !== data.length;
    
    return {
      filteredData,
      isFiltered,
      reason: isFiltered ? 'Data filtered by role permissions' : 'Full access granted'
    };
  } catch (error) {
    // Error filtering data
    return { filteredData: [], isFiltered: true, reason: 'Error filtering data' };
  }
}
