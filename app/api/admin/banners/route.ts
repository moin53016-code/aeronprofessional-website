
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
} from '@/lib/admin-api';

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

// BANNER VALIDATION

const createBannerSchema = z.object({
  eyebrow: z
    .string()
    .trim()
    .min(1)
    .max(200),

  title: z
    .string()
    .trim()
    .min(1)
    .max(500),

  description: z
    .string()
    .trim()
    .min(1)
    .max(5000),

  imageUrl: imageUrlSchema,

  mobileImageUrl: imageUrlSchema
    .or(z.literal(''))
    .nullable()
    .optional(),

  buttonLabel: z
    .string()
    .trim()
    .max(100)
    .default('SHOP NOW'),

  buttonTarget: z
    .string()
    .trim()
    .max(200)
    .default('Shop All'),

  displayOrder: z
    .number()
    .int()
    .default(0),

  isActive: z
    .boolean()
    .default(true),

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

// GET ALL HOMEPAGE BANNERS

export async function GET() {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const banners =
      await prisma.homepageBanner.findMany({
        orderBy: [
          {
            displayOrder: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    return NextResponse.json({
      success: true,
      banners,
    });
  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// CREATE NEW HOMEPAGE BANNER

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
      createBannerSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid banner data.',
        parsed.error.flatten()
      );
    }

    const {
      startsAt,
      endsAt,
      mobileImageUrl,
      ...data
    } = parsed.data;

    // VALIDATE BANNER SCHEDULE

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
        'Banner end date cannot be before its start date.'
      );
    }

    // CREATE BANNER

    const banner =
      await prisma.homepageBanner.create({
        data: {
          ...data,

          mobileImageUrl:
            mobileImageUrl || null,

          buttonLabel:
            data.buttonLabel || 'SHOP NOW',

          buttonTarget:
            data.buttonTarget || 'Shop All',

          startsAt: startDate,
          endsAt: endDate,
        },
      });

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/banners');

    return NextResponse.json(
      {
        success: true,
        banner,
        message:
          'Homepage banner created successfully.',
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return apiError(error, 'Banner');
  }
}
