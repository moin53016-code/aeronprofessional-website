import { NextRequest, NextResponse } from 'next/server';

import {
  deleteSession,
  clearSessionCookie,
} from '@/lib/auth';

import { csrfGuard } from '@/lib/csrf';

import { secureAdminResponse } from '@/lib/admin-api';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

const COOKIE_NAME = 'aeron_admin_session';

// ==========================================
// ADMIN LOGOUT
// ==========================================

export async function POST(
  request: NextRequest
) {
  // ========================================
  // CENTRALIZED CSRF PROTECTION
  // ========================================

  const csrfDenied = csrfGuard(request);

  if (csrfDenied) {
    return secureAdminResponse(csrfDenied);
  }

  // ========================================
  // READ ADMIN SESSION COOKIE
  // ========================================

  const token = request.cookies.get(
    COOKIE_NAME
  )?.value;

  let sessionRevoked = true;

  // ========================================
  // REVOKE DATABASE SESSION
  // ========================================

  if (token) {
    if (token.length > 4096) {
      sessionRevoked = false;
    } else {
      try {
        await deleteSession(token);

      } catch {
        sessionRevoked = false;

        console.error(
          '[AUTH] Failed to revoke admin session.'
        );
      }
    }
  }

  // ========================================
  // PREPARE COOKIE CLEARANCE
  // ========================================

  const cookieConfig =
    clearSessionCookie();

  // ========================================
  // CREATE LOGOUT RESPONSE
  // ========================================

  const response = NextResponse.json(
    {
      success: sessionRevoked,

      loggedOutLocally: true,

      sessionRevoked,

      message: sessionRevoked
        ? 'Logged out successfully.'
        : 'Browser session cleared, but database session revocation could not be confirmed.',
    },
    {
      status: sessionRevoked
        ? 200
        : 503,
    }
  );

  // ========================================
  // CLEAR BROWSER SESSION COOKIE
  // ========================================

  response.cookies.set(
    cookieConfig.name,
    cookieConfig.value,
    {
      httpOnly:
        cookieConfig.httpOnly,

      secure:
        cookieConfig.secure,

      sameSite:
        cookieConfig.sameSite,

      maxAge: 0,

      expires: new Date(0),

      path:
        cookieConfig.path,
    }
  );

  // ========================================
  // APPLY CENTRALIZED SECURITY HEADERS
  // ========================================

  return secureAdminResponse(response);
}