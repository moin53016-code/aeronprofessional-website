
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>;
};

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

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sku: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  description: z.string().optional(),

  priceInPaise: z.number().int().nonnegative().optional(),

  originalPriceInPaise: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),

  currency: z.string().optional(),

  status: z
    .enum(['DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED'])
    .optional(),

  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  badgeText: z.string().nullable().optional(),

  primaryImageUrl: imageUrlSchema.nullable().optional(),

  categoryIds: z.array(z.string()).optional(),

  specifications: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().nullable().optional(),
        displayOrder: z.number().int().default(0),
      })
    )
    .optional(),

  images: z
    .array(
      z.object({
        url: imageUrlSchema,
        altText: z.string().nullable().optional(),
        displayOrder: z.number().int().default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),

  marketplaceLinks: z
    .array(
      z.object({
        marketplaceId: z.string(),
        url: z.string().url(),
        isActive: z.boolean().default(true),
        displayOrder: z.number().int().default(0),
      })
    )
    .optional(),
});

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized. Please log in.',
    },
    { status: 401 }
  );
}

function refreshProducts() {
  revalidatePath('/');
  revalidatePath('/admin/products');
}

function handleError(
  error: unknown,
  operation: string
) {
  console.error(`Product ${operation} error:`, error);

  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? error.code
      : undefined;

  if (code === 'P2025') {
    return NextResponse.json(
      {
        success: false,
        error: 'Product not found.',
      },
      { status: 404 }
    );
  }

  if (code === 'P2002') {
    return NextResponse.json(
      {
        success: false,
        error: 'Product slug already exists.',
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: `Failed to ${operation} product.`,
    },
    { status: 500 }
  );
}

// GET PRODUCT

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
        discountProducts: {
          include: { campaign: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    return handleError(error, 'fetch');
  }
}

// UPDATE PRODUCT

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product data.',
          details: parsed.error.flatten(),
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
    } = parsed.data;

    const updated = await prisma.$transaction(
      async (tx) => {
        let publishedAtUpdate: {
          publishedAt?: Date;
        } = {};

        if (productData.status === 'ACTIVE') {
          const existing = await tx.product.findUnique({
            where: { id },
            select: { publishedAt: true },
          });

          if (existing && !existing.publishedAt) {
            publishedAtUpdate = {
              publishedAt: new Date(),
            };
          }
        }

        await tx.product.update({
          where: { id },
          data: {
            ...productData,
            ...publishedAtUpdate,
          },
        });

        // PRODUCT CATEGORIES

        if (categoryIds !== undefined) {
          await tx.productCategory.deleteMany({
            where: { productId: id },
          });

          if (categoryIds.length > 0) {
            await tx.productCategory.createMany({
              data: categoryIds.map((categoryId) => ({
                productId: id,
                categoryId,
              })),
            });
          }
        }

        // PRODUCT SPECIFICATIONS

        if (specifications !== undefined) {
          await tx.productSpecification.deleteMany({
            where: { productId: id },
          });

          if (specifications.length > 0) {
            await tx.productSpecification.createMany({
              data: specifications.map((spec) => ({
                productId: id,
                label: spec.label,
                value: spec.value,
                displayOrder: spec.displayOrder,
              })),
            });
          }
        }

        // PRODUCT IMAGES

        if (images !== undefined) {
          await tx.productImage.deleteMany({
            where: { productId: id },
          });

          if (images.length > 0) {
            await tx.productImage.createMany({
              data: images.map((image) => ({
                productId: id,
                url: image.url,
                altText: image.altText,
                displayOrder: image.displayOrder,
                isPrimary: image.isPrimary,
              })),
            });
          }
        }

        // MARKETPLACE LINKS

        if (marketplaceLinks !== undefined) {
          await tx.productMarketplaceLink.deleteMany({
            where: { productId: id },
          });

          if (marketplaceLinks.length > 0) {
            await tx.productMarketplaceLink.createMany({
              data: marketplaceLinks.map((link) => ({
                productId: id,
                marketplaceId: link.marketplaceId,
                url: link.url,
                isActive: link.isActive,
                displayOrder: link.displayOrder,
              })),
            });
          }
        }

        return tx.product.findUnique({
          where: { id },
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
      }
    );

    refreshProducts();

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Product updated successfully.',
    });
  } catch (error) {
    return handleError(error, 'update');
  }
}

// PRODUCT STATUS ACTIONS

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const parsed = z
      .object({
        action: z.enum([
          'publish',
          'unpublish',
          'sold_out',
          'archive',
          'restore',
        ]),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product action.',
        },
        { status: 400 }
      );
    }

    let updateData: {
      status: 'ACTIVE' | 'DRAFT' | 'SOLD_OUT' | 'ARCHIVED';
      publishedAt?: Date;
    };

    switch (parsed.data.action) {
      case 'publish':
        updateData = {
          status: 'ACTIVE',
          publishedAt: new Date(),
        };
        break;

      case 'unpublish':
        updateData = { status: 'DRAFT' };
        break;

      case 'sold_out':
        updateData = { status: 'SOLD_OUT' };
        break;

      case 'archive':
        updateData = { status: 'ARCHIVED' };
        break;

      case 'restore':
        updateData = { status: 'ACTIVE' };
        break;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    refreshProducts();

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    return handleError(error, 'update');
  }
}

// PERMANENT DELETE ONLY

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    // Related DB rows are removed by Prisma's
    // onDelete: Cascade relations.

    await prisma.product.delete({
      where: { id },
    });

    refreshProducts();

    return NextResponse.json({
      success: true,
      deleted: true,
      deletedProductCount: 1,
      message: 'Product permanently deleted.',
    });
  } catch (error) {
    return handleError(error, 'delete');
  }
}
