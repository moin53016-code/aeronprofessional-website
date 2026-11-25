
import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const COOKIE_NAME = 'aeron_admin_session';
const SESSION_DURATION = 24 * 60 * 60;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET must contain at least 32 characters.'
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(
  userId: string
): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION * 1000
  );

  await prisma.adminSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ['HS256'],
      }
    );

    if (typeof payload.userId !== 'string') {
      return null;
    }

    const session = await prisma.adminSession.findUnique({
      where: { token },
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
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function deleteSession(token: string) {
  await prisma.adminSession.deleteMany({
    where: { token },
  });
}

export function setSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  };
}