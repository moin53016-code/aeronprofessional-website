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
// ROUTE CONTEXT
// ==========================================

type Context = {
  params: Promise<{ id: string }>;
};

// ==========================================
// DISCOUNT UPDATE VALIDATION
// ==========================================

const updateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional(),

  description: z
    .string()
    .nullable()
    .optional(),

  discountLabel: z
    .string()
    .nullable()
    .optional(),

  isActive: z
    .boolean()
    .optional(),

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
    .optional(),
});

// ==========================================
// DISCOUNT STATUS VALIDATION
// ==========================================

const statusSchema = z.object({
  isActive: z.boolean(),
});

// ==========================================
// INCLUDE RELATED PRODUCTS
// ==========================================

const includeProducts = {
  discountProducts: {
    include: {
      product: true,
    },
  },
} as const;

// ==========================================
// DISCOUNT NOT FOUND RESPONSE
// ==========================================

function discountNotFound() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error: 'Discount campaign not found.',
      },
      {
        status: 404,
      }
    )
  );
}

// ==========================================
// CENTRALIZED DISCOUNT ERROR HANDLING
// ==========================================

function handleDiscountError(
  error: unknown
) {
  if (error instanceof Error) {
    if (
      error.message === 'CAMPAIGN_NOT_FOUND'
    ) {
      return discountNotFound();
    }

    if (
      error.message === 'INVALID_DATE_RANGE'
    ) {
      return badInput(
        'End date must not be before start date.'
      );
    }

    if (
      error.message === 'INVALID_PRODUCTS'
    ) {
      return badInput(
        'One or more selected products no longer exist.'
      );
    }
  }

  return apiError(
    error,
    'Discount campaign'
  );
}

// ==========================================
// GET INDIVIDUAL DISCOUNT CAMPAIGN
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: Context
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

    const { id } = await params;

    // ======================================
    // FETCH CAMPAIGN AND RELATED PRODUCTS
    // ======================================

    const discount =
      await prisma.discountCampaign.findUnique({
        where: {
          id,
        },

        include: includeProducts,
      });

    if (!discount) {
      return discountNotFound();
    }

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        discount,
      })
    );

  } catch (error) {
    return handleDiscountError(error);
  }
}

// ==========================================
// UPDATE DISCOUNT CAMPAIGN
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
        PERMISSIONS.DISCOUNT_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE UPDATE INPUT
    // ======================================

    const parsed =
      updateSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid discount campaign data.',

        z.flattenError(parsed.error)
      );
    }

    // REJECT EMPTY UPDATE REQUESTS

    if (
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'No discount campaign changes provided.'
      );
    }

    const {
      productIds,
      startsAt,
      endsAt,
      ...data
    } = parsed.data;

    // ======================================
    // PREVENT DUPLICATE PRODUCT ASSIGNMENTS
    // ======================================

    const uniqueProductIds =
      productIds === undefined
        ? undefined
        : [...new Set(productIds)];

    // ======================================
    // ATOMIC DATABASE TRANSACTION
    // ======================================

    const discount =
      await prisma.$transaction(
        async (tx) => {

          // FETCH EXISTING CAMPAIGN

          const existing =
            await tx.discountCampaign.findUnique({
              where: {
                id,
              },
            });

          if (!existing) {
            throw new Error(
              'CAMPAIGN_NOT_FOUND'
            );
          }

          // ==================================
          // PRESERVE EXISTING CAMPAIGN DATES
          // ==================================

          const startDate =
            startsAt === undefined
              ? existing.startsAt
              : startsAt
                ? new Date(startsAt)
                : null;

          const endDate =
            endsAt === undefined
              ? existing.endsAt
              : endsAt
                ? new Date(endsAt)
                : null;

          // ==================================
          // VALIDATE CAMPAIGN DATE RANGE
          // ==================================

          if (
            startDate &&
            endDate &&
            endDate < startDate
          ) {
            throw new Error(
              'INVALID_DATE_RANGE'
            );
          }

          // ==================================
          // VERIFY SELECTED PRODUCTS EXIST
          // ==================================

          if (
            uniqueProductIds !== undefined &&
            uniqueProductIds.length > 0
          ) {
            const existingProducts =
              await tx.product.count({
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
              throw new Error(
                'INVALID_PRODUCTS'
              );
            }
          }

          // ==================================
          // UPDATE DISCOUNT CAMPAIGN
          // ==================================

          await tx.discountCampaign.update({
            where: {
              id,
            },

            data: {
              ...data,

              startsAt: startDate,

              endsAt: endDate,
            },
          });

          // ==================================
          // UPDATE CAMPAIGN PRODUCT ASSIGNMENTS
          // ==================================

          if (
            uniqueProductIds !== undefined
          ) {
            // REMOVE PREVIOUS ASSIGNMENTS ONLY

            await tx.discountProduct.deleteMany({
              where: {
                campaignId: id,
              },
            });

            // CREATE UPDATED ASSIGNMENTS

            if (
              uniqueProductIds.length > 0
            ) {
              await tx.discountProduct.createMany({
                data: uniqueProductIds.map(
                  (productId) => ({
                    campaignId: id,

                    productId,
                  })
                ),
              });
            }
          }

          // ==================================
          // RETURN UPDATED CAMPAIGN
          // ==================================

          return tx.discountCampaign.findUniqueOrThrow({
            where: {
              id,
            },

            include: includeProducts,
          });
        }
      );

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/discounts');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        discount,

        message:
          'Discount campaign updated successfully.',
      })
    );

  } catch (error) {
    return handleDiscountError(error);
  }
}

// ==========================================
// ACTIVATE / DEACTIVATE DISCOUNT CAMPAIGN
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
        PERMISSIONS.DISCOUNT_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // VALIDATE CAMPAIGN STATUS
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      statusSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid campaign status.'
      );
    }

    // ======================================
    // UPDATE CAMPAIGN STATUS
    // ======================================

    const discount =
      await prisma.discountCampaign.update({
        where: {
          id,
        },

        data: {
          isActive:
            parsed.data.isActive,
        },

        include: includeProducts,
      });

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/discounts');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        discount,

        message:
          'Discount campaign status updated successfully.',
      })
    );

  } catch (error) {
    return handleDiscountError(error);
  }
}

// ==========================================
// PERMANENTLY DELETE DISCOUNT CAMPAIGN
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
        PERMISSIONS.DISCOUNT_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // DELETE CAMPAIGN AND ITS ASSOCIATIONS
    // NEVER DELETE ACTUAL PRODUCT RECORDS
    // ======================================

    await prisma.discountCampaign.delete({
      where: {
        id,
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
      NextResponse.json({
        success: true,

        deleted: true,

        message:
          'Discount campaign deleted. Products preserved.',
      })
    );

  } catch (error) {
    return handleDiscountError(error);
  }
}