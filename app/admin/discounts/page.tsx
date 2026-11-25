
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import DiscountList from '@/components/admin/DiscountList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DiscountsPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD FRESH DISCOUNT CAMPAIGNS

  const campaigns = await prisma.discountCampaign.findMany({
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'asc',
      },
    ],
  });

  // CALCULATE CAMPAIGN STATISTICS

  const totalCampaigns = campaigns.length;

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.isActive
  ).length;

  const inactiveCampaigns =
    totalCampaigns - activeCampaigns;

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Discounts & Promotions
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage promotional campaigns and
          product discounts.
        </p>

      </div>

      {/* CAMPAIGN STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* TOTAL CAMPAIGNS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Campaigns
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalCampaigns}
          </p>

        </div>

        {/* ENABLED CAMPAIGNS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Enabled Campaigns
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {activeCampaigns}
          </p>

        </div>

        {/* DISABLED CAMPAIGNS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Disabled Campaigns
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-500">
            {inactiveCampaigns}
          </p>

        </div>

      </div>

      {/* DISCOUNT CAMPAIGN MANAGEMENT */}

      <DiscountList
        initialCampaigns={campaigns}
      />

    </div>
  );
}
