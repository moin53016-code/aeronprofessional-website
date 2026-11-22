
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

type Context = {
  params: Promise<{ id: string }>;
};

const marketplaceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  badgeText: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  url: z
    .string()
    .trim()
    .url('Enter a valid website URL')
    .refine(
      (url) => url.startsWith('https://'),
      'Marketplace URL must start with https://'
    ),
});

// GET MARKETPLACE
export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;

    const marketplace = await prisma.marketplace.findUnique({
      where: { id },
    });

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      marketplace,
    });
  } catch (error) {
    console.error('Marketplace GET error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch marketplace' },
      { status: 500 }
    );
  }
}

// EDIT MARKETPLACE
export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = marketplaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid marketplace information',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const marketplace = await prisma.marketplace.update({
      where: { id },
      data: {
        name: parsed.data.name,
        badgeText: parsed.data.badgeText || null,
        tagline: parsed.data.tagline || null,
        url: parsed.data.url,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Marketplace updated successfully',
      marketplace,
    });
  } catch (error: unknown) {
    console.error('Marketplace PUT error:', error);

    const code =
      error && typeof error === 'object' && 'code' in error
        ? error.code
        : null;

    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Marketplace not found' },
        { status: 404 }
      );
    }

    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'Marketplace name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update marketplace' },
      { status: 500 }
    );
  }
}

// DELETE MARKETPLACE
export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const marketplace = await tx.marketplace.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!marketplace) {
        throw new Error('MARKETPLACE_NOT_FOUND');
      }

      // Remove old product-specific marketplace associations.
      // Products themselves will NOT be deleted.
      await tx.productMarketplaceLink.deleteMany({
        where: { marketplaceId: id },
      });

      // Delete marketplace from database.
      await tx.marketplace.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Marketplace deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Marketplace DELETE error:', error);

    const code =
      error && typeof error === 'object' && 'code' in error
        ? error.code
        : null;

    if (
      code === 'P2025' ||
      (error instanceof Error &&
        error.message === 'MARKETPLACE_NOT_FOUND')
    ) {
      return NextResponse.json(
        { error: 'Marketplace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete marketplace' },
      { status: 500 }
    );
  }
}
