
import 'server-only';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

// Verify the admin database session.

export async function adminDenied() {
  return (await getSession())
    ? null
    : NextResponse.json(
        {
          error: 'Unauthorized. Please log in.',
        },
        { status: 401 }
      );
}

// Handle invalid API input.

export function badInput(
  error = 'Invalid input',
  details?: unknown
) {
  return NextResponse.json(
    {
      error,
      details,
    },
    { status: 400 }
  );
}

// Handle database and API errors.

export function apiError(
  error: unknown,
  resource: string
) {
  console.error(`${resource} API error:`, error);

  const code =
    error &&
    typeof error === 'object' &&
    'code' in error
      ? error.code
      : undefined;

  if (code === 'P2025') {
    return NextResponse.json(
      {
        error: `${resource} not found`,
      },
      { status: 404 }
    );
  }

  if (code === 'P2002') {
    return NextResponse.json(
      {
        error:
          'A record with these unique details already exists',
      },
      { status: 409 }
    );
  }

  if (code === 'P2003') {
    return badInput(
      'One or more related records no longer exist. Refresh and try again.'
    );
  }

  return NextResponse.json(
    {
      error: `Unable to process ${resource.toLowerCase()}`,
    },
    { status: 500 }
  );
}

// Refresh website and admin data.

export function refreshAdmin(path: string) {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(path);
}
