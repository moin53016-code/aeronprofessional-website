
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  adminDenied,
  apiError,
  badInput,
} from '@/lib/admin-api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// SUPPORTED IMAGE FORMATS

const allowedContentTypes = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// UPLOAD REQUEST VALIDATION

const presignSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, 'Filename is required')
    .max(255),

  contentType: allowedContentTypes,

  size: z
    .number()
    .int()
    .positive()
    .max(
      MAX_FILE_SIZE,
      'Maximum image size is 10 MB'
    ),
});

// PREPARE IMAGE UPLOAD

export async function POST(
  request: NextRequest
) {
  try {
    // VERIFY ADMIN SESSION

    const denied = await adminDenied();

    if (denied) return denied;

    // VALIDATE REQUEST BODY

    const body = await request
      .json()
      .catch(() => null);

    const parsed =
      presignSchema.safeParse(body);

    if (!parsed.success) {
      return badInput(
        'Invalid image upload information.',
        parsed.error.flatten()
      );
    }

    const {
      filename,
      contentType,
      size,
    } = parsed.data;

    // SANITIZE ORIGINAL FILENAME

    const cleanFilename = filename.replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    );

    // USE EXISTING MULTIPART UPLOAD ENDPOINT
    // DO NOT RETURN FAKE R2 PUBLIC URL

    return NextResponse.json({
      success: true,

      storage: 'local',

      uploadUrl: '/api/admin/upload',

      method: 'POST',

      uploadType: 'multipart/form-data',

      fieldName: 'file',

      filename: cleanFilename,

      contentType,

      size,

      publicUrl: null,

      maxFileSize: MAX_FILE_SIZE,

      message:
        'Upload the image using multipart form data. The final image URL will be returned after a successful upload.',
    });
  } catch (error) {
    return apiError(error, 'Image upload');
  }
}
