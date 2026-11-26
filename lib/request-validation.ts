import 'server-only';

import { NextResponse } from 'next/server';
import { secureAdminResponse } from '@/lib/admin-api';

// CENTRALIZED REQUEST SIZE LIMITS

export const REQUEST_LIMITS = {
  LOGIN: 4 * 1024,

  JSON: 256 * 1024,

  PRODUCT: 1024 * 1024,

  SETTINGS: 128 * 1024,

  UPLOAD: 11 * 1024 * 1024,
} as const;

// REQUEST VALIDATION RESULT

type RequestResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      response: NextResponse;
    };

// CENTRALIZED ERROR RESPONSE

function requestError(
  error: string,
  status: number
): RequestResult<never> {
  return {
    ok: false,

    response: secureAdminResponse(
      NextResponse.json(
        {
          success: false,
          error,
        },
        {
          status,
        }
      )
    ),
  };
}

// READ REQUEST BODY WITH SIZE PROTECTION

async function readLimitedBody(
  request: Request,
  maxBytes: number
): Promise<RequestResult<Uint8Array<ArrayBuffer>>> {

  // REJECT UNSUPPORTED CONTENT ENCODING

  const encoding = request.headers
    .get('content-encoding')
    ?.trim()
    .toLowerCase();

  if (encoding && encoding !== 'identity') {
    return requestError(
      'Unsupported content encoding.',
      415
    );
  }

  // EARLY CONTENT LENGTH VALIDATION

  const contentLength =
    request.headers.get('content-length');

  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return requestError(
        'Invalid content length.',
        400
      );
    }

    if (Number(contentLength) > maxBytes) {
      return requestError(
        'Request body is too large.',
        413
      );
    }
  }

  // REQUIRE REQUEST BODY

  if (!request.body) {
    return requestError(
      'Request body is required.',
      400
    );
  }

  // ENFORCE ACTUAL STREAM SIZE

  const reader = request.body.getReader();

  let totalBytes = 0;

  let buffer = new Uint8Array(
    Math.min(maxBytes, 8192)
  );

  try {
    while (true) {
      const { done, value } =
        await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      const nextSize =
        totalBytes + value.byteLength;

      if (nextSize > maxBytes) {

        void reader.cancel().catch(() => {});

        return requestError(
          'Request body is too large.',
          413
        );
      }

      // GROW BUFFER WITHOUT EXCEEDING LIMIT

      if (nextSize > buffer.length) {
        const nextCapacity = Math.min(
          maxBytes,
          Math.max(
            nextSize,
            buffer.length * 2
          )
        );

        const expanded =
          new Uint8Array(nextCapacity);

        expanded.set(
          buffer.subarray(0, totalBytes)
        );

        buffer = expanded;
      }

      buffer.set(value, totalBytes);

      totalBytes = nextSize;
    }

    if (totalBytes === 0) {
      return requestError(
        'Request body cannot be empty.',
        400
      );
    }

    // RETURN VALIDATED REQUEST BODY

    return {
      ok: true,
      data: buffer.subarray(0, totalBytes),
    };

  } catch {
    return requestError(
      'Unable to read request body.',
      400
    );

  } finally {
    reader.releaseLock();
  }
}

// SAFE JSON REQUEST PARSER

export async function readJsonBody(
  request: Request,

  maxBytes: number = REQUEST_LIMITS.JSON
): Promise<RequestResult<unknown>> {

  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();

  if (contentType !== 'application/json') {
    return requestError(
      'Content-Type must be application/json.',
      415
    );
  }

  const result = await readLimitedBody(
    request,
    maxBytes
  );

  if (!result.ok) {
    return result;
  }

  try {
    const decoded = new TextDecoder(
      'utf-8',
      {
        fatal: true,
      }
    ).decode(result.data);

    const data: unknown =
      JSON.parse(decoded);

    return {
      ok: true,
      data,
    };

  } catch {
    return requestError(
      'Invalid JSON request body.',
      400
    );
  }
}

// SAFE MULTIPART REQUEST PARSER

export async function readMultipartBody(
  request: Request,

  maxBytes: number = REQUEST_LIMITS.UPLOAD
): Promise<RequestResult<FormData>> {

  const contentType =
    request.headers.get('content-type') || '';

  const mediaType = contentType
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (mediaType !== 'multipart/form-data') {
    return requestError(
      'Content-Type must be multipart/form-data.',
      415
    );
  }

  const result = await readLimitedBody(
    request,
    maxBytes
  );

  if (!result.ok) {
    return result;
  }

  try {
    const formData = await new Response(
      result.data,
      {
        headers: {
          'Content-Type': contentType,
        },
      }
    ).formData();

    return {
      ok: true,
      data: formData,
    };

  } catch {
    return requestError(
      'Invalid multipart request body.',
      400
    );
  }
}