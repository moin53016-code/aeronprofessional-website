
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'aeron_admin_session';

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET is not configured securely.');
  }

  return new TextEncoder().encode(secret);
}

export async function middleware(
  request: NextRequest
) {
  const { pathname } = request.nextUrl;

  const isApi =
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/');

  const isLogin =
    pathname === '/admin/login';

  const requestHeaders = new Headers(request.headers);

  // Never trust a client-supplied login-page marker.
  requestHeaders.delete('x-aeron-login-page');

  if (isLogin) {
    requestHeaders.set('x-aeron-login-page', 'true');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (
    pathname === '/api/admin/auth/login' ||
    pathname === '/api/admin/auth/logout'
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  try {
    if (!token) {
      throw new Error('Missing admin session');
    }

    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ['HS256'],
      }
    );

    if (typeof payload.userId !== 'string') {
      throw new Error('Invalid session');
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    const response = isApi
      ? NextResponse.json(
          {
            error: 'Unauthorized. Please log in.',
          },
          {
            status: 401,
          }
        )
      : NextResponse.redirect(
          new URL('/admin/login', request.url)
        );

    response.cookies.delete(COOKIE_NAME);

    return response;
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
