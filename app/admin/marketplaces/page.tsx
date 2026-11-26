import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
  hasPermission,
} from '@/lib/permissions';

import {
  Eye,
  Store,
  Globe,
} from 'lucide-react';

import MarketplaceList from '@/components/admin/MarketplaceList';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// ADMIN MARKETPLACES PAGE
// ==========================================

export default async function MarketplacesPage() {

  // ========================================
  // SERVER-SIDE MARKETPLACE VIEW PERMISSION
  // ========================================

  const session = await requireAdminPage({
    permission:
      PERMISSIONS.MARKETPLACE_VIEW,
  });

  const role = session.user.role;

  // ========================================
  // MARKETPLACE MANAGEMENT PERMISSION
  // ========================================

  const canManageMarketplaces =
    hasPermission(
      role,
      PERMISSIONS.MARKETPLACE_MANAGE
    );

  // ========================================
  // LOAD PROTECTED MARKETPLACE DATA
  // ONLY AFTER PERMISSION VERIFICATION
  // ========================================

  const marketplaces =
    await prisma.marketplace.findMany({
      orderBy: [
        {
          createdAt: 'asc',
        },

        {
          id: 'asc',
        },
      ],
    });

  // ========================================
  // CALCULATE MARKETPLACE STATISTICS
  // ========================================

  const totalMarketplaces =
    marketplaces.length;

  const activeMarketplaces =
    marketplaces.filter(
      (marketplace) =>
        marketplace.isActive
    ).length;

  const inactiveMarketplaces =
    totalMarketplaces -
    activeMarketplaces;

  // ========================================
  // RENDER ADMIN MARKETPLACES PAGE
  // ========================================

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Marketplaces
        </h1>

        <p className="mt-1 text-sm text-gray-500">

          {canManageMarketplaces
            ? 'Manage external purchase platforms and marketplace links.'
            : 'View external purchase platforms and marketplace links.'}

        </p>

      </div>

      {/* READ-ONLY ACCESS INFORMATION */}

      {!canManageMarketplaces && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">

          <Eye
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>

            <h2 className="text-sm font-semibold text-blue-800">
              Read-only access
            </h2>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              You can view existing marketplace
              platforms and their links. Only
              authorized administrators can create,
              edit, activate or delete marketplaces.
            </p>

          </div>

        </div>
      )}

      {/* MARKETPLACE STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* TOTAL MARKETPLACES */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Marketplaces
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalMarketplaces}
          </p>

        </div>

        {/* ACTIVE MARKETPLACES */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Active Marketplaces
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {activeMarketplaces}
          </p>

        </div>

        {/* INACTIVE MARKETPLACES */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Inactive Marketplaces
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-500">
            {inactiveMarketplaces}
          </p>

        </div>

      </div>

      {/* ====================================
          FULL MARKETPLACE MANAGEMENT
          OWNER AND ADMIN ONLY
          ==================================== */}

      {canManageMarketplaces ? (

        <MarketplaceList
          initialMarketplaces={marketplaces}
        />

      ) : (

        /* ==================================
           READ-ONLY MARKETPLACE LIST
           EDITOR ACCESS
           ================================== */

        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">

          {marketplaces.length === 0 ? (

            /* EMPTY STATE */

            <div className="px-5 py-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">

                <Store
                  size={25}
                  className="text-gray-400"
                />

              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                No marketplaces found.
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                Marketplaces will appear here
                when they are added.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {marketplaces.map((marketplace) => (

                <div
                  key={marketplace.id}
                  className="flex min-w-0 flex-wrap items-start gap-4 p-4 transition-colors hover:bg-gray-50 sm:p-5"
                >

                  {/* MARKETPLACE ICON */}

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">

                    <Store
                      size={24}
                      className="text-[#977447]"
                    />

                  </div>

                  {/* MARKETPLACE INFORMATION */}

                  <div className="min-w-0 flex-1">

                    <h3 className="break-words text-sm font-semibold text-gray-900">
                      {marketplace.name}
                    </h3>

                    {/* MARKETPLACE SLUG */}

                    <p className="mt-1 break-all text-xs text-gray-400">
                      {marketplace.slug}
                    </p>

                    {/* MARKETPLACE BADGE */}

                    {marketplace.badgeText && (
                      <div className="mt-2">

                        <span className="rounded bg-[#f5efe6] px-2 py-1 text-xs font-semibold text-[#977447]">

                          {marketplace.badgeText}

                        </span>

                      </div>
                    )}

                    {/* MARKETPLACE TAGLINE */}

                    {marketplace.tagline && (
                      <p className="mt-3 break-words text-xs leading-5 text-gray-500">

                        {marketplace.tagline}

                      </p>
                    )}

                    {/* GLOBAL MARKETPLACE URL */}

                    {marketplace.url && (
                      <div className="mt-3 flex min-w-0 items-start gap-2">

                        <Globe
                          size={15}
                          className="mt-0.5 shrink-0 text-gray-400"
                        />

                        <span className="min-w-0 break-all text-xs leading-5 text-gray-500">

                          {marketplace.url}

                        </span>

                      </div>
                    )}

                    {/* MARKETPLACE STATUS */}

                    <div className="mt-3">

                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold ${
                          marketplace.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >

                        {marketplace.isActive
                          ? 'ACTIVE'
                          : 'INACTIVE'}

                      </span>

                    </div>

                  </div>

                  {/* READ-ONLY INDICATOR */}

                  <div className="flex shrink-0 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">

                    <Eye size={15} />

                    View only

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      )}

    </div>
  );
}