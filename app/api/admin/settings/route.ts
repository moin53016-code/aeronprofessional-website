
import { NextRequest, NextResponse } from 'next/server';

import {
  revalidatePath,
  revalidateTag,
} from 'next/cache';

import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// COMMON TEXT VALIDATION

const text = z.string()
  .trim()
  .max(5000);

// GENERAL WEBSITE URL VALIDATION

const webUrl = z.string()
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
    'Invalid website URL'
  );

// SECURE HTTPS URL VALIDATION

const httpsUrl = z.string()
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
    'Please enter a valid HTTPS URL'
  );

// WHATSAPP URL VALIDATION

const allowedWhatsAppHosts = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'whatsapp.com',
  'www.whatsapp.com',
]);

const whatsappUrl = httpsUrl.refine(
  (value) => {
    if (value === '') return true;

    try {
      const url = new URL(value);

      return allowedWhatsAppHosts.has(
        url.hostname.toLowerCase()
      );
    } catch {
      return false;
    }
  },
  'Please enter a valid WhatsApp URL'
);

// EMAIL VALIDATION

const email = z.string()
  .trim()
  .max(254)
  .email()
  .or(z.literal(''));

// WHATSAPP NUMBER VALIDATION

const whatsappNumber = z.string()
  .trim()
  .regex(
    /^(?:[1-9]\d{7,14})?$/,
    'Enter a valid WhatsApp number with country code'
  );

// WEBSITE SETTINGS SCHEMA

const settingsSchema = z.object({

  // BRAND INFORMATION

  brandName: text.optional(),

  // SOCIAL MEDIA

  instagramUrl: webUrl.optional(),

  instagramHandle: text.optional(),

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

  businessPhone:
    text.optional(),

  // FOOTER SETTINGS

  copyrightText:
    text.optional(),

  footerText:
    text.optional(),

  // ANNOUNCEMENT BAR

  announcementBarText:
    text.optional(),

  announcementBarVisible: z.union([
    z.boolean(),
    z.enum(['true', 'false']),
  ]).optional(),

  // SEO SETTINGS

  seoTitle:
    text.optional(),

  seoDescription:
    text.optional(),

  // PRICE DISCLAIMER

  priceDisclaimer:
    text.optional(),

  // BRAND LOGO

  logoUrl: webUrl
    .or(
      z.string().regex(
        /^\/(?:uploads|images)\/[a-zA-Z0-9._/-]+$/
      )
    )
    .nullable()
    .optional(),
});

// UNAUTHORIZED RESPONSE

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized. Please log in.',
    },
    {
      status: 401,
    }
  );
}

// LOAD WEBSITE SETTINGS

export async function GET() {
  try {

    // VERIFY ADMIN SESSION

    const session = await getSession();

    if (!session) {
      return unauthorized();
    }

    // LOAD SAVED SETTINGS

    const rows =
      await prisma.siteSetting.findMany({
        orderBy: {
          key: 'asc',
        },

        select: {
          key: true,
          value: true,
        },
      });

    const settings = Object.fromEntries(
      rows.map((row) => [
        row.key,
        row.value ?? '',
      ])
    );

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );

  } catch (error) {
    console.error(
      'Settings GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to load website settings.',
      },
      {
        status: 500,
      }
    );
  }
}

// UPDATE WEBSITE SETTINGS

export async function PATCH(
  request: NextRequest
) {
  try {

    // VERIFY ADMIN SESSION

    const session = await getSession();

    if (!session) {
      return unauthorized();
    }

    // READ REQUEST BODY

    const body = await request
      .json()
      .catch(() => null);

    // VALIDATE WEBSITE SETTINGS

    const parsed = settingsSchema.safeParse(
      body?.settings ?? body
    );

    if (!parsed.success) {
      const details = parsed.error.flatten();

      const fieldErrors = Object.values(
        details.fieldErrors
      ).flat();

      return NextResponse.json(
        {
          success: false,

          error:
            fieldErrors[0] ||
            'Invalid website settings.',

          details,
        },
        {
          status: 400,
        }
      );
    }

    // GET VALIDATED SETTINGS

    const entries = Object.entries(
      parsed.data
    ).filter(
      ([, value]) => value !== undefined
    );

    // REJECT EMPTY UPDATE REQUESTS

    if (entries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No website settings provided.',
        },
        {
          status: 400,
        }
      );
    }

    // SAVE ALL SETTINGS IN ONE TRANSACTION

    await prisma.$transaction(
      entries.map(([key, value]) => {
        const storedValue =
          value === null
            ? null
            : String(value);

        return prisma.siteSetting.upsert({
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
      })
    );

    // REFRESH WEBSITE CACHE

    revalidateTag('site-settings');

    revalidatePath('/');

    revalidatePath('/admin/settings');

    // LOAD UPDATED DATABASE SETTINGS

    const rows =
      await prisma.siteSetting.findMany({
        orderBy: {
          key: 'asc',
        },

        select: {
          key: true,
          value: true,
        },
      });

    const settings = Object.fromEntries(
      rows.map((row) => [
        row.key,
        row.value ?? '',
      ])
    );

    // RETURN SAVED SETTINGS

    return NextResponse.json(
      {
        success: true,

        message:
          'Website settings saved successfully.',

        settings,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );

  } catch (error) {
    console.error(
      'Settings PATCH error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to save website settings.',
      },
      {
        status: 500,
      }
    );
  }
}
