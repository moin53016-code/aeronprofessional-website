
'use client';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
} from 'lucide-react';

import ProductImageInput from '@/components/admin/ProductImageInput';

interface Category {
  id: string;
  name: string;
  slug: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isVisible: boolean;
  isPublished: boolean;
}

interface CategoryForm {
  name: string;
  slug: string;
  label: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isVisible: boolean;
  isPublished: boolean;
}

interface Props {
  initialCategories: Category[];
}

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  label: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  isVisible: true,
  isPublished: true,
};

const inputClass =
  'w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black';

const labelClass =
  'mb-1.5 block text-xs font-bold text-gray-600';

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sortCategories(items: Category[]) {
  return [...items].sort(
    (a, b) =>
      a.displayOrder - b.displayOrder ||
      a.name.localeCompare(b.name)
  );
}

export default function CategoryList({
  initialCategories,
}: Props) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>(
    () => sortCategories(initialCategories)
  );

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState<CategoryForm>({
    ...emptyForm,
  });

  const [loading, setLoading] = useState(false);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setCategories(sortCategories(initialCategories));
  }, [initialCategories]);

  const updateForm = <K extends keyof CategoryForm>(
    key: K,
    value: CategoryForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const closeForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm({ ...emptyForm });
  };

  const openAdd = () => {
    closeForm();
    setShowAddForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setShowAddForm(false);

    setForm({
      name: category.name,
      slug: category.slug,
      label: category.label,
      description: category.description ?? '',
      imageUrl: category.imageUrl ?? '',
      displayOrder: category.displayOrder,
      isVisible: category.isVisible,
      isPublished: category.isPublished,
    });

    setError('');
    setSuccess('');
  };

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading || busyId) return;

    const name = form.name.trim();
    const label = form.label.trim() || name;
    const slug = makeSlug(form.slug || name);

    if (!name || !label || !slug) {
      setError('Name, label and slug are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = editingId
        ? `/api/admin/categories/${encodeURIComponent(editingId)}`
        : '/api/admin/categories';

      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          label,
          slug,
          description: form.description.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          displayOrder: form.displayOrder,
          isVisible: form.isVisible,
          isPublished: form.isPublished,
        }),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Failed to save category.'
        );
      }

      if (data.category) {
        const saved = data.category as Category;

        setCategories((previous) =>
          sortCategories([
            ...previous.filter((item) => item.id !== saved.id),
            saved,
          ])
        );
      }

      setSuccess(
        editingId
          ? 'Category updated successfully.'
          : 'Category created successfully.'
      );

      closeForm();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save category.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVisibility = async (category: Category) => {
    if (loading || busyId) return;

    setBusyId(category.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isVisible: !category.isVisible,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Failed to update visibility.'
        );
      }

      setCategories((previous) =>
        previous.map((item) =>
          item.id === category.id
            ? {
                ...item,
                isVisible:
                  data.category?.isVisible ??
                  !category.isVisible,
              }
            : item
        )
      );

      setSuccess('Visibility updated successfully.');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update visibility.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (category: Category) => {
    if (loading || busyId) return;

    const first = window.confirm(
      `DELETE CATEGORY?\n\n` +
      `Category: ${category.label}\n\n` +
      `This category will be permanently removed.\n` +
      `Products will NOT be deleted.\n\n` +
      `Continue?`
    );

    if (!first) return;

    const second = window.confirm(
      `FINAL CONFIRMATION\n\n` +
      `Permanently delete "${category.label}"?\n\n` +
      `Product-category connections will be removed.\n` +
      `The products themselves remain safe.\n\n` +
      `THIS ACTION CANNOT BE UNDONE.`
    );

    if (!second) return;

    setBusyId(category.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(category.id)}`,
        {
          method: 'DELETE',
          cache: 'no-store',
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success ||
        !data.deleted ||
        data.deletedProductCount !== 0
      ) {
        throw new Error(
          data.error ||
          'Safe category deletion could not be confirmed.'
        );
      }

      setCategories((previous) =>
        previous.filter((item) => item.id !== category.id)
      );

      if (editingId === category.id) {
        closeForm();
      }

      setSuccess(
        `"${category.label}" permanently deleted. Products preserved.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete category.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Manage categories, images and visibility.
        </p>

        <button
          type="button"
          disabled={loading || busyId !== null}
          onClick={() => showAddForm ? closeForm() : openAdd()}
          className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-3 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'CANCEL' : 'ADD CATEGORY'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {(showAddForm || editingId !== null) && (
        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3 border-b pb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>

            <button
              type="button"
              disabled={loading}
              onClick={closeForm}
              aria-label="Close category form"
              className="rounded-md p-2 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="cat-name" className={labelClass}>
                CATEGORY NAME *
              </label>

              <input
                id="cat-name"
                required
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;

                  setForm((previous) => ({
                    ...previous,
                    name,
                    label:
                      !previous.label ||
                      previous.label === previous.name
                        ? name
                        : previous.label,
                    slug:
                      !editingId &&
                      (!previous.slug ||
                        previous.slug === makeSlug(previous.name))
                        ? makeSlug(name)
                        : previous.slug,
                  }));
                }}
                placeholder="Hair Dryers"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cat-label" className={labelClass}>
                WEBSITE DISPLAY LABEL *
              </label>

              <input
                id="cat-label"
                required
                value={form.label}
                onChange={(event) =>
                  updateForm('label', event.target.value)
                }
                placeholder="Hair Dryers"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cat-slug" className={labelClass}>
                CATEGORY SLUG *
              </label>

              <input
                id="cat-slug"
                required
                value={form.slug}
                onChange={(event) =>
                  updateForm('slug', event.target.value)
                }
                placeholder="hair-dryers"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cat-order" className={labelClass}>
                DISPLAY ORDER
              </label>

              <input
                id="cat-order"
                type="number"
                step={1}
                value={form.displayOrder}
                onChange={(event) =>
                  updateForm(
                    'displayOrder',
                    Number(event.target.value) || 0
                  )
                }
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="cat-description" className={labelClass}>
                DESCRIPTION
              </label>

              <textarea
                id="cat-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                placeholder="Category description"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-5">
            <h3 className="text-sm font-bold">
              CATEGORY IMAGE
            </h3>

            <p className="text-xs text-gray-500">
              Recommended: 900 × 1125 px (4:5 portrait ratio).
            </p>

            <ProductImageInput
              key={editingId ?? 'new-category'}
              value={form.imageUrl}
              onChange={(url) => updateForm('imageUrl', url)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  updateForm('isVisible', event.target.checked)
                }
                className="h-4 w-4 accent-black"
              />
              <span className="text-sm">Visible on website</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  updateForm('isPublished', event.target.checked)
                }
                className="h-4 w-4 accent-black"
              />
              <span className="text-sm">Published</span>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={closeForm}
              className="rounded-md border px-5 py-3 text-xs font-bold"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={loading || busyId !== null}
              className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading
                ? 'SAVING...'
                : editingId
                  ? 'SAVE CHANGES'
                  : 'CREATE CATEGORY'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {categories.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No categories found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex min-w-0 flex-wrap items-center gap-4 p-4 hover:bg-gray-50 sm:p-5"
              >
                <div className="flex h-24 w-[77px] shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.label}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon
                      size={25}
                      className="text-gray-400"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold text-gray-900">
                    {category.label}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {category.name}
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-400">
                    {category.slug}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Display Order: {category.displayOrder}
                  </p>

                  <div className="mt-2">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold ${
                        category.isVisible && category.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {category.isVisible && category.isPublished
                        ? 'LIVE'
                        : 'HIDDEN'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || busyId !== null}
                    onClick={() => handleVisibility(category)}
                    title={
                      category.isVisible
                        ? 'Hide category'
                        : 'Show category'
                    }
                    aria-label={
                      category.isVisible
                        ? `Hide ${category.label}`
                        : `Show ${category.label}`
                    }
                    className="rounded-md border p-2.5 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {category.isVisible ? (
                      <Eye size={17} />
                    ) : (
                      <EyeOff size={17} />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loading || busyId !== null}
                    onClick={() => openEdit(category)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Pencil size={15} />
                    EDIT
                  </button>

                  <button
                    type="button"
                    disabled={loading || busyId !== null}
                    onClick={() => handleDelete(category)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busyId === category.id ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
