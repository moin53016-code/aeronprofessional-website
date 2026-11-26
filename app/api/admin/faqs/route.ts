import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { prisma } from '@/lib/db';

import { z } from 'zod';

import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  apiError,
  badInput,
  refreshAdmin,
  secureAdminResponse,
} from '@/lib/admin-api';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// FAQ VALIDATION
// ==========================================

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

// ==========================================
// GET ALL FAQS
// ==========================================

export async function GET(
  request: NextRequest
) {
  try {
    // ======================================
    // AUTHENTICATION AND VIEW PERMISSION
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.FAQ_VIEW,
    });

    if (denied) {
      return denied;
    }

    // ======================================
    // FETCH ALL FAQS
    // ======================================

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

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        faqs,
      })
    );

  } catch (error) {
    return apiError(
      error,
      'FAQ'
    );
  }
}

// ==========================================
// CREATE NEW FAQ
// ==========================================

export async function POST(
  request: NextRequest
) {
  try {
    // ======================================
    // AUTHENTICATION, CSRF AND PERMISSIONS
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.FAQ_MANAGE,
    });

    if (denied) {
      return denied;
    }

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE FAQ INPUT
    // ======================================

    const parsed =
      createFaqSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ data.',

        z.flattenError(parsed.error)
      );
    }

    // ======================================
    // CREATE FAQ DATABASE RECORD
    // ======================================

    const faq = await prisma.fAQ.create({
      data: {
        question:
          parsed.data.question,

        answer:
          parsed.data.answer,

        displayOrder:
          parsed.data.displayOrder,

        isActive:
          parsed.data.isActive,
      },
    });

    // ======================================
    // REFRESH STOREFRONT AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/content');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,

          faq,

          message:
            'FAQ created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(
      error,
      'FAQ'
    );
  }
}