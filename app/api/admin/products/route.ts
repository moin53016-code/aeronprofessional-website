import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
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

// DATABASE INTEGER LIMIT

const MAX_INT = 2147483647;

// URL VALIDATION

function isValidWebUrl(value: string): boolean {
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
}

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

      return isValidWebUrl(value);
    },
    'Use a valid HTTP(S) image URL or local image path.'
  );

// MARKETPLACE URL VALIDATION

const marketplaceUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    isValidWebUrl,
    'Invalid marketplace URL.'
  );

// PRODUCT STATUS

const statusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'SOLD_OUT',
  'ARCHIVED',
]);

// COMMON FIELD VALIDATION

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

const priceSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_INT);

const displayOrderSchema = z
  .number()
  .int()
  .min(-MAX_INT)
  .max(MAX_INT);

// PRODUCT VALIDATION

const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(300),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Invalid product slug.'
    ),

  sku: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  shortDescription: z
    .string()
    .max(5000)
    .nullable()
    .optional(),

  description: z
    .string()
    .max(50000)
    .default(''),

  priceInPaise: priceSchema,

  originalPriceInPaise: priceSchema
    .nullable()
    .optional(),

  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('INR'),

  status: statusSchema.default('DRAFT'),

  isFeatured: z.boolean().default(false),

  isNew: z.boolean().default(false),

  displayOrder: displayOrderSchema.default(0),

  badgeText: z
    .string()
    .max(100)
    .nullable()
    .optional(),

  primaryImageUrl: imageUrlSchema
    .nullable()
    .optional(),

  categoryIds: z
    .array(idSchema)
    .max(100)
    .default([]),

  specifications: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1)
          .max(200),

        value: z
          .string()
          .max(2000)
          .nullable()
          .optional(),

        displayOrder:
          displayOrderSchema.default(0),
      })
    )
    .max(100)
    .default([]),

  images: z
    .array(
      z.object({
        url: imageUrlSchema,

        altText: z
          .string()
          .max(500)
          .nullable()
          .optional(),

        displayOrder:
          displayOrderSchema.default(0),

        isPrimary:
          z.boolean().default(false),
      })
    )
    .max(50)
    .default([]),

  marketplaceLinks: z
    .array(
      z.object({
        marketplaceId: idSchema,

        url: marketplaceUrlSchema,

        isActive:
          z.boolean().default(true),

        displayOrder:
          displayOrderSchema.default(0),
      })
    )
    .max(50)
    .default([]),
});

// PRODUCT RELATIONS

const productInclude = {
  images: {
    orderBy: {
      displayOrder: 'asc',
    },
  },

  specifications: {
    orderBy: {
      displayOrder: 'asc',
    },
  },

  categories: {
    include: {
      category: true,
    },
  },

  marketplaceLinks: {
    include: {
      marketplace: true,
    },
  },
} as const;

// GET ALL PRODUCTS

export async function GET(request: NextRequest) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.PRODUCT_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { searchParams } = new URL(request.url);

    const rawStatus = searchParams.get('status');

    const search = searchParams
      .get('search')
      ?.trim()
      .slice(0, 200);

    const categoryId = searchParams.get('categoryId');

    const where: Prisma.ProductWhereInput = {};

    // STATUS FILTER

    if (rawStatus) {
      const parsedStatus =
        statusSchema.safeParse(rawStatus);

      if (!parsedStatus.success) {
        return badInput('Invalid product status.');
      }

      where.status = parsedStatus.data;
    }

    // PRODUCT SEARCH

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // CATEGORY FILTER

    if (categoryId) {
      const parsedId = idSchema.safeParse(categoryId);

      if (!parsedId.success) {
        return badInput('Invalid category identifier.');
      }

      where.categories = {
        some: {
          categoryId: parsedId.data,
        },
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: productInclude,

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
        products,
      })
    );

  } catch (error) {
    return apiError(error, 'Product');
  }
}

// CREATE NEW PRODUCT

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.PRODUCT_CREATE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    // CENTRALIZED REQUEST BODY PROTECTION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.PRODUCT
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE PRODUCT DATA

    const parsed = createProductSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      return badInput(
        'Invalid product data.',
        z.flattenError(parsed.error)
      );
    }

    const {
      categoryIds,
      specifications,
      images,
      marketplaceLinks,
      ...productData
    } = parsed.data;

    // VALIDATE PRODUCT PRICES

    if (
      productData.originalPriceInPaise != null &&
      productData.originalPriceInPaise <
        productData.priceInPaise
    ) {
      return badInput(
        'Original price cannot be lower than selling price.'
      );
    }

    // REMOVE DUPLICATE CATEGORY ASSIGNMENTS

    const uniqueCategoryIds = [
      ...new Set(categoryIds),
    ];

    // REMOVE DUPLICATE MARKETPLACE LINKS

    const uniqueMarketplaceLinks = [
      ...new Map(
        marketplaceLinks.map((link) => [
          link.marketplaceId,
          link,
        ])
      ).values(),
    ];

    // ATOMIC PRODUCT CREATION AND AUDIT LOGGING

    const product = await prisma.$transaction(
      async (tx) => {

        const createdProduct = await tx.product.create({
          data: {
            ...productData,

            publishedAt:
              productData.status === 'ACTIVE'
                ? new Date()
                : null,

            images: {
              create: images.map((image) => ({
                url: image.url,
                altText: image.altText,
                displayOrder: image.displayOrder,
                isPrimary: image.isPrimary,
              })),
            },

            specifications: {
              create: specifications.map((spec) => ({
                label: spec.label,
                value: spec.value,
                displayOrder: spec.displayOrder,
              })),
            },

            categories: {
              create: uniqueCategoryIds.map(
                (categoryId) => ({
                  categoryId,
                })
              ),
            },

            marketplaceLinks: {
              create: uniqueMarketplaceLinks.map(
                (link) => ({
                  marketplaceId: link.marketplaceId,
                  url: link.url,
                  isActive: link.isActive,
                  displayOrder: link.displayOrder,
                })
              ),
            },
          },

          include: productInclude,
        });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.PRODUCT_CREATED,
            entityType: AUDIT_ENTITIES.PRODUCT,
            entityId: createdProduct.id,
          },
          tx
        );

        return createdProduct;
      }
    );

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,
          product,
          message: 'Product created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(error, 'Product');
  }
}