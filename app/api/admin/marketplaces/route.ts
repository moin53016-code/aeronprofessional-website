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
// MARKETPLACE VALIDATION
// ==========================================

const marketplaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Marketplace name is required')
    .max(150),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Invalid marketplace slug'
    ),

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
// GET ALL MARKETPLACES
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
        PERMISSIONS.MARKETPLACE_VIEW,
    });

    if (denied) {
      return denied;
    }

    // ======================================
    // FETCH ALL MARKETPLACES
    // ======================================

    const marketplaces =
      await prisma.marketplace.findMany({
        orderBy: [
          {
            createdAt: 'asc',
          },

          {
            id: 'asc',
          },
        ],
      });

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        marketplaces,
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
// CREATE NEW MARKETPLACE
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
        PERMISSIONS.MARKETPLACE_MANAGE,
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

    const {
      name,
      slug,
      badgeText,
      tagline,
      url,
    } = parsed.data;

    // ======================================
    // CHECK FOR DUPLICATE MARKETPLACE
    // ======================================

    const existingMarketplace =
      await prisma.marketplace.findFirst({
        where: {
          OR: [
            {
              slug,
            },

            {
              name: {
                equals: name,

                mode: 'insensitive',
              },
            },
          ],
        },
      });

    if (existingMarketplace) {
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'A marketplace with this name or slug already exists.',
          },
          {
            status: 409,
          }
        )
      );
    }

    // ======================================
    // CREATE MARKETPLACE
    // ======================================

    const marketplace =
      await prisma.marketplace.create({
        data: {
          name,

          slug,

          badgeText:
            badgeText || null,

          tagline:
            tagline || null,

          url,

          isActive: true,
        },
      });

    // ======================================
    // REFRESH STOREFRONT AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/marketplaces');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,

          marketplace,

          message:
            'Marketplace created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(
      error,
      'Marketplace'
    );
  }
}