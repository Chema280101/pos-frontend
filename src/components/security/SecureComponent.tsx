/**
 * Secure Component Wrapper
 * Provides role-based access control for React components
 */

'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/useSecureApi';
import type { UserRole } from '@/types/auth';

interface SecureComponentProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  dataType?: string;
  action?: 'read' | 'write' | 'delete';
  fallback?: ReactNode;
  requireAuth?: boolean;
  showUnauthorized?: boolean;
}

/**
 * Secure component that only renders if user has proper permissions
 */
export function SecureComponent({
  children,
  roles,
  permissions,
  dataType,
  action = 'read',
  fallback = <div className="text-red-500 p-4 border border-red-200 rounded">Access Denied</div>,
  requireAuth = true,
  showUnauthorized = false
}: SecureComponentProps) {
  const { user, canAccess, hasDataAccess, canRead, canWrite, canDelete } = usePermissions();

  // Check if user is authenticated
  if (requireAuth && !user) {
    return showUnauthorized ? fallback : null;
  }

  // Check role-based access
  if (roles && user && !roles.includes(user.role)) {
    return showUnauthorized ? fallback : null;
  }

  // Check permission-based access
  if (permissions && user) {
    const hasPermission = permissions.every(permission => {
      if (permission.startsWith('canRead') && dataType) {
        return canRead(dataType);
      }
      if (permission.startsWith('canWrite') && dataType) {
        return canWrite(dataType);
      }
      if (permission.startsWith('canDelete') && dataType) {
        return canDelete(dataType);
      }
      return true;
    });

    if (!hasPermission) {
      return showUnauthorized ? fallback : null;
    }
  }

  // Check data-type access
  if (dataType && user) {
    const hasAccess = hasDataAccess(dataType, action);
    if (!hasAccess) {
      return showUnauthorized ? fallback : null;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component for wrapping components with security
 */
export function withSecurity<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  securityOptions: Omit<SecureComponentProps, 'children'>
) {
  return function SecureWrappedComponent(props: P) {
    return (
      <SecureComponent {...securityOptions}>
        <WrappedComponent {...props} />
      </SecureComponent>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useSecureRender() {
  const { user, canAccess, hasDataAccess, canRead, canWrite, canDelete, role } = usePermissions();

  const canRender = (options: {
    roles?: UserRole[];
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    dataType?: string;
    action?: 'read' | 'write' | 'delete';
  }) => {
    // Check authentication
    if (!user) return false;

    // Check role access
    if (options.roles && !options.roles.includes(user.role)) {
      return false;
    }

    // Check endpoint access
    if (options.endpoint && !canAccess(options.endpoint, options.method)) {
      return false;
    }

    // Check data access
    if (options.dataType && !hasDataAccess(options.dataType, options.action || 'read')) {
      return false;
    }

    return true;
  };

  return {
    user,
    role,
    canRender,
    canAccess,
    hasDataAccess,
    canRead,
    canWrite,
    canDelete
  };
}

/**
 * Secure button component that only shows if user has permissions
 */
interface SecureButtonProps {
  children: ReactNode;
  onClick?: () => void;
  roles?: UserRole[];
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  dataType?: string;
  action?: 'read' | 'write' | 'delete';
  disabled?: boolean;
  className?: string;
  fallback?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export function SecureButton({
  children,
  onClick,
  roles,
  endpoint,
  method = 'POST',
  dataType,
  action = 'write',
  disabled = false,
  className = '',
  fallback = null,
  type = 'button'
}: SecureButtonProps) {
  const { canRender } = useSecureRender();

  const canRenderButton = canRender({
    roles,
    endpoint,
    method,
    dataType,
    action
  });

  if (!canRenderButton) {
    return <>{fallback}</>;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

/**
 * Secure link component that only shows if user has permissions
 */
interface SecureLinkProps {
  children: ReactNode;
  href: string;
  roles?: UserRole[];
  className?: string;
  fallback?: ReactNode;
}

export function SecureLink({
  children,
  href,
  roles,
  className = '',
  fallback = null
}: SecureLinkProps) {
  const { canRender } = useSecureRender();

  const canRenderLink = canRender({
    roles,
    endpoint: href,
    method: 'GET'
  });

  if (!canRenderLink) {
    return <>{fallback}</>;
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/**
 * Secure form component that validates permissions on submit
 */
interface SecureFormProps {
  children: ReactNode;
  onSubmit?: (data: FormData) => void | Promise<void>;
  endpoint?: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  dataType?: string;
  className?: string;
  fallback?: ReactNode;
}

export function SecureForm({
  children,
  onSubmit,
  endpoint,
  method = 'POST',
  dataType,
  className = '',
  fallback
}: SecureFormProps) {
  const { canRender } = useSecureRender();

  const canSubmit = canRender({
    endpoint,
    method,
    dataType,
    action: 'write'
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!canSubmit) {
      // Usuario sin permiso para enviar formulario
      return;
    }

    const formData = new FormData(e.currentTarget);
    await onSubmit?.(formData);
  };

  if (!canSubmit && !fallback) {
    return null;
  }

  if (!canSubmit && fallback) {
    return <>{fallback}</>;
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}

/**
 * Security context provider for role-based UI
 */
import { createContext, useContext } from 'react';

interface SecurityContextType {
  user: any;
  role: UserRole | null;
  canRender: (options: {
    roles?: UserRole[];
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    dataType?: string;
    action?: 'read' | 'write' | 'delete';
  }) => boolean;
  hasPermission: (permission: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const secureRender = useSecureRender();

  const contextValue: SecurityContextType = {
    user: secureRender.user,
    role: secureRender.role,
    canRender: secureRender.canRender,
    hasPermission: (permission: string) => {
      // Implement custom permission logic
      return true;
    }
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
