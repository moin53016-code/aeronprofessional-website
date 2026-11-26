import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';

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

// ==========================================
// PRODUCT UPDATE VALIDATION
// ==========================================

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),

  slug: z.string().min(1).optional(),

  sku: z.string().nullable().optional(),

  shortDescription: z
    .string()
    .nullable()
    .optional(),

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

  primaryImageUrl: imageUrlSchema
    .nullable()
    .optional(),

  categoryIds: z
    .array(z.string())
    .optional(),

  specifications: z
    .array(
      z.object({
        label: z.string().min(1),

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
    .optional(),

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

        isActive: z
          .boolean()
          .default(true),

        displayOrder: z
          .number()
          .int()
          .default(0),
      })
    )
    .optional(),
});

// ==========================================
// PRODUCT STATUS ACTION VALIDATION
// ==========================================

const productActionSchema = z.object({
  action: z.enum([
    'publish',
    'unpublish',
    'sold_out',
    'archive',
    'restore',
  ]),
});

// ==========================================
// PRODUCT NOT FOUND RESPONSE
// ==========================================

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

// ==========================================
// GET INDIVIDUAL PRODUCT
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    // AUTHENTICATION AND VIEW PERMISSION

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.PRODUCT_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // FETCH PRODUCT AND RELATED RECORDS

    const product =
      await prisma.product.findUnique({
        where: {
          id,
        },

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
    return apiError(
      error,
      'Product'
    );
  }
}

// ==========================================
// UPDATE PRODUCT
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
        PERMISSIONS.PRODUCT_UPDATE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // VALIDATE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      updateProductSchema.safeParse(body);

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

    // ======================================
    // PREVENT DUPLICATE CATEGORY ASSIGNMENTS
    // ======================================

    const uniqueCategoryIds =
      categoryIds === undefined
        ? undefined
        : [...new Set(categoryIds)];

    // ======================================
    // PREVENT DUPLICATE MARKETPLACE LINKS
    // ======================================

    const uniqueMarketplaceLinks =
      marketplaceLinks === undefined
        ? undefined
        : [
            ...new Map(
              marketplaceLinks.map(
                (link) => [
                  link.marketplaceId,
                  link,
                ]
              )
            ).values(),
          ];

    // ======================================
    // ATOMIC DATABASE TRANSACTION
    // ======================================

    const updated =
      await prisma.$transaction(
        async (tx) => {

          let publishedAtUpdate: {
            publishedAt?: Date;
          } = {};

          // PRESERVE ORIGINAL PUBLICATION DATE

          if (
            productData.status === 'ACTIVE'
          ) {
            const existing =
              await tx.product.findUnique({
                where: {
                  id,
                },

                select: {
                  publishedAt: true,
                },
              });

            if (
              existing &&
              !existing.publishedAt
            ) {
              publishedAtUpdate = {
                publishedAt: new Date(),
              };
            }
          }

          // UPDATE PRODUCT DETAILS

          await tx.product.update({
            where: {
              id,
            },

            data: {
              ...productData,

              ...publishedAtUpdate,
            },
          });

          // ==================================
          // UPDATE PRODUCT CATEGORIES
          // ==================================

          if (
            uniqueCategoryIds !== undefined
          ) {
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

          // ==================================
          // UPDATE PRODUCT SPECIFICATIONS
          // ==================================

          if (specifications !== undefined) {
            await tx.productSpecification.deleteMany({
              where: {
                productId: id,
              },
            });

            if (specifications.length > 0) {
              await tx.productSpecification.createMany({
                data: specifications.map(
                  (spec) => ({
                    productId: id,

                    label: spec.label,

                    value: spec.value,

                    displayOrder:
                      spec.displayOrder,
                  })
                ),
              });
            }
          }

          // ==================================
          // UPDATE PRODUCT IMAGES
          // ==================================

          if (images !== undefined) {
            await tx.productImage.deleteMany({
              where: {
                productId: id,
              },
            });

            if (images.length > 0) {
              await tx.productImage.createMany({
                data: images.map(
                  (image) => ({
                    productId: id,

                    url: image.url,

                    altText: image.altText,

                    displayOrder:
                      image.displayOrder,

                    isPrimary:
                      image.isPrimary,
                  })
                ),
              });
            }
          }

          // ==================================
          // UPDATE MARKETPLACE LINKS
          // ==================================

          if (
            uniqueMarketplaceLinks !== undefined
          ) {
            await tx.productMarketplaceLink.deleteMany({
              where: {
                productId: id,
              },
            });

            if (
              uniqueMarketplaceLinks.length > 0
            ) {
              await tx.productMarketplaceLink.createMany({
                data: uniqueMarketplaceLinks.map(
                  (link) => ({
                    productId: id,

                    marketplaceId:
                      link.marketplaceId,

                    url: link.url,

                    isActive:
                      link.isActive,

                    displayOrder:
                      link.displayOrder,
                  })
                ),
              });
            }
          }

          // ==================================
          // RETURN UPDATED PRODUCT
          // ==================================

          return tx.product.findUnique({
            where: {
              id,
            },

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
        }
      );

    // ======================================
    // REFRESH WEBSITE AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        product: updated,

        message:
          'Product updated successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Product'
    );
  }
}

// ==========================================
// PRODUCT STATUS ACTIONS
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
        PERMISSIONS.PRODUCT_UPDATE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      productActionSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid product action.'
      );
    }

    // ======================================
    // PREPARE STATUS UPDATE
    // ======================================

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

    // ======================================
    // UPDATE PRODUCT STATUS
    // ======================================

    const product =
      await prisma.product.update({
        where: {
          id,
        },

        data: updateData,
      });

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        product,
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Product'
    );
  }
}

// ==========================================
// PERMANENT PRODUCT DELETION
// OWNER AND ADMIN ONLY
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    // ======================================
    // REQUIRE PRODUCT DELETE PERMISSION
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.PRODUCT_DELETE,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    // ======================================
    // PERMANENTLY DELETE PRODUCT
    // RELATED DATABASE ROWS ARE REMOVED
    // THROUGH CASCADE RELATIONS
    // ======================================

    await prisma.product.delete({
      where: {
        id,
      },
    });

    refreshAdmin('/admin/products');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        deleted: true,

        deletedProductCount: 1,

        message:
          'Product permanently deleted.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Product'
    );
  }
}