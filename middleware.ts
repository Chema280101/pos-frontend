import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enhancedSecurityMiddleware } from '@/middleware/enhancedSecurity';

const publicPaths = ['/login', '/register', '/api/auth'];
const privatePaths = ['/dashboard', '/clients', '/appointments', '/services', '/pos', '/inventory', '/reports', '/commissions', '/cash-register', '/expenses', '/income', '/packages', '/suppliers', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for private routes without authentication
  const isPrivatePath = privatePaths.some(path => pathname.startsWith(path));
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Get token from cookie or header
  const token = req.cookies.get('accessToken')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  // Redirect to login if trying to access private route without token
  if (isPrivatePath && !token && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Use enhanced security middleware for all routes
  return enhancedSecurityMiddleware(req);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
