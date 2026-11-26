import { NextRequest, NextResponse } from 'next/server';
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

// SMART CATEGORY IMAGE URL VALIDATION

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .transform((value, ctx) => {

    // CATEGORY IMAGE IS OPTIONAL

    if (value === '') {
      return '';
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

// CATEGORY VALIDATION

const createCategorySchema = z.object({

  name: z
    .string()
    .trim()
    .min(1)
    .max(200),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Invalid category slug.'
    ),

  label: z
    .string()
    .trim()
    .min(1)
    .max(150),

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
    .default(0),

  isVisible: z
    .boolean()
    .default(true),

  isPublished: z
    .boolean()
    .default(true),
});

// GET ALL CATEGORIES

export async function GET(request: NextRequest) {
  try {

    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.CATEGORY_VIEW,
    });

    if (denied) {
      return denied;
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            productCategories: true,
          },
        },
      },

      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        categories,
      })
    );

  } catch (error) {
    return apiError(error, 'Category');
  }
}

// CREATE NEW CATEGORY
// OWNER AND ADMIN ONLY

export async function POST(request: NextRequest) {
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

    // SECURE REQUEST BODY VALIDATION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.JSON
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE CATEGORY AND IMAGE URL

    const result = createCategorySchema.safeParse(
      body.data
    );

    if (!result.success) {

      const details = z.flattenError(
        result.error
      );

      const fieldErrors = Object.values(
        details.fieldErrors
      ).flat();

      return badInput(
        fieldErrors[0] || 'Invalid category data.',
        details
      );
    }

    // ATOMIC CATEGORY CREATION AND AUDIT LOGGING

    const category = await prisma.$transaction(
      async (tx) => {

        const createdCategory =
          await tx.category.create({
            data: {
              ...result.data,

              imageUrl:
                result.data.imageUrl || null,
            },
          });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action:
              AUDIT_ACTIONS.CATEGORY_CREATED,

            entityType:
              AUDIT_ENTITIES.CATEGORY,

            entityId:
              createdCategory.id,
          },
          tx
        );

        return createdCategory;
      }
    );

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/categories');

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,

          category,

          message:
            'Category created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {

    // HANDLE DUPLICATE CATEGORY NAME OR SLUG

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
}