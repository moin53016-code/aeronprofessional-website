
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import MarketplaceList from '@/components/admin/MarketplaceList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarketplacesPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD FRESH MARKETPLACE DATA

  const marketplaces = await prisma.marketplace.findMany({
    orderBy: [
      {
        createdAt: 'asc',
      },
      {
        id: 'asc',
      },
    ],
  });

  // CALCULATE MARKETPLACE STATISTICS

  const totalMarketplaces = marketplaces.length;

  const activeMarketplaces = marketplaces.filter(
    (marketplace) => marketplace.isActive
  ).length;

  const inactiveMarketplaces =
    totalMarketplaces - activeMarketplaces;

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Marketplaces
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage external purchase platforms
          and marketplace links.
        </p>

      </div>

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

      {/* MARKETPLACE MANAGEMENT */}

      <MarketplaceList
        initialMarketplaces={marketplaces}
      />

    </div>
  );
}
