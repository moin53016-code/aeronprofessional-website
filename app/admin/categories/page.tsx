
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import CategoryList from '@/components/admin/CategoryList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriesPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD ALL CATEGORIES FROM DATABASE

  const categories = await prisma.category.findMany({
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

  // CALCULATE CATEGORY STATISTICS

  const totalCategories = categories.length;

  const publishedCategories = categories.filter(
    (category) => category.isPublished
  ).length;

  const visibleCategories = categories.filter(
    (category) =>
      category.isPublished &&
      category.isVisible
  ).length;

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Categories
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your AERON product categories.
        </p>

      </div>

      {/* CATEGORY STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Categories
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalCategories}
          </p>

        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Published
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {publishedCategories}
          </p>

        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Visible on Website
          </p>

          <p className="mt-2 text-2xl font-bold text-[#977447]">
            {visibleCategories}
          </p>

        </div>

      </div>

      {/* CATEGORY MANAGEMENT */}

      <CategoryList
        initialCategories={categories}
      />

    </div>
  );
}
