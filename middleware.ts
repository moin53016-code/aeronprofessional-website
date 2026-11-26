import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { jwtVerify } from 'jose/jwt/verify';

import { csrfGuard } from '@/lib/csrf';

// ==========================================
// SESSION CONFIGURATION
// ==========================================

const COOKIE_NAME = 'aeron_admin_session';

const SESSION_DURATION = 24 * 60 * 60;

// ==========================================
// VALIDATE AUTH SECRET
// ==========================================

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET is not configured securely.'
    );
  }

  return new TextEncoder().encode(secret);
}

// ==========================================
// SECURE ADMIN RESPONSE HEADERS
// ==========================================

function preventCaching(
  response: NextResponse
) {
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private'
  );

  response.headers.set(
    'Pragma',
    'no-cache'
  );

  response.headers.set(
    'Expires',
    '0'
  );

  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive'
  );

  response.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  );

  return response;
}

// ==========================================
// FORWARD AUTHORIZED REQUEST
// ==========================================

function forwardRequest(
  requestHeaders: Headers
) {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return preventCaching(response);
}

// ==========================================
// ADMIN SECURITY MIDDLEWARE
// ==========================================

export async function middleware(
  request: NextRequest
) {
  const { pathname } = request.nextUrl;

  const isApi =
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/');

  const isLogin =
    pathname === '/admin/login';

  const requestHeaders = new Headers(
    request.headers
  );

  // ========================================
  // PREVENT CLIENT HEADER SPOOFING
  // ========================================

  requestHeaders.delete(
    'x-aeron-login-page'
  );

  // ========================================
  // GLOBAL ADMIN API CSRF PROTECTION
  // ========================================

  if (isApi) {
    const denied = csrfGuard(request);

    if (denied) {
      return preventCaching(denied);
    }
  }

  // ========================================
  // ALLOW ACCESS TO ADMIN LOGIN PAGE
  // ========================================

  if (isLogin) {
    requestHeaders.set(
      'x-aeron-login-page',
      'true'
    );

    return forwardRequest(
      requestHeaders
    );
  }

  // ========================================
  // ALLOW AUTHENTICATION ENDPOINTS
  // AFTER CSRF VALIDATION
  // ========================================

  if (
    pathname === '/api/admin/auth/login' ||
    pathname === '/api/admin/auth/logout'
  ) {
    return forwardRequest(
      requestHeaders
    );
  }

  // ========================================
  // READ ADMIN SESSION COOKIE
  // ========================================

  const token = request.cookies.get(
    COOKIE_NAME
  )?.value;

  try {
    // REJECT MISSING OR OVERSIZED TOKENS

    if (!token || token.length > 4096) {
      throw new Error(
        'Invalid admin session.'
      );
    }

    // ======================================
    // VERIFY JWT SIGNATURE
    // ======================================

    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ['HS256'],

        requiredClaims: [
          'userId',
          'jti',
          'iat',
          'exp',
        ],
      }
    );

    // ======================================
    // VALIDATE JWT CLAIM TYPES
    // ======================================

    if (
      typeof payload.userId !== 'string' ||
      !payload.userId ||
      typeof payload.jti !== 'string' ||
      !payload.jti ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      throw new Error(
        'Invalid session claims.'
      );
    }

    // ======================================
    // VALIDATE SESSION LIFETIME
    // ======================================

    const now = Math.floor(
      Date.now() / 1000
    );

    if (
      payload.iat > now ||
      payload.exp <= payload.iat ||
      payload.exp - payload.iat >
        SESSION_DURATION
    ) {
      throw new Error(
        'Invalid session lifetime.'
      );
    }

    // ======================================
    // FORWARD FOR DATABASE SESSION CHECK
    // ======================================

    return forwardRequest(
      requestHeaders
    );

  } catch {
    // ======================================
    // HANDLE UNAUTHORIZED REQUEST
    // ======================================

    const response = isApi
      ? NextResponse.json(
          {
            success: false,

            error:
              'Unauthorized. Please log in.',
          },
          {
            status: 401,
          }
        )
      : NextResponse.redirect(
          new URL(
            '/admin/login',
            request.url
          )
        );

    // ======================================
    // CLEAR INVALID SESSION COOKIE
    // ======================================

    response.cookies.set(
      COOKIE_NAME,
      '',
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV === 'production',

        sameSite: 'strict',

        maxAge: 0,

        expires: new Date(0),

        path: '/',
      }
    );

    return preventCaching(response);
  }
}

// ==========================================
// PROTECTED ADMIN ROUTES
// ==========================================

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};