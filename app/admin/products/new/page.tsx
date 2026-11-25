
import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewProductPage() {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // LOAD PUBLISHED CATEGORIES FROM DATABASE

  const categories = await prisma.category.findMany({
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

      {/* PRODUCT CREATION FORM */}

      <ProductForm categories={categories} />

    </div>
  );
}
