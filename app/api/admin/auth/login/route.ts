import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

import {
  createSession,
  setSessionCookie,
} from '@/lib/auth';

import {
  checkLoginRateLimit,
} from '@/lib/login-rate-limit';

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
// LOGIN VALIDATION
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
        new TextEncoder().encode(password).length <= 72,
      'Invalid password length.'
    ),
});

// ==========================================
// SECURE RESPONSE HEADERS
// ==========================================

function secureResponse(response: NextResponse) {
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

  return response;
}

// ==========================================
// STANDARD ERROR RESPONSE
// ==========================================

function loginError(
  message: string,
  status: number
) {
  return secureResponse(
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
    // VALIDATE REQUEST CONTENT TYPE

    const contentType =
      request.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase();

    if (contentType !== 'application/json') {
      return loginError(
        'Invalid request format.',
        415
      );
    }

    // PARSE REQUEST BODY

    const body = await request
      .json()
      .catch(() => null);

    // VALIDATE LOGIN INPUT

    const result =
      loginSchema.safeParse(body);

    if (!result.success) {
      return loginError(
        'Invalid email or password.',
        400
      );
    }

    const { email, password } = result.data;

    // ======================================
    // DATABASE-BACKED RATE LIMITING
    // ======================================

    const rateLimit =
      await checkLoginRateLimit(email);

    if (!rateLimit.allowed) {
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
    // TIMING ATTACK PROTECTION
    // ======================================

    const passwordHash =
      user?.isActive
        ? user.passwordHash
        : DUMMY_PASSWORD_HASH;

    const isValidPassword =
      await bcrypt.compare(
        password,
        passwordHash
      );

    // SAME ERROR FOR UNKNOWN EMAIL,
    // INACTIVE ACCOUNT AND WRONG PASSWORD

    if (
      !user ||
      !user.isActive ||
      !isValidPassword
    ) {
      return loginError(
        'Invalid email or password.',
        401
      );
    }

    // ======================================
    // CREATE SECURE ADMIN SESSION
    // ======================================

    const token =
      await createSession(user.id);

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
    // RETURN SECURE RESPONSE
    // ======================================

    return secureResponse(response);

  } catch {
    // DO NOT LOG PASSWORDS, SESSION TOKENS
    // OR SENSITIVE DATABASE ERROR DETAILS

    console.error(
      '[AUTH] Admin login request failed.'
    );

    return loginError(
      'Unable to log in. Please try again later.',
      500
    );
  }
}