import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = presignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, contentType } = result.data;
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${cleanName}`;

    const r2PublicBase = process.env.R2_PUBLIC_BASE_URL || 'https://pub-xxx.r2.dev';
    const publicUrl = `${r2PublicBase.replace(/\/$/, '')}/${key}`;

    // Return the upload metadata and target public URL
    // Can also accept direct multipart uploads on /api/admin/upload
    return NextResponse.json({
      success: true,
      key,
      uploadUrl: `/api/admin/upload`,
      publicUrl,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
