import { prisma } from '@/lib/db';
import BannerList from '@/components/admin/BannerList';

export default async function BannersPage() {
  const banners = await prisma.homepageBanner.findMany({ orderBy: { displayOrder: 'asc' } }).catch(() => []);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Banners</h1>
        <p className="text-sm text-gray-500 mt-1">Manage the hero slider slides</p>
      </div>
      <BannerList initialBanners={banners} />
    </div>
  );
}
