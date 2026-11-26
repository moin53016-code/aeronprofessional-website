import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
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

// PRODUCT UPDATE VALIDATION

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sku: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  description: z.string().optional(),

  priceInPaise: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  originalPriceInPaise: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),

  currency: z.string().optional(),

  status: z
    .enum([
      'DRAFT',
      'ACTIVE',
      'SOLD_OUT',
      'ARCHIVED',
    ])
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
          'Invalid marketplace URL.'
        ),

        isActive: z.boolean().default(true),
        displayOrder: z.number().int().default(0),
      })
    )
    .optional(),
});

// PRODUCT STATUS ACTION VALIDATION

const productActionSchema = z.object({
  action: z.enum([
    'publish',
    'unpublish',
    'sold_out',
    'archive',
    'restore',
  ]),
});

// PRODUCT NOT FOUND RESPONSE

function productNotFound() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,
        error: 'Product not found.',
      },
      {
        status: 404,
      }
    )
  );
}

// GET INDIVIDUAL PRODUCT

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.PRODUCT_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },

      include: {
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

        discountProducts: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!product) {
      return productNotFound();
    }

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        product,
      })
    );
  } catch (error) {
    return apiError(error, 'Product');
  }
}

// UPDATE PRODUCT

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.PRODUCT_UPDATE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = updateProductSchema.safeParse(body);

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

    const uniqueCategoryIds =
      categoryIds === undefined
        ? undefined
        : [...new Set(categoryIds)];

    const uniqueMarketplaceLinks =
      marketplaceLinks === undefined
        ? undefined
        : [
            ...new Map(
              marketplaceLinks.map((link) => [
                link.marketplaceId,
                link,
              ])
            ).values(),
          ];

    // ATOMIC PRODUCT UPDATE AND AUDIT LOGGING

    const updated = await prisma.$transaction(
      async (tx) => {

        const existing =
          await tx.product.findUnique({
            where: { id },

            select: {
              id: true,
              publishedAt: true,
              status: true,
              priceInPaise: true,
              originalPriceInPaise: true,
            },
          });

        if (!existing) {
          return {
            outcome: 'NOT_FOUND' as const,
          };
        }

        // VALIDATE EFFECTIVE PRODUCT PRICES

        const sellingPrice =
          productData.priceInPaise ??
          existing.priceInPaise;

        const originalPrice =
          productData.originalPriceInPaise === undefined
            ? existing.originalPriceInPaise
            : productData.originalPriceInPaise;

        if (
          originalPrice !== null &&
          originalPrice < sellingPrice
        ) {
          return {
            outcome: 'INVALID_PRICE' as const,
          };
        }

        // PRESERVE ORIGINAL PUBLICATION DATE

        const publishedAtUpdate =
          productData.status === 'ACTIVE' &&
          !existing.publishedAt
            ? { publishedAt: new Date() }
            : {};

        // UPDATE PRODUCT DETAILS

        await tx.product.update({
          where: { id },

          data: {
            ...productData,
            ...publishedAtUpdate,
          },
        });

        // UPDATE PRODUCT CATEGORIES

        if (uniqueCategoryIds !== undefined) {
          await tx.productCategory.deleteMany({
            where: {
              productId: id,
            },
          });

          if (uniqueCategoryIds.length > 0) {
            await tx.productCategory.createMany({
              data: uniqueCategoryIds.map(
                (categoryId) => ({
                  productId: id,
                  categoryId,
                })
              ),
            });
          }
        }

        // UPDATE PRODUCT SPECIFICATIONS

        if (specifications !== undefined) {
          await tx.productSpecification.deleteMany({
            where: {
              productId: id,
            },
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

        // UPDATE PRODUCT IMAGES

        if (images !== undefined) {
          await tx.productImage.deleteMany({
            where: {
              productId: id,
            },
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

        // UPDATE MARKETPLACE LINKS

        if (uniqueMarketplaceLinks !== undefined) {
          await tx.productMarketplaceLink.deleteMany({
            where: {
              productId: id,
            },
          });

          if (uniqueMarketplaceLinks.length > 0) {
            await tx.productMarketplaceLink.createMany({
              data: uniqueMarketplaceLinks.map((link) => ({
                productId: id,
                marketplaceId: link.marketplaceId,
                url: link.url,
                isActive: link.isActive,
                displayOrder: link.displayOrder,
              })),
            });
          }
        }

        // RECORD PRODUCT UPDATE

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.PRODUCT_UPDATED,
            entityType: AUDIT_ENTITIES.PRODUCT,
            entityId: id,
          },
          tx
        );

        // RECORD STATUS CHANGE WHEN APPLICABLE

        if (
          productData.status !== undefined &&
          productData.status !== existing.status
        ) {
          await recordAdminAction(
            admin,
            {
              action: AUDIT_ACTIONS.PRODUCT_STATUS_CHANGED,
              entityType: AUDIT_ENTITIES.PRODUCT,
              entityId: id,
            },
            tx
          );
        }

        // RETURN UPDATED PRODUCT

        const product = await tx.product.findUniqueOrThrow({
          where: { id },

          include: {
            images: true,
            specifications: true,

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
          },
        });

        return {
          outcome: 'UPDATED' as const,
          product,
        };
      }
    );

    if (updated.outcome === 'NOT_FOUND') {
      return productNotFound();
    }

    if (updated.outcome === 'INVALID_PRICE') {
      return badInput(
        'Original price cannot be lower than selling price.'
      );
    }

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        product: updated.product,
        message: 'Product updated successfully.',
      })
    );
  } catch (error) {
    return apiError(error, 'Product');
  }
}

// PRODUCT STATUS ACTIONS

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.PRODUCT_UPDATE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed = productActionSchema.safeParse(body);

    if (!parsed.success) {
      return badInput('Invalid product action.');
    }

    let updateData: {
      status:
        | 'ACTIVE'
        | 'DRAFT'
        | 'SOLD_OUT'
        | 'ARCHIVED';

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
        updateData = {
          status: 'DRAFT',
        };
        break;

      case 'sold_out':
        updateData = {
          status: 'SOLD_OUT',
        };
        break;

      case 'archive':
        updateData = {
          status: 'ARCHIVED',
        };
        break;

      case 'restore':
        updateData = {
          status: 'ACTIVE',
        };
        break;
    }

    // ATOMIC STATUS UPDATE AND AUDIT LOGGING

    const product = await prisma.$transaction(
      async (tx) => {
        const updatedProduct =
          await tx.product.update({
            where: { id },
            data: updateData,
          });

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.PRODUCT_STATUS_CHANGED,
            entityType: AUDIT_ENTITIES.PRODUCT,
            entityId: id,
          },
          tx
        );

        return updatedProduct;
      }
    );

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        product,
      })
    );
  } catch (error) {
    return apiError(error, 'Product');
  }
}

// PERMANENT PRODUCT DELETION
// OWNER AND ADMIN ONLY

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.PRODUCT_DELETE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    // ATOMIC PRODUCT DELETION AND AUDIT LOGGING

    await prisma.$transaction(async (tx) => {

      await tx.product.delete({
        where: { id },
      });

      await recordAdminAction(
        admin,
        {
          action: AUDIT_ACTIONS.PRODUCT_DELETED,
          entityType: AUDIT_ENTITIES.PRODUCT,
          entityId: id,
        },
        tx
      );

    });

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        deleted: true,
        deletedProductCount: 1,
        message: 'Product permanently deleted.',
      })
    );
  } catch (error) {
    return apiError(error, 'Product');
  }
}