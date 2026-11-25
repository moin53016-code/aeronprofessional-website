
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { prisma } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';

import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  // VERIFY ADMIN SESSION

  await requireAdminPage();

  // GET PRODUCT ID

  const { id } = await params;

  if (!id || !id.trim()) {
    notFound();
  }

  // LOAD PRODUCT AND CATEGORIES

  const [product, categories] =
    await Promise.all([
      prisma.product.findUnique({
        where: {
          id,
        },

        include: {
          images: {
            orderBy: [
              {
                displayOrder: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          },

          specifications: {
            orderBy: [
              {
                displayOrder: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          },

          categories: {
            include: {
              category: true,
            },
          },
        },
      }),

      prisma.category.findMany({
        where: {
          OR: [
            {
              isPublished: true,
            },
            {
              productCategories: {
                some: {
                  productId: id,
                },
              },
            },
          ],
        },

        orderBy: [
          {
            displayOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      }),
    ]);

  // HANDLE DELETED OR NONEXISTENT PRODUCTS

  if (!product) {
    notFound();
  }

  return (
    <div className="w-full min-w-0">

      {/* BACK TO PRODUCTS */}

      <Link
        href="/admin/products"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-black"
      >
        <ArrowLeft size={16} />

        Back to Products
      </Link>

      {/* PAGE HEADING */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Edit Product
        </h1>

        <p className="mt-2 break-words text-sm text-gray-500">
          Manage product details for {product.name}.
        </p>

      </div>

      {/* PRODUCT EDITING FORM */}

      <ProductForm
        product={product}
        categories={categories}
      />

    </div>
  );
}
