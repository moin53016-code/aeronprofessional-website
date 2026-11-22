
'use client';

import { useState, type ChangeEvent } from 'react';
import {
  Upload,
  Link as LinkIcon,
  ImageIcon,
  Loader2,
  X,
} from 'lucide-react';

interface ProductImageInputProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ProductImageInput({
  value,
  onChange,
}: ProductImageInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);

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
      setError('Image must be smaller than 10 MB.');
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

      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {
        throw new Error(
          data.error || 'Image upload failed'
        );
      }

      setPreviewFailed(false);
      onChange(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to upload image'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('upload');
            setError('');
          }}
          className={`flex items-center justify-center gap-2 border px-3 py-3 text-sm font-semibold transition ${
            mode === 'upload'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          <Upload size={16} />
          Upload Image
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('url');
            setError('');
          }}
          className={`flex items-center justify-center gap-2 border px-3 py-3 text-sm font-semibold transition ${
            mode === 'url'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          <LinkIcon size={16} />
          Image URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="border-2 border-dashed border-gray-300 p-6 text-center">
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
            <label className="cursor-pointer flex flex-col items-center gap-3">
              <Upload
                size={30}
                className="text-gray-500"
              />

              <span className="font-semibold text-sm">
                Click to upload image
              </span>

              <span className="text-xs text-gray-500">
                JPG, PNG, WebP or GIF — Max 10 MB
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-600 mb-2">
            IMAGE URL
          </label>

          <input
            type="url"
            value={value.startsWith('/uploads/') ? '' : value}
            onChange={(e) => {
              setPreviewFailed(false);
              onChange(e.target.value);
            }}
            placeholder="https://example.com/product.jpg"
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:border-black"
          />

          <p className="text-xs text-gray-500 mt-2">
            Paste a direct image link.
          </p>

          {value.startsWith('/uploads/') && (
            <p className="text-xs text-gray-500 mt-2">
              Current image was uploaded locally.
              Enter a new URL to replace it.
            </p>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 p-3 text-sm"
        >
          {error}
        </div>
      )}

      {value && (
        <div className="border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-600">
              IMAGE PREVIEW
            </p>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setPreviewFailed(false);
                setError('');
              }}
              className="flex items-center gap-1 text-xs text-red-600"
            >
              <X size={14} />
              Remove
            </button>
          </div>

          {previewFailed ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <ImageIcon size={18} />
              Image preview unavailable
            </div>
          ) : (
            <img
              key={value}
              src={value}
              alt="Product preview"
              className="w-full max-h-60 object-contain bg-gray-50"
              onError={() => setPreviewFailed(true)}
            />
          )}

          <p className="text-xs text-gray-500 mt-3 break-all">
            {value}
          </p>
        </div>
      )}
    </div>
  );
}
