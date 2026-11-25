
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>;
};

const updateFaqSchema = z.object({
  question: z.string().trim().min(1).optional(),
  answer: z.string().trim().min(1).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

function handleError(error: unknown) {
  console.error('FAQ API error:', error);

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2025'
  ) {
    return NextResponse.json(
      { error: 'FAQ not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

function refreshFaqs() {
  revalidatePath('/');
  revalidatePath('/admin/content');
}

export async function GET(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      faq,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);

    const result = updateFaqSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid FAQ data',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: result.data,
    });

    refreshFaqs();

    return NextResponse.json({
      success: true,
      faq,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    const result = z.object({
      isActive: z.boolean().optional(),
      displayOrder: z.number().int().optional(),
    }).safeParse(
      await request.json().catch(() => null)
    );

    if (
      !result.success ||
      Object.keys(result.data).length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid FAQ visibility or order' },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: result.data,
    });

    refreshFaqs();

    return NextResponse.json({
      success: true,
      faq,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
  try {
    if (!(await getSession())) return unauthorized();

    const { id } = await params;

    await prisma.fAQ.delete({
      where: { id },
    });

    refreshFaqs();

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    return handleError(error);
  }
}