
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
} from '@/lib/admin-api';

// IMAGE URL VALIDATION

const imageUrlSchema = z.string().refine(
  (value) => {
    if (/^\/uploads\/[a-zA-Z0-9._-]+$/.test(value)) {
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
  'Use an HTTP(S) image URL or a valid /uploads/ path.'
);

// PRODUCT STATUS

const statusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'SOLD_OUT',
  'ARCHIVED',
]);

// PRODUCT VALIDATION

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),

  sku: z.string().nullable().optional(),

  shortDescription: z
    .string()
    .nullable()
    .optional(),

  description: z.string().default(''),

  priceInPaise: z
    .number()
    .int()
    .nonnegative(),

  originalPriceInPaise: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),

  currency: z.string().default('INR'),

  status: statusSchema.default('DRAFT'),

  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),

  displayOrder: z.number().int().default(0),

  badgeText: z.string().nullable().optional(),

  primaryImageUrl: imageUrlSchema
    .nullable()
    .optional(),

  categoryIds: z
    .array(z.string().min(1))
    .default([]),

  specifications: z
    .array(
      z.object({
        label: z.string().trim().min(1),

        value: z
          .string()
          .nullable()
          .optional(),

        displayOrder: z
          .number()
          .int()
          .default(0),
      })
    )
    .default([]),

  images: z
    .array(
      z.object({
        url: imageUrlSchema,

        altText: z
          .string()
          .nullable()
          .optional(),

        displayOrder: z
          .number()
          .int()
          .default(0),

        isPrimary: z
          .boolean()
          .default(false),
      })
    )
    .default([]),

  marketplaceLinks: z
    .array(
      z.object({
        marketplaceId: z.string().min(1),

        url: z.string().url().refine(
          (value) => {
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
          'Invalid marketplace URL'
        ),

        isActive: z
          .boolean()
          .default(true),

        displayOrder: z
          .number()
          .int()
          .default(0),
      })
    )
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

export async function GET(
  request: NextRequest
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const { searchParams } = new URL(request.url);

    const rawStatus =
      searchParams.get('status');

    const search =
      searchParams.get('search')?.trim();

    const categoryId =
      searchParams.get('categoryId');

    const where: Prisma.ProductWhereInput = {};

    // STATUS FILTER

    if (rawStatus) {
      const parsedStatus =
        statusSchema.safeParse(rawStatus);

      if (!parsedStatus.success) {
        return badInput(
          'Invalid product status.'
        );
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
      where.categories = {
        some: {
          categoryId,
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

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    return apiError(error, 'Product');
  }
}

// CREATE NEW PRODUCT

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
      createProductSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid product data.',
        parsed.error.flatten()
      );
    }

    const {
      categoryIds,
      specifications,
      images,
      marketplaceLinks,
      ...productData
    } = parsed.data;

    // PRICE VALIDATION

    if (
      productData.originalPriceInPaise != null &&
      productData.originalPriceInPaise <
        productData.priceInPaise
    ) {
      return badInput(
        'Original price cannot be lower than selling price.'
      );
    }

    // PREVENT DUPLICATE CATEGORY ASSIGNMENTS

    const uniqueCategoryIds = [
      ...new Set(categoryIds),
    ];

    // PREVENT DUPLICATE MARKETPLACE ASSIGNMENTS

    const uniqueMarketplaceLinks = [
      ...new Map(
        marketplaceLinks.map((link) => [
          link.marketplaceId,
          link,
        ])
      ).values(),
    ];

    // CREATE PRODUCT AND RELATED RECORDS

    const product = await prisma.product.create({
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
              marketplaceId:
                link.marketplaceId,

              url: link.url,
              isActive: link.isActive,

              displayOrder:
                link.displayOrder,
            })
          ),
        },
      },

      include: productInclude,
    });

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/products');

    return NextResponse.json(
      {
        success: true,
        product,
        message:
          'Product created successfully.',
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return apiError(error, 'Product');
  }
}
