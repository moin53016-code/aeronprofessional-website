import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Package, Tags, Image, Percent, Plus } from 'lucide-react';

async function getDashboardStats() {
  try {
    const [
      totalProducts, activeProducts, soldOutProducts, draftProducts, archivedProducts,
      totalCategories, activeBanners, activeDiscounts,
      recentProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'SOLD_OUT' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
      prisma.product.count({ where: { status: 'ARCHIVED' } }),
      prisma.category.count({ where: { isPublished: true } }),
      prisma.homepageBanner.count({ where: { isActive: true } }),
      prisma.discountCampaign.count({ where: { isActive: true } }),
      prisma.product.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, status: true, updatedAt: true },
      }),
    ]);
    return { totalProducts, activeProducts, soldOutProducts, draftProducts, archivedProducts, totalCategories, activeBanners, activeDiscounts, recentProducts };
  } catch {
    return { totalProducts: 0, activeProducts: 0, soldOutProducts: 0, draftProducts: 0, archivedProducts: 0, totalCategories: 0, activeBanners: 0, activeDiscounts: 0, recentProducts: [] };
  }
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SOLD_OUT: 'bg-orange-100 text-orange-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-red-100 text-red-600',
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">AERON PROFESSIONAL Admin Overview</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition">
          <Plus size={14} /> ADD PRODUCT
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Total Products</div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs"><span className="text-green-600">Active</span><span>{stats.activeProducts}</span></div>
            <div className="flex justify-between text-xs"><span className="text-orange-600">Sold Out</span><span>{stats.soldOutProducts}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Draft</span><span>{stats.draftProducts}</span></div>
            <div className="flex justify-between text-xs"><span className="text-red-500">Archived</span><span>{stats.archivedProducts}</span></div>
          </div>
        </div>
        <div className="bg-white p-5 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{stats.totalCategories}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Categories</div>
        </div>
        <div className="bg-white p-5 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{stats.activeBanners}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Active Banners</div>
        </div>
        <div className="bg-white p-5 border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{stats.activeDiscounts}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Active Discounts</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recently Updated Products</h2>
            <Link href="/admin/products" className="text-xs text-gray-500 hover:text-black">View all →</Link>
          </div>
          <div className="space-y-3">
            {stats.recentProducts.length === 0 && <p className="text-sm text-gray-400">No products yet.</p>}
            {stats.recentProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <Link href={`/admin/products/${p.id}/edit`} className="text-sm font-medium hover:text-[#9e7b50] transition">{p.name}</Link>
                  <p className="text-xs text-gray-400">{new Date(p.updatedAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-1 ${statusColors[p.status] || 'bg-gray-100'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/products/new', icon: Package, label: 'Add Product' },
              { href: '/admin/categories', icon: Tags, label: 'Manage Categories' },
              { href: '/admin/banners', icon: Image, label: 'Edit Banners' },
              { href: '/admin/settings', icon: Percent, label: 'Site Settings' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 p-4 border border-gray-200 hover:border-black hover:bg-gray-50 transition text-center">
                  <Icon size={20} className="text-gray-600" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
