'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import {
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
} from 'lucide-react';

import ProductImageInput from '@/components/admin/ProductImageInput';
import { normalizeImageUrl } from '@/lib/image-url';

// BANNER TYPES

interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonLabel: string | null;
  buttonTarget: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface BannerForm {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonLabel: string;
  buttonTarget: string;
  displayOrder: number;
  isActive: boolean;
}

// DEFAULT BANNER FORM

const DEFAULT_FORM: BannerForm = {
  eyebrow: '',
  title: '',
  description: '',
  imageUrl: '',
  buttonLabel: 'SHOP NOW',
  buttonTarget: 'Shop All',
  displayOrder: 0,
  isActive: true,
};

// BANNER IMAGE PREVIEW

function BannerPreview({
  imageUrl,
  title,
}: {
  imageUrl: string;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  const source = normalizeImageUrl(imageUrl);

  if (!source || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
        <ImageIcon size={28} />

        <span className="text-xs">
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={title}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className="block h-full w-full object-contain object-center"
    />
  );
}

// MAIN BANNER MANAGEMENT

export default function BannerList({
  initialBanners,
}: {
  initialBanners: Banner[];
}) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<BannerForm>({ ...DEFAULT_FORM });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const fieldClass =
    'w-full min-w-0 rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black';

  const labelClass =
    'mb-2 block text-xs font-bold tracking-wider text-gray-600';

  // UPDATE FORM FIELD

  function updateForm<K extends keyof BannerForm>(
    key: K,
    value: BannerForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError('');
  }

  // RESET FORM

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setError('');
  };

  // ADD NEW BANNER

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setError('');
    setShowForm(true);
  };

  // EDIT EXISTING BANNER

  const openEditForm = (banner: Banner) => {
    setEditingId(banner.id);

    setForm({
      eyebrow: banner.eyebrow,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      buttonLabel: banner.buttonLabel ?? 'SHOP NOW',
      buttonTarget: banner.buttonTarget ?? 'Shop All',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });

    setError('');
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SAVE OR UPDATE BANNER

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError('');

    if (
      !form.eyebrow.trim() ||
      !form.title.trim() ||
      !form.description.trim()
    ) {
      setError(
        'Please complete all required banner fields.'
      );
      return;
    }

    const imageUrl = normalizeImageUrl(form.imageUrl);

    if (!imageUrl) {
      setError(
        'Please upload an image or enter a valid HTTPS image URL.'
      );
      return;
    }

    setLoading(true);

    try {
      const endpoint = editingId
        ? `/api/admin/banners/${editingId}`
        : '/api/admin/banners';

      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          eyebrow: form.eyebrow.trim(),

          title: form.title.trim(),

          description: form.description.trim(),

          imageUrl,

          buttonLabel:
            form.buttonLabel.trim() || 'SHOP NOW',

          buttonTarget:
            form.buttonTarget.trim() || 'Shop All',

          displayOrder: form.displayOrder,

          isActive: form.isActive,
        }),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to save banner.'
        );
      }

      closeForm();
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save banner.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ACTIVATE OR DEACTIVATE BANNER

  const handleToggleActive = async (
    id: string,
    isActive: boolean
  ) => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/banners/${id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            isActive: !isActive,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to update banner status.'
        );
      }

      if (editingId === id) {
        closeForm();
      }

      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update banner status.'
      );

    } finally {
      setLoading(false);
    }
  };

  // DELETE BANNER

  const handleDelete = async (id: string) => {
    if (loading) return;

    if (
      !window.confirm(
        'Are you sure you want to delete this banner?'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/banners/${id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to delete banner.'
        );
      }

      if (editingId === id) {
        closeForm();
      }

      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete banner.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0">

      {/* ADD BANNER BUTTON */}

      <div className="mb-5 flex justify-end">

        <button
          type="button"
          disabled={loading}
          onClick={
            showForm ? closeForm : openAddForm
          }
          className="flex items-center gap-2 bg-black px-5 py-3 text-xs font-bold tracking-wider text-white transition hover:bg-gray-800 disabled:opacity-50"
        >

          {showForm ? (
            <X size={16} />
          ) : (
            <Plus size={16} />
          )}

          {showForm ? 'CANCEL' : 'ADD BANNER'}

        </button>

      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* ADD AND EDIT BANNER FORM */}

      {showForm && (

        <form
          onSubmit={handleSave}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6"
        >

          <div className="mb-6 flex items-center justify-between">

            <h3 className="text-lg font-semibold text-gray-900">
              {editingId
                ? 'Edit Homepage Banner'
                : 'Add Homepage Banner'}
            </h3>

            <button
              type="button"
              disabled={loading}
              onClick={closeForm}
              aria-label="Close banner form"
              className="text-gray-400 hover:text-black"
            >
              <X size={20} />
            </button>

          </div>

          <fieldset disabled={loading}>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* EYEBROW */}

              <div>

                <label className={labelClass}>
                  EYEBROW (TOP SUBTITLE) *
                </label>

                <input
                  value={form.eyebrow}
                  onChange={(e) =>
                    updateForm('eyebrow', e.target.value)
                  }
                  maxLength={200}
                  required
                  className={fieldClass}
                  placeholder="PROFESSIONAL SALON GRADE"
                />

              </div>

              {/* TITLE */}

              <div>

                <label className={labelClass}>
                  TITLE *
                </label>

                <input
                  value={form.title}
                  onChange={(e) =>
                    updateForm('title', e.target.value)
                  }
                  maxLength={500}
                  required
                  className={fieldClass}
                  placeholder="HIGH-SPEED HAIR DRYER"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <label className={labelClass}>
                  DESCRIPTION *
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateForm(
                      'description',
                      e.target.value
                    )
                  }
                  maxLength={5000}
                  rows={4}
                  required
                  className={fieldClass}
                  placeholder="Enter promotional banner description..."
                />

              </div>

              {/* SINGLE RESPONSIVE BANNER IMAGE */}

              <div className="md:col-span-2">

                <div className="rounded-lg border border-gray-200 p-4 sm:p-6">

                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-wider">

                    <ImageIcon size={18} />

                    BANNER IMAGE *

                  </h4>

                  <p className="mb-5 text-xs leading-relaxed text-gray-500">

                    Upload an image from your computer
                    or paste a public image URL.
                    The same image will automatically
                    adjust to desktop, tablet and
                    mobile screens.

                  </p>

                  <ProductImageInput
                    key={editingId ?? 'new-banner'}
                    value={form.imageUrl}
                    onChange={(url) =>
                      updateForm('imageUrl', url)
                    }
                  />

                </div>

              </div>

              {/* BUTTON LABEL */}

              <div>

                <label className={labelClass}>
                  BUTTON LABEL
                </label>

                <input
                  value={form.buttonLabel}
                  onChange={(e) =>
                    updateForm(
                      'buttonLabel',
                      e.target.value
                    )
                  }
                  maxLength={100}
                  className={fieldClass}
                  placeholder="SHOP NOW"
                />

              </div>

              {/* BUTTON TARGET */}

              <div>

                <label className={labelClass}>
                  BUTTON TARGET
                </label>

                <input
                  value={form.buttonTarget}
                  onChange={(e) =>
                    updateForm(
                      'buttonTarget',
                      e.target.value
                    )
                  }
                  maxLength={200}
                  className={fieldClass}
                  placeholder="Shop All"
                />

              </div>

              {/* DISPLAY ORDER */}

              <div>

                <label className={labelClass}>
                  DISPLAY ORDER
                </label>

                <input
                  type="number"
                  value={form.displayOrder}
                  min={-2147483648}
                  max={2147483647}
                  step={1}
                  onChange={(e) =>
                    updateForm(
                      'displayOrder',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className={fieldClass}
                />

              </div>

              {/* ACTIVE STATUS */}

              <div className="flex items-center md:pt-6">

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      updateForm(
                        'isActive',
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 accent-black"
                  />

                  <span className="text-sm font-medium">
                    Active (Visible on Homepage)
                  </span>

                </label>

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-black px-6 py-3 text-xs font-bold tracking-wider text-white transition hover:bg-gray-800 disabled:opacity-50"
              >

                {loading && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                {loading
                  ? 'SAVING...'
                  : editingId
                    ? 'UPDATE BANNER'
                    : 'SAVE BANNER'}

              </button>

              <button
                type="button"
                disabled={loading}
                onClick={closeForm}
                className="border border-gray-300 px-6 py-3 text-xs font-bold tracking-wider hover:bg-gray-50"
              >
                CANCEL
              </button>

            </div>

          </fieldset>

        </form>

      )}

      {/* EXISTING BANNERS */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {initialBanners.length === 0 && (

          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 md:col-span-2">

            No banners found. Add a banner above.

          </div>

        )}

        {initialBanners.map((banner) => (

          <div
            key={banner.id}
            className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
          >

            {/* RESPONSIVE BANNER PREVIEW */}

            <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#f6f5f2] p-3">

              <BannerPreview
                key={banner.imageUrl}
                imageUrl={banner.imageUrl}
                title={banner.title}
              />

              <div className="absolute right-3 top-3 flex flex-wrap gap-2">

                <span
                  className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                    banner.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {banner.isActive
                    ? 'Active'
                    : 'Inactive'}
                </span>

                <span className="rounded bg-black/80 px-2 py-1 text-[10px] font-bold text-white">

                  Order: {banner.displayOrder}

                </span>

              </div>

            </div>

            {/* BANNER INFORMATION */}

            <div className="flex flex-1 flex-col p-5">

              <p className="text-[10px] font-bold uppercase tracking-wider text-[#977447]">

                {banner.eyebrow}

              </p>

              <h4 className="mt-2 break-words text-lg font-bold text-gray-900">

                {banner.title}

              </h4>

              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">

                {banner.description}

              </p>

              {banner.buttonLabel && (

                <p className="mt-3 text-xs text-gray-400">

                  Button:{' '}

                  <span className="font-medium text-gray-700">

                    {banner.buttonLabel}

                  </span>

                  {' → '}

                  {banner.buttonTarget}

                </p>

              )}

              {/* BANNER ACTIONS */}

              <div className="mt-auto pt-5">

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleToggleActive(
                        banner.id,
                        banner.isActive
                      )
                    }
                    className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-black disabled:opacity-50"
                  >

                    {banner.isActive ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}

                    {banner.isActive
                      ? 'Deactivate'
                      : 'Activate'}

                  </button>

                  <div className="flex items-center gap-3">

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        openEditForm(banner)
                      }
                      title="Edit banner"
                      aria-label="Edit banner"
                      className="rounded border border-gray-200 p-2 text-gray-600 hover:border-black hover:text-black disabled:opacity-50"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleDelete(banner.id)
                      }
                      title="Delete banner"
                      aria-label="Delete banner"
                      className="rounded border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}