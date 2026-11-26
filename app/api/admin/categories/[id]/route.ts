import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { prisma } from '@/lib/db';

import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
  secureAdminResponse,
} from '@/lib/admin-api';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// ROUTE CONTEXT
// ==========================================

type Context = {
  params: Promise<{ id: string }>;
};

// ==========================================
// CATEGORY UPDATE VALIDATION
// ==========================================

const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .optional(),

  slug: z
    .string()
    .trim()
    .min(1)
    .optional(),

  label: z
    .string()
    .trim()
    .min(1)
    .optional(),

  description: z
    .string()
    .nullable()
    .optional(),

  imageUrl: z
    .string()
    .nullable()
    .optional(),

  displayOrder: z
    .number()
    .int()
    .optional(),

  isVisible: z
    .boolean()
    .optional(),

  isPublished: z
    .boolean()
    .optional(),
});

// ==========================================
// CATEGORY STATUS VALIDATION
// ==========================================

const categoryStatusSchema = z.object({
  isVisible: z.boolean().optional(),

  isPublished: z.boolean().optional(),
});

// ==========================================
// CATEGORY NOT FOUND RESPONSE
// ==========================================

function categoryNotFound() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error: 'Category not found.',
      },
      {
        status: 404,
      }
    )
  );
}

// ==========================================
// REFRESH CATEGORY AND PRODUCT DATA
// ==========================================

function refreshCategories() {
  refreshAdmin('/admin/categories');

  revalidatePath('/admin/products');
}

// ==========================================
// CENTRALIZED CATEGORY ERROR HANDLING
// ==========================================

function handleCategoryError(
  error: unknown
) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    return secureAdminResponse(
      NextResponse.json(
        {
          success: false,

          error:
            'Category name or slug already exists.',
        },
        {
          status: 409,
        }
      )
    );
  }

  return apiError(
    error,
    'Category'
  );
}

// ==========================================
// GET INDIVIDUAL CATEGORY
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    // AUTHENTICATION AND VIEW PERMISSION

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.CATEGORY_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // FETCH CATEGORY WITH RELATED PRODUCTS

    const category =
      await prisma.category.findUnique({
        where: {
          id,
        },

        include: {
          productCategories: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!category) {
      return categoryNotFound();
    }

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        category,
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}

// ==========================================
// UPDATE CATEGORY
// OWNER AND ADMIN ONLY
// ==========================================

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    // ======================================
    // AUTHENTICATION, CSRF AND PERMISSIONS
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.CATEGORY_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // VALIDATE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid category data.',

        z.flattenError(parsed.error)
      );
    }

    // ======================================
    // REJECT EMPTY UPDATE REQUESTS
    // ======================================

    if (
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'Provide at least one category field to update.'
      );
    }

    // ======================================
    // UPDATE CATEGORY
    // ======================================

    const category =
      await prisma.category.update({
        where: {
          id,
        },

        data: parsed.data,
      });

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshCategories();

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        category,

        message:
          'Category updated successfully.',
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}

// ==========================================
// CATEGORY VISIBILITY AND PUBLISH STATUS
// OWNER AND ADMIN ONLY
// ==========================================

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    // ======================================
    // AUTHENTICATION, CSRF AND PERMISSIONS
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.CATEGORY_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // VALIDATE STATUS UPDATE
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      categoryStatusSchema.safeParse(body);

    if (
      !parsed.success ||
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'Provide isVisible or isPublished.'
      );
    }

    // ======================================
    // UPDATE CATEGORY STATUS
    // ======================================

    const category =
      await prisma.category.update({
        where: {
          id,
        },

        data: parsed.data,
      });

    refreshCategories();

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        category,

        message:
          'Category status updated.',
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}

// ==========================================
// SAFE PERMANENT CATEGORY DELETION
// OWNER AND ADMIN ONLY
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    // ======================================
    // AUTHENTICATION, CSRF AND PERMISSIONS
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.CATEGORY_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // ATOMIC DATABASE TRANSACTION
    // ======================================

    const deleted =
      await prisma.$transaction(
        async (tx) => {

          // FETCH CATEGORY AND PRODUCT COUNT

          const category =
            await tx.category.findUnique({
              where: {
                id,
              },

              select: {
                name: true,

                _count: {
                  select: {
                    productCategories: true,
                  },
                },
              },
            });

          if (!category) {
            return null;
          }

          // ==================================
          // REMOVE CATEGORY ASSIGNMENTS ONLY
          // NEVER DELETE ACTUAL PRODUCTS
          // ==================================

          await tx.productCategory.deleteMany({
            where: {
              categoryId: id,
            },
          });

          // DELETE CATEGORY

          await tx.category.delete({
            where: {
              id,
            },
          });

          return {
            name: category.name,

            affectedProducts:
              category._count.productCategories,
          };
        }
      );

    if (!deleted) {
      return categoryNotFound();
    }

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshCategories();

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        deleted: true,

        deletedProductCount: 0,

        categoryName:
          deleted.name,

        affectedProducts:
          deleted.affectedProducts,

        message:
          'Category permanently deleted. Products preserved.',
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}