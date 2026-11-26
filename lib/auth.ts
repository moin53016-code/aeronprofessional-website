import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

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
      'AUTH_SECRET must contain at least 32 characters.'
    );
  }

  return new TextEncoder().encode(secret);
}

// ==========================================
// HASH SESSION TOKEN
// ==========================================

async function hashSessionToken(
  token: string
): Promise<string> {
  const encoded = new TextEncoder().encode(token);

  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoded
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) =>
      byte.toString(16).padStart(2, '0')
    )
    .join('');
}

// ==========================================
// CREATE ADMIN SESSION
// ==========================================

export async function createSession(
  userId: string
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  const expiresAt = new Date(
    (issuedAt + SESSION_DURATION) * 1000
  );

  const token = await new SignJWT({
    userId,
  })
    .setProtectedHeader({
      alg: 'HS256',
      typ: 'JWT',
    })
    .setJti(crypto.randomUUID())
    .setIssuedAt(issuedAt)
    .setExpirationTime(
      issuedAt + SESSION_DURATION
    )
    .sign(getSecret());

  // NEVER STORE THE ORIGINAL JWT IN DATABASE

  const tokenHash = await hashSessionToken(token);

  await prisma.adminSession.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
    },
  });

  return token;
}

// ==========================================
// VERIFY ADMIN SESSION
// ==========================================

export async function getSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    COOKIE_NAME
  )?.value;

  if (!token || token.length > 4096) {
    return null;
  }

  try {
    // VERIFY JWT SIGNATURE AND REQUIRED CLAIMS

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

    if (
      typeof payload.userId !== 'string' ||
      !payload.userId ||
      typeof payload.jti !== 'string' ||
      !payload.jti ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    // VALIDATE TOKEN LIFETIME

    const now = Math.floor(Date.now() / 1000);

    if (
      payload.iat > now ||
      payload.exp <= payload.iat ||
      payload.exp - payload.iat >
        SESSION_DURATION
    ) {
      return null;
    }

    // HASH TOKEN BEFORE DATABASE LOOKUP

    const tokenHash =
      await hashSessionToken(token);

    // VERIFY SESSION AGAINST DATABASE

    const session =
      await prisma.adminSession.findUnique({
        where: {
          token: tokenHash,
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

    // VALIDATE SESSION AND ADMIN ACCOUNT

    if (
      !session ||
      session.userId !== payload.userId ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      return null;
    }

    return {
      user: session.user,
      token,
    };
  } catch {
    // DO NOT EXPOSE TOKENS OR SENSITIVE ERROR DETAILS

    return null;
  }
}

// ==========================================
// REVOKE ADMIN SESSION
// ==========================================

export async function deleteSession(
  token: string
) {
  if (!token || token.length > 4096) {
    return;
  }

  const tokenHash =
    await hashSessionToken(token);

  await prisma.adminSession.deleteMany({
    where: {
      OR: [
        {
          token: tokenHash,
        },
        {
          // ALLOW CLEANUP OF LEGACY RAW TOKEN

          token,
        },
      ],
    },
  });
}

// ==========================================
// CREATE SECURE SESSION COOKIE
// ==========================================

export function setSessionCookie(
  token: string
) {
  return {
    name: COOKIE_NAME,

    value: token,

    httpOnly: true,

    secure:
      process.env.NODE_ENV === 'production',

    sameSite: 'strict' as const,

    maxAge: SESSION_DURATION,

    path: '/',
  };
}

// ==========================================
// CLEAR SESSION COOKIE
// ==========================================

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,

    value: '',

    httpOnly: true,

    secure:
      process.env.NODE_ENV === 'production',

    sameSite: 'strict' as const,

    maxAge: 0,

    path: '/',
  };
}