import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { z } from 'zod';

import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  apiError,
  badInput,
  secureAdminResponse,
} from '@/lib/admin-api';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// MAXIMUM IMAGE FILE SIZE
// 10 MB PER IMAGE
// ==========================================

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ==========================================
// SUPPORTED IMAGE FORMATS
// ==========================================

const allowedContentTypes = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// ==========================================
// UPLOAD REQUEST VALIDATION
// ==========================================

const presignSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, 'Filename is required')
    .max(255),

  contentType:
    allowedContentTypes,

  size: z
    .number()
    .int()
    .positive()
    .max(
      MAX_FILE_SIZE,
      'Maximum image size is 10 MB'
    ),
});

// ==========================================
// PREPARE IMAGE UPLOAD
// ==========================================

export async function POST(
  request: NextRequest
) {
  try {
    // ======================================
    // AUTHENTICATION, CSRF AND PERMISSIONS
    // ======================================

    const denied = await adminDenied({
      request,

      permission:
        PERMISSIONS.MEDIA_UPLOAD,
    });

    if (denied) {
      return denied;
    }

    // ======================================
    // VERIFY JSON CONTENT TYPE
    // ======================================

    const contentTypeHeader =
      request.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase();

    if (
      contentTypeHeader !== 'application/json'
    ) {
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'Content-Type must be application/json.',
          },
          {
            status: 415,
          }
        )
      );
    }

    // ======================================
    // PARSE REQUEST BODY
    // ======================================

    const body = await request
      .json()
      .catch(() => null);

    // ======================================
    // VALIDATE IMAGE UPLOAD INFORMATION
    // ======================================

    const parsed =
      presignSchema.safeParse(body);

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

    // ======================================
    // SANITIZE ORIGINAL FILENAME
    // ======================================

    const cleanFilename = filename
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      )
      .replace(
        /^\.+/,
        ''
      );

    // ======================================
    // REJECT INVALID SANITIZED FILENAMES
    // ======================================

    if (!cleanFilename) {
      return badInput(
        'Invalid image filename.'
      );
    }

    // ======================================
    // LOCAL MULTIPART UPLOAD CONFIGURATION
    //
    // CLOUDFLARE R2 INTEGRATION WILL BE
    // IMPLEMENTED IN STEP 14.4
    //
    // NEVER RETURN FAKE R2 PUBLIC URLS
    // ======================================

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