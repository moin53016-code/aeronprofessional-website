import { prisma } from '@/lib/db';
import CategoryList from '@/components/admin/CategoryList';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { displayOrder: 'asc' } }).catch(() => []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categories</p>
        </div>
      </div>
      <CategoryList initialCategories={categories} />
    </div>
  );
}
