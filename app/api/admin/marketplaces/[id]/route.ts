import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

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

// MARKETPLACE NOT FOUND RESPONSE

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

// DUPLICATE MARKETPLACE RESPONSE

function duplicateMarketplace() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,
        error: 'A marketplace with this name already exists.',
      },
      {
        status: 409,
      }
    )
  );
}

// GET INDIVIDUAL MARKETPLACE

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.MARKETPLACE_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    const marketplace = await prisma.marketplace.findUnique({
      where: { id },
    });

    if (!marketplace) {
      return marketplaceNotFound();
    }

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        marketplace,
      })
    );

  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}

// UPDATE MARKETPLACE
// OWNER AND ADMIN ONLY

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.MARKETPLACE_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = marketplaceSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid marketplace information.',
        z.flattenError(parsed.error)
      );
    }

    // ATOMIC MARKETPLACE UPDATE AND AUDIT LOGGING

    const result = await prisma.$transaction(
      async (tx) => {

        // VERIFY EXISTING MARKETPLACE

        const existing = await tx.marketplace.findUnique({
          where: { id },
        });

        if (!existing) {
          return {
            outcome: 'NOT_FOUND' as const,
          };
        }

        // PREVENT DUPLICATE MARKETPLACE NAMES

        const duplicate = await tx.marketplace.findFirst({
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
          return {
            outcome: 'DUPLICATE' as const,
          };
        }

        // UPDATE MARKETPLACE
        // EXISTING SLUG IS PRESERVED

        const marketplace = await tx.marketplace.update({
          where: { id },

          data: {
            name: parsed.data.name,

            ...(parsed.data.badgeText !== undefined
              ? {
                  badgeText: parsed.data.badgeText || null,
                }
              : {}),

            ...(parsed.data.tagline !== undefined
              ? {
                  tagline: parsed.data.tagline || null,
                }
              : {}),

            url: parsed.data.url,
          },
        });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.MARKETPLACE_UPDATED,
            entityType: AUDIT_ENTITIES.MARKETPLACE,
            entityId: id,
          },
          tx
        );

        return {
          outcome: 'UPDATED' as const,
          marketplace,
        };
      }
    );

    if (result.outcome === 'NOT_FOUND') {
      return marketplaceNotFound();
    }

    if (result.outcome === 'DUPLICATE') {
      return duplicateMarketplace();
    }

    refreshAdmin('/admin/marketplaces');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        marketplace: result.marketplace,
        message: 'Marketplace updated successfully.',
      })
    );

  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return duplicateMarketplace();
    }

    return apiError(error, 'Marketplace');
  }
}

// ACTIVATE / DEACTIVATE MARKETPLACE
// OWNER AND ADMIN ONLY

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.MARKETPLACE_MANAGE,
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
      return badInput(
        'Invalid marketplace status.',
        z.flattenError(parsed.error)
      );
    }

    // ATOMIC STATUS UPDATE AND AUDIT LOGGING

    const marketplace = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.marketplace.findUnique({
          where: { id },

          select: {
            isActive: true,
          },
        });

        if (!existing) {
          return null;
        }

        const updatedMarketplace = await tx.marketplace.update({
          where: { id },

          data: {
            isActive: parsed.data.isActive,
          },
        });

        // RECORD ACTUAL STATUS CHANGE

        if (
          existing.isActive !== updatedMarketplace.isActive
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.MARKETPLACE_STATUS_CHANGED,
              entityType: AUDIT_ENTITIES.MARKETPLACE,
              entityId: id,
            },
            tx
          );
        }

        return updatedMarketplace;
      }
    );

    if (!marketplace) {
      return marketplaceNotFound();
    }

    refreshAdmin('/admin/marketplaces');

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
    return apiError(error, 'Marketplace');
  }
}

// PERMANENTLY DELETE MARKETPLACE
// OWNER AND ADMIN ONLY
// WITHOUT DELETING PRODUCTS

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.MARKETPLACE_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    // ATOMIC MARKETPLACE DELETION AND AUDIT LOGGING

    const removedLinks = await prisma.$transaction(
      async (tx) => {

        // REMOVE PRODUCT-MARKETPLACE LINKS ONLY

        const links = await tx.productMarketplaceLink.deleteMany({
          where: {
            marketplaceId: id,
          },
        });

        // DELETE MARKETPLACE RECORD
        // NEVER DELETE ACTUAL PRODUCTS

        await tx.marketplace.delete({
          where: { id },
        });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.MARKETPLACE_DELETED,
            entityType: AUDIT_ENTITIES.MARKETPLACE,
            entityId: id,
          },
          tx
        );

        return links.count;
      }
    );

    refreshAdmin('/admin/marketplaces');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        deleted: true,
        deletedProductCount: 0,
        removedMarketplaceLinks: removedLinks,

        message:
          'Marketplace deleted successfully. All products preserved.',
      })
    );

  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}