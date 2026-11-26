import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  authorizeAdmin,
  recordAdminAction,
  apiError,
  badInput,
  refreshAdmin,
  secureAdminResponse,
} from '@/lib/admin-api';

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} from '@/lib/audit-log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Context = {
  params: Promise<{ id: string }>;
};

// CATEGORY UPDATE VALIDATION

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

// CATEGORY STATUS VALIDATION

const categoryStatusSchema = z.object({
  isVisible: z.boolean().optional(),

  isPublished: z.boolean().optional(),
});

// CATEGORY NOT FOUND RESPONSE

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

// REFRESH CATEGORY AND PRODUCT DATA

function refreshCategories() {
  refreshAdmin('/admin/categories');
  revalidatePath('/admin/products');
}

// CENTRALIZED CATEGORY ERROR HANDLING

function handleCategoryError(error: unknown) {
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
          error: 'Category name or slug already exists.',
        },
        {
          status: 409,
        }
      )
    );
  }

  return apiError(error, 'Category');
}

// GET INDIVIDUAL CATEGORY

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.CATEGORY_VIEW,
    });

    if (denied) {
      return denied;
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

// UPDATE CATEGORY
// OWNER AND ADMIN ONLY

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.CATEGORY_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid category data.',
        z.flattenError(parsed.error)
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return badInput(
        'Provide at least one category field to update.'
      );
    }

    // ATOMIC CATEGORY UPDATE AND AUDIT LOGGING

    const category = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.category.findUnique({
          where: { id },

          select: {
            isVisible: true,
            isPublished: true,
          },
        });

        if (!existing) {
          return null;
        }

        const updatedCategory = await tx.category.update({
          where: { id },
          data: parsed.data,
        });

        // RECORD CATEGORY UPDATE

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.CATEGORY_UPDATED,
            entityType: AUDIT_ENTITIES.CATEGORY,
            entityId: id,
          },
          tx
        );

        // RECORD VISIBILITY OR PUBLICATION CHANGE

        if (
          existing.isVisible !== updatedCategory.isVisible ||
          existing.isPublished !== updatedCategory.isPublished
        ) {
          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.CATEGORY_VISIBILITY_CHANGED,

              entityType: AUDIT_ENTITIES.CATEGORY,

              entityId: id,
            },
            tx
          );
        }

        return updatedCategory;
      }
    );

    if (!category) {
      return categoryNotFound();
    }

    refreshCategories();

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        category,
        message: 'Category updated successfully.',
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}

// CATEGORY VISIBILITY AND PUBLISH STATUS
// OWNER AND ADMIN ONLY

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.CATEGORY_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = categoryStatusSchema.safeParse(body);

    if (
      !parsed.success ||
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'Provide isVisible or isPublished.'
      );
    }

    // ATOMIC STATUS UPDATE AND AUDIT LOGGING

    const category = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.category.findUnique({
          where: { id },

          select: {
            isVisible: true,
            isPublished: true,
          },
        });

        if (!existing) {
          return null;
        }

        const updatedCategory = await tx.category.update({
          where: { id },
          data: parsed.data,
        });

        // RECORD ACTUAL STATUS CHANGE

        if (
          existing.isVisible !== updatedCategory.isVisible ||
          existing.isPublished !== updatedCategory.isPublished
        ) {
          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.CATEGORY_VISIBILITY_CHANGED,

              entityType: AUDIT_ENTITIES.CATEGORY,

              entityId: id,
            },
            tx
          );
        }

        return updatedCategory;
      }
    );

    if (!category) {
      return categoryNotFound();
    }

    refreshCategories();

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        category,
        message: 'Category status updated.',
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}

// SAFE PERMANENT CATEGORY DELETION
// OWNER AND ADMIN ONLY

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.CATEGORY_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    // ATOMIC CATEGORY DELETION AND AUDIT LOGGING

    const deleted = await prisma.$transaction(
      async (tx) => {

        const category = await tx.category.findUnique({
          where: { id },

          select: {
            name: true,
          },
        });

        if (!category) {
          return null;
        }

        // REMOVE CATEGORY ASSIGNMENTS ONLY
        // NEVER DELETE ACTUAL PRODUCTS

        const removedAssignments =
          await tx.productCategory.deleteMany({
            where: {
              categoryId: id,
            },
          });

        // DELETE CATEGORY

        await tx.category.delete({
          where: { id },
        });

        // RECORD PERMANENT CATEGORY DELETION

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.CATEGORY_DELETED,
            entityType: AUDIT_ENTITIES.CATEGORY,
            entityId: id,
          },
          tx
        );

        return {
          name: category.name,
          affectedProducts: removedAssignments.count,
        };
      }
    );

    if (!deleted) {
      return categoryNotFound();
    }

    refreshCategories();

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        deleted: true,
        deletedProductCount: 0,
        categoryName: deleted.name,
        affectedProducts: deleted.affectedProducts,
        message:
          'Category permanently deleted. Products preserved.',
      })
    );

  } catch (error) {
    return handleCategoryError(error);
  }
}