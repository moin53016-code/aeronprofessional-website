
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

// IMAGE URL VALIDATION

const imageUrlSchema = z.string().trim().refine(
  (value) => {
    if (/^\/(?:uploads|images)\/[a-zA-Z0-9._-]+$/.test(value)) {
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

// BANNER STATUS VALIDATION

const patchBannerSchema = z.object({
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

// GET INDIVIDUAL BANNER

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    const banner =
      await prisma.homepageBanner.findUnique({
        where: { id },
      });

    if (!banner) {
      return NextResponse.json(
        {
          error: 'Banner not found.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      banner,
    });
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
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      updateBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner data.',
        parsed.error.flatten()
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return badInput(
        'No banner changes provided.'
      );
    }

    const existingBanner =
      await prisma.homepageBanner.findUnique({
        where: { id },
      });

    if (!existingBanner) {
      return NextResponse.json(
        {
          error: 'Banner not found.',
        },
        {
          status: 404,
        }
      );
    }

    const {
      startsAt,
      endsAt,
      mobileImageUrl,
      buttonLabel,
      buttonTarget,
      ...data
    } = parsed.data;

    // PRESERVE EXISTING SCHEDULE
    // UNLESS NEW DATES ARE PROVIDED

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

    // VALIDATE DATE RANGE

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return badInput(
        'Banner end date cannot be before its start date.'
      );
    }

    // UPDATE DATABASE RECORD

    const banner =
      await prisma.homepageBanner.update({
        where: { id },

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

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/banners');

    return NextResponse.json({
      success: true,
      banner,
      message: 'Banner updated successfully.',
    });
  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// ACTIVATE / DEACTIVATE BANNER
// UPDATE DISPLAY ORDER

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
      patchBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner status or display order.',
        parsed.error.flatten()
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return badInput(
        'Provide banner status or display order.'
      );
    }

    const banner =
      await prisma.homepageBanner.update({
        where: { id },
        data: parsed.data,
      });

    refreshAdmin('/admin/banners');

    return NextResponse.json({
      success: true,
      banner,
      message: 'Banner status updated successfully.',
    });
  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// PERMANENTLY DELETE BANNER

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { id } = await params;

    await prisma.homepageBanner.delete({
      where: { id },
    });

    refreshAdmin('/admin/banners');

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Banner deleted successfully.',
    });
  } catch (error) {
    return apiError(error, 'Banner');
  }
}
