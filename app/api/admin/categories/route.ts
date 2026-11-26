import {
  NextRequest,
  NextResponse,
} from 'next/server';

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

// CATEGORY VALIDATION

const createCategorySchema = z.object({
  name: z.string().trim().min(1),

  slug: z.string().trim().min(1),

  label: z.string().trim().min(1),

  description: z.string().nullable().optional(),

  imageUrl: z.string().nullable().optional(),

  displayOrder: z.number().int().default(0),

  isVisible: z.boolean().default(true),

  isPublished: z.boolean().default(true),
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

    // VERIFY ADMIN AND CATEGORY MANAGEMENT PERMISSION

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.CATEGORY_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    // VALIDATE REQUEST BODY

    const body = await request
      .json()
      .catch(() => null);

    const result =
      createCategorySchema.safeParse(body);

    if (!result.success) {
      return badInput(
        'Invalid category data.',
        z.flattenError(result.error)
      );
    }

    // ATOMIC CATEGORY CREATION AND AUDIT LOGGING

    const category = await prisma.$transaction(
      async (tx) => {

        const createdCategory = await tx.category.create({
          data: result.data,
        });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.CATEGORY_CREATED,
            entityType: AUDIT_ENTITIES.CATEGORY,
            entityId: createdCategory.id,
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
}