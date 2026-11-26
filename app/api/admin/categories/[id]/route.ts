import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions';
import { normalizeImageUrl } from '@/lib/image-url';

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

import {
  readJsonBody,
  REQUEST_LIMITS,
} from '@/lib/request-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Context = {
  params: Promise<{ id: string }>;
};

// CATEGORY ID VALIDATION

const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

// SMART CATEGORY IMAGE URL VALIDATION

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .transform((value, ctx) => {

    // CATEGORY IMAGE IS OPTIONAL

    if (value === '') {
      return null;
    }

    const normalized = normalizeImageUrl(value);

    if (!normalized || normalized.length > 2048) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Upload an image or enter a valid HTTPS image URL.',
      });

      return z.NEVER;
    }

    // REJECT IMGBB SHARING PAGES

    if (normalized.startsWith('https://')) {
      const url = new URL(normalized);

      if (
        url.hostname === 'ibb.co' ||
        url.hostname === 'www.ibb.co' ||
        url.hostname === 'imgbb.com' ||
        url.hostname === 'www.imgbb.com'
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Please use the direct image address starting with https://i.ibb.co/ instead of the ImgBB sharing page.',
        });

        return z.NEVER;
      }
    }

    return normalized;
  });

// CATEGORY UPDATE VALIDATION

const updateCategorySchema = z.object({

  name: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional(),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Invalid category slug.'
    )
    .optional(),

  label: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .optional(),

  description: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),

  // SMART CATEGORY IMAGE

  imageUrl: imageUrlSchema
    .nullable()
    .optional(),

  displayOrder: z
    .number()
    .int()
    .min(-2147483648)
    .max(2147483647)
    .optional(),

  isVisible: z
    .boolean()
    .optional(),

  isPublished: z
    .boolean()
    .optional(),
});

// CATEGORY STATUS VALIDATION

const categoryStatusSchema = z.object({

  isVisible:
    z.boolean().optional(),

  isPublished:
    z.boolean().optional(),
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

  // DUPLICATE CATEGORY NAME OR SLUG

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

  return apiError(error, 'Category');
}

// GET INDIVIDUAL CATEGORY

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {

    // VERIFY ADMIN PERMISSION

    const denied = await adminDenied({
      request,

      permission: PERMISSIONS.CATEGORY_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput(
        'Invalid category identifier.'
      );
    }

    // LOAD CATEGORY AND RELATED PRODUCTS

    const category =
      await prisma.category.findUnique({
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

    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,

      permission: PERMISSIONS.CATEGORY_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput(
        'Invalid category identifier.'
      );
    }

    // SECURE REQUEST BODY VALIDATION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.JSON
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE CATEGORY AND IMAGE URL

    const parsed = updateCategorySchema.safeParse(
      body.data
    );

    if (!parsed.success) {

      const details = z.flattenError(
        parsed.error
      );

      const fieldErrors = Object.values(
        details.fieldErrors
      ).flat();

      return badInput(
        fieldErrors[0] || 'Invalid category data.',

        details
      );
    }

    // REJECT EMPTY UPDATES

    if (Object.keys(parsed.data).length === 0) {
      return badInput(
        'Provide at least one category field to update.'
      );
    }

    // ATOMIC CATEGORY UPDATE AND AUDIT LOGGING

    const category = await prisma.$transaction(
      async (tx) => {

        const existing =
          await tx.category.findUnique({
            where: { id },

            select: {
              isVisible: true,

              isPublished: true,
            },
          });

        if (!existing) {
          return null;
        }

        // UPDATE CATEGORY WITH NORMALIZED IMAGE URL

        const updatedCategory =
          await tx.category.update({
            where: { id },

            data: parsed.data,
          });

        // RECORD CATEGORY UPDATE

        await recordAdminAction(
          admin,
          {
            action:
              AUDIT_ACTIONS.CATEGORY_UPDATED,

            entityType:
              AUDIT_ENTITIES.CATEGORY,

            entityId: id,
          },
          tx
        );

        // RECORD VISIBILITY OR PUBLICATION CHANGE

        if (
          existing.isVisible !==
            updatedCategory.isVisible ||

          existing.isPublished !==
            updatedCategory.isPublished
        ) {
          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.CATEGORY_VISIBILITY_CHANGED,

              entityType:
                AUDIT_ENTITIES.CATEGORY,

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

    if (!idSchema.safeParse(id).success) {
      return badInput(
        'Invalid category identifier.'
      );
    }

    // MAXIMUM STATUS REQUEST SIZE: 4 KB

    const body = await readJsonBody(
      request,
      4 * 1024
    );

    if (!body.ok) {
      return body.response;
    }

    const parsed = categoryStatusSchema.safeParse(
      body.data
    );

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

        const existing =
          await tx.category.findUnique({
            where: { id },

            select: {
              isVisible: true,

              isPublished: true,
            },
          });

        if (!existing) {
          return null;
        }

        const updatedCategory =
          await tx.category.update({
            where: { id },

            data: parsed.data,
          });

        // RECORD ACTUAL STATUS CHANGE

        if (
          existing.isVisible !==
            updatedCategory.isVisible ||

          existing.isPublished !==
            updatedCategory.isPublished
        ) {
          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.CATEGORY_VISIBILITY_CHANGED,

              entityType:
                AUDIT_ENTITIES.CATEGORY,

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

        message:
          'Category status updated.',
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

    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,

      permission: PERMISSIONS.CATEGORY_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput(
        'Invalid category identifier.'
      );
    }

    // ATOMIC CATEGORY DELETION AND AUDIT LOGGING

    const deleted = await prisma.$transaction(
      async (tx) => {

        const category =
          await tx.category.findUnique({
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
            action:
              AUDIT_ACTIONS.CATEGORY_DELETED,

            entityType:
              AUDIT_ENTITIES.CATEGORY,

            entityId: id,
          },
          tx
        );

        return {
          name: category.name,

          affectedProducts:
            removedAssignments.count,
        };
      }
    );

    if (!deleted) {
      return categoryNotFound();
    }

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshCategories();

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        deleted: true,

        deletedProductCount: 0,

        categoryName: deleted.name,

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