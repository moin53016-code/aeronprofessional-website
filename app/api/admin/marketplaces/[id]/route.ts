
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
} from '@/lib/admin-api';

type Context = {
  params: Promise<{ id: string }>;
};

// MARKETPLACE VALIDATION

const marketplaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Marketplace name is required')
    .max(150),

  badgeText: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  tagline: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),

  url: z
    .string()
    .trim()
    .max(2048)
    .url('Enter a valid marketplace URL')
    .refine(
      (value) => {
        try {
          const url = new URL(value);

          return (
            url.protocol === 'https:' &&
            !url.username &&
            !url.password
          );
        } catch {
          return false;
        }
      },
      'Marketplace URL must be a valid HTTPS link'
    ),
});

// MARKETPLACE STATUS VALIDATION

const statusSchema = z.object({
  isActive: z.boolean(),
});

// GET INDIVIDUAL MARKETPLACE

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    const marketplace =
      await prisma.marketplace.findUnique({
        where: { id },
      });

    if (!marketplace) {
      return NextResponse.json(
        {
          error: 'Marketplace not found.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      marketplace,
    });
  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}

// UPDATE MARKETPLACE

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      marketplaceSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid marketplace information.',
        parsed.error.flatten()
      );
    }

    const existingMarketplace =
      await prisma.marketplace.findUnique({
        where: { id },
      });

    if (!existingMarketplace) {
      return NextResponse.json(
        {
          error: 'Marketplace not found.',
        },
        {
          status: 404,
        }
      );
    }

    // PREVENT DUPLICATE MARKETPLACE NAMES

    const duplicate =
      await prisma.marketplace.findFirst({
        where: {
          id: {
            not: id,
          },

          name: {
            equals: parsed.data.name,
            mode: 'insensitive',
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            'A marketplace with this name already exists.',
        },
        {
          status: 409,
        }
      );
    }

    // UPDATE MARKETPLACE
    // EXISTING SLUG IS PRESERVED

    const marketplace =
      await prisma.marketplace.update({
        where: { id },

        data: {
          name: parsed.data.name,

          badgeText:
            parsed.data.badgeText === undefined
              ? existingMarketplace.badgeText
              : parsed.data.badgeText || null,

          tagline:
            parsed.data.tagline === undefined
              ? existingMarketplace.tagline
              : parsed.data.tagline || null,

          url: parsed.data.url,
        },
      });

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/marketplaces');

    return NextResponse.json({
      success: true,
      marketplace,
      message:
        'Marketplace updated successfully.',
    });
  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}

// ACTIVATE / DEACTIVATE MARKETPLACE

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      statusSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid marketplace status.',
        parsed.error.flatten()
      );
    }

    const marketplace =
      await prisma.marketplace.update({
        where: { id },

        data: {
          isActive: parsed.data.isActive,
        },
      });

    refreshAdmin('/admin/marketplaces');

    return NextResponse.json({
      success: true,
      marketplace,
      message: parsed.data.isActive
        ? 'Marketplace activated successfully.'
        : 'Marketplace deactivated successfully.',
    });
  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}

// PERMANENTLY DELETE MARKETPLACE
// WITHOUT DELETING PRODUCTS

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    const removedLinks =
      await prisma.$transaction(
        async (tx) => {
          // REMOVE PRODUCT-MARKETPLACE ASSOCIATIONS

          const links =
            await tx.productMarketplaceLink.deleteMany({
              where: {
                marketplaceId: id,
              },
            });

          // DELETE ONLY THE MARKETPLACE RECORD

          await tx.marketplace.delete({
            where: { id },
          });

          return links.count;
        }
      );

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/marketplaces');

    return NextResponse.json({
      success: true,
      deleted: true,

      deletedProductCount: 0,
      removedMarketplaceLinks: removedLinks,

      message:
        'Marketplace deleted successfully. All products preserved.',
    });
  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}
