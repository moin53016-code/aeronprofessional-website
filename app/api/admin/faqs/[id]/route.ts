import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { z } from 'zod';

import { prisma } from '@/lib/db';

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
// ROUTE CONTEXT
// ==========================================

type Context = {
  params: Promise<{ id: string }>;
};

// ==========================================
// FAQ UPDATE VALIDATION
// ==========================================

const updateFaqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Question is required')
    .max(500)
    .optional(),

  answer: z
    .string()
    .trim()
    .min(1, 'Answer is required')
    .max(10000)
    .optional(),

  displayOrder: z
    .number()
    .int()
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});

// ==========================================
// FAQ STATUS VALIDATION
// ==========================================

const statusSchema = z.object({
  isActive: z
    .boolean()
    .optional(),

  displayOrder: z
    .number()
    .int()
    .optional(),
});

// ==========================================
// FAQ NOT FOUND RESPONSE
// ==========================================

function faqNotFound() {
  return secureAdminResponse(
    NextResponse.json(
      {
        success: false,

        error: 'FAQ not found.',
      },
      {
        status: 404,
      }
    )
  );
}

// ==========================================
// GET INDIVIDUAL FAQ
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: Context
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

    const { id } = await params;

    // ======================================
    // FETCH FAQ
    // ======================================

    const faq = await prisma.fAQ.findUnique({
      where: {
        id,
      },
    });

    if (!faq) {
      return faqNotFound();
    }

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        faq,
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
// UPDATE FAQ
// ==========================================

export async function PUT(
  request: NextRequest,
  { params }: Context
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

    const { id } = await params;

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE FAQ UPDATE INPUT
    // ======================================

    const parsed =
      updateFaqSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ data.',

        z.flattenError(parsed.error)
      );
    }

    // ======================================
    // REJECT EMPTY UPDATE REQUESTS
    // ======================================

    if (
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'No FAQ changes provided.'
      );
    }

    // ======================================
    // UPDATE FAQ DATABASE RECORD
    // ======================================

    const faq = await prisma.fAQ.update({
      where: {
        id,
      },

      data: parsed.data,
    });

    // ======================================
    // REFRESH STOREFRONT AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/content');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        faq,

        message:
          'FAQ updated successfully.',
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
// ACTIVATE / DEACTIVATE FAQ
// UPDATE FAQ DISPLAY ORDER
// ==========================================

export async function PATCH(
  request: NextRequest,
  { params }: Context
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

    const { id } = await params;

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE FAQ STATUS OR DISPLAY ORDER
    // ======================================

    const parsed =
      statusSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ visibility or order.',

        z.flattenError(parsed.error)
      );
    }

    // ======================================
    // REJECT EMPTY STATUS UPDATE REQUESTS
    // ======================================

    if (
      Object.keys(parsed.data).length === 0
    ) {
      return badInput(
        'Provide FAQ visibility or display order.'
      );
    }

    // ======================================
    // UPDATE FAQ STATUS
    // ======================================

    const faq = await prisma.fAQ.update({
      where: {
        id,
      },

      data: parsed.data,
    });

    // ======================================
    // REFRESH STOREFRONT AND ADMIN PANEL
    // ======================================

    refreshAdmin('/admin/content');

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        faq,

        message:
          'FAQ status updated successfully.',
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
// PERMANENTLY DELETE FAQ
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: Context
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

    const { id } = await params;

    // ======================================
    // DELETE FAQ DATABASE RECORD
    // ======================================

    await prisma.fAQ.delete({
      where: {
        id,
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
      NextResponse.json({
        success: true,

        deleted: true,

        message:
          'FAQ deleted successfully.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'FAQ'
    );
  }
}