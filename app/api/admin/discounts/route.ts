import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createDiscountSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  discountLabel: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  productIds: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const discounts = await prisma.discountCampaign.findMany({
      include: {
        discountProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                priceInPaise: true,
                originalPriceInPaise: true,
                primaryImageUrl: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, discounts });
  } catch (error) {
    console.error('Fetch discount campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createDiscountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { productIds, startsAt, endsAt, ...data } = result.data;

    const discount = await prisma.$transaction(async (tx) => {
      const campaign = await tx.discountCampaign.create({
        data: {
          ...data,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
          discountProducts: {
            create: productIds.map((pId) => ({
              productId: pId,
            })),
          },
        },
        include: {
          discountProducts: {
            include: {
              product: true,
            },
          },
        },
      });
      return campaign;
    });

    return NextResponse.json({ success: true, discount }, { status: 201 });
  } catch (error) {
    console.error('Create discount campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
