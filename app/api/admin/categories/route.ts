
import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createCategorySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

export async function GET() {
  try {
    if (!(await getSession())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            productCategories: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Fetch categories error:', error);

    return NextResponse.json(
      { error: 'Unable to fetch categories.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getSession())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid category data.',
          details: z.flattenError(result.error),
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: result.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/categories');

    return NextResponse.json(
      {
        success: true,
        category,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Create category error:', error);

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error:
            'Category name or slug already exists.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to create category.' },
      { status: 500 }
    );
  }
}
