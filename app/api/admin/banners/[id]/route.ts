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
// IMAGE URL VALIDATION
// ==========================================

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

// ==========================================
// BANNER UPDATE VALIDATION
// ==========================================

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

  displayOrder: z
    .number()
    .int()
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
});

// ==========================================
// BANNER STATUS VALIDATION
// ==========================================

const patchBannerSchema = z.object({
  isActive: z
    .boolean()
    .optional(),

  displayOrder: z
    .number()
    .int()
    .optional(),
});

// ==========================================
// BANNER NOT FOUND RESPONSE
// ==========================================

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

// ==========================================
// GET INDIVIDUAL BANNER
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
        PERMISSIONS.BANNER_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // FETCH BANNER

    const banner =
      await prisma.homepageBanner.findUnique({
        where: {
          id,
        },
      });

    if (!banner) {
      return bannerNotFound();
    }

    // SECURE SUCCESS RESPONSE

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        banner,
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Banner'
    );
  }
}

// ==========================================
// UPDATE BANNER
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
        PERMISSIONS.BANNER_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // PARSE AND VALIDATE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      updateBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner data.',

        z.flattenError(parsed.error)
      );
    }

    // REJECT EMPTY UPDATE REQUESTS

    if (
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'No banner changes provided.'
      );
    }

    // ======================================
    // FETCH EXISTING BANNER
    // ======================================

    const existingBanner =
      await prisma.homepageBanner.findUnique({
        where: {
          id,
        },
      });

    if (!existingBanner) {
      return bannerNotFound();
    }

    const {
      startsAt,
      endsAt,
      mobileImageUrl,
      buttonLabel,
      buttonTarget,
      ...data
    } = parsed.data;

    // ======================================
    // PRESERVE EXISTING SCHEDULE
    // UNLESS NEW DATES ARE PROVIDED
    // ======================================

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

    // ======================================
    // VALIDATE BANNER DATE RANGE
    // ======================================

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return badInput(
        'Banner end date cannot be before its start date.'
      );
    }

    // ======================================
    // UPDATE BANNER DATABASE RECORD
    // ======================================

    const banner =
      await prisma.homepageBanner.update({
        where: {
          id,
        },

        data: {
          ...data,

          ...(mobileImageUrl !== undefined
            ? {
                mobileImageUrl:
                  mobileImageUrl || null,
              }
            : {}),

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

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/banners');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        banner,

        message:
          'Banner updated successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Banner'
    );
  }
}

// ==========================================
// ACTIVATE / DEACTIVATE BANNER
// UPDATE DISPLAY ORDER
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
        PERMISSIONS.BANNER_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // VALIDATE STATUS UPDATE
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      patchBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner status or display order.',

        z.flattenError(parsed.error)
      );
    }

    // REJECT EMPTY STATUS UPDATE

    if (
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'Provide banner status or display order.'
      );
    }

    // ======================================
    // UPDATE BANNER STATUS
    // ======================================

    const banner =
      await prisma.homepageBanner.update({
        where: {
          id,
        },

        data: parsed.data,
      });

    refreshAdmin('/admin/banners');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        banner,

        message:
          'Banner status updated successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Banner'
    );
  }
}

// ==========================================
// PERMANENTLY DELETE BANNER
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
        PERMISSIONS.BANNER_MANAGE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // DELETE BANNER FROM DATABASE
    // ======================================

    await prisma.homepageBanner.delete({
      where: {
        id,
      },
    });

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/banners');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        deleted: true,

        message:
          'Banner deleted successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Banner'
    );
  }
}
