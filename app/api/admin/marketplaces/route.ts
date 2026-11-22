
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const marketplaceSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  badgeText: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  url: z.string().url().refine(
    (url) => url.startsWith('https://'),
    'HTTPS link required'
  ),
});

export async function GET() {
  try {
    const marketplaces = await prisma.marketplace.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      marketplaces,
    });
  } catch (error) {
    console.error('Marketplace GET error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch marketplaces' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const marketplace = await prisma.marketplace.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        badgeText: parsed.data.badgeText || null,
        tagline: parsed.data.tagline || null,
        url: parsed.data.url,
        isActive: true,
      },
    });

    return NextResponse.json(
      { success: true, marketplace },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Marketplace POST error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Marketplace name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create marketplace' },
      { status: 500 }
    );
  }
}
