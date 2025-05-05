import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/utils/auth';

interface JwtPayload {
  id: string;
  username: string;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Allow access to login page, create-admin page, and auth API routes
  if (
    pathname === '/login' || 
    pathname === '/create-admin' || 
    pathname.startsWith('/api/auth')
  ) {
    // If user is already logged in and tries to access login page, redirect to home
    if (pathname === '/login' && token) {
      try {
        const decoded = verifyToken(token) as JwtPayload;
        if (decoded) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (error) {
        // If token is invalid, continue to login page
      }
    }
    return NextResponse.next();
  }

  // Allow access to static files and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const decoded = verifyToken(token) as JwtPayload;
    if (!decoded) {
      throw new Error('Invalid token');
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-username', decoded.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 