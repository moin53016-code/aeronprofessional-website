import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Plus, Edit } from 'lucide-react';
import ProductStatusBadge from '@/components/admin/StatusBadge';
import ProductActions from '@/components/admin/ProductActions';

interface SearchParams { search?: string; status?: string; }

async function getProducts(search?: string, status?: string) {
  try {
    return await prisma.product.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        categories: { include: { category: true }, take: 1 },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } catch { return []; }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const products = await getProducts(sp?.search, sp?.status);
  const fmt = (n: number) => '₹' + Math.round(n / 100).toLocaleString('en-IN');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition">
          <Plus size={14} /> ADD PRODUCT
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-6">
        <input name="search" defaultValue={sp?.search} placeholder="Search products..." className="border border-gray-300 px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:border-black" />
        <select name="status" defaultValue={sp?.status} className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="SOLD_OUT">Sold Out</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className="bg-black text-white px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition cursor-pointer">FILTER</button>
      </form>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">PRODUCT</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500 hidden md:table-cell">CATEGORY</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500 hidden sm:table-cell">PRICE</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">STATUS</th>
              <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">No products found. <Link href="/admin/products/new" className="underline">Add your first product</Link>.</td></tr>
            )}
            {products.map((product) => {
              const primaryImg = product.images[0] || (product.primaryImageUrl ? { url: product.primaryImageUrl } : null);
              const primaryCat = product.categories[0]?.category;
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 shrink-0 overflow-hidden">
                        {primaryImg && <img src={primaryImg.url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.badgeText && <div className="text-[10px] text-gray-500">{product.badgeText}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{primaryCat?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{fmt(product.priceInPaise)}</td>
                  <td className="px-4 py-3">
                    <ProductStatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-gray-500 hover:text-black transition p-1"><Edit size={15} /></Link>
                      <ProductActions productId={product.id} currentStatus={product.status} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
