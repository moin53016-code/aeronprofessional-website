
import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

// VERIFY ADMIN SESSION
// BEFORE LOADING PROTECTED ADMIN PAGE DATA

export const requireAdminPage = cache(
  async () => {
    const session = await getSession();

    if (!session) {
      redirect('/admin/login');
    }

    return session;
  }
);
