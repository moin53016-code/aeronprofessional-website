import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import { PERMISSIONS } from '@/lib/permissions';
import { normalizeImageUrl } from '@/lib/image-url';

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

type Context = {
  params: Promise<{ id: string }>;
};

// BANNER ID VALIDATION

const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

// DISPLAY ORDER VALIDATION

const displayOrderSchema = z
  .number()
  .int()
  .min(-2147483648)
  .max(2147483647);

// SMART IMAGE URL VALIDATION

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Banner image is required.')
  .max(2048)
  .transform((value, ctx) => {
    const normalized = normalizeImageUrl(value);

    if (!normalized || normalized.length > 2048) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Upload an image or enter a valid HTTPS image URL.',
      });

      return z.NEVER;
    }

    // REJECT IMGBB SHARING PAGES

    if (normalized.startsWith('https://')) {
      const url = new URL(normalized);

      if (
        url.hostname === 'ibb.co' ||
        url.hostname === 'www.ibb.co' ||
        url.hostname === 'imgbb.com' ||
        url.hostname === 'www.imgbb.com'
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Please use the direct image address starting with https://i.ibb.co/ instead of the ImgBB sharing page.',
        });

        return z.NEVER;
      }
    }

    return normalized;
  });

// DATE VALIDATION

const dateSchema = z
  .string()
  .max(64)
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    'Invalid banner date.'
  );

// BANNER UPDATE VALIDATION

const updateBannerSchema = z.object({
  eyebrow: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional(),

  title: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .optional(),

  description: z
    .string()
    .trim()
    .min(1)
    .max(5000)
    .optional(),

  // SINGLE RESPONSIVE BANNER IMAGE

  imageUrl: imageUrlSchema.optional(),

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

  displayOrder:
    displayOrderSchema.optional(),

  isActive:
    z.boolean().optional(),

  startsAt:
    dateSchema.nullable().optional(),

  endsAt:
    dateSchema.nullable().optional(),
});

// BANNER STATUS VALIDATION

const patchBannerSchema = z.object({
  isActive:
    z.boolean().optional(),

  displayOrder:
    displayOrderSchema.optional(),
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

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid banner identifier.');
    }

    const banner =
      await prisma.homepageBanner.findUnique({
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

// UPDATE HOMEPAGE BANNER

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.BANNER_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid banner identifier.');
    }

    // SECURE REQUEST BODY VALIDATION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.JSON
    );

    if (!body.ok) {
      return body.response;
    }

    const parsed = updateBannerSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      const details = z.flattenError(parsed.error);

      const fieldErrors = Object.values(
        details.fieldErrors
      ).flat();

      return badInput(
        fieldErrors[0] || 'Invalid banner data.',
        details
      );
    }

    // REJECT EMPTY UPDATES

    if (Object.keys(parsed.data).length === 0) {
      return badInput('No banner changes provided.');
    }

    const {
      startsAt,
      endsAt,
      buttonLabel,
      buttonTarget,
      ...data
    } = parsed.data;

    // ATOMIC UPDATE AND AUDIT LOGGING

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

        // PRESERVE EXISTING BANNER SCHEDULE

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

        const banner =
          await tx.homepageBanner.update({
            where: { id },

            data: {
              ...data,

              // PRESERVE UNUSED LEGACY MOBILE IMAGE FIELD

              ...(buttonLabel !== undefined
                ? {
                    buttonLabel:
                      buttonLabel || 'SHOP NOW',
                  }
                : {}),

              ...(buttonTarget !== undefined
                ? {
                    buttonTarget:
                      buttonTarget || 'Shop All',
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
              action:
                AUDIT_ACTIONS.BANNER_STATUS_CHANGED,

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

    // REFRESH WEBSITE AND ADMIN PANEL

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

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid banner identifier.');
    }

    // MAXIMUM STATUS REQUEST SIZE: 4 KB

    const body = await readJsonBody(
      request,
      4 * 1024
    );

    if (!body.ok) {
      return body.response;
    }

    const parsed = patchBannerSchema.safeParse(
      body.data
    );

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

    // ATOMIC STATUS UPDATE

    const banner = await prisma.$transaction(
      async (tx) => {

        const existing =
          await tx.homepageBanner.findUnique({
            where: { id },

            select: {
              isActive: true,
              displayOrder: true,
            },
          });

        if (!existing) {
          return null;
        }

        const updatedBanner =
          await tx.homepageBanner.update({
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
              action:
                AUDIT_ACTIONS.BANNER_STATUS_CHANGED,

              entityType: AUDIT_ENTITIES.BANNER,

              entityId: id,
            },
            tx
          );
        }

        // RECORD DISPLAY ORDER CHANGE

        if (
          existing.displayOrder !==
          updatedBanner.displayOrder
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

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid banner identifier.');
    }

    // ATOMIC DELETION AND AUDIT LOGGING

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