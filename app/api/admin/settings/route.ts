
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const text = z.string().trim().max(5000);

const webUrl = z.string().trim().max(2048).refine(
  (value) => {
    if (value === '') return true;

    try {
      const url = new URL(value);

      return (
        url.protocol === 'https:' ||
        url.protocol === 'http:'
      );
    } catch {
      return false;
    }
  },
  'Invalid website URL'
);

const email = z.string()
  .trim()
  .email()
  .or(z.literal(''));

const settingsSchema = z.object({
  brandName: text.optional(),
  instagramUrl: webUrl.optional(),
  instagramHandle: text.optional(),

  whatsappNumber: z.string()
    .trim()
    .regex(/^(?:\d{8,15})?$/)
    .optional(),

  whatsappMessage: text.optional(),
  contactEmail: email.optional(),
  supportEmail: email.optional(),
  businessPhone: text.optional(),
  copyrightText: text.optional(),
  footerText: text.optional(),
  announcementBarText: text.optional(),

  announcementBarVisible: z.union([
    z.boolean(),
    z.enum(['true', 'false']),
  ]).optional(),

  seoTitle: text.optional(),
  seoDescription: text.optional(),
  priceDisclaimer: text.optional(),

  logoUrl: webUrl.or(
    z.string().regex(
      /^\/(?:uploads|images)\/[a-zA-Z0-9._/-]+$/
    )
  ).nullable().optional(),
});

function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

export async function GET() {
  try {
    if (!(await getSession())) {
      return unauthorized();
    }

    const rows = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({
      success: true,
      settings: Object.fromEntries(
        rows.map((row) => [
          row.key,
          row.value ?? '',
        ])
      ),
    });
  } catch (error) {
    console.error('Settings GET error:', error);

    return NextResponse.json(
      { error: 'Unable to load settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getSession())) {
      return unauthorized();
    }

    const body = await request.json().catch(() => null);

    const parsed = settingsSchema.safeParse(
      body?.settings ?? body
    );

    if (
      !parsed.success ||
      Object.keys(parsed.data).length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Invalid website settings',
          details: parsed.success
            ? undefined
            : parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const entries = Object.entries(parsed.data)
      .filter(([, value]) => value !== undefined);

    await prisma.$transaction(
      entries.map(([key, value]) => {
        const storedValue =
          value === null ? null : String(value);

        return prisma.siteSetting.upsert({
          where: { key },

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

    revalidateTag('site-settings');
    revalidatePath('/');
    revalidatePath('/admin/settings');

    const rows = await prisma.siteSetting.findMany();

    return NextResponse.json({
      success: true,
      settings: Object.fromEntries(
        rows.map((row) => [
          row.key,
          row.value ?? '',
        ])
      ),
    });
  } catch (error) {
    console.error('Settings PATCH error:', error);

    return NextResponse.json(
      { error: 'Unable to update settings' },
      { status: 500 }
    );
  }
}