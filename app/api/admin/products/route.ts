
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Accept both external image URLs and locally uploaded images.
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
  {
    message:
      'Image must be an HTTP(S) URL or a valid /uploads/ path.',
  }
);

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().default(''),

  priceInPaise: z.number().int().nonnegative(),
  originalPriceInPaise: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .nullable(),

  currency: z.string().default('INR'),

  status: z
    .enum(['DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED'])
    .default('DRAFT'),

  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  badgeText: z.string().optional().nullable(),

  primaryImageUrl: imageUrlSchema.optional().nullable(),

  categoryIds: z.array(z.string()).default([]),

  specifications: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().optional().nullable(),
        displayOrder: z.number().int().default(0),
      })
    )
    .default([]),

  images: z
    .array(
      z.object({
        url: imageUrlSchema,
        altText: z.string().optional().nullable(),
        displayOrder: z.number().int().default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .default([]),

  marketplaceLinks: z
    .array(
      z.object({
        marketplaceId: z.string(),
        url: z.string().url(),
        isActive: z.boolean().default(true),
        displayOrder: z.number().int().default(0),
      })
    )
    .default([]),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

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

    if (categoryId) {
      where.categories = {
        some: { categoryId },
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        specifications: {
          orderBy: { displayOrder: 'asc' },
        },
        categories: {
          include: { category: true },
        },
        marketplaceLinks: {
          include: { marketplace: true },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Fetch products error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      categoryIds,
      specifications,
      images,
      marketplaceLinks,
      ...productData
    } = result.data;

    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          ...productData,

          publishedAt:
            productData.status === 'ACTIVE'
              ? new Date()
              : null,

          images: {
            create: images.map((img) => ({
              url: img.url,
              altText: img.altText,
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
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
            create: categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },

          marketplaceLinks: {
            create: marketplaceLinks.map((link) => ({
              marketplaceId: link.marketplaceId,
              url: link.url,
              isActive: link.isActive,
              displayOrder: link.displayOrder,
            })),
          },
        },

        include: {
          images: true,
          specifications: true,
          categories: {
            include: { category: true },
          },
          marketplaceLinks: {
            include: { marketplace: true },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Create product error:', error);

    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error:
            'Product with this slug already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
