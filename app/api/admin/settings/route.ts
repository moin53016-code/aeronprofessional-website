import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch site settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const settingsObj: Record<string, any> = body.settings ?? body;

    if (!settingsObj || typeof settingsObj !== 'object') {
      return NextResponse.json({ error: 'Expected key-value object of settings' }, { status: 400 });
    }

    const entries = Object.entries(settingsObj);

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: value === null ? null : String(value) },
          create: { key, value: value === null ? null : String(value) },
        })
      )
    );

    try {
      revalidateTag('site-settings');
    } catch (e) {
      // In case revalidateTag is called in an unsupported context
    }

    const updatedRows = await prisma.siteSetting.findMany();
    const settings = Object.fromEntries(updatedRows.map((r) => [r.key, r.value ?? '']));

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Update site settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
