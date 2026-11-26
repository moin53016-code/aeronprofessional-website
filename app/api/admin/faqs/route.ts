import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  authorizeAdmin,
  recordAdminAction,
  apiError,
  badInput,
  refreshAdmin,
  secureAdminResponse,
} from '@/lib/admin-api';

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} from '@/lib/audit-log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  displayOrder: z.number().int().default(0),

  isActive: z.boolean().default(true),
});

// GET ALL FAQS

export async function GET(request: NextRequest) {
  try {
    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.FAQ_VIEW,
    });

    if (denied) {
      return denied;
    }

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

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        faqs,
      })
    );

  } catch (error) {
    return apiError(error, 'FAQ');
  }
}

// CREATE NEW FAQ

export async function POST(request: NextRequest) {
  try {

    // VERIFY ADMIN AND FAQ MANAGEMENT PERMISSION

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.FAQ_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    // VALIDATE REQUEST BODY

    const body = await request
      .json()
      .catch(() => null);

    const parsed = createFaqSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ data.',
        z.flattenError(parsed.error)
      );
    }

    // ATOMIC FAQ CREATION AND AUDIT LOGGING

    const faq = await prisma.$transaction(
      async (tx) => {

        const createdFaq = await tx.fAQ.create({
          data: {
            question: parsed.data.question,

            answer: parsed.data.answer,

            displayOrder: parsed.data.displayOrder,

            isActive: parsed.data.isActive,
          },
        });

        // RECORD VERIFIED ADMIN ACTIVITY

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.FAQ_CREATED,
            entityType: AUDIT_ENTITIES.FAQ,
            entityId: createdFaq.id,
          },
          tx
        );

        return createdFaq;
      }
    );

    // REFRESH STOREFRONT AND ADMIN PANEL

    refreshAdmin('/admin/content');

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,
          faq,
          message: 'FAQ created successfully.',
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(error, 'FAQ');
  }
}