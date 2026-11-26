import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { prisma } from '@/lib/db';

import {
  createSession,
  setSessionCookie,
} from '@/lib/auth';

import {
  checkLoginRateLimit,
} from '@/lib/login-rate-limit';

import {
  csrfGuard,
} from '@/lib/csrf';

import {
  secureAdminResponse,
} from '@/lib/admin-api';

import {
  isValidRole,
} from '@/lib/permissions';

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUDIT_REASONS,
  writeAuditLog,
} from '@/lib/audit-log';

import bcrypt from 'bcryptjs';

import { z } from 'zod';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// DUMMY PASSWORD HASH
// TIMING ATTACK PROTECTION
// ==========================================

const DUMMY_PASSWORD_HASH =
  '$2y$12$sLd/y/iEO5pqFM4MDXXM1OWHf3c2CHXGRj1ofMKWQ9489z2lJOmzi';

// ==========================================
// LOGIN INPUT VALIDATION
// ==========================================

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .email(),

  password: z
    .string()
    .min(1)
    .max(72)
    .refine(
      (password) =>
        new TextEncoder()
          .encode(password)
          .length <= 72,

      'Invalid password length.'
    ),
});

// ==========================================
// SECURE LOGIN ERROR RESPONSE
// ==========================================

function loginError(
  message: string,

  status: number
) {

  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error: message,
      },
      {
        status,
      }
    )
  );
}

// ==========================================
// ADMIN LOGIN
// ==========================================

export async function POST(
  request: NextRequest
) {

  try {

    // ======================================
    // ROUTE-LEVEL CSRF PROTECTION
    // ======================================

    const csrfDenied =
      csrfGuard(request);

    if (csrfDenied) {
      return secureAdminResponse(
        csrfDenied
      );
    }

    // ======================================
    // VALIDATE REQUEST CONTENT TYPE
    // ======================================

    const contentType =
      request.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase();

    if (
      contentType !== 'application/json'
    ) {
      return loginError(
        'Invalid request format.',

        415
      );
    }

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE LOGIN INPUT
    // ======================================

    const result =
      loginSchema.safeParse(body);

    if (!result.success) {
      return loginError(
        'Invalid email or password.',

        400
      );
    }

    const {
      email,
      password,
    } = result.data;

    // ======================================
    // DATABASE-BACKED LOGIN RATE LIMITING
    // ======================================

    const rateLimit =
      await checkLoginRateLimit(
        email
      );

    if (!rateLimit.allowed) {

      // DO NOT CREATE A DATABASE AUDIT RECORD
      // FOR EVERY BLOCKED REQUEST.
      //
      // THIS PREVENTS UNLIMITED AUDIT LOG
      // WRITES DURING LOGIN FLOODING.

      const response = loginError(
        'Too many login attempts. Please try again later.',

        429
      );

      response.headers.set(
        'Retry-After',

        String(rateLimit.retryAfter)
      );

      return response;
    }

    // ======================================
    // FIND ADMIN ACCOUNT
    // ======================================

    const user =
      await prisma.adminUser.findUnique({
        where: {
          email,
        },

        select: {
          id: true,

          email: true,

          name: true,

          role: true,

          isActive: true,

          passwordHash: true,
        },
      });

    // ======================================
    // VALIDATE ADMIN ACCOUNT ELIGIBILITY
    // ======================================

    const isEligibleAccount =
      Boolean(
        user &&
        user.isActive &&
        isValidRole(user.role)
      );

    // ======================================
    // TIMING ATTACK PROTECTION
    // ======================================

    const passwordHash =
      user && isEligibleAccount
        ? user.passwordHash
        : DUMMY_PASSWORD_HASH;

    const isValidPassword =
      await bcrypt.compare(
        password,

        passwordHash
      );

    // ======================================
    // HANDLE FAILED LOGIN
    // ======================================

    if (
      !user ||
      !isEligibleAccount ||
      !isValidPassword
    ) {

      // RECORD FAILED AUTHENTICATION ATTEMPT
      //
      // NEVER STORE EMAIL INPUT, PASSWORD,
      // PASSWORD HASH OR REQUEST BODY.
      //
      // THE REQUEST HAS ALREADY PASSED
      // DATABASE-BACKED RATE LIMITING.

      await writeAuditLog({
        action:
          AUDIT_ACTIONS.LOGIN_FAILED,

        entityType:
          AUDIT_ENTITIES.SECURITY,

        reason:
          AUDIT_REASONS.INVALID_CREDENTIALS,
      });

      // SAME RESPONSE FOR:
      // - UNKNOWN EMAIL
      // - WRONG PASSWORD
      // - INACTIVE ACCOUNT
      // - INVALID ROLE

      return loginError(
        'Invalid email or password.',

        401
      );
    }

    // ======================================
    // CREATE SECURE ADMIN SESSION
    // ======================================

    const token =
      await createSession(
        user.id
      );

    // ======================================
    // GENERATE SECURE COOKIE CONFIGURATION
    // ======================================

    const cookieConfig =
      setSessionCookie(token);

    // ======================================
    // CREATE LOGIN RESPONSE
    // ======================================

    const response = NextResponse.json({
      success: true,

      user: {
        id: user.id,

        email: user.email,

        name: user.name,

        role: user.role,
      },
    });

    // ======================================
    // SET SECURE SESSION COOKIE
    // ======================================

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

        maxAge:
          cookieConfig.maxAge,

        path:
          cookieConfig.path,
      }
    );

    // ======================================
    // RECORD SUCCESSFUL AUTHENTICATION
    //
    // ONLY VERIFIED ADMIN IDENTIFIERS
    // ARE INCLUDED IN THE AUDIT RECORD.
    // ======================================

    await writeAuditLog({
      adminId:
        user.id,

      action:
        AUDIT_ACTIONS.LOGIN_SUCCESS,

      entityType:
        AUDIT_ENTITIES.ADMIN_USER,

      entityId:
        user.id,
    });

    // ======================================
    // RETURN SECURE LOGIN RESPONSE
    // ======================================

    return secureAdminResponse(
      response
    );

  } catch {

    // ======================================
    // SAFE AUTHENTICATION ERROR LOGGING
    //
    // NEVER EXPOSE:
    // - PASSWORDS
    // - SESSION TOKENS
    // - DATABASE CONNECTION STRINGS
    // - SENSITIVE ERROR DETAILS
    // ======================================

    console.error(
      '[AUTH] Admin login request failed.'
    );

    return loginError(
      'Unable to log in. Please try again later.',

      500
    );
  }
}