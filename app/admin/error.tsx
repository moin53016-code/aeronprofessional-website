
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import {
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react';

interface AdminErrorProps {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
}

export default function AdminError({
  error,
  reset,
}: AdminErrorProps) {
  useEffect(() => {
    console.error(
      'AERON Admin Error:',
      error
    );
  }, [error]);

  return (
    <div className="flex min-h-[65vh] w-full items-center justify-center p-4 sm:p-8">

      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">

        {/* ERROR ICON */}

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
          <AlertTriangle size={30} />
        </div>

        {/* BRAND */}

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#977447]">
          AERON PROFESSIONAL
        </p>

        {/* ERROR HEADING */}

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-7 text-gray-500">
          We could not load this admin page.
          This may be caused by a temporary
          database or server connection issue.
        </p>

        {/* DATABASE INFORMATION */}

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">

          <h2 className="text-sm font-semibold text-amber-900">
            What should you do?
          </h2>

          <ul className="mt-3 space-y-2 text-xs leading-6 text-amber-800">
            <li>
              • Check your internet connection.
            </li>

            <li>
              • Verify your Neon database connection.
            </li>

            <li>
              • Check the development server terminal.
            </li>

            <li>
              • Retry once the connection is restored.
            </li>
          </ul>

        </div>

        {/* ACTION BUTTONS */}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            <RefreshCw size={17} />

            Try Again
          </button>

          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-black hover:bg-gray-50"
          >
            <LayoutDashboard size={17} />

            Dashboard
          </Link>

        </div>

        {/* RETURN TO WEBSITE */}

        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center gap-2 text-xs font-medium text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeft size={14} />

          Return to website
        </Link>

        {/* ERROR REFERENCE */}

        {error.digest && (
          <p className="mt-6 break-all border-t border-gray-100 pt-4 text-[10px] text-gray-400">
            Error reference: {error.digest}
          </p>
        )}

      </div>
    </div>
  );
}
