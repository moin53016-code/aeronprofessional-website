import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  sku: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional(),
  priceInPaise: z.number().int().nonnegative().optional(),
  originalPriceInPaise: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  badgeText: z.string().optional().nullable(),
  primaryImageUrl: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  specifications: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().optional().nullable(),
        displayOrder: z.number().int().default(0),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().optional().nullable(),
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

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        specifications: { orderBy: { displayOrder: 'asc' } },
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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Fetch single product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { categoryIds, specifications, images, marketplaceLinks, ...productData } = result.data;

    const updated = await prisma.$transaction(async (tx) => {
      // If status is changed to ACTIVE and wasn't published before, update publishedAt
      let publishedAtUpdate: any = {};
      if (productData.status === 'ACTIVE') {
        const existing = await tx.product.findUnique({ where: { id }, select: { publishedAt: true } });
        if (!existing?.publishedAt) {
          publishedAtUpdate = { publishedAt: new Date() };
        }
      }

      const product = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...publishedAtUpdate,
        },
      });

      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((cId) => ({
              productId: id,
              categoryId: cId,
            })),
          });
        }
      }

      if (specifications !== undefined) {
        await tx.productSpecification.deleteMany({ where: { productId: id } });
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

      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({
              productId: id,
              url: img.url,
              altText: img.altText,
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
            })),
          });
        }
      }

      if (marketplaceLinks !== undefined) {
        await tx.productMarketplaceLink.deleteMany({ where: { productId: id } });
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
          categories: { include: { category: true } },
          marketplaceLinks: { include: { marketplace: true } },
        },
      });
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    let updateData: any = {};
    switch (action) {
      case 'publish':
        updateData = { status: 'ACTIVE', publishedAt: new Date() };
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
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: publish, unpublish, sold_out, archive, restore' },
          { status: 400 }
        );
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Patch product error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      await prisma.product.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Product permanently deleted' });
    } else {
      const product = await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
      return NextResponse.json({ success: true, product, message: 'Product archived' });
    }
  } catch (error: any) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
