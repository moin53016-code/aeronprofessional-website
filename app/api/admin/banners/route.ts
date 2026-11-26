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

// IMAGE URL VALIDATION

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      if (
        /^\/(?:uploads|images)\/[a-zA-Z0-9._-]+$/.test(value)
      ) {
        return true;
      }

      try {
        const url = new URL(value);

        return (
          (
            url.protocol === 'https:' ||
            url.protocol === 'http:'
          ) &&
          Boolean(url.hostname) &&
          !url.username &&
          !url.password
        );

      } catch {
        return false;
      }
    },
    'Enter a valid image URL or local image path.'
  );

// DATE VALIDATION

const dateSchema = z
  .string()
  .max(64)
  .datetime({ offset: true })
  .refine(
    (value) => Number.isFinite(Date.parse(value)),
    'Invalid banner date.'
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
    .min(-2147483648)
    .max(2147483647)
    .default(0),

  isActive: z
    .boolean()
    .default(true),

  startsAt: dateSchema
    .nullable()
    .optional(),

  endsAt: dateSchema
    .nullable()
    .optional(),
});

// GET ALL HOMEPAGE BANNERS

export async function GET(request: NextRequest) {
  try {

    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.BANNER_VIEW,
    });

    if (denied) {
      return denied;
    }

    const banners = await prisma.homepageBanner.findMany({
      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        banners,
      })
    );

  } catch (error) {
    return apiError(error, 'Banner');
  }
}

// CREATE NEW HOMEPAGE BANNER

export async function POST(request: NextRequest) {
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

    // CENTRALIZED REQUEST BODY PROTECTION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.JSON
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE BANNER INPUT

    const parsed = createBannerSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      return badInput(
        'Invalid banner data.',
        z.flattenError(parsed.error)
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

    // ATOMIC BANNER CREATION AND AUDIT LOGGING

    const banner = await prisma.$transaction(
      async (tx) => {

        const createdBanner = await tx.homepageBanner.create({
          data: {
            ...data,

            mobileImageUrl: mobileImageUrl || null,

            buttonLabel: data.buttonLabel || 'SHOP NOW',

            buttonTarget: data.buttonTarget || 'Shop All',

            startsAt: startDate,

            endsAt: endDate,
          },
        });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.BANNER_CREATED,

            entityType: AUDIT_ENTITIES.BANNER,

            entityId: createdBanner.id,
          },
          tx
        );

        return createdBanner;
      }
    );

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/banners');

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,
          banner,
          message: 'Homepage banner created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(error, 'Banner');
  }
}