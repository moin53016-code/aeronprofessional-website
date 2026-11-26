import { NextRequest, NextResponse } from 'next/server';
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

// DISCOUNT UPDATE VALIDATION

const updateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),

  description: z.string().nullable().optional(),

  discountLabel: z.string().nullable().optional(),

  isActive: z.boolean().optional(),

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

// DISCOUNT STATUS VALIDATION

const statusSchema = z.object({
  isActive: z.boolean(),
});

// INCLUDE RELATED PRODUCTS

const includeProducts = {
  discountProducts: {
    include: {
      product: true,
    },
  },
} as const;

// DISCOUNT NOT FOUND RESPONSE

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

// CENTRALIZED DISCOUNT ERROR HANDLING

function handleDiscountError(error: unknown) {
  if (error instanceof Error) {

    if (error.message === 'CAMPAIGN_NOT_FOUND') {
      return discountNotFound();
    }

    if (error.message === 'INVALID_DATE_RANGE') {
      return badInput(
        'End date must not be before start date.'
      );
    }

    if (error.message === 'INVALID_PRODUCTS') {
      return badInput(
        'One or more selected products no longer exist.'
      );
    }
  }

  return apiError(error, 'Discount campaign');
}

// GET INDIVIDUAL DISCOUNT CAMPAIGN

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.DISCOUNT_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    const discount = await prisma.discountCampaign.findUnique({
      where: { id },
      include: includeProducts,
    });

    if (!discount) {
      return discountNotFound();
    }

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

// UPDATE DISCOUNT CAMPAIGN
// OWNER AND ADMIN ONLY

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.DISCOUNT_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    // VALIDATE REQUEST BODY

    const body = await request
      .json()
      .catch(() => null);

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid discount campaign data.',
        z.flattenError(parsed.error)
      );
    }

    if (Object.keys(parsed.data).length === 0) {
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

    // PREVENT DUPLICATE PRODUCT ASSIGNMENTS

    const uniqueProductIds =
      productIds === undefined
        ? undefined
        : [...new Set(productIds)];

    // ATOMIC DISCOUNT UPDATE AND AUDIT LOGGING

    const discount = await prisma.$transaction(
      async (tx) => {

        // FETCH EXISTING CAMPAIGN

        const existing = await tx.discountCampaign.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new Error('CAMPAIGN_NOT_FOUND');
        }

        // PRESERVE EXISTING CAMPAIGN DATES

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

        // VALIDATE CAMPAIGN SCHEDULE

        if (
          startDate &&
          endDate &&
          endDate < startDate
        ) {
          throw new Error('INVALID_DATE_RANGE');
        }

        // VERIFY SELECTED PRODUCTS EXIST

        if (
          uniqueProductIds !== undefined &&
          uniqueProductIds.length > 0
        ) {
          const existingProducts = await tx.product.count({
            where: {
              id: {
                in: uniqueProductIds,
              },
            },
          });

          if (
            existingProducts !== uniqueProductIds.length
          ) {
            throw new Error('INVALID_PRODUCTS');
          }
        }

        // UPDATE CAMPAIGN DETAILS

        const updatedCampaign =
          await tx.discountCampaign.update({
            where: { id },

            data: {
              ...data,

              ...(startsAt !== undefined
                ? { startsAt: startDate }
                : {}),

              ...(endsAt !== undefined
                ? { endsAt: endDate }
                : {}),
            },
          });

        // UPDATE CAMPAIGN PRODUCT ASSIGNMENTS

        if (uniqueProductIds !== undefined) {

          // REMOVE PREVIOUS ASSIGNMENTS ONLY

          await tx.discountProduct.deleteMany({
            where: {
              campaignId: id,
            },
          });

          // CREATE UPDATED ASSIGNMENTS

          if (uniqueProductIds.length > 0) {
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

        // RECORD DISCOUNT UPDATE

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.DISCOUNT_UPDATED,
            entityType: AUDIT_ENTITIES.DISCOUNT,
            entityId: id,
          },
          tx
        );

        // RECORD ACTIVATION OR DEACTIVATION

        if (
          existing.isActive !== updatedCampaign.isActive
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.DISCOUNT_STATUS_CHANGED,
              entityType: AUDIT_ENTITIES.DISCOUNT,
              entityId: id,
            },
            tx
          );
        }

        // RETURN UPDATED CAMPAIGN

        return tx.discountCampaign.findUniqueOrThrow({
          where: { id },
          include: includeProducts,
        });
      }
    );

    refreshAdmin('/admin/discounts');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        discount,
        message: 'Discount campaign updated successfully.',
      })
    );

  } catch (error) {
    return handleDiscountError(error);
  }
}

// ACTIVATE / DEACTIVATE DISCOUNT CAMPAIGN
// OWNER AND ADMIN ONLY

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.DISCOUNT_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return badInput('Invalid campaign status.');
    }

    // ATOMIC STATUS UPDATE AND AUDIT LOGGING

    const discount = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.discountCampaign.findUnique({
          where: { id },

          select: {
            isActive: true,
          },
        });

        if (!existing) {
          throw new Error('CAMPAIGN_NOT_FOUND');
        }

        const updatedCampaign =
          await tx.discountCampaign.update({
            where: { id },

            data: {
              isActive: parsed.data.isActive,
            },

            include: includeProducts,
          });

        // RECORD ACTUAL STATUS CHANGE

        if (
          existing.isActive !== updatedCampaign.isActive
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.DISCOUNT_STATUS_CHANGED,
              entityType: AUDIT_ENTITIES.DISCOUNT,
              entityId: id,
            },
            tx
          );
        }

        return updatedCampaign;
      }
    );

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

// PERMANENTLY DELETE DISCOUNT CAMPAIGN
// OWNER AND ADMIN ONLY

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.DISCOUNT_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    // ATOMIC CAMPAIGN DELETION AND AUDIT LOGGING

    await prisma.$transaction(async (tx) => {

      // DELETE CAMPAIGN AND ASSOCIATIONS
      // NEVER DELETE ACTUAL PRODUCT RECORDS

      await tx.discountCampaign.delete({
        where: { id },
      });

      // RECORD VERIFIED ADMIN ACTIVITY

      await recordAdminAction(
        admin,
        {
          action: AUDIT_ACTIONS.DISCOUNT_DELETED,
          entityType: AUDIT_ENTITIES.DISCOUNT,
          entityId: id,
        },
        tx
      );

    });

    refreshAdmin('/admin/discounts');

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