import { prisma } from '@/lib/db';

import {
  requireAdminPage,
} from '@/lib/admin-page';

import {
  PERMISSIONS,
} from '@/lib/permissions';

import ProductForm from '@/components/admin/ProductForm';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// NEW PRODUCT PAGE
// ==========================================

export default async function NewProductPage() {

  // ========================================
  // SERVER-SIDE PRODUCT CREATION PERMISSION
  // ========================================

  await requireAdminPage({
    permissions: [
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.CATEGORY_VIEW,
    ],

    permissionMode: 'all',
  });

  // ========================================
  // LOAD PUBLISHED CATEGORIES FROM DATABASE
  // ONLY AFTER PERMISSION VERIFICATION
  // ========================================

  const categories =
    await prisma.category.findMany({
      where: {
        isPublished: true,
      },

      orderBy: [
        {
          displayOrder: 'asc',
        },

        {
          name: 'asc',
        },
      ],
    });

  // ========================================
  // RENDER PRODUCT CREATION PAGE
  // ========================================

  return (
    <div className="w-full min-w-0">

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Add New Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create and manage your AERON product listing.
        </p>

      </div>

      {/* AUTHORIZED PRODUCT CREATION FORM */}

      <ProductForm
        categories={categories}
      />

    </div>
  );
}