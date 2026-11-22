import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-secret-change-in-production-32chars'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Public authentication endpoints
  // Login must be accessible without an existing session.
  if (pathname === '/api/admin/auth/login') {
    return NextResponse.next();
  }

  // Protect admin pages
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = request.cookies.get('aeron_admin_session')?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL('/admin/login', request.url)
      );
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(
        new URL('/admin/login', request.url)
      );

      response.cookies.delete('aeron_admin_session');
      return response;
    }
  }

  // Protect all other admin API endpoints
  if (
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  ) {
    const token = request.cookies.get('aeron_admin_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};