
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        specifications: {
          orderBy: { displayOrder: 'asc' },
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
        isPublished: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Product
      </h1>

      <ProductForm
        product={product}
        categories={categories}
      />
    </div>
  );
}
