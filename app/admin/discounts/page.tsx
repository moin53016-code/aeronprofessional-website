import { prisma } from '@/lib/db';
import DiscountList from '@/components/admin/DiscountList';

export default async function DiscountsPage() {
  const campaigns = await prisma.discountCampaign.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discounts & Promotions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage promotional campaigns</p>
      </div>
      <DiscountList initialCampaigns={campaigns} />
    </div>
  );
}
