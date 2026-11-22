
import { prisma } from '@/lib/db';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Add New Product
      </h1>

      <ProductForm categories={categories} />
    </div>
  );
}
