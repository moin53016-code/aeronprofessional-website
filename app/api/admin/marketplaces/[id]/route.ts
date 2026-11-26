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
// ROUTE CONTEXT
// ==========================================

type Context = {
  params: Promise<{ id: string }>;
};

// ==========================================
// MARKETPLACE VALIDATION
// ==========================================

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

// ==========================================
// MARKETPLACE STATUS VALIDATION
// ==========================================

const statusSchema = z.object({
  isActive: z.boolean(),
});

// ==========================================
// MARKETPLACE NOT FOUND RESPONSE
// ==========================================

function marketplaceNotFound() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error: 'Marketplace not found.',
      },
      {
        status: 404,
      }
    )
  );
}

// ==========================================
// GET INDIVIDUAL MARKETPLACE
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
        PERMISSIONS.MARKETPLACE_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // FETCH MARKETPLACE
    // ======================================

    const marketplace =
      await prisma.marketplace.findUnique({
        where: {
          id,
        },
      });

    if (!marketplace) {
      return marketplaceNotFound();
    }

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        marketplace,
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Marketplace'
    );
  }
}

// ==========================================
// UPDATE MARKETPLACE
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
        PERMISSIONS.MARKETPLACE_MANAGE,
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
    // VALIDATE MARKETPLACE INPUT
    // ======================================

    const parsed =
      marketplaceSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid marketplace information.',

        z.flattenError(parsed.error)
      );
    }

    // ======================================
    // VERIFY EXISTING MARKETPLACE
    // ======================================

    const existingMarketplace =
      await prisma.marketplace.findUnique({
        where: {
          id,
        },
      });

    if (!existingMarketplace) {
      return marketplaceNotFound();
    }

    // ======================================
    // PREVENT DUPLICATE MARKETPLACE NAMES
    // ======================================

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
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'A marketplace with this name already exists.',
          },
          {
            status: 409,
          }
        )
      );
    }

    // ======================================
    // UPDATE MARKETPLACE
    // EXISTING SLUG IS PRESERVED
    // ======================================

    const marketplace =
      await prisma.marketplace.update({
        where: {
          id,
        },

        data: {
          name: parsed.data.name,

          ...(parsed.data.badgeText !== undefined
            ? {
                badgeText:
                  parsed.data.badgeText || null,
              }
            : {}),

          ...(parsed.data.tagline !== undefined
            ? {
                tagline:
                  parsed.data.tagline || null,
              }
            : {}),

          url: parsed.data.url,
        },
      });

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/marketplaces');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        marketplace,

        message:
          'Marketplace updated successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Marketplace'
    );
  }
}

// ==========================================
// ACTIVATE / DEACTIVATE MARKETPLACE
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
        PERMISSIONS.MARKETPLACE_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // VALIDATE MARKETPLACE STATUS
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      statusSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid marketplace status.',

        z.flattenError(parsed.error)
      );
    }

    // ======================================
    // UPDATE MARKETPLACE STATUS
    // ======================================

    const marketplace =
      await prisma.marketplace.update({
        where: {
          id,
        },

        data: {
          isActive:
            parsed.data.isActive,
        },
      });

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/marketplaces');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        marketplace,

        message: parsed.data.isActive
          ? 'Marketplace activated successfully.'
          : 'Marketplace deactivated successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Marketplace'
    );
  }
}

// ==========================================
// PERMANENTLY DELETE MARKETPLACE
// OWNER AND ADMIN ONLY
// WITHOUT DELETING PRODUCTS
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
        PERMISSIONS.MARKETPLACE_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // ATOMIC DATABASE TRANSACTION
    // ======================================

    const removedLinks =
      await prisma.$transaction(
        async (tx) => {

          // ==================================
          // REMOVE PRODUCT-MARKETPLACE LINKS
          // NEVER DELETE ACTUAL PRODUCTS
          // ==================================

          const links =
            await tx.productMarketplaceLink.deleteMany({
              where: {
                marketplaceId: id,
              },
            });

          // ==================================
          // DELETE ONLY MARKETPLACE RECORD
          // ==================================

          await tx.marketplace.delete({
            where: {
              id,
            },
          });

          return links.count;
        }
      );

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/marketplaces');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        deleted: true,

        deletedProductCount: 0,

        removedMarketplaceLinks:
          removedLinks,

        message:
          'Marketplace deleted successfully. All products preserved.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Marketplace'
    );
  }
}