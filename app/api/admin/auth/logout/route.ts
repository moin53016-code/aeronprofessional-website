
import { NextRequest, NextResponse } from 'next/server';

import {
  deleteSession,
  clearSessionCookie,
} from '@/lib/auth';

export async function POST(
  request: NextRequest
) {
  const token = request.cookies.get(
    'aeron_admin_session'
  )?.value;

  let sessionRevoked = true;

  // DELETE SESSION FROM DATABASE

  if (token) {
    try {
      await deleteSession(token);
    } catch (error) {
      sessionRevoked = false;

      console.error(
        'Failed to revoke admin session:',
        error
      );
    }
  }

  // ALWAYS CLEAR THE BROWSER SESSION COOKIE

  const cookieConfig = clearSessionCookie();

  const response = NextResponse.json(
    {
      success: sessionRevoked,

      loggedOutLocally: true,

      sessionRevoked,

      message: sessionRevoked
        ? 'Logged out successfully.'
        : 'Browser session cleared, but database session revocation failed.',
    },
    {
      status: sessionRevoked ? 200 : 503,
    }
  );

  response.cookies.set(
    cookieConfig.name,
    cookieConfig.value,
    {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: cookieConfig.maxAge,
      expires: new Date(0),
      path: cookieConfig.path,
    }
  );

  // PREVENT CACHING OF AUTHENTICATION RESPONSE

  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate'
  );

  return response;
}
