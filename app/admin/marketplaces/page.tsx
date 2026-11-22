import { prisma } from '@/lib/db';
import MarketplaceList from '@/components/admin/MarketplaceList';

export default async function MarketplacesPage() {
  const marketplaces = await prisma.marketplace.findMany({
  orderBy: { createdAt: 'asc' },
});
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplaces</h1>
        <p className="text-sm text-gray-500 mt-1">Manage external purchase platforms</p>
      </div>
      <MarketplaceList initialMarketplaces={marketplaces} />
    </div>
  );
}
