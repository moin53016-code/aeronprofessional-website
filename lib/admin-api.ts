import 'server-only';

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth';

import { csrfGuard } from '@/lib/csrf';

import {
  isValidRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@/lib/permissions';

import type {
  Permission,
} from '@/lib/permissions';

import type {
  Role,
} from '@/generated/prisma/enums';

import {
  createAuditLog,
  writeAuditLog,
} from '@/lib/audit-log';

import type {
  AuditAction,
  AuditEntity,
  AuditReason,
} from '@/lib/audit-log';

import type {
  Prisma,
} from '@/generated/prisma/client';

// ==========================================
// ADMIN SECURITY OPTIONS
// ==========================================

interface AdminSecurityOptions {
  request?: NextRequest;

  allowedRoles?: readonly Role[];

  permission?: Permission;

  permissions?: readonly Permission[];

  permissionMode?: 'all' | 'any';
}

// ==========================================
// VERIFIED ADMIN USER TYPE
// ==========================================

export interface VerifiedAdminUser {
  id: string;

  email: string;

  name: string;

  role: Role;

  isActive: boolean;
}

// ==========================================
// ADMIN AUTHORIZATION RESULT
// ==========================================

export type AdminAuthorizationResult =
  | {
      ok: true;

      user: VerifiedAdminUser;
    }
  | {
      ok: false;

      response: NextResponse;
    };

// ==========================================
// ADMIN AUDIT EVENT TYPE
// ==========================================

interface AdminAuditEvent {
  action: AuditAction;

  entityType?: AuditEntity;

  entityId?: string | null;

  reason?: AuditReason;
}

// ==========================================
// SECURE RESPONSE HEADERS
// ==========================================

export function secureAdminResponse(
  response: NextResponse
): NextResponse {

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
    'X-Content-Type-Options',
    'nosniff'
  );

  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive'
  );

  return response;
}

// ==========================================
// UNAUTHORIZED RESPONSE
// ==========================================

export function unauthorizedResponse() {

  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error:
          'Unauthorized. Please log in.',
      },
      {
        status: 401,
      }
    )
  );
}

// ==========================================
// FORBIDDEN RESPONSE
// ==========================================

export function forbiddenResponse() {

  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error:
          'You do not have permission to perform this action.',
      },
      {
        status: 403,
      }
    )
  );
}

// ==========================================
// CENTRALIZED ADMIN AUTHORIZATION
//
// RETURNS:
// - VERIFIED ADMIN USER
// OR
// - SECURE ERROR RESPONSE
//
// NEVER RETURNS RAW SESSION TOKENS.
// ==========================================

export async function authorizeAdmin(
  options: AdminSecurityOptions = {}
): Promise<AdminAuthorizationResult> {

  // ========================================
  // VERIFY REQUEST ORIGIN
  // ========================================

  if (options.request) {

    const denied =
      csrfGuard(options.request);

    if (denied) {

      return {
        ok: false,

        response:
          secureAdminResponse(denied),
      };

    }
  }

  // ========================================
  // VERIFY DATABASE SESSION
  // ========================================

  const session =
    await getSession();

  if (!session) {

    return {
      ok: false,

      response:
        unauthorizedResponse(),
    };

  }

  // ========================================
  // VERIFY ACTIVE ADMIN ACCOUNT
  // ========================================

  if (!session.user.isActive) {

    return {
      ok: false,

      response:
        unauthorizedResponse(),
    };

  }

  const role =
    session.user.role;

  // ========================================
  // REJECT INVALID ADMIN ROLES
  // ========================================

  if (!isValidRole(role)) {

    return {
      ok: false,

      response:
        forbiddenResponse(),
    };

  }

  // ========================================
  // CHECK ROLE RESTRICTIONS
  // ========================================

  if (
    options.allowedRoles &&
    !options.allowedRoles.includes(role)
  ) {

    return {
      ok: false,

      response:
        forbiddenResponse(),
    };

  }

  // ========================================
  // CHECK INDIVIDUAL PERMISSION
  // ========================================

  if (
    options.permission &&
    !hasPermission(
      role,
      options.permission
    )
  ) {

    return {
      ok: false,

      response:
        forbiddenResponse(),
    };

  }

  // ========================================
  // CHECK MULTIPLE PERMISSIONS
  // ========================================

  if (options.permissions) {

    const permitted =
      options.permissionMode === 'any'
        ? hasAnyPermission(
            role,
            options.permissions
          )
        : hasAllPermissions(
            role,
            options.permissions
          );

    if (!permitted) {

      return {
        ok: false,

        response:
          forbiddenResponse(),
      };

    }
  }

  // ========================================
  // RETURN SAFE VERIFIED ADMIN INFORMATION
  //
  // NEVER RETURN PASSWORD HASHES,
  // JWT TOKENS OR SESSION COOKIES.
  // ========================================

  return {
    ok: true,

    user: {
      id:
        session.user.id,

      email:
        session.user.email,

      name:
        session.user.name,

      role,

      isActive:
        session.user.isActive,
    },
  };
}

// ==========================================
// BACKWARD-COMPATIBLE ADMIN SECURITY GUARD
//
// EXISTING ADMIN API ROUTES CAN CONTINUE
// USING adminDenied() WITHOUT MODIFICATION.
// ==========================================

export async function adminDenied(
  options: AdminSecurityOptions = {}
): Promise<NextResponse | null> {

  const authorization =
    await authorizeAdmin(options);

  if (!authorization.ok) {

    return authorization.response;

  }

  return null;
}

// ==========================================
// MANDATORY ADMIN ACTION AUDIT LOGGING
//
// SUPPORTS DATABASE TRANSACTIONS.
//
// WHEN USED WITH THE SAME TRANSACTION,
// BOTH THE DATABASE MUTATION AND AUDIT
// RECORD MUST SUCCEED TOGETHER.
// ==========================================

export async function recordAdminAction(
  user: VerifiedAdminUser,

  event: AdminAuditEvent,

  database?: Pick<
    Prisma.TransactionClient,
    'auditLog'
  >
): Promise<void> {

  await createAuditLog(
    {
      adminId:
        user.id,

      action:
        event.action,

      entityType:
        event.entityType,

      entityId:
        event.entityId,

      reason:
        event.reason,
    },

    database
  );
}

// ==========================================
// BEST-EFFORT ADMIN ACTION AUDIT LOGGING
//
// USE FOR OPERATIONS WHERE AUDIT FAILURE
// MUST NOT INTERRUPT THE MAIN OPERATION.
//
// DO NOT USE AS A SUBSTITUTE FOR
// TRANSACTIONAL AUDIT LOGGING WHEN
// ATOMIC DATABASE CHANGES ARE REQUIRED.
// ==========================================

export async function recordAdminActionSafely(
  user: VerifiedAdminUser,

  event: AdminAuditEvent
): Promise<boolean> {

  return writeAuditLog({
    adminId:
      user.id,

    action:
      event.action,

    entityType:
      event.entityType,

    entityId:
      event.entityId,

    reason:
      event.reason,
  });
}

// ==========================================
// HANDLE INVALID API INPUT
// ==========================================

export function badInput(
  error = 'Invalid input',

  details?: unknown
) {

  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error,

        details,
      },
      {
        status: 400,
      }
    )
  );
}

// ==========================================
// EXTRACT SAFE DATABASE ERROR CODE
// ==========================================

function getDatabaseErrorCode(
  error: unknown
): string | undefined {

  if (
    !error ||
    typeof error !== 'object' ||
    !('code' in error)
  ) {

    return undefined;

  }

  const code = error.code;

  if (
    typeof code === 'string' &&
    /^P[0-9]{4}$/.test(code)
  ) {

    return code;

  }

  return undefined;
}

// ==========================================
// CENTRALIZED API ERROR HANDLING
// ==========================================

export function apiError(
  error: unknown,

  resource: string
) {

  const code =
    getDatabaseErrorCode(error);

  // ========================================
  // SAFE ERROR LOGGING
  // ========================================

  console.error(
    `[ADMIN API] ${resource} request failed.`,
    {
      code:
        code ?? 'UNKNOWN',
    }
  );

  // ========================================
  // RECORD NOT FOUND
  // ========================================

  if (code === 'P2025') {

    return secureAdminResponse(
      NextResponse.json(
        {
          success: false,

          error:
            `${resource} not found`,
        },
        {
          status: 404,
        }
      )
    );

  }

  // ========================================
  // UNIQUE CONSTRAINT VIOLATION
  // ========================================

  if (code === 'P2002') {

    return secureAdminResponse(
      NextResponse.json(
        {
          success: false,

          error:
            'A record with these unique details already exists',
        },
        {
          status: 409,
        }
      )
    );

  }

  // ========================================
  // INVALID RELATED DATABASE RECORD
  // ========================================

  if (code === 'P2003') {

    return badInput(
      'One or more related records no longer exist. Refresh and try again.'
    );

  }

  // ========================================
  // DATABASE CONNECTION ERRORS
  // ========================================

  if (
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1017' ||
    code === 'P2024'
  ) {

    return secureAdminResponse(
      NextResponse.json(
        {
          success: false,

          error:
            'Service temporarily unavailable. Please try again later.',
        },
        {
          status: 503,
        }
      )
    );

  }

  // ========================================
  // GENERIC INTERNAL SERVER ERROR
  // ========================================

  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error:
          `Unable to process ${resource.toLowerCase()}`,
      },
      {
        status: 500,
      }
    )
  );
}

// ==========================================
// REFRESH WEBSITE AND ADMIN DATA
// ==========================================

export function refreshAdmin(
  path: string
) {

  revalidatePath('/');

  revalidatePath('/admin');

  revalidatePath(path);

}