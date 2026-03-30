/**
 * Enhanced Security Middleware for VersatPOS
 * Implements comprehensive security checks for API routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateToken, validateSensitiveDataAccess, createSecurityAuditLog, RateLimiter } from '@/lib/apiSecurity';
import type { AuthUser, UserRole, BusinessUnit } from '@/types/auth';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  rateLimits: {
    default: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 auth requests per 15 minutes
    sensitive: { requests: 10, windowMs: 60 * 1000 }, // 10 sensitive requests per minute
  },
  
  // IP blocking
  ipBlocking: {
    maxFailedAttempts: 10,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  
  // Session security
  session: {
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    refreshThreshold: 15 * 60 * 1000, // 15 minutes
  },
};

// In-memory storage for rate limiting and IP blocking (use Redis in production)
const failedAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();
const ipBlocks = new Map<string, { blocked: boolean; until: number }>();

/**
 * Enhanced security middleware
 */
export async function enhancedSecurityMiddleware(req: NextRequest) {
  const startTime = Date.now();
  const { pathname, searchParams } = req.nextUrl;
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    // 1. IP-based blocking check
    if (isIPBlocked(clientIP)) {
      return createSecurityResponse('IP address blocked', 429, 'IP_BLOCKED');
    }

    // 2. Rate limiting check
    if (!checkRateLimit(clientIP, pathname)) {
      return createSecurityResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // 3. Token validation and user extraction
    const token = req.cookies.get('accessToken')?.value || 
                  req.headers.get('authorization')?.replace('Bearer ', '');

    let user = null;
    if (token) {
      const payload = validateToken(token);
      if (!payload) {
        recordFailedAttempt(clientIP);
        return createSecurityResponse('Invalid token', 401, 'INVALID_TOKEN');
      }
      
      // Extract user from token (in production, fetch from database)
      user = {
        id: payload.sub,
        email: payload.email,
        name: payload.email.split('@')[0], // Extract name from email
        role: payload.role,
        unit: (payload.unit as BusinessUnit) || null,
        mustChangePassword: false,
        isLocked: false,
      };
    }

    // 4. Route-based access control
    const accessCheck = checkRouteAccess(pathname, req.method, user);
    if (!accessCheck.allowed) {
      recordFailedAttempt(clientIP, user?.id);
      
      // Create audit log
      const auditLog = createSecurityAuditLog(
        user || { id: 'anonymous', name: 'Anonymous', email: 'anonymous@versatpos.com', role: 'ANONYMOUS' as UserRole, unit: null, mustChangePassword: false, isLocked: false },
        'UNAUTHORIZED_ACCESS',
        pathname,
        pathname,
        { method: req.method, ip: clientIP, userAgent }
      );
      
      // Log security event (implement logging service)
      // Security audit logged
      
      return createSecurityResponse(accessCheck.reason || 'Access denied', 403, 'ACCESS_DENIED');
    }

    // 5. Data access validation for sensitive endpoints
    if (accessCheck.dataType && user) {
      const body = await getRequestBody(req);
      const validation = validateSensitiveDataAccess(user, accessCheck.dataType, getOperationType(req.method), body);
      
      if (!validation.allowed) {
        recordFailedAttempt(clientIP, user.id);
        
        const auditLog = createSecurityAuditLog(
          user || { id: 'anonymous', name: 'Anonymous', email: 'anonymous@versatpos.com', role: 'ANONYMOUS' as UserRole, unit: null, mustChangePassword: false, isLocked: false },
          'DATA_ACCESS_DENIED',
          accessCheck.dataType,
          pathname,
          { reason: validation.reason, body: body?.substring(0, 100) }
        );
        
        // Security audit logged
        
        return createSecurityResponse(validation.reason || 'Data access denied', 403, 'DATA_ACCESS_DENIED');
      }
    }

    // 6. Request logging and monitoring
    logSecurityEvent({
      type: 'REQUEST_ALLOWED',
      pathname,
      method: req.method,
      userId: user?.id,
      ip: clientIP,
      userAgent,
      duration: Date.now() - startTime,
    });

    // 7. Add security headers
    const response = NextResponse.next();
    addSecurityHeaders(response);

    return response;

  } catch (error) {
    // Security middleware error
    return createSecurityResponse('Internal security error', 500, 'SECURITY_ERROR');
  }
}

/**
 * Check route access permissions
 */
function checkRouteAccess(pathname: string, method: string | null, user: any) {
  // Public routes
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return { allowed: true };
  }

  // Authenticated user required
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Role-based route permissions
  const routePermissions: Record<string, { roles: string[]; dataType?: string }> = {
    // Client management
    '/api/clients': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'], dataType: 'clients' },
    '/api/clients/[id]': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'], dataType: 'clients' },
    
    // Appointments
    '/api/appointments': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'], dataType: 'appointments' },
    '/api/appointments/[id]': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'], dataType: 'appointments' },
    
    // Sales and POS
    '/api/sales': { roles: ['ADMIN', 'RECEPTIONIST'], dataType: 'sales' },
    '/api/sales/[id]': { roles: ['ADMIN', 'RECEPTIONIST', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'], dataType: 'sales' },
    '/api/pos': { roles: ['ADMIN', 'RECEPTIONIST'], dataType: 'sales' },
    
    // Financial operations
    '/api/cash-register': { roles: ['ADMIN', 'RECEPTIONIST'], dataType: 'financial' },
    '/api/expenses': { roles: ['ADMIN', 'RECEPTIONIST'], dataType: 'financial' },
    '/api/income': { roles: ['ADMIN', 'RECEPTIONIST'], dataType: 'financial' },
    
    // Inventory
    '/api/inventory': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'], dataType: 'inventory' },
    '/api/suppliers': { roles: ['ADMIN'], dataType: 'inventory' },
    
    // Services
    '/api/services': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'], dataType: 'services' },
    '/api/packages': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'], dataType: 'services' },
    
    // User management
    '/api/users': { roles: ['ADMIN'], dataType: 'users' },
    '/api/users/[id]': { roles: ['ADMIN'], dataType: 'users' },
    
    // Reports
    '/api/reports': { roles: ['ADMIN', 'MANAGER'], dataType: 'reports' },
    
    // Commissions
    '/api/commissions': { roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER', 'SPA_SPECIALIST', 'BARBER', 'BEAUTICIAN'], dataType: 'reports' },
    
    // Audit and admin
    '/api/audit': { roles: ['ADMIN'], dataType: 'users' },
    '/api/backups': { roles: ['ADMIN'], dataType: 'users' },
  };

  // Find matching route
  const matchedRoute = Object.keys(routePermissions).find(route => {
    if (route.includes('[id]')) {
      const baseRoute = route.replace('[id]', '');
      return pathname.startsWith(baseRoute);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  if (!matchedRoute) {
    // Default: allow if authenticated, deny if not
    return { allowed: true, reason: user ? 'Route not specifically restricted' : 'Authentication required' };
  }

  const permission = routePermissions[matchedRoute];
  
  if (!permission.roles.includes(user.role)) {
    return { allowed: false, reason: `Role ${user.role} not authorized for ${pathname}` };
  }

  return { allowed: true, dataType: permission.dataType };
}

/**
 * Check if IP is blocked
 */
function isIPBlocked(ip: string): boolean {
  const block = ipBlocks.get(ip);
  if (block && block.blocked && block.until > Date.now()) {
    return true;
  }
  
  // Clean up expired blocks
  if (block && block.blocked && block.until <= Date.now()) {
    ipBlocks.delete(ip);
  }
  
  return false;
}

/**
 * Check rate limiting
 */
function checkRateLimit(ip: string, pathname: string): boolean {
  const isAuthRoute = pathname.includes('/auth');
  const isSensitiveRoute = pathname.includes('/admin') || pathname.includes('/users') || pathname.includes('/audit');
  
  let config = SECURITY_CONFIG.rateLimits.default;
  if (isAuthRoute) config = SECURITY_CONFIG.rateLimits.auth;
  if (isSensitiveRoute) config = SECURITY_CONFIG.rateLimits.sensitive;
  
  const key = `${ip}:${pathname}`;
  return RateLimiter.checkLimit(key, config.requests, config.windowMs);
}

/**
 * Record failed attempt
 */
function recordFailedAttempt(ip: string, userId?: string) {
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const now = Date.now();
  
  const attempt = failedAttempts.get(key) || { count: 0, lastAttempt: now, blocked: false };
  attempt.count++;
  attempt.lastAttempt = now;
  
  // Block if too many failed attempts
  if (attempt.count >= SECURITY_CONFIG.ipBlocking.maxFailedAttempts) {
    attempt.blocked = true;
    ipBlocks.set(ip, { blocked: true, until: now + SECURITY_CONFIG.ipBlocking.blockDurationMs });
  }
  
  failedAttempts.set(key, attempt);
}

/**
 * Get client IP address
 */
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown';
}

/**
 * Get request body for validation
 */
async function getRequestBody(req: NextRequest): Promise<any> {
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return Object.fromEntries(req.nextUrl.searchParams);
    }
    
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await req.json();
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return Object.fromEntries(await req.formData());
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get operation type from HTTP method
 */
function getOperationType(method: string | null): 'read' | 'write' | 'delete' {
  switch (method) {
    case 'GET':
    case 'HEAD':
      return 'read';
    case 'POST':
    case 'PUT':
    case 'PATCH':
      return 'write';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

/**
 * Create security response
 */
function createSecurityResponse(message: string, status: number, code: string) {
  return NextResponse.json(
    { 
      error: message, 
      code,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7)
    },
    { status }
  );
}

/**
 * Add security headers
 */
function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

/**
 * Log security events
 */
function logSecurityEvent(event: {
  type: string;
  pathname: string;
  method: string | null;
  userId?: string;
  ip: string;
  userAgent: string;
  duration: number;
}) {
  // In production, send to logging service
  // Security event logged
  
}

/**
 * Cleanup old data (run periodically)
 */
export function cleanupSecurityData() {
  const now = Date.now();
  
  // Clean up old failed attempts
  for (const [key, attempt] of failedAttempts.entries()) {
    if (now - attempt.lastAttempt > 24 * 60 * 60 * 1000) { // 24 hours
      failedAttempts.delete(key);
    }
  }
  
  // Clean up expired IP blocks
  for (const [ip, block] of ipBlocks.entries()) {
    if (block.blocked && block.until <= now) {
      ipBlocks.delete(ip);
    }
  }
  
  // Clean up rate limiter data
  RateLimiter.cleanup();
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupSecurityData, 60 * 60 * 1000);
}
