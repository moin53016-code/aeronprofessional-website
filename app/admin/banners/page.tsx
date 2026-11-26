import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
} from '@/lib/permissions';

import BannerList from '@/components/admin/BannerList';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// ADMIN BANNERS PAGE
// ==========================================

export default async function BannersPage() {

  // ========================================
  // SERVER-SIDE BANNER PERMISSION CHECK
  // ========================================

  await requireAdminPage({
    permissions: [
      PERMISSIONS.BANNER_VIEW,
      PERMISSIONS.BANNER_MANAGE,
    ],

    permissionMode: 'all',
  });

  // ========================================
  // LOAD PROTECTED BANNER DATA
  // ONLY AFTER PERMISSION VERIFICATION
  // ========================================

  const banners =
    await prisma.homepageBanner.findMany({
      orderBy: [
        {
          displayOrder: 'asc',
        },

        {
          createdAt: 'desc',
        },

        {
          id: 'asc',
        },
      ],
    });

  // ========================================
  // CURRENT DATE AND TIME
  // ========================================

  const now = new Date();

  // ========================================
  // CALCULATE TOTAL BANNERS
  // ========================================

  const totalBanners =
    banners.length;

  // ========================================
  // CALCULATE CURRENTLY LIVE BANNERS
  // ========================================

  const liveBanners =
    banners.filter(
      (banner) =>
        banner.isActive &&
        (
          !banner.startsAt ||
          banner.startsAt <= now
        ) &&
        (
          !banner.endsAt ||
          banner.endsAt >= now
        )
    ).length;

  // ========================================
  // CALCULATE SCHEDULED BANNERS
  // ========================================

  const scheduledBanners =
    banners.filter(
      (banner) =>
        banner.isActive &&
        banner.startsAt !== null &&
        banner.startsAt > now &&
        (
          !banner.endsAt ||
          banner.endsAt >= banner.startsAt
        )
    ).length;

  // ========================================
  // RENDER AUTHORIZED BANNER MANAGEMENT PAGE
  // ========================================

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Homepage Banners
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage homepage hero slides, images and
          promotional banners.
        </p>

      </div>

      {/* BANNER STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* TOTAL BANNERS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Banners
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalBanners}
          </p>

        </div>

        {/* LIVE BANNERS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Live on Website
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {liveBanners}
          </p>

        </div>

        {/* SCHEDULED BANNERS */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Scheduled
          </p>

          <p className="mt-2 text-2xl font-bold text-[#977447]">
            {scheduledBanners}
          </p>

        </div>

      </div>

      {/* AUTHORIZED BANNER MANAGEMENT */}

      <BannerList
        initialBanners={banners}
      />

    </div>
  );
}