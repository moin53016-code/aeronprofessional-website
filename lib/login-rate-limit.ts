import 'server-only';

import { prisma } from './db';

// ==========================================
// RATE LIMIT CONFIGURATION
// ==========================================

const ACCOUNT_MAX_ATTEMPTS = 5;
const ACCOUNT_WINDOW_SECONDS = 15 * 60;

const GLOBAL_MAX_ATTEMPTS = 60;
const GLOBAL_WINDOW_SECONDS = 60;

// ==========================================
// TYPES
// ==========================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

interface RateLimitRow {
  attempts: number;
  retryAfter: number;
}

// ==========================================
// GENERATE PRIVATE ACCOUNT IDENTIFIER
// ==========================================

async function getAccountKey(
  email: string
): Promise<string> {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET is not configured securely.'
    );
  }

  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(
      `login-rate-limit:${normalizedEmail}`
    )
  );

  const hash = Array.from(
    new Uint8Array(signature)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, '0')
    )
    .join('');

  return `account:${hash}`;
}

// ==========================================
// ATOMIC DATABASE RATE LIMIT
// ==========================================

async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<
    RateLimitRow[]
  >`
    INSERT INTO "admin_login_rate_limits" AS bucket
    (
      "key",
      "attempts",
      "expires_at"
    )
    VALUES
    (
      ${key},
      1,
      CURRENT_TIMESTAMP
        + (
          ${windowSeconds}::integer
          * INTERVAL '1 second'
        )
    )

    ON CONFLICT ("key")

    DO UPDATE SET

      "attempts" = CASE
        WHEN bucket."expires_at" <= CURRENT_TIMESTAMP
          THEN 1
        ELSE LEAST(
          bucket."attempts" + 1,
          ${maxAttempts + 1}::integer
        )
      END,

      "expires_at" = CASE
        WHEN bucket."expires_at" <= CURRENT_TIMESTAMP
          THEN CURRENT_TIMESTAMP
            + (
              ${windowSeconds}::integer
              * INTERVAL '1 second'
            )
        ELSE bucket."expires_at"
      END

    RETURNING

      "attempts",

      GREATEST(
        1,
        CEIL(
          EXTRACT(
            EPOCH FROM (
              "expires_at" - CURRENT_TIMESTAMP
            )
          )
        )
      )::integer AS "retryAfter"
  `;

  const result = rows[0];

  if (!result) {
    throw new Error(
      'Unable to verify login rate limit.'
    );
  }

  const allowed =
    result.attempts <= maxAttempts;

  return {
    allowed,

    remaining: Math.max(
      0,
      maxAttempts - result.attempts
    ),

    retryAfter: allowed
      ? 0
      : result.retryAfter,
  };
}

// ==========================================
// CHECK ADMIN LOGIN RATE LIMIT
// ==========================================

export async function checkLoginRateLimit(
  email: string
): Promise<RateLimitResult> {
  // APPLY OVERALL LOGIN LIMIT FIRST

  const globalLimit = await consumeRateLimit(
    'global:admin-login',
    GLOBAL_MAX_ATTEMPTS,
    GLOBAL_WINDOW_SECONDS
  );

  if (!globalLimit.allowed) {
    return globalLimit;
  }

  // GENERATE ACCOUNT-SPECIFIC IDENTIFIER

  const accountKey =
    await getAccountKey(email);

  // APPLY ACCOUNT-SPECIFIC LOGIN LIMIT

  const accountLimit = await consumeRateLimit(
    accountKey,
    ACCOUNT_MAX_ATTEMPTS,
    ACCOUNT_WINDOW_SECONDS
  );

  if (!accountLimit.allowed) {
    return accountLimit;
  }

  return {
    allowed: true,

    remaining: Math.min(
      globalLimit.remaining,
      accountLimit.remaining
    ),

    retryAfter: 0,
  };
}

// ==========================================
// CLEAN UP EXPIRED RATE LIMIT RECORDS
// ==========================================

export async function cleanupExpiredLoginLimits():
  Promise<number> {
  return prisma.$executeRaw`
    DELETE FROM "admin_login_rate_limits"

    WHERE "expires_at" < CURRENT_TIMESTAMP
      - INTERVAL '1 day'
  `;
}