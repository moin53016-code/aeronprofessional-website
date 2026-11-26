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
  Percent,
  CalendarDays,
} from 'lucide-react';

import DiscountList from '@/components/admin/DiscountList';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// FORMAT CAMPAIGN DATE
// ==========================================

function formatDate(
  date: Date | null
): string {
  if (!date) {
    return 'Not specified';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',

      month: 'short',

      year: 'numeric',

      timeZone: 'Asia/Kolkata',
    }
  );
}

// ==========================================
// ADMIN DISCOUNTS PAGE
// ==========================================

export default async function DiscountsPage() {

  // ========================================
  // SERVER-SIDE DISCOUNT VIEW PERMISSION
  // ========================================

  const session = await requireAdminPage({
    permission:
      PERMISSIONS.DISCOUNT_VIEW,
  });

  const role = session.user.role;

  // ========================================
  // DISCOUNT MANAGEMENT PERMISSION
  // ========================================

  const canManageDiscounts =
    hasPermission(
      role,
      PERMISSIONS.DISCOUNT_MANAGE
    );

  // ========================================
  // LOAD PROTECTED DISCOUNT CAMPAIGNS
  // ONLY AFTER PERMISSION VERIFICATION
  // ========================================

  const campaigns =
    await prisma.discountCampaign.findMany({
      orderBy: [
        {
          createdAt: 'desc',
        },

        {
          id: 'asc',
        },
      ],
    });

  // ========================================
  // CALCULATE CAMPAIGN STATISTICS
  // ========================================

  const totalCampaigns =
    campaigns.length;

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.isActive
    ).length;

  const inactiveCampaigns =
    totalCampaigns - activeCampaigns;

  const now = new Date();

  // ========================================
  // RENDER ADMIN DISCOUNTS PAGE
  // ========================================

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Discounts & Promotions
        </h1>

        <p className="mt-1 text-sm text-gray-500">

          {canManageDiscounts
            ? 'Manage promotional campaigns and product discounts.'
            : 'View promotional campaigns and product discounts.'}

        </p>

      </div>

      {/* READ-ONLY ACCESS INFORMATION */}

      {!canManageDiscounts && (
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
              You can view existing discount campaigns.
              Only authorized administrators can create,
              edit, activate or delete campaigns.
            </p>

          </div>

        </div>
      )}

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

      {/* ====================================
          FULL DISCOUNT MANAGEMENT
          OWNER AND ADMIN ONLY
          ==================================== */}

      {canManageDiscounts ? (

        <DiscountList
          initialCampaigns={campaigns}
        />

      ) : (

        /* ==================================
           READ-ONLY DISCOUNT CAMPAIGNS
           EDITOR ACCESS
           ================================== */

        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">

          {campaigns.length === 0 ? (

            /* EMPTY STATE */

            <div className="px-5 py-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">

                <Percent
                  size={25}
                  className="text-gray-400"
                />

              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                No discount campaigns found.
              </h2>

              <p className="mt-2 text-xs text-gray-500">
                Campaigns will appear here when
                they are created.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {campaigns.map((campaign) => {

                // CALCULATE CAMPAIGN STATUS

                const isExpired =
                  campaign.endsAt !== null &&
                  campaign.endsAt < now;

                const isScheduled =
                  campaign.startsAt !== null &&
                  campaign.startsAt > now;

                const status =
                  !campaign.isActive
                    ? 'DISABLED'
                    : isExpired
                      ? 'EXPIRED'
                      : isScheduled
                        ? 'SCHEDULED'
                        : 'LIVE';

                const statusClass =
                  status === 'LIVE'
                    ? 'bg-green-100 text-green-700'
                    : status === 'SCHEDULED'
                      ? 'bg-blue-100 text-blue-700'
                      : status === 'EXPIRED'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-500';

                return (
                  <div
                    key={campaign.id}
                    className="flex min-w-0 flex-wrap items-start gap-4 p-4 transition-colors hover:bg-gray-50 sm:p-5"
                  >

                    {/* CAMPAIGN ICON */}

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">

                      <Percent
                        size={24}
                        className="text-[#977447]"
                      />

                    </div>

                    {/* CAMPAIGN DETAILS */}

                    <div className="min-w-0 flex-1">

                      <h3 className="break-words text-sm font-semibold text-gray-900">
                        {campaign.name}
                      </h3>

                      {/* DISCOUNT LABEL */}

                      {campaign.discountLabel && (
                        <div className="mt-2">

                          <span className="rounded bg-[#f5efe6] px-2 py-1 text-xs font-semibold text-[#977447]">

                            {campaign.discountLabel}

                          </span>

                        </div>
                      )}

                      {/* CAMPAIGN DESCRIPTION */}

                      {campaign.description && (
                        <p className="mt-3 break-words text-xs leading-5 text-gray-500">

                          {campaign.description}

                        </p>
                      )}

                      {/* CAMPAIGN SCHEDULE */}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">

                        <div className="flex items-center gap-2 text-xs text-gray-500">

                          <CalendarDays size={14} />

                          <span>

                            Starts:{' '}

                            {formatDate(
                              campaign.startsAt
                            )}

                          </span>

                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">

                          <CalendarDays size={14} />

                          <span>

                            Ends:{' '}

                            {formatDate(
                              campaign.endsAt
                            )}

                          </span>

                        </div>

                      </div>

                      {/* CAMPAIGN STATUS */}

                      <div className="mt-3 flex flex-wrap gap-2">

                        <span
                          className={`rounded px-2 py-1 text-[10px] font-bold ${statusClass}`}
                        >

                          {status}

                        </span>

                      </div>

                    </div>

                    {/* READ-ONLY INDICATOR */}

                    <div className="flex shrink-0 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">

                      <Eye size={15} />

                      View only

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

      )}

    </div>
  );
}