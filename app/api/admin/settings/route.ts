import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
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

// COMMON TEXT VALIDATION

const text = z
  .string()
  .trim()
  .max(5000);

// GENERAL WEBSITE URL VALIDATION

const webUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      if (value === '') return true;

      try {
        const url = new URL(value);

        return (
          Boolean(url.hostname) &&
          !url.username &&
          !url.password &&
          (
            url.protocol === 'https:' ||
            url.protocol === 'http:'
          )
        );

      } catch {
        return false;
      }
    },
    'Invalid website URL.'
  );

// SECURE HTTPS URL VALIDATION

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      if (value === '') return true;

      try {
        const url = new URL(value);

        return (
          url.protocol === 'https:' &&
          Boolean(url.hostname) &&
          !url.username &&
          !url.password
        );

      } catch {
        return false;
      }
    },
    'Please enter a valid HTTPS URL.'
  );

// TRUSTED WHATSAPP DOMAINS

const allowedWhatsAppHosts = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'whatsapp.com',
  'www.whatsapp.com',
]);

// WHATSAPP URL VALIDATION

const whatsappUrl = httpsUrl.refine(
  (value) => {
    if (value === '') return true;

    try {
      const url = new URL(value);

      return (
        allowedWhatsAppHosts.has(
          url.hostname.toLowerCase()
        ) &&
        url.port === ''
      );

    } catch {
      return false;
    }
  },
  'Please enter a valid WhatsApp URL.'
);

// EMAIL VALIDATION

const email = z
  .string()
  .trim()
  .max(254)
  .email()
  .or(z.literal(''));

// WHATSAPP NUMBER VALIDATION

const whatsappNumber = z
  .string()
  .trim()
  .max(15)
  .regex(
    /^(?:[1-9]\d{7,14})?$/,
    'Enter a valid WhatsApp number with country code.'
  );

// LOCAL LOGO PATH VALIDATION

const localLogoPath = z
  .string()
  .trim()
  .max(2048)
  .regex(
    /^\/(?:uploads|images)\/[a-zA-Z0-9._/-]+$/,
    'Invalid local logo path.'
  )
  .refine(
    (value) =>
      value.split('/').slice(1).every(
        (segment) =>
          segment !== '' &&
          segment !== '.' &&
          segment !== '..'
      ),
    'Invalid logo path.'
  );

// WEBSITE SETTINGS VALIDATION

const settingsSchema = z.object({

  // BRAND INFORMATION

  brandName: z
    .string()
    .trim()
    .max(200)
    .optional(),

  // SOCIAL MEDIA

  instagramUrl: webUrl.optional(),

  instagramHandle: z
    .string()
    .trim()
    .max(150)
    .optional(),

  // WHATSAPP SUPPORT

  whatsappNumber:
    whatsappNumber.optional(),

  whatsappMessage:
    text.optional(),

  whatsappUrl:
    whatsappUrl.optional(),

  // EMAIL SUPPORT

  contactEmail:
    email.optional(),

  supportEmail:
    email.optional(),

  // WARRANTY SUPPORT

  warrantySupportUrl:
    httpsUrl.optional(),

  // BUSINESS INFORMATION

  businessPhone: z
    .string()
    .trim()
    .max(100)
    .optional(),

  // FOOTER SETTINGS

  copyrightText: z
    .string()
    .trim()
    .max(500)
    .optional(),

  footerText:
    text.optional(),

  // ANNOUNCEMENT BAR

  announcementBarText: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  announcementBarVisible: z
    .union([
      z.boolean(),
      z.enum(['true', 'false']),
    ])
    .optional(),

  // SEO SETTINGS

  seoTitle: z
    .string()
    .trim()
    .max(300)
    .optional(),

  seoDescription: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  // PRICE DISCLAIMER

  priceDisclaimer:
    text.optional(),

  // BRAND LOGO

  logoUrl: webUrl
    .or(localLogoPath)
    .nullable()
    .optional(),
});

// LOAD SAVED WEBSITE SETTINGS

async function loadWebsiteSettings() {

  const rows = await prisma.siteSetting.findMany({
    orderBy: {
      key: 'asc',
    },

    select: {
      key: true,

      value: true,
    },
  });

  return Object.fromEntries(
    rows.map((row) => [
      row.key,

      row.value ?? '',
    ])
  );
}

// GET WEBSITE SETTINGS
// OWNER AND ADMIN ONLY

export async function GET(request: NextRequest) {
  try {

    const denied = await adminDenied({
      request,

      permission: PERMISSIONS.SETTINGS_VIEW,
    });

    if (denied) {
      return denied;
    }

    const settings = await loadWebsiteSettings();

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        settings,
      })
    );

  } catch (error) {
    return apiError(error, 'Website settings');
  }
}

// UPDATE WEBSITE SETTINGS
// OWNER AND ADMIN ONLY

export async function PATCH(request: NextRequest) {
  try {

    // VERIFY ADMIN PERMISSION

    const authorization = await authorizeAdmin({
      request,

      permission: PERMISSIONS.SETTINGS_MANAGE,
    });

    if (!authorization.ok) {
      return authorization.response;
    }

    const admin = authorization.user;

    // CENTRALIZED REQUEST BODY PROTECTION

    const body = await readJsonBody(
      request,
      REQUEST_LIMITS.SETTINGS
    );

    if (!body.ok) {
      return body.response;
    }

    // SUPPORT EXISTING SETTINGS REQUEST FORMAT

    const payload = body.data;

    const settingsInput =
      typeof payload === 'object' &&
      payload !== null &&
      !Array.isArray(payload) &&
      'settings' in payload
        ? payload.settings
        : payload;

    // VALIDATE WEBSITE SETTINGS

    const parsed = settingsSchema.safeParse(
      settingsInput
    );

    if (!parsed.success) {

      const details = z.flattenError(
        parsed.error
      );

      const fieldErrors = Object.values(
        details.fieldErrors
      ).flat();

      return badInput(
        fieldErrors[0] ||
          'Invalid website settings.',

        details
      );
    }

    // GET VALIDATED SETTINGS

    const entries = Object.entries(
      parsed.data
    ).filter(
      ([, value]) => value !== undefined
    );

    // REJECT EMPTY UPDATES

    if (entries.length === 0) {
      return badInput(
        'No website settings provided.'
      );
    }

    // ATOMIC SETTINGS UPDATE AND AUDIT LOGGING

    await prisma.$transaction(
      async (tx) => {

        // LOAD EXISTING SETTINGS

        const existingRows =
          await tx.siteSetting.findMany({
            where: {
              key: {
                in: entries.map(
                  ([key]) => key
                ),
              },
            },

            select: {
              key: true,

              value: true,
            },
          });

        const existingSettings = new Map(
          existingRows.map((row) => [
            row.key,

            row.value,
          ])
        );

        // SAVE ONLY CHANGED SETTINGS

        for (const [key, value] of entries) {

          const storedValue =
            value === null
              ? null
              : String(value);

          // SKIP UNCHANGED SETTINGS

          if (
            existingSettings.has(key) &&
            existingSettings.get(key) === storedValue
          ) {
            continue;
          }

          // CREATE OR UPDATE SETTING

          await tx.siteSetting.upsert({
            where: {
              key,
            },

            create: {
              key,

              value: storedValue,
            },

            update: {
              value: storedValue,
            },
          });

          // RECORD VERIFIED ADMIN ACTIVITY
          // NEVER STORE SETTING VALUES IN AUDIT LOGS

          await recordAdminAction(
            admin,
            {
              action:
                AUDIT_ACTIONS.SETTINGS_UPDATED,

              entityType:
                AUDIT_ENTITIES.SETTINGS,

              entityId: key,
            },
            tx
          );
        }
      },

      {
        maxWait: 10000,

        timeout: 30000,
      }
    );

    // INVALIDATE WEBSITE SETTINGS CACHE

    revalidateTag('site-settings');

    // REFRESH WEBSITE AND ADMIN PANEL

    refreshAdmin('/admin/settings');

    // LOAD UPDATED WEBSITE SETTINGS

    const settings = await loadWebsiteSettings();

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        message:
          'Website settings saved successfully.',

        settings,
      })
    );

  } catch (error) {
    return apiError(error, 'Website settings');
  }
}