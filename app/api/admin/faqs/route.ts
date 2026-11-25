
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
} from '@/lib/admin-api';

// FAQ VALIDATION

const createFaqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Question is required')
    .max(500),

  answer: z
    .string()
    .trim()
    .min(1, 'Answer is required')
    .max(10000),

  displayOrder: z
    .number()
    .int()
    .default(0),

  isActive: z
    .boolean()
    .default(true),
});

// GET ALL FAQS

export async function GET() {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const faqs = await prisma.fAQ.findMany({
      orderBy: [
        {
          displayOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      faqs,
    });
  } catch (error) {
    return apiError(error, 'FAQ');
  }
}

// CREATE NEW FAQ

export async function POST(
  request: NextRequest
) {
  try {
    const denied = await adminDenied();

    if (denied) return denied;

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      createFaqSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ data.',
        parsed.error.flatten()
      );
    }

    // CREATE FAQ

    const faq = await prisma.fAQ.create({
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
      },
    });

    // REFRESH STOREFRONT AND ADMIN PANEL

    refreshAdmin('/admin/content');

    return NextResponse.json(
      {
        success: true,
        faq,
        message: 'FAQ created successfully.',
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return apiError(error, 'FAQ');
  }
}
