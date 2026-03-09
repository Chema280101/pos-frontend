import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get token from cookie (using custom token approach)
  const token = req.cookies.get('accessToken')?.value;

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decode JWT token to get user role
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role as string;

    // Define restricted paths for different roles
    const adminRestrictedPaths = [
      '/admin'
    ];

    const receptionistRestrictedPaths = [
      '/dashboard',
      '/suppliers',
      '/reports',
      '/admin'
    ];

    const specialistRestrictedPaths = [
      '/dashboard',
      '/clients',
      '/pos',
      '/cash-register',
      '/expenses',
      '/income',
      '/inventory',
      '/suppliers',
      '/services',
      '/packages',
      '/reports',
      '/admin'
    ];

    // Check restrictions based on user role
    if (userRole === 'ADMIN' && adminRestrictedPaths.some(path => pathname.startsWith(path))) {
      // ADMIN has no restrictions except admin paths (which they can access)
      return NextResponse.next();
    }

    if (userRole === 'RECEPTIONIST' && receptionistRestrictedPaths.some(path => pathname.startsWith(path))) {
      // RECEPTIONIST can access: clients, appointments, pos, cash-register, expenses, income, inventory, services, packages, commissions
      // RECEPTIONIST cannot access: dashboard, suppliers, reports, admin
      if (pathname.startsWith('/appointments') || pathname.startsWith('/commissions')) {
        return NextResponse.next();
      }
      
      // Redirect to appointments if trying to access restricted paths
      const appointmentsUrl = new URL('/appointments', req.url);
      return NextResponse.redirect(appointmentsUrl);
    }

    if ((userRole === 'BARBER' || userRole === 'SPA_SPECIALIST') && 
        specialistRestrictedPaths.some(path => pathname.startsWith(path))) {
      
      // Allow only appointments and commissions for these roles
      if (pathname.startsWith('/appointments') || pathname.startsWith('/commissions')) {
        return NextResponse.next();
      }

      // Redirect to appointments if trying to access restricted paths
      const appointmentsUrl = new URL('/appointments', req.url);
      return NextResponse.redirect(appointmentsUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
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
