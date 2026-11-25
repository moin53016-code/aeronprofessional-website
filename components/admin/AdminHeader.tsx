
'use client';

import { useState } from 'react';
import {
  LogOut,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminHeader({
  user,
}: AdminHeaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ADMIN LOGOUT

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

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

      // COOKIE SUCCESSFULLY CLEARED

      if (data?.loggedOutLocally === true) {
        if (data.sessionRevoked === false) {
          window.alert(
            'You have been logged out of this browser, but the server session could not be revoked.'
          );
        }

        // FULL NAVIGATION TO CLEAR CLIENT STATE

        window.location.replace('/admin/login');

        return;
      }

      // LOGOUT FAILED

      throw new Error(
        data?.error ||
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

  return (
    <header className="w-full min-w-0 border-b border-gray-200 bg-white">

      {/* ADMIN HEADER */}

      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">

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

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">

          {/* ADMIN ROLE */}

          <div className="hidden items-center gap-2 text-sm text-gray-600 sm:flex">
            <User
              size={17}
              aria-hidden="true"
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