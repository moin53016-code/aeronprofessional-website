import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  getSession,
  deleteSession,
  clearSessionCookie,
} from '@/lib/auth';

import {
  csrfGuard,
} from '@/lib/csrf';

import {
  secureAdminResponse,
} from '@/lib/admin-api';

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUDIT_REASONS,
  writeAuditLog,
} from '@/lib/audit-log';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// SESSION COOKIE CONFIGURATION
// ==========================================

const COOKIE_NAME = 'aeron_admin_session';

const MAX_TOKEN_LENGTH = 4096;

// ==========================================
// ADMIN LOGOUT
// ==========================================

export async function POST(
  request: NextRequest
) {

  // ========================================
  // CENTRALIZED CSRF PROTECTION
  // ========================================

  const csrfDenied =
    csrfGuard(request);

  if (csrfDenied) {
    return secureAdminResponse(
      csrfDenied
    );
  }

  // ========================================
  // READ ADMIN SESSION COOKIE
  // ========================================

  const token =
    request.cookies.get(
      COOKIE_NAME
    )?.value;

  // ========================================
  // SESSION REVOCATION STATE
  // ========================================

  let sessionRevoked = true;

  let adminId: string | null = null;

  // ========================================
  // VERIFY AND REVOKE EXISTING SESSION
  // ========================================

  if (token) {

    // REJECT OVERSIZED SESSION TOKENS

    if (
      token.length > MAX_TOKEN_LENGTH
    ) {

      sessionRevoked = false;

    } else {

      // ====================================
      // IDENTIFY AUTHENTICATED ADMIN
      //
      // VERIFY THE SESSION BEFORE DELETING
      // IT FROM THE DATABASE.
      // ====================================

      try {

        const session =
          await getSession();

        if (
          session &&
          session.token === token
        ) {

          adminId =
            session.user.id;

        }

      } catch {

        // SESSION IDENTIFICATION FAILURE
        // MUST NOT PREVENT LOGOUT.

        adminId = null;

      }

      // ====================================
      // REVOKE DATABASE SESSION
      // ====================================

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
  // RECORD AUTHENTICATED ADMIN LOGOUT
  //
  // NEVER CREATE AUDIT RECORDS FOR
  // UNVERIFIED OR ANONYMOUS LOGOUT REQUESTS.
  // ========================================

  if (adminId) {

    if (sessionRevoked) {

      // SUCCESSFUL SESSION REVOCATION

      await writeAuditLog({
        adminId,

        action:
          AUDIT_ACTIONS.LOGOUT,

        entityType:
          AUDIT_ENTITIES.ADMIN_USER,

        entityId:
          adminId,
      });

    } else {

      // FAILED SESSION REVOCATION

      await writeAuditLog({
        adminId,

        action:
          AUDIT_ACTIONS.LOGOUT_FAILED,

        entityType:
          AUDIT_ENTITIES.ADMIN_USER,

        entityId:
          adminId,

        reason:
          AUDIT_REASONS.SESSION_REVOCATION_FAILED,
      });

    }
  }

  // ========================================
  // PREPARE SECURE COOKIE CLEARANCE
  // ========================================

  const cookieConfig =
    clearSessionCookie();

  // ========================================
  // CREATE LOGOUT RESPONSE
  // ========================================

  const response = NextResponse.json(
    {
      success:
        sessionRevoked,

      loggedOutLocally:
        true,

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
  //
  // CLEAR THE COOKIE EVEN IF DATABASE
  // SESSION REVOCATION FAILS.
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

      expires:
        new Date(0),

      path:
        cookieConfig.path,
    }
  );

  // ========================================
  // RETURN SECURE LOGOUT RESPONSE
  // ========================================

  return secureAdminResponse(
    response
  );
}