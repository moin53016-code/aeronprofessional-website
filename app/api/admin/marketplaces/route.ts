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

import {
  readJsonBody,
  REQUEST_LIMITS,
} from '@/lib/request-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// MARKETPLACE URL VALIDATION

const marketplaceUrlSchema = z
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
          Boolean(url.hostname) &&
          !url.username &&
          !url.password
        );

      } catch {
        return false;
      }
    },
    'Marketplace URL must be a valid HTTPS link.'
  );

// MARKETPLACE VALIDATION

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

  url: marketplaceUrlSchema,
});

// DUPLICATE MARKETPLACE RESPONSE

function duplicateMarketplace() {
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

// GET ALL MARKETPLACES

export async function GET(request: NextRequest) {
  try {

    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.MARKETPLACE_VIEW,
    });

    if (denied) {
      return denied;
    }

    const marketplaces = await prisma.marketplace.findMany({
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        marketplaces,
      })
    );

  } catch (error) {
    return apiError(error, 'Marketplace');
  }
}

// CREATE NEW MARKETPLACE
// OWNER AND ADMIN ONLY

export async function POST(request: NextRequest) {
  try {

    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.MARKETPLACE_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    // CENTRALIZED REQUEST BODY PROTECTION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.JSON
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE MARKETPLACE INPUT

    const parsed = marketplaceSchema.safeParse(
      body.data
    );

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

    // ATOMIC MARKETPLACE CREATION AND AUDIT LOGGING

    const marketplace = await prisma.$transaction(
      async (tx) => {

        // CHECK FOR DUPLICATE MARKETPLACE

        const existingMarketplace =
          await tx.marketplace.findFirst({
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
          return null;
        }

        // CREATE MARKETPLACE

        const createdMarketplace =
          await tx.marketplace.create({
            data: {
              name,

              slug,

              badgeText: badgeText || null,

              tagline: tagline || null,

              url,

              isActive: true,
            },
          });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action:
              AUDIT_ACTIONS.MARKETPLACE_CREATED,

            entityType:
              AUDIT_ENTITIES.MARKETPLACE,

            entityId:
              createdMarketplace.id,
          },
          tx
        );

        return createdMarketplace;
      }
    );

    if (!marketplace) {
      return duplicateMarketplace();
    }

    // REFRESH STOREFRONT AND ADMIN PANEL

    refreshAdmin('/admin/marketplaces');

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

    // HANDLE DATABASE UNIQUE CONSTRAINT VIOLATION

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