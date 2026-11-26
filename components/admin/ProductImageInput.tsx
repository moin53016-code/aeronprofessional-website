'use client';

import {
  useId,
  useState,
  type ChangeEvent,
} from 'react';

import {
  Upload,
  Link2,
  ImageIcon,
  Loader2,
  X,
} from 'lucide-react';

import { normalizeImageUrl } from '@/lib/image-url';

interface ProductImageInputProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ProductImageInput({
  value,
  onChange,
}: ProductImageInputProps) {

  const inputId = useId();

  const [mode, setMode] = useState<'upload' | 'url'>(
    'url'
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [failedUrl, setFailedUrl] = useState('');

  const previewUrl = normalizeImageUrl(value);

  const previewFailed =
    Boolean(value) &&
    (!previewUrl || failedUrl === previewUrl);

  // HANDLE IMAGE URL

  const handleUrlChange = (input: string) => {
    setError('');
    setFailedUrl('');
    onChange(input);
  };

  // APPLY SMART URL CONVERSION

  const applyImageUrl = () => {
    if (!value.trim()) {
      onChange('');
      return;
    }

    const normalized = normalizeImageUrl(value);

    if (!normalized) {
      setError('Please enter a valid HTTPS image URL.');
      return;
    }

    setError('');
    onChange(normalized);
  };

  // IMAGE UPLOAD

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setError('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, WebP and GIF are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Maximum image size is 10 MB.');
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success ||
        typeof data.url !== 'string'
      ) {
        throw new Error(
          data.error || 'Failed to upload image.'
        );
      }

      const imageUrl = normalizeImageUrl(data.url);

      if (!imageUrl) {
        throw new Error('Invalid uploaded image URL.');
      }

      setFailedUrl('');
      onChange(imageUrl);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Image upload failed.'
      );

    } finally {

      setUploading(false);
      event.target.value = '';

    }
  };

  // REMOVE IMAGE

  const removeImage = () => {
    onChange('');
    setError('');
    setFailedUrl('');
  };

  return (
    <div className="w-full min-w-0 space-y-5">

      {/* IMAGE SOURCE OPTIONS */}

      <div className="grid grid-cols-2 gap-2">

        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            setMode('upload');
            setError('');
          }}
          className={`flex min-w-0 items-center justify-center gap-2 rounded-md border px-2 py-3 text-xs font-semibold transition sm:text-sm ${
            mode === 'upload'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Upload size={16} />
          Upload Image
        </button>

        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            setMode('url');
            setError('');
          }}
          className={`flex min-w-0 items-center justify-center gap-2 rounded-md border px-2 py-3 text-xs font-semibold transition sm:text-sm ${
            mode === 'url'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Link2 size={16} />
          Image URL
        </button>

      </div>

      {/* UPLOAD IMAGE */}

      {mode === 'upload' ? (

        <div className="rounded-lg border-2 border-dashed border-gray-300 p-5 text-center sm:p-8">

          {uploading ? (

            <div className="flex flex-col items-center gap-3">

              <Loader2
                size={28}
                className="animate-spin text-gray-600"
              />

              <p className="text-sm text-gray-600">
                Uploading image...
              </p>

            </div>

          ) : (

            <label className="flex cursor-pointer flex-col items-center gap-3">

              <Upload
                size={30}
                className="text-gray-500"
              />

              <span className="text-sm font-semibold">
                Choose Image From Computer
              </span>

              <span className="text-xs text-gray-500">
                JPG, PNG, WebP, GIF — Max 10 MB
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                className="sr-only"
                disabled={uploading}
              />

            </label>

          )}

        </div>

      ) : (

        <div className="space-y-3">

          <label
            htmlFor={inputId}
            className="block text-xs font-bold tracking-wider text-gray-600"
          >
            IMAGE URL
          </label>

          <input
            id={inputId}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            maxLength={2048}
            value={value}
            onChange={(event) =>
              handleUrlChange(event.target.value)
            }
            onBlur={applyImageUrl}
            onPaste={(event) => {

              const pasted =
                event.clipboardData.getData('text');

              const normalized =
                normalizeImageUrl(pasted);

              if (normalized) {
                event.preventDefault();
                handleUrlChange(normalized);
              }

            }}
            placeholder="Paste any public image or Google Drive link"
            className="w-full min-w-0 rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"
          />

          <button
            type="button"
            onClick={() => {
              setFailedUrl('');
              applyImageUrl();
            }}
            className="w-full rounded-md bg-black px-4 py-3 text-xs font-bold tracking-wider text-white hover:bg-gray-800"
          >
            LOAD IMAGE
          </button>

          <p className="text-xs leading-relaxed text-gray-500">
            Supports direct HTTPS image URLs, Google Drive,
            Cloudinary, ImageKit and Dropbox public links.
            Make sure the image is publicly accessible.
          </p>

        </div>

      )}

      {/* ERROR MESSAGE */}

      {error && (

        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>

      )}

      {/* IMAGE PREVIEW */}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">

          <span className="flex items-center gap-2 text-xs font-bold tracking-wider">

            <ImageIcon size={16} />
            IMAGE PREVIEW

          </span>

          {value && (

            <button
              type="button"
              onClick={removeImage}
              disabled={uploading}
              className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
            >

              <X size={14} />
              Remove Image

            </button>

          )}

        </div>

        <div className="relative mx-auto flex aspect-square w-full max-w-lg items-center justify-center overflow-hidden bg-white p-3 sm:p-5 md:p-6">

          {previewUrl && !previewFailed ? (

            <img
              key={previewUrl}
              src={previewUrl}
              alt="Image preview"
              draggable={false}
              onError={() => setFailedUrl(previewUrl)}
              className="block h-full w-full max-h-full max-w-full object-contain object-center"
            />

          ) : (

            <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-400">

              <ImageIcon size={32} />

              <span className="text-xs">

                {previewFailed
                  ? 'Unable to load image preview'
                  : 'Your image will appear here'}

              </span>

              {previewFailed && (

                <p className="max-w-xs text-xs text-red-500">
                  Check the image URL, public sharing
                  permissions and hosting restrictions.
                </p>

              )}

            </div>

          )}

        </div>

        {previewUrl && (

          <p className="break-all border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            {previewUrl}
          </p>

        )}

      </div>

      <p className="text-center text-xs text-gray-500">
        Images automatically fit the available space
        without cropping or stretching.
      </p>

    </div>
  );
}