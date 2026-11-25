
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
} from '@/lib/admin-api';

// DISCOUNT CAMPAIGN VALIDATION

const createDiscountSchema = z.object({
  name: z.string().trim().min(1).max(200),

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

  isActive: z.boolean().default(true),

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

// GET ALL DISCOUNT CAMPAIGNS

export async function GET() {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

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

    return NextResponse.json({
      success: true,
      discounts,
    });
  } catch (error) {
    return apiError(error, 'Discount campaign');
  }
}

// CREATE DISCOUNT CAMPAIGN

export async function POST(
  request: NextRequest
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      createDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid discount campaign data.',
        parsed.error.flatten()
      );
    }

    const {
      productIds,
      startsAt,
      endsAt,
      ...data
    } = parsed.data;

    // VALIDATE CAMPAIGN DATES

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

    // REMOVE DUPLICATE PRODUCT IDS

    const uniqueProductIds = [
      ...new Set(productIds),
    ];

    // VERIFY SELECTED PRODUCTS EXIST

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

    // CREATE CAMPAIGN AND PRODUCT ASSOCIATIONS

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

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/discounts');

    return NextResponse.json(
      {
        success: true,
        discount,
        message:
          'Discount campaign created successfully.',
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return apiError(error, 'Discount campaign');
  }
}
