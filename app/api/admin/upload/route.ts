import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import { join } from 'node:path';

import { randomUUID } from 'node:crypto';

import { PERMISSIONS } from '@/lib/permissions';

import {
  adminDenied,
  badInput,
  apiError,
  secureAdminResponse,
} from '@/lib/admin-api';

// ==========================================
// ROUTE CONFIGURATION
// ==========================================

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

// ==========================================
// MAXIMUM IMAGE SIZE
// 10 MB PER IMAGE
// ==========================================

const MAX_SIZE = 10 * 1024 * 1024;

// ==========================================
// ALLOWED IMAGE FORMATS
// ==========================================

const extensions = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

// ==========================================
// VERIFY ACTUAL IMAGE FILE SIGNATURE
// ==========================================

function matchesImageType(
  buffer: Buffer,
  type: string
): boolean {

  // JPEG SIGNATURE

  if (type === 'image/jpeg') {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  // PNG SIGNATURE

  if (type === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([
          137, 80, 78, 71,
          13, 10, 26, 10,
        ])
      )
    );
  }

  // WEBP SIGNATURE

  if (type === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString(
        'ascii',
        0,
        4
      ) === 'RIFF' &&
      buffer.toString(
        'ascii',
        8,
        12
      ) === 'WEBP'
    );
  }

  // GIF SIGNATURE

  if (type === 'image/gif') {
    const signature =
      buffer.toString(
        'ascii',
        0,
        6
      );

    return (
      buffer.length >= 6 &&
      (
        signature === 'GIF87a' ||
        signature === 'GIF89a'
      )
    );
  }

  // REJECT UNSUPPORTED FILE TYPES

  return false;
}

// ==========================================
// UPLOAD IMAGE
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
    // VERIFY REQUEST CONTENT TYPE
    // ======================================

    const contentType =
      request.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase();

    if (
      contentType !== 'multipart/form-data'
    ) {
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'Image uploads must use multipart/form-data.',
          },
          {
            status: 415,
          }
        )
      );
    }

    // ======================================
    // PARSE MULTIPART FORM DATA
    // ======================================

    const formData =
      await request
        .formData()
        .catch(() => null);

    if (!formData) {
      return badInput(
        'Invalid image upload request.'
      );
    }

    // ======================================
    // REQUIRE EXACTLY ONE IMAGE FILE
    // ======================================

    const files =
      formData.getAll('file');

    if (files.length !== 1) {
      return badInput(
        'Please select exactly one image file.'
      );
    }

    const file = files[0];

    if (
      !file ||
      typeof file === 'string'
    ) {
      return badInput(
        'Please select an image file.'
      );
    }

    // ======================================
    // VALIDATE ALLOWED IMAGE MIME TYPE
    // ======================================

    const extension =
      extensions.get(file.type);

    if (!extension) {
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'Only JPG, PNG, WebP and GIF are supported.',
          },
          {
            status: 415,
          }
        )
      );
    }

    // ======================================
    // REJECT EMPTY IMAGE FILES
    // ======================================

    if (file.size <= 0) {
      return badInput(
        'Image file cannot be empty.'
      );
    }

    // ======================================
    // ENFORCE MAXIMUM IMAGE SIZE
    // ======================================

    if (file.size > MAX_SIZE) {
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'Image must be no larger than 10 MB.',
          },
          {
            status: 413,
          }
        )
      );
    }

    // ======================================
    // CONVERT IMAGE TO BUFFER
    // ======================================

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    // ======================================
    // VERIFY ACTUAL IMAGE FILE SIZE
    // ======================================

    if (
      buffer.length <= 0 ||
      buffer.length !== file.size
    ) {
      return badInput(
        'Invalid image file size.'
      );
    }

    if (buffer.length > MAX_SIZE) {
      return secureAdminResponse(
        NextResponse.json(
          {
            success: false,

            error:
              'Image must be no larger than 10 MB.',
          },
          {
            status: 413,
          }
        )
      );
    }

    // ======================================
    // VERIFY ACTUAL FILE SIGNATURE
    // ======================================

    if (
      !matchesImageType(
        buffer,
        file.type
      )
    ) {
      return badInput(
        'Invalid image file contents.'
      );
    }

    // ======================================
    // GENERATE SECURE UNIQUE FILENAME
    // NEVER TRUST ORIGINAL USER FILENAME
    // ======================================

    const filename =
      `${Date.now()}-${randomUUID()}.${extension}`;

    // ======================================
    // LOCAL UPLOAD DIRECTORY
    // ======================================

    const uploadDirectory = join(
      process.cwd(),

      'public',

      'uploads'
    );

    // ======================================
    // ENSURE UPLOAD DIRECTORY EXISTS
    // ======================================

    await mkdir(
      uploadDirectory,
      {
        recursive: true,
      }
    );

    // ======================================
    // SAVE IMAGE WITHOUT OVERWRITING
    // EXISTING FILES
    // ======================================

    await writeFile(
      join(
        uploadDirectory,
        filename
      ),

      buffer,

      {
        flag: 'wx',
      }
    );

    // ======================================
    // SECURE SUCCESS RESPONSE
    // ======================================

    return secureAdminResponse(
      NextResponse.json(
        {
          success: true,

          url:
            `/uploads/${filename}`,

          filename,

          type: file.type,

          size: file.size,
        },
        {
          status: 201,
        }
      )
    );

  } catch (error) {
    return apiError(
      error,
      'Image upload'
    );
  }
}