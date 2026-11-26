'use client';

import { useState } from 'react';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import {
  LogOut,
  User,
  Loader2,
  AlertCircle,
  Menu,
  X,
  LayoutDashboard,
  Package,
  Tags,
  Image,
  Percent,
  Settings,
  FileText,
  Store,
} from 'lucide-react';

import {
  PERMISSIONS,
  hasAllPermissions,
} from '@/lib/permissions';

import type {
  Permission,
} from '@/lib/permissions';

// ==========================================
// ADMIN HEADER PROPS
// ==========================================

interface AdminHeaderProps {
  user: {
    name: string;

    email: string;

    role: string;
  };
}

// ==========================================
// MOBILE NAVIGATION TYPE
// ==========================================

interface NavItem {
  href: string;

  label: string;

  icon: typeof LayoutDashboard;

  permissions: readonly Permission[];
}

// ==========================================
// ROLE-BASED MOBILE NAVIGATION
// ==========================================

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/admin',

    label: 'Dashboard',

    icon: LayoutDashboard,

    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
    ],
  },

  {
    href: '/admin/products',

    label: 'Products',

    icon: Package,

    permissions: [
      PERMISSIONS.PRODUCT_VIEW,
    ],
  },

  {
    href: '/admin/categories',

    label: 'Categories',

    icon: Tags,

    permissions: [
      PERMISSIONS.CATEGORY_VIEW,
    ],
  },

  {
    href: '/admin/banners',

    label: 'Banners',

    icon: Image,

    permissions: [
      PERMISSIONS.BANNER_VIEW,
      PERMISSIONS.BANNER_MANAGE,
    ],
  },

  {
    href: '/admin/marketplaces',

    label: 'Marketplaces',

    icon: Store,

    permissions: [
      PERMISSIONS.MARKETPLACE_VIEW,
    ],
  },

  {
    href: '/admin/discounts',

    label: 'Discounts',

    icon: Percent,

    permissions: [
      PERMISSIONS.DISCOUNT_VIEW,
    ],
  },

  {
    href: '/admin/content',

    label: 'Content',

    icon: FileText,

    permissions: [
      PERMISSIONS.CONTENT_VIEW,
      PERMISSIONS.CONTENT_MANAGE,
      PERMISSIONS.FAQ_VIEW,
      PERMISSIONS.FAQ_MANAGE,
    ],
  },

  {
    href: '/admin/settings',

    label: 'Settings',

    icon: Settings,

    permissions: [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
    ],
  },
];

// ==========================================
// ADMIN HEADER COMPONENT
// ==========================================

export default function AdminHeader({
  user,
}: AdminHeaderProps) {

  const pathname = usePathname();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [menuOpen, setMenuOpen] =
    useState(false);

  // ========================================
  // FILTER MOBILE NAVIGATION PERMISSIONS
  // ========================================

  const allowedNavItems =
    NAV_ITEMS.filter((item) =>
      hasAllPermissions(
        user.role,
        item.permissions
      )
    );

  // ========================================
  // ADMIN ROLE STYLING
  // ========================================

  const roleClass =
    user.role === 'OWNER'
      ? 'bg-[#f5efe6] text-[#977447]'
      : user.role === 'ADMIN'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600';

  // ========================================
  // SECURE ADMIN LOGOUT
  // ========================================

  const handleLogout = async () => {

    if (loading) return;

    setLoading(true);

    setError('');

    setMenuOpen(false);

    try {

      const response = await fetch(
        '/api/admin/auth/logout',
        {
          method: 'POST',

          credentials: 'same-origin',

          cache: 'no-store',
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      // ====================================
      // COOKIE SUCCESSFULLY CLEARED
      // ====================================

      if (
        data?.loggedOutLocally === true
      ) {

        // SERVER SESSION REVOCATION WARNING

        if (
          data.sessionRevoked === false
        ) {
          window.alert(
            'You have been logged out of this browser, but the server session could not be revoked.'
          );
        }

        // FULL NAVIGATION TO CLEAR CLIENT STATE

        window.location.replace(
          '/admin/login'
        );

        return;
      }

      // ====================================
      // LOGOUT FAILED
      // ====================================

      throw new Error(
        data?.error ||
        data?.message ||
        'Unable to log out. Please try again.'
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Logout failed. Please try again.'
      );

      setLoading(false);
    }
  };

  // ========================================
  // RENDER ADMIN HEADER
  // ========================================

  return (
    <header className="w-full min-w-0 border-b border-gray-200 bg-white">

      {/* ADMIN HEADER */}

      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">

        {/* MOBILE NAVIGATION BUTTON */}

        {allowedNavItems.length > 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setMenuOpen((previous) => !previous)
            }
            aria-label={
              menuOpen
                ? 'Close navigation'
                : 'Open navigation'
            }
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-navigation"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 lg:hidden"
          >

            {menuOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}

          </button>
        )}

        {/* ADMIN INFORMATION */}

        <div className="min-w-0 flex-1">

          <p className="text-xs text-gray-500 sm:text-sm">
            Welcome back,
          </p>

          <p className="truncate text-sm font-semibold text-gray-900">

            {user.name || 'Administrator'}

          </p>

        </div>

        {/* ADMIN ROLE AND LOGOUT */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-5">

          {/* ADMIN ROLE BADGE */}

          <div
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-bold sm:px-3 sm:text-xs ${roleClass}`}
          >

            <User
              size={15}
              aria-hidden="true"
              className="hidden sm:block"
            />

            <span>
              {user.role}
            </span>

          </div>

          {/* LOGOUT BUTTON */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            aria-label={
              loading
                ? 'Logging out'
                : 'Logout'
            }
            aria-busy={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (

              <Loader2
                size={17}
                className="animate-spin"
                aria-hidden="true"
              />

            ) : (

              <LogOut
                size={17}
                aria-hidden="true"
              />

            )}

            <span className="hidden sm:inline">

              {loading
                ? 'Logging out...'
                : 'Logout'}

            </span>

          </button>

        </div>

      </div>

      {/* ====================================
          ROLE-BASED MOBILE NAVIGATION
          ==================================== */}

      {allowedNavItems.length > 0 && (
        <nav
          id="admin-mobile-navigation"
          aria-label="Mobile admin navigation"
          className={`border-t border-gray-200 bg-[#141414] px-3 py-3 lg:hidden ${
            menuOpen ? 'block' : 'hidden'
          }`}
        >

          <div className="mb-3 px-3 py-2">

            <p className="text-sm font-bold tracking-[.2em] text-white">
              AERON
            </p>

            <p className="mt-1 text-[9px] tracking-[.3em] text-[#c6a77a]">
              P R O F E S S I O N A L
            </p>

          </div>

          {/* AUTHORIZED NAVIGATION LINKS */}

          <div className="space-y-1">

            {allowedNavItems.map((item) => {

              const isActive =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  aria-current={
                    isActive
                      ? 'page'
                      : undefined
                  }
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 font-semibold text-[#c6a77a]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >

                  <Icon
                    size={17}
                    aria-hidden="true"
                  />

                  {item.label}

                </Link>
              );
            })}

          </div>

          {/* PUBLIC WEBSITE LINK */}

          <div className="mt-4 border-t border-white/10 px-3 pt-4">

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                setMenuOpen(false)
              }
              className="text-xs text-gray-400 transition hover:text-white"
            >

              ↗ View Public Site

            </Link>

          </div>

        </nav>
      )}

      {/* LOGOUT ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="mx-4 mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-6"
        >

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {error}
          </span>

        </div>
      )}

    </header>
  );
}