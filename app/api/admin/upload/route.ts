
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024;

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function matchesImageType(
  buffer: Buffer,
  type: string
) {
  if (type === 'image/jpeg') {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (type === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([
          137, 80, 78, 71, 13, 10, 26, 10,
        ])
      )
    );
  }

  if (type === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  if (type === 'image/gif') {
    const signature = buffer.toString('ascii', 0, 6);

    return (
      signature === 'GIF87a' ||
      signature === 'GIF89a'
    );
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getSession())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Please select an image file' },
        { status: 400 }
      );
    }

    const extension = extensions[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            'Only JPG, PNG, WebP and GIF are supported.',
        },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error:
            'Image must be non-empty and no larger than 10 MB.',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    if (!matchesImageType(buffer, file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid image file contents.',
        },
        { status: 400 }
      );
    }

    const filename =
      `${Date.now()}-${randomUUID()}.${extension}`;

    const uploadDirectory = join(
      process.cwd(),
      'public',
      'uploads'
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    await writeFile(
      join(uploadDirectory, filename),
      buffer,
      { flag: 'wx' }
    );

    return NextResponse.json(
      {
        success: true,
        url: `/uploads/${filename}`,
        filename,
        type: file.type,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Image upload failed:', error);

    return NextResponse.json(
      { error: 'Image upload failed' },
      { status: 500 }
    );
  }
}