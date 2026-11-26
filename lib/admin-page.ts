import 'server-only';

import { cache } from 'react';

import {
  redirect,
  notFound,
} from 'next/navigation';

import { getSession } from '@/lib/auth';

import {
  isValidRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@/lib/permissions';

import type {
  Permission,
} from '@/lib/permissions';

// ==========================================
// ADMIN PAGE SECURITY OPTIONS
// ==========================================

interface AdminPageSecurityOptions {
  permission?: Permission;

  permissions?: readonly Permission[];

  permissionMode?: 'all' | 'any';
}

// ==========================================
// CACHED ADMIN SESSION VERIFICATION
// ==========================================

const getVerifiedAdminSession = cache(
  async () => {

    // ======================================
    // VERIFY DATABASE SESSION
    // ======================================

    const session = await getSession();

    if (!session) {
      redirect('/admin/login');
    }

    // ======================================
    // VERIFY ACTIVE ADMIN ACCOUNT
    // ======================================

    if (!session.user.isActive) {
      redirect('/admin/login');
    }

    // ======================================
    // VERIFY VALID ADMIN ROLE
    // ======================================

    if (!isValidRole(session.user.role)) {
      notFound();
    }

    return session;
  }
);

// ==========================================
// REQUIRE ADMIN PAGE ACCESS
// ==========================================

export async function requireAdminPage(
  options: AdminPageSecurityOptions = {}
) {
  // ========================================
  // VERIFY AUTHENTICATED ADMIN SESSION
  // ========================================

  const session =
    await getVerifiedAdminSession();

  const role =
    session.user.role;

  // ========================================
  // CHECK INDIVIDUAL PAGE PERMISSION
  // ========================================

  if (
    options.permission &&
    !hasPermission(
      role,
      options.permission
    )
  ) {
    notFound();
  }

  // ========================================
  // CHECK MULTIPLE PAGE PERMISSIONS
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
      notFound();
    }
  }

  // ========================================
  // RETURN VERIFIED ADMIN SESSION
  // ========================================

  return session;
}