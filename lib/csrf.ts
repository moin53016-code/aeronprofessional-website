import 'server-only';

import {
  NextRequest,
  NextResponse,
} from 'next/server';

// ==========================================
// SAFE HTTP METHODS
// ==========================================

const SAFE_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
]);

// ==========================================
// NORMALIZE AND VALIDATE ORIGIN
// ==========================================

function normalizeOrigin(
  value: string
): string | null {
  try {
    const url = new URL(value);

    if (
      url.protocol !== 'https:' &&
      url.protocol !== 'http:'
    ) {
      return null;
    }

    if (
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.origin;

  } catch {
    return null;
  }
}

// ==========================================
// GET TRUSTED APPLICATION ORIGINS
// ==========================================

function getAllowedOrigins(
  request: NextRequest
): Set<string> {
  const allowedOrigins =
    new Set<string>();

  const configuredOrigins =
    process.env.ADMIN_ALLOWED_ORIGINS;

  // USE EXPLICIT TRUSTED ORIGINS WHEN CONFIGURED

  if (configuredOrigins?.trim()) {
    for (
      const value of configuredOrigins.split(',')
    ) {
      const origin = normalizeOrigin(
        value.trim()
      );

      if (origin) {
        allowedOrigins.add(origin);
      }
    }

    return allowedOrigins;
  }

  // FALLBACK TO CURRENT APPLICATION ORIGIN

  const requestOrigin = normalizeOrigin(
    request.nextUrl.origin
  );

  if (requestOrigin) {
    allowedOrigins.add(requestOrigin);
  }

  return allowedOrigins;
}

// ==========================================
// VALIDATE REQUEST AGAINST CSRF
// ==========================================

export function isCsrfSafe(
  request: NextRequest
): boolean {
  const method =
    request.method.toUpperCase();

  // ALLOW READ-ONLY REQUESTS

  if (SAFE_METHODS.has(method)) {
    return true;
  }

  // REJECT EXPLICIT CROSS-SITE REQUESTS

  const fetchSite = request.headers.get(
    'sec-fetch-site'
  );

  if (fetchSite === 'cross-site') {
    return false;
  }

  // REQUIRE ORIGIN FOR STATE-CHANGING REQUESTS

  const rawOrigin = request.headers.get(
    'origin'
  );

  if (
    !rawOrigin ||
    rawOrigin === 'null'
  ) {
    return false;
  }

  const requestOrigin =
    normalizeOrigin(rawOrigin);

  if (!requestOrigin) {
    return false;
  }

  // COMPARE AGAINST TRUSTED APPLICATION ORIGINS

  const allowedOrigins =
    getAllowedOrigins(request);

  return allowedOrigins.has(
    requestOrigin
  );
}

// ==========================================
// CREATE SECURE CSRF ERROR RESPONSE
// ==========================================

export function csrfDeniedResponse():
  NextResponse {
  return NextResponse.json(
    {
      success: false,

      error: 'Forbidden request origin.',
    },
    {
      status: 403,

      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, private',

        'Pragma':
          'no-cache',

        'Expires':
          '0',

        'X-Content-Type-Options':
          'nosniff',
      },
    }
  );
}

// ==========================================
// CENTRALIZED CSRF GUARD
// ==========================================

export function csrfGuard(
  request: NextRequest
): NextResponse | null {
  if (!isCsrfSafe(request)) {
    return csrfDeniedResponse();
  }

  return null;
}