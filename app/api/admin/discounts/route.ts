import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { prisma } from '@/lib/db';

import { z } from 'zod';

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
// DISCOUNT CAMPAIGN VALIDATION
// ==========================================

const createDiscountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(200),

  description: z
    .string()
    .trim()
    .nullable()
    .optional(),

  discountLabel: z
    .string()
    .trim()
    .nullable()
    .optional(),

  isActive: z
    .boolean()
    .default(true),

  startsAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),

  endsAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),

  productIds: z
    .array(z.string().min(1))
    .default([]),
});

// ==========================================
// GET ALL DISCOUNT CAMPAIGNS
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
        PERMISSIONS.DISCOUNT_VIEW,
    });

    if (denied) {
      return denied;
    }

    // ======================================
    // FETCH DISCOUNT CAMPAIGNS
    // ======================================

    const discounts =
      await prisma.discountCampaign.findMany({
        include: {
          discountProducts: {
            include: {
              product: {
                select: {
                  id: true,

                  name: true,

                  slug: true,

                  priceInPaise: true,

                  originalPriceInPaise: true,

                  primaryImageUrl: true,

                  status: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        discounts,
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Discount campaign'
    );
  }
}

// ==========================================
// CREATE DISCOUNT CAMPAIGN
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
        PERMISSIONS.DISCOUNT_MANAGE,
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
    // VALIDATE DISCOUNT CAMPAIGN INPUT
    // ======================================

    const parsed =
      createDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid discount campaign data.',

        z.flattenError(parsed.error)
      );
    }

    const {
      productIds,
      startsAt,
      endsAt,
      ...data
    } = parsed.data;

    // ======================================
    // VALIDATE CAMPAIGN SCHEDULE
    // ======================================

    const startDate = startsAt
      ? new Date(startsAt)
      : null;

    const endDate = endsAt
      ? new Date(endsAt)
      : null;

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return badInput(
        'End date cannot be before start date.'
      );
    }

    // ======================================
    // PREVENT DUPLICATE PRODUCT ASSIGNMENTS
    // ======================================

    const uniqueProductIds = [
      ...new Set(productIds),
    ];

    // ======================================
    // VERIFY SELECTED PRODUCTS EXIST
    // ======================================

    if (uniqueProductIds.length > 0) {
      const existingProducts =
        await prisma.product.count({
          where: {
            id: {
              in: uniqueProductIds,
            },
          },
        });

      if (
        existingProducts !==
        uniqueProductIds.length
      ) {
        return badInput(
          'One or more selected products no longer exist.'
        );
      }
    }

    // ======================================
    // CREATE DISCOUNT CAMPAIGN
    // AND PRODUCT ASSOCIATIONS
    // ======================================

    const discount =
      await prisma.discountCampaign.create({
        data: {
          ...data,

          description:
            data.description || null,

          discountLabel:
            data.discountLabel || null,

          startsAt: startDate,

          endsAt: endDate,

          discountProducts: {
            create: uniqueProductIds.map(
              (productId) => ({
                productId,
              })
            ),
          },
        },

        include: {
          discountProducts: {
            include: {
              product: true,
            },
          },
        },
      });

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/discounts');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,

          discount,

          message:
            'Discount campaign created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(
      error,
      'Discount campaign'
    );
  }
}