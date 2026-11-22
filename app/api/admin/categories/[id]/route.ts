import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        productCategories: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Fetch category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Update category error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name or slug already in use' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (typeof body.isVisible === 'boolean') {
      dataToUpdate.isVisible = body.isVisible;
    }
    if (typeof body.isPublished === 'boolean') {
      dataToUpdate.isPublished = body.isPublished;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'Provide isVisible or isPublished boolean' },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Patch category error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


  export async function DELETE(
    request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // Check whether the category exists
      const category = await tx.category.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
      }

      // Permanently delete all products assigned
      // to this category, including shared products.
      const deletedProducts = await tx.product.deleteMany({
        where: {
          categories: {
            some: {
              categoryId: id,
            },
          },
        },
      });

      // Delete the category itself
      await tx.category.delete({
        where: { id },
      });

      return {
        categoryName: category.name,
        deletedProductCount: deletedProducts.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Category "${result.categoryName}" and ${result.deletedProductCount} associated product(s) permanently deleted.`,
      deletedProductCount: result.deletedProductCount,
    });
  } catch (error: any) {
    console.error('Delete category error:', error);

    if (
      error.message === 'CATEGORY_NOT_FOUND' ||
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete category and its products.',
      },
      { status: 500 }
    );
  }
}
