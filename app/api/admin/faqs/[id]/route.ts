import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
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

import {
  readJsonBody,
  REQUEST_LIMITS,
} from '@/lib/request-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Context = {
  params: Promise<{ id: string }>;
};

// FAQ ID VALIDATION

const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

// DISPLAY ORDER VALIDATION

const displayOrderSchema = z
  .number()
  .int()
  .min(-2147483648)
  .max(2147483647);

// FAQ UPDATE VALIDATION

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

  displayOrder:
    displayOrderSchema.optional(),

  isActive:
    z.boolean().optional(),
});

// FAQ STATUS VALIDATION

const statusSchema = z.object({

  isActive:
    z.boolean().optional(),

  displayOrder:
    displayOrderSchema.optional(),
});

// FAQ NOT FOUND RESPONSE

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

// GET INDIVIDUAL FAQ

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {

    const denied = await adminDenied({
      request,
      permission: PERMISSIONS.FAQ_VIEW,
    });

    if (denied) {
      return denied;
    }

    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid FAQ identifier.');
    }

    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      return faqNotFound();
    }

    return secureAdminResponse(
      NextResponse.json({
        success: true,
        faq,
      })
    );

  } catch (error) {
    return apiError(error, 'FAQ');
  }
}

// UPDATE FAQ

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  try {

    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.FAQ_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid FAQ identifier.');
    }

    // CENTRALIZED REQUEST BODY PROTECTION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.JSON
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE FAQ INPUT

    const parsed = updateFaqSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ data.',
        z.flattenError(parsed.error)
      );
    }

    // REJECT EMPTY UPDATES

    if (Object.keys(parsed.data).length === 0) {
      return badInput('No FAQ changes provided.');
    }

    // ATOMIC FAQ UPDATE AND AUDIT LOGGING

    const faq = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.fAQ.findUnique({
          where: { id },

          select: {
            isActive: true,
          },
        });

        if (!existing) {
          return null;
        }

        const updatedFaq = await tx.fAQ.update({
          where: { id },

          data: parsed.data,
        });

        // RECORD FAQ UPDATE

        await recordAdminAction(
          admin,
          {
            action: AUDIT_ACTIONS.FAQ_UPDATED,

            entityType: AUDIT_ENTITIES.FAQ,

            entityId: id,
          },
          tx
        );

        // RECORD ACTIVATION OR DEACTIVATION

        if (
          existing.isActive !== updatedFaq.isActive
        ) {

          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.FAQ_STATUS_CHANGED,

              entityType:
                AUDIT_ENTITIES.FAQ,

              entityId: id,
            },
            tx
          );
        }

        return updatedFaq;
      }
    );

    if (!faq) {
      return faqNotFound();
    }

    refreshAdmin('/admin/content');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        faq,

        message: 'FAQ updated successfully.',
      })
    );

  } catch (error) {
    return apiError(error, 'FAQ');
  }
}

// UPDATE FAQ STATUS OR DISPLAY ORDER

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.FAQ_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid FAQ identifier.');
    }

    // MAXIMUM STATUS REQUEST SIZE: 4 KB

    const body = await readJsonBody(
      request,
      4 * 1024
    );

    if (!body.ok) {
      return body.response;
    }

    const parsed = statusSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      return badInput(
        'Invalid FAQ visibility or order.',
        z.flattenError(parsed.error)
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return badInput(
        'Provide FAQ visibility or display order.'
      );
    }

    // ATOMIC STATUS UPDATE AND AUDIT LOGGING

    const faq = await prisma.$transaction(
      async (tx) => {

        const existing = await tx.fAQ.findUnique({
          where: { id },

          select: {
            isActive: true,
            displayOrder: true,
          },
        });

        if (!existing) {
          return null;
        }

        const updatedFaq = await tx.fAQ.update({
          where: { id },

          data: parsed.data,
        });

        // RECORD STATUS CHANGE

        if (
          existing.isActive !== updatedFaq.isActive
        ) {

          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.FAQ_STATUS_CHANGED,

              entityType:
                AUDIT_ENTITIES.FAQ,

              entityId: id,
            },
            tx
          );
        }

        // RECORD DISPLAY ORDER CHANGE

        if (
          existing.displayOrder !==
          updatedFaq.displayOrder
        ) {

          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.FAQ_UPDATED,

              entityType:
                AUDIT_ENTITIES.FAQ,

              entityId: id,
            },
            tx
          );
        }

        return updatedFaq;
      }
    );

    if (!faq) {
      return faqNotFound();
    }

    refreshAdmin('/admin/content');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        faq,

        message: 'FAQ status updated successfully.',
      })
    );

  } catch (error) {
    return apiError(error, 'FAQ');
  }
}

// PERMANENTLY DELETE FAQ

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  try {

    const authorization = await authorizeAdmin({
      request,
      permission: PERMISSIONS.FAQ_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;
    const { id } = await params;

    if (!idSchema.safeParse(id).success) {
      return badInput('Invalid FAQ identifier.');
    }

    // ATOMIC FAQ DELETION AND AUDIT LOGGING

    await prisma.$transaction(async (tx) => {

      await tx.fAQ.delete({
        where: { id },
      });

      await recordAdminAction(
        admin,
        {
          action:
            AUDIT_ACTIONS.FAQ_DELETED,

          entityType:
            AUDIT_ENTITIES.FAQ,

          entityId: id,
        },
        tx
      );

    });

    refreshAdmin('/admin/content');

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        deleted: true,

        message: 'FAQ deleted successfully.',
      })
    );

  } catch (error) {
    return apiError(error, 'FAQ');
  }
}