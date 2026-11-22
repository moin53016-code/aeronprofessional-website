import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateBannerSchema = z.object({
  eyebrow: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  mobileImageUrl: z.string().optional().nullable(),
  buttonLabel: z.string().optional().nullable(),
  buttonTarget: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const banner = await prisma.homepageBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Fetch banner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateBannerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { startsAt, endsAt, ...data } = result.data;
    const updateData: any = { ...data };
    if (startsAt !== undefined) {
      updateData.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (endsAt !== undefined) {
      updateData.endsAt = endsAt ? new Date(endsAt) : null;
    }

    const banner = await prisma.homepageBanner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    console.error('Update banner error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
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
    if (typeof body.displayOrder === 'number') {
      dataToUpdate.displayOrder = body.displayOrder;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'Provide isActive or displayOrder to patch' },
        { status: 400 }
      );
    }

    const banner = await prisma.homepageBanner.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    console.error('Patch banner error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    await prisma.homepageBanner.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Banner deleted' });
  } catch (error: any) {
    console.error('Delete banner error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
