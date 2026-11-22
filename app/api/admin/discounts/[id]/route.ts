import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateDiscountSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  discountLabel: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  productIds: z.array(z.string()).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const discount = await prisma.discountCampaign.findUnique({
      where: { id },
      include: {
        discountProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!discount) {
      return NextResponse.json({ error: 'Discount campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, discount });
  } catch (error) {
    console.error('Fetch discount campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateDiscountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { productIds, startsAt, endsAt, ...data } = result.data;
    const updateData: any = { ...data };
    if (startsAt !== undefined) {
      updateData.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (endsAt !== undefined) {
      updateData.endsAt = endsAt ? new Date(endsAt) : null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const campaign = await tx.discountCampaign.update({
        where: { id },
        data: updateData,
      });

      if (productIds !== undefined) {
        await tx.discountProduct.deleteMany({ where: { campaignId: id } });
        if (productIds.length > 0) {
          await tx.discountProduct.createMany({
            data: productIds.map((pId) => ({
              campaignId: id,
              productId: pId,
            })),
          });
        }
      }

      return tx.discountCampaign.findUnique({
        where: { id },
        include: {
          discountProducts: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, discount: updated });
  } catch (error: any) {
    console.error('Update discount campaign error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Discount campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (typeof body.isActive === 'boolean') {
      dataToUpdate.isActive = body.isActive;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'Provide isActive boolean to patch' }, { status: 400 });
    }

    const discount = await prisma.discountCampaign.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, discount });
  } catch (error: any) {
    console.error('Patch discount campaign error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Discount campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.discountCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Discount campaign deleted' });
  } catch (error: any) {
    console.error('Delete discount campaign error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Discount campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
