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

// IMAGE URL VALIDATION

const imageUrlSchema = z.string().trim().refine(
  (value) => {
    if (
      /^\/(?:uploads|images)\/[a-zA-Z0-9._-]+$/.test(value)
    ) {
      return true;
    }

    try {
      const url = new URL(value);

      return (
        url.protocol === 'https:' ||
        url.protocol === 'http:'
      );
    } catch {
      return false;
    }
  },
  'Enter a valid image URL or local image path.'
);

// BANNER UPDATE VALIDATION

const updateBannerSchema = z.object({
  eyebrow: z.string().trim().min(1).max(200).optional(),

  title: z.string().trim().min(1).max(500).optional(),

  description: z.string().trim().min(1).max(5000).optional(),

  imageUrl: imageUrlSchema.optional(),

  mobileImageUrl: imageUrlSchema
    .or(z.literal(''))
    .nullable()
    .optional(),

  buttonLabel: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  buttonTarget: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional(),

  displayOrder: z.number().int().optional(),

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
});

// BANNER STATUS VALIDATION

const patchBannerSchema = z.object({
  isActive: z.boolean().optional(),

  displayOrder: z.number().int().optional(),
});

// BANNER NOT FOUND RESPONSE

function bannerNotFound() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,
        error: 'Banner not found.',
      },
      {
        status: 404,
      }
    )
  );
}

// GET INDIVIDUAL BANNER

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.BANNER_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    const banner = await prisma.homepageBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return bannerNotFound();
    }

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        banner,
      })
    );

  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// UPDATE BANNER

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.BANNER_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = updateBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner data.',
        z.flattenError(parsed.error)
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return badInput('No banner changes provided.');
    }

    const {
      startsAt,
      endsAt,
      mobileImageUrl,
      buttonLabel,
      buttonTarget,
      ...data
    } = parsed.data;

    // ATOMIC BANNER UPDATE AND AUDIT LOGGING

    const result = await prisma.$transaction(
      async (tx) => {

        const existingBanner =
          await tx.homepageBanner.findUnique({
            where: { id },
          });

        if (!existingBanner) {
          return {
            outcome: 'NOT_FOUND' as const,
          };
        }

        // PRESERVE EXISTING SCHEDULE

        const startDate =
          startsAt === undefined
            ? existingBanner.startsAt
            : startsAt
              ? new Date(startsAt)
              : null;

        const endDate =
          endsAt === undefined
            ? existingBanner.endsAt
            : endsAt
              ? new Date(endsAt)
              : null;

        // VALIDATE BANNER DATE RANGE

        if (
          startDate &&
          endDate &&
          endDate < startDate
        ) {
          return {
            outcome: 'INVALID_SCHEDULE' as const,
          };
        }

        // UPDATE BANNER

        const banner = await tx.homepageBanner.update({
          where: { id },

          data: {
            ...data,

            ...(mobileImageUrl !== undefined
              ? {
                  mobileImageUrl: mobileImageUrl || null,
                }
              : {}),

            ...(buttonLabel !== undefined
              ? {
                  buttonLabel: buttonLabel || 'SHOP NOW',
                }
              : {}),

            ...(buttonTarget !== undefined
              ? {
                  buttonTarget: buttonTarget || 'Shop All',
                }
              : {}),

            ...(startsAt !== undefined
              ? {
                  startsAt: startDate,
                }
              : {}),

            ...(endsAt !== undefined
              ? {
                  endsAt: endDate,
                }
              : {}),
          },
        });

        // RECORD BANNER UPDATE

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.BANNER_UPDATED,
            entityType: AUDIT_ENTITIES.BANNER,
            entityId: id,
          },
          tx
        );

        // RECORD ACTIVATION OR DEACTIVATION

        if (
          existingBanner.isActive !== banner.isActive
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.BANNER_STATUS_CHANGED,
              entityType: AUDIT_ENTITIES.BANNER,
              entityId: id,
            },
            tx
          );
        }

        return {
          outcome: 'UPDATED' as const,
          banner,
        };
      }
    );

    if (result.outcome === 'NOT_FOUND') {
      return bannerNotFound();
    }

    if (result.outcome === 'INVALID_SCHEDULE') {
      return badInput(
        'Banner end date cannot be before its start date.'
      );
    }

    refreshAdmin('/admin/banners');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        banner: result.banner,
        message: 'Banner updated successfully.',
      })
    );

  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// UPDATE BANNER STATUS OR DISPLAY ORDER

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.BANNER_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = patchBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner status or display order.',
        z.flattenError(parsed.error)
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return badInput(
        'Provide banner status or display order.'
      );
    }

    // ATOMIC STATUS UPDATE AND AUDIT LOGGING

    const banner = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.homepageBanner.findUnique({
          where: { id },

          select: {
            isActive: true,
            displayOrder: true,
          },
        });

        if (!existing) {
          return null;
        }

        const updatedBanner = await tx.homepageBanner.update({
          where: { id },
          data: parsed.data,
        });

        // RECORD STATUS CHANGE

        if (
          existing.isActive !== updatedBanner.isActive
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.BANNER_STATUS_CHANGED,
              entityType: AUDIT_ENTITIES.BANNER,
              entityId: id,
            },
            tx
          );
        }

        // RECORD DISPLAY ORDER CHANGE

        if (
          existing.displayOrder !== updatedBanner.displayOrder
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.BANNER_UPDATED,
              entityType: AUDIT_ENTITIES.BANNER,
              entityId: id,
            },
            tx
          );
        }

        return updatedBanner;
      }
    );

    if (!banner) {
      return bannerNotFound();
    }

    refreshAdmin('/admin/banners');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        banner,
        message: 'Banner status updated successfully.',
      })
    );

  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// PERMANENTLY DELETE BANNER

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.BANNER_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    // ATOMIC BANNER DELETION AND AUDIT LOGGING

    await prisma.$transaction(async (tx) => {

      await tx.homepageBanner.delete({
        where: { id },
      });

      await recordAdminAction(
        admin,
        {
          action: AUDIT_ACTIONS.BANNER_DELETED,
          entityType: AUDIT_ENTITIES.BANNER,
          entityId: id,
        },
        tx
      );

    });

    refreshAdmin('/admin/banners');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        deleted: true,
        message: 'Banner deleted successfully.',
      })
    );

  } catch (error) {
    return apiError(error, 'Banner');
  }
}