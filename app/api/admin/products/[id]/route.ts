import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions';
import { normalizeImageUrl } from '@/lib/image-url';

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

type Context = {
  params: Promise<{ id: string }>;
};

// DATABASE INTEGER LIMIT

const MAX_INT = 2147483647;

// COMMON FIELD VALIDATION

const idSchema = z
  .string()
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

// GENERAL WEBSITE URL VALIDATION

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

// SMART IMAGE URL VALIDATION

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Image URL cannot be empty.')
  .max(2048)
  .transform((value, ctx) => {

    const normalized = normalizeImageUrl(value);

    if (!normalized || normalized.length > 2048) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Upload an image or enter a valid HTTPS image URL.',
      });

      return z.NEVER;
    }

    // REJECT IMGBB SHARING PAGES

    if (normalized.startsWith('https://')) {
      const url = new URL(normalized);

      if (
        url.hostname === 'ibb.co' ||
        url.hostname === 'www.ibb.co' ||
        url.hostname === 'imgbb.com' ||
        url.hostname === 'www.imgbb.com'
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Please use the direct image address starting with https://i.ibb.co/ instead of the ImgBB sharing page.',
        });

        return z.NEVER;
      }
    }

    return normalized;
  });

// MARKETPLACE URL VALIDATION

const marketplaceUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    isValidWebUrl,
    'Invalid marketplace URL.'
  );

// PRODUCT UPDATE VALIDATION

const updateProductSchema = z.object({

  name: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .optional(),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Invalid product slug.'
    )
    .optional(),

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
    .optional(),

  priceInPaise:
    priceSchema.optional(),

  originalPriceInPaise:
    priceSchema.nullable().optional(),

  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),

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

  displayOrder:
    displayOrderSchema.optional(),

  badgeText: z
    .string()
    .max(100)
    .nullable()
    .optional(),

  // SMART PRIMARY IMAGE URL

  primaryImageUrl:
    imageUrlSchema.nullable().optional(),

  categoryIds: z
    .array(idSchema)
    .max(100)
    .optional(),

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
    .optional(),

  // SMART PRODUCT IMAGE URLS

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
    .optional(),

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

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid product identifier.');
    }

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

    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.PRODUCT_UPDATE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid product identifier.');
    }

    // SECURE REQUEST BODY VALIDATION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.PRODUCT
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE PRODUCT AND IMAGE URLS

    const parsed = updateProductSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      const details = z.flattenError(parsed.error);

      const fieldErrors = Object.values(
        details.fieldErrors
      ).flat();

      return badInput(
        fieldErrors[0] || 'Invalid product data.',
        details
      );
    }

    // REJECT EMPTY UPDATES

    if (Object.keys(parsed.data).length === 0) {
      return badInput('No product changes provided.');
    }

    const {
      categoryIds,
      specifications,
      images,
      marketplaceLinks,
      ...productData
    } = parsed.data;

    // REMOVE DUPLICATE CATEGORY ASSIGNMENTS

    const uniqueCategoryIds =
      categoryIds === undefined
        ? undefined
        : [...new Set(categoryIds)];

    // REMOVE DUPLICATE MARKETPLACE LINKS

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

        const existing = await tx.product.findUnique({
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

        // UPDATE PRODUCT DETAILS AND PRIMARY IMAGE

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

        // UPDATE NORMALIZED PRODUCT IMAGES

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

        // RECORD STATUS CHANGE

        if (
          productData.status !== undefined &&
          productData.status !== existing.status
        ) {
          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.PRODUCT_STATUS_CHANGED,

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

    // REFRESH WEBSITE AND ADMIN PANEL

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

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid product identifier.');
    }

    // MAXIMUM STATUS REQUEST SIZE: 4 KB

    const body = await readJsonBody(
      request,
      4 * 1024
    );

    if (!body.ok) {
      return body.response;
    }

    const parsed = productActionSchema.safeParse(
      body.data
    );

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
            action:
              AUDIT_ACTIONS.PRODUCT_STATUS_CHANGED,

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

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid product identifier.');
    }

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