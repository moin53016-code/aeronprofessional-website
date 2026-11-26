import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
  hasPermission,
} from '@/lib/permissions';

import {
  Eye,
  ImageIcon,
} from 'lucide-react';

import CategoryList from '@/components/admin/CategoryList';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// ADMIN CATEGORIES PAGE
// ==========================================

export default async function CategoriesPage() {

  // ========================================
  // SERVER-SIDE CATEGORY VIEW PERMISSION
  // ========================================

  const session = await requireAdminPage({
    permission:
      PERMISSIONS.CATEGORY_VIEW,
  });

  const role = session.user.role;

  // ========================================
  // CATEGORY MANAGEMENT PERMISSION
  // ========================================

  const canManageCategories =
    hasPermission(
      role,
      PERMISSIONS.CATEGORY_MANAGE
    );

  // ========================================
  // LOAD PROTECTED CATEGORY DATA
  // ========================================

  const categories =
    await prisma.category.findMany({
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
  // CALCULATE CATEGORY STATISTICS
  // ========================================

  const totalCategories =
    categories.length;

  const publishedCategories =
    categories.filter(
      (category) =>
        category.isPublished
    ).length;

  const visibleCategories =
    categories.filter(
      (category) =>
        category.isPublished &&
        category.isVisible
    ).length;

  // ========================================
  // RENDER ADMIN CATEGORIES PAGE
  // ========================================

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Categories
        </h1>

        <p className="mt-1 text-sm text-gray-500">

          {canManageCategories
            ? 'Manage your AERON product categories.'
            : 'View your AERON product categories.'}

        </p>

      </div>

      {/* READ-ONLY ACCESS INFORMATION */}

      {!canManageCategories && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">

          <Eye
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>

            <h2 className="text-sm font-semibold text-blue-800">
              Read-only access
            </h2>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              You can view existing categories and
              assign them to products. Only authorized
              administrators can create, edit or delete
              categories.
            </p>

          </div>

        </div>
      )}

      {/* CATEGORY STATISTICS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* TOTAL CATEGORIES */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Categories
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalCategories}
          </p>

        </div>

        {/* PUBLISHED CATEGORIES */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Published
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {publishedCategories}
          </p>

        </div>

        {/* VISIBLE CATEGORIES */}

        <div className="rounded-lg border border-gray-200 bg-white p-4">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Visible on Website
          </p>

          <p className="mt-2 text-2xl font-bold text-[#977447]">
            {visibleCategories}
          </p>

        </div>

      </div>

      {/* ====================================
          FULL CATEGORY MANAGEMENT
          OWNER AND ADMIN ONLY
          ==================================== */}

      {canManageCategories ? (

        <CategoryList
          initialCategories={categories}
        />

      ) : (

        /* ==================================
           READ-ONLY CATEGORY LIST
           EDITOR ACCESS
           ================================== */

        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">

          {categories.length === 0 ? (

            /* EMPTY STATE */

            <div className="p-10 text-center text-sm text-gray-500">
              No categories found.
            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {categories.map((category) => {

                const isLive =
                  category.isPublished &&
                  category.isVisible;

                return (
                  <div
                    key={category.id}
                    className="flex min-w-0 flex-wrap items-center gap-4 p-4 transition-colors hover:bg-gray-50 sm:p-5"
                  >

                    {/* CATEGORY IMAGE */}

                    <div className="flex h-24 w-[77px] shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">

                      {category.imageUrl ? (

                        <img
                          src={category.imageUrl}
                          alt={category.label}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />

                      ) : (

                        <ImageIcon
                          size={25}
                          className="text-gray-400"
                        />

                      )}

                    </div>

                    {/* CATEGORY INFORMATION */}

                    <div className="min-w-0 flex-1">

                      <h3 className="break-words text-sm font-semibold text-gray-900">
                        {category.label}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {category.name}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-400">
                        {category.slug}
                      </p>

                      {category.description && (
                        <p className="mt-2 break-words text-xs leading-5 text-gray-500">
                          {category.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">

                        Display Order:{' '}
                        {category.displayOrder}

                      </p>

                      {/* CATEGORY STATUS BADGES */}

                      <div className="mt-3 flex flex-wrap gap-2">

                        <span
                          className={`rounded px-2 py-1 text-[10px] font-bold ${
                            category.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >

                          {category.isPublished
                            ? 'PUBLISHED'
                            : 'UNPUBLISHED'}

                        </span>

                        <span
                          className={`rounded px-2 py-1 text-[10px] font-bold ${
                            isLive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >

                          {isLive
                            ? 'LIVE'
                            : 'HIDDEN'}

                        </span>

                      </div>

                    </div>

                    {/* READ-ONLY INDICATOR */}

                    <div className="flex shrink-0 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">

                      <Eye size={15} />

                      View only

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

      )}

    </div>
  );
}