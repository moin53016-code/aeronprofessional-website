
import { prisma } from '@/lib/db';
import CategoryList from '@/components/admin/CategoryList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriesPage() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return (
      <div className="w-full min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {categories.length} categories
          </p>
        </div>

        <CategoryList initialCategories={categories} />
      </div>
    );
  } catch (error) {
    console.error(
      'FAILED TO LOAD ADMIN CATEGORIES:',
      error
    );

    return (
      <div className="w-full">
        <h1 className="mb-5 text-2xl font-bold text-gray-900">
          Categories
        </h1>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load categories
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-600">
            Could not fetch categories from the database.
            Your categories may still be saved in Neon.
          </p>

          <p className="mt-3 text-sm text-gray-700">
            Check the terminal for the database error.
            Verify DATABASE_URL and the Neon connection.
          </p>

          <p className="mt-3 text-xs text-gray-500">
            Category creation and deletion are disabled
            until the database connection is working.
          </p>
        </div>
      </div>
    );
  }
}
