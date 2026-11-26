import {
  NextRequest,
  NextResponse,
} from 'next/server';

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
// CATEGORY VALIDATION
// ==========================================

const createCategorySchema = z.object({
  name: z.string().trim().min(1),

  slug: z.string().trim().min(1),

  label: z.string().trim().min(1),

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
    .default(0),

  isVisible: z
    .boolean()
    .default(true),

  isPublished: z
    .boolean()
    .default(true),
});

// ==========================================
// GET ALL CATEGORIES
// ==========================================

export async function GET(
  request: NextRequest
) {
  try {
    // ======================================
    // AUTHENTICATION AND VIEW PERMISSION
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.CATEGORY_VIEW,
    });

    if (denied) {
      return denied;
    }

    // ======================================
    // FETCH CATEGORIES WITH PRODUCT COUNTS
    // ======================================

    const categories =
      await prisma.category.findMany({
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

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        categories,
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Category'
    );
  }
}

// ==========================================
// CREATE NEW CATEGORY
// OWNER AND ADMIN ONLY
// ==========================================

export async function POST(
  request: NextRequest
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

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE CATEGORY INPUT
    // ======================================

    const result =
      createCategorySchema.safeParse(body);

    if (!result.success) {
      return badInput(
        'Invalid category data.',

        z.flattenError(result.error)
      );
    }

    // ======================================
    // CREATE CATEGORY
    // ======================================

    const category =
      await prisma.category.create({
        data: result.data,
      });

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/categories');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,

          category,
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    // ======================================
    // HANDLE DUPLICATE CATEGORY NAME OR SLUG
    // ======================================

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

    // ======================================
    // CENTRALIZED SECURE ERROR HANDLING
    // ======================================

    return apiError(
      error,
      'Category'
    );
  }
}