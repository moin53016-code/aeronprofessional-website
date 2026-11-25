
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  discountLabel: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime({ offset: true }).nullable().optional(),
  endsAt: z.string().datetime({ offset: true }).nullable().optional(),
  productIds: z.array(z.string().min(1)).optional(),
});

const includeProducts = {
  discountProducts: {
    include: {
      product: true,
    },
  },
} as const;

function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized. Please log in.' },
    { status: 401 }
  );
}

function refreshPages() {
  revalidatePath('/');
  revalidatePath('/admin/discounts');
  revalidatePath('/admin');
}

function handleError(error: unknown) {
  console.error('Discount campaign API error:', error);

  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? error.code
      : undefined;

  if (code === 'P2025') {
    return NextResponse.json(
      { error: 'Discount campaign not found.' },
      { status: 404 }
    );
  }

  if (code === 'P2003') {
    return NextResponse.json(
      { error: 'One or more selected products do not exist.' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Unable to process discount campaign.' },
    { status: 500 }
  );
}

// GET CAMPAIGN

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    const discount = await prisma.discountCampaign.findUnique({
      where: { id },
      include: includeProducts,
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount campaign not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    return handleError(error);
  }
}

// EDIT CAMPAIGN

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid discount campaign data.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      productIds,
      startsAt,
      endsAt,
      ...data
    } = parsed.data;

    const discount = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.discountCampaign.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new Error('CAMPAIGN_NOT_FOUND');
        }

        const start =
          startsAt === undefined
            ? existing.startsAt
            : startsAt
              ? new Date(startsAt)
              : null;

        const end =
          endsAt === undefined
            ? existing.endsAt
            : endsAt
              ? new Date(endsAt)
              : null;

        if (start && end && end < start) {
          throw new Error('INVALID_DATE_RANGE');
        }

        await tx.discountCampaign.update({
          where: { id },
          data: {
            ...data,
            startsAt: start,
            endsAt: end,
          },
        });

        if (productIds !== undefined) {
          await tx.discountProduct.deleteMany({
            where: { campaignId: id },
          });

          const uniqueIds = [...new Set(productIds)];

          if (uniqueIds.length > 0) {
            await tx.discountProduct.createMany({
              data: uniqueIds.map((productId) => ({
                campaignId: id,
                productId,
              })),
            });
          }
        }

        return tx.discountCampaign.findUniqueOrThrow({
          where: { id },
          include: includeProducts,
        });
      }
    );

    refreshPages();

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'CAMPAIGN_NOT_FOUND'
    ) {
      return NextResponse.json(
        { error: 'Discount campaign not found.' },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message === 'INVALID_DATE_RANGE'
    ) {
      return NextResponse.json(
        { error: 'End date must not be before start date.' },
        { status: 400 }
      );
    }

    return handleError(error);
  }
}

// ACTIVATE / DEACTIVATE

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const parsed = z.object({
      isActive: z.boolean(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid campaign status.' },
        { status: 400 }
      );
    }

    const discount = await prisma.discountCampaign.update({
      where: { id },
      data: {
        isActive: parsed.data.isActive,
      },
      include: includeProducts,
    });

    refreshPages();

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE CAMPAIGN ONLY

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    // Prisma cascade removes DiscountProduct associations.
    // Product records themselves remain untouched.

    await prisma.discountCampaign.delete({
      where: { id },
    });

    refreshPages();

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Discount campaign deleted. Products preserved.',
    });
  } catch (error) {
    return handleError(error);
  }
}
