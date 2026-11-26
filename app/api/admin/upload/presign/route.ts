import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  apiError,
  badInput,
  secureAdminResponse,
} from '@/lib/admin-api';

import {
  readJsonBody,
} from '@/lib/request-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// MAXIMUM IMAGE FILE SIZE: 10 MB

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// MAXIMUM METADATA REQUEST SIZE: 4 KB

const MAX_REQUEST_SIZE = 4 * 1024;

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
    .min(1, 'Filename is required.')
    .max(255)
    .refine(
      (value) =>
        !/[\x00-\x1F\x7F]/.test(value) &&
        !value.includes('/') &&
        !value.includes('\\'),

      'Invalid image filename.'
    ),

  contentType:
    allowedContentTypes,

  size: z
    .number()
    .int()
    .positive()
    .max(
      MAX_FILE_SIZE,
      'Maximum image size is 10 MB.'
    ),
});

// PREPARE IMAGE UPLOAD

export async function POST(request: NextRequest) {
  try {

    // AUTHENTICATION, CSRF AND PERMISSIONS

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.MEDIA_UPLOAD,
    });

    if (denied) {
      return denied;
    }

    // CENTRALIZED REQUEST BODY PROTECTION

    const body = await readJsonBody(
      request,
      MAX_REQUEST_SIZE
    );

    if (!body.ok) {
      return body.response;
    }

    // VALIDATE IMAGE UPLOAD INFORMATION

    const parsed = presignSchema.safeParse(
      body.data
    );

    if (!parsed.success) {
      return badInput(
        'Invalid image upload information.',

        z.flattenError(parsed.error)
      );
    }

    const {
      filename,
      contentType,
      size,
    } = parsed.data;

    // SANITIZE ORIGINAL FILENAME

    const cleanFilename = filename
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      )
      .replace(
        /^\.+/,
        ''
      );

    // REJECT INVALID SANITIZED FILENAMES

    if (
      !cleanFilename ||
      !/[a-zA-Z0-9]/.test(cleanFilename)
    ) {
      return badInput(
        'Invalid image filename.'
      );
    }

    // LOCAL MULTIPART UPLOAD CONFIGURATION
    // R2 STORAGE WILL BE INTEGRATED IN STEP 14.4

    return secureAdminResponse(
      NextResponse.json({
        success: true,

        storage: 'local',

        uploadUrl:
          '/api/admin/upload',

        method: 'POST',

        uploadType:
          'multipart/form-data',

        fieldName: 'file',

        filename:
          cleanFilename,

        contentType,

        size,

        publicUrl: null,

        maxFileSize:
          MAX_FILE_SIZE,

        message:
          'Upload the image using multipart form data. The final image URL will be returned after a successful upload.',
      })
    );

  } catch (error) {
    return apiError(
      error,
      'Image upload'
    );
  }
}