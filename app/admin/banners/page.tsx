
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import BannerList from '@/components/admin/BannerList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BannersPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD FRESH BANNERS FROM DATABASE

  const banners = await prisma.homepageBanner.findMany({
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

  // CALCULATE BANNER STATISTICS

  const now = new Date();

  const totalBanners = banners.length;

  const liveBanners = banners.filter(
    (banner) =>
      banner.isActive &&
      (!banner.startsAt || banner.startsAt <= now) &&
      (!banner.endsAt || banner.endsAt >= now)
  ).length;

  const scheduledBanners = banners.filter(
    (banner) =>
      banner.isActive &&
      banner.startsAt !== null &&
      banner.startsAt > now &&
      (!banner.endsAt ||
        banner.endsAt >= banner.startsAt)
  ).length;

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

      {/* BANNER MANAGEMENT */}

      <BannerList
        initialBanners={banners}
      />

    </div>
  );
}
