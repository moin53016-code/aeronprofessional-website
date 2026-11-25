
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>;
};

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized. Please log in.',
    },
    { status: 401 }
  );
}

function refreshCategories() {
  revalidatePath('/');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
}

function handleError(
  error: unknown,
  operation: string
) {
  console.error(`Category ${operation} error:`, error);

  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? error.code
      : undefined;

  if (code === 'P2025') {
    return NextResponse.json(
      {
        success: false,
        error: 'Category not found.',
      },
      { status: 404 }
    );
  }

  if (code === 'P2002') {
    return NextResponse.json(
      {
        success: false,
        error: 'Category name or slug already exists.',
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: `Failed to ${operation} category.`,
    },
    { status: 500 }
  );
}

// GET CATEGORY

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) {
      return unauthorized();
    }

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
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    return handleError(error, 'fetch');
  }
}

// EDIT CATEGORY

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category data.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    refreshCategories();

    return NextResponse.json({
      success: true,
      category,
      message: 'Category updated successfully.',
    });
  } catch (error) {
    return handleError(error, 'update');
  }
}

// SHOW / HIDE / PUBLISH

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const parsed = z
      .object({
        isVisible: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      })
      .safeParse(body);

    if (
      !parsed.success ||
      Object.keys(parsed.data).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provide isVisible or isPublished.',
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    refreshCategories();

    return NextResponse.json({
      success: true,
      category,
      message: 'Category status updated.',
    });
  } catch (error) {
    return handleError(error, 'update');
  }
}

// SAFE PERMANENT CATEGORY DELETE

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) {
      return unauthorized();
    }

    const { id } = await params;

    const deleted = await prisma.$transaction(
      async (tx) => {
        const category = await tx.category.findUnique({
          where: { id },
          select: {
            name: true,
            _count: {
              select: {
                productCategories: true,
              },
            },
          },
        });

        if (!category) return null;

        // Only remove category assignments.
        // NEVER delete the actual products.

        await tx.productCategory.deleteMany({
          where: { categoryId: id },
        });

        await tx.category.delete({
          where: { id },
        });

        return {
          name: category.name,
          affectedProducts:
            category._count.productCategories,
        };
      }
    );

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found.',
        },
        { status: 404 }
      );
    }

    refreshCategories();

    return NextResponse.json({
      success: true,
      deleted: true,
      deletedProductCount: 0,
      categoryName: deleted.name,
      affectedProducts: deleted.affectedProducts,
      message:
        'Category permanently deleted. Products preserved.',
    });
  } catch (error) {
    return handleError(error, 'delete');
  }
}
